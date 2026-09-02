import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BIV_RUNTIME_AUTHORITY_MODES,
  executeBusinessIdeaValidationRuntime,
  resolveRuntimeDecisionAuthorityMode,
} from "./runtimeExecutionBoundary.js";
import { BIV_DECISION_AUTHORITY_SOURCES } from "./decisionAuthority.js";
import { FINDING_EFFECTS } from "./analyticalFindings.js";
import { SHADOW_DECISION_STATES } from "./decisionSynthesis.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";
import contentEn from "./content.en.js";
import contentAr from "./content.ar.js";

const serviceInput = {
  businessIdea: "Mobile AC repair and maintenance service for homes and small offices.",
  targetCustomer: "Homeowners and small offices",
  problem: "They need quick AC repair at their location.",
  monetization: "Customers pay per repair visit.",
};

const baseArgs = {
  rawInput: serviceInput,
  language: "en",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
};

const legacyDirect = executeBusinessIdeaValidation(baseArgs);
const defaultRuntime = executeBusinessIdeaValidationRuntime(baseArgs);
assert.deepEqual(withoutAuthority(defaultRuntime), legacyDirect, "default runtime must preserve legacy public output");
assert.equal(defaultRuntime.authority.mode, BIV_RUNTIME_AUTHORITY_MODES.LEGACY);
assert.equal(defaultRuntime.authority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(defaultRuntime.authority.fallbackUsed, false);

for (const env of [
  {},
  { VITE_BIV_DECISION_AUTHORITY: "" },
  { VITE_BIV_DECISION_AUTHORITY: "invalid" },
  { VITE_BIV_DECISION_AUTHORITY: "TRUE" },
  { VITE_BIV_DECISION_AUTHORITY: "v2_candidate" },
  { BIV_DECISION_AUTHORITY: "v2_candidate" },
]) {
  assert.equal(resolveRuntimeDecisionAuthorityMode({ env }), BIV_RUNTIME_AUTHORITY_MODES.LEGACY);
  const result = executeBusinessIdeaValidationRuntime({ ...baseArgs, env });
  assert.deepEqual(withoutAuthority(result), legacyDirect, `invalid mode ${JSON.stringify(env)} must preserve legacy output`);
  assert.equal(result.authority.mode, BIV_RUNTIME_AUTHORITY_MODES.LEGACY);
}

const explicitLegacy = executeBusinessIdeaValidationRuntime({
  ...baseArgs,
  authorityMode: BIV_RUNTIME_AUTHORITY_MODES.LEGACY,
});
assert.deepEqual(withoutAuthority(explicitLegacy), legacyDirect, "explicit legacy must preserve output");

const dualRun = executeBusinessIdeaValidationRuntime({
  ...baseArgs,
  env: { VITE_BIV_DECISION_AUTHORITY: "dual_run" },
});
assert.deepEqual(withoutAuthority(dualRun), legacyDirect, "dual run must preserve visible legacy output");
assert.equal(dualRun.authority.mode, BIV_RUNTIME_AUTHORITY_MODES.DUAL_RUN);
assert.equal(dualRun.authority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(dualRun.authority.v2State, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(Boolean(dualRun.authority.v2Confidence), true);
assert.equal(Boolean(dualRun.authority.primaryReasonFindingId), true);
assert.equal(dualRun.authority.fallbackUsed, false);

const failingV2Options = {};
Object.defineProperty(failingV2Options, "additionalFindings", {
  enumerable: true,
  get() {
    throw new Error("simulated V2 runtime failure");
  },
});
const failureIsolated = executeBusinessIdeaValidationRuntime({
  ...baseArgs,
  env: { VITE_BIV_DECISION_AUTHORITY: "dual_run" },
  v2Options: failingV2Options,
});
assert.deepEqual(withoutAuthority(failureIsolated), legacyDirect, "V2 failure must not affect legacy public output");
assert.equal(failureIsolated.authority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(failureIsolated.authority.fallbackUsed, true);
assert.equal(failureIsolated.authority.fallbackReason, "v2_execution_error");

const supportedCandidateDiagnostics = executeBusinessIdeaValidationRuntime({
  ...baseArgs,
  env: { VITE_BIV_DECISION_AUTHORITY: "dual_run" },
  v2Options: { additionalFindings: fullySupportedFindings() },
});
assert.deepEqual(supportedCandidateDiagnostics.report, legacyDirect.report, "report remains legacy-owned");
assert.deepEqual(supportedCandidateDiagnostics.score, legacyDirect.score, "score remains legacy-owned");
assert.deepEqual(supportedCandidateDiagnostics.recommendation, legacyDirect.recommendation, "recommendation remains legacy-owned");
assert.equal(supportedCandidateDiagnostics.authority.v2State, SHADOW_DECISION_STATES.PROCEED);

const realCases = [
  {
    id: "rental_warehouses",
    rawInput: {
      businessIdea: "Rental warehouses for small merchants that need flexible storage units.",
      targetCustomer: "Small merchants",
      problem: "They need flexible storage without long leases.",
      monetization: "Monthly warehouse rental.",
    },
  },
  {
    id: "technician_platform",
    rawInput: {
      businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
      targetCustomer: "Homeowners and technicians",
      problem: "Customers struggle to find trusted technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
  },
  {
    id: "packaging_store",
    rawInput: {
      businessIdea: "A packaging store that sells boxes and shipping supplies to small shops.",
      targetCustomer: "Small shop owners",
      problem: "They need reliable packaging supplies nearby.",
      monetization: "Sell packaging products with retail margin.",
    },
  },
  {
    id: "stainless_workshop",
    rawInput: {
      businessIdea: "A stainless restaurant equipment workshop that fabricates tables and shelves.",
      targetCustomer: "Restaurants and commercial kitchens",
      problem: "Restaurants need nearby suppliers for durable stainless equipment.",
      monetization: "Sell stainless equipment and charge installation fees.",
    },
  },
  {
    id: "ac_service",
    rawInput: serviceInput,
  },
  {
    id: "insufficient_short_idea",
    rawInput: {
      businessIdea: "I want to start something online.",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
  },
  {
    id: "proceed_fixture",
    rawInput: {
      businessIdea: "A local lunch subscription for office teams.",
      targetCustomer: "Office teams near the kitchen",
      problem: "Teams need reliable daily lunch delivery.",
      monetization: "Weekly prepaid meal subscription.",
    },
    v2Options: { additionalFindings: fullySupportedFindings() },
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
        adverseFinding("finding_runtime_provider_incentive_conflict", "revenue_model", "risk_exposure", "weakens", "material"),
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
        adverseFinding("finding_runtime_regulatory_blocker", "risk_sensitivity", "risk_exposure", "contradicts", "critical"),
      ],
    },
    expectedV2State: SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET,
  },
  {
    id: "ambiguous_fixture",
    rawInput: {
      businessIdea: "Packaging supplier.",
      targetCustomer: "Small retailers",
      problem: "They need packaging stock.",
      monetization: "Sell packaging products.",
    },
  },
];

for (const caseDef of realCases) {
  const legacy = executeBusinessIdeaValidation({ ...baseArgs, rawInput: caseDef.rawInput });
  const result = executeBusinessIdeaValidationRuntime({
    ...baseArgs,
    rawInput: caseDef.rawInput,
    env: { VITE_BIV_DECISION_AUTHORITY: "dual_run" },
    v2Options: caseDef.v2Options || {},
  });
  assert.deepEqual(withoutAuthority(result), legacy, `${caseDef.id}: dual-run public output remains legacy`);
  assert.equal(result.authority.mode, BIV_RUNTIME_AUTHORITY_MODES.DUAL_RUN, `${caseDef.id}: dual-run mode`);
  assert.equal(result.authority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY, `${caseDef.id}: dual-run authority`);
  assert.equal(Boolean(result.authority.disagreement), true, `${caseDef.id}: diagnostics include disagreement`);
  if (caseDef.expectedV2State) {
    assert.equal(result.authority.v2State, caseDef.expectedV2State, `${caseDef.id}: expected V2 state`);
  }
}

const arabicCase = {
  businessIdea: "خدمة صيانة مكيفات متنقلة للمنازل.",
  targetCustomer: "ملاك المنازل",
  problem: "تتعطل المكيفات وتحتاج إلى إصلاح.",
  monetization: "الدفع لكل زيارة.",
};
const arabicDualRun = executeBusinessIdeaValidationRuntime({
  rawInput: arabicCase,
  language: "ar",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentAr,
  env: { VITE_BIV_DECISION_AUTHORITY: "dual_run" },
});
assert.equal(arabicDualRun.authority.mode, BIV_RUNTIME_AUTHORITY_MODES.DUAL_RUN);
assert.equal(arabicDualRun.authority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(arabicDualRun.authority.v2State, dualRun.authority.v2State);

const appSource = readFileSync(new URL("../../../src/App.jsx", import.meta.url), "utf8");
const workflowSource = readFileSync(new URL("../../../.github/workflows/deploy.yml", import.meta.url), "utf8");
assert.equal(appSource.includes("VITE_BIV_GUIDED_DISCOVERY_CANDIDATE === 'true'"), true);
assert.equal(appSource.includes("VITE_BIV_DECISION_AUTHORITY"), false, "route candidate flag must not own decision authority");
assert.equal(workflowSource.includes("VITE_BIV_DECISION_AUTHORITY: ${{ vars.BIV_DECISION_AUTHORITY }}"), true);

console.log("BIV Runtime Execution Boundary tests: PASS");

function withoutAuthority(result = {}) {
  const { authority, ...publicResult } = result;
  return publicResult;
}

function fullySupportedFindings() {
  return [
    supportedFinding("finding_runtime_information_supported", "customer_stakeholders", "information_readiness"),
    supportedFinding("finding_runtime_opportunity_supported", "market_demand", "opportunity_attractiveness"),
    supportedFinding("finding_runtime_execution_supported", "operational_capacity", "execution_feasibility"),
    supportedFinding("finding_runtime_risk_supported", "risk_sensitivity", "risk_exposure"),
    supportedFinding("finding_runtime_evidence_supported", "implementation", "evidence_confidence"),
  ];
}

function supportedFinding(id, module, dimension) {
  return {
    id,
    module,
    dimension,
    claim: `${id} is supported by controlled runtime fixture evidence.`,
    reason: "The fixture supplies traceable support for this controlled runtime test.",
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
    claim: `${id} blocks or weakens the controlled runtime fixture model.`,
    reason: "The fixture supplies traceable adverse evidence for this controlled runtime test.",
    evidenceIds: [`external_evidence__${id}`],
    unknownIds: [],
    confidence: "high",
    severity,
    effect,
    whatWouldChangeIt: "Verified resolution of the adverse condition.",
    limitations: "Test fixture evidence only; not production authority.",
  };
}
