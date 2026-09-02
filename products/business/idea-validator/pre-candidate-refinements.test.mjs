import assert from "node:assert/strict";
import {
  BIV_DECISION_AUTHORITY_MODES,
  BIV_DECISION_AUTHORITY_SOURCES,
  executeBusinessIdeaValidationWithAuthority,
} from "./decisionAuthority.js";
import { FINDING_EFFECTS } from "./analyticalFindings.js";
import { BUSINESS_MODEL_LENSES, LENS_CONFIDENCE, selectBusinessModelLensV1 } from "./businessModelLenses.js";
import { SHADOW_DECISION_STATES } from "./decisionSynthesis.js";
import contentEn from "./content.en.js";
import contentAr from "./content.ar.js";

const fallbackTaxonomyCases = [
  {
    caseId: "low_confidence_core_missing",
    rawInput: {
      businessIdea: "Business idea.",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
    expectedConfidence: "low",
    expectedReviewRequired: true,
    expectedFallback: "v2_low_confidence",
  },
  {
    caseId: "medium_confidence_review_required",
    rawInput: {
      businessIdea: "Packaging supplier.",
      targetCustomer: "Small retailers",
      problem: "They need packaging stock.",
      monetization: "Sell packaging products.",
    },
    expectedConfidence: "medium",
    expectedReviewRequired: true,
    expectedFallback: "v2_review_required",
  },
  {
    caseId: "high_confidence_no_review",
    rawInput: {
      businessIdea: "A meal prep kitchen with a local lunch subscription for office teams.",
      targetCustomer: "Office teams near the kitchen",
      problem: "Teams need reliable daily lunch delivery.",
      monetization: "Weekly prepaid meal subscription.",
    },
    v2Options: { additionalFindings: fullySupportedFindings() },
    expectedConfidence: "high",
    expectedReviewRequired: false,
    expectedFallback: "",
  },
  {
    caseId: "execution_error",
    rawInput: {
      businessIdea: "Mobile AC repair service.",
      targetCustomer: "Homeowners",
      problem: "AC units need repair.",
      monetization: "Pay per visit.",
    },
    v2Options: throwingOptions(),
    expectedFallback: "v2_execution_error",
  },
];

for (const testCase of fallbackTaxonomyCases) {
  const result = runAuthority(testCase);
  assert.equal(result.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY, testCase.caseId);
  if (testCase.expectedConfidence) {
    assert.equal(result.diagnostics.v2Confidence, testCase.expectedConfidence, testCase.caseId);
  }
  if (typeof testCase.expectedReviewRequired === "boolean") {
    assert.equal(result.v2Decision?.state === SHADOW_DECISION_STATES.PROCEED ? false : Boolean(result.fallbackUsed), testCase.expectedReviewRequired, testCase.caseId);
  }
  assert.equal(result.fallbackReason || "", testCase.expectedFallback, testCase.caseId);
}

const professionalLensCases = [
  ["bookkeeping_service", "A bookkeeping service for small businesses.", "en"],
  ["accounting_advisory", "An accounting advisory firm for small businesses.", "en"],
  ["tax_consultancy", "A tax consultancy for small businesses.", "en"],
  ["engineering_consultancy", "An engineering consultancy for factories.", "en"],
  ["management_consulting", "A management consulting firm for growing companies.", "en"],
  ["arabic_bookkeeping", "خدمات مسك الدفاتر للشركات الصغيرة.", "ar"],
  ["arabic_accounting_advisory", "مكتب استشارات محاسبية للشركات الصغيرة.", "ar"],
  ["arabic_tax_consultancy", "استشارات ضريبية للشركات.", "ar"],
  ["arabic_engineering_consultancy", "استشارات هندسية للمصانع.", "ar"],
];

for (const [caseId, businessIdea, locale] of professionalLensCases) {
  const selection = selectBusinessModelLensV1({
    locale,
    rawInput: {
      businessIdea,
      targetCustomer: locale === "ar" ? "الشركات الصغيرة" : "Small businesses",
      problem: locale === "ar" ? "تحتاج إلى حكم مهني متخصص." : "They need specialized professional judgment.",
      monetization: locale === "ar" ? "أتعاب شهرية." : "Monthly retainer.",
    },
  });
  assert.equal(selection.primaryLens, BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES, caseId);
  assert.equal(selection.confidence, LENS_CONFIDENCE.HIGH, caseId);
}

const serviceControls = [
  ["ac_maintenance", "An AC maintenance service for homes.", "en"],
  ["technician_service", "A technician service company for homeowners.", "en"],
  ["arabic_ac_maintenance", "شركة صيانة مكيفات للمنازل.", "ar"],
];

for (const [caseId, businessIdea, locale] of serviceControls) {
  const selection = selectBusinessModelLensV1({
    locale,
    rawInput: {
      businessIdea,
      targetCustomer: locale === "ar" ? "ملاك المنازل" : "Homeowners",
      problem: locale === "ar" ? "تحتاج المكيفات إلى صيانة." : "They need reliable maintenance.",
      monetization: locale === "ar" ? "الدفع لكل زيارة." : "Pay per visit.",
    },
  });
  assert.equal(selection.primaryLens, BUSINESS_MODEL_LENSES.SERVICE, caseId);
}

const parityPairs = [
  {
    id: "service",
    en: {
      businessIdea: "Mobile AC repair service for homes.",
      targetCustomer: "Homeowners",
      problem: "AC units break and need repair.",
      monetization: "Pay per visit.",
    },
    ar: {
      businessIdea: "خدمة صيانة مكيفات متنقلة للمنازل.",
      targetCustomer: "ملاك المنازل",
      problem: "تتعطل المكيفات وتحتاج إلى إصلاح.",
      monetization: "الدفع لكل زيارة.",
    },
  },
  {
    id: "professional_services",
    en: {
      businessIdea: "A bookkeeping service for small businesses.",
      targetCustomer: "Small businesses",
      problem: "They need accurate financial records.",
      monetization: "Monthly retainer.",
    },
    ar: {
      businessIdea: "خدمات مسك الدفاتر للشركات الصغيرة.",
      targetCustomer: "الشركات الصغيرة",
      problem: "تحتاج إلى سجلات مالية دقيقة.",
      monetization: "أتعاب شهرية.",
    },
  },
  {
    id: "retail",
    en: {
      businessIdea: "A packaging store that sells boxes to small shops.",
      targetCustomer: "Small shops",
      problem: "They need packaging supplies nearby.",
      monetization: "Sell packaging products.",
    },
    ar: {
      businessIdea: "متجر يبيع مواد التغليف للمتاجر الصغيرة.",
      targetCustomer: "المتاجر الصغيرة",
      problem: "تحتاج إلى مواد تغليف قريبة.",
      monetization: "بيع مواد التغليف.",
    },
  },
  {
    id: "ambiguous_short",
    en: {
      businessIdea: "Business idea.",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
    ar: {
      businessIdea: "فكرة مشروع.",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
  },
  {
    id: "existing_business_expansion",
    en: {
      businessIdea: "Existing metal workshop adding a new stainless display shelf product line.",
      targetCustomer: "Restaurant and cafe operators",
      problem: "Existing customers request custom stainless display shelves.",
      monetization: "Sell made-to-order shelves with deposit before fabrication.",
      stage: "expanding",
    },
    ar: {
      businessIdea: "ورشة قائمة تضيف خط إنتاج رفوف ستانلس للمطاعم.",
      targetCustomer: "المطاعم والمقاهي",
      problem: "العملاء الحاليون يطلبون رفوف ستانلس مخصصة.",
      monetization: "بيع رفوف حسب الطلب مع دفعة مقدمة.",
      stage: "expanding",
    },
  },
  {
    id: "marketplace",
    en: {
      businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
      targetCustomer: "Homeowners and technicians",
      problem: "Customers need trusted technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
    ar: {
      businessIdea: "منصة تربط ملاك المنازل بالفنيين المستقلين.",
      targetCustomer: "ملاك المنازل والفنيون",
      problem: "يحتاج العملاء إلى فنيين موثوقين بسرعة.",
      monetization: "عمولة على الحجوزات المكتملة.",
    },
  },
];

for (const pair of parityPairs) {
  const en = runAuthority({ rawInput: pair.en, language: "en" });
  const ar = runAuthority({ rawInput: pair.ar, language: "ar" });
  assert.equal(en.v2Decision?.state, ar.v2Decision?.state, `${pair.id}: state parity`);
  assert.equal(en.diagnostics.v2Confidence, ar.diagnostics.v2Confidence, `${pair.id}: confidence parity`);
  assert.equal(en.fallbackReason || "", ar.fallbackReason || "", `${pair.id}: fallback parity`);
  assert.equal(en.diagnostics.disagreementCategory, ar.diagnostics.disagreementCategory, `${pair.id}: disagreement parity`);
  assert.equal(en.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY, `${pair.id}: English authority`);
  assert.equal(ar.authoritativeSource, BIV_DECISION_AUTHORITY_SOURCES.LEGACY, `${pair.id}: Arabic authority`);
}

function runAuthority({
  rawInput,
  language = "en",
  v2Options = {},
}) {
  return executeBusinessIdeaValidationWithAuthority({
    rawInput,
    language,
    content: language === "ar" ? contentAr : contentEn,
    feasibilityAnswers: { classificationConfirmation: "confirm" },
    authorityMode: BIV_DECISION_AUTHORITY_MODES.DUAL_RUN,
    v2Options,
  });
}

function throwingOptions() {
  const options = {};
  Object.defineProperty(options, "additionalFindings", {
    enumerable: true,
    get() {
      throw new Error("simulated V2 execution failure");
    },
  });
  return options;
}

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
    reason: "The fixture supplies traceable support for this controlled refinement test.",
    evidenceIds: [`external_evidence__${id}`],
    unknownIds: [],
    confidence: "high",
    severity: "material",
    effect: FINDING_EFFECTS.SUPPORTS,
    whatWouldChangeIt: "Contradictory evidence would downgrade the decision.",
    limitations: "Test fixture evidence only; not production authority.",
  };
}

console.log("Pre-Candidate Refinements tests: PASS");
