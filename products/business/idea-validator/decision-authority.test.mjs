import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BIV_DECISION_AUTHORITY_MODES,
  BIV_DECISION_AUTHORITY_SOURCES,
  BIV_DECISION_DISAGREEMENT_CATEGORIES,
  buildAnalyticalCoreV2Decision,
  executeBusinessIdeaValidationWithAuthority,
  resolveDecisionAuthorityMode,
  resolveDecisionAuthorityModeFromEnv,
  selectBusinessIdeaDecisionAuthorityV1,
  validateDecisionAuthorityV1,
} from "./decisionAuthority.js";
import { SHADOW_DECISION_STATES } from "./decisionSynthesis.js";
import { FINDING_EFFECTS } from "./analyticalFindings.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";
import contentEn from "./content.en.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceInput = {
  businessIdea: "Mobile AC repair and maintenance service for homes and small offices.",
  targetCustomer: "Homeowners and small offices",
  problem: "They need quick AC repair at their location.",
  monetization: "Customers pay per repair visit.",
};

const legacyDirect = executeBusinessIdeaValidation({
  rawInput: serviceInput,
  language: "en",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
});

assert.equal(resolveDecisionAuthorityMode(), BIV_DECISION_AUTHORITY_MODES.LEGACY);
assert.equal(resolveDecisionAuthorityMode(""), BIV_DECISION_AUTHORITY_MODES.LEGACY);
assert.equal(resolveDecisionAuthorityMode("invalid"), BIV_DECISION_AUTHORITY_MODES.LEGACY);
assert.equal(resolveDecisionAuthorityMode("v2"), BIV_DECISION_AUTHORITY_MODES.LEGACY);
assert.equal(resolveDecisionAuthorityMode(BIV_DECISION_AUTHORITY_MODES.DUAL_RUN), BIV_DECISION_AUTHORITY_MODES.DUAL_RUN);
assert.equal(resolveDecisionAuthorityModeFromEnv({}), BIV_DECISION_AUTHORITY_MODES.LEGACY);
assert.equal(resolveDecisionAuthorityModeFromEnv({ BIV_DECISION_AUTHORITY: "v2_candidate" }), BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE);

