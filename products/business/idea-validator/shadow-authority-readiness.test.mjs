import assert from "node:assert/strict";
import { buildEvidenceLedgerV1 } from "./evidenceLedger.js";
import {
  BUSINESS_MODEL_LENSES,
  LENS_CONFIDENCE,
  selectBusinessModelLensV1,
  validateBusinessModelLensSelectionV1,
} from "./businessModelLenses.js";
import { buildAnalyticalPlanV1, validateAnalyticalPlanV1 } from "./analyticalPlan.js";
import { buildStructuredFindingsV1, validateStructuredFindingsV1 } from "./analyticalFindings.js";
import {
  SHADOW_DECISION_STATES,
  synthesizeDecisionV1,
  validateDecisionSynthesisV1,
} from "./decisionSynthesis.js";
import {
  getShadowDecisionEvaluationFixturesV1,
  runShadowDecisionEvaluationV1,
} from "./shadowDecisionEvaluation.js";

const requiredReadinessCases = [
  {
    id: "restaurant_equipment",
    expectation: "ambiguous",
    expectedLens: BUSINESS_MODEL_LENSES.FOOD_BEVERAGE,
    expectedConfidence: LENS_CONFIDENCE.LOW,
    rawInput: {
      businessIdea: "Restaurant equipment.",
      targetCustomer: "Restaurants",
      problem: "They need equipment.",
      monetization: "",
    },
  },
  {
    id: "restaurant_equipment_workshop",
    expectedLens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
    rawInput: {
      businessIdea: "Restaurant equipment workshop.",
      targetCustomer: "Restaurants",
      problem: "They need custom equipment.",
      monetization: "Sell fabricated equipment.",
    },
  },
  {
    id: "restaurant_equipment_store",
    expectedLens: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
    rawInput: {
      businessIdea: "Restaurant equipment store.",
      targetCustomer: "Restaurants",
      problem: "They need nearby equipment inventory.",
      monetization: "Sell equipment products.",
    },
  },
  {
    id: "restaurant_equipment_marketplace",
    expectedLens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
    rawInput: {
      businessIdea: "Restaurant equipment marketplace.",
      targetCustomer: "Restaurants and equipment suppliers",
      problem: "They need a trusted matching channel.",
      monetization: "Commission on completed orders.",
    },
  },
  {
    id: "packaging_supplier",
    expectation: "ambiguous",
    expectedLens: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
    expectedConfidence: LENS_CONFIDENCE.LOW,
    rawInput: {
      businessIdea: "Packaging supplier.",
      targetCustomer: "Small retailers",
      problem: "They need packaging stock.",
      monetization: "Sell packaging products.",
    },
  },
  {
    id: "packaging_distributor",
    expectedLens: BUSINESS_MODEL_LENSES.WHOLESALE_IMPORT_DISTRIBUTION,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
    rawInput: {
      businessIdea: "Packaging distributor for restaurants.",
      targetCustomer: "Restaurants",
      problem: "They need steady packaging stock.",
      monetization: "Wholesale margin on bulk orders.",
    },
  },
  {
    id: "technician_platform",
    expectation: "ambiguous",
    expectedLens: BUSINESS_MODEL_LENSES.GENERIC,
    expectedConfidence: LENS_CONFIDENCE.LOW,
    rawInput: {
      businessIdea: "Technician platform.",
      targetCustomer: "Homeowners and technicians",
      problem: "They need trusted technicians quickly.",
      monetization: "Commission on bookings.",
    },
  },
  {
    id: "technician_service_company_using_app",
    expectedLens: BUSINESS_MODEL_LENSES.SERVICE,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
    rawInput: {
      businessIdea: "Technician service company using an app.",
      targetCustomer: "Homeowners",
      problem: "They need fast repair scheduling.",
      monetization: "Service visit fees.",
    },
  },
  {
    id: "ai_service_for_accountants",
    expectedLens: BUSINESS_MODEL_LENSES.SERVICE,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
    rawInput: {
      businessIdea: "AI service for accountants.",
      targetCustomer: "Accounting firms",
      problem: "They need faster document review.",
      monetization: "Monthly service retainer.",
    },
  },
  {
    id: "accounting_saas",
    expectedLens: BUSINESS_MODEL_LENSES.SAAS_SOFTWARE,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
    rawInput: {
      businessIdea: "Accounting SaaS.",
      targetCustomer: "Small businesses",
      problem: "They need bookkeeping automation.",
      monetization: "Monthly software subscription.",
    },
  },
  {
    id: "furniture_business",
    expectation: "ambiguous",
    expectedLens: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
    expectedConfidence: LENS_CONFIDENCE.LOW,
    rawInput: {
      businessIdea: "Furniture business.",
      targetCustomer: "Households",
      problem: "They need furniture.",
      monetization: "Sales.",
    },
  },
  {
    id: "furniture_factory",
    expectedLens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
    rawInput: {
      businessIdea: "Furniture factory.",
      targetCustomer: "Retailers",
      problem: "They need furniture supply.",
      monetization: "Sell manufactured furniture.",
    },
  },
  {
    id: "furniture_importer",
    expectedLens: BUSINESS_MODEL_LENSES.WHOLESALE_IMPORT_DISTRIBUTION,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
    rawInput: {
      businessIdea: "Furniture importer.",
      targetCustomer: "Retail furniture stores",
      problem: "They need imported furniture stock.",
      monetization: "Wholesale margin.",
    },
  },
  {
    id: "existing_company_adding_service_line",
    expectedLens: BUSINESS_MODEL_LENSES.EXISTING_BUSINESS_EXPANSION,
    expectedSecondaryLens: BUSINESS_MODEL_LENSES.SERVICE,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
    rawInput: {
      businessIdea: "Existing company adding a maintenance service line.",
      targetCustomer: "Current customers",
      problem: "They need support after purchase.",
      monetization: "Service contract.",
      stage: "expanding",
    },
  },
  {
    id: "short_vague_arabic_business_description",
    locale: "ar",
    expectation: "insufficient",
    expectedLens: BUSINESS_MODEL_LENSES.GENERIC,
    expectedConfidence: LENS_CONFIDENCE.LOW,
    rawInput: {
      businessIdea: "فكرة مشروع.",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
  },
  {
    id: "short_vague_english_business_description",
    expectation: "insufficient",
    expectedLens: BUSINESS_MODEL_LENSES.GENERIC,
    expectedConfidence: LENS_CONFIDENCE.LOW,
    rawInput: {
      businessIdea: "Business idea.",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
  },
];

const results = requiredReadinessCases.map(runReadinessCase);

for (const result of results) {
  const { caseDef, lensSelection, analyticalPlan, structuredFindings, shadowDecision } = result;
  assert.equal(validateBusinessModelLensSelectionV1(lensSelection).ok, true, caseDef.id);
  assert.equal(validateAnalyticalPlanV1(analyticalPlan).ok, true, caseDef.id);
  assert.equal(validateStructuredFindingsV1(structuredFindings).ok, true, caseDef.id);
  assert.equal(validateDecisionSynthesisV1(shadowDecision).ok, true, caseDef.id);
  assert.equal(lensSelection.primaryLens, caseDef.expectedLens, caseDef.id);
  assert.equal(lensSelection.confidence, caseDef.expectedConfidence, caseDef.id);
  assert.equal(lensSelection.secondaryLens || "", caseDef.expectedSecondaryLens || "", caseDef.id);
  assert.equal(shadowDecision.authority.shadowOnly, true, caseDef.id);
  assert.equal(shadowDecision.authority.determinesProductionVerdict, false, caseDef.id);
  assert.equal(shadowDecision.authority.affectsScore, false, caseDef.id);
  assert.equal(shadowDecision.authority.affectsReport, false, caseDef.id);
  assert.equal(shadowDecision.authority.changesRuntimeBehavior, false, caseDef.id);
  assert.doesNotMatch(JSON.stringify(shadowDecision), /production verdict|final report|approved for launch/i, caseDef.id);
}

for (const result of results.filter((item) => item.caseDef.expectation === "ambiguous")) {
  assert.equal(result.lensSelection.requiresConfirmation, true, result.caseDef.id);
  assert.equal(result.lensSelection.confidence, LENS_CONFIDENCE.LOW, result.caseDef.id);
  assert.notEqual(result.shadowDecision.state, SHADOW_DECISION_STATES.PROCEED, result.caseDef.id);
}

for (const result of results.filter((item) => item.caseDef.expectation === "insufficient")) {
  assert.equal(result.lensSelection.primaryLens, BUSINESS_MODEL_LENSES.GENERIC, result.caseDef.id);
  assert.equal(result.shadowDecision.state, SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION, result.caseDef.id);
  assert.equal(result.shadowDecision.criticalUnknownIds.length > 0, true, result.caseDef.id);
}

const explicitHighConfidenceCases = [
  "restaurant_equipment_workshop",
  "restaurant_equipment_store",
  "restaurant_equipment_marketplace",
  "packaging_distributor",
  "technician_service_company_using_app",
  "ai_service_for_accountants",
  "accounting_saas",
  "furniture_factory",
  "furniture_importer",
  "existing_company_adding_service_line",
];
for (const id of explicitHighConfidenceCases) {
  const result = byId(id);
  assert.equal(result.lensSelection.confidence, LENS_CONFIDENCE.HIGH, id);
  assert.equal(result.lensSelection.requiresConfirmation, false, id);
}

const mediumClassificationSupport = selectBusinessModelLensV1({
  rawInput: {
    businessIdea: "A business for local customers.",
    targetCustomer: "Local customers",
    problem: "They need easier access.",
    monetization: "Service fees.",
  },
  classification: {
    proposedClassification: { primaryType: "service" },
    classificationConfidence: "high",
  },
});
assert.equal(mediumClassificationSupport.primaryLens, BUSINESS_MODEL_LENSES.SERVICE);
assert.equal(mediumClassificationSupport.confidence, LENS_CONFIDENCE.MEDIUM);
assert.equal(mediumClassificationSupport.requiresConfirmation, true);

const wrongLensAdversarialCases = [
  {
    id: "factory_consulting",
    expectedLens: BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES,
    rawInput: {
      businessIdea: "Factory consulting.",
      targetCustomer: "Factories",
      problem: "They need process improvement advice.",
      monetization: "Advisory retainer.",
    },
  },
  {
    id: "retail_inventory_software",
    expectedLens: BUSINESS_MODEL_LENSES.SAAS_SOFTWARE,
    rawInput: {
      businessIdea: "Retail inventory software.",
      targetCustomer: "Retail shops",
      problem: "They need stock control.",
      monetization: "Monthly subscription.",
    },
  },
  {
    id: "hospital_marketplace",
    expectedLens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
    rawInput: {
      businessIdea: "Hospital marketplace connecting clinics with equipment suppliers.",
      targetCustomer: "Clinics and suppliers",
      problem: "They need procurement matching.",
      monetization: "Commission.",
    },
  },
  {
    id: "automotive_training_service",
    expectedLens: BUSINESS_MODEL_LENSES.SERVICE,
    rawInput: {
      businessIdea: "Automotive training service.",
      targetCustomer: "Mechanics",
      problem: "They need practical training.",
      monetization: "Course fees.",
    },
  },
];

for (const caseDef of wrongLensAdversarialCases) {
  const result = runReadinessCase(caseDef);
  assert.equal(result.lensSelection.primaryLens, caseDef.expectedLens, caseDef.id);
  assert.equal(result.lensSelection.confidence, LENS_CONFIDENCE.HIGH, caseDef.id);
}

const crossLanguagePairs = [
  [
    {
      id: "technician_platform_en",
      rawInput: {
        businessIdea: "Marketplace platform that connects homeowners with independent technicians.",
        targetCustomer: "Homeowners and technicians",
        problem: "They need trusted matching.",
        monetization: "Commission on bookings.",
      },
    },
    {
      id: "technician_platform_ar",
      locale: "ar",
      rawInput: {
        businessIdea: "منصة تربط أصحاب المنازل بالفنيين المستقلين.",
        targetCustomer: "أصحاب المنازل والفنيون",
        problem: "يحتاجون إلى قناة موثوقة للتواصل.",
        monetization: "عمولة على الحجوزات.",
      },
    },
  ],
  [
    {
      id: "restaurant_equipment_workshop_en",
      rawInput: {
        businessIdea: "Restaurant equipment workshop.",
        targetCustomer: "Restaurants",
        problem: "They need custom equipment.",
        monetization: "Sell fabricated equipment.",
      },
    },
    {
      id: "restaurant_equipment_workshop_ar",
      locale: "ar",
      rawInput: {
        businessIdea: "ورشة تصنيع تجهيزات للمطاعم.",
        targetCustomer: "المطاعم",
        problem: "تحتاج إلى تجهيزات مخصصة.",
        monetization: "بيع التجهيزات المصنعة.",
      },
    },
  ],
  [
    {
      id: "packaging_supplier_en",
      rawInput: {
        businessIdea: "Packaging supplier.",
        targetCustomer: "Small retailers",
        problem: "They need packaging stock.",
        monetization: "Sell packaging products.",
      },
    },
    {
      id: "packaging_supplier_ar",
      locale: "ar",
      rawInput: {
        businessIdea: "مورد مواد تغليف.",
        targetCustomer: "المتاجر الصغيرة",
        problem: "تحتاج إلى مخزون تغليف.",
        monetization: "بيع منتجات التغليف.",
      },
    },
  ],
  [
    {
      id: "furniture_workshop_en",
      rawInput: {
        businessIdea: "Furniture workshop that manufactures custom tables.",
        targetCustomer: "Households and offices",
        problem: "They need custom furniture.",
        monetization: "Sell manufactured furniture.",
      },
    },
    {
      id: "furniture_workshop_ar",
      locale: "ar",
      rawInput: {
        businessIdea: "ورشة تصنيع أثاث مخصص.",
        targetCustomer: "الأسر والمكاتب",
        problem: "يحتاجون إلى أثاث مخصص.",
        monetization: "بيع الأثاث المصنع.",
      },
    },
  ],
];

for (const [englishCase, arabicCase] of crossLanguagePairs) {
  const english = runReadinessCase(englishCase);
  const arabic = runReadinessCase(arabicCase);
  assert.equal(arabic.lensSelection.primaryLens, english.lensSelection.primaryLens, englishCase.id);
  assert.equal(arabic.lensSelection.confidence, english.lensSelection.confidence, englishCase.id);
  assert.equal(arabic.shadowDecision.state, english.shadowDecision.state, englishCase.id);
}

const existingHarness = runShadowDecisionEvaluationV1({ fixtures: getShadowDecisionEvaluationFixturesV1() });
assert.equal(existingHarness.results.length >= 33, true);
assert.equal(existingHarness.results.every((result) => validateDecisionSynthesisV1(result.shadowDecision).ok), true);
assert.equal(existingHarness.results.every((result) => result.shadowDecision.authority.shadowOnly === true), true);
assert.equal(existingHarness.results.every((result) => result.shadowDecision.authority.determinesProductionVerdict === false), true);
assert.equal(existingHarness.results.some((result) => result.shadowDecision.state === SHADOW_DECISION_STATES.PROCEED), true);
assert.equal(existingHarness.results.some((result) => result.shadowDecision.state === SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION), true);

console.log("Shadow Authority Readiness tests: PASS");

function runReadinessCase(caseDef) {
  const evidenceLedger = buildEvidenceLedgerV1({ rawInput: caseDef.rawInput });
  const lensSelection = selectBusinessModelLensV1({
    rawInput: caseDef.rawInput,
    locale: caseDef.locale || "en",
    classification: caseDef.classification || {},
  });
  const analyticalPlan = buildAnalyticalPlanV1({ evidenceLedger, lensSelection });
  const structuredFindings = buildStructuredFindingsV1({ evidenceLedger, lensSelection, analyticalPlan });
  const shadowDecision = synthesizeDecisionV1({ structuredFindings, evidenceLedger, lensSelection });
  return {
    caseDef,
    evidenceLedger,
    lensSelection,
    analyticalPlan,
    structuredFindings,
    shadowDecision,
  };
}

function byId(id) {
  const result = results.find((item) => item.caseDef.id === id);
  assert.ok(result, `missing readiness case ${id}`);
  return result;
}
