import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDiscoveryState,
  confirmDiscoveryUnderstanding,
} from "./intentDiscoveryPrototype.js";
import { buildGuidedDiscoveryBivHandoff } from "./guidedDiscoveryHandoffMapper.js";
import { evaluateGuidedDiscoverySufficiency } from "./guidedDiscoverySufficiencyBridge.js";
import { adaptGuidedDiscoveryHandoffToBiv } from "./guidedDiscoveryBivAdapter.js";
import {
  BIV_BUSINESS_MODEL_LENS_VERSION,
  BUSINESS_MODEL_LENSES,
  LENS_CONFIDENCE,
  getBusinessModelLensDefinition,
  getBusinessModelLensDefinitionsV1,
  selectBusinessModelLensV1,
  validateBusinessModelLensSelectionV1,
} from "./businessModelLenses.js";
import {
  BIV_QUESTION_PURPOSE_MAP_VERSION,
  getQuestionPurpose,
  getQuestionPurposeMapV1,
} from "./questionPurposeMap.js";
import {
  BIV_EVIDENCE_LEDGER_VERSION,
  buildEvidenceLedgerV1,
} from "./evidenceLedger.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";
import contentEn from "./content.en.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const definitions = getBusinessModelLensDefinitionsV1();
assert.deepEqual(Object.keys(definitions).sort(), Object.values(BUSINESS_MODEL_LENSES).sort());
for (const lens of Object.values(BUSINESS_MODEL_LENSES)) {
  const definition = getBusinessModelLensDefinition(lens);
  assert.equal(definition.id, lens);
  assert.equal(definition.authority.determinesWhatToAnalyzeLater, true);
  assert.equal(definition.authority.determinesVerdict, false);
  assert.equal(definition.authority.changesRuntimeBehavior, false);
  assert.equal(definition.futureAnalyticalFocus.length > 0, true);
}

const benchmarkCases = [
  {
    name: "rental warehouses",
    input: {
      rawInput: {
        businessIdea: "Rental warehouses for small merchants that need flexible storage units.",
        targetCustomer: "Small merchants",
        problem: "They need flexible storage without long leases.",
        monetization: "Monthly warehouse rental.",
      },
    },
    primaryLens: BUSINESS_MODEL_LENSES.REAL_ESTATE,
  },
  {
    name: "technician platform",
    input: {
      canonicalInput: buildCanonicalGuidedInput({
        originalIdea: "A platform that connects homeowners with independent maintenance technicians.",
        selectedIntent: "marketplace",
        coreOffering: "Connecting customers and technicians",
        selectedOperatingApproach: "online",
        targetCustomer: "Homeowners and technicians",
        problem: "Customers struggle to find trusted technicians quickly.",
        monetization: "Commission on completed bookings.",
      }),
    },
    primaryLens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
    secondaryLens: BUSINESS_MODEL_LENSES.SERVICE,
  },
  {
    name: "packaging store",
    input: {
      rawInput: {
        businessIdea: "A packaging store that sells boxes, bags, and shipping supplies to small shops.",
        targetCustomer: "Small shop owners",
        problem: "They need reliable packaging supplies nearby.",
        monetization: "Sell packaging products with retail margin.",
      },
    },
    primaryLens: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
  },
  {
    name: "wholesale packaging distribution",
    input: {
      rawInput: {
        businessIdea: "Wholesale import and distribution of packaging materials to local retailers.",
        targetCustomer: "Retailers",
        problem: "They need steady packaging stock.",
        monetization: "Wholesale margin on bulk orders.",
      },
    },
    primaryLens: BUSINESS_MODEL_LENSES.WHOLESALE_IMPORT_DISTRIBUTION,
  },
  {
    name: "stainless workshop",
    input: {
      rawInput: {
        businessIdea: "A stainless manufacturing workshop that fabricates tables and shelves for restaurants.",
        targetCustomer: "Restaurants",
        problem: "They need custom stainless equipment.",
        monetization: "Sell fabricated equipment and installation.",
      },
    },
    primaryLens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
  },
  {
    name: "direct field service",
    input: {
      canonicalInput: buildCanonicalGuidedInput({
        originalIdea: "A mobile AC repair and maintenance service.",
        selectedIntent: "service",
        coreOffering: "AC repair",
        selectedOperatingApproach: "customer_site",
      }),
    },
    primaryLens: BUSINESS_MODEL_LENSES.SERVICE,
  },
  {
    name: "saas",
    input: {
      rawInput: {
        businessIdea: "SaaS software that helps small shops manage inventory and purchase orders.",
        targetCustomer: "Small shop owners",
        problem: "They lose time tracking stock manually.",
        monetization: "Monthly subscription.",
      },
    },
    primaryLens: BUSINESS_MODEL_LENSES.SAAS_SOFTWARE,
  },
  {
    name: "restaurant",
    input: {
      rawInput: {
        businessIdea: "A small restaurant serving healthy lunch meals near offices.",
        targetCustomer: "Office workers",
        problem: "They need fast healthy meals nearby.",
        monetization: "Customers pay per meal.",
      },
    },
    primaryLens: BUSINESS_MODEL_LENSES.FOOD_BEVERAGE,
  },
  {
    name: "existing business expansion",
    input: {
      rawInput: {
        businessIdea: "An existing manufacturer opening a new product line.",
        targetCustomer: "Industrial buyers",
        problem: "They need local custom parts.",
        monetization: "Sell manufactured parts.",
        stage: "expanding",
      },
    },
    primaryLens: BUSINESS_MODEL_LENSES.EXISTING_BUSINESS_EXPANSION,
    secondaryLens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
  },
  {
    name: "ambiguous idea",
    input: {
      rawInput: {
        businessIdea: "A new project that might help people.",
        targetCustomer: "People",
        problem: "Something is difficult.",
        monetization: "Maybe fees.",
      },
    },
    primaryLens: BUSINESS_MODEL_LENSES.GENERIC,
    confidence: LENS_CONFIDENCE.LOW,
  },
];

