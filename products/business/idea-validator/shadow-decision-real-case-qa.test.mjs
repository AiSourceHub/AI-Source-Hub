import assert from "node:assert/strict";
import { buildEvidenceLedgerV1, EVIDENCE_ORIGINS, getEvidenceItemsByOrigin } from "./evidenceLedger.js";
import { selectBusinessModelLensV1, BUSINESS_MODEL_LENSES } from "./businessModelLenses.js";
import { buildAnalyticalPlanV1 } from "./analyticalPlan.js";
import { buildStructuredFindingsV1 } from "./analyticalFindings.js";
import {
  SHADOW_DECISION_STATES,
  synthesizeDecisionV1,
  validateDecisionSynthesisV1,
} from "./decisionSynthesis.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";
import contentEn from "./content.en.js";

const realCases = [
  {
    id: "rental_warehouses",
    expectedLens: BUSINESS_MODEL_LENSES.REAL_ESTATE,
    expectedPrimaryFamily: "real_estate",
    expectedMaterialFindings: [
      "finding_real_estate_occupancy_utilization_readiness",
      "finding_real_estate_location_dependency",
      "finding_real_estate_revenue_economic_readiness",
      "finding_real_estate_capital_site_commitment",
    ],
    rawInput: {
      businessIdea: "Rental warehouses for small merchants that need flexible storage units.",
      targetCustomer: "Small merchants",
      problem: "They need flexible storage without long leases.",
      monetization: "Monthly warehouse rental.",
    },
  },
  {
    id: "technician_platform",
    expectedLens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
    expectedPrimaryFamily: "marketplace",
    expectedMaterialFindings: [
      "finding_marketplace_supply_side_readiness",
      "finding_marketplace_demand_side_readiness",
      "finding_marketplace_liquidity_dependency",
      "finding_marketplace_monetization_participation_separation",
      "finding_marketplace_trust_quality_dependency",
    ],
    rawInput: {
      businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
      targetCustomer: "Homeowners and technicians",
      problem: "Customers struggle to find trusted technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
  },
  {
    id: "packaging_store",
    expectedLens: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
    expectedPrimaryFamily: "retail",
    expectedMaterialFindings: [
      "finding_retail_repeat_purchase_readiness",
      "finding_retail_supplier_inventory_dependency",
      "finding_retail_differentiation_evidence",
      "finding_retail_working_capital_dependency",
    ],
    rawInput: {
      businessIdea: "A packaging store that sells boxes and shipping supplies to small shops.",
      targetCustomer: "Small shop owners",
      problem: "They need reliable packaging supplies nearby.",
      monetization: "Sell packaging products with retail margin.",
      competitiveAdvantage: "Better availability and faster service.",
    },
  },
  {
    id: "stainless_workshop",
    expectedLens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
    expectedPrimaryFamily: "manufacturing",
    expectedMaterialFindings: [
      "finding_manufacturing_equipment_capacity_readiness",
      "finding_manufacturing_skilled_labor_dependency",
      "finding_manufacturing_production_capacity_unknown",
      "finding_manufacturing_b2b_procurement_order_evidence",
      "finding_manufacturing_material_supplier_dependency",
      "finding_manufacturing_capital_readiness",
    ],
    rawInput: {
      businessIdea: "A stainless restaurant equipment workshop that fabricates tables and shelves.",
      targetCustomer: "Restaurants and commercial kitchens",
      problem: "Restaurants need nearby suppliers for durable stainless equipment.",
      monetization: "The workshop makes money by selling stainless equipment and charging installation fees.",
    },
  },
  {
    id: "ac_repair_service",
    expectedLens: BUSINESS_MODEL_LENSES.SERVICE,
    expectedPrimaryFamily: "service",
    expectedMaterialFindings: [
      "finding_service_billable_utilization_dependency",
      "finding_service_skill_quality_dependency",
      "finding_service_radius_delivery_burden",
      "finding_service_repeat_demand_readiness",
    ],
    rawInput: {
      businessIdea: "A service business that repairs air-conditioning units at customer locations.",
      targetCustomer: "Homeowners, tenants, and small businesses",
      problem: "Customers need fast repair when air-conditioning fails.",
      monetization: "Customers pay per repair visit or maintenance package.",
    },
  },
  {
    id: "pet_recycling_isolation",
    expectedLens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
    expectedPrimaryFamily: "manufacturing",
    expectedMaterialFindings: [
      "finding_manufacturing_equipment_capacity_readiness",
      "finding_manufacturing_production_capacity_unknown",
      "finding_manufacturing_b2b_procurement_order_evidence",
    ],
    rawInput: {
      businessIdea: "A PET plastic recycling plant that processes bottle waste into washed flakes.",
      targetCustomer: "Local plastic packaging manufacturers",
      problem: "Manufacturers need consistent recycled input material.",
      monetization: "Sell washed PET flakes to manufacturers.",
    },
  },
];

const results = realCases.map(runRealCase);

for (const result of results) {
  assert.equal(result.lensSelection.primaryLens, result.caseDef.expectedLens, result.caseDef.id);
  assert.equal(result.shadowDecision.state, SHADOW_DECISION_STATES.TEST_FIRST, result.caseDef.id);
  assert.equal(validateDecisionSynthesisV1(result.shadowDecision).ok, true, result.caseDef.id);
  assert.equal(result.shadowDecision.confidence, "medium", result.caseDef.id);
  assert.equal(result.shadowDecision.blockerFindingIds.length, 0, result.caseDef.id);
  assert.equal(result.shadowDecision.criticalUnknownIds.length, 0, result.caseDef.id);
  assert.equal(findingFamily(result.shadowDecision.primaryReasonFindingId).startsWith(result.caseDef.expectedPrimaryFamily), true, result.caseDef.id);
  assert.match(result.shadowDecision.rationale, /assumption|decision-driving|test/i, result.caseDef.id);
  assert.match(result.shadowDecision.whatWouldChangeDecision, /credible supportive evidence|Evidence:/i, result.caseDef.id);
  assert.match(result.shadowDecision.nextDecisionAction, /Test|Assumption|Evidence needed/i, result.caseDef.id);
  for (const findingId of result.caseDef.expectedMaterialFindings) {
    assert.equal(result.materialFindingIds.includes(findingId), true, `${result.caseDef.id} missing ${findingId}`);
    assert.equal(hasTraceableEvidenceOrUnknown(result, findingId), true, `${result.caseDef.id} should trace ${findingId}`);
  }
  assert.equal(hasEvidenceLaundering(result), false, result.caseDef.id);
  assert.equal(result.shadowDecision.authority.shadowOnly, true, result.caseDef.id);
  assert.equal(result.shadowDecision.authority.determinesProductionVerdict, false, result.caseDef.id);
  assert.equal(result.shadowDecision.authority.affectsScore, false, result.caseDef.id);
  assert.equal(result.shadowDecision.authority.affectsReport, false, result.caseDef.id);
  assert.equal(result.shadowDecision.authority.changesRuntimeBehavior, false, result.caseDef.id);
}

assert.equal(results.some((result) => result.shadowDecision.state === SHADOW_DECISION_STATES.PROCEED), false);

const rental = byId("rental_warehouses");
assert.match(JSON.stringify(rental.structuredFindings), /occupancy|utilization|location|capital|site/i);
assert.doesNotMatch(JSON.stringify(rental.structuredFindings), /marketplace|supplier inventory|PET flakes/i);

const platform = byId("technician_platform");
assert.match(JSON.stringify(platform.structuredFindings), /provider|liquidity|trust|participation/i);
assert.doesNotMatch(JSON.stringify(platform.structuredFindings), /occupancy|working capital|fabrication/i);

const packaging = byId("packaging_store");
assert.match(JSON.stringify(packaging.structuredFindings), /repeat-purchase|supplier|inventory|working capital|differentiation/i);
assert.doesNotMatch(JSON.stringify(packaging.structuredFindings), /marketplace liquidity|occupancy|skilled labor/i);

const stainless = byId("stainless_workshop");
assert.match(JSON.stringify(stainless.structuredFindings), /equipment|capacity|labor|procurement|supplier|capital/i);

const pet = byId("pet_recycling_isolation");
assert.equal(pet.lensSelection.primaryLens, BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL);
assert.equal(pet.shadowDecision.primaryReasonFindingId, "finding_manufacturing_equipment_capacity_readiness");
assert.doesNotMatch(JSON.stringify(pet.shadowDecision), /plastic recycling assessment|washed flakes buyer|PET specialist decided/i);

const insufficient = runRealCase({
  id: "insufficient_short_idea",
  expectedLens: BUSINESS_MODEL_LENSES.GENERIC,
  expectedPrimaryFamily: "target",
  expectedMaterialFindings: [],
  rawInput: {
    businessIdea: "I want to start something online.",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
});
assert.equal(insufficient.shadowDecision.state, SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION);
assert.equal(insufficient.shadowDecision.primaryReasonFindingId, "finding_target_customer_readiness");
assert.equal(insufficient.shadowDecision.blockerFindingIds.length, 0);
assert.match(insufficient.shadowDecision.rationale, /cannot be meaningfully judged|missing foundation/i);

const acArabic = runRealCase({
  id: "ac_repair_service_ar",
  locale: "ar",
  expectedLens: BUSINESS_MODEL_LENSES.SERVICE,
  expectedPrimaryFamily: "service",
  expectedMaterialFindings: [
    "finding_service_billable_utilization_dependency",
    "finding_service_skill_quality_dependency",
    "finding_service_radius_delivery_burden",
    "finding_service_repeat_demand_readiness",
  ],
  rawInput: {
    businessIdea: "مركز صيانة مكيفات مع فرق تنتقل إلى مقر العميل.",
    targetCustomer: "ملاك المنازل والشركات الصغيرة",
    problem: "يحتاجون إلى إصلاح سريع عند تعطل المكيف.",
    monetization: "يدفع العميل مقابل زيارة الصيانة أو عقد صيانة.",
  },
});
const acEnglish = byId("ac_repair_service");
assert.equal(acArabic.lensSelection.primaryLens, acEnglish.lensSelection.primaryLens);
assert.equal(acArabic.shadowDecision.state, acEnglish.shadowDecision.state);
assert.equal(acArabic.shadowDecision.confidence, acEnglish.shadowDecision.confidence);
assert.equal(findingFamily(acArabic.shadowDecision.primaryReasonFindingId), findingFamily(acEnglish.shadowDecision.primaryReasonFindingId));

const plainService = runRealCase({
  id: "ac_repair_plain_variant",
  expectedLens: BUSINESS_MODEL_LENSES.SERVICE,
  expectedPrimaryFamily: "service",
  expectedMaterialFindings: [],
  rawInput: {
    businessIdea: "Mobile AC repair service for homes.",
    targetCustomer: "Homeowners",
    problem: "AC units break and need repair.",
    monetization: "Pay per visit.",
  },
});
const polishedService = runRealCase({
  id: "ac_repair_polished_variant",
  expectedLens: BUSINESS_MODEL_LENSES.SERVICE,
  expectedPrimaryFamily: "service",
  expectedMaterialFindings: [],
  rawInput: {
    businessIdea: "A field-service operation providing residential air-conditioning repair.",
    targetCustomer: "Residential homeowners",
    problem: "Home air-conditioning failures require timely repair.",
    monetization: "Visit-based service fee.",
  },
});
assert.equal(plainService.shadowDecision.state, polishedService.shadowDecision.state);
assert.equal(plainService.shadowDecision.primaryReasonFindingId, polishedService.shadowDecision.primaryReasonFindingId);

const warehousePlain = runRealCase({
  id: "warehouse_plain_variant",
  expectedLens: BUSINESS_MODEL_LENSES.REAL_ESTATE,
  expectedPrimaryFamily: "real_estate",
  expectedMaterialFindings: [],
  rawInput: {
    businessIdea: "Small rental warehouse units for merchants.",
    targetCustomer: "Small merchants",
    problem: "They need flexible storage space.",
    monetization: "Monthly rental fee.",
  },
});
const warehousePolished = runRealCase({
  id: "warehouse_polished_variant",
  expectedLens: BUSINESS_MODEL_LENSES.REAL_ESTATE,
  expectedPrimaryFamily: "real_estate",
  expectedMaterialFindings: [],
  rawInput: {
    businessIdea: "Rental warehouse spaces with flexible storage units for small merchants.",
    targetCustomer: "Small merchants",
    problem: "They need storage without long lease commitments.",
    monetization: "Monthly rent.",
  },
});
assert.equal(warehousePlain.shadowDecision.state, warehousePolished.shadowDecision.state);
assert.equal(warehousePlain.shadowDecision.primaryReasonFindingId, warehousePolished.shadowDecision.primaryReasonFindingId);

const legacyVariance = results.map((result) => result.legacyVerdict);
assert.equal(legacyVariance.length, realCases.length);
assert.equal(new Set(results.map((result) => result.shadowDecision.primaryReasonFindingId)).size > 3, true);

console.log("Real-Case Shadow QA tests: PASS");

function runRealCase(caseDef) {
  const evidenceLedger = buildEvidenceLedgerV1({ rawInput: caseDef.rawInput });
  const lensSelection = selectBusinessModelLensV1({
    rawInput: caseDef.rawInput,
    locale: caseDef.locale || "en",
  });
  const analyticalPlan = buildAnalyticalPlanV1({ evidenceLedger, lensSelection });
  const structuredFindings = buildStructuredFindingsV1({ evidenceLedger, lensSelection, analyticalPlan });
  const legacyResult = runLegacy(caseDef);
  const shadowDecision = synthesizeDecisionV1({
    structuredFindings,
    evidenceLedger,
    lensSelection,
    legacyVerdict: legacyResult.legacyVerdict,
  });
  return {
    caseDef,
    evidenceLedger,
    lensSelection,
    analyticalPlan,
    structuredFindings,
    materialFindingIds: structuredFindings.findings
      .filter((finding) => finding.severity === "material")
      .map((finding) => finding.id),
    shadowDecision,
    legacyVerdict: legacyResult.legacyVerdict,
    legacyStatus: legacyResult.legacyStatus,
  };
}

function runLegacy(caseDef) {
  try {
    const result = executeBusinessIdeaValidation({
      rawInput: caseDef.rawInput,
      language: caseDef.locale || "en",
      source: "guided_discovery",
      feasibilityAnswers: { classificationConfirmation: "confirm" },
      content: contentEn,
    });
    return {
      legacyStatus: result.status || result.journeyState || result.route || "unknown",
      legacyVerdict: result.verdictKey || result.verdict || result.status || "",
    };
  } catch {
    return {
      legacyStatus: "legacy_unavailable",
      legacyVerdict: "legacy_unavailable",
    };
  }
}

function byId(id) {
  const result = results.find((item) => item.caseDef.id === id);
  assert.ok(result, `missing real case ${id}`);
  return result;
}

function findingFamily(id = "") {
  return id
    .replace(/^finding_/, "")
    .replace(/_(readiness|supported|dependency|evidence|unknown|conflict|failure|blocker|signal)$/, "");
}

function hasTraceableEvidenceOrUnknown(result, findingId) {
  const finding = result.structuredFindings.findings.find((item) => item.id === findingId);
  if (!finding) return false;
  return Boolean(finding.evidenceIds?.length || finding.unknownIds?.length);
}

function hasEvidenceLaundering(result) {
  const ownerItems = getEvidenceItemsByOrigin(result.evidenceLedger, EVIDENCE_ORIGINS.OWNER_DATA);
  const externalItems = getEvidenceItemsByOrigin(result.evidenceLedger, EVIDENCE_ORIGINS.EXTERNAL_EVIDENCE);
  const systemItems = getEvidenceItemsByOrigin(result.evidenceLedger, EVIDENCE_ORIGINS.SYSTEM_INFERENCE);
  return ownerItems.some((item) => /payment proof|validated demand|external evidence|willingness to pay/i.test(`${item.evidenceClass} ${item.limitations}`)) ||
    externalItems.length > 0 ||
    systemItems.some((item) => item.origin !== EVIDENCE_ORIGINS.SYSTEM_INFERENCE);
}
