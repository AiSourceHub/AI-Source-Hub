import assert from "node:assert/strict";
import {
  evaluateShadowDecisionFixtureV1,
  getShadowDecisionEvaluationFixturesV1,
  runShadowDecisionEvaluationV1,
} from "./shadowDecisionEvaluation.js";
import {
  SHADOW_DECISION_STATES,
  validateDecisionSynthesisV1,
} from "./decisionSynthesis.js";

const fixtures = getShadowDecisionEvaluationFixturesV1();
const evaluation = runShadowDecisionEvaluationV1({ fixtures });
assert.equal(evaluation.results.length >= 33, true);
assert.equal(evaluation.authority.qaOnly, true);
assert.equal(evaluation.authority.determinesProductionVerdict, false);
assert.equal(evaluation.authority.affectsScore, false);
assert.equal(evaluation.authority.affectsReport, false);
assert.equal(evaluation.authority.changesRuntimeBehavior, false);

const genericReadinessPrimaries = new Set([
  "finding_target_customer_readiness",
  "finding_problem_hypothesis_readiness",
  "finding_revenue_mechanism_readiness",
]);

const expectedProceedPrimaries = {
  repeated_sales_ready_to_proceed: "finding_demand_supported",
  service_repeated_paid_jobs_proceed: "finding_service_repeat_demand_readiness",
  saas_retained_paid_users_proceed: "finding_saas_activation_retention_readiness",
  wholesale_repeat_orders_supplier_terms_proceed: "finding_wholesale_customer_order_concentration",
  professional_retainer_spare_capacity_proceed: "finding_professional_repeat_retainer_readiness",
  expansion_validated_increment_proceed: "finding_expansion_incremental_economics_readiness",
};

for (const [fixtureId, primaryFindingId] of Object.entries(expectedProceedPrimaries)) {
  const result = resultFor(fixtureId);
  assert.equal(result.shadowDecision.state, SHADOW_DECISION_STATES.PROCEED, fixtureId);
  assert.equal(validateDecisionSynthesisV1(result.shadowDecision).ok, true, fixtureId);
  assert.equal(result.shadowDecision.primaryReasonFindingId, primaryFindingId, fixtureId);
  assert.equal(genericReadinessPrimaries.has(result.shadowDecision.primaryReasonFindingId), false, fixtureId);
  assert.match(result.shadowDecision.rationale, /next staged commitment|justified|does not guarantee full-scale success/i, fixtureId);
  assert.match(result.shadowDecision.nextDecisionAction, /Proceed|limited|controlled|next commercial validation|supplier negotiation|next staged commitment/i, fixtureId);
  assert.match(result.shadowDecision.whatWouldChangeDecision, /Downgrade|material condition/i, fixtureId);
  assert.equal(hasDuplicateSupportFamily(result.shadowDecision), false, fixtureId);
}

const expectedTestFirstPrimaries = {
  real_estate_warehouse_owner_belief: "finding_real_estate_occupancy_utilization_readiness",
  marketplace_technician_owner_belief: "finding_marketplace_supply_side_readiness",
  retail_packaging_owner_belief: "finding_retail_repeat_purchase_readiness",
  manufacturing_stainless_owner_belief: "finding_manufacturing_equipment_capacity_readiness",
  service_ac_repair_owner_belief: "finding_service_billable_utilization_dependency",
  saas_b2b_subscription_owner_belief: "finding_saas_activation_retention_readiness",
  food_takeaway_owner_belief: "finding_food_repeat_demand_readiness",
  wholesale_distribution_owner_belief: "finding_wholesale_customer_order_concentration",
  professional_services_owner_belief: "finding_professional_billable_utilization_capacity",
  existing_business_expansion_professional: "finding_expansion_spare_capacity_dependency",
};

for (const [fixtureId, primaryFindingId] of Object.entries(expectedTestFirstPrimaries)) {
  const result = resultFor(fixtureId);
  assert.equal(result.shadowDecision.state, SHADOW_DECISION_STATES.TEST_FIRST, fixtureId);
  assert.equal(result.shadowDecision.primaryReasonFindingId, primaryFindingId, fixtureId);
  assert.match(result.shadowDecision.rationale, /test|assumption|decision-driving/i, fixtureId);
  assert.match(result.shadowDecision.nextDecisionAction, /Test|Assumption|Evidence needed/i, fixtureId);
}