for (const testCase of benchmarkCases) {
  const selection = selectBusinessModelLensV1(testCase.input);
  assert.equal(validateBusinessModelLensSelectionV1(selection).ok, true, testCase.name);
  assert.equal(selection.version, BIV_BUSINESS_MODEL_LENS_VERSION);
  assert.equal(selection.primaryLens, testCase.primaryLens, testCase.name);
  if (testCase.secondaryLens) assert.equal(selection.secondaryLens, testCase.secondaryLens, testCase.name);
  if (testCase.confidence) assert.equal(selection.confidence, testCase.confidence, testCase.name);
  assert.equal(selection.rationale.includes("does not determine verdict"), true, testCase.name);
}

const confirmedSoftwareWithInventoryKeyword = selectBusinessModelLensV1({
  canonicalInput: buildCanonicalGuidedInput({
    originalIdea: "A software app for inventory workflows in small stores.",
    selectedIntent: "digital",
    coreOffering: "Inventory workflow software",
    selectedOperatingApproach: "online",
  }),
});
assert.equal(confirmedSoftwareWithInventoryKeyword.primaryLens, BUSINESS_MODEL_LENSES.SAAS_SOFTWARE);
assert.notEqual(confirmedSoftwareWithInventoryKeyword.primaryLens, BUSINESS_MODEL_LENSES.RETAIL_TRADING);
assert.equal(confirmedSoftwareWithInventoryKeyword.requiresConfirmation, false);

const equipmentHeavyCarWash = selectBusinessModelLensV1({
  canonicalInput: buildCanonicalGuidedInput({
    originalIdea: "A car wash service using washing equipment and a customer waiting area.",
    selectedIntent: "service",
    coreOffering: "Car wash",
    selectedOperatingApproach: "fixed_location",
  }),
});
assert.equal(equipmentHeavyCarWash.primaryLens, BUSINESS_MODEL_LENSES.SERVICE);
assert.notEqual(equipmentHeavyCarWash.primaryLens, BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL);
assert.equal(Boolean(equipmentHeavyCarWash.specialistCandidate), false);

