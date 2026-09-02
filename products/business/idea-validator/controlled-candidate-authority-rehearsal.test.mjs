import assert from "node:assert/strict";
import {
  BIV_DECISION_AUTHORITY_MODES,
  BIV_DECISION_AUTHORITY_SOURCES,
  BIV_DECISION_DISAGREEMENT_CATEGORIES,
  buildAnalyticalCoreV2Decision,
  executeBusinessIdeaValidationWithAuthority,
  selectBusinessIdeaDecisionAuthorityV1,
  validateDecisionAuthorityV1,
} from "./decisionAuthority.js";
import { FINDING_EFFECTS } from "./analyticalFindings.js";
import { SHADOW_DECISION_STATES } from "./decisionSynthesis.js";
import contentEn from "./content.en.js";

const cases = [
  {
    id: "rental_warehouses",
    rawInput: {
      businessIdea: "Rental warehouses for small merchants that need flexible storage units.",
      targetCustomer: "Small merchants",
      problem: "They need flexible storage without long leases.",
      monetization: "Monthly warehouse rental.",
    },
    expectedV2State: SHADOW_DECISION_STATES.TEST_FIRST,
  },
  {
    id: "technician_platform",
    rawInput: {
      businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
      targetCustomer: "Homeowners and technicians",
      problem: "Customers struggle to find trusted technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
    expectedV2State: SHADOW_DECISION_STATES.TEST_FIRST,
  },
  {
    id: "packaging_store",
    rawInput: {
      businessIdea: "A packaging store that sells boxes and shipping supplies to small shops.",
      targetCustomer: "Small shop owners",
      problem: "They need reliable packaging supplies nearby.",
      monetization: "Sell packaging products with retail margin.",
      competitiveAdvantage: "Better availability and faster service.",
    },
    expectedV2State: SHADOW_DECISION_STATES.TEST_FIRST,
    expectedFallbackReason: "v2_low_confidence_review_required",
  },
  {
    id: "stainless_workshop",
    rawInput: {
      businessIdea: "A stainless restaurant equipment workshop that fabricates tables and shelves.",
      targetCustomer: "Restaurants and commercial kitchens",
      problem: "Restaurants need nearby suppliers for durable stainless equipment.",
      monetization: "The workshop makes money by selling stainless equipment and charging installation fees.",
    },
    expectedV2State: SHADOW_DECISION_STATES.TEST_FIRST,
  },
  {
    id: "ac_service",
    rawInput: {
      businessIdea: "A service business that repairs air-conditioning units at customer locations.",
      targetCustomer: "Homeowners, tenants, and small businesses",
      problem: "Customers need fast repair when air-conditioning fails.",
      monetization: "Customers pay per repair visit or maintenance package.",
    },
    expectedV2State: SHADOW_DECISION_STATES.TEST_FIRST,
  },
  {
    id: "pet_isolation",
    rawInput: {
      businessIdea: "A PET plastic recycling plant that processes bottle waste into washed flakes.",
      targetCustomer: "Local plastic packaging manufacturers",
      problem: "Manufacturers need consistent recycled input material.",
      monetization: "Sell washed PET flakes to manufacturers.",
    },
    expectedV2State: SHADOW_DECISION_STATES.TEST_FIRST,
  },
  {
    id: "insufficient_short_idea",
    rawInput: {
      businessIdea: "I want to start something online.",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
    expectedV2State: SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION,
    expectedFallbackReason: "v2_low_confidence_review_required",
  },
  {
    id: "strong_proceed_fixture",
    rawInput: {
      businessIdea: "A local lunch subscription for office teams.",
      targetCustomer: "Office teams near the kitchen",
      problem: "Teams need reliable daily lunch delivery.",
      monetization: "Weekly prepaid meal subscription.",
    },
    v2Options: {
      additionalFindings: fullySupportedFindings(),
    },
    expectedV2State: SHADOW_DECISION_STATES.PROCEED,
  },
  {
    id: "revise_fixture",
    rawInput: {
      businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
      targetCustomer: "Homeowners and technicians",
      problem: "Customers need trusted technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
    v2Options: {
      additionalFindings: [
        adverseFinding("finding_marketplace_provider_incentive_conflict", "revenue_model", "risk_exposure", "weakens", "material"),
      ],
    },
    expectedV2State: SHADOW_DECISION_STATES.REVISE,
  },
  {
    id: "blocker_fixture",
    rawInput: {
      businessIdea: "A regulated delivery operation that requires a permit.",
      targetCustomer: "Local businesses",
      problem: "They need delivery support.",
      monetization: "Delivery service fees.",
    },
    v2Options: {
      additionalFindings: [
        adverseFinding("finding_regulatory_blocker_verified", "risk_sensitivity", "risk_exposure", "contradicts", "critical"),
      ],
    },
    expectedV2State: SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET,
  },
  {
    id: "low_confidence_ambiguous",
    rawInput: {
      businessIdea: "Packaging supplier.",
      targetCustomer: "Small retailers",
      problem: "They need packaging stock.",
      monetization: "Sell packaging products.",
    },
    expectedV2State: SHADOW_DECISION_STATES.TEST_FIRST,
    expectedFallbackReason: "v2_low_confidence_review_required",
  },
  {
    id: "existing_business_expansion",
    rawInput: {
      businessIdea: "Existing metal workshop adding a new stainless display shelf product line.",
      targetCustomer: "Restaurant and cafe operators",
      problem: "Existing customers request custom stainless display shelves.",
      monetization: "Sell made-to-order shelves with deposit before fabrication.",
      stage: "expanding",
    },
    expectedV2State: SHADOW_DECISION_STATES.TEST_FIRST,
    expectedFallbackReason: "v2_low_confidence_review_required",
  },
];

const rehearsalRows = [];

for (const caseDef of cases) {
  const legacy = runAuthority(caseDef, BIV_DECISION_AUTHORITY_MODES.LEGACY);
  const dualRun = runAuthority(caseDef, BIV_DECISION_AUTHORITY_MODES.DUAL_RUN);
  const candidate = runAuthority(caseDef, BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE);
  const rollback = runAuthority(caseDef, BIV_DECISION_AUTHORITY_MODES.LEGACY);

  rehearsalRows.push(toRehearsalRow(caseDef.id, "legacy", legacy));
  rehearsalRows.push(toRehearsalRow(caseDef.id, "dual_run", dualRun));
  rehearsalRows.push(toRehearsalRow(caseDef.id, "v2_candidate", candidate));

  assert.equal(validateDecisionAuthorityV1(legacy).ok, true, `${caseDef.id}: legacy contract`);
  assert.equal(validateDecisionAuthorityV1(dualRun).ok, true, `${caseDef.id}: dual_run contract`);
  assert.equal(validateDecisionAuthorityV1(candidate).ok, true, `${caseDef.id}: v2_candidate contract`);
  assert.equal(validateDecisionAuthorityV1(rollback).ok, true, `${caseDef.id}: rollback contract`);

  assert.equal(legacy.mode, BIV_DECISION_AUTHORITY_MODES.LEGACY, `${caseDef.id}: legacy mode`);
  assert.equal(legacy.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY, `${caseDef.id}: legacy source`);
  assert.equal(legacy.v2Decision, undefined, `${caseDef.id}: legacy does not run V2`);

  assert.equal(dualRun.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY, `${caseDef.id}: dual run keeps legacy authoritative`);
  assert.equal(dualRun.v2Decision?.state, caseDef.expectedV2State, `${caseDef.id}: dual run V2 state`);
  assert.equal(dualRun.authoritativeDecision, dualRun.legacyDecision, `${caseDef.id}: dual run public output`);

  assert.equal(candidate.v2Decision?.state, caseDef.expectedV2State, `${caseDef.id}: candidate V2 state`);
  assert.equal(candidate.legacyDecision.report, legacy.legacyDecision.report, `${caseDef.id}: report remains legacy-owned`);
  assert.equal(candidate.legacyDecision.score, legacy.legacyDecision.score, `${caseDef.id}: score remains legacy-owned`);
  assert.equal(candidate.legacyDecision.recommendation, legacy.legacyDecision.recommendation, `${caseDef.id}: recommendation remains legacy-owned`);

  if (caseDef.expectedFallbackReason) {
    assert.equal(candidate.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY, `${caseDef.id}: unsafe V2 falls back`);
    assert.equal(candidate.fallbackReason, caseDef.expectedFallbackReason, `${caseDef.id}: fallback reason`);
  } else {
    assert.equal(candidate.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.V2, `${caseDef.id}: safe V2 candidate source`);
    assert.equal(candidate.fallbackUsed, false, `${caseDef.id}: safe candidate no fallback`);
  }

  assert.deepEqual(rollback.authoritativeDecision, legacy.authoritativeDecision, `${caseDef.id}: rollback restores legacy exactly`);
  assert.equal(rollback.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY, `${caseDef.id}: rollback source`);
  assert.equal(rollback.v2Decision, undefined, `${caseDef.id}: rollback does not retain V2`);
}

const validCandidate = buildAnalyticalCoreV2Decision({
  rawInput: cases.find((caseDef) => caseDef.id === "strong_proceed_fixture").rawInput,
  language: "en",
  additionalFindings: fullySupportedFindings(),
});
assert.equal(validCandidate.shadowDecision.state, SHADOW_DECISION_STATES.PROCEED);
const invalidContractFallback = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE,
  legacyDecision: runAuthority(cases[0], BIV_DECISION_AUTHORITY_MODES.LEGACY).legacyDecision,
  v2Result: { shadowDecision: { state: SHADOW_DECISION_STATES.PROCEED } },
});
assert.equal(invalidContractFallback.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(invalidContractFallback.fallbackUsed, true);
assert.equal(invalidContractFallback.fallbackReason, "v2_lens_contract_invalid");

const unsupportedStateFallback = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE,
  legacyDecision: runAuthority(cases[0], BIV_DECISION_AUTHORITY_MODES.LEGACY).legacyDecision,
  v2Result: { ...validCandidate, shadowDecision: { ...validCandidate.shadowDecision, state: "unsupported_state" } },
});
assert.equal(unsupportedStateFallback.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(unsupportedStateFallback.fallbackReason, "v2_unsupported_state");

const thrownV2Fallback = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE,
  legacyDecision: runAuthority(cases[0], BIV_DECISION_AUTHORITY_MODES.LEGACY).legacyDecision,
  v2Error: new Error("simulated V2 failure"),
});
assert.equal(thrownV2Fallback.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(thrownV2Fallback.fallbackReason, "v2_error");

const explicitFallback = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE,
  legacyDecision: runAuthority(cases[0], BIV_DECISION_AUTHORITY_MODES.LEGACY).legacyDecision,
  v2Result: validCandidate,
  fallbackRequested: true,
});
assert.equal(explicitFallback.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(explicitFallback.fallbackReason, "explicit_fallback_requested");

const arabicService = rehearseLanguagePair({
  en: {
    businessIdea: "Mobile AC repair service for homes.",
    targetCustomer: "Homeowners",
    problem: "AC units break and need repair.",
    monetization: "Pay per visit.",
  },
  ar: {
    businessIdea: "خدمة صيانة مكيفات متنقلة للمنازل.",
    targetCustomer: "ملاك المنازل",
    problem: "تتعطل المكيفات وتحتاج إلى إصلاح.",
    monetization: "الدفع لكل زيارة.",
  },
});
assert.equal(arabicService.en.dualRun.v2Decision.state, arabicService.ar.dualRun.v2Decision.state);
assert.equal(arabicService.en.candidate.authoritativeSource, arabicService.ar.candidate.authoritativeSource);

const ambiguousLanguage = rehearseLanguagePair({
  en: {
    businessIdea: "Packaging supplier.",
    targetCustomer: "Small retailers",
    problem: "They need packaging stock.",
    monetization: "Sell packaging products.",
  },
  ar: {
    businessIdea: "مورد مواد تغليف.",
    targetCustomer: "المتاجر الصغيرة",
    problem: "تحتاج إلى مواد تغليف.",
    monetization: "بيع منتجات التغليف.",
  },
});
assert.equal(ambiguousLanguage.en.candidate.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(ambiguousLanguage.ar.candidate.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(ambiguousLanguage.en.candidate.fallbackReason, "v2_low_confidence_review_required");
assert.equal(ambiguousLanguage.ar.candidate.fallbackReason, "v2_low_confidence_review_required");

assert.equal(rehearsalRows.some((row) => row.Disagreement === BIV_DECISION_DISAGREEMENT_CATEGORIES.SAME_DIRECTION), true);
assert.equal(rehearsalRows.some((row) => row.Disagreement === BIV_DECISION_DISAGREEMENT_CATEGORIES.V2_MORE_CONSERVATIVE), true);
assert.equal(rehearsalRows.some((row) => row.Disagreement === BIV_DECISION_DISAGREEMENT_CATEGORIES.V2_MORE_POSITIVE), true);
assert.equal(rehearsalRows.some((row) => row.Disagreement === BIV_DECISION_DISAGREEMENT_CATEGORIES.FALLBACK_USED), true);
assert.equal(rehearsalRows.every((row) => row.Safe === true), true);

console.log(JSON.stringify(rehearsalRows, null, 2));
console.log("Controlled Candidate Authority Rehearsal tests: PASS");

function runAuthority(caseDef, mode, language = "en") {
  return executeBusinessIdeaValidationWithAuthority({
    rawInput: caseDef.rawInput,
    language,
    feasibilityAnswers: { classificationConfirmation: "confirm" },
    content: contentEn,
    authorityMode: mode,
    v2Options: caseDef.v2Options || {},
  });
}

function rehearseLanguagePair({ en, ar }) {
  const enCase = { id: "en_pair", rawInput: en };
  const arCase = { id: "ar_pair", rawInput: ar };
  return {
    en: {
      dualRun: runAuthority(enCase, BIV_DECISION_AUTHORITY_MODES.DUAL_RUN, "en"),
      candidate: runAuthority(enCase, BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE, "en"),
    },
    ar: {
      dualRun: runAuthority(arCase, BIV_DECISION_AUTHORITY_MODES.DUAL_RUN, "ar"),
      candidate: runAuthority(arCase, BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE, "ar"),
    },
  };
}

function toRehearsalRow(caseId, mode, result) {
  return {
    Case: caseId,
    Mode: mode,
    Authority: result.authoritativeSource,
    Legacy: result.diagnostics.legacyVerdict || result.diagnostics.legacyStatus,
    V2: result.diagnostics.v2State || "",
    Confidence: result.diagnostics.v2Confidence || "",
    PrimaryReason: result.diagnostics.primaryReasonFindingId || "",
    Disagreement: result.diagnostics.disagreementCategory,
    Fallback: result.fallbackUsed ? result.fallbackReason : "not_used",
    Safe: result.authoritativeSource === BIV_DECISION_AUTHORITY_SOURCES.LEGACY || result.v2Decision?.authority?.shadowOnly === true,
  };
}

function fullySupportedFindings() {
  return [
    supportedFinding("finding_test_information_supported", "customer_stakeholders", "information_readiness"),
    supportedFinding("finding_test_opportunity_supported", "market_demand", "opportunity_attractiveness"),
    supportedFinding("finding_test_execution_supported", "operational_capacity", "execution_feasibility"),
    supportedFinding("finding_test_risk_supported", "risk_sensitivity", "risk_exposure"),
    supportedFinding("finding_test_evidence_supported", "implementation", "evidence_confidence"),
  ];
}

function supportedFinding(id, module, dimension) {
  return {
    id,
    module,
    dimension,
    claim: `${id} is supported by controlled fixture evidence.`,
    reason: "The fixture supplies traceable support for this controlled rehearsal test.",
    evidenceIds: [`external_evidence__${id}`],
    unknownIds: [],
    confidence: "high",
    severity: "material",
    effect: FINDING_EFFECTS.SUPPORTS,
    whatWouldChangeIt: "Contradictory evidence would downgrade the decision.",
    limitations: "Test fixture evidence only; not production authority.",
  };
}

function adverseFinding(id, module, dimension, effect, severity) {
  return {
    id,
    module,
    dimension,
    claim: `${id} blocks or weakens the controlled fixture model.`,
    reason: "The fixture supplies traceable adverse evidence for this controlled rehearsal test.",
    evidenceIds: [`external_evidence__${id}`],
    unknownIds: [],
    confidence: "high",
    severity,
    effect,
    whatWouldChangeIt: "Verified resolution of the adverse condition.",
    limitations: "Test fixture evidence only; not production authority.",
  };
}
