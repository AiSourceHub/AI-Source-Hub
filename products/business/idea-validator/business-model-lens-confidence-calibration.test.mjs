import assert from "node:assert/strict";
import {
  BUSINESS_MODEL_LENSES,
  LENS_CONFIDENCE,
  selectBusinessModelLensV1,
} from "./businessModelLenses.js";
import { collectClassificationEvidence } from "./classificationEvidence.js";

const requiredCases = [
  {
    name: "stainless restaurant equipment workshop",
    previous: { lens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL, confidence: LENS_CONFIDENCE.LOW },
    expected: { lens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL, confidence: LENS_CONFIDENCE.HIGH },
    input: {
      rawInput: {
        businessIdea: "A stainless restaurant equipment workshop that fabricates tables and shelves.",
        targetCustomer: "Restaurants and commercial kitchens",
        problem: "Restaurants need durable custom stainless equipment.",
        monetization: "Sell fabricated equipment and installation.",
      },
    },
  },
  {
    name: "restaurant inventory SaaS",
    previous: { lens: BUSINESS_MODEL_LENSES.SAAS_SOFTWARE, confidence: LENS_CONFIDENCE.LOW },
    expected: { lens: BUSINESS_MODEL_LENSES.SAAS_SOFTWARE, confidence: LENS_CONFIDENCE.HIGH },
    input: {
      rawInput: {
        businessIdea: "Restaurant inventory SaaS for ordering and stock control.",
        targetCustomer: "Restaurants",
        problem: "They lose time managing food inventory manually.",
        monetization: "Monthly software subscription.",
      },
    },
  },
  {
    name: "hospital maintenance service",
    previous: { lens: BUSINESS_MODEL_LENSES.SERVICE, confidence: LENS_CONFIDENCE.LOW },
    expected: { lens: BUSINESS_MODEL_LENSES.SERVICE, confidence: LENS_CONFIDENCE.HIGH },
    input: {
      rawInput: {
        businessIdea: "Mobile maintenance service for hospitals.",
        targetCustomer: "Hospitals",
        problem: "They need reliable equipment maintenance.",
        monetization: "Service contract or visit fee.",
      },
    },
  },
  {
    name: "contractor supplier marketplace",
    previous: { lens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM, confidence: LENS_CONFIDENCE.HIGH },
    expected: { lens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM, confidence: LENS_CONFIDENCE.HIGH },
    input: {
      rawInput: {
        businessIdea: "Marketplace connecting contractors and suppliers.",
        targetCustomer: "Contractors and suppliers",
        problem: "They need a reliable matching channel for construction materials.",
        monetization: "Commission on completed orders.",
      },
    },
  },
  {
    name: "packaging distributor for restaurants",
    previous: { lens: BUSINESS_MODEL_LENSES.WHOLESALE_IMPORT_DISTRIBUTION, confidence: LENS_CONFIDENCE.LOW },
    expected: { lens: BUSINESS_MODEL_LENSES.WHOLESALE_IMPORT_DISTRIBUTION, confidence: LENS_CONFIDENCE.HIGH },
    input: {
      rawInput: {
        businessIdea: "Distributor of packaging products to restaurants.",
        targetCustomer: "Restaurants",
        problem: "They need steady packaging stock.",
        monetization: "Wholesale margin on bulk orders.",
      },
    },
  },
  {
    name: "engineering consultancy for factories",
    previous: { lens: BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES, confidence: LENS_CONFIDENCE.LOW },
    expected: { lens: BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES, confidence: LENS_CONFIDENCE.HIGH },
    input: {
      rawInput: {
        businessIdea: "Engineering consultancy for factories.",
        targetCustomer: "Factories",
        problem: "They need expert process improvement advice.",
        monetization: "Advisory retainer.",
      },
    },
  },
  {
    name: "warehouse rental for logistics firms",
    previous: { lens: BUSINESS_MODEL_LENSES.REAL_ESTATE, confidence: LENS_CONFIDENCE.LOW },
    expected: { lens: BUSINESS_MODEL_LENSES.REAL_ESTATE, confidence: LENS_CONFIDENCE.HIGH },
    input: {
      rawInput: {
        businessIdea: "Warehouse rental for logistics firms.",
        targetCustomer: "Logistics firms",
        problem: "They need flexible storage near delivery routes.",
        monetization: "Monthly warehouse rental.",
      },
    },
  },
];

for (const testCase of requiredCases) {
  const selection = selectBusinessModelLensV1(testCase.input);
  assert.equal(selection.primaryLens, testCase.expected.lens, testCase.name);
  assert.equal(selection.confidence, testCase.expected.confidence, testCase.name);
  assert.equal(selection.requiresConfirmation, false, testCase.name);
  assert.equal(Boolean(selection.secondaryLens), false, testCase.name);
  assert.equal(
    selection.sourceSignals.some((signal) => signal.semanticRole === "customer_industry_signal"),
    false,
    `${testCase.name} should not expose customer industry as lens owner`
  );
}

