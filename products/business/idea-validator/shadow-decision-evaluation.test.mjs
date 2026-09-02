import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BIV_SHADOW_DECISION_EVALUATION_VERSION,
  evaluateShadowDecisionFixtureV1,
  getShadowDecisionEvaluationFixturesV1,
  runShadowDecisionEvaluationV1,
} from "./shadowDecisionEvaluation.js";
import { BUSINESS_MODEL_LENSES } from "./businessModelLenses.js";
import { SHADOW_DECISION_STATES } from "./decisionSynthesis.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const fixtures = getShadowDecisionEvaluationFixturesV1();
const evaluation = runShadowDecisionEvaluationV1({ fixtures });

assert.equal(evaluation.version, BIV_SHADOW_DECISION_EVALUATION_VERSION);
assert.equal(evaluation.authority.qaOnly, true);
assert.equal(evaluation.authority.determinesProductionVerdict, false);
assert.equal(evaluation.authority.affectsScore, false);
assert.equal(evaluation.authority.affectsReport, false);
assert.equal(evaluation.authority.changesRuntimeBehavior, false);
assert.equal(evaluation.results.length >= 20, true);
assert.equal(evaluation.manualReviewRows.length, evaluation.results.length);

for (const result of evaluation.results) {
  assert.equal(result.assertions.expectedDecisionMet, true, result.fixtureId);
  assert.equal(result.assertions.shadowOnly, true, result.fixtureId);
  assert.equal(result.warnings.length, 0, result.fixtureId);
  assert.equal(Boolean(result.shadowDecision.primaryReasonFindingId), true, result.fixtureId);
  assert.equal(Boolean(result.shadowDecision.whatWouldChangeDecision), true, result.fixtureId);
  assert.equal(Boolean(result.shadowDecision.nextDecisionAction), true, result.fixtureId);
  assert.equal(Array.isArray(result.findingSummary), true, result.fixtureId);
  assert.equal(result.findingSummary.some((finding) => finding.evidenceCount > 0 || finding.unknownCount > 0), true, result.fixtureId);
}

assert.deepEqual(Object.keys(evaluation.metrics.decisionDistribution).sort(), [
  SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET,
  SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION,
  SHADOW_DECISION_STATES.PROCEED,
  SHADOW_DECISION_STATES.REVISE,
  SHADOW_DECISION_STATES.TEST_FIRST,
].sort());
assert.equal(evaluation.metrics.decisionDistribution[SHADOW_DECISION_STATES.TEST_FIRST] > 1, true);
assert.equal(evaluation.metrics.decisionDistribution[SHADOW_DECISION_STATES.PROCEED] >= 1, true);
assert.equal(evaluation.metrics.decisionDistribution[SHADOW_DECISION_STATES.REVISE] >= 1, true);
assert.equal(evaluation.metrics.decisionDistribution[SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET] >= 1, true);
assert.equal(evaluation.metrics.decisionDistribution[SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION] >= 1, true);

assert.equal(evaluation.metrics.confidenceDistribution.high >= 1, true);
assert.equal(evaluation.metrics.confidenceDistribution.medium >= 1, true);
assert.equal(evaluation.metrics.confidenceDistribution.low >= 1, true);
assert.equal(evaluation.metrics.blockerFrequency >= 2, true);
assert.equal(evaluation.metrics.criticalUnknownFrequency >= 3, true);

const requiredLenses = [
  BUSINESS_MODEL_LENSES.REAL_ESTATE,
  BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
  BUSINESS_MODEL_LENSES.RETAIL_TRADING,
  BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
  BUSINESS_MODEL_LENSES.SERVICE,
  BUSINESS_MODEL_LENSES.SAAS_SOFTWARE,
  BUSINESS_MODEL_LENSES.FOOD_BEVERAGE,
  BUSINESS_MODEL_LENSES.WHOLESALE_IMPORT_DISTRIBUTION,
  BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES,
  BUSINESS_MODEL_LENSES.EXISTING_BUSINESS_EXPANSION,
];
for (const lens of requiredLenses) {
  assert.equal(Boolean(evaluation.metrics.lensDistribution[lens]), true, `missing lens ${lens}`);
}

