import assert from "node:assert/strict";
import { buildEvidenceLedgerV1 } from "./evidenceLedger.js";
import { selectBusinessModelLensV1, BUSINESS_MODEL_LENSES } from "./businessModelLenses.js";
import { buildAnalyticalPlanV1 } from "./analyticalPlan.js";
import { buildStructuredFindingsV1, validateStructuredFindingsV1 } from "./analyticalFindings.js";
import { synthesizeDecisionV1, SHADOW_DECISION_STATES } from "./decisionSynthesis.js";

const cases = {
  marketplace: {
    expectedLens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
    rawInput: {
      businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
      targetCustomer: "Homeowners and technicians",
      problem: "Customers struggle to find trusted technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
    requiredFindingIds: ["finding_marketplace_liquidity_dependency"],
    forbiddenFindingIds: ["finding_service_billable_utilization_dependency"],
  },
  retail: {
    expectedLens: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
    rawInput: {
      businessIdea: "A packaging store that sells boxes and shipping supplies to small shops.",
      targetCustomer: "Small shop owners",
      problem: "They need reliable packaging supplies nearby.",
      monetization: "Sell packaging products with retail margin.",
    },
    requiredFindingIds: ["finding_retail_repeat_purchase_readiness"],
    forbiddenFindingIds: ["finding_saas_activation_retention_readiness"],
  },
  service: {
    expectedLens: BUSINESS_MODEL_LENSES.SERVICE,
    rawInput: {
      businessIdea: "Mobile AC repair and maintenance service for homes and small offices.",
      targetCustomer: "Homeowners and small offices",
      problem: "They need quick AC repair at their location.",
      monetization: "Customers pay per repair visit.",
    },
    requiredFindingIds: [
      "finding_service_billable_utilization_dependency",
      "finding_service_skill_quality_dependency",
      "finding_service_radius_delivery_burden",
      "finding_service_repeat_demand_readiness",
    ],
    forbiddenFindingIds: ["finding_marketplace_liquidity_dependency", "finding_manufacturing_equipment_capacity_readiness"],
  },
  saas: {
    expectedLens: BUSINESS_MODEL_LENSES.SAAS_SOFTWARE,
    rawInput: {
      businessIdea: "B2B subscription software that helps clinics reduce missed appointments.",
      targetCustomer: "Small private clinics",
      problem: "Patients miss appointments and staff lose time following up.",
      monetization: "Monthly subscription paid by clinics.",
    },
    requiredFindingIds: [
      "finding_saas_activation_retention_readiness",
      "finding_saas_subscription_payment_separation",
      "finding_saas_switching_integration_dependency",
    ],
    forbiddenFindingIds: ["finding_retail_supplier_inventory_dependency", "finding_manufacturing_production_capacity_unknown"],
  },
  food: {
    expectedLens: BUSINESS_MODEL_LENSES.FOOD_BEVERAGE,
    rawInput: {
      businessIdea: "Small takeaway restaurant serving lunch meals near offices.",
      targetCustomer: "Office workers",
      problem: "They need fast lunch options during short breaks.",
      monetization: "Customers pay per meal.",
    },
    requiredFindingIds: [
      "finding_food_location_throughput_dependency",
      "finding_food_cost_waste_readiness",
      "finding_food_throughput_capacity_readiness",
      "finding_food_repeat_demand_readiness",
      "finding_food_labor_operational_complexity",
    ],
    forbiddenFindingIds: ["finding_marketplace_supply_side_readiness", "finding_wholesale_margin_readiness"],
  },
  wholesale: {
    expectedLens: BUSINESS_MODEL_LENSES.WHOLESALE_IMPORT_DISTRIBUTION,
    rawInput: {
      businessIdea: "Import and distribute cleaning supplies to small retailers.",
      targetCustomer: "Small retail shops",
      problem: "They need reliable stock at wholesale prices.",
      monetization: "Sell imported supplies with distributor margin.",
    },
    requiredFindingIds: [
      "finding_wholesale_supplier_concentration_dependency",
      "finding_wholesale_inventory_working_capital_dependency",
      "finding_wholesale_customer_order_concentration",
      "finding_wholesale_margin_readiness",
    ],
    forbiddenFindingIds: ["finding_retail_repeat_purchase_readiness", "finding_food_throughput_capacity_readiness"],
  },
  professional: {
    expectedLens: BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES,
    classification: { confirmedClassification: { primaryType: "professional_service" } },
    rawInput: {
      businessIdea: "Consulting and accounting practice for small businesses.",
      targetCustomer: "Small business owners",
      problem: "They need help organizing monthly accounts.",
      monetization: "Monthly advisory retainer.",
    },
    requiredFindingIds: [
      "finding_professional_expertise_dependency",
      "finding_professional_billable_utilization_capacity",
      "finding_professional_repeat_retainer_readiness",
      "finding_professional_founder_dependency",
    ],
    forbiddenFindingIds: ["finding_service_radius_delivery_burden", "finding_marketplace_liquidity_dependency"],
  },
  expansion: {
    expectedLens: BUSINESS_MODEL_LENSES.EXISTING_BUSINESS_EXPANSION,
    rawInput: {
      businessIdea: "Existing metal workshop adding a new stainless display shelf product line.",
      targetCustomer: "Restaurant and cafe operators",
      problem: "Existing customers request custom stainless display shelves.",
      monetization: "Sell made-to-order shelves with deposit before fabrication.",
      stage: "expanding",
    },
    externalEvidence: [
      trustedEvidence("current_customer_base", "Three existing restaurant customers requested shelf quotations.", "external_evidence__expansion_requests"),
      trustedEvidence("spare_capacity", "The current workshop has unused fabrication capacity two days per week.", "external_evidence__spare_capacity"),
      trustedEvidence("validated_incremental_demand", "Two customers paid deposits for the new shelf line.", "external_evidence__incremental_demand"),
    ],
    requiredFindingIds: [
      "finding_expansion_baseline_increment_separation",
      "finding_expansion_spare_capacity_dependency",
      "finding_expansion_incremental_economics_readiness",
      "finding_expansion_cannibalization_management_risk",
    ],
    forbiddenFindingIds: ["finding_real_estate_occupancy_utilization_readiness", "finding_marketplace_liquidity_dependency"],
  },
};

const results = {};

for (const [name, fixture] of Object.entries(cases)) {
  const result = buildCase(fixture);
  const text = JSON.stringify(result.structured.findings);
  results[name] = result;
  assert.equal(result.lensSelection.primaryLens, fixture.expectedLens, name);
  assert.equal(validateStructuredFindingsV1(result.structured).ok, true, name);
  assert.equal(result.structured.authority.determinesVerdict, false, name);
  assert.equal(result.structured.authority.affectsScore, false, name);
  assert.equal(result.structured.authority.affectsReport, false, name);
  assert.equal(result.structured.authority.changesRuntimeBehavior, false, name);
  for (const id of fixture.requiredFindingIds) {
    assert.equal(Boolean(byId(result.structured, id)), true, `${name} should include ${id}`);
  }
  for (const id of fixture.forbiddenFindingIds) {
    assert.equal(Boolean(byId(result.structured, id)), false, `${name} should not include ${id}`);
  }
  assert.doesNotMatch(text, /\bPET\b|plastic waste|flakes|pellets|recycling buyer/i, name);
}

assert.notDeepEqual(materialSignature(results.service), materialSignature(results.marketplace));
assert.notDeepEqual(materialSignature(results.saas), materialSignature(results.wholesale));
assert.notDeepEqual(materialSignature(results.food), materialSignature(results.retail));
assert.notDeepEqual(materialSignature(results.professional), materialSignature(results.service));
assert.equal(byId(results.expansion.structured, "finding_expansion_baseline_increment_separation").effect, "supports");
assert.match(byId(results.expansion.structured, "finding_expansion_baseline_increment_separation").claim, /baseline evidence/i);
assert.match(byId(results.expansion.structured, "finding_expansion_incremental_economics_readiness").claim, /Incremental/i);

const ownerBeliefService = synthesizeDecisionV1(results.service);
assert.equal(ownerBeliefService.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.match(ownerBeliefService.primaryReasonFindingId, /^finding_service_/);

const paidService = buildCase({
  ...cases.service,
  externalEvidence: [
    trustedEvidence("repeat_paid_jobs", "Ten repeat paid maintenance jobs were completed last month.", "external_evidence__repeat_paid_jobs"),
    trustedEvidence("service_capacity", "Two technicians completed four visits per day during the pilot.", "external_evidence__service_capacity"),
  ],
  additionalFindings: stageSupportFindings(),
});
const paidServiceDecision = synthesizeDecisionV1(paidService);
assert.equal(paidServiceDecision.state, SHADOW_DECISION_STATES.PROCEED);
assert.equal(paidServiceDecision.confidence, "high");

const weakSaas = synthesizeDecisionV1(results.saas);
const retainedSaas = buildCase({
  ...cases.saas,
  externalEvidence: [
    trustedEvidence("activation", "Twenty trial accounts completed onboarding.", "external_evidence__activation"),
    trustedEvidence("retention", "Twelve paid users renewed after the first month.", "external_evidence__retention"),
  ],
  additionalFindings: stageSupportFindings(),
});
const retainedSaasDecision = synthesizeDecisionV1(retainedSaas);
assert.equal(weakSaas.state, SHADOW_DECISION_STATES.TEST_FIRST);
assert.equal(retainedSaasDecision.state, SHADOW_DECISION_STATES.PROCEED);
assert.equal(retainedSaasDecision.confidence, "high");

const serviceTravelConflict = synthesizeDecisionV1(buildCase({
  ...cases.service,
  additionalFindings: [adverse("finding_service_travel_price_conflict", "risk_sensitivity", "risk_exposure", "weakens", "material", "Verified travel cost makes the planned service price structurally unviable.")],
}));
assert.equal(serviceTravelConflict.state, SHADOW_DECISION_STATES.REVISE);

const saasRetentionFailure = synthesizeDecisionV1(buildCase({
  ...cases.saas,
  additionalFindings: [adverse("finding_saas_activation_retention_failure", "operational_capacity", "evidence_confidence", "contradicts", "critical", "Repeated trial users fail to activate or retain despite onboarding support.")],
}));
assert.equal(saasRetentionFailure.state, SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET);

const wholesaleMoqConflict = synthesizeDecisionV1(buildCase({
  ...cases.wholesale,
  additionalFindings: [adverse("finding_wholesale_moq_customer_model_conflict", "risk_sensitivity", "risk_exposure", "weakens", "material", "Verified MOQ and lead time conflict with the promised small-order model.")],
}));
assert.equal(wholesaleMoqConflict.state, SHADOW_DECISION_STATES.REVISE);

const expansionCannibalization = synthesizeDecisionV1(buildCase({
  ...cases.expansion,
  additionalFindings: [adverse("finding_expansion_core_capacity_cannibalization", "risk_sensitivity", "risk_exposure", "contradicts", "critical", "The new activity is verified to cannibalize profitable core capacity.")],
}));
assert.equal(expansionCannibalization.state, SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET);

const confidentService = buildCase({
  ...cases.service,
  rawInput: {
    ...cases.service.rawInput,
    problem: "I am 100% sure customers will buy because everyone needs AC repair.",
  },
});
assert.equal(synthesizeDecisionV1(confidentService).confidence, "medium");
assert.equal(confidentService.evidenceLedger.items.some((item) => item.origin === "external_evidence"), false);

const arabicService = buildCase({
  locale: "ar",
  rawInput: {
    businessIdea: "خدمة صيانة مكيفات متنقلة للمنازل والمكاتب الصغيرة.",
    targetCustomer: "ملاك المنازل والمكاتب الصغيرة",
    problem: "يحتاجون إلى إصلاح سريع للمكيف في موقعهم.",
    monetization: "يدفع العميل لكل زيارة صيانة.",
  },
});
assert.equal(arabicService.lensSelection.primaryLens, results.service.lensSelection.primaryLens);
assert.equal(synthesizeDecisionV1(arabicService).state, synthesizeDecisionV1(results.service).state);
assert.equal(synthesizeDecisionV1(arabicService).confidence, synthesizeDecisionV1(results.service).confidence);

const arabicFood = buildCase({
  locale: "ar",
  rawInput: {
    businessIdea: "مطعم صغير يقدم وجبات غداء سريعة قرب المكاتب.",
    targetCustomer: "موظفو المكاتب",
    problem: "يحتاجون إلى وجبات سريعة خلال وقت الاستراحة.",
    monetization: "يدفع العميل لكل وجبة.",
  },
});
assert.equal(arabicFood.lensSelection.primaryLens, results.food.lensSelection.primaryLens);
assert.equal(synthesizeDecisionV1(arabicFood).state, synthesizeDecisionV1(results.food).state);

console.log("Extended Lens-Aware Analysis V1 tests: PASS");

function buildCase(fixture) {
  const evidenceLedger = buildEvidenceLedgerV1({
    rawInput: fixture.rawInput,
    confirmedUnderstanding: fixture.confirmedUnderstanding || null,
    optionalContext: fixture.optionalContext || null,
    classification: fixture.classification || null,
    externalEvidence: fixture.externalEvidence || [],
  });
  const lensSelection = selectBusinessModelLensV1({
    rawInput: fixture.rawInput,
    classification: fixture.classification || null,
    locale: fixture.locale || "en",
  });
  const analyticalPlan = buildAnalyticalPlanV1({ lensSelection, evidenceLedger });
  const baseStructured = buildStructuredFindingsV1({ evidenceLedger, lensSelection, analyticalPlan });
  const structured = {
    ...baseStructured,
    findings: [...baseStructured.findings, ...(fixture.additionalFindings || [])],
  };
  return { evidenceLedger, lensSelection, analyticalPlan, structuredFindings: structured, structured };
}

function byId(result, id) {
  return result.findings.find((finding) => finding.id === id);
}

function materialSignature(result) {
  return result.structured.findings
    .filter((finding) => finding.severity === "material")
    .map((finding) => `${finding.module}:${finding.id}:${finding.effect}`)
    .sort();
}

function trustedEvidence(evidenceClass, claim, sourceField) {
  return {
    trusted: true,
    evidenceClass,
    claim,
    value: claim,
    sourceField,
    confidence: "trusted_fixture",
    limitations: "QA fixture evidence only; not externally verified by this system.",
  };
}

function stageSupportFindings() {
  return [
    supported("finding_customer_paid_signal", "customer_stakeholders", "information_readiness", "external_evidence__paid_customers"),
    supported("finding_demand_supported", "market_demand", "opportunity_attractiveness", "external_evidence__repeat_behavior"),
    supported("finding_execution_supported", "operational_capacity", "execution_feasibility", "external_evidence__operating_capacity"),
    supported("finding_risk_controlled", "risk_sensitivity", "risk_exposure", "external_evidence__controlled_risk"),
    supported("finding_evidence_quality_supported", "implementation", "evidence_confidence", "external_evidence__verified_records"),
  ];
}

function supported(id, module, dimension, evidenceId) {
  return {
    id,
    module,
    dimension,
    claim: "This dimension has stage-appropriate supporting evidence.",
    reason: "The fixture supplies behavioral or repeated evidence for this stage.",
    evidenceIds: [evidenceId],
    unknownIds: [],
    confidence: "high",
    severity: "informational",
    effect: "supports",
    whatWouldChangeIt: "Contradictory evidence or a newly discovered blocker.",
    limitations: "Proceed means next justified commitment only, not guaranteed success.",
  };
}

function adverse(id, module, dimension, effect, severity, claim) {
  return {
    id,
    module,
    dimension,
    claim,
    reason: "The fixture supplies structured negative evidence for this model issue.",
    evidenceIds: [`external_evidence__${id}`],
    unknownIds: [],
    confidence: "high",
    severity,
    effect,
    whatWouldChangeIt: "Verified evidence resolving the adverse condition or a materially changed model.",
    limitations: "This adverse finding is fixture-scoped and does not come from missing information alone.",
  };
}
