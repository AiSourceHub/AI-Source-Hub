import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEvidenceLedgerV1 } from "./evidenceLedger.js";
import { selectBusinessModelLensV1, BUSINESS_MODEL_LENSES } from "./businessModelLenses.js";
import { buildAnalyticalPlanV1 } from "./analyticalPlan.js";
import { buildStructuredFindingsV1 } from "./analyticalFindings.js";
import {
  BIV_DECISION_SYNTHESIS_VERSION,
  SHADOW_DECISION_STATES,
  compareLegacyDecision,
  synthesizeDecisionV1,
  validateDecisionSynthesisV1,
} from "./decisionSynthesis.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";
import contentEn from "./content.en.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const benchmarks = {
  rentalWarehouses: {
    rawInput: {
      businessIdea: "Rental warehouses for small merchants that need flexible storage units.",
      targetCustomer: "Small merchants",
      problem: "They need flexible storage without long leases.",
      monetization: "Monthly warehouse rental.",
    },
    expectedLens: BUSINESS_MODEL_LENSES.REAL_ESTATE,
    expectedPrimary: "finding_real_estate_occupancy_utilization_readiness",
    expectedSupport: [
      "finding_real_estate_location_dependency",
      "finding_real_estate_revenue_economic_readiness",
      "finding_real_estate_capital_site_commitment",
    ],
    expectedAction: /occupancy|location|site economics/i,
  },
  technicianPlatform: {
    rawInput: {
      businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
      targetCustomer: "Homeowners and technicians",
      problem: "Customers struggle to find trusted technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
    expectedLens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
    expectedPrimary: "finding_marketplace_supply_side_readiness",
    expectedSupport: [
      "finding_marketplace_demand_side_readiness",
      "finding_marketplace_liquidity_dependency",
      "finding_marketplace_monetization_participation_separation",
    ],
    expectedAction: /customer demand and provider participation/i,
  },
  packagingStore: {
    rawInput: {
      businessIdea: "A packaging store that sells boxes and shipping supplies to small shops.",
      targetCustomer: "Small shop owners",
      problem: "They need reliable packaging supplies nearby.",
      monetization: "Sell packaging products with retail margin.",
      competitiveAdvantage: "Better availability and faster service.",
    },
    expectedLens: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
    expectedPrimary: "finding_retail_repeat_purchase_readiness",
    expectedSupport: [
      "finding_retail_supplier_inventory_dependency",
      "finding_retail_differentiation_evidence",
      "finding_retail_working_capital_dependency",
    ],
    expectedAction: /repeat purchasing|supplier terms|margin/i,
  },
  stainlessWorkshop: {
    rawInput: {
      businessIdea: "A stainless manufacturing workshop that fabricates tables for restaurants.",
      targetCustomer: "Restaurants",
      problem: "They need custom stainless equipment.",
      monetization: "Sell fabricated equipment and installation.",
    },
    expectedLens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
    expectedPrimary: "finding_manufacturing_equipment_capacity_readiness",
    expectedSupport: [
      "finding_manufacturing_skilled_labor_dependency",
      "finding_manufacturing_production_capacity_unknown",
      "finding_manufacturing_b2b_procurement_order_evidence",
    ],
    expectedAction: /equipment\/capacity|buyer procurement/i,
  },
};

const benchmarkDecisions = {};

for (const [name, benchmark] of Object.entries(benchmarks)) {
  const { evidenceLedger, lensSelection, structuredFindings } = buildAnalyticalCase(benchmark.rawInput);
  const decision = synthesizeDecisionV1({
    structuredFindings,
    evidenceLedger,
    lensSelection,
    legacyVerdict: "good",
  });
  assert.equal(lensSelection.primaryLens, benchmark.expectedLens, name);
  assert.equal(decision.version, BIV_DECISION_SYNTHESIS_VERSION, name);
  assert.equal(validateDecisionSynthesisV1(decision).ok, true, name);
  assert.equal(decision.state, SHADOW_DECISION_STATES.TEST_FIRST, name);
  assert.equal(decision.primaryReasonFindingId, benchmark.expectedPrimary, name);
  for (const id of benchmark.expectedSupport) {
    assert.equal(decision.supportingFindingIds.includes(id), true, `${name} should support with ${id}`);
  }
  assert.match(decision.nextDecisionAction, benchmark.expectedAction, name);
  assert.equal(decision.authority.shadowOnly, true, name);
  assert.equal(decision.authority.determinesProductionVerdict, false, name);
  assert.equal(decision.authority.affectsScore, false, name);
  assert.equal(decision.authority.affectsReport, false, name);
  assert.equal(decision.authority.changesRuntimeBehavior, false, name);
  assert.equal(Boolean(decision.comparisonToLegacy), true, name);
  benchmarkDecisions[name] = decision;
}