const rental = byFixture("real_estate_warehouse_owner_belief");
assert.equal(rental.lensSelection.primaryLens, BUSINESS_MODEL_LENSES.REAL_ESTATE);
assert.equal(rental.shadowDecision.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(rental.shadowDecision.primaryReasonFindingId, "finding_real_estate_occupancy_utilization_readiness");
assert.match(rental.shadowDecision.nextDecisionAction, /occupancy|location|site economics/i);

const marketplace = byFixture("marketplace_technician_owner_belief");
assert.equal(marketplace.lensSelection.primaryLens, BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM);
assert.equal(marketplace.shadowDecision.primaryReasonFindingId, "finding_marketplace_supply_side_readiness");
assert.match(marketplace.shadowDecision.nextDecisionAction, /customer demand and provider participation/i);

const retail = byFixture("retail_packaging_owner_belief");
assert.equal(retail.lensSelection.primaryLens, BUSINESS_MODEL_LENSES.RETAIL_TRADING);
assert.equal(retail.shadowDecision.primaryReasonFindingId, "finding_retail_repeat_purchase_readiness");
assert.match(retail.shadowDecision.nextDecisionAction, /repeat purchasing|supplier terms|margin/i);

const manufacturing = byFixture("manufacturing_stainless_owner_belief");
assert.equal(manufacturing.lensSelection.primaryLens, BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL);
assert.equal(manufacturing.shadowDecision.primaryReasonFindingId, "finding_manufacturing_equipment_capacity_readiness");
assert.match(manufacturing.shadowDecision.nextDecisionAction, /equipment\/capacity|buyer procurement/i);
assert.doesNotMatch(JSON.stringify(manufacturing), /\bPET\b|plastic waste|flakes|pellets|recycling buyer/i);

assert.notDeepEqual(materialSignature(rental), materialSignature(marketplace));
assert.notDeepEqual(materialSignature(marketplace), materialSignature(retail));
assert.notDeepEqual(materialSignature(retail), materialSignature(manufacturing));

const missingTarget = byFixture("missing_target_customer");
assert.equal(missingTarget.shadowDecision.state, SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION);
assert.equal(missingTarget.shadowDecision.criticalUnknownIds.some((id) => id.includes("target_customer")), true);
assert.equal(missingTarget.shadowDecision.blockerFindingIds.length, 0);

const clearUnvalidated = byFixture("service_ac_repair_owner_belief");
assert.equal(clearUnvalidated.shadowDecision.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(clearUnvalidated.shadowDecision.criticalUnknownIds.length, 0);

const statedInterest = byFixture("customer_interest_only");
const paidPilot = byFixture("behavioral_paid_pilot");
const repeatedSales = byFixture("repeated_sales_ready_to_proceed");
assert.equal(statedInterest.shadowDecision.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(paidPilot.shadowDecision.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(repeatedSales.shadowDecision.state, SHADOW_DECISION_STATES.PROCEED);
assert.equal(repeatedSales.shadowDecision.confidence, "high");
assert.equal(paidPilot.findingSummary.some((finding) => finding.evidenceCount > statedInterest.findingSummary[0].evidenceCount), true);

const marketplaceRevise = byFixture("marketplace_provider_economics_conflict");
assert.equal(marketplaceRevise.shadowDecision.state, SHADOW_DECISION_STATES.REVISE);
assert.equal(marketplaceRevise.shadowDecision.primaryReasonFindingId, "finding_marketplace_provider_incentive_conflict");

const retailRevise = byFixture("retail_supplier_moq_conflict");
assert.equal(retailRevise.shadowDecision.state, SHADOW_DECISION_STATES.REVISE);
assert.equal(retailRevise.shadowDecision.primaryReasonFindingId, "finding_retail_supplier_moq_model_conflict");

const regulatoryBlocker = byFixture("regulatory_blocker_verified");
assert.equal(regulatoryBlocker.shadowDecision.state, SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET);
assert.deepEqual(regulatoryBlocker.shadowDecision.blockerFindingIds, ["finding_regulatory_blocker_verified"]);

const supplierBlocker = byFixture("critical_supplier_unavailable");
assert.equal(supplierBlocker.shadowDecision.state, SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET);
assert.deepEqual(supplierBlocker.shadowDecision.blockerFindingIds, ["finding_critical_supplier_unavailable"]);

const confident = byFixture("confident_wording_no_evidence");
assert.equal(confident.shadowDecision.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.notEqual(confident.shadowDecision.confidence, "high");
assert.equal(JSON.stringify(confident.findingSummary).includes("external_evidence"), false);

const englishService = clearUnvalidated;
const arabicService = byFixture("arabic_service_equivalent");
assert.equal(arabicService.lensSelection.primaryLens, englishService.lensSelection.primaryLens);
assert.equal(arabicService.shadowDecision.state, englishService.shadowDecision.state);
assert.equal(arabicService.shadowDecision.confidence, englishService.shadowDecision.confidence);
assert.equal(arabicService.shadowDecision.criticalUnknownIds.length, englishService.shadowDecision.criticalUnknownIds.length);

const plain = evaluateShadowDecisionFixtureV1({
  fixture: {
    fixtureId: "plain_paraphrase",
    category: "wording_stability",
    expectedDecision: "test_first",
    rawInput: {
      businessIdea: "Mobile AC repair service for homes.",
      targetCustomer: "Homeowners",
      problem: "AC units break and need repair.",
      monetization: "Pay per visit.",
    },
  },
});
const polished = evaluateShadowDecisionFixtureV1({
  fixture: {
    fixtureId: "polished_paraphrase",
    category: "wording_stability",
    expectedDecision: "test_first",
    rawInput: {
      businessIdea: "A premium field-service operation providing residential air-conditioning repair.",
      targetCustomer: "Residential homeowners",
      problem: "Home air-conditioning failures require timely repair.",
      monetization: "Visit-based service fee.",
    },
  },
});
assert.equal(plain.shadowDecision.state, polished.shadowDecision.state);
assert.equal(plain.shadowDecision.criticalUnknownIds.length, polished.shadowDecision.criticalUnknownIds.length);

const expansion = byFixture("existing_business_expansion_professional");
assert.equal(expansion.lensSelection.primaryLens, BUSINESS_MODEL_LENSES.EXISTING_BUSINESS_EXPANSION);
assert.equal(expansion.shadowDecision.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(expansion.findingSummary.some((finding) => finding.evidenceCount > 1), true);

const legacyComparisons = Object.keys(evaluation.metrics.legacyComparisonDistribution);
assert.equal(legacyComparisons.length >= 1, true);
assert.equal(legacyComparisons.includes("shadow more conservative") || legacyComparisons.includes("materially different reasoning") || legacyComparisons.includes("broadly aligned"), true);

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
  assert.equal(source.includes("shadowDecisionEvaluation"), false, `${filePath} should not import shadow evaluation harness`);
}

const harnessSource = readFileSync(join(__dirname, "shadowDecisionEvaluation.js"), "utf8");
assert.equal(/\bwarehouse\b|\btechnician\b|\bpackaging\b|\bstainless\b/i.test(harnessSource.replace(/fixtureId:.*$/gm, "")), true);
assert.equal(/if\s*\([^)]*(warehouse|technician|packaging|stainless)/i.test(harnessSource), false);

console.log("Shadow Decision Evaluation Harness tests: PASS");

function byFixture(fixtureId) {
  return evaluation.results.find((result) => result.fixtureId === fixtureId);
}

function materialSignature(result) {
  return result.findingSummary
    .filter((finding) => finding.severity === "material")
    .map((finding) => `${finding.module}:${finding.id}:${finding.unknownCount}`)
    .sort();
}