const reviseExpectations = {
  marketplace_provider_economics_conflict: "finding_marketplace_provider_incentive_conflict",
  retail_supplier_moq_conflict: "finding_retail_supplier_moq_model_conflict",
  service_travel_price_conflict: "finding_service_travel_price_conflict",
  food_site_throughput_conflict: "finding_food_site_throughput_conflict",
};

for (const [fixtureId, primaryFindingId] of Object.entries(reviseExpectations)) {
  const result = resultFor(fixtureId);
  assert.equal(result.shadowDecision.state, SHADOW_DECISION_STATES.REVISE, fixtureId);
  assert.equal(result.shadowDecision.primaryReasonFindingId, primaryFindingId, fixtureId);
  assert.match(result.shadowDecision.rationale, /structural issue/i, fixtureId);
  assert.match(result.shadowDecision.whatWouldChangeDecision, /revised model|resolving the structural issue/i, fixtureId);
}

const blockerExpectations = {
  regulatory_blocker_verified: "finding_regulatory_blocker_verified",
  critical_supplier_unavailable: "finding_critical_supplier_unavailable",
  saas_activation_retention_failure: "finding_saas_activation_retention_failure",
  professional_founder_capacity_saturated: "finding_professional_founder_capacity_saturated",
  expansion_core_capacity_cannibalization: "finding_expansion_core_capacity_cannibalization",
};

for (const [fixtureId, primaryFindingId] of Object.entries(blockerExpectations)) {
  const result = resultFor(fixtureId);
  assert.equal(result.shadowDecision.state, SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET, fixtureId);
  assert.equal(result.shadowDecision.primaryReasonFindingId, primaryFindingId, fixtureId);
  assert.equal(result.shadowDecision.blockerFindingIds.includes(primaryFindingId), true, fixtureId);
  assert.match(result.shadowDecision.rationale, /blocker|adverse evidence/i, fixtureId);
  assert.match(result.shadowDecision.nextDecisionAction, /Stop larger commitment/i, fixtureId);
}

for (const fixtureId of ["missing_target_customer", "missing_problem", "missing_revenue", "beginner_simple_unclear"]) {
  const result = resultFor(fixtureId);
  assert.equal(result.shadowDecision.state, SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION, fixtureId);
  assert.equal(genericReadinessPrimaries.has(result.shadowDecision.primaryReasonFindingId), true, fixtureId);
  assert.match(result.shadowDecision.rationale, /cannot be meaningfully judged|missing foundation/i, fixtureId);
}

const englishService = resultFor("service_ac_repair_owner_belief");
const arabicService = resultFor("arabic_service_equivalent");
assert.equal(arabicService.lensSelection.primaryLens, englishService.lensSelection.primaryLens);
assert.equal(arabicService.shadowDecision.state, englishService.shadowDecision.state);
assert.equal(arabicService.shadowDecision.confidence, englishService.shadowDecision.confidence);
assert.equal(findingFamily(arabicService.shadowDecision.primaryReasonFindingId), findingFamily(englishService.shadowDecision.primaryReasonFindingId));

const punctuationVariant = evaluateShadowDecisionFixtureV1({
  fixture: {
    fixtureId: "service_punctuation_variant",
    category: "stability",
    evidenceLevel: "owner_belief_only",
    expectedDecision: "test_first",
    rawInput: {
      businessIdea: "Mobile AC repair, and maintenance service for homes — and small offices!",
      targetCustomer: "Homeowners and small offices.",
      problem: "They need quick AC repair at their location!",
      monetization: "Customers pay per repair visit.",
    },
  },
});
assert.equal(punctuationVariant.shadowDecision.state, englishService.shadowDecision.state);
assert.equal(punctuationVariant.shadowDecision.primaryReasonFindingId, englishService.shadowDecision.primaryReasonFindingId);

function resultFor(fixtureId) {
  const result = evaluation.results.find((item) => item.fixtureId === fixtureId);
  assert.ok(result, `missing fixture ${fixtureId}`);
  return result;
}

function hasDuplicateSupportFamily(decision) {
  const families = new Set([findingFamily(decision.primaryReasonFindingId)]);
  return decision.supportingFindingIds.some((id) => {
    const family = findingFamily(id);
    if (!family) return false;
    if (families.has(family)) return true;
    families.add(family);
    return false;
  });
}

function findingFamily(id = "") {
  return id
    .replace(/^finding_/, "")
    .replace(/_(readiness|supported|dependency|evidence|unknown|conflict|failure|blocker|signal)$/, "");
}

console.log("Shadow Decision Calibration V1 tests: PASS");