const defaultAuthority = executeBusinessIdeaValidationWithAuthority({
  rawInput: serviceInput,
  language: "en",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
});
assert.equal(validateDecisionAuthorityV1(defaultAuthority).ok, true);
assert.equal(defaultAuthority.mode, BIV_DECISION_AUTHORITY_MODES.LEGACY);
assert.equal(defaultAuthority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(defaultAuthority.fallbackUsed, false);
assert.equal(defaultAuthority.v2Decision, undefined);
assert.deepEqual(defaultAuthority.legacyDecision, legacyDirect);
assert.equal(defaultAuthority.authoritativeDecision.report, legacyDirect.report);
assert.equal(defaultAuthority.authoritativeDecision.score, legacyDirect.score);
assert.equal(defaultAuthority.authoritativeDecision.recommendation, legacyDirect.recommendation);
assert.equal(defaultAuthority.authoritativeDecision.verdictKey, legacyDirect.verdictKey);
assert.equal(defaultAuthority.authoritativeDecision.route, legacyDirect.route);

const invalidEnvAuthority = executeBusinessIdeaValidationWithAuthority({
  rawInput: serviceInput,
  language: "en",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
  env: { BIV_DECISION_AUTHORITY: "TRUE" },
});
assert.equal(invalidEnvAuthority.mode, BIV_DECISION_AUTHORITY_MODES.LEGACY);
assert.equal(invalidEnvAuthority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);

const dualRun = executeBusinessIdeaValidationWithAuthority({
  rawInput: serviceInput,
  language: "en",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
  authorityMode: BIV_DECISION_AUTHORITY_MODES.DUAL_RUN,
});
assert.equal(validateDecisionAuthorityV1(dualRun).ok, true);
assert.equal(dualRun.mode, BIV_DECISION_AUTHORITY_MODES.DUAL_RUN);
assert.equal(dualRun.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(Boolean(dualRun.v2Decision), true);
assert.equal(dualRun.v2Decision.authority.shadowOnly, true);
assert.equal(dualRun.v2Decision.authority.determinesProductionVerdict, false);
assert.equal(dualRun.diagnostics.v2State, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(dualRun.fallbackUsed, false);
assert.equal(dualRun.authoritativeDecision.report, legacyDirect.report);

const dualRunWithV2Blocker = executeBusinessIdeaValidationWithAuthority({
  rawInput: serviceInput,
  language: "en",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
  authorityMode: BIV_DECISION_AUTHORITY_MODES.DUAL_RUN,
  v2Options: {
    additionalFindings: [
      adverseFinding("finding_test_regulatory_blocker", "risk_sensitivity", "risk_exposure", "contradicts", "critical"),
    ],
  },
});
assert.equal(dualRunWithV2Blocker.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(dualRunWithV2Blocker.v2Decision.state, SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET);
assert.equal(dualRunWithV2Blocker.disagreement.category, BIV_DECISION_DISAGREEMENT_CATEGORIES.V2_MORE_CONSERVATIVE);
assert.equal(dualRunWithV2Blocker.authoritativeDecision.report, legacyDirect.report);

const validCandidateV2 = buildAnalyticalCoreV2Decision({
  rawInput: serviceInput,
  language: "en",
  legacyDecision: legacyDirect,
  additionalFindings: fullySupportedFindings(),
});
assert.equal(validCandidateV2.shadowDecision.state, SHADOW_DECISION_STATES.PROCEED);
const candidateAuthority = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE,
  legacyDecision: legacyDirect,
  v2Result: validCandidateV2,
});
assert.equal(validateDecisionAuthorityV1(candidateAuthority).ok, true);
assert.equal(candidateAuthority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.V2);
assert.equal(candidateAuthority.authoritativeDecision.state, SHADOW_DECISION_STATES.PROCEED);
assert.equal(candidateAuthority.legacyDecision.report, legacyDirect.report);
assert.equal(candidateAuthority.legacyDecision.score, legacyDirect.score);
assert.equal(candidateAuthority.fallbackAvailable, true);
assert.equal(candidateAuthority.fallbackUsed, false);

const invalidCandidateAuthority = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE,
  legacyDecision: legacyDirect,
  v2Result: { shadowDecision: { state: "not_supported" } },
});
assert.equal(invalidCandidateAuthority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(invalidCandidateAuthority.fallbackUsed, true);
assert.equal(invalidCandidateAuthority.fallbackReason, "v2_unsupported_state");

const throwingCandidateAuthority = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE,
  legacyDecision: legacyDirect,
  v2Error: new Error("boom"),
});
assert.equal(throwingCandidateAuthority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(throwingCandidateAuthority.fallbackUsed, true);
assert.equal(throwingCandidateAuthority.fallbackReason, "v2_error");

const lowConfidenceV2 = buildAnalyticalCoreV2Decision({
  rawInput: {
    businessIdea: "Packaging supplier.",
    targetCustomer: "Small retailers",
    problem: "They need packaging stock.",
    monetization: "Sell packaging products.",
  },
  language: "en",
  legacyDecision: legacyDirect,
});
assert.equal(lowConfidenceV2.lensSelection.confidence, "low");
assert.equal(lowConfidenceV2.lensSelection.requiresConfirmation, true);
const lowConfidenceCandidateAuthority = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE,
  legacyDecision: legacyDirect,
  v2Result: lowConfidenceV2,
});
assert.equal(lowConfidenceCandidateAuthority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(lowConfidenceCandidateAuthority.fallbackUsed, true);
assert.equal(lowConfidenceCandidateAuthority.fallbackReason, "v2_low_confidence_review_required");

const rollbackAuthority = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.LEGACY,
  legacyDecision: legacyDirect,
  v2Result: validCandidateV2,
});
assert.equal(rollbackAuthority.mode, BIV_DECISION_AUTHORITY_MODES.LEGACY);
assert.equal(rollbackAuthority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(rollbackAuthority.fallbackUsed, false);
assert.equal(rollbackAuthority.authoritativeDecision.report, legacyDirect.report);

const explicitFallbackAuthority = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE,
  legacyDecision: legacyDirect,
  v2Result: validCandidateV2,
  fallbackRequested: true,
});
assert.equal(explicitFallbackAuthority.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(explicitFallbackAuthority.fallbackReason, "explicit_fallback_requested");

const insufficientV2 = buildAnalyticalCoreV2Decision({
  rawInput: {
    businessIdea: "Business idea.",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  language: "en",
  legacyDecision: legacyDirect,
});
const insufficientDualRun = selectBusinessIdeaDecisionAuthorityV1({
  mode: BIV_DECISION_AUTHORITY_MODES.DUAL_RUN,
  legacyDecision: legacyDirect,
  v2Result: insufficientV2,
});
assert.equal(insufficientDualRun.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY);
assert.equal(insufficientDualRun.fallbackUsed, true);
assert.equal(insufficientDualRun.fallbackReason, "v2_low_confidence_review_required");

const sourceFiles = [
  "executionResult.js",
  "validatorOrchestrator.js",
  "report.js",
  "recommendations.js",
  "scoring.js",
  "../../../src/pages/BusinessIdeaValidatorPage.jsx",
  "../../../src/pages/BusinessIdeaDiscoveryPrototypePage.jsx",
];
for (const filePath of sourceFiles) {
  const source = readFileSync(join(__dirname, filePath), "utf8");
  assert.equal(source.includes("BIV_DECISION_AUTHORITY"), false, `${filePath} must not independently own authority mode`);
}

console.log("Decision Authority Gate V1 tests: PASS");

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
    reason: "The fixture supplies traceable support for this controlled authority-gate test.",
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
    reason: "The fixture supplies traceable adverse evidence for this controlled authority-gate test.",
    evidenceIds: [`external_evidence__${id}`],
    unknownIds: [],
    confidence: "high",
    severity,
    effect,
    whatWouldChangeIt: "Verified resolution of the adverse condition.",
    limitations: "Test fixture evidence only; not production authority.",
  };
}