const physicalGoodsMarketplace = selectBusinessModelLensV1({
  canonicalInput: buildCanonicalGuidedInput({
    originalIdea: "A marketplace that connects sellers and buyers for used physical goods.",
    selectedIntent: "marketplace",
    coreOffering: "Connecting sellers and buyers",
    selectedOperatingApproach: "online",
  }),
});
assert.equal(physicalGoodsMarketplace.primaryLens, BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM);
assert.notEqual(physicalGoodsMarketplace.primaryLens, BUSINESS_MODEL_LENSES.RETAIL_TRADING);

const directSalesManufacturer = selectBusinessModelLensV1({
  rawInput: {
    businessIdea: "A factory manufacturing custom furniture and selling directly to customers.",
    targetCustomer: "Homeowners",
    problem: "They need custom furniture sizes.",
    monetization: "Sell manufactured furniture directly.",
  },
});
assert.equal(directSalesManufacturer.primaryLens, BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL);

const conflictingConfirmedMeaning = selectBusinessModelLensV1({
  canonicalInput: buildCanonicalGuidedInput({
    originalIdea: "A platform that connects sellers and buyers.",
    selectedIntent: "service",
    coreOffering: "Marketplace platform",
    selectedOperatingApproach: "online",
  }),
});
assert.equal(conflictingConfirmedMeaning.primaryLens, BUSINESS_MODEL_LENSES.SERVICE);
assert.equal(conflictingConfirmedMeaning.confidence, LENS_CONFIDENCE.LOW);
assert.equal(conflictingConfirmedMeaning.requiresConfirmation, true);

const petRecycling = selectBusinessModelLensV1({
  rawInput: {
    businessIdea: "A PET plastic recycling factory that turns bottles into washed flakes.",
    targetCustomer: "Plastic packaging manufacturers",
    problem: "They need recycled feedstock.",
    monetization: "Sell flakes per ton.",
  },
});
assert.equal(petRecycling.primaryLens, BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL);
assert.equal(petRecycling.specialistCandidate.id, "pet_plastic_recycling");
assert.equal(petRecycling.specialistCandidate.runtimeInvoked, false);
assert.equal(Object.values(BUSINESS_MODEL_LENSES).includes("pet_plastic_recycling"), false);

const professionalLensCases = [
  ["bookkeeping service", "A bookkeeping service for small businesses.", "en"],
  ["accounting advisory firm", "An accounting advisory firm for small businesses.", "en"],
  ["tax consultancy", "A tax consultancy for small businesses.", "en"],
  ["engineering consultancy for factories", "An engineering consultancy for factories.", "en"],
  ["management consulting", "A management consulting firm for growing companies.", "en"],
  ["arabic bookkeeping", "خدمات مسك الدفاتر للشركات الصغيرة.", "ar"],
  ["arabic accounting advisory", "مكتب استشارات محاسبية للشركات الصغيرة.", "ar"],
  ["arabic tax consultancy", "استشارات ضريبية للشركات.", "ar"],
  ["arabic engineering consultancy", "استشارات هندسية للمصانع.", "ar"],
];
for (const [name, businessIdea, locale] of professionalLensCases) {
  const selection = selectBusinessModelLensV1({
    locale,
    rawInput: {
      businessIdea,
      targetCustomer: locale === "ar" ? "الشركات الصغيرة" : "Small businesses",
      problem: locale === "ar" ? "تحتاج إلى حكم مهني متخصص." : "They need specialized professional judgment.",
      monetization: locale === "ar" ? "اشتراك شهري أو أتعاب استشارية." : "Monthly retainer or advisory fee.",
    },
  });
  assert.equal(selection.primaryLens, BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES, name);
  assert.equal(selection.confidence, LENS_CONFIDENCE.HIGH, name);
}

const generalServiceControls = [
  ["ac maintenance service", "An AC maintenance service for homes.", "en"],
  ["technician service company", "A technician service company for homeowners.", "en"],
  ["arabic ac maintenance", "شركة صيانة مكيفات للمنازل.", "ar"],
];
for (const [name, businessIdea, locale] of generalServiceControls) {
  const selection = selectBusinessModelLensV1({
    locale,
    rawInput: {
      businessIdea,
      targetCustomer: locale === "ar" ? "ملاك المنازل" : "Homeowners",
      problem: locale === "ar" ? "تحتاج المكيفات إلى صيانة." : "They need reliable maintenance.",
      monetization: locale === "ar" ? "الدفع لكل زيارة." : "Pay per visit.",
    },
  });
  assert.equal(selection.primaryLens, BUSINESS_MODEL_LENSES.SERVICE, name);
  assert.notEqual(selection.primaryLens, BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES, name);
}