assert.notDeepEqual(decisionSignature(benchmarkDecisions.rentalWarehouses), decisionSignature(benchmarkDecisions.technicianPlatform));
assert.notDeepEqual(decisionSignature(benchmarkDecisions.technicianPlatform), decisionSignature(benchmarkDecisions.packagingStore));
assert.notDeepEqual(decisionSignature(benchmarkDecisions.packagingStore), decisionSignature(benchmarkDecisions.stainlessWorkshop));

const missingCore = buildAnalyticalCase({ businessIdea: "A short business idea." });
const missingDecision = synthesizeDecisionV1(missingCore);
assert.equal(missingDecision.state, SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION);
assert.equal(missingDecision.criticalUnknownIds.length >= 2, true);
assert.match(missingDecision.whatWouldChangeDecision, /Clear owner inputs|target customer/i);

const clearUnvalidated = buildAnalyticalCase({
  businessIdea: "A mobile AC repair service for homeowners.",
  targetCustomer: "Homeowners",
  problem: "They need fast repair when AC breaks.",
  monetization: "Customers pay per repair visit.",
});
const clearUnvalidatedDecision = synthesizeDecisionV1(clearUnvalidated);
assert.equal(clearUnvalidatedDecision.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.match(clearUnvalidatedDecision.nextDecisionAction, /test/i);

const reviseDecision = synthesizeDecisionV1(buildSyntheticCase([
  supportedFinding("finding_customer_supported", "customer_stakeholders", "information_readiness"),
  supportedFinding("finding_problem_supported", "market_demand", "opportunity_attractiveness"),
  supportedFinding("finding_revenue_supported", "revenue_model", "evidence_confidence"),
  finding({
    id: "finding_marketplace_provider_incentive_conflict",
    module: "revenue_model",
    dimension: "risk_exposure",
    claim: "Provider economics conflict with the planned commission model.",
    reason: "Verified provider feedback shows providers would lose money at the planned commission.",
    effect: "weakens",
    severity: "material",
    confidence: "high",
    evidenceIds: ["external_evidence__provider_feedback"],
    whatWouldChangeIt: "A revised commission model that providers accept while preserving customer value.",
    limitations: "This is a structural model issue, not simple missing information.",
  }),
]));
assert.equal(reviseDecision.state, SHADOW_DECISION_STATES.REVISE);
assert.equal(reviseDecision.primaryReasonFindingId, "finding_marketplace_provider_incentive_conflict");
assert.match(reviseDecision.whatWouldChangeDecision, /revised model/i);

const doNotProceedDecision = synthesizeDecisionV1(buildSyntheticCase([
  supportedFinding("finding_customer_supported", "customer_stakeholders", "information_readiness"),
  finding({
    id: "finding_regulatory_blocker_verified",
    module: "risk_sensitivity",
    dimension: "risk_exposure",
    claim: "A verified regulatory blocker prevents the proposed operating path.",
    reason: "The supplied evidence states the required license cannot be obtained for this activity.",
    effect: "contradicts",
    severity: "critical",
    confidence: "high",
    evidenceIds: ["external_evidence__regulatory_blocker"],
    whatWouldChangeIt: "Verified resolution of the regulatory blocker or a materially different compliant operating path.",
    limitations: "The blocker is tied to the current path only.",
  }),
]));
assert.equal(doNotProceedDecision.state, SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET);
assert.deepEqual(doNotProceedDecision.blockerFindingIds, ["finding_regulatory_blocker_verified"]);

const proceedDecision = synthesizeDecisionV1(buildSyntheticCase([
  supportedFinding("finding_customer_paid_signal", "customer_stakeholders", "information_readiness", "external_evidence__paid_customers"),
  supportedFinding("finding_demand_supported", "market_demand", "opportunity_attractiveness", "external_evidence__repeat_purchases"),
  supportedFinding("finding_execution_supported", "operational_capacity", "execution_feasibility", "external_evidence__pilot_capacity"),
  supportedFinding("finding_risk_controlled", "risk_sensitivity", "risk_exposure", "external_evidence__supplier_terms"),
  supportedFinding("finding_evidence_quality_supported", "implementation", "evidence_confidence", "external_evidence__verified_records"),
]));
assert.equal(proceedDecision.state, SHADOW_DECISION_STATES.PROCEED);
assert.equal(proceedDecision.confidence, "high");
assert.match(proceedDecision.nextDecisionAction, /next staged commitment/i);

const lowConfidenceTest = synthesizeDecisionV1(buildSyntheticCase([
  supportedFinding("finding_customer_supported", "customer_stakeholders", "information_readiness", "owner_data__customer"),
  finding({
    id: "finding_demand_test_needed",
    module: "market_demand",
    dimension: "opportunity_attractiveness",
    claim: "Demand is plausible but not behaviorally evidenced.",
    reason: "Only owner data is available.",
    effect: "unknown",
    severity: "material",
    confidence: "low",
    evidenceIds: ["owner_data__problem"],
    whatWouldChangeIt: "Customer behavior evidence.",
    limitations: "This is not demand proof.",
  }),
]));
const highConfidenceTest = synthesizeDecisionV1(buildSyntheticCase([
  supportedFinding("finding_customer_supported", "customer_stakeholders", "information_readiness", "external_evidence__customer_segment"),
  finding({
    id: "finding_demand_test_needed",
    module: "market_demand",
    dimension: "opportunity_attractiveness",
    claim: "Demand has some evidence but still needs a staged test.",
    reason: "Initial external evidence exists.",
    effect: "unknown",
    severity: "material",
    confidence: "medium",
    evidenceIds: ["external_evidence__interviews"],
    whatWouldChangeIt: "Paid test evidence.",
    limitations: "Interviews are not paid behavior.",
  }),
]));
assert.equal(lowConfidenceTest.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(highConfidenceTest.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(lowConfidenceTest.confidence, "medium");
assert.equal(highConfidenceTest.confidence, "medium");

const oldScoreLeakBase = buildSyntheticCase([
  supportedFinding("finding_customer_supported", "customer_stakeholders", "information_readiness", "external_evidence__customer"),
  finding({
    id: "finding_assumption_to_test",
    module: "market_demand",
    dimension: "opportunity_attractiveness",
    claim: "A material demand assumption remains.",
    reason: "Demand evidence is not yet commercial.",
    effect: "unknown",
    severity: "material",
    confidence: "medium",
    evidenceIds: ["external_evidence__interviews"],
    whatWouldChangeIt: "Paid test evidence.",
    limitations: "Useful evidence but not payment proof.",
  }),
]);
const oldScoreHigh = synthesizeDecisionV1({ ...oldScoreLeakBase, legacyVerdict: "good", legacyScore: 90 });
const oldScoreLow = synthesizeDecisionV1({ ...oldScoreLeakBase, legacyVerdict: "weak", legacyScore: 10 });
assert.equal(oldScoreHigh.state, oldScoreLow.state);
assert.equal(oldScoreHigh.primaryReasonFindingId, oldScoreLow.primaryReasonFindingId);
assert.deepEqual(oldScoreHigh.supportingFindingIds, oldScoreLow.supportingFindingIds);

const wordingA = buildSyntheticCase([
  finding({
    id: "finding_same_assumption",
    module: "market_demand",
    dimension: "opportunity_attractiveness",
    claim: "Customers may need this.",
    reason: "Evidence is not yet commercial.",
    effect: "unknown",
    severity: "material",
    confidence: "medium",
    evidenceIds: ["external_evidence__interviews"],
    whatWouldChangeIt: "Paid behavior.",
    limitations: "Interview evidence is limited.",
  }),
]);
const wordingB = buildSyntheticCase([
  finding({
    id: "finding_same_assumption",
    module: "market_demand",
    dimension: "opportunity_attractiveness",
    claim: "The phrasing changed, but the structured evidence did not.",
    reason: "Evidence is not yet commercial.",
    effect: "unknown",
    severity: "material",
    confidence: "medium",
    evidenceIds: ["external_evidence__interviews"],
    whatWouldChangeIt: "Paid behavior.",
    limitations: "Interview evidence is limited.",
  }),
]);
assert.equal(synthesizeDecisionV1(wordingA).state, synthesizeDecisionV1(wordingB).state);
assert.equal(synthesizeDecisionV1(wordingA).primaryReasonFindingId, synthesizeDecisionV1(wordingB).primaryReasonFindingId);

const comparison = compareLegacyDecision({ legacyVerdict: "good", shadowDecisionState: SHADOW_DECISION_STATES.TEST_FIRST });
assert.equal(comparison.legacyVerdict, "good");
assert.equal(comparison.shadowDecision, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(comparison.agreesAtHighLevel, false);

const runtimeInput = {
  businessIdea: "A mobile AC repair service for homeowners.",
  targetCustomer: "Homeowners",
  problem: "They need fast repair when AC fails.",
  monetization: "Customers pay per repair visit.",
};
const before = executeBusinessIdeaValidation({
  rawInput: runtimeInput,
  language: "en",
  source: "guided_discovery",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
});
synthesizeDecisionV1(buildAnalyticalCase(runtimeInput));
const after = executeBusinessIdeaValidation({
  rawInput: runtimeInput,
  language: "en",
  source: "guided_discovery",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
});
assert.equal(after.route, before.route);
assert.equal(after.journeyState, before.journeyState);
assert.deepEqual(after.score, before.score);
assert.equal(after.verdictKey, before.verdictKey);
assert.deepEqual(after.recommendation, before.recommendation);
assert.deepEqual(after.report.sections, before.report.sections);

const runtimeFiles = [
  "executionResult.js",
  "validatorOrchestrator.js",
  "guidedDiscoveryBivAdapter.js",
  "guidedDiscoveryHandoffMapper.js",
  "guidedDiscoverySufficiencyBridge.js",
  "intentDiscoveryPrototype.js",
  "report.js",
  "recommendations.js",
  "scoring.js",
  "../../../src/pages/BusinessIdeaDiscoveryPrototypePage.jsx",
  "../../../src/pages/BusinessIdeaValidatorPage.jsx",
  "../../../src/pages/BusinessIdeaValidatorRoute.jsx",
];
for (const filePath of runtimeFiles) {
  const source = readFileSync(join(__dirname, filePath), "utf8");
  assert.equal(source.includes("decisionSynthesis"), false, `${filePath} should not consume Decision Synthesis V1 at runtime`);
  assert.equal(source.includes("shadowDecisionV1"), false, `${filePath} should not expose shadow decision at runtime`);
}

console.log("Decision Synthesis V1 tests: PASS");

function buildAnalyticalCase(rawInput) {
  const evidenceLedger = buildEvidenceLedgerV1({ rawInput });
  const lensSelection = selectBusinessModelLensV1({ rawInput });
  const analyticalPlan = buildAnalyticalPlanV1({ lensSelection, evidenceLedger });
  const structuredFindings = buildStructuredFindingsV1({ evidenceLedger, lensSelection, analyticalPlan });
  return { structuredFindings, evidenceLedger, lensSelection };
}

function buildSyntheticCase(findings, unknowns = []) {
  return {
    structuredFindings: {
      version: "biv_structured_findings_v1",
      findings,
    },
    evidenceLedger: {
      version: "biv_evidence_ledger_v1",
      items: [],
      unknowns,
    },
    lensSelection: {
      version: "biv_business_model_lens_v1",
      primaryLens: BUSINESS_MODEL_LENSES.GENERIC,
    },
  };
}

function supportedFinding(id, module, dimension, evidenceId = "external_evidence__support") {
  return finding({
    id,
    module,
    dimension,
    claim: "This dimension has stage-appropriate supporting evidence.",
    reason: "The supplied evidence supports the current stage without guaranteeing success.",
    effect: "supports",
    severity: "informational",
    confidence: "high",
    evidenceIds: [evidenceId],
    whatWouldChangeIt: "Contradictory evidence or a newly discovered blocker.",
    limitations: "Proceed means next stage only, not guaranteed success.",
  });
}

function finding({
  id,
  module,
  dimension,
  claim,
  reason,
  effect,
  severity,
  confidence,
  evidenceIds = [],
  unknownIds = [],
  whatWouldChangeIt,
  limitations,
}) {
  return {
    id,
    module,
    dimension,
    claim,
    reason,
    evidenceIds,
    unknownIds,
    confidence,
    severity,
    effect,
    whatWouldChangeIt,
    limitations,
  };
}

function decisionSignature(decision) {
  return [
    decision.state,
    decision.primaryReasonFindingId,
    ...decision.supportingFindingIds.slice(0, 4),
    decision.nextDecisionAction,
  ];
}