const adversarialCases = [
  {
    name: "restaurant equipment ambiguous",
    input: {
      rawInput: {
        businessIdea: "Restaurant equipment.",
        targetCustomer: "Restaurants",
        problem: "They need equipment.",
        monetization: "",
      },
    },
    expectedLens: BUSINESS_MODEL_LENSES.FOOD_BEVERAGE,
    expectedConfidence: LENS_CONFIDENCE.LOW,
  },
  {
    name: "restaurant equipment store",
    input: {
      rawInput: {
        businessIdea: "Restaurant equipment store.",
        targetCustomer: "Restaurants",
        problem: "They need equipment.",
        monetization: "Sell equipment products.",
      },
    },
    expectedLens: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
  },
  {
    name: "restaurant equipment workshop",
    input: {
      rawInput: {
        businessIdea: "Restaurant equipment workshop.",
        targetCustomer: "Restaurants",
        problem: "They need custom equipment.",
        monetization: "Sell fabricated equipment.",
      },
    },
    expectedLens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
  },
  {
    name: "restaurant equipment marketplace",
    input: {
      rawInput: {
        businessIdea: "Restaurant equipment marketplace.",
        targetCustomer: "Restaurants and equipment suppliers",
        problem: "They need a trusted matching channel.",
        monetization: "Commission on orders.",
      },
    },
    expectedLens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
    expectedConfidence: LENS_CONFIDENCE.HIGH,
  },
];

for (const testCase of adversarialCases) {
  const selection = selectBusinessModelLensV1(testCase.input);
  assert.equal(selection.primaryLens, testCase.expectedLens, testCase.name);
  assert.equal(selection.confidence, testCase.expectedConfidence, testCase.name);
}

const genuineMixed = selectBusinessModelLensV1({
  rawInput: {
    businessIdea: "We manufacture products ourselves and operate a marketplace connecting independent manufacturers to buyers.",
    targetCustomer: "Business buyers and independent manufacturers",
    problem: "Buyers need custom products and manufacturers need orders.",
    monetization: "Sell our products and charge commission on third-party marketplace orders.",
  },
});
assert.equal(genuineMixed.primaryLens, BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM);
assert.equal(genuineMixed.secondaryLens, BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL);
assert.equal(genuineMixed.confidence, LENS_CONFIDENCE.LOW);
assert.equal(genuineMixed.requiresConfirmation, true);

const confirmedServiceWithHospitalContext = selectBusinessModelLensV1({
  canonicalInput: {
    locale: "en",
    rawInput: {
      businessIdea: "Cleaning service for hospitals.",
      targetCustomer: "Hospitals",
      problem: "They need reliable cleaning.",
      monetization: "Service contract.",
    },
    confirmedUnderstanding: {
      selectedIntent: "service",
      coreOffering: "Hospital cleaning",
      selectedOperatingApproach: "customer_site",
    },
  },
});
assert.equal(confirmedServiceWithHospitalContext.primaryLens, BUSINESS_MODEL_LENSES.SERVICE);
assert.equal(confirmedServiceWithHospitalContext.confidence, LENS_CONFIDENCE.HIGH);
assert.equal(confirmedServiceWithHospitalContext.requiresConfirmation, false);

const petRecycling = selectBusinessModelLensV1({
  rawInput: {
    businessIdea: "PET bottle recycling plant.",
    targetCustomer: "Packaging manufacturers",
    problem: "They need recycled input material.",
    monetization: "Sell washed flakes.",
  },
});
assert.equal(petRecycling.primaryLens, BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL);
assert.equal(petRecycling.specialistCandidate.id, "pet_plastic_recycling");

const recyclingEquipmentManufacturer = selectBusinessModelLensV1({
  rawInput: {
    businessIdea: "Manufacturer of equipment for recycling plants.",
    targetCustomer: "Recycling plants",
    problem: "They need reliable sorting equipment.",
    monetization: "Sell manufactured equipment.",
  },
});
assert.equal(recyclingEquipmentManufacturer.primaryLens, BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL);
assert.equal(Boolean(recyclingEquipmentManufacturer.specialistCandidate), false);

const arabicCases = [
  {
    name: "arabic stainless restaurant equipment workshop",
    expectedLens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
    input: {
      rawInput: {
        businessIdea: "ورشة تصنيع تجهيزات ستانلس للمطاعم.",
        targetCustomer: "المطاعم والمطابخ التجارية",
        problem: "يحتاجون إلى تجهيزات ستانلس مخصصة.",
        monetization: "بيع التجهيزات المصنعة مع التركيب.",
      },
    },
  },
  {
    name: "arabic restaurant inventory software",
    expectedLens: BUSINESS_MODEL_LENSES.SAAS_SOFTWARE,
    input: {
      rawInput: {
        businessIdea: "برنامج لإدارة مخزون المطاعم.",
        targetCustomer: "المطاعم",
        problem: "يضيع وقتهم في متابعة المخزون يدوياً.",
        monetization: "اشتراك شهري.",
      },
    },
  },
  {
    name: "arabic hospital maintenance service",
    expectedLens: BUSINESS_MODEL_LENSES.SERVICE,
    input: {
      rawInput: {
        businessIdea: "خدمة صيانة للمستشفيات.",
        targetCustomer: "المستشفيات",
        problem: "يحتاجون إلى صيانة موثوقة.",
        monetization: "عقد خدمة أو رسوم زيارة.",
      },
    },
  },
];

for (const testCase of arabicCases) {
  const selection = selectBusinessModelLensV1({ ...testCase.input, language: "ar" });
  assert.equal(selection.primaryLens, testCase.expectedLens, testCase.name);
  assert.notEqual(selection.confidence, LENS_CONFIDENCE.LOW, testCase.name);
}

const evidence = collectClassificationEvidence([
  { field: "businessIdea", value: "Restaurant inventory SaaS for restaurants." },
  { field: "targetCustomer", value: "Restaurants and cafes" },
]);
assert.equal(evidence.some((record) => record.semanticRole === "customer_industry_signal"), true);
assert.equal(evidence.some((record) => record.semanticRole === "business_model_signal"), true);

console.log("Business Model Lens Confidence Calibration V1 tests: PASS");