const customerIndustryOnlyProfessionalContext = selectBusinessModelLensV1({
  rawInput: {
    businessIdea: "AI service for accountants.",
    targetCustomer: "Accounting firms",
    problem: "They need faster document review.",
    monetization: "Monthly service retainer.",
  },
});
assert.equal(customerIndustryOnlyProfessionalContext.primaryLens, BUSINESS_MODEL_LENSES.SERVICE);

const genericIndustrial = selectBusinessModelLensV1({
  rawInput: {
    businessIdea: "An industrial workshop producing metal shelves.",
    targetCustomer: "Small factories",
    problem: "They need custom storage.",
    monetization: "Sell finished shelves.",
  },
});
assert.equal(genericIndustrial.primaryLens, BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL);
assert.equal(Boolean(genericIndustrial.specialistCandidate), false);

assert.equal(getQuestionPurposeMapV1().targetCustomer.version, undefined);
assert.equal(BIV_QUESTION_PURPOSE_MAP_VERSION, "biv_question_purpose_map_v1");
assert.ok(getQuestionPurpose("targetCustomer"));
assert.ok(getQuestionPurpose("startupCapital"));

const ledger = buildEvidenceLedgerV1({
  rawInput: {
    businessIdea: "A SaaS tool for restaurants.",
    targetCustomer: "Restaurants",
    problem: "They lose time on ordering.",
    monetization: "Monthly subscription.",
  },
});
assert.equal(ledger.version, BIV_EVIDENCE_LEDGER_VERSION);
assert.equal(ledger.items.some((item) => item.evidenceClass === "lens_selection"), false);

const runtimeCase = {
  rawInput: {
    businessIdea: "A mobile AC repair service for homeowners.",
    targetCustomer: "Homeowners",
    problem: "They need fast repairs when the AC fails.",
    monetization: "Customers pay per repair visit.",
  },
  language: "en",
  source: "guided_discovery",
  feasibilityAnswers: {
    classificationConfirmation: "confirm",
  },
  content: contentEn,
};
const before = executeBusinessIdeaValidation(runtimeCase);
selectBusinessModelLensV1({ rawInput: runtimeCase.rawInput });
const after = executeBusinessIdeaValidation(runtimeCase);
assert.equal(after.route, before.route);
assert.equal(after.journeyState, before.journeyState);
assert.deepEqual(after.score, before.score);
assert.equal(after.verdictKey, before.verdictKey);
assert.deepEqual(after.recommendation, before.recommendation);
assert.deepEqual(after.report.sections, before.report.sections);
assert.deepEqual(after.clarificationFlow, before.clarificationFlow);

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
  assert.equal(source.includes("businessModelLenses"), false, `${filePath} should not consume Business Model Lens Selection V1 at runtime`);
}

console.log("Business Model Lens Selection V1 tests: PASS");

function buildCanonicalGuidedInput({
  originalIdea,
  selectedIntent,
  coreOffering,
  selectedOperatingApproach,
  selectedOperatingApproaches = [],
  targetCustomer = "Owners",
  problem = "They need a clearer solution.",
  monetization = "Customers pay per order.",
}) {
  const discovery = confirmDiscoveryUnderstanding(buildDiscoveryState({
    originalIdea,
    selectedIntent,
    coreOffering,
    selectedOperatingApproach,
    selectedOperatingApproaches,
  }));
  const handoff = buildGuidedDiscoveryBivHandoff(discovery, {
    locale: "en",
    downstreamInput: {
      targetCustomer,
      problem,
      monetization,
    },
  });
  const sufficiency = evaluateGuidedDiscoverySufficiency(handoff, { locale: "en" });
  const adapted = adaptGuidedDiscoveryHandoffToBiv(handoff, sufficiency);
  assert.equal(adapted.ok, true);
  return adapted.canonicalInput;
}
