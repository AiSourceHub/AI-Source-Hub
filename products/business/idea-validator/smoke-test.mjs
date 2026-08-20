import { executeValidation as executeProductValidation } from "./index.js";
import contentAr from "./content.ar.js";
import contentEn from "./content.en.js";
import { inputSchema } from "./schema.js";
import { readFileSync } from "node:fs";
import { buildIndustrialReportText } from "./industrialAnalysis.js";
import { buildFeasibilityFoundation } from "./feasibilityFoundation.js";
import { orchestrateBusinessIdeaValidation } from "./validatorOrchestrator.js";
import { BIV_VALID_JOURNEY_STATES, resolveBusinessIdeaJourneyState } from "./executionResult.js";
import {
  assessBusinessIdeaRequest,
  industrialClarificationFields,
  industrialClarificationSteps,
} from "./requestUnderstanding.js";

const pageSource = readFileSync(new URL("../../../src/pages/BusinessIdeaValidatorPage.jsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../../../src/styles.css", import.meta.url), "utf8");
const orchestratorSource = readFileSync(new URL("./validatorOrchestrator.js", import.meta.url), "utf8");
const classificationEvidenceSource = readFileSync(new URL("./classificationEvidence.js", import.meta.url), "utf8");

const defaultPhase3Answers = {
  userExperienceLevel: "first_time_beginner",
  firstProject: "yes",
  projectStageIntent: "initial_idea",
  country: "Saudi Arabia",
  city: "Riyadh",
  decisionObjective: "Decide whether to continue testing before spending money.",
  classificationConfirmation: "confirm",
};

const defaultPhase3AnswersAr = {
  userExperienceLevel: "first_time_beginner",
  firstProject: "yes",
  projectStageIntent: "initial_idea",
  country: "السعودية",
  city: "الرياض",
  decisionObjective: "أريد معرفة هل أستمر قبل صرف المال.",
  classificationConfirmation: "confirm",
};

function phase3DefaultsFor(language = "en") {
  return language === "ar" ? defaultPhase3AnswersAr : defaultPhase3Answers;
}

function executeValidation(rawInput, language = "en", industrialDetails = {}, feasibilityAnswers = {}) {
  return executeProductValidation(rawInput, language, industrialDetails, {
    ...phase3DefaultsFor(language),
    ...feasibilityAnswers,
  });
}

function executeUnconfirmedValidation(rawInput, language = "en", industrialDetails = {}, feasibilityAnswers = {}) {
  return executeProductValidation(rawInput, language, industrialDetails, feasibilityAnswers);
}

const cases = [
  {
    name: "strong English",
    language: "en",
    input: {
      businessIdea:
        "A subscription inventory planning tool for independent restaurants that predicts weekly ingredient needs.",
      targetCustomer: "Independent restaurant owners with one to three locations.",
      problem:
        "They waste money every week because food inventory is overordered, forgotten, or spoiled.",
      monetization: "Monthly subscription per restaurant location.",
    },
    expectOk: true,
  },
  {
    name: "weak vague",
    language: "en",
    input: {
      businessIdea: "A platform",
      targetCustomer: "everyone",
      problem: "not sure",
      monetization: "not sure",
    },
    expectOk: true,
  },
  {
    name: "arabic",
    language: "ar",
    input: {
      businessIdea: "تطبيق يساعد المطاعم الصغيرة على توقع احتياجات المخزون الأسبوعية",
      targetCustomer: "أصحاب المطاعم الصغيرة في المدن الكبرى",
      problem: "يهدرون المال أسبوعياً بسبب طلب كميات زائدة من المكونات",
      monetization: "اشتراك شهري لكل فرع",
    },
    expectOk: true,
  },
  {
    name: "contradictory",
    language: "en",
    input: {
      businessIdea: "A fitness coaching app for students",
      targetCustomer: "University students",
      problem: "Enterprise finance teams lose time reconciling invoices manually every month.",
      monetization: "Monthly subscription.",
    },
    expectOk: true,
  },
  {
    name: "empty",
    language: "en",
    input: {
      businessIdea: "",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
    expectOk: false,
  },
];

const results = cases.map((testCase) => {
  const result = executeValidation(testCase.input, testCase.language);
  const passed = result.ok === testCase.expectOk;

  return {
    name: testCase.name,
    passed,
    ok: result.ok,
    state: result.state,
    total: result.score?.total ?? null,
    verdict: result.verdictKey ?? null,
  };
});

const failed = results.filter((result) => !result.passed);

console.log(JSON.stringify(results, null, 2));

const arabicCopyPassed =
  contentAr.fields.problemSolved === "ما المشكلة التي تريد حلها؟" &&
  contentAr.fields.currentSolution === "كيف يحل العميل هذه المشكلة حاليًا؟" &&
  contentAr.helpText.problemSolved === "صف المشكلة التي يواجهها العميل باختصار." &&
  contentAr.helpText.currentSolution === "مثال: يبحث بنفسه، يسأل الآخرين، يستخدم خدمة أخرى، أو لا يفعل شيئًا." &&
  contentEn.fields.currentSolution === "Current customer workaround" &&
  inputSchema.find((field) => field.id === "problem")?.label.ar === "ما المشكلة التي تريد حلها؟" &&
  inputSchema.find((field) => field.id === "problem")?.helpText.ar ===
    "صف المشكلة التي يواجهها العميل باختصار.";

console.log(JSON.stringify({ arabicCopyPassed }, null, 2));

if (!arabicCopyPassed) {
  process.exitCode = 1;
}

const personalizationCases = [
  {
    name: "restaurant need risk",
    language: "en",
    input: {
      businessIdea: "A meal planning assistant for independent restaurants",
      targetCustomer: "Independent restaurant owners with one to three locations",
      problem: "They sometimes need help planning menus",
      currentSolution: "A simple weekly planning dashboard",
      competitiveAdvantage: "Fast setup using each restaurant's existing menu",
      monetization: "Monthly subscription",
      stage: "idea",
    },
  },
  {
    name: "clinic need risk",
    language: "en",
    input: {
      businessIdea: "A scheduling reminder service for small clinics",
      targetCustomer: "Small private clinics in Riyadh",
      problem: "Patients sometimes miss appointments",
      currentSolution: "Automated WhatsApp appointment reminders",
      competitiveAdvantage: "Arabic-first reminders tailored to local clinic workflows",
      monetization: "Monthly service fee",
      stage: "idea",
    },
  },
];

const personalizationResults = personalizationCases.map((testCase) => {
  const result = executeValidation(testCase.input, testCase.language);
  return {
    name: testCase.name,
    ok: result.ok,
    weakest: result.criteria?.reduce((min, c) => (c.score < min.score ? c : min), result.criteria[0])?.key,
    biggestRisk: result.biggestRisk,
    nextAction: result.nextAction,
  };
});

const personalizationPassed =
  personalizationResults.every((result) => result.ok && result.weakest === "marketNeed") &&
  personalizationResults[0].biggestRisk !== personalizationResults[1].biggestRisk &&
  personalizationResults[0].nextAction !== personalizationResults[1].nextAction &&
  personalizationResults.every((result) => !/that\s+(They|Patients)\b/.test(result.biggestRisk)) &&
  personalizationResults[0].biggestRisk.includes("Independent restaurant owners") &&
  personalizationResults[0].biggestRisk.includes("weekly planning dashboard") &&
  personalizationResults[0].nextAction.includes("at least 6") &&
  personalizationResults[1].biggestRisk.includes("Small private clinics") &&
  personalizationResults[1].biggestRisk.includes("WhatsApp appointment reminders");

console.log(JSON.stringify({ personalizationPassed, personalizationResults }, null, 2));

if (!personalizationPassed) {
  process.exitCode = 1;
}

const stakeholderRoleCases = [
  {
    name: "simple direct customer idea",
    language: "en",
    input: {
      businessIdea: "A guided meal prep planner for busy parents",
      targetCustomer: "Busy parents who cook at home",
      problem: "They lose time every week deciding meals and grocery lists.",
      monetization: "Monthly subscription paid by the parent.",
    },
    expectAmbiguity: false,
  },
  {
    name: "healthcare user differs from buyer",
    language: "en",
    input: {
      businessIdea: "A medication follow-up dashboard for small clinics",
      targetCustomer: "Small clinics whose nurses manage chronic patients",
      problem: "Patients miss medication routines and nurses need follow-up visibility.",
      monetization: "Monthly license per clinic.",
    },
    expectAmbiguity: true,
  },
  {
    name: "b2b software employee user differs from budget owner",
    language: "en",
    input: {
      businessIdea: "A workflow assistant that helps employees prepare weekly compliance reports",
      targetCustomer: "Operations employees at mid-sized companies",
      problem: "Employees waste hours gathering data for recurring reports.",
      monetization: "Monthly subscription.",
    },
    expectAmbiguity: true,
  },
  {
    name: "marketplace buyer and provider roles",
    language: "en",
    input: {
      businessIdea: "A marketplace that connects homeowners with maintenance technicians",
      targetCustomer: "Homeowners and independent technicians",
      problem: "Homeowners struggle to find available technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
    expectAmbiguity: true,
  },
  {
    name: "retail commerce direct buyer",
    language: "en",
    input: {
      businessIdea: "An online store for refillable cleaning products",
      targetCustomer: "Urban shoppers who buy household cleaning supplies",
      problem: "They want affordable refills without visiting multiple stores.",
      monetization: "Customers pay per order.",
    },
    expectAmbiguity: false,
  },
  {
    name: "light manufacturing institutional buyer",
    language: "en",
    input: {
      businessIdea: "A small workshop that produces custom metal brackets for factories",
      targetCustomer: "Factories that need small batches of custom brackets",
      problem: "Factories wait too long for small custom parts from large suppliers.",
      monetization: "Factories pay per approved order.",
    },
    expectAmbiguity: false,
  },
  {
    name: "ambiguous multi-role business model",
    language: "en",
    input: {
      businessIdea: "A platform for employees and companies to manage wellbeing rewards",
      targetCustomer: "Employees and companies",
      problem: "Employees want useful rewards and companies want better engagement.",
      monetization: "Subscription fee.",
    },
    expectAmbiguity: true,
  },
  {
    name: "arabic buyer and payer ambiguity",
    language: "ar",
    input: {
      businessIdea: "نظام يساعد الموظفين والشركات على إدارة مكافآت الرفاهية",
      targetCustomer: "الموظفون والشركات",
      problem: "الموظفون يريدون مكافآت مفيدة والشركات تريد رفع التفاعل.",
      monetization: "اشتراك شهري.",
    },
    expectAmbiguity: true,
  },
];

const stakeholderRoleResults = stakeholderRoleCases.map((testCase) => {
  const result = executeValidation(testCase.input, testCase.language);
  const roles = result.recommendation?.interpretedContext?.stakeholderRoles || {};
  const text = `${result.biggestRisk || ""} ${result.nextAction || ""} ${result.criteria?.map((item) => item.reason).join(" ") || ""}`;
  return {
    name: testCase.name,
    ok: result.ok,
    total: result.score?.total ?? null,
    hasRoleAmbiguity: Boolean(roles.hasRoleAmbiguity),
    expectedAmbiguity: testCase.expectAmbiguity,
    hasInternalLabelLeak: /\b(endUser|payerStatus|approverStatus|providerOperator|hasRoleAmbiguity)\b/.test(text),
    roles,
    text,
  };
});

const stakeholderDirectCase = stakeholderRoleResults.find((result) => result.name === "simple direct customer idea");
const stakeholderAmbiguousCase = stakeholderRoleResults.find((result) => result.name === "ambiguous multi-role business model");
const arabicStakeholderCase = stakeholderRoleResults.find((result) => result.name === "arabic buyer and payer ambiguity");

const stakeholderRolesPassed =
  stakeholderRoleResults.every((result) => result.ok) &&
  stakeholderRoleResults.every((result) => result.hasRoleAmbiguity === result.expectedAmbiguity) &&
  stakeholderRoleResults.every((result) => !result.hasInternalLabelLeak) &&
  stakeholderDirectCase?.total >= 50 &&
  stakeholderAmbiguousCase?.text.includes("Who pays?") &&
  stakeholderAmbiguousCase?.text.includes("Who approves or chooses the purchase?") &&
  arabicStakeholderCase?.text.includes("من سيدفع") &&
  arabicStakeholderCase?.text.includes("من يوافق على الشراء") &&
  !/[A-Za-z]/.test(arabicStakeholderCase?.text || "");

console.log(JSON.stringify({ stakeholderRolesPassed, stakeholderRoleResults }, null, 2));

if (!stakeholderRolesPassed) {
  process.exitCode = 1;
}

const evidenceCases = [
  {
    name: "idea assumptions no validation",
    language: "en",
    input: {
      businessIdea: "A mobile checklist for first-time apartment renters",
      targetCustomer: "Young professionals renting their first apartment",
      problem: "They forget important setup tasks and lose time calling providers.",
      monetization: "Small one-time purchase.",
      stage: "idea",
    },
    expectSupport: "none",
    expectUnsupportedClaims: false,
  },
  {
    name: "strong demand claim without evidence",
    language: "en",
    input: {
      businessIdea: "A premium delivery service for office snacks",
      targetCustomer: "Small office managers",
      problem: "There is huge demand and customers will buy because offices need this every week.",
      monetization: "Monthly subscription.",
      stage: "idea",
    },
    expectUnsupportedClaims: true,
  },
  {
    name: "customer interviews support problem",
    language: "en",
    input: {
      businessIdea: "A booking assistant for independent fitness coaches",
      targetCustomer: "Independent fitness coaches",
      problem: "We interviewed 12 coaches and 8 said scheduling no-shows cost them weekly revenue.",
      monetization: "Monthly subscription.",
      stage: "idea",
    },
    expectCustomerEvidence: true,
  },
  {
    name: "actual paying customers",
    language: "en",
    input: {
      businessIdea: "A template library for freelance consultants",
      targetCustomer: "Independent consultants",
      problem: "Consultants waste time writing repeat project documents.",
      monetization: "We have 7 paying customers and recurring monthly revenue.",
      stage: "launched",
    },
    expectPaymentEvidence: true,
  },
  {
    name: "b2b pilot with employee users and management buyer",
    language: "en",
    input: {
      businessIdea: "A customer-support handover tool used by frontline employees",
      targetCustomer: "Support employees at B2B software companies",
      problem: "A pilot with 18 employees reduced missed customer handover notes.",
      monetization: "Management approved a paid pilot license per site.",
      stage: "mvp",
    },
    expectCustomerEvidence: true,
    expectPaymentEvidence: true,
    expectRoleAmbiguity: false,
  },
  {
    name: "supplier quotation supports cost assumptions",
    language: "en",
    input: {
      businessIdea: "A local assembly service for custom retail displays",
      targetCustomer: "Small retail chains opening new branches",
      problem: "Stores wait weeks for small display batches.",
      monetization: "Supplier quote received for material costs; stores pay per approved display order.",
      stage: "idea",
    },
    expectOperationalEvidence: true,
  },
  {
    name: "healthcare service unvalidated demand",
    language: "en",
    input: {
      businessIdea: "A home follow-up service for patients after minor procedures",
      targetCustomer: "Private clinics and recovering patients",
      problem: "Patients need support after discharge and clinics want fewer calls.",
      monetization: "Monthly service fee.",
      stage: "idea",
    },
    expectSupport: "none",
    expectRoleAmbiguity: true,
  },
  {
    name: "industrial supplier and buyer evidence",
    language: "en",
    input: {
      businessIdea: "A light manufacturing workshop for custom food packaging inserts",
      targetCustomer: "Local food producers",
      problem: "Producers wait too long for small custom insert batches.",
      monetization: "We have supplier pricing for raw material and two buyer price discussions for trial batches.",
      stage: "idea",
    },
    expectOperationalEvidence: true,
  },
  {
    name: "idea stage conflicts with established revenue",
    language: "en",
    input: {
      businessIdea: "A team analytics dashboard for remote sales teams",
      targetCustomer: "Sales managers at small companies",
      problem: "Managers lose time checking activity across tools.",
      monetization: "We have 15 paying customers, retention evidence, and monthly recurring revenue.",
      stage: "idea",
    },
    expectStageConflict: true,
    expectPaymentEvidence: true,
  },
  {
    name: "arabic unsupported demand claim",
    language: "ar",
    input: {
      businessIdea: "خدمة توصيل وجبات صحية للموظفين",
      targetCustomer: "الموظفون في الشركات الصغيرة",
      problem: "هناك طلب كبير والموظفون يحتاجون هذه الخدمة يومياً.",
      monetization: "اشتراك شهري.",
      stage: "idea",
    },
    expectUnsupportedClaims: true,
  },
  {
    name: "arabic customer interviews",
    language: "ar",
    input: {
      businessIdea: "تطبيق يساعد المعلمين المستقلين على تنظيم الحجوزات",
      targetCustomer: "المعلمون المستقلون",
      problem: "قابلنا 10 معلمين وأكد 7 منهم أن تنظيم المواعيد يضيع وقتهم أسبوعياً.",
      monetization: "اشتراك شهري.",
      stage: "idea",
    },
    expectCustomerEvidence: true,
  },
];

const evidenceResults = evidenceCases.map((testCase) => {
  const result = executeValidation(testCase.input, testCase.language);
  const evidence = result.recommendation?.interpretedContext?.evidenceSignals || {};
  const roles = result.recommendation?.interpretedContext?.stakeholderRoles || {};
  const text = `${result.biggestRisk || ""} ${result.nextAction || ""} ${result.criteria?.map((item) => item.reason).join(" ") || ""}`;
  return {
    name: testCase.name,
    ok: result.ok,
    total: result.score?.total ?? null,
    supportLevel: evidence.supportLevel,
    hasCustomerEvidence: Boolean(evidence.hasCustomerEvidence),
    hasPaymentEvidence: Boolean(evidence.hasPaymentEvidence),
    hasOperationalEvidence: Boolean(evidence.hasOperationalEvidence),
    hasUnsupportedClaims: Boolean(evidence.hasUnsupportedClaims),
    hasStageConflict: Boolean(evidence.hasStageEvidenceConflict),
    hasRoleAmbiguity: Boolean(roles.hasRoleAmbiguity),
    contradictionCodes: result.contradictions?.map((item) => item.code) || [],
    hasInternalLabelLeak: /\b(supportLevel|hasUnsupportedClaims|hasPaymentEvidence|hasCustomerEvidence|strongestEvidence)\b/.test(text),
    saysProven: /(?<!not\s)\bproven\b|مثبت تماماً|مؤكد تماماً/.test(text),
    nextAction: result.nextAction || "",
    text,
    expected: testCase,
  };
});

const evidenceAssumptionCase = evidenceResults.find((result) => result.name === "idea assumptions no validation");
const evidenceDemandClaim = evidenceResults.find((result) => result.name === "strong demand claim without evidence");
const evidenceArabicDemandClaim = evidenceResults.find((result) => result.name === "arabic unsupported demand claim");
const evidenceStageConflict = evidenceResults.find((result) => result.name === "idea stage conflicts with established revenue");
const evidenceB2bPilot = evidenceResults.find((result) => result.name === "b2b pilot with employee users and management buyer");

const evidenceSignalsPassed =
  evidenceResults.every((result) => result.ok) &&
  evidenceResults.every((result) => !result.hasInternalLabelLeak && !result.saysProven) &&
  evidenceResults.every((result) => result.expected.expectSupport ? result.supportLevel === result.expected.expectSupport : true) &&
  evidenceResults.every((result) => result.expected.expectCustomerEvidence ? result.hasCustomerEvidence : true) &&
  evidenceResults.every((result) => result.expected.expectPaymentEvidence ? result.hasPaymentEvidence : true) &&
  evidenceResults.every((result) => result.expected.expectOperationalEvidence ? result.hasOperationalEvidence : true) &&
  evidenceResults.every((result) => result.expected.expectUnsupportedClaims ? result.hasUnsupportedClaims : true) &&
  evidenceResults.every((result) => result.expected.expectStageConflict ? result.hasStageConflict && result.contradictionCodes.includes("stage_evidence_mismatch") : true) &&
  evidenceResults.every((result) => result.expected.expectRoleAmbiguity !== undefined ? result.hasRoleAmbiguity === result.expected.expectRoleAmbiguity : true) &&
  evidenceAssumptionCase?.total >= 45 &&
  !/assumption|افتراض/.test(evidenceAssumptionCase?.text || "") &&
  evidenceDemandClaim?.text.includes("demand claim needs customer evidence") &&
  evidenceDemandClaim?.nextAction !== "" &&
  evidenceArabicDemandClaim?.text.includes("ادعاء الطلب يحتاج إلى دليل من العملاء") &&
  !/[A-Za-z]/.test(evidenceArabicDemandClaim?.text || "") &&
  evidenceStageConflict?.supportLevel === "strong" &&
  evidenceB2bPilot?.supportLevel === "strong";

console.log(JSON.stringify({ evidenceSignalsPassed, evidenceResults }, null, 2));

if (!evidenceSignalsPassed) {
  process.exitCode = 1;
}

const regulatoryCases = [
  {
    name: "simple consumer service no approval dependency",
    language: "en",
    input: {
      businessIdea: "A home closet organization service",
      targetCustomer: "Busy apartment renters",
      problem: "They lose time finding clothes and reorganizing storage every month.",
      monetization: "Customers pay a fixed service fee.",
      stage: "idea",
    },
    expectStatus: "none",
  },
  {
    name: "healthcare licensed professional dependency",
    language: "en",
    input: {
      businessIdea: "A home follow-up service that requires licensed nurses",
      targetCustomer: "Private clinics and recovering patients",
      problem: "Patients forget aftercare steps and clinics receive repeated calls.",
      monetization: "Clinics pay a monthly service fee.",
      stage: "idea",
    },
    expectStatus: "required",
  },
  {
    name: "food retail possible permit dependency",
    language: "en",
    input: {
      businessIdea: "A weekend meal prep kiosk for office workers",
      targetCustomer: "Office workers in business districts",
      problem: "They spend too much time finding healthy lunches.",
      monetization: "Customers pay per meal box; we may need a food permit.",
      stage: "idea",
    },
    expectStatus: "needs_clarification",
  },
  {
    name: "b2b software vendor approval",
    language: "en",
    input: {
      businessIdea: "A vendor onboarding dashboard for enterprise procurement teams",
      targetCustomer: "Procurement managers at mid-sized companies",
      problem: "Teams lose time collecting supplier documents.",
      monetization: "Enterprise subscription after vendor approval and security review.",
      stage: "mvp",
    },
    expectStatus: "needs_clarification",
  },
  {
    name: "marketplace platform approval",
    language: "en",
    input: {
      businessIdea: "A plugin marketplace seller tool that depends on app store approval",
      targetCustomer: "Independent software plugin makers",
      problem: "They lose sales when listings are delayed.",
      monetization: "Monthly subscription.",
      stage: "idea",
    },
    expectStatus: "needs_clarification",
  },
  {
    name: "import dependent commerce",
    language: "en",
    input: {
      businessIdea: "An online shop importing specialty equipment for small workshops",
      targetCustomer: "Small workshop owners",
      problem: "They wait weeks to source replacement parts.",
      monetization: "Margin on imported products after customs clearance.",
      stage: "idea",
    },
    expectStatus: "needs_clarification",
  },
  {
    name: "light manufacturing facility approval",
    language: "en",
    input: {
      businessIdea: "A small workshop producing custom metal brackets",
      targetCustomer: "Local contractors",
      problem: "Contractors wait too long for small custom batches.",
      monetization: "Pay per order; factory permit and site inspection are pending.",
      stage: "idea",
    },
    expectStatus: "required",
  },
  {
    name: "approval already obtained",
    language: "en",
    input: {
      businessIdea: "A mobile food cart for office districts",
      targetCustomer: "Office workers near transit hubs",
      problem: "They need quick lunches during short breaks.",
      monetization: "Pay per meal; permit obtained and inspection passed.",
      stage: "mvp",
    },
    expectStatus: "obtained",
  },
  {
    name: "ambiguous approval should be clarified",
    language: "en",
    input: {
      businessIdea: "A delivery service for prescription refills",
      targetCustomer: "Families caring for elderly patients",
      problem: "They lose time coordinating repeat refills.",
      monetization: "Monthly delivery membership.",
      stage: "idea",
    },
    expectStatus: "needs_clarification",
  },
  {
    name: "arabic required approval dependency",
    language: "ar",
    input: {
      businessIdea: "خدمة متابعة منزلية تتطلب ممرض مرخص",
      targetCustomer: "العيادات الخاصة والمرضى بعد الخروج",
      problem: "ينسى المرضى تعليمات الرعاية وتكثر اتصالات المتابعة.",
      monetization: "اشتراك شهري تدفعه العيادة.",
      stage: "idea",
    },
    expectStatus: "required",
  },
  {
    name: "arabic obtained approval",
    language: "ar",
    input: {
      businessIdea: "عربة طعام متنقلة للموظفين",
      targetCustomer: "الموظفون في مناطق الأعمال",
      problem: "يحتاجون غداء سريعاً خلال وقت قصير.",
      monetization: "الدفع لكل وجبة، وحصلنا على تصريح واجتزنا التفتيش.",
      stage: "mvp",
    },
    expectStatus: "obtained",
  },
];

const regulatoryResults = regulatoryCases.map((testCase) => {
  const result = executeValidation(testCase.input, testCase.language);
  const dependency = result.recommendation?.interpretedContext?.regulatoryDependencies || {};
  const feasibility = result.criteria?.find((item) => item.key === "feasibility");
  const text = `${result.biggestRisk || ""} ${result.nextAction || ""} ${feasibility?.reason || ""}`;
  return {
    name: testCase.name,
    ok: result.ok,
    total: result.score?.total ?? null,
    status: dependency.status,
    isMaterial: Boolean(dependency.isMaterial),
    hasUnresolvedApproval: Boolean(dependency.hasUnresolvedApproval),
    needsClarification: Boolean(dependency.needsClarification),
    contradictionCodes: result.contradictions?.map((item) => item.code) || [],
    feasibilityReason: feasibility?.reason || "",
    hasInternalLabelLeak: /\b(regulatoryDependencies|dependencyType|hasUnresolvedApproval|needsClarification|approvalTerms)\b/.test(text),
    hasApprovalAction:
      /approval path|permit|license|certification|authorization|vendor approval|security review|customs|مسار|تصريح|ترخيص|اعتماد|تفتيش|موافقة/.test(text),
    englishLeakInArabic: testCase.language === "ar" ? /approval path|vendor approval|security review|customs/.test(text) : false,
    text,
    expected: testCase,
  };
});

const simpleRegulatoryCase = regulatoryResults.find((result) => result.name === "simple consumer service no approval dependency");
const requiredRegulatoryCase = regulatoryResults.find((result) => result.name === "healthcare licensed professional dependency");
const obtainedRegulatoryCase = regulatoryResults.find((result) => result.name === "approval already obtained");
const arabicRequiredRegulatoryCase = regulatoryResults.find((result) => result.name === "arabic required approval dependency");

const regulatoryDependenciesPassed =
  regulatoryResults.every((result) => result.ok) &&
  regulatoryResults.every((result) => result.status === result.expected.expectStatus) &&
  regulatoryResults.every((result) => !result.hasInternalLabelLeak && !result.englishLeakInArabic) &&
  simpleRegulatoryCase?.isMaterial === false &&
  requiredRegulatoryCase?.hasApprovalAction === true &&
  requiredRegulatoryCase?.contradictionCodes.includes("external_approval_unresolved") &&
  obtainedRegulatoryCase?.hasUnresolvedApproval === false &&
  obtainedRegulatoryCase?.needsClarification === false &&
  arabicRequiredRegulatoryCase?.hasApprovalAction === true;

console.log(JSON.stringify({ regulatoryDependenciesPassed, regulatoryResults }, null, 2));

if (!regulatoryDependenciesPassed) {
  process.exitCode = 1;
}

const feasibilityFoundationCases = [
  {
    name: "industrial receives industrial feasibility questions",
    language: "en",
    input: {
      businessIdea: "A small manufacturing workshop producing custom metal brackets",
      targetCustomer: "Local contractors",
      problem: "Contractors wait too long for small custom batches.",
      monetization: "Pay per approved order.",
    },
    expectType: "industrial_manufacturing",
    expectRequiredCategories: ["equipmentTools", "inventoryMaterials", "operatingCapacity"],
  },
  {
    name: "service receives labor and delivery questions",
    language: "en",
    input: {
      businessIdea: "A mobile car cleaning service for office parking lots",
      targetCustomer: "Office employees with limited time",
      problem: "They lose weekend time handling basic car cleaning.",
      monetization: "Customers pay per cleaning visit.",
    },
    expectType: "service",
    expectQuestionText: ["Who will deliver the service", "clients, visits, sessions, or jobs"],
  },
  {
    name: "digital does not receive machinery or raw material questions",
    language: "en",
    input: {
      businessIdea: "A SaaS dashboard that automates weekly reporting for sales teams",
      targetCustomer: "Sales managers at small software companies",
      problem: "Managers lose time collecting weekly updates from several tools.",
      monetization: "Monthly subscription per team.",
    },
    expectType: "digital_software",
    forbiddenCategories: ["inventoryMaterials"],
    forbiddenText: ["raw materials", "machinery"],
  },
  {
    name: "marketplace receives two-sided operating questions",
    language: "en",
    input: {
      businessIdea: "A marketplace platform connecting homeowners with maintenance providers",
      targetCustomer: "Homeowners and independent technicians",
      problem: "Homeowners struggle to find available technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
    expectType: "marketplace_platform",
    expectQuestionText: ["both sides", "providers", "buyers"],
  },
  {
    name: "known answers are not asked again",
    language: "en",
    input: {
      businessIdea: "A retail shop selling imported spare parts",
      targetCustomer: "Small workshop owners",
      problem: "They wait weeks for replacement parts.",
      monetization: "Margin on products. Budget 120,000 SAR. Location Riyadh. Inventory from two suppliers. Monthly rent and payroll are estimated.",
    },
    expectType: "retail_trading",
    forbiddenCategories: ["startupCapital", "locationPremises", "inventoryMaterials", "recurringCosts"],
  },
  {
    name: "calculated estimate is separated from fact and assumption",
    language: "en",
    input: {
      businessIdea: "A mobile service for repairing office printers",
      targetCustomer: "Small offices",
      problem: "Printer failures interrupt daily work.",
      monetization: "Per-visit service fee. Startup cost calculated from 2 technician kits x 6,000 SAR plus one vehicle.",
    },
    expectType: "service",
    expectStatus: { startupCapital: "calculated_estimate", equipmentTools: "calculated_estimate" },
  },
  {
    name: "insufficient evidence blocks false precision",
    language: "en",
    input: {
      businessIdea: "A professional training service for new managers",
      targetCustomer: "Small company managers",
      problem: "They make repeated hiring and feedback mistakes.",
      monetization: "Per-seat workshop fee.",
    },
    expectType: "service",
    expectCanEstimate: false,
    expectPrecision: "not_trustworthy",
  },
  {
    name: "arabic service feasibility questions",
    language: "ar",
    input: {
      businessIdea: "خدمة صيانة منزلية سريعة للأسر",
      targetCustomer: "الأسر في المدن الكبيرة",
      problem: "يتأخرون في إيجاد مساعدة موثوقة عند حدوث أعطال متكررة.",
      monetization: "الدفع لكل زيارة.",
    },
    expectType: "service",
    expectArabic: true,
    expectQuestionText: ["من سيقدم الخدمة", "كم عميلاً"],
  },
  {
    name: "generic fallback remains domain agnostic",
    language: "en",
    input: {
      businessIdea: "A membership offer for a local community of creators",
      targetCustomer: "Independent creators",
      problem: "They need a structured way to stay accountable every week.",
      monetization: "Monthly membership.",
    },
    expectType: "generic",
    expectRequiredCategories: ["startupCapital", "recurringCosts", "implementationTimeline"],
  },
];

const feasibilityFoundationResults = feasibilityFoundationCases.map((testCase) => {
  const foundation = buildFeasibilityFoundation(testCase.input, testCase.language);
  const requiredCategories = foundation.requiredQuestions.map((question) => question.category);
  const questionText = foundation.requiredQuestions.map((question) => question.question).join(" ");
  const allQuestionText = [...foundation.requiredQuestions, ...foundation.optionalQuestions]
    .map((question) => `${question.question} ${question.evidenceRequired}`)
    .join(" ");
  const statuses = Object.fromEntries(foundation.categories.map((item) => [item.category, item.evidenceType]));

  return {
    name: testCase.name,
    type: foundation.businessType,
    direction: foundation.direction,
    requiredCategories,
    optionalCategories: foundation.optionalQuestions.map((question) => question.category),
    estimateReadiness: foundation.estimateReadiness,
    statuses,
    hasRequiredCategories: (testCase.expectRequiredCategories || []).every((category) => requiredCategories.includes(category)),
    hasQuestionText: (testCase.expectQuestionText || []).every((text) => questionText.includes(text)),
    hasForbiddenCategories: (testCase.forbiddenCategories || []).some((category) => requiredCategories.includes(category)),
    hasForbiddenText: (testCase.forbiddenText || []).some((text) => allQuestionText.toLowerCase().includes(text.toLowerCase())),
    hasEnglishLeakInArabic: testCase.expectArabic ? /What|Which|How|State whether|Startup capital/.test(allQuestionText) : false,
    expected: testCase,
  };
});

const feasibilityFoundationPassed =
  feasibilityFoundationResults.every((result) => result.type === result.expected.expectType) &&
  feasibilityFoundationResults.every((result) => result.hasRequiredCategories) &&
  feasibilityFoundationResults.every((result) => result.hasQuestionText) &&
  feasibilityFoundationResults.every((result) => !result.hasForbiddenCategories && !result.hasForbiddenText) &&
  feasibilityFoundationResults.every((result) =>
    result.expected.expectCanEstimate === undefined
      ? true
      : result.estimateReadiness.canEstimate === result.expected.expectCanEstimate
  ) &&
  feasibilityFoundationResults.every((result) =>
    result.expected.expectPrecision ? result.estimateReadiness.precision === result.expected.expectPrecision : true
  ) &&
  feasibilityFoundationResults.every((result) =>
    result.expected.expectStatus
      ? Object.entries(result.expected.expectStatus).every(([category, status]) => result.statuses[category] === status)
      : true
  ) &&
  feasibilityFoundationResults.every((result) => !result.hasEnglishLeakInArabic) &&
  feasibilityFoundationResults.find((result) => result.name === "known answers are not asked again")?.statuses.startupCapital !== "unresolved_unknown" &&
  feasibilityFoundationResults.find((result) => result.name === "known answers are not asked again")?.statuses.recurringCosts === "assumption";

const feasibilityIntegrationResult = executeValidation(
  {
    businessIdea: "A SaaS dashboard for weekly sales reporting",
    targetCustomer: "Sales managers at small software companies",
    problem: "Managers lose time collecting updates every week.",
    monetization: "Monthly subscription per team.",
  },
  "en"
);
const feasibilityIntegrationPassed =
  feasibilityIntegrationResult.evaluationStatus === "evaluated" &&
  feasibilityIntegrationResult.feasibilityFoundation?.type === "capital_operational_feasibility_foundation" &&
  feasibilityIntegrationResult.feasibilityFoundation?.businessType === "digital_software";

console.log(JSON.stringify({ feasibilityFoundationPassed, feasibilityIntegrationPassed, feasibilityFoundationResults }, null, 2));

if (!feasibilityFoundationPassed || !feasibilityIntegrationPassed) {
  process.exitCode = 1;
}

const guidedFeasibilityArabicSeed = executeUnconfirmedValidation(
  {
    businessIdea: "مغسلة سيارات آلية",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "ar"
);

const guidedFeasibilityQuestion = executeUnconfirmedValidation(
  {
    businessIdea: "مغسلة سيارات آلية",
    targetCustomer: "أصحاب السيارات في الأحياء السكنية",
    problem: "كم تكلف الفكرة وما المعدات والتراخيص والعمالة المطلوبة؟",
    monetization: "الدفع لكل عملية غسيل.",
  },
  "ar"
);

const guidedFeasibilityCompleted = executeProductValidation(
  {
    businessIdea: "مغسلة سيارات آلية في موقع ثابت",
    targetCustomer: "أصحاب السيارات في الأحياء السكنية",
    problem: "يريدون غسل السيارة بسرعة وبجودة ثابتة دون انتظار طويل.",
    monetization: "يدفع العميل مقابل كل عملية غسيل.",
  },
  "ar",
  {},
  {
    userExperienceLevel: "first_time_beginner",
    firstProject: "yes",
    projectStageIntent: "initial_idea",
    country: "السعودية",
    city: "الرياض",
    decisionObjective: "أريد معرفة هل أستمر قبل صرف المال.",
    classificationConfirmation: "confirm",
    operatingFormat: "fixed_site",
    deliveryModel: "آلي مع إشراف عاملين",
    targetCustomerPromise: "أصحاب السيارات يحصلون على غسيل سريع ومنظم",
    targetCapacity: "40 سيارة يومياً",
    premisesStatus: "rented",
    budgetRange: "300,000 إلى 500,000 ريال",
    quotationStatus: "لا توجد عروض معدات بعد",
    equipmentLevel: "معدات آلية متوسطة",
    utilitiesNeeds: "ماء وكهرباء وتصريف وإعادة استخدام للمياه",
    staffingPlan: "مشغلان ومحاسب وفني صيانة",
    licensesDependencies: "ترخيص البلدية غير معروف",
    suppliersDependencies: "مورد معدات ومواد تنظيف ومقاول صيانة",
    knownFacts: "تم تحديد فكرة المشروع فقط",
    researchNeeded: "تكلفة المعدات ومسار الترخيص وتكلفة التشغيل",
    assumptionsToValidate: "عدد السيارات اليومي وسعر الخدمة المناسب",
  }
);

const guidedFeasibilityEnglishQuestion = executeUnconfirmedValidation(
  {
    businessIdea: "An automated car wash",
    targetCustomer: "Drivers near residential neighborhoods",
    problem: "How much will it cost and what equipment, licenses, and staff are needed?",
    monetization: "Customers pay per wash.",
  },
  "en"
);

const phase3FixedCarWashAr = executeUnconfirmedValidation(
  {
    businessIdea: "أريد إنشاء مغسلة سيارات آلية في موقع ثابت بمدينة جدة، ويأتي العملاء بسياراتهم إلى المغسلة.",
    targetCustomer: "أصحاب السيارات في مدينة جدة",
    problem: "يريدون غسل السيارة بسرعة وبجودة ثابتة بدون انتظار طويل.",
    monetization: "يدفع العميل مقابل كل عملية غسيل.",
  },
  "ar",
  {},
  {
    userExperienceLevel: "first_time_beginner",
    firstProject: "yes",
    projectStageIntent: "initial_idea",
    country: "السعودية",
    city: "جدة",
    decisionObjective: "أريد معرفة هل أستمر.",
  }
);

const phase3MobileCarWashAr = executeUnconfirmedValidation(
  {
    businessIdea: "أريد إنشاء خدمة متنقلة لغسيل السيارات، وينتقل العامل والمعدات إلى منزل العميل أو موقف عمله.",
    targetCustomer: "أصحاب السيارات المشغولون",
    problem: "لا يجدون وقتاً مناسباً للذهاب إلى مغسلة سيارات.",
    monetization: "يدفع العميل مقابل كل زيارة.",
  },
  "ar",
  {},
  {
    userExperienceLevel: "first_time_beginner",
    firstProject: "yes",
    projectStageIntent: "initial_idea",
    country: "السعودية",
    city: "جدة",
    decisionObjective: "أريد معرفة هل أستمر.",
  }
);

const beginnerInitialIdea = executeUnconfirmedValidation(
  {
    businessIdea: "A simple home baking service",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    userExperienceLevel: "first_time_beginner",
    firstProject: "yes",
    projectStageIntent: "initial_idea",
    country: "Saudi Arabia",
    decisionObjective: "Know whether to continue.",
    classificationConfirmation: "confirm",
  }
);

const limitedExperienceInitialIdea = executeUnconfirmedValidation(
  {
    businessIdea: "A SaaS app for independent clinic scheduling",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    userExperienceLevel: "limited_experience",
    firstProject: "no",
    projectStageIntent: "initial_idea",
    country: "Saudi Arabia",
    decisionObjective: "Evaluate the idea before building.",
    classificationConfirmation: "confirm",
  }
);

const beginnerOperatingBusiness = executeUnconfirmedValidation(
  {
    businessIdea: "A neighborhood laundry shop that already operates",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    userExperienceLevel: "first_time_beginner",
    firstProject: "yes",
    projectStageIntent: "operating",
    country: "Saudi Arabia",
    decisionObjective: "Improve the current business.",
    classificationConfirmation: "confirm",
  }
);

const existingOwnerImproving = executeUnconfirmedValidation(
  {
    businessIdea: "A salon owner wants to reduce waiting time and improve repeat bookings",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    userExperienceLevel: "experienced_new_idea",
    firstProject: "no",
    projectStageIntent: "improving",
    country: "Saudi Arabia",
    decisionObjective: "Improve the current business.",
    classificationConfirmation: "confirm",
  }
);

const experiencedOwnerExpanding = executeUnconfirmedValidation(
  {
    businessIdea: "A profitable catering business wants to expand to a second production kitchen",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    userExperienceLevel: "experienced_new_idea",
    firstProject: "no",
    projectStageIntent: "expanding",
    country: "Saudi Arabia",
    decisionObjective: "Evaluate expansion.",
    classificationConfirmation: "confirm",
  }
);

const switchedProfile = executeUnconfirmedValidation(
  {
    businessIdea: "مغسلة سيارات آلية",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "ar",
  {},
  {
    userExperienceLevel: "limited_experience",
    firstProject: "no",
    projectStageIntent: "improving",
    country: "السعودية",
    city: "الرياض",
    decisionObjective: "أريد تطوير المشروع.",
    classificationConfirmation: "confirm",
  }
);

const guidedNormalIdea = executeValidation(
  {
    businessIdea: "A subscription inventory planning tool for independent restaurants",
    targetCustomer: "Independent restaurant owners with one to three locations.",
    problem: "They waste money every week because food inventory is overordered.",
    monetization: "Monthly subscription per restaurant location.",
  },
  "en"
);

const guidedIneligible = executeValidation(
  {
    businessIdea: "A phishing scam service that steals login details",
    targetCustomer: "People trying to commit identity theft",
    problem: "They need better ways to steal accounts.",
    monetization: "Monthly fee.",
  },
  "en"
);

const guidedAmbiguousFinance = executeValidation(
  {
    businessIdea:
      "A platform connects small businesses seeking funding with people providing funds in exchange for a periodic financial return.",
    targetCustomer: "Small businesses seeking funding",
    problem: "They need funding quickly.",
    monetization: "Fee on funded amounts with repayment period.",
  },
  "en"
);

const guidedFeasibilityPassed =
  guidedFeasibilityArabicSeed.evaluationStatus === "feasibility_followup" &&
  guidedFeasibilityArabicSeed.presentation.heading === "دعنا نفهم فكرتك بشكل أدق" &&
  guidedFeasibilityArabicSeed.clarificationFlow?.steps?.[0]?.fields?.some((field) => field.labelText === "أي وصف يناسبك أكثر؟") &&
  !guidedFeasibilityArabicSeed.clarificationFlow?.steps?.[0]?.fields?.some((field) => field.labelText === "هل هذا التصنيف يصف مشروعك بشكل صحيح؟") &&
  guidedFeasibilityArabicSeed.clarificationFlow?.steps?.[0]?.fields?.some((field) => field.labelText === "في أي مرحلة يوجد المشروع؟") &&
  !guidedFeasibilityArabicSeed.clarificationFlow?.steps?.some((step) => step.title === "رأس المال والمعدات") &&
  !guidedFeasibilityArabicSeed.clarificationFlow?.steps?.some((step) => step.title === "التشغيل") &&
  !guidedFeasibilityArabicSeed.clarificationFlow?.steps?.some((step) => step.title === "الأدلة والبحث") &&
  guidedFeasibilityQuestion.evaluationStatus === "feasibility_followup" &&
  guidedFeasibilityQuestion.clarificationFlow?.steps?.[0]?.fields?.some((field) => field.labelText === "هل هذا التصنيف يصف مشروعك بشكل صحيح؟") &&
  !guidedFeasibilityQuestion.score &&
  !guidedFeasibilityQuestion.biggestRisk &&
  !guidedFeasibilityQuestion.report &&
  guidedFeasibilityCompleted.evaluationStatus === "evaluated" &&
  Boolean(guidedFeasibilityCompleted.score) &&
  guidedFeasibilityEnglishQuestion.evaluationStatus === "feasibility_followup" &&
  guidedFeasibilityEnglishQuestion.presentation.heading === "Let’s understand your idea more clearly" &&
  guidedFeasibilityEnglishQuestion.clarificationFlow?.steps?.[0]?.fields?.some((field) => field.labelText === "Does this classification describe your business correctly?") &&
  phase3FixedCarWashAr.orchestrationDecision?.proposedClassification?.type !== "field_service" &&
  phase3FixedCarWashAr.orchestrationDecision?.proposedClassification?.primaryType === "generic" &&
  phase3FixedCarWashAr.orchestrationDecision?.proposedClassification?.operatingModel === "fixed_location" &&
  phase3FixedCarWashAr.orchestrationDecision?.proposedClassification?.reason.includes("موقع المشروع") &&
  phase3MobileCarWashAr.orchestrationDecision?.proposedClassification?.type === "field_service" &&
  phase3MobileCarWashAr.orchestrationDecision?.proposedClassification?.primaryType === "service" &&
  phase3MobileCarWashAr.orchestrationDecision?.proposedClassification?.operatingModel === "mobile_or_customer_site" &&
  beginnerInitialIdea.feasibilityGuidance?.userProfile?.adaptationStyle === "beginner" &&
  !beginnerInitialIdea.score &&
  limitedExperienceInitialIdea.feasibilityGuidance?.userProfile?.adaptationStyle === "limited_experience" &&
  !limitedExperienceInitialIdea.score &&
  beginnerOperatingBusiness.feasibilityGuidance?.userProfile?.isBeginner === true &&
  beginnerOperatingBusiness.feasibilityGuidance?.userProfile?.isExistingBusinessPath === true &&
  existingOwnerImproving.feasibilityGuidance?.userProfile?.adaptationStyle === "existing_business" &&
  experiencedOwnerExpanding.feasibilityGuidance?.userProfile?.isExperienced === true &&
  experiencedOwnerExpanding.feasibilityGuidance?.userProfile?.isExistingBusinessPath === true &&
  switchedProfile.feasibilityGuidance?.userProfile?.experienceLevel === "limited_experience" &&
  switchedProfile.feasibilityGuidance?.userProfile?.projectStageIntent === "improving" &&
  switchedProfile.feasibilityGuidance?.answers?.city === "الرياض" &&
  !switchedProfile.report &&
  !switchedProfile.biggestRisk &&
  guidedNormalIdea.evaluationStatus === "evaluated" &&
  guidedIneligible.evaluationStatus === "ineligible" &&
  !guidedIneligible.score &&
  guidedAmbiguousFinance.evaluationStatus === "needs_clarification" &&
  !guidedAmbiguousFinance.score;

console.log(
  JSON.stringify(
    {
      guidedFeasibilityPassed,
      guidedFeasibilityArabicSeed: {
        status: guidedFeasibilityArabicSeed.evaluationStatus,
        heading: guidedFeasibilityArabicSeed.presentation?.heading,
        steps: guidedFeasibilityArabicSeed.clarificationFlow?.steps?.map((step) => step.title),
      },
      phase3CarWashClassification: {
        fixed: phase3FixedCarWashAr.orchestrationDecision?.proposedClassification,
        mobile: phase3MobileCarWashAr.orchestrationDecision?.proposedClassification,
      },
      guidedFeasibilityCompleted: {
        status: guidedFeasibilityCompleted.evaluationStatus,
        heading: guidedFeasibilityCompleted.presentation?.heading,
      },
      guidedNormalIdea: guidedNormalIdea.evaluationStatus,
      guidedIneligible: guidedIneligible.evaluationStatus,
      guidedAmbiguousFinance: guidedAmbiguousFinance.evaluationStatus,
    },
    null,
    2
  )
);

if (!guidedFeasibilityPassed) {
  process.exitCode = 1;
}

const phase3FullInput = {
  businessIdea: "A mobile app guided meal prep planner for busy parents",
  targetCustomer: "Busy parents who cook at home",
  problem: "They lose time every week deciding meals and grocery lists.",
  monetization: "Monthly subscription paid by the parent.",
};

const phase3Unconfirmed = executeUnconfirmedValidation(phase3FullInput, "en");
const phase3ArabicUnconfirmed = executeUnconfirmedValidation(
  {
    businessIdea: "تطبيق يساعد الأسر على تنظيم الوجبات الأسبوعية",
    targetCustomer: "الأسر المشغولة في المدن الكبيرة",
    problem: "يضيعون وقتاً كل أسبوع في اختيار الوجبات وكتابة قائمة المشتريات.",
    monetization: "اشتراك شهري تدفعه الأسرة.",
  },
  "ar"
);
const phase3Confirmed = executeValidation(phase3FullInput, "en");
const phase3Limited = executeProductValidation(phase3FullInput, "en", {}, {
  ...defaultPhase3Answers,
  userExperienceLevel: "limited_experience",
  firstProject: "no",
});
const phase3CorrectionStep = executeUnconfirmedValidation(
  {
    businessIdea: "A neighborhood grocery store for families in a residential area",
    targetCustomer: "Families living near the store",
    problem: "They need convenient daily groceries close to home.",
    monetization: "Customers pay per grocery purchase.",
  },
  "en",
  {},
  {
    ...defaultPhase3Answers,
    classificationConfirmation: "correct",
    projectTypeCorrection: "",
  }
);
const phase3CorrectedRetail = executeProductValidation(
  {
    businessIdea: "A neighborhood grocery store",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    ...defaultPhase3Answers,
    classificationConfirmation: "confirm",
  }
);
const phase3CorrectedManufacturing = executeProductValidation(
  {
    businessIdea: "A neighborhood grocery store",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    ...defaultPhase3Answers,
    classificationConfirmation: "correct",
    projectTypeCorrection: "manufacturing_industrial",
    operatingModelCorrection: "fixed_location",
    classificationCorrectionReason: "The store will manufacture packed foods on-site.",
  }
);
const phase3CarWashFieldService = executeProductValidation(
  {
    businessIdea: "An automated car wash",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    ...defaultPhase3Answers,
    classificationConfirmation: "correct",
    projectTypeCorrection: "field_service",
    operatingModelCorrection: "fixed_location",
  }
);
const phase3GenericManufacturing = executeProductValidation(
  {
    businessIdea: "A small manufacturing workshop",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    ...defaultPhase3Answers,
    classificationConfirmation: "correct",
    projectTypeCorrection: "manufacturing_industrial",
    operatingModelCorrection: "fixed_location",
  }
);
const phase3LegacyLocationBasedService = executeProductValidation(
  {
    businessIdea: "A fixed-location service business for busy drivers",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    ...defaultPhase3Answers,
    classificationConfirmation: "correct",
    projectTypeCorrection: "location_based_service",
  }
);
const phase3MediumPlasticCandidate = executeProductValidation(
  {
    businessIdea: "An online store selling plastic storage boxes",
    targetCustomer: "Apartment renters and families",
    problem: "They need affordable storage products delivered quickly.",
    monetization: "Customers pay per order.",
  },
  "en",
  {},
  {
    ...defaultPhase3Answers,
    classificationConfirmation: "",
  }
);
const phase3CompletePetIndustrialDetails = {
  plasticWasteType: "pet",
  intendedOutput: "washed_flakes",
  targetProductionCapacity: "1 ton per day",
  availableBudgetSar: "750,000 SAR",
  preferredCityRegion: "Riyadh",
  existingPremises: "yes",
  wasteSourceQuantity: "Supplier agreement for 20 tons monthly",
  industrialExperienceTeam: "One operations supervisor and two technicians",
  expectedBuyers: "Packaging factories that accept PET flakes",
  salesScope: "local",
};
const phase3ExplicitPet = executeProductValidation(
  {
    businessIdea: "A PET plastic recycling plant",
    targetCustomer: "Packaging factories that buy recycled plastic flakes",
    problem: "Factories need consistent recycled PET feedstock.",
    monetization: "Sell washed flakes to local factories.",
  },
  "en",
  phase3CompletePetIndustrialDetails,
  defaultPhase3Answers
);
const phase3IneligiblePriority = executeUnconfirmedValidation(
  {
    businessIdea: "A betting marketplace for sports gambling",
    targetCustomer: "People who want to gamble",
    problem: "They need easier betting.",
    monetization: "Commission on bets.",
  },
  "en"
);
const phase3FinancingPriority = executeUnconfirmedValidation(
  {
    businessIdea:
      "A platform connects small businesses seeking funding with people providing funds in exchange for a periodic financial return.",
    targetCustomer: "Small businesses seeking funding",
    problem: "They need funding quickly.",
    monetization: "Fee on funded amounts with repayment period.",
  },
  "en"
);

const classificationMatrixCases = [
  {
    name: "fixed car wash en",
    language: "en",
    input: {
      businessIdea: "An automatic wash service at a fixed location where customers visit with their cars.",
      targetCustomer: "Drivers near residential neighborhoods",
      problem: "They need faster vehicle cleaning without long waiting.",
      monetization: "Customers pay per wash.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "fixed_location",
  },
  {
    name: "fixed car wash ar",
    language: "ar",
    input: {
      businessIdea: "أريد إنشاء مغسلة سيارات آلية في موقع ثابت بمدينة جدة، ويأتي العملاء بسياراتهم إلى المغسلة.",
      targetCustomer: "أصحاب السيارات في جدة",
      problem: "يريدون تنظيف السيارة بسرعة وبجودة ثابتة دون انتظار طويل.",
      monetization: "يدفع العميل مقابل كل عملية غسيل.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "fixed_location",
  },
  {
    name: "mobile car wash en",
    language: "en",
    input: {
      businessIdea: "A mobile vehicle wash service where the provider travels to the customer at home or work.",
      targetCustomer: "Busy drivers",
      problem: "They do not have time to visit a cleaning location.",
      monetization: "Customers pay per visit.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "mobile_or_customer_site",
  },
  {
    name: "mobile car wash ar",
    language: "ar",
    input: {
      businessIdea: "أريد إنشاء خدمة متنقلة لغسيل السيارات، وينتقل العامل والمعدات إلى منزل العميل أو موقف عمله.",
      targetCustomer: "أصحاب السيارات المشغولون",
      problem: "لا يجدون وقتاً مناسباً للذهاب إلى موقع تنظيف.",
      monetization: "يدفع العميل مقابل كل زيارة.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "mobile_or_customer_site",
  },
  {
    name: "undecided fixed or customer-site service ar",
    language: "ar",
    input: {
      businessIdea: "مشروع يقدم خدمات متنوعة للسيارات في جدة، ولم أحدد بعد هل يحصل العميل على الخدمة في موقع ثابت أم تصل الخدمة إليه.",
      targetCustomer: "أصحاب السيارات في جدة",
      problem: "يحتاجون إلى خدمة سيارات واضحة ومناسبة.",
      monetization: "يدفع العميل مقابل الخدمة.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "unknown",
  },
  {
    name: "undecided fixed or mobile service en",
    language: "en",
    input: {
      businessIdea: "A vehicle service business in Jeddah. The delivery model is not decided yet: either fixed location or mobile at the customer site.",
      targetCustomer: "Vehicle owners in Jeddah",
      problem: "They need a clearer and more convenient car service.",
      monetization: "Customers pay per service.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "unknown",
  },
  {
    name: "alternative fixed and mobile wording ar",
    language: "ar",
    input: {
      businessIdea: "قد يكون المشروع في موقع ثابت أو يقدم الخدمة عند العميل، ولم أقرر النموذج بعد.",
      targetCustomer: "أصحاب المنازل",
      problem: "يحتاجون إلى خدمة أسهل.",
      monetization: "الدفع مقابل الخدمة.",
    },
    expectedPrimaryType: "generic",
    expectedOperatingModel: "unknown",
  },
  {
    name: "alternative fixed and mobile wording en",
    language: "en",
    input: {
      businessIdea: "A service business that could be at our location or the customer site; the operating model is not determined.",
      targetCustomer: "Local customers",
      problem: "They need easier service access.",
      monetization: "Customers pay per job.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "unknown",
  },
  {
    name: "barbershop en",
    language: "en",
    input: {
      businessIdea: "A barbershop in a fixed neighborhood location where customers visit for grooming services.",
      targetCustomer: "Men living nearby",
      problem: "They need reliable appointments close to home.",
      monetization: "Customers pay per haircut.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "fixed_location",
  },
  {
    name: "barbershop ar",
    language: "ar",
    input: {
      businessIdea: "صالون حلاقة في موقع ثابت داخل الحي ويأتي العملاء للحصول على الخدمة.",
      targetCustomer: "رجال يسكنون بالقرب من الموقع",
      problem: "يحتاجون إلى مواعيد حلاقة قريبة ومنظمة.",
      monetization: "يدفع العميل مقابل كل خدمة.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "fixed_location",
  },
  {
    name: "home plumber en",
    language: "en",
    input: {
      businessIdea: "A plumbing service where technicians travel to homes to fix urgent leaks.",
      targetCustomer: "Homeowners",
      problem: "They need reliable help at home when a pipe leaks.",
      monetization: "Customers pay per repair visit.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "mobile_or_customer_site",
    expectedEvidence: {
      dimension: "operatingModel",
      proposedValue: "mobile_or_customer_site",
      matchedPhrase: "technicians travel to homes",
      sourceField: "businessIdea",
      reasonCode: "mobile_customer_site_evidence",
    },
  },
  {
    name: "home plumber ar",
    language: "ar",
    input: {
      businessIdea: "خدمة سباكة منزلية ينتقل فيها الفني إلى منزل العميل لإصلاح التسربات.",
      targetCustomer: "أصحاب المنازل",
      problem: "يحتاجون إلى فني موثوق يصل إلى المنزل عند حدوث تسرب.",
      monetization: "يدفع العميل مقابل الزيارة أو الإصلاح.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "mobile_or_customer_site",
  },
  {
    name: "grocery store en",
    language: "en",
    input: {
      businessIdea: "A neighborhood grocery store in a fixed shop where customers buy daily household products.",
      targetCustomer: "Families in the neighborhood",
      problem: "They need quick access to daily groceries close to home.",
      monetization: "Revenue from product sales.",
    },
    expectedPrimaryType: "retail",
    expectedOperatingModel: "fixed_location",
  },
  {
    name: "grocery store ar",
    language: "ar",
    input: {
      businessIdea: "متجر بقالة في محل ثابت داخل الحي يشتري منه العملاء احتياجاتهم اليومية.",
      targetCustomer: "الأسر في الحي",
      problem: "يحتاجون إلى شراء المنتجات اليومية بسرعة بالقرب من المنزل.",
      monetization: "الإيرادات من بيع المنتجات.",
    },
    expectedPrimaryType: "retail",
    expectedOperatingModel: "fixed_location",
  },
  {
    name: "restaurant en",
    language: "en",
    input: {
      businessIdea: "A restaurant in a fixed location where customers visit for healthy meals.",
      targetCustomer: "Office workers",
      problem: "They need a fast healthy lunch option nearby.",
      monetization: "Customers pay per meal.",
    },
    expectedPrimaryType: "food_and_beverage",
    expectedOperatingModel: "fixed_location",
  },
  {
    name: "restaurant ar",
    language: "ar",
    input: {
      businessIdea: "مطعم في موقع ثابت يقدم وجبات صحية ويأتي العملاء لتناولها أو استلامها.",
      targetCustomer: "موظفو المكاتب",
      problem: "يحتاجون إلى وجبة غداء صحية وسريعة بالقرب من العمل.",
      monetization: "يدفع العميل مقابل كل وجبة.",
    },
    expectedPrimaryType: "food_and_beverage",
    expectedOperatingModel: "fixed_location",
  },
  {
    name: "medical clinic en",
    language: "en",
    input: {
      businessIdea: "A medical clinic in a fixed location where patients visit licensed doctors.",
      targetCustomer: "Patients needing routine care",
      problem: "They need appointments without long delays.",
      monetization: "Patients or insurers pay per consultation.",
    },
    expectedPrimaryType: "healthcare",
    expectedOperatingModel: "fixed_location",
  },
  {
    name: "medical clinic ar",
    language: "ar",
    input: {
      businessIdea: "عيادة طبية في موقع ثابت يزورها المرضى للحصول على استشارة من أطباء مرخصين.",
      targetCustomer: "مرضى يحتاجون إلى رعاية دورية",
      problem: "يحتاجون إلى مواعيد أسرع دون انتظار طويل.",
      monetization: "يدفع المريض أو شركة التأمين مقابل الاستشارة.",
    },
    expectedPrimaryType: "healthcare",
    expectedOperatingModel: "fixed_location",
  },
  {
    name: "saas accounting en",
    language: "en",
    input: {
      businessIdea: "A SaaS accounting product delivered online for small shops.",
      targetCustomer: "Small shop owners",
      problem: "They struggle to track sales and expenses.",
      monetization: "Monthly software subscription.",
    },
    expectedPrimaryType: "digital_software",
    expectedOperatingModel: "digital_remote",
  },
  {
    name: "saas accounting ar",
    language: "ar",
    input: {
      businessIdea: "منتج محاسبة برمجي يقدم عبر الإنترنت للمتاجر الصغيرة.",
      targetCustomer: "أصحاب المتاجر الصغيرة",
      problem: "يجدون صعوبة في متابعة المبيعات والمصروفات.",
      monetization: "اشتراك شهري في البرنامج.",
    },
    expectedPrimaryType: "digital_software",
    expectedOperatingModel: "digital_remote",
  },
  {
    name: "pet sorting facility en",
    language: "en",
    input: {
      businessIdea: "A PET sorting and baling facility in a fixed industrial site.",
      targetCustomer: "Factories buying recycled PET bales",
      problem: "They need consistent PET material supply.",
      monetization: "Sell sorted PET bales per ton.",
    },
    expectedPrimaryType: "manufacturing_industrial",
    expectedOperatingModel: "fixed_location",
    expectedSpecialistCandidate: "pet_plastic_recycling",
    expectedEvidence: {
      dimension: "operatingModel",
      proposedValue: "fixed_location",
      matchedPhrase: "fixed industrial site",
      sourceField: "businessIdea",
      reasonCode: "fixed_location_evidence",
    },
  },
  {
    name: "pet sorting facility ar",
    language: "ar",
    input: {
      businessIdea: "منشأة لفرز وكبس عبوات PET في موقع صناعي ثابت.",
      targetCustomer: "مصانع تشتري بالات PET المعاد تدويرها",
      problem: "تحتاج إلى توريد ثابت من مادة PET.",
      monetization: "بيع بالات PET بالطن.",
    },
    expectedPrimaryType: "manufacturing_industrial",
    expectedOperatingModel: "fixed_location",
    expectedSpecialistCandidate: "pet_plastic_recycling",
  },
  {
    name: "generic furniture factory en",
    language: "en",
    input: {
      businessIdea: "A furniture factory in a fixed industrial site producing custom tables.",
      targetCustomer: "Interior designers and offices",
      problem: "They wait too long for custom furniture.",
      monetization: "Paid manufacturing orders.",
    },
    expectedPrimaryType: "manufacturing_industrial",
    expectedOperatingModel: "fixed_location",
    forbidSpecialist: "pet_plastic_recycling",
    expectedEvidence: {
      dimension: "operatingModel",
      proposedValue: "fixed_location",
      matchedPhrase: "fixed industrial site",
      sourceField: "businessIdea",
      reasonCode: "fixed_location_evidence",
    },
  },
  {
    name: "generic furniture factory ar",
    language: "ar",
    input: {
      businessIdea: "مصنع أثاث في موقع صناعي ثابت لإنتاج طاولات حسب الطلب.",
      targetCustomer: "مصممو الديكور والمكاتب",
      problem: "ينتظرون وقتاً طويلاً للحصول على أثاث مخصص.",
      monetization: "الدفع مقابل أوامر التصنيع.",
    },
    expectedPrimaryType: "manufacturing_industrial",
    expectedOperatingModel: "fixed_location",
    forbidSpecialist: "pet_plastic_recycling",
  },
  {
    name: "technician marketplace en",
    language: "en",
    input: {
      businessIdea: "A marketplace app connecting technicians and customers through a digital booking flow.",
      targetCustomer: "Homeowners and maintenance technicians",
      problem: "Customers need trusted technicians and providers need steady jobs.",
      monetization: "Commission on completed bookings.",
    },
    expectedPrimaryType: "marketplace_platform",
    expectedOperatingModels: ["digital_remote", "mixed"],
    forbidPrimaryType: "service",
  },
  {
    name: "technician marketplace ar",
    language: "ar",
    input: {
      businessIdea: "تطبيق سوق يربط الفنيين بالعملاء من خلال حجز رقمي.",
      targetCustomer: "أصحاب المنازل والفنيون",
      problem: "العملاء يحتاجون إلى فني موثوق والفنيون يحتاجون إلى طلبات مستمرة.",
      monetization: "عمولة على الحجوزات المنجزة.",
    },
    expectedPrimaryType: "marketplace_platform",
    expectedOperatingModels: ["digital_remote", "mixed"],
    forbidPrimaryType: "service",
  },
  {
    name: "ambiguous car service ar",
    language: "ar",
    input: {
      businessIdea: "مشروع لخدمة السيارات في جدة",
      targetCustomer: "أصحاب السيارات",
      problem: "يحتاجون إلى خدمة أفضل.",
      monetization: "الدفع مقابل الخدمة.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "unknown",
  },
  {
    name: "ambiguous car service en",
    language: "en",
    input: {
      businessIdea: "A vehicle service business in Jeddah",
      targetCustomer: "Vehicle owners",
      problem: "They need better service.",
      monetization: "Customers pay for the service.",
    },
    expectedPrimaryType: "service",
    expectedOperatingModel: "unknown",
  },
];

const classificationMatrixResults = classificationMatrixCases.map((testCase) => {
  const result = executeUnconfirmedValidation(testCase.input, testCase.language, {}, {
    ...phase3DefaultsFor(testCase.language),
    classificationConfirmation: "",
  });
  const proposed = result.orchestrationDecision?.proposedClassification || {};
  const specialistCandidate = result.orchestrationDecision?.specialistCandidate?.id || "";
  const evidence = result.orchestrationDecision?.classification?.classificationEvidence || [];
  const expectedEvidenceFound = testCase.expectedEvidence
    ? evidence.some((record) =>
        record.dimension === testCase.expectedEvidence.dimension &&
        record.proposedValue === testCase.expectedEvidence.proposedValue &&
        record.matchedPhrase === testCase.expectedEvidence.matchedPhrase &&
        record.sourceField === testCase.expectedEvidence.sourceField &&
        record.reasonCode === testCase.expectedEvidence.reasonCode
      )
    : true;
  return {
    name: testCase.name,
    language: testCase.language,
    input: testCase.input,
    expectedPrimaryType: testCase.expectedPrimaryType,
    primaryType: proposed.primaryType,
    expectedOperatingModel: testCase.expectedOperatingModel || testCase.expectedOperatingModels,
    operatingModel: proposed.operatingModel,
    expectedEvidence: testCase.expectedEvidence || null,
    evidence: evidence.map((record) => ({
      dimension: record.dimension,
      proposedValue: record.proposedValue,
      matchedPhrase: record.matchedPhrase,
      sourceField: record.sourceField,
      evidenceStrength: record.evidenceStrength,
      reasonCode: record.reasonCode,
    })),
    specialistCandidate,
    ok:
      proposed.primaryType === testCase.expectedPrimaryType &&
      (testCase.expectedOperatingModels
        ? testCase.expectedOperatingModels.includes(proposed.operatingModel)
        : proposed.operatingModel === testCase.expectedOperatingModel) &&
      (testCase.expectedSpecialistCandidate ? specialistCandidate === testCase.expectedSpecialistCandidate : true) &&
      (testCase.forbidSpecialist ? specialistCandidate !== testCase.forbidSpecialist : true) &&
      (testCase.forbidPrimaryType ? proposed.primaryType !== testCase.forbidPrimaryType : true) &&
      expectedEvidenceFound &&
      result.evaluationStatus === "feasibility_followup" &&
      !result.score &&
      !result.report,
  };
});
const classificationMatrixPassed = classificationMatrixResults.every((item) => item.ok);
const runtimeHasNoCarWashSpecificRule = !/(car wash|automatic wash|mobile wash|مغسلة)/iu.test(orchestratorSource);

const manualEventPlatformInput = {
  businessName: "منصة الفعاليات الخاصة",
  businessIdea: "منصة عضوية لتنظيم فعاليات ترفيهية ليلية خاصة، ولم تتحدد بعد طبيعة الأنشطة أو المحتوى الذي سيقدم داخل هذه الفعاليات.",
  targetCustomer: "الأشخاص البالغون المهتمون بالفعاليات الخاصة.",
  problem: "صعوبة العثور على فعاليات خاصة تناسب اهتماماتهم.",
  currentSolution: "يبحثون عبر شبكات التواصل أو الدعوات الشخصية.",
  competitiveAdvantage: "تجميع الفعاليات والعضويات في منصة واحدة.",
  monetization: "اشتراك عضوية ورسوم على منظمي الفعاليات.",
};

const classificationEvidenceCases = [
  {
    name: "manual event platform nature false positive",
    language: "ar",
    input: manualEventPlatformInput,
    forbiddenPrimaryType: "healthcare",
    forbiddenEvidence: "healthcare",
    requiredOperatingModel: "unknown",
  },
  {
    name: "arabic nature of activities",
    language: "ar",
    input: { businessIdea: "لم تتحدد طبيعة الأنشطة بعد.", targetCustomer: "عملاء محتملون", problem: "تحتاج الفكرة إلى توضيح.", monetization: "رسوم اشتراك." },
    forbiddenEvidence: "healthcare",
  },
  {
    name: "arabic commercial nature",
    language: "ar",
    input: { businessIdea: "الطبيعة التجارية للمشروع غير واضحة.", targetCustomer: "عملاء محليون", problem: "يحتاجون إلى خدمة أوضح.", monetization: "بيع أو اشتراك." },
    forbiddenEvidence: "healthcare",
  },
  {
    name: "arabic natural product",
    language: "ar",
    input: { businessIdea: "منتج طبيعي للعناية اليومية.", targetCustomer: "أسر في المدن", problem: "يريدون منتجاً بسيطاً.", monetization: "بيع المنتج." },
    forbiddenEvidence: "healthcare",
  },
  {
    name: "arabic natural materials",
    language: "ar",
    input: { businessIdea: "بيع مواد طبيعية للمنزل.", targetCustomer: "أصحاب المنازل", problem: "يريدون بدائل طبيعية.", monetization: "بيع المواد." },
    forbiddenEvidence: "healthcare",
  },
  {
    name: "arabic applying the plan",
    language: "ar",
    input: { businessIdea: "خدمة تساعد المتاجر على تطبيق الخطة التشغيلية.", targetCustomer: "أصحاب المتاجر", problem: "يصعب عليهم تنفيذ الخطة.", monetization: "رسوم خدمة." },
    forbiddenPrimaryType: "digital_software",
    forbiddenEvidence: "digital_software",
  },
  {
    name: "arabic applying procedures",
    language: "ar",
    input: { businessIdea: "استشارة لمساعدة المنشآت على تطبيق الإجراءات الداخلية.", targetCustomer: "المنشآت الصغيرة", problem: "تحتاج إلى تنظيم الإجراءات.", monetization: "رسوم استشارة." },
    forbiddenPrimaryType: "digital_software",
    forbiddenEvidence: "digital_software",
  },
  {
    name: "generic service word only",
    language: "ar",
    input: { businessIdea: "فكرة عامة لم تتضح بعد.", targetCustomer: "عملاء محليون", problem: "يحتاجون إلى خدمة أفضل.", monetization: "رسوم شهرية." },
    forbiddenConfidence: "high",
  },
  {
    name: "revenue only sale does not force retail",
    language: "ar",
    input: { businessIdea: "فكرة عامة لمساعدة أصحاب المنازل.", targetCustomer: "أصحاب المنازل", problem: "يحتاجون إلى حل أسهل.", monetization: "بيع الخدمة برسوم بسيطة." },
    forbiddenPrimaryType: "retail",
  },
  {
    name: "ambiguous site word stays unknown",
    language: "ar",
    input: { businessIdea: "مشروع يستخدم موقعاً لم يتم تحديده بعد.", targetCustomer: "عملاء محليون", problem: "يحتاجون إلى طريقة أوضح.", monetization: "رسوم اشتراك." },
    requiredOperatingModel: "unknown",
  },
  {
    name: "arabic medical clinic positive",
    language: "ar",
    input: { businessIdea: "عيادة طبية في موقع ثابت.", targetCustomer: "مرضى يحتاجون إلى رعاية", problem: "يحتاجون إلى مواعيد أسرع.", monetization: "رسوم استشارة." },
    requiredPrimaryType: "healthcare",
    requiredEvidence: "healthcare",
    requiredMatchedPhrase: "عيادة",
  },
  {
    name: "arabic home medical service positive",
    language: "ar",
    input: { businessIdea: "خدمة طبية منزلية للمرضى.", targetCustomer: "مرضى في المنازل", problem: "يحتاجون إلى متابعة في المنزل.", monetization: "رسوم زيارة." },
    requiredPrimaryType: "healthcare",
    requiredEvidence: "healthcare",
    requiredMatchedPhrase: "خدمة طبية",
  },
  {
    name: "arabic doctor positive",
    language: "ar",
    input: { businessIdea: "منصة مواعيد مع طبيب مرخص.", targetCustomer: "مرضى يحتاجون إلى استشارة", problem: "يصعب عليهم حجز موعد سريع.", monetization: "رسوم حجز." },
    requiredEvidence: "healthcare",
    requiredMatchedPhrase: "طبيب",
  },
  {
    name: "arabic home nursing positive",
    language: "ar",
    input: { businessIdea: "تمريض منزلي لكبار السن.", targetCustomer: "أسر لديها كبار سن", problem: "يحتاجون إلى متابعة يومية.", monetization: "رسوم شهرية." },
    requiredPrimaryType: "healthcare",
    requiredEvidence: "healthcare",
    requiredMatchedPhrase: "تمريض",
  },
  {
    name: "arabic accounting software positive",
    language: "ar",
    input: { businessIdea: "برنامج محاسبة للمتاجر الصغيرة يقدم عبر الإنترنت.", targetCustomer: "أصحاب المتاجر", problem: "يصعب عليهم متابعة المصروفات.", monetization: "اشتراك شهري." },
    requiredPrimaryType: "digital_software",
    requiredEvidence: "digital_software",
    requiredOperatingModel: "digital_remote",
  },
  {
    name: "english application procedure control",
    language: "en",
    input: { businessIdea: "A consulting service for applying safety procedures in small workshops.", targetCustomer: "Workshop owners", problem: "They need clearer procedures.", monetization: "Fixed consulting fee." },
    forbiddenPrimaryType: "digital_software",
  },
];

const classificationEvidenceResults = classificationEvidenceCases.map((testCase) => {
  const decision = orchestrateBusinessIdeaValidation({
    rawInput: testCase.input,
    language: testCase.language,
    feasibilityAnswers: {
      ...phase3DefaultsFor(testCase.language),
      classificationConfirmation: "",
    },
  });
  const proposed = decision.proposedClassification || {};
  const evidence = decision.classification?.classificationEvidence || [];
  const fieldSignals = decision.classification?.fieldSignals || [];
  const hasRequiredEvidence = testCase.requiredEvidence
    ? evidence.some((record) => record.proposedValue === testCase.requiredEvidence)
    : true;
  const hasForbiddenEvidence = testCase.forbiddenEvidence
    ? evidence.some((record) => record.proposedValue === testCase.forbiddenEvidence)
    : false;
  const hasRequiredMatchedPhrase = testCase.requiredMatchedPhrase
    ? evidence.some((record) => record.matchedPhrase.includes(testCase.requiredMatchedPhrase))
    : true;
  const fieldSignalsDerivedFromEvidence = fieldSignals.every((signal) =>
    evidence.some((record) =>
      record.sourceField === signal.sourceField &&
      record.proposedValue === signal.concept &&
      record.matchedPhrase === signal.matchedPhrase &&
      record.reasonCode === signal.reasonCode
    )
  );
  const noRawSubstringEvidence =
    !evidence.some((record) => record.proposedValue === "healthcare" && ["طبيعة", "الطبيعة", "طبيعي", "طبيعية"].includes(record.matchedPhrase));
  const healthcareExplanationSupported =
    proposed.reason.includes("المرضى أو العيادات أو تقديم الرعاية") ? evidence.some((record) => record.proposedValue === "healthcare") : true;

  return {
    name: testCase.name,
    primaryType: proposed.primaryType,
    operatingModel: proposed.operatingModel,
    confidence: decision.classificationConfidence,
    evidence: evidence.map((record) => ({
      proposedValue: record.proposedValue,
      matchedPhrase: record.matchedPhrase,
      sourceField: record.sourceField,
      evidenceStrength: record.evidenceStrength,
      reasonCode: record.reasonCode,
    })),
    ok:
      (testCase.requiredPrimaryType ? proposed.primaryType === testCase.requiredPrimaryType : true) &&
      (testCase.forbiddenPrimaryType ? proposed.primaryType !== testCase.forbiddenPrimaryType : true) &&
      (testCase.requiredOperatingModel ? proposed.operatingModel === testCase.requiredOperatingModel : true) &&
      (testCase.forbiddenConfidence ? decision.classificationConfidence !== testCase.forbiddenConfidence : true) &&
      hasRequiredEvidence &&
      !hasForbiddenEvidence &&
      hasRequiredMatchedPhrase &&
      fieldSignalsDerivedFromEvidence &&
      noRawSubstringEvidence &&
      healthcareExplanationSupported,
  };
});
const classificationEvidencePassed = classificationEvidenceResults.every((item) => item.ok);
const orchestratorHasNoLegacySignalTable =
  !orchestratorSource.includes("const signalPatterns") &&
  !orchestratorSource.includes("item.pattern.test") &&
  !orchestratorSource.includes("specialistRegistry");
const classificationEvidenceHelperHasUnicodeMatcher =
  classificationEvidenceSource.includes("\\p{L}") &&
  classificationEvidenceSource.includes("\\p{N}") &&
  classificationEvidenceSource.includes("/gu") &&
  classificationEvidenceSource.includes("collectClassificationEvidence") &&
  classificationEvidenceSource.includes("evidenceToFieldSignals");

const phase3CorrectionText = JSON.stringify(phase3CorrectionStep.clarificationFlow?.steps || []);
const phase3CorrectionOptions = phase3CorrectionStep.clarificationFlow?.steps
  ?.flatMap((step) => step.fields || [])
  ?.find((field) => field.id === "projectTypeCorrection")?.options || [];
const phase3RetailText = JSON.stringify(phase3CorrectedRetail.clarificationFlow?.steps || []);
const phase3ManufacturingText = JSON.stringify(phase3CorrectedManufacturing.clarificationFlow?.steps || []);
const phase3CarWashText = JSON.stringify(phase3CarWashFieldService.clarificationFlow?.steps || []);
const phase3GenericManufacturingText = JSON.stringify(phase3GenericManufacturing.clarificationFlow?.steps || []);
const pageHasNoIndependentClassificationLogic =
  !pageSource.includes("classifyValidatorRequest") &&
  !pageSource.includes("buildClassificationPrompt") &&
  pageSource.includes("executeBusinessIdeaValidation");
const pageUsesSinglePhase3Journey =
  pageSource.includes("const journeyStepLabels = journeyCopy.steps") &&
  pageSource.includes("profileFields.map(renderJourneyField)") &&
  pageSource.includes("name=\"ideaDescription\"") &&
  pageSource.includes("classificationFields.map(renderClassificationField)") &&
  pageSource.includes("disabled={step > currentStep}") &&
  !pageSource.includes("pageContent?.steps?.[step - 1]") &&
  !pageSource.includes("name=\"industry\"") &&
  !pageSource.includes("name=\"stage\"");
const pageBlocksNormalEvaluationBeforeConfirmation =
  pageSource.includes("BIV_JOURNEY_STATES.CLASSIFICATION_REVIEW") &&
  pageSource.includes("BIV_JOURNEY_STATES.CLASSIFICATION_CORRECTION") &&
  pageSource.includes("showGenericStatusPanel = false") &&
  pageSource.includes("handleJourneyContinue") &&
  !pageSource.includes("currentStep < 3 ? (");

const phase3ClassificationPassed =
  phase3Unconfirmed.evaluationStatus === "feasibility_followup" &&
  phase3Unconfirmed.orchestrationDecision?.proposedClassification?.label === "Digital or software" &&
  phase3Unconfirmed.clarificationFlow?.steps?.[0]?.fields?.some((field) => field.id === "classificationConfirmation") &&
  phase3Unconfirmed.clarificationFlow?.steps?.length === 1 &&
  !phase3Unconfirmed.score &&
  phase3ArabicUnconfirmed.evaluationStatus === "feasibility_followup" &&
  phase3ArabicUnconfirmed.clarificationFlow?.steps?.[0]?.fields?.some((field) => field.labelText === "هل هذا التصنيف يصف مشروعك بشكل صحيح؟") &&
  phase3Confirmed.evaluationStatus === "evaluated" &&
  phase3Confirmed.orchestrationDecision?.classificationConfirmed === true &&
  phase3Limited.evaluationStatus === "evaluated" &&
  phase3Limited.orchestrationDecision?.experienceLevel === "limited_experience" &&
  phase3CorrectionStep.evaluationStatus === "feasibility_followup" &&
  phase3CorrectionStep.evaluationStatus === "feasibility_followup" &&
  phase3CorrectionStep.clarificationFlow?.steps?.flatMap((step) => step.fields || []).some((field) => field.id === "projectTypeCorrection") &&
  phase3CorrectionStep.clarificationFlow?.steps?.flatMap((step) => step.fields || []).some((field) => field.id === "operatingModelCorrection") &&
  phase3CorrectionOptions.every((option) => option.value !== "location_based_service") &&
  phase3LegacyLocationBasedService.orchestrationDecision?.confirmedClassification?.primaryType === "service" &&
  phase3LegacyLocationBasedService.orchestrationDecision?.confirmedClassification?.operatingModel === "fixed_location" &&
  phase3CorrectedRetail.orchestrationDecision?.businessType === "retail_trading" &&
  !/machinery|production line|raw materials/i.test(phase3RetailText) &&
  phase3CorrectedManufacturing.orchestrationDecision?.businessType === "industrial_manufacturing" &&
  !/Capital and equipment|Operations|Evidence and research|production capacity/i.test(phase3ManufacturingText) &&
  phase3MediumPlasticCandidate.orchestrationDecision?.specialistCandidate?.confidence === "medium" &&
  phase3MediumPlasticCandidate.orchestrationDecision?.proposedClassification?.primaryType !== "manufacturing_industrial" &&
  phase3MediumPlasticCandidate.orchestrationDecision?.matchedSpecialist === null &&
  phase3CarWashFieldService.orchestrationDecision?.businessType === "service" &&
  phase3CarWashFieldService.orchestrationDecision?.confirmedClassification?.type === "field_service" &&
  !/PET|plastic waste|washed flakes/i.test(phase3CarWashText) &&
  phase3GenericManufacturing.orchestrationDecision?.businessType === "industrial_manufacturing" &&
  !/PET|plastic waste|washed flakes/i.test(phase3GenericManufacturingText) &&
  phase3ExplicitPet.evaluationStatus === "industrial_assessment" &&
  phase3ExplicitPet.orchestrationDecision?.matchedSpecialist?.id === "pet_plastic_recycling" &&
  phase3IneligiblePriority.evaluationStatus === "ineligible" &&
  phase3FinancingPriority.evaluationStatus === "needs_clarification" &&
  pageHasNoIndependentClassificationLogic &&
  pageUsesSinglePhase3Journey &&
  pageBlocksNormalEvaluationBeforeConfirmation &&
  classificationMatrixPassed &&
  classificationEvidencePassed &&
  orchestratorHasNoLegacySignalTable &&
  classificationEvidenceHelperHasUnicodeMatcher &&
  runtimeHasNoCarWashSpecificRule;

console.log(
  JSON.stringify(
    {
      phase3ClassificationPassed,
      phase3Unconfirmed: {
        status: phase3Unconfirmed.evaluationStatus,
        proposed: phase3Unconfirmed.orchestrationDecision?.proposedClassification,
      },
      phase3Confirmed: {
        status: phase3Confirmed.evaluationStatus,
        confirmed: phase3Confirmed.orchestrationDecision?.confirmedClassification,
      },
      phase3CorrectionStep: {
        status: phase3CorrectionStep.evaluationStatus,
        asksCorrection:
          phase3CorrectionStep.clarificationFlow?.steps?.flatMap((step) => step.fields || []).some((field) => field.id === "projectTypeCorrection") &&
          phase3CorrectionStep.clarificationFlow?.steps?.flatMap((step) => step.fields || []).some((field) => field.id === "operatingModelCorrection"),
        exposesLegacyLocationBasedService: phase3CorrectionOptions.some((option) => option.value === "location_based_service"),
      },
      phase3LegacyLocationBasedService: {
        primaryType: phase3LegacyLocationBasedService.orchestrationDecision?.confirmedClassification?.primaryType,
        operatingModel: phase3LegacyLocationBasedService.orchestrationDecision?.confirmedClassification?.operatingModel,
      },
      phase3MediumPlasticCandidate: {
        candidate: phase3MediumPlasticCandidate.orchestrationDecision?.specialistCandidate,
        proposed: phase3MediumPlasticCandidate.orchestrationDecision?.proposedClassification,
        matched: phase3MediumPlasticCandidate.orchestrationDecision?.matchedSpecialist,
      },
      phase3ExplicitPet: phase3ExplicitPet.evaluationStatus,
      pageHasNoIndependentClassificationLogic,
      pageUsesSinglePhase3Journey,
      pageBlocksNormalEvaluationBeforeConfirmation,
      runtimeHasNoCarWashSpecificRule,
      classificationMatrixPassed,
      classificationMatrixResults,
      classificationEvidencePassed,
      orchestratorHasNoLegacySignalTable,
      classificationEvidenceHelperHasUnicodeMatcher,
      classificationEvidenceResults,
    },
    null,
    2
  )
);

if (!phase3ClassificationPassed) {
  process.exitCode = 1;
}

const completePetIndustrialDetails = {
  plasticWasteType: "pet",
  intendedOutput: "washed_flakes",
  targetProductionCapacity: "1 ton per day",
  availableBudgetSar: "750,000 SAR",
  preferredCityRegion: "Riyadh",
  existingPremises: "yes",
  wasteSourceQuantity: "Supplier agreement for 20 tons monthly",
  industrialExperienceTeam: "One operations supervisor and two technicians",
  expectedBuyers: "Packaging factories that accept PET flakes",
  salesScope: "local",
};

const orchestrationCases = [
  {
    name: "validation errors stop later analysis",
    language: "en",
    input: { businessIdea: "", targetCustomer: "", problem: "", monetization: "" },
    expectRoute: "validation_error",
    expectNoPayload: true,
  },
  {
    name: "ineligible stops scoring and report generation",
    language: "en",
    input: {
      businessIdea: "A phishing scam service that steals login details",
      targetCustomer: "People trying to commit identity theft",
      problem: "They need better ways to steal accounts.",
      monetization: "Monthly fee.",
    },
    expectRoute: "ineligible",
    expectExecutionStatus: "ineligible",
    expectNoScore: true,
  },
  {
    name: "ambiguous financing stops scoring and report generation",
    language: "en",
    input: {
      businessIdea:
        "A platform connects small businesses seeking funding with people providing funds in exchange for a periodic financial return.",
      targetCustomer: "Small businesses seeking funding",
      problem: "They need funding quickly.",
      monetization: "Fee on funded amounts with repayment period.",
    },
    expectRoute: "needs_clarification",
    expectExecutionStatus: "needs_clarification",
    expectNoScore: true,
  },
  {
    name: "guided follow-up does not fall through",
    language: "ar",
    input: {
      businessIdea: "مغسلة سيارات آلية",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
    expectRoute: "guided_follow_up",
    expectExecutionStatus: "feasibility_followup",
    expectNoScore: true,
  },
  {
    name: "explicit PET recycling case can use specialist",
    language: "en",
    input: {
      businessIdea: "A PET plastic recycling plant",
      targetCustomer: "Packaging factories that buy recycled plastic flakes",
      problem: "Factories need consistent recycled PET feedstock.",
      monetization: "Sell washed flakes to local factories.",
    },
    industrialDetails: completePetIndustrialDetails,
    expectRoute: "specialist_analysis",
    expectExecutionStatus: "industrial_assessment",
    expectSpecialist: "pet_plastic_recycling",
  },
  {
    name: "generic industrial idea does not use PET",
    language: "en",
    input: {
      businessIdea: "A small workshop producing custom metal brackets",
      targetCustomer: "Local contractors",
      problem: "Contractors wait too long for small custom batches.",
      monetization: "Pay per approved order.",
    },
    expectRoute: "normal_evaluation",
    forbiddenSpecialist: "pet_plastic_recycling",
  },
  {
    name: "car wash receives guided questions, not plastic questions",
    language: "en",
    input: {
      businessIdea: "An automated car wash",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
    expectRoute: "guided_follow_up",
    forbiddenText: ["plastic waste", "PET", "washed flakes"],
  },
  {
    name: "grocery store does not receive manufacturing machinery questions",
    language: "en",
    input: {
      businessIdea: "A neighborhood grocery store",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
    expectRoute: "guided_follow_up",
    forbiddenText: ["production line", "raw materials", "machinery"],
  },
  {
    name: "digital idea avoids raw-material questions",
    language: "en",
    input: {
      businessIdea: "A SaaS dashboard for weekly sales reporting",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
    expectRoute: "guided_follow_up",
    forbiddenText: ["raw materials", "machinery", "plastic"],
  },
  {
    name: "marketplace keeps two-sided considerations",
    language: "en",
    input: {
      businessIdea: "A marketplace platform connecting homeowners with maintenance providers",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
    expectRoute: "guided_follow_up",
  },
  {
    name: "normal simple idea still evaluates",
    language: "en",
    input: {
      businessIdea: "A guided meal prep planner for busy parents",
      targetCustomer: "Busy parents who cook at home",
      problem: "They lose time every week deciding meals and grocery lists.",
      monetization: "Monthly subscription paid by the parent.",
    },
    expectRoute: "normal_evaluation",
    expectExecutionStatus: "evaluated",
  },
  {
    name: "arabic normal route equivalent",
    language: "ar",
    input: {
      businessIdea: "تطبيق يساعد الأسر على تنظيم الوجبات الأسبوعية",
      targetCustomer: "الأسر المشغولة في المدن الكبيرة",
      problem: "يضيعون وقتاً كل أسبوع في اختيار الوجبات وكتابة قائمة المشتريات.",
      monetization: "اشتراك شهري تدفعه الأسرة.",
    },
    expectRoute: "normal_evaluation",
    expectExecutionStatus: "evaluated",
  },
];

const routePrecedence = [
  "validation_error",
  "ineligible",
  "needs_clarification",
  "guided_follow_up",
  "research_required",
  "specialist_analysis",
  "normal_evaluation",
];

const orchestrationResults = orchestrationCases.map((testCase) => {
  const flowAnswers = {
    ...phase3DefaultsFor(testCase.language),
    ...(testCase.feasibilityAnswers || {}),
  };
  const decision = orchestrateBusinessIdeaValidation({
    rawInput: testCase.input,
    language: testCase.language,
    industrialDetails: testCase.industrialDetails || {},
    feasibilityAnswers: flowAnswers,
  });
  const execution = executeValidation(
    testCase.input,
    testCase.language,
    testCase.industrialDetails || {},
    testCase.feasibilityAnswers || {}
  );
  const flowText = JSON.stringify(decision.guidedFeasibility?.clarificationFlow || decision.requestAssessment?.clarificationFlow || {});
  const primaryRouteKeys = Object.keys(decision).filter((key) => key === "route" || key === "selectedRoute");
  const executionPrimaryRouteKeys = Object.keys(execution).filter((key) => key === "route" || key === "selectedRoute");
  const liveRoutes = [decision.route].filter(Boolean);
  const expectedJourneyState = testCase.expectJourneyState || resolveBusinessIdeaJourneyState(decision);
  const futureRoutesAreDormant =
    Array.isArray(decision.futureRoutes) &&
    decision.futureRoutes.every((item) => item.implemented === false) &&
    !decision.futureRoutes.some((item) => liveRoutes.includes(item.route));

  return {
    name: testCase.name,
    route: decision.route,
    executionRoute: execution.route,
    journeyState: execution.journeyState,
    expectedJourneyState,
    hasCanonicalRouteOnly: primaryRouteKeys.length === 1 && primaryRouteKeys[0] === "route",
    executionHasCanonicalRouteOnly: executionPrimaryRouteKeys.length === 1 && executionPrimaryRouteKeys[0] === "route",
    hasExactlyOneJourneyState: BIV_VALID_JOURNEY_STATES.has(execution.journeyState) && !("selectedJourneyState" in execution),
    hasExactlyOnePrimaryRoute: liveRoutes.length === 1 && new Set(liveRoutes).size === 1,
    routePrecedenceMatches: JSON.stringify(decision.routePrecedence) === JSON.stringify(routePrecedence),
    locale: decision.locale,
    direction: decision.direction,
    eligibilityStatus: decision.eligibilityStatus,
    specialist: decision.matchedSpecialist?.id || "",
    specialistCandidate: decision.specialistCandidate?.id || "",
    specialistEligible: decision.specialistEligible,
    analysisPayloadPermitted: Boolean(decision.analysisPayload?.permitted),
    allowedActions: decision.allowedActions || [],
    blockedActions: decision.blockedActions || [],
    executionStatus: execution.evaluationStatus || execution.state,
    hasScore: Boolean(execution.score),
    hasReport: Boolean(execution.report || execution.industrialReport),
    forbiddenTextFound: (testCase.forbiddenText || []).filter((text) => flowText.includes(text)),
    requiredTextFound: (testCase.requiredText || []).filter((text) => flowText.includes(text)),
    futureRoutesAreDormant,
    expected: testCase,
  };
});

const pageUsesSharedExecutionAdapter =
  pageSource.includes("executeBusinessIdeaValidation") &&
  !pageSource.includes("orchestrateBusinessIdeaValidation") &&
  !pageSource.includes("buildIndustrialPreliminaryAnalysis") &&
  !pageSource.includes("scoreBusinessIdea");

const pageReadsCanonicalRouteOnly =
  pageSource.includes("executeBusinessIdeaValidation") &&
  !pageSource.includes("selectedRoute");

const pageReadsCanonicalJourneyState =
  pageSource.includes("result?.journeyState") &&
  pageSource.includes("showFormRegion") &&
  pageSource.includes("showClarificationCard") &&
  pageSource.includes("showGenericStatusPanel = false") &&
  pageSource.includes("canCopyReport") &&
  pageSource.includes("canDownloadReport") &&
  !pageSource.includes("selectedJourneyState");

const orchestrationPassed =
  orchestrationResults.every((result) => result.route === result.expected.expectRoute) &&
  orchestrationResults.every((result) => result.executionRoute === result.route) &&
  orchestrationResults.every((result) => result.journeyState === result.expectedJourneyState) &&
  orchestrationResults.every((result) => result.hasCanonicalRouteOnly && result.hasExactlyOnePrimaryRoute) &&
  orchestrationResults.every((result) => result.executionHasCanonicalRouteOnly && result.hasExactlyOneJourneyState) &&
  orchestrationResults.every((result) => result.routePrecedenceMatches) &&
  orchestrationResults.every((result) => result.locale === result.expected.language) &&
  orchestrationResults.every((result) => result.direction === (result.expected.language === "ar" ? "rtl" : "ltr")) &&
  orchestrationResults.every((result) =>
    result.expected.expectExecutionStatus ? result.executionStatus === result.expected.expectExecutionStatus : true
  ) &&
  orchestrationResults.every((result) => result.expected.expectNoScore ? !result.hasScore && !result.hasReport : true) &&
  orchestrationResults.every((result) => result.expected.expectNoPayload ? !result.analysisPayloadPermitted : true) &&
  orchestrationResults.every((result) =>
    result.expected.expectSpecialist ? result.specialist === result.expected.expectSpecialist && result.specialistEligible : true
  ) &&
  orchestrationResults.every((result) =>
    result.expected.forbiddenSpecialist ? result.specialist !== result.expected.forbiddenSpecialist : true
  ) &&
  orchestrationResults.every((result) => result.forbiddenTextFound.length === 0) &&
  orchestrationResults.every((result) => result.requiredTextFound.length === (result.expected.requiredText || []).length) &&
  orchestrationResults.every((result) => result.futureRoutesAreDormant) &&
  orchestrationResults
    .filter((result) => ["ineligible", "needs_clarification", "guided_follow_up", "validation_error"].includes(result.route))
    .every((result) => result.blockedActions.includes("score") && result.blockedActions.includes("report")) &&
  pageUsesSharedExecutionAdapter &&
  pageReadsCanonicalRouteOnly &&
  pageReadsCanonicalJourneyState;

console.log(JSON.stringify({ orchestrationPassed, pageUsesSharedExecutionAdapter, pageReadsCanonicalRouteOnly, pageReadsCanonicalJourneyState, orchestrationResults }, null, 2));

if (!orchestrationPassed) {
  process.exitCode = 1;
}

function executeJourney(rawInput, language = "en", industrialDetails = {}, feasibilityAnswers = {}) {
  return executeProductValidation(rawInput, language, industrialDetails, feasibilityAnswers);
}

const journeyStateCases = [
  {
    name: "validation error",
    result: executeJourney({ businessIdea: "", targetCustomer: "", problem: "", monetization: "" }, "en", {}, phase3DefaultsFor("en")),
    expectedJourneyState: "validation_error",
    expectReport: false,
  },
  {
    name: "ineligible",
    result: executeJourney(
      {
        businessIdea: "An online casino and betting platform",
        targetCustomer: "Consumers",
        problem: "They want fast gambling access.",
        monetization: "Commission on bets.",
      },
      "en",
      {},
      phase3DefaultsFor("en")
    ),
    expectedJourneyState: "ineligible",
    expectReport: false,
  },
  {
    name: "eligibility clarification",
    result: executeJourney(
      {
        businessIdea: "A private membership app for adult entertainment and nightlife events",
        targetCustomer: "Adults looking for premium entertainment",
        problem: "They want curated venues and exclusive events.",
        monetization: "Membership subscription.",
      },
      "en",
      {},
      phase3DefaultsFor("en")
    ),
    expectedJourneyState: "eligibility_clarification",
    expectClarificationType: "eligibility",
    expectReport: false,
  },
  {
    name: "financing clarification",
    result: executeJourney(
      {
        businessIdea: "A platform connects small businesses seeking funding with people providing funds in exchange for a periodic financial return.",
        targetCustomer: "Small businesses and funders",
        problem: "Funding access is unclear.",
        monetization: "Arrangement fee.",
      },
      "en",
      {},
      phase3DefaultsFor("en")
    ),
    expectedJourneyState: "financing_clarification",
    expectClarificationType: "financing",
    expectReport: false,
  },
  {
    name: "arabic eligibility clarification",
    result: executeJourney(
      {
        businessIdea: "تطبيق عضوية خاص لفعاليات ترفيه ليلي للكبار",
        targetCustomer: "بالغون يبحثون عن ترفيه خاص",
        problem: "يريدون فعاليات مختارة واشتراكات حصرية.",
        monetization: "اشتراك عضوية.",
      },
      "ar",
      {},
      phase3DefaultsFor("ar")
    ),
    expectedJourneyState: "eligibility_clarification",
    expectClarificationType: "eligibility",
    expectReport: false,
  },
  {
    name: "arabic financing clarification",
    result: executeJourney(
      {
        businessIdea: "منصة تربط الشركات الصغيرة التي تبحث عن تمويل مع أشخاص يقدمون التمويل مقابل عائد مالي دوري ومدة سداد.",
        targetCustomer: "الشركات الصغيرة ومقدمو التمويل",
        problem: "تحتاج الشركات إلى تمويل ويريد الممولون عائداً دورياً.",
        monetization: "رسوم منصة من اتفاقيات التمويل.",
      },
      "ar",
      {},
      phase3DefaultsFor("ar")
    ),
    expectedJourneyState: "financing_clarification",
    expectClarificationType: "financing",
    expectReport: false,
  },
  {
    name: "profile input",
    result: executeJourney(
      {
        businessIdea: "A simple booking service for neighborhood cleaners.",
        targetCustomer: "",
        problem: "",
        monetization: "",
      },
      "en"
    ),
    expectedJourneyState: "profile_input",
    expectReport: false,
  },
  {
    name: "idea input",
    result: executeJourney(
      {
        businessIdea: "A simple booking service for neighborhood cleaners.",
        targetCustomer: "",
        problem: "",
        monetization: "",
      },
      "en",
      {},
      phase3DefaultsFor("en")
    ),
    expectedJourneyState: "idea_input",
    expectReport: false,
  },
  {
    name: "classification review",
    result: executeJourney(
      {
        businessIdea: "A SaaS accounting product for small shops.",
        targetCustomer: "Small shop owners",
        problem: "They lose time with manual accounting.",
        monetization: "Monthly subscription.",
      },
      "en",
      {},
      { ...phase3DefaultsFor("en"), classificationConfirmation: "" }
    ),
    expectedJourneyState: "classification_review",
    expectReport: false,
  },
  {
    name: "classification correction",
    result: executeJourney(
      {
        businessIdea: "A SaaS accounting product for small shops.",
        targetCustomer: "Small shop owners",
        problem: "They lose time with manual accounting.",
        monetization: "Monthly subscription.",
      },
      "en",
      {},
      { ...phase3DefaultsFor("en"), classificationConfirmation: "correct" }
    ),
    expectedJourneyState: "classification_correction",
    expectReport: false,
  },
  {
    name: "specialist clarification",
    result: executeJourney(
      {
        businessIdea: "A PET plastic recycling facility that sorts and bales bottles.",
        targetCustomer: "Plastic buyers",
        problem: "They need sorted PET supply.",
        monetization: "Sale of sorted bales.",
      },
      "en",
      {},
      phase3DefaultsFor("en")
    ),
    expectedJourneyState: "specialist_clarification",
    expectReport: false,
  },
  {
    name: "specialist analysis",
    result: executeJourney(
      {
        businessIdea: "A PET plastic recycling facility that sorts and bales bottles.",
        targetCustomer: "Plastic buyers",
        problem: "They need sorted PET supply.",
        monetization: "Sale of sorted bales.",
      },
      "en",
      {
        plasticWasteType: "PET bottles",
        intendedOutput: "sorted_baled",
        targetProductionCapacity: "2 tons per day",
        availableBudgetSar: "600000",
        preferredCityRegion: "Riyadh",
        existingPremises: "leased warehouse",
        wasteSourceQuantity: "municipal supplier, 3 tons per day",
        industrialExperienceTeam: "operations manager and two technicians",
        expectedBuyers: "local plastic processors",
        salesScope: "local",
      },
      phase3DefaultsFor("en")
    ),
    expectedJourneyState: "specialist_analysis",
    expectReport: true,
  },
  {
    name: "normal evaluation",
    result: executeJourney(
      {
        businessIdea: "A meal planning app for busy parents.",
        targetCustomer: "Busy parents",
        problem: "They lose time planning weekly meals.",
        monetization: "Monthly subscription.",
      },
      "en",
      {},
      phase3DefaultsFor("en")
    ),
    expectedJourneyState: "normal_evaluation",
    expectReport: true,
  },
];

const journeyStateResults = journeyStateCases.map((testCase) => {
  const result = testCase.result;
  const keys = Object.keys(result).filter((key) => key === "journeyState" || key === "selectedJourneyState");
  const routeKeys = Object.keys(result).filter((key) => key === "route" || key === "selectedRoute");
  const hasReportOutput = Boolean(result.report || result.industrialReport || result.score);
  const allowedActions = result.orchestrationDecision?.allowedActions || [];
  return {
    name: testCase.name,
    route: result.route,
    journeyState: result.journeyState,
    canonicalJourneyStateOnly: keys.length === 1 && keys[0] === "journeyState",
    canonicalRouteOnly: routeKeys.length === 1 && routeKeys[0] === "route",
    journeyStateValid: BIV_VALID_JOURNEY_STATES.has(result.journeyState),
    hasReportOutput,
    hasCopyDownloadActions: allowedActions.includes("copy_report") || allowedActions.includes("download_report"),
    clarificationType: result.eligibility?.clarificationType || "",
    presentationText: [
      result.presentation?.heading,
      result.presentation?.body,
      result.presentation?.policy,
      result.presentation?.closing,
    ]
      .filter(Boolean)
      .join(" "),
    expectedJourneyState: testCase.expectedJourneyState,
    expectedClarificationType: testCase.expectClarificationType || "",
    expectReport: testCase.expectReport,
  };
});

const arabicClassificationJourney = executeJourney(
  {
    businessIdea: "تطبيق محاسبة بسيط لأصحاب المتاجر الصغيرة",
    targetCustomer: "أصحاب المتاجر الصغيرة",
    problem: "يضيعون وقتاً في المحاسبة اليدوية.",
    monetization: "اشتراك شهري.",
  },
  "ar",
  {},
  { ...phase3DefaultsFor("ar"), classificationConfirmation: "" }
);

const pageRenderingGuardrailsPassed =
  pageSource.includes("const journeyState =") &&
  pageSource.includes("showFormRegion") &&
  pageSource.includes("showClarificationCard") &&
  pageSource.includes("showGenericStatusPanel = false") &&
  pageSource.includes("journeyState === BIV_JOURNEY_STATES.NORMAL_EVALUATION") &&
  pageSource.includes("journeyState === BIV_JOURNEY_STATES.SPECIALIST_ANALYSIS") &&
  pageSource.includes("{canCopyReport ? (") &&
  pageSource.includes("{canDownloadReport ? (") &&
  !pageSource.includes("{!isEligibilityResult && !industrialReport ? (") &&
  !pageSource.includes("const isEligibilityResult") &&
  !pageSource.includes("selectedRoute") &&
  !pageSource.includes("selectedJourneyState");

const englishEligibilityClarification = journeyStateResults.find((result) => result.name === "eligibility clarification");
const arabicEligibilityClarification = journeyStateResults.find((result) => result.name === "arabic eligibility clarification");
const englishFinancingClarification = journeyStateResults.find((result) => result.name === "financing clarification");
const arabicFinancingClarification = journeyStateResults.find((result) => result.name === "arabic financing clarification");
const eligibilityClarificationCopyPassed =
  englishEligibilityClarification?.presentationText.includes("nature of the activity and its content") &&
  arabicEligibilityClarification?.presentationText.includes("طبيعة النشاط ومحتواه") &&
  englishEligibilityClarification?.presentationText.includes("lawful, ethical") &&
  arabicEligibilityClarification?.presentationText.includes("النشاط مشروع وأخلاقي") &&
  !/\b(contract|return|repayment|financing structure)\b/i.test(englishEligibilityClarification?.presentationText || "") &&
  !/(العقد|العائد|السداد|صيغة التمويل|طبيعة العقد)/u.test(arabicEligibilityClarification?.presentationText || "");
const financingClarificationCopyPassed =
  englishFinancingClarification?.presentationText.includes("contract and return structure") &&
  arabicFinancingClarification?.presentationText.includes("طبيعة العقد والعائد") &&
  !englishFinancingClarification?.presentationText.includes("nature of the activity and its content") &&
  !arabicFinancingClarification?.presentationText.includes("طبيعة النشاط ومحتواه");

let missingClarificationSubtypeThrows = false;
try {
  resolveBusinessIdeaJourneyState({
    route: "needs_clarification",
    eligibility: { status: "needs_clarification" },
  });
} catch {
  missingClarificationSubtypeThrows = true;
}

const journeyStateContractPassed =
  journeyStateResults.every((result) => result.journeyState === result.expectedJourneyState) &&
  journeyStateResults.every((result) => result.canonicalJourneyStateOnly && result.canonicalRouteOnly && result.journeyStateValid) &&
  journeyStateResults.every((result) =>
    result.expectedClarificationType ? result.clarificationType === result.expectedClarificationType : true
  ) &&
  journeyStateResults.every((result) => (result.expectReport ? result.hasReportOutput : !result.hasReportOutput)) &&
  journeyStateResults
    .filter((result) => !result.expectReport)
    .every((result) => !result.hasCopyDownloadActions) &&
  journeyStateResults
    .filter((result) => result.expectReport)
    .every((result) => result.hasCopyDownloadActions) &&
  arabicClassificationJourney.journeyState ===
    journeyStateResults.find((result) => result.name === "classification review")?.journeyState &&
  pageRenderingGuardrailsPassed &&
  eligibilityClarificationCopyPassed &&
  financingClarificationCopyPassed &&
  missingClarificationSubtypeThrows;

console.log(
  JSON.stringify(
    {
      journeyStateContractPassed,
      pageRenderingGuardrailsPassed,
      eligibilityClarificationCopyPassed,
      financingClarificationCopyPassed,
      missingClarificationSubtypeThrows,
      journeyStateResults,
    },
    null,
    2
  )
);

if (!journeyStateContractPassed) {
  process.exitCode = 1;
}

const allowedOrchestratorRoutes = new Set([
  "ineligible",
  "needs_clarification",
  "guided_follow_up",
  "specialist_analysis",
  "normal_evaluation",
  "validation_error",
]);

function textFromDecisionResult(result = {}) {
  return [
    result.presentation?.heading,
    result.presentation?.body,
    result.presentation?.policy,
    result.presentation?.closing,
    ...(result.clarificationFlow?.steps || []).flatMap((step) =>
      (step.fields || []).map((field) => `${field.labelText || ""} ${field.helpText || ""} ${field.placeholderText || ""}`)
    ),
    result.industrialReport?.title,
    ...(result.industrialReport?.sections || []).flatMap((section) => [
      section.title,
      ...(section.items || []).map((item) => (typeof item === "string" ? item : `${item.title || ""} ${item.detail || ""}`)),
      ...(section.missing || []),
    ]),
    result.biggestRisk,
    result.nextAction,
  ]
    .filter(Boolean)
    .join(" ");
}

const crossDomainCases = [
  {
    name: "automated car wash",
    language: "en",
    input: {
      businessIdea: "An automated car wash near residential neighborhoods",
      targetCustomer: "",
      problem: "",
      monetization: "",
    },
    expectRoute: "guided_follow_up",
    expectType: "service",
    forbidPet: true,
  },
  {
    name: "car wash asking about cost and equipment",
    language: "en",
    input: {
      businessIdea: "An automated car wash",
      targetCustomer: "Drivers in residential neighborhoods",
      problem: "How much will it cost and what equipment and license do I need?",
      monetization: "Pay per wash.",
    },
    expectRoute: "normal_evaluation",
    expectExecutionStatus: "evaluated",
    expectType: "service",
    forbidPet: true,
  },
  {
    name: "explicit pet recycling plant",
    language: "en",
    input: {
      businessIdea: "A PET plastic recycling plant that processes bottle waste into washed flakes",
      targetCustomer: "Packaging producers buying recycled PET flakes",
      problem: "They need consistent recycled material supply.",
      monetization: "Sell washed PET flakes per ton.",
    },
    expectRoute: "needs_clarification",
    expectSpecialist: "pet_plastic_recycling",
  },
  {
    name: "automated laundry",
    language: "en",
    input: {
      businessIdea: "An automated laundry service for apartment residents",
      targetCustomer: "Busy apartment residents",
      problem: "They spend too much time washing and folding clothes.",
      monetization: "Pay per laundry order.",
    },
    expectType: "service",
    forbidPet: true,
  },
  {
    name: "vehicle workshop",
    language: "en",
    input: {
      businessIdea: "A vehicle repair workshop for small delivery fleets",
      targetCustomer: "Delivery fleet owners",
      problem: "Vehicle downtime delays customer deliveries.",
      monetization: "Pay per repair order.",
    },
    expectType: "service",
    forbidPet: true,
  },
  {
    name: "restaurant",
    language: "en",
    input: {
      businessIdea: "A healthy lunch restaurant near offices",
      targetCustomer: "Office workers",
      problem: "They need quick lunches during short breaks.",
      monetization: "Customers pay per meal.",
    },
    expectType: "service",
    forbidPet: true,
  },
  {
    name: "clinic",
    language: "en",
    input: {
      businessIdea: "A private clinic appointment follow-up service",
      targetCustomer: "Private clinics and patients",
      problem: "Patients miss appointments and clinics lose time.",
      monetization: "Monthly clinic fee.",
    },
    expectType: "service",
    forbidPet: true,
  },
  {
    name: "construction contractor",
    language: "en",
    input: {
      businessIdea: "A contractor service for small home renovations",
      targetCustomer: "Homeowners",
      problem: "They struggle to coordinate small renovation jobs.",
      monetization: "Fixed project fee.",
    },
    expectType: "service",
    forbidPet: true,
  },
  {
    name: "retail store",
    language: "en",
    input: {
      businessIdea: "A retail store selling imported workshop tools",
      targetCustomer: "Small workshop owners",
      problem: "They wait too long for replacement tools.",
      monetization: "Margin on product sales.",
    },
    expectType: "retail_trading",
    forbidPet: true,
  },
  {
    name: "two-sided marketplace",
    language: "en",
    input: {
      businessIdea: "A marketplace platform connecting homeowners with maintenance providers",
      targetCustomer: "Homeowners and independent technicians",
      problem: "Homeowners struggle to find available technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
    expectType: "marketplace_platform",
    forbidPet: true,
  },
  {
    name: "inventory software application",
    language: "en",
    input: {
      businessIdea: "A software application for restaurant inventory management",
      targetCustomer: "Restaurant managers",
      problem: "They lose money from stockouts and overordering.",
      monetization: "Monthly subscription.",
    },
    expectType: "digital_software",
    forbidPet: true,
  },
  {
    name: "consulting service",
    language: "en",
    input: {
      businessIdea: "A consulting service helping small retailers improve cash flow",
      targetCustomer: "Small retail owners",
      problem: "They do not know which costs are draining cash.",
      monetization: "Fixed consulting package.",
    },
    expectType: "service",
    forbidPet: true,
  },
  {
    name: "existing factory expansion",
    language: "en",
    input: {
      businessIdea: "An existing factory wants to add a second production line for custom packaging",
      targetCustomer: "Food producers",
      problem: "Customers wait too long for small packaging batches.",
      monetization: "Pay per approved order.",
    },
    feasibilityAnswers: {
      userExperienceLevel: "existing_business_owner",
      projectStageIntent: "expanding",
    },
    expectType: "industrial_manufacturing",
    forbidPet: true,
  },
];

const crossDomainResults = crossDomainCases.map((testCase) => {
  const flowAnswers = {
    ...phase3DefaultsFor(testCase.language),
    ...(testCase.feasibilityAnswers || {}),
  };
  const decision = orchestrateBusinessIdeaValidation({
    rawInput: testCase.input,
    language: testCase.language,
    feasibilityAnswers: flowAnswers,
  });
  const result = executeValidation(testCase.input, testCase.language, {}, testCase.feasibilityAnswers || {});
  const text = textFromDecisionResult(result);
  const hasPetLeak = /(PET|plastic|بلاستيك|نوع مخلفات البلاستيك|مخلفات البلاستيك|رقائق|حبيبات|جرانول)/u.test(text);
  return {
    name: testCase.name,
    route: decision.route,
    hasCanonicalRouteOnly: Object.keys(decision).filter((key) => key === "route" || key === "selectedRoute").length === 1,
    reasonText: decision.reasonText,
    businessType: decision.businessType,
    matchedSpecialist: decision.matchedSpecialist?.id || "",
    hasPetLeak,
    resultStatus: result.evaluationStatus,
    expected: testCase,
  };
});

const crossDomainPassed =
  crossDomainResults.every((result) => allowedOrchestratorRoutes.has(result.route)) &&
  crossDomainResults.every((result) => result.hasCanonicalRouteOnly) &&
  crossDomainResults.every((result) => typeof result.reasonText === "string" && result.reasonText.length > 10) &&
  crossDomainResults.every((result) => result.expected.expectRoute ? result.route === result.expected.expectRoute : true) &&
  crossDomainResults.every((result) => result.expected.expectType ? result.businessType === result.expected.expectType : true) &&
  crossDomainResults.every((result) => result.expected.expectSpecialist ? result.matchedSpecialist === result.expected.expectSpecialist : true) &&
  crossDomainResults.every((result) => result.expected.forbidPet ? !result.hasPetLeak && result.matchedSpecialist !== "pet_plastic_recycling" : true) &&
  crossDomainResults.find((result) => result.name === "inventory software application")?.businessType === "digital_software" &&
  crossDomainResults.find((result) => result.name === "explicit pet recycling plant")?.matchedSpecialist === "pet_plastic_recycling";

const stalePetDetails = {
  plasticWasteType: "PET bottles",
  intendedOutput: "Washed flakes",
  targetProductionCapacity: "one ton per day",
};
const staleCarWashDecision = orchestrateBusinessIdeaValidation({
  rawInput: {
    businessIdea: "An automated car wash",
    targetCustomer: "Drivers",
    problem: "They need faster car cleaning.",
    monetization: "Pay per wash.",
  },
  language: "en",
  industrialDetails: stalePetDetails,
});
const staleCarWashResult = executeValidation(
  {
    businessIdea: "An automated car wash",
    targetCustomer: "Drivers",
    problem: "They need faster car cleaning.",
    monetization: "Pay per wash.",
  },
  "en",
  stalePetDetails
);
const correctionDecision = orchestrateBusinessIdeaValidation({
  rawInput: {
    businessIdea: "A tool for tracking stock, orders, and customer service",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  language: "en",
  feasibilityAnswers: {
    classificationConfirmation: "correct",
    projectTypeCorrection: "digital_software",
    operatingModelCorrection: "digital_remote",
  },
});
const ineligiblePriorityDecision = orchestrateBusinessIdeaValidation({
  rawInput: {
    businessIdea: "A phishing scam platform asking what equipment and licenses are needed",
    targetCustomer: "Scammers",
    problem: "They want to steal accounts.",
    monetization: "Monthly fee.",
  },
  language: "en",
});
const financePriorityDecision = orchestrateBusinessIdeaValidation({
  rawInput: {
    businessIdea: "A funding platform with periodic fixed financial returns and repayment period",
    targetCustomer: "Small businesses",
    problem: "They need funding quickly.",
    monetization: "Fee on funded amounts.",
  },
  language: "en",
});
const staleStatePassed =
  staleCarWashDecision.matchedSpecialist === null &&
  !/PET|plastic|بلاستيك|نوع مخلفات البلاستيك|مخلفات البلاستيك/u.test(textFromDecisionResult(staleCarWashResult)) &&
  correctionDecision.businessType === "digital_software" &&
  correctionDecision.route === "guided_follow_up" &&
  ineligiblePriorityDecision.route === "ineligible" &&
  ineligiblePriorityDecision.classificationConfidence === "not_evaluated" &&
  ineligiblePriorityDecision.proposedClassification?.confidence === "not_evaluated" &&
  !ineligiblePriorityDecision.analysisPayload &&
  financePriorityDecision.route === "needs_clarification" &&
  financePriorityDecision.classificationConfidence === "not_evaluated" &&
  financePriorityDecision.proposedClassification?.confidence === "not_evaluated" &&
  !financePriorityDecision.analysisPayload;

console.log(JSON.stringify({ crossDomainPassed, staleStatePassed, crossDomainResults }, null, 2));

if (!crossDomainPassed || !staleStatePassed) {
  process.exitCode = 1;
}

const arabicPersonalization = executeValidation(
  {
    businessIdea: "خدمة تساعد العيادات الصغيرة على تقليل المواعيد الفائتة",
    targetCustomer: "العيادات الخاصة الصغيرة في الرياض",
    problem: "كيف يقللون غياب المرضى عن المواعيد",
    currentSolution: "رسائل تذكير آلية عبر واتساب",
    competitiveAdvantage: "صياغة عربية بسيطة تناسب أسلوب العيادات المحلية",
    monetization: "رسوم شهرية لكل عيادة",
    stage: "idea",
  },
  "ar"
);

const arabicText = `${arabicPersonalization.biggestRisk} ${arabicPersonalization.nextAction}`;
const arabicPersonalizationPassed =
  arabicPersonalization.ok &&
  /[\u0600-\u06FF]/.test(arabicText) &&
  !/[A-Za-z]/.test(arabicText) &&
  !/(أن\s+كيف|هي\s+أن\s+كيف|لدى.+هي\s+أن)/.test(arabicText) &&
  !/(مؤلمة|تؤلم|الألم|غموض الألم|حاجة السوق مؤلمة|حاجة السوق متكررة)/.test(arabicText) &&
  !arabicText.includes("قد لا تكون حاجة السوق مؤلمة أو متكررة بما يكفي") &&
  !arabicText.includes("تحقق مما إذا كانت المشكلة عاجلة أو متكررة أو مكلفة") &&
  arabicPersonalization.biggestRisk.includes("العيادات الخاصة الصغيرة في الرياض") &&
  arabicPersonalization.biggestRisk.includes("غياب المرضى عن المواعيد") &&
  arabicPersonalization.biggestRisk.includes("رسائل تذكير آلية عبر واتساب") &&
  arabicPersonalization.nextAction.includes("10 أشخاص") &&
  arabicPersonalization.nextAction.includes("6 منهم على الأقل") &&
  arabicPersonalization.nextAction.length < 330 &&
  arabicPersonalization.biggestRisk.length < 330;

console.log(
  JSON.stringify(
    {
      arabicPersonalizationPassed,
      arabicPersonalization: {
        ok: arabicPersonalization.ok,
        biggestRisk: arabicPersonalization.biggestRisk,
        nextAction: arabicPersonalization.nextAction,
      },
    },
    null,
    2
  )
);

if (!arabicPersonalizationPassed) {
  process.exitCode = 1;
}

const difficultArabicInput = {
  businessIdea:
    "منصة سوق تجمع أهل مهن متشابهة وتسهّل تواصلهم مع العملاء، وتعرض أعمالهم وخدماتهم في مكان واحد داخل المدينة",
  targetCustomer:
    "أصحاب المهن الحرة والحرفيون مثل المصورين ومصممي الديكور وفنيي الصيانة الذين يعملون بشكل مستقل ويبحثون عن عملاء جدد",
  problem:
    "1. صعوبة الوصول إلى العملاء المناسبين بشكل مستمر 2. كيفية حساب العمولات وتقسيم الدخل بين المنصة ومقدم الخدمة 3. تنظيم المواعيد والرد على العملاء 4. بناء الثقة بين العميل ومقدم الخدمة عند أول تعامل",
  currentSolution:
    "يعتمدون حالياً على واتساب وإنستغرام والتوصيات الشخصية، وأحياناً يدفعون لإعلانات غير منتظمة أو ينتظرون إحالات من معارفهم",
  competitiveAdvantage:
    "المنصة تجمع مقدمي الخدمة المتشابهين حسب التخصص والمنطقة وتسهّل المقارنة والتواصل بدون خطوات كثيرة",
  monetization: "الدفع بالنسبة المئوية من كل عملية ناجحة أو عمولة من مقدم الخدمة",
  stage: "idea",
};

const difficultArabicResult = executeValidation(difficultArabicInput, "ar");
const difficultArabicReportText = difficultArabicResult.ok
  ? difficultArabicResult.report.sections
      .map((section) =>
        `${section.title}: ${
          Array.isArray(section.content)
            ? section.content.map((item) => `${item.title || ""} ${item.detail || ""}`).join(" ")
            : section.content
        }`
      )
      .join("\n")
  : "";
const difficultArabicCombined = [
  difficultArabicResult.biggestRisk,
  difficultArabicResult.nextAction,
  difficultArabicResult.recommendation?.executiveSummary,
  difficultArabicReportText,
  ...(difficultArabicResult.criteria || []).map((criterion) => criterion.reason),
].join(" ");
const difficultArabicExecutive = difficultArabicResult.report?.sections?.find((section) => section.key === "executive")?.content || "";
const difficultArabicAction = difficultArabicResult.report?.sections?.find((section) => section.key === "action")?.content || [];
const difficultArabicActionText = Array.isArray(difficultArabicAction)
  ? difficultArabicAction.map((item) => item.detail).join(" ")
  : String(difficultArabicAction || "");
const problemReason = difficultArabicResult.criteria?.find((criterion) => criterion.key === "problemClarity")?.reason || "";

const difficultArabicRegressionPassed =
  difficultArabicResult.ok &&
  difficultArabicResult.recommendation?.hasMultipleProblems === true &&
  /مشكلة واحدة|مشكلة رئيسية واحدة|حالة استخدام أولى/.test(difficultArabicCombined) &&
  /أصحاب المهن الحرة|الحرفيون|مقدمي الخدمة/.test(difficultArabicCombined) &&
  /صعوبة الوصول إلى العملاء المناسبين/.test(difficultArabicCombined) &&
  /جدوى العمولة أو النسبة من كل عملية ناجحة/.test(difficultArabicCombined) &&
  !/[0-9١-٩]\s*[\).\-:：]/u.test(difficultArabicCombined) &&
  !difficultArabicCombined.includes("...") &&
  !/كيفية حساب الع/.test(difficultArabicCombined) &&
  !/الدفع عبر بالنسبة|بالنسبة المئوية|الدفع عبر عمولة/.test(difficultArabicCombined) &&
  !/جمع أهل مهن متشابهة وتسهيل تواصلهم مع العملاء.*العميل/.test(difficultArabicCombined) &&
  difficultArabicExecutive !== difficultArabicActionText &&
  !difficultArabicActionText.includes(difficultArabicExecutive) &&
  /أكثر من مشكلة|مشكلة واحدة|حالة استخدام أولى/.test(problemReason);

console.log(
  JSON.stringify(
    {
      difficultArabicRegressionPassed,
      difficultArabic: {
        ok: difficultArabicResult.ok,
        weakest: difficultArabicResult.criteria?.reduce((min, c) => (c.score < min.score ? c : min), difficultArabicResult.criteria[0])?.key,
        problemReason,
        executiveSummary: difficultArabicExecutive,
        biggestRisk: difficultArabicResult.biggestRisk,
        nextAction: difficultArabicResult.nextAction,
      },
    },
    null,
    2
  )
);

if (!difficultArabicRegressionPassed) {
  process.exitCode = 1;
}

const homeownerMetaProblemResult = executeValidation(
  {
    businessIdea: "منصة تجمع أصحاب المنازل مع مقدمي خدمات الصيانة والإصلاح لكل المهن",
    targetCustomer: "اصحاب المنازل و جميع متطلبات الصيانة و الاصلاح لكل المهن",
    problem: "1. تحويل الفكرة الى عمل 2. صعوبة تحديد أول خدمة صيانة 3. معرفة طريقة الدفع المناسبة",
    currentSolution: "",
    competitiveAdvantage: "تسهيل الوصول إلى الفني المناسب حسب نوع الصيانة والمنطقة",
    monetization: "الدفع بالنسبة المئوية من كل عملية ناجحة",
    stage: "idea",
  },
  "ar"
);
const homeownerMetaProblemText = [
  homeownerMetaProblemResult.biggestRisk,
  homeownerMetaProblemResult.nextAction,
  homeownerMetaProblemResult.recommendation?.executiveSummary,
  ...(homeownerMetaProblemResult.criteria || []).map((criterion) => criterion.reason),
].join(" ");
const homeownerMetaProblemPassed =
  homeownerMetaProblemResult.ok &&
  homeownerMetaProblemResult.recommendation?.hasMetaProblem === true &&
  homeownerMetaProblemText.includes("أصحاب المنازل") &&
  homeownerMetaProblemText.includes("تعليقي على خانة المشكلة") &&
  homeownerMetaProblemText.includes("اختيار أول خدمة") &&
  homeownerMetaProblemText.includes("الحل: أعد كتابة المشكلة") &&
  homeownerMetaProblemText.includes("العثور على فني موثوق بسرعة وبسعر واضح") &&
  !homeownerMetaProblemText.includes("صعوبة في صعوبة") &&
  homeownerMetaProblemText.includes("جدوى العمولة أو النسبة من كل عملية ناجحة") &&
  !homeownerMetaProblemText.includes("تحويل الفكرة") &&
  !homeownerMetaProblemText.includes("اصحاب المنازل و جميع") &&
  !homeownerMetaProblemText.includes("كيفية حساب الع") &&
  !homeownerMetaProblemText.includes("...");

console.log(
  JSON.stringify(
    {
      homeownerMetaProblemPassed,
      homeownerMetaProblem: {
        ok: homeownerMetaProblemResult.ok,
        executiveSummary: homeownerMetaProblemResult.recommendation?.executiveSummary,
        biggestRisk: homeownerMetaProblemResult.biggestRisk,
        nextAction: homeownerMetaProblemResult.nextAction,
      },
    },
    null,
    2
  )
);

if (!homeownerMetaProblemPassed) {
  process.exitCode = 1;
}

const marketplaceExecutionProblemResult = executeValidation(
  {
    businessIdea: "منصة تربط أصحاب المنازل مع الفنيين وأصحاب الورش لتنفيذ خدمات الصيانة",
    targetCustomer: "اصحاب المنازل و اصحاب الورش و كل طالبي خدمات فنية",
    problem:
      "١-تنفيذ الفكرة ٢-اقناع مجموعة كافية من الفنين للاشتراك ٣-عملية ربط العملاء مع اصحاب المهن",
    currentSolution: "",
    competitiveAdvantage: "تسهيل الوصول إلى الفني المناسب وربط العميل بصاحب المهنة بسرعة",
    monetization: "بحتساب نسب يدفعها الفني مقابل توصيله مع عميل",
    stage: "idea",
  },
  "ar"
);
const marketplaceExecutionProblemText = [
  marketplaceExecutionProblemResult.biggestRisk,
  marketplaceExecutionProblemResult.nextAction,
  marketplaceExecutionProblemResult.recommendation?.executiveSummary,
  ...(marketplaceExecutionProblemResult.criteria || []).map((criterion) => criterion.reason),
  ...(marketplaceExecutionProblemResult.report?.sections || []).flatMap((section) =>
    Array.isArray(section.content)
      ? section.content.map((item) => `${item.title || ""} ${item.detail || ""}`)
      : section.content || ""
  ),
].join(" ");
const marketplaceExecutionProblemPassed =
  marketplaceExecutionProblemResult.ok &&
  marketplaceExecutionProblemResult.recommendation?.hasMetaProblem === true &&
  marketplaceExecutionProblemText.includes("أصحاب المنازل وطالبي الخدمات الفنية") &&
  marketplaceExecutionProblemText.includes("تعليقي على خانة المشكلة") &&
  marketplaceExecutionProblemText.includes("تنفيذ المشروع") &&
  marketplaceExecutionProblemText.includes("جذب مقدمي الخدمة") &&
  marketplaceExecutionProblemText.includes("ربط العميل بمقدم الخدمة") &&
  marketplaceExecutionProblemText.includes("الحل: أعد كتابة المشكلة") &&
  marketplaceExecutionProblemText.includes("العثور على فني موثوق بسرعة وبسعر واضح") &&
  marketplaceExecutionProblemText.includes("العميل المستهدف يضم أكثر من مجموعة") &&
  marketplaceExecutionProblemText.includes("ارسم سيناريو واحداً شائعاً") &&
  !marketplaceExecutionProblemText.includes("صعوبة في صعوبة") &&
  marketplaceExecutionProblemText.includes("جدوى العمولة أو النسبة من كل عملية ناجحة") &&
  !marketplaceExecutionProblemText.includes("تنفيذ الفكرة") &&
  !marketplaceExecutionProblemText.includes("اقناع مجموعة") &&
  !marketplaceExecutionProblemText.includes("إقناع مجموعة") &&
  !marketplaceExecutionProblemText.includes("عملية ربط العملاء") &&
  !marketplaceExecutionProblemText.includes("بحتساب نسب") &&
  !marketplaceExecutionProblemText.includes("العميل المستهدف محدد بما يكفي للاختبار") &&
  !marketplaceExecutionProblemText.includes("رسم سيناريو واحد شائع") &&
  !/[0-9١-٩]\s*[\).\-:：]/u.test(marketplaceExecutionProblemText) &&
  !marketplaceExecutionProblemText.includes("...");

console.log(
  JSON.stringify(
    {
      marketplaceExecutionProblemPassed,
      marketplaceExecutionProblem: {
        ok: marketplaceExecutionProblemResult.ok,
        executiveSummary: marketplaceExecutionProblemResult.recommendation?.executiveSummary,
        biggestRisk: marketplaceExecutionProblemResult.biggestRisk,
        nextAction: marketplaceExecutionProblemResult.nextAction,
      },
    },
    null,
    2
  )
);

if (!marketplaceExecutionProblemPassed) {
  process.exitCode = 1;
}

const plasticRecyclingCase = {
  businessIdea: "مصنع إعادة تدوير البلاستيك القطاع: الصناعات",
  targetCustomer: "السوق الداخلي للصناعات البلاستيكية",
  problem:
    "١- هل المشروع يستحق العناء، بمعنى: هل المشروع مجدٍ؟ ٢- تحديد الموقع المناسب. ٣- ما نوع الآليات المطلوبة لأداء العمل؟ ٤- هل تشغيل الآليات يحتاج مهارات خاصة؟ ٥- مشكلة التسويق: كيف يمكن أن تتم؟",
  currentSolution: "لا توجد حلول لدى العميل.",
  competitiveAdvantage: "توجد أصوات تنادي بأن إعادة التصنيع مربحة بنسب عالية.",
  monetization: "عند بيع المنتجات.",
  stage: "idea",
};

const plasticRequestAssessment = assessBusinessIdeaRequest(plasticRecyclingCase, "ar");
const plasticResult = executeValidation(plasticRecyclingCase, "ar");
const plasticPresentationText = [
  plasticResult.presentation?.heading,
  plasticResult.presentation?.body,
  plasticResult.presentation?.policy,
  ...(plasticResult.presentation?.questions || []),
  plasticResult.presentation?.closing,
].join(" ");
const plasticForbiddenFragments = [
  "هل المشروع يستحق العناء",
  "تحديد الموقع المناسب",
  "ما نوع الآليات المطلوبة",
  "هل تشغيل الآليات يحتاج مهارات خاصة",
  "مشكلة التسويق",
];
const plasticRecyclingRegressionPassed =
  plasticRequestAssessment.projectType === "industrial_manufacturing" &&
  plasticRequestAssessment.requestType === "investment_assessment" &&
  plasticRequestAssessment.requestedQuestions.length >= 5 &&
  plasticResult.ok &&
  plasticResult.evaluationStatus === "needs_clarification" &&
  plasticResult.requestAssessment?.projectType === "industrial_manufacturing" &&
  plasticResult.requestAssessment?.requestType === "investment_assessment" &&
  !plasticResult.score &&
  !plasticResult.report &&
  !plasticResult.biggestRisk &&
  !plasticResult.nextAction &&
  plasticPresentationText.includes("مشروع صناعي") &&
  /تقييم(?:اً)? استثماري(?:اً)?/.test(plasticPresentationText) &&
  plasticPresentationText.includes("نوع مخلفات البلاستيك") &&
  plasticPresentationText.includes("الميزانية المتاحة بالريال") &&
  plasticPresentationText.includes("الطاقة الإنتاجية") &&
  plasticPresentationText.includes("المشترون المتوقعون") &&
  !plasticForbiddenFragments.some((fragment) => plasticPresentationText.includes(fragment));

console.log(
  JSON.stringify(
    {
      plasticRecyclingRegressionPassed,
      plasticRecycling: {
        requestType: plasticRequestAssessment.requestType,
        projectType: plasticRequestAssessment.projectType,
        requestedQuestionCount: plasticRequestAssessment.requestedQuestions.length,
        evaluationStatus: plasticResult.evaluationStatus,
        hasScore: Boolean(plasticResult.score),
        hasReport: Boolean(plasticResult.report),
        heading: plasticResult.presentation?.heading,
      },
    },
    null,
    2
  )
);

if (!plasticRecyclingRegressionPassed) {
  process.exitCode = 1;
}

const completeIndustrialDetails = {
  plasticWasteType: "pet",
  intendedOutput: "washed_flakes",
  targetProductionCapacity: "2 tons per day",
  availableBudgetSar: "900000 SAR",
  preferredCityRegion: "Riyadh Industrial City",
  existingPremises: "no",
  wasteSourceQuantity: "Supplier agreements for about 45 tons monthly",
  industrialExperienceTeam: "Operations manager plus two trained technicians",
  expectedBuyers: "Local packaging factories and plastic product manufacturers",
  salesScope: "local",
};
const originalPlasticProblem = plasticRecyclingCase.problem;
const readyIndustrialResult = executeValidation(plasticRecyclingCase, "ar", completeIndustrialDetails);
const readyIndustrialText = readyIndustrialResult.industrialReport
  ? buildIndustrialReportText({ report: readyIndustrialResult.industrialReport, language: "ar" })
  : "";
const partialIndustrialAssessment = assessBusinessIdeaRequest(plasticRecyclingCase, "ar", {
  plasticWasteType: "pet",
  intendedOutput: "washed_flakes",
});
const requestGatePageSource = readFileSync(new URL("../../../src/pages/BusinessIdeaValidatorPage.jsx", import.meta.url), "utf8");
const allStepFieldIds = industrialClarificationSteps.flatMap((step) => step.fields);
const structuredClarificationFlowPassed =
  industrialClarificationFields.length === 10 &&
  new Set(industrialClarificationFields.map((field) => field.id)).size === 10 &&
  allStepFieldIds.length === 10 &&
  allStepFieldIds.every((fieldId) => industrialClarificationFields.some((field) => field.id === fieldId)) &&
  plasticResult.clarificationFlow?.steps?.length >= 1 &&
  plasticResult.clarificationFlow.steps.every((step) => step.fields.length > 0) &&
  plasticResult.clarificationFlow.steps.every((step) => step.fields.every((field) => field.id && field.labelText && field.type)) &&
  partialIndustrialAssessment.missingFields.includes("availableBudgetSar") &&
  !partialIndustrialAssessment.missingFields.includes("plasticWasteType") &&
  !partialIndustrialAssessment.missingFields.includes("intendedOutput") &&
  readyIndustrialResult.evaluationStatus === "industrial_assessment" &&
  readyIndustrialResult.requestAssessment?.reason === "industrial_details_complete" &&
  readyIndustrialResult.industrialDetails?.availableBudgetSar === "900000 SAR" &&
  readyIndustrialResult.industrialDetails?.expectedBuyers.includes("packaging factories") &&
  !readyIndustrialResult.score &&
  !readyIndustrialResult.report &&
  Boolean(readyIndustrialResult.industrialReport) &&
  readyIndustrialResult.industrialReport?.subtype === "plastic_recycling" &&
  readyIndustrialResult.industrialReport?.sections?.find((section) => section.key === "customerQuestions")?.items?.length === 5 &&
  readyIndustrialText.includes("الجدوى الأولية") &&
  readyIndustrialText.includes("الموقع") &&
  readyIndustrialText.includes("المعدات") &&
  readyIndustrialText.includes("مهارات التشغيل") &&
  readyIndustrialText.includes("التسويق") &&
  readyIndustrialText.includes("الغسيل") &&
  readyIndustrialText.includes("المياه والصرف") &&
  readyIndustrialText.includes("لم يُحسب بعد") &&
  !readyIndustrialText.includes("جاهز للتحليل الصناعي") &&
  !readyIndustrialText.includes("المرحلة الأولى") &&
  !readyIndustrialText.includes("المرحلة الثانية") &&
  !readyIndustrialText.includes("محرك") &&
  !readyIndustrialText.includes("Overall score") &&
  !readyIndustrialText.includes("Total Score") &&
  plasticRecyclingCase.problem === originalPlasticProblem &&
  requestGatePageSource.includes("useState(initialIndustrialDetails)") &&
  requestGatePageSource.includes("setIndustrialClarificationStep") &&
  requestGatePageSource.includes("handleClarificationDetailChange") &&
  requestGatePageSource.includes("handleContinueIndustrialClarification") &&
  requestGatePageSource.includes("clarification-fields") &&
  requestGatePageSource.includes("clarification-stepper") &&
  requestGatePageSource.includes("Continue evaluation") === false;

console.log(
  JSON.stringify(
    {
      structuredClarificationFlowPassed,
      readyIndustrial: {
        status: readyIndustrialResult.evaluationStatus,
        hasScore: Boolean(readyIndustrialResult.score),
        hasReport: Boolean(readyIndustrialResult.report),
        hasIndustrialReport: Boolean(readyIndustrialResult.industrialReport),
        preservedProblem: plasticRecyclingCase.problem === originalPlasticProblem,
      },
      partialMissingFields: partialIndustrialAssessment.missingFields,
    },
    null,
    2
  )
);

if (!structuredClarificationFlowPassed) {
  process.exitCode = 1;
}

function buildOutputResult(output) {
  return executeValidation(
    plasticRecyclingCase,
    "en",
    {
      ...completeIndustrialDetails,
      intendedOutput: output,
      plasticWasteType: "mixed",
      preferredCityRegion: "Jeddah",
      targetProductionCapacity: "3 tons per day",
      expectedBuyers: "Plastic manufacturers and packaging factories",
      salesScope: "both",
    }
  );
}

const outputPathResults = {
  sortedBaled: buildOutputResult("sorted_baled"),
  washedFlakes: buildOutputResult("washed_flakes"),
  pellets: buildOutputResult("pellets"),
  finishedProducts: buildOutputResult("finished_products"),
};

const outputTexts = Object.fromEntries(
  Object.entries(outputPathResults).map(([key, result]) => [
    key,
    buildIndustrialReportText({ report: result.industrialReport, language: "en" }),
  ])
);

const industrialAnalysisPassed =
  Object.values(outputPathResults).every((result) => result.evaluationStatus === "industrial_assessment" && result.industrialReport && !result.score && !result.report) &&
  outputTexts.sortedBaled.includes("Baling") &&
  outputTexts.sortedBaled.includes("Later expansion") &&
  !outputTexts.sortedBaled.includes("wastewater") &&
  outputTexts.washedFlakes.includes("Washing") &&
  outputTexts.washedFlakes.includes("water, and wastewater") &&
  outputTexts.pellets.includes("Extrusion") &&
  outputTexts.pellets.includes("Pelletizing") &&
  outputTexts.finishedProducts.includes("Forming or conversion process") &&
  outputTexts.finishedProducts.includes("Molds or tooling") &&
  !Object.values(outputTexts).some((text) => /Phase 1|Phase 2|engine|ready_for_industrial_analysis/i.test(text)) &&
  outputTexts.washedFlakes.includes("Preliminary viability") &&
  outputTexts.washedFlakes.includes("Not yet calculated") &&
  outputTexts.washedFlakes.includes("Selling price per unit") &&
  outputTexts.washedFlakes.includes("This is a preliminary decision-support assessment");

console.log(
  JSON.stringify(
    {
      industrialAnalysisPassed,
      outputStatuses: Object.fromEntries(
        Object.entries(outputPathResults).map(([key, result]) => [key, result.evaluationStatus])
      ),
      equipmentSignals: {
        sortedBaledHasBaling: outputTexts.sortedBaled.includes("Baling"),
        washedHasWater: outputTexts.washedFlakes.includes("wastewater"),
        pelletsHasExtrusion: outputTexts.pellets.includes("Extrusion"),
        finishedHasTooling: outputTexts.finishedProducts.includes("Molds or tooling"),
      },
    },
    null,
    2
  )
);

if (!industrialAnalysisPassed) {
  process.exitCode = 1;
}

const manualQaPetMismatchDetails = {
  plasticWasteType: "pet",
  intendedOutput: "sorted_baled",
  targetProductionCapacity: "1 ton per month",
  availableBudgetSar: "SAR 20,000",
  preferredCityRegion: "Jeddah",
  existingPremises: "no",
  wasteSourceQuantity: "هي تعتمد على العاملة لجمع العلب الفارغة من الحاويات او من الشارغ",
  industrialExperienceTeam: "لا يوجد",
  expectedBuyers: "مصانع تنتج أكياس نفايات أو أكياس تسوق أو منتجات بلاستيكية من البلاستيك المعاد تدويره",
  salesScope: "both",
};

const manualQaPetMismatchResult = executeValidation(plasticRecyclingCase, "ar", manualQaPetMismatchDetails);
const manualQaPetMismatchText = buildIndustrialReportText({
  report: manualQaPetMismatchResult.industrialReport,
  language: "ar",
});

const missingCapacityPeriodResult = executeValidation(plasticRecyclingCase, "ar", {
  ...manualQaPetMismatchDetails,
  targetProductionCapacity: "1 ton",
});

const capacityWithDayResult = executeValidation(plasticRecyclingCase, "en", {
  ...manualQaPetMismatchDetails,
  targetProductionCapacity: "1 ton per day",
  wasteSourceQuantity: "Workers collect discarded bottles from bins and streets",
  industrialExperienceTeam: "none",
  expectedBuyers: "Factories producing garbage bags and shopping bags",
});

const compatiblePetBuyerResult = executeValidation(plasticRecyclingCase, "en", {
  ...manualQaPetMismatchDetails,
  targetProductionCapacity: "1 ton per month",
  wasteSourceQuantity: "Supplier agreement for 8 tons monthly of PET bottles",
  industrialExperienceTeam: "One trained sorting supervisor",
  expectedBuyers: "PET bottle recyclers and PET flake producers that accept PET bales",
  salesScope: "local",
});
const compatiblePetBuyerText = buildIndustrialReportText({
  report: compatiblePetBuyerResult.industrialReport,
  language: "en",
});

const manualQaIndustrialCorrectionPassed =
  manualQaPetMismatchResult.evaluationStatus === "industrial_assessment" &&
  manualQaPetMismatchResult.industrialReport?.decision?.key === "notReady" &&
  manualQaPetMismatchText.includes("غير جاهز للاستثمار كمصنع بصورته الحالية") &&
  manualQaPetMismatchText.includes("PET") &&
  manualQaPetMismatchText.includes("أكياس النفايات أو التسوق") &&
  manualQaPetMismatchText.includes("مصانع منتجات بلاستيكية مثل أكياس النفايات أو التسوق، ولم تُثبت بعد مواصفات قبول PET") &&
  manualQaPetMismatchText.includes("المصدر المقترح حالياً هو جمع العبوات المستعملة بواسطة عمالة من الحاويات والأماكن العامة، دون اتفاقيات توريد موثقة") &&
  manualQaPetMismatchText.includes("الكمية والاستمرارية والتلوث والسلامة والتخزين والنقل") &&
  manualQaPetMismatchText.includes("لم يثبت أنها تغطي مقر التشغيل") &&
  manualQaPetMismatchText.includes("تجربة جمع وفرز محدودة") &&
  manualQaPetMismatchText.includes("اعتبر التصدير مساراً لاحقاً") &&
  manualQaPetMismatchText.includes("حاويات الجمع واللوجستيات") &&
  manualQaPetMismatchText.includes("السلامة الأساسية ومكافحة الحريق") &&
  manualQaPetMismatchText.includes("الغسيل أو التقطيع") &&
  manualQaPetMismatchText.includes("توسع لاحق") &&
  !manualQaPetMismatchText.includes("هي تعتمد على العاملة لجمع العلب الفارغة") &&
  !manualQaPetMismatchText.includes("الشارغ") &&
  !manualQaPetMismatchText.includes("قد يكون مجدياً بشروط محددة") &&
  !manualQaPetMismatchText.includes("أدلة غير كافية") &&
  missingCapacityPeriodResult.evaluationStatus === "needs_clarification" &&
  missingCapacityPeriodResult.requestAssessment?.missingFields?.includes("targetProductionCapacity") &&
  !missingCapacityPeriodResult.score &&
  !missingCapacityPeriodResult.report &&
  capacityWithDayResult.evaluationStatus === "industrial_assessment" &&
  compatiblePetBuyerResult.evaluationStatus === "industrial_assessment" &&
  compatiblePetBuyerResult.industrialReport?.decision?.key !== "notReady" &&
  !compatiblePetBuyerText.includes("garbage or shopping bag factories") &&
  !compatiblePetBuyerText.includes("Mismatch requiring verification");

console.log(
  JSON.stringify(
    {
      manualQaIndustrialCorrectionPassed,
      manualQaPetMismatch: {
        status: manualQaPetMismatchResult.evaluationStatus,
        decision: manualQaPetMismatchResult.industrialReport?.decision?.label,
        hasScore: Boolean(manualQaPetMismatchResult.score),
        hasGenericReport: Boolean(manualQaPetMismatchResult.report),
      },
      missingCapacityPeriod: {
        status: missingCapacityPeriodResult.evaluationStatus,
        missingFields: missingCapacityPeriodResult.requestAssessment?.missingFields,
      },
      compatiblePetBuyerDecision: compatiblePetBuyerResult.industrialReport?.decision?.label,
    },
    null,
    2
  )
);

if (!manualQaIndustrialCorrectionPassed) {
  process.exitCode = 1;
}

const englishIndustrialCase = {
  businessIdea: "A plastic recycling plant for domestic plastic industries",
  targetCustomer: "Domestic plastic manufacturers",
  problem:
    "1. Is the project financially viable? 2. Which location is suitable? 3. What machinery is required? 4. Does operating the machinery require special skills? 5. How should marketing work?",
  currentSolution: "No current solution.",
  competitiveAdvantage: "Some market voices say recycling can be highly profitable.",
  monetization: "Revenue when products are sold.",
  stage: "idea",
};
const englishIndustrialResult = executeValidation(englishIndustrialCase, "en");
const englishIndustrialText = [
  englishIndustrialResult.presentation?.heading,
  englishIndustrialResult.presentation?.body,
  englishIndustrialResult.presentation?.policy,
  ...(englishIndustrialResult.presentation?.questions || []),
].join(" ");
const englishIndustrialRegressionPassed =
  englishIndustrialResult.evaluationStatus === "needs_clarification" &&
  englishIndustrialResult.requestAssessment?.projectType === "industrial_manufacturing" &&
  englishIndustrialResult.requestAssessment?.requestType === "investment_assessment" &&
  !englishIndustrialResult.score &&
  !englishIndustrialResult.report &&
  englishIndustrialText.includes("initial investment assessment for an industrial project") &&
  englishIndustrialText.includes("Type of plastic waste") &&
  englishIndustrialText.includes("Available budget in SAR") &&
  !englishIndustrialText.includes("Is the project financially viable");

const ordinaryQuestionCase = executeValidation(
  {
    businessIdea: "A booking app for neighborhood tutors",
    targetCustomer: "Parents looking for vetted math tutors",
    problem: "Parents ask: who is available this week, how much do they charge, and can I trust them?",
    currentSolution: "They ask friends or search social media.",
    competitiveAdvantage: "Verified tutor profiles and simple booking.",
    monetization: "Commission on each booked session.",
    stage: "idea",
  },
  "en"
);

const completeIndustrialCase = executeValidation(
  {
    businessIdea: "A plastic recycling plant that converts PET bottles into washed flakes",
    targetCustomer: "Local plastic packaging manufacturers",
    problem: "Factories need reliable local PET flakes because imported material is delayed and expensive.",
    currentSolution: "They buy imported PET flakes from regional suppliers.",
    competitiveAdvantage: "Local sourcing and faster delivery.",
    monetization: "Selling washed PET flakes to factories.",
    stage: "idea",
  },
  "en"
);

const truncatedCase = executeValidation(
  {
    businessIdea: "A marketplace for industrial spare parts...",
    targetCustomer: "Small factories",
    problem: "They cannot find urgent replacement parts quickly.",
    currentSolution: "They call suppliers manually.",
    competitiveAdvantage: "Fast supplier matching.",
    monetization: "Commission on each order.",
    stage: "idea",
  },
  "en"
);

const requestQualityGateRegressionPassed =
  englishIndustrialRegressionPassed &&
  ordinaryQuestionCase.evaluationStatus === "evaluated" &&
  Boolean(ordinaryQuestionCase.score) &&
  Boolean(ordinaryQuestionCase.report) &&
  completeIndustrialCase.evaluationStatus === "needs_clarification" &&
  completeIndustrialCase.orchestrationDecision?.matchedSpecialist?.id === "pet_plastic_recycling" &&
  !completeIndustrialCase.score &&
  !completeIndustrialCase.report &&
  truncatedCase.evaluationStatus === "feasibility_followup" &&
  !truncatedCase.score &&
  !truncatedCase.report &&
  !/Type of plastic waste|Source and expected quantity of plastic waste|PET|نوع مخلفات البلاستيك|مخلفات البلاستيك/u.test(textFromDecisionResult(truncatedCase));

console.log(
  JSON.stringify(
    {
      requestQualityGateRegressionPassed,
      englishIndustrialRegressionPassed,
      ordinaryQuestionStatus: ordinaryQuestionCase.evaluationStatus,
      completeIndustrialStatus: completeIndustrialCase.evaluationStatus,
      truncatedStatus: truncatedCase.evaluationStatus,
    },
    null,
    2
  )
);

if (!requestQualityGateRegressionPassed) {
  process.exitCode = 1;
}

const eligibilityCases = [
  {
    name: "acceptable lawful business",
    language: "en",
    input: {
      businessIdea: "A scheduling tool for independent home maintenance providers",
      targetCustomer: "Small home maintenance teams",
      problem: "They lose appointments because customer requests are spread across calls and messages.",
      monetization: "Monthly subscription",
    },
    expectedStatus: "evaluated",
  },
  {
    name: "clearly prohibited harmful business",
    language: "en",
    input: {
      businessIdea: "An online casino and sports betting marketplace",
      targetCustomer: "Young mobile users",
      problem: "They want easier access to betting games.",
      monetization: "Commission on bets",
    },
    expectedStatus: "ineligible",
  },
  {
    name: "ambiguous business needs clarification",
    language: "en",
    input: {
      businessIdea: "A private membership app for adult entertainment and nightlife events",
      targetCustomer: "Adults looking for premium entertainment",
      problem: "They want curated venues and exclusive events.",
      monetization: "Membership subscription",
    },
    expectedStatus: "needs_clarification",
  },
  {
    name: "exact ambiguous funding idea needs clarification",
    language: "en",
    input: {
      businessIdea:
        "A platform connects small businesses seeking funding with people providing funds in exchange for a periodic financial return. It includes a funding amount, return, and repayment period.",
      targetCustomer: "Small businesses seeking funding and people providing funds",
      problem: "Small businesses need funding and fund providers want a periodic financial return.",
      monetization: "Platform fee from completed funding agreements",
    },
    expectedStatus: "needs_clarification",
  },
  {
    name: "arabic ambiguous funding idea needs clarification",
    language: "ar",
    input: {
      businessIdea:
        "منصة تربط الشركات الصغيرة التي تبحث عن تمويل مع أشخاص يقدمون التمويل مقابل عائد مالي دوري. تشمل مبلغ التمويل والعائد ومدة السداد.",
      targetCustomer: "الشركات الصغيرة التي تحتاج إلى تمويل والأشخاص الذين يقدمون التمويل",
      problem: "الشركات الصغيرة تحتاج إلى تمويل، ومقدمو التمويل يريدون عائداً مالياً دورياً.",
      monetization: "رسوم منصة من اتفاقيات التمويل المكتملة",
    },
    expectedStatus: "needs_clarification",
  },
  {
    name: "explicit fixed interest lending is ineligible",
    language: "en",
    input: {
      businessIdea: "A lending platform that offers small businesses fixed-interest loans with monthly repayment periods.",
      targetCustomer: "Small businesses that need fast credit",
      problem: "They need quick access to cash.",
      monetization: "Interest rate and origination fee on each loan",
    },
    expectedStatus: "ineligible",
  },
  {
    name: "lawful profit and loss partnership is eligible",
    language: "en",
    input: {
      businessIdea:
        "A platform for equity partnerships where investors and founders share profit and loss through clearly documented partnership agreements.",
      targetCustomer: "Small businesses and equity investors",
      problem: "They need a structured way to form lawful profit-and-loss participation agreements.",
      monetization: "Setup fee for partnership documentation support",
    },
    expectedStatus: "evaluated",
  },
  {
    name: "donation crowdfunding no return is eligible",
    language: "en",
    input: {
      businessIdea: "A donation crowdfunding platform for neighborhood projects with no financial return and no repayment.",
      targetCustomer: "Community project organizers and donors",
      problem: "Local projects need a trusted way to collect donations.",
      monetization: "Optional platform tip from donors",
    },
    expectedStatus: "evaluated",
  },
  {
    name: "educational interest awareness is eligible",
    language: "en",
    input: {
      businessIdea: "A financial education and interest awareness app that teaches founders how to identify and avoid interest-based finance.",
      targetCustomer: "Early founders learning finance basics",
      problem: "They do not understand the risks of interest-based lending and need critical educational guidance.",
      monetization: "Subscription for education modules",
    },
    expectedStatus: "evaluated",
  },
  {
    name: "harmless fraud prevention context",
    language: "en",
    input: {
      businessIdea: "A fraud detection and prevention platform for community banks",
      targetCustomer: "Regional bank risk teams",
      problem: "They need to detect phishing and scam attempts before customers lose money.",
      monetization: "Annual compliance software license",
    },
    expectedStatus: "evaluated",
  },
  {
    name: "arabic prohibited message",
    language: "ar",
    input: {
      businessIdea: "منصة مراهنات رياضية وكازينو عبر الإنترنت",
      targetCustomer: "مستخدمون شباب",
      problem: "يريدون الوصول السريع إلى ألعاب المراهنة",
      monetization: "عمولة على كل رهان",
    },
    expectedStatus: "ineligible",
  },
];

const eligibilityResults = eligibilityCases.map((testCase) => {
  const result = executeValidation(testCase.input, testCase.language);
  const presentation = result.presentation || {};
  const presentationText = [presentation.heading, presentation.body, presentation.policy, presentation.closing].filter(Boolean).join(" ");
  return {
    name: testCase.name,
    ok: result.ok,
    expectedStatus: testCase.expectedStatus,
    actualStatus: result.evaluationStatus || "evaluated",
    hasScore: Boolean(result.score),
    hasReport: Boolean(result.report),
    message: result.message || "",
    policyText: result.policyText || "",
    presentation,
    presentationText,
  };
});

const arabicIneligible = eligibilityResults.find((result) => result.name === "arabic prohibited message");
const englishIneligible = eligibilityResults.find((result) => result.name === "clearly prohibited harmful business");
const clarificationResult = eligibilityResults.find((result) => result.name === "ambiguous business needs clarification");
const ambiguousFunding = eligibilityResults.find((result) => result.name === "exact ambiguous funding idea needs clarification");
const arabicAmbiguousFunding = eligibilityResults.find((result) => result.name === "arabic ambiguous funding idea needs clarification");
const fixedInterestLending = eligibilityResults.find((result) => result.name === "explicit fixed interest lending is ineligible");
const lawfulPartnership = eligibilityResults.find((result) => result.name === "lawful profit and loss partnership is eligible");
const donationCrowdfunding = eligibilityResults.find((result) => result.name === "donation crowdfunding no return is eligible");
const educationInterestAwareness = eligibilityResults.find((result) => result.name === "educational interest awareness is eligible");
const refusalCount = (arabicIneligible?.presentationText.match(/لا يمكن لـ AI Source Hub تقييم هذه الفكرة/g) || []).length;
const clarificationUiRegressionPassed =
  ambiguousFunding?.actualStatus === "needs_clarification" &&
  arabicAmbiguousFunding?.actualStatus === "needs_clarification" &&
  !ambiguousFunding?.hasScore &&
  !ambiguousFunding?.hasReport &&
  !arabicAmbiguousFunding?.hasScore &&
  !arabicAmbiguousFunding?.hasReport &&
  arabicAmbiguousFunding?.presentation.heading === "نحتاج إلى توضيح قبل التقييم" &&
  arabicAmbiguousFunding?.presentation.body ===
    "لم تتضح صيغة التمويل وطبيعة العائد في هذه الفكرة. يرجى توضيح ما إذا كان التمويل قائمًا على مشاركة مشروعة في الربح والخسارة، أو صيغة تمويل متوافقة مع سياسة المنصة، وليس قرضًا بعائد أو فائدة محددة." &&
  arabicAmbiguousFunding?.presentation.closing === "بعد توضيح طبيعة العقد والعائد، يمكن إعادة تقييم الفكرة." &&
  ambiguousFunding?.presentation.heading === "We need clarification before evaluation" &&
  ambiguousFunding?.presentation.body.includes("financing structure and nature of the return are not clear") &&
  !arabicAmbiguousFunding?.presentationText.includes(contentAr.labels.summary) &&
  !arabicAmbiguousFunding?.presentationText.includes(contentAr.labels.guidance) &&
  !arabicAmbiguousFunding?.presentationText.includes(contentAr.states.error) &&
  !arabicAmbiguousFunding?.presentationText.includes(contentAr.labels.verdict) &&
  !arabicAmbiguousFunding?.presentationText.includes(contentAr.labels.overallScore) &&
  !arabicAmbiguousFunding?.presentationText.includes(contentAr.labels.reportTitle) &&
  !arabicAmbiguousFunding?.presentationText.includes(contentAr.labels.copyReport) &&
  !arabicAmbiguousFunding?.presentationText.includes(contentAr.labels.downloadReport) &&
  fixedInterestLending?.actualStatus === "ineligible" &&
  !fixedInterestLending?.hasScore &&
  !fixedInterestLending?.hasReport &&
  lawfulPartnership?.actualStatus === "evaluated" &&
  lawfulPartnership?.hasScore &&
  lawfulPartnership?.hasReport &&
  donationCrowdfunding?.actualStatus === "evaluated" &&
  donationCrowdfunding?.hasScore &&
  donationCrowdfunding?.hasReport &&
  educationInterestAwareness?.actualStatus === "evaluated" &&
  educationInterestAwareness?.hasScore &&
  educationInterestAwareness?.hasReport;
const eligibilityUiRegressionPassed =
  refusalCount === 1 &&
  arabicIneligible?.presentation.heading === "لا يمكن إكمال التقييم" &&
  arabicIneligible?.presentation.body ===
    "لا يمكن لـ AI Source Hub تقييم هذه الفكرة أو تقديم إرشادات لتطويرها؛ لأنها تتعارض بوضوح مع سياسة الأهلية لدينا." &&
  arabicIneligible?.presentation.policy ===
    "تلتزم AI Source Hub بعدم تقديم تقييم أو دعم لأي مشروع يتعارض بوضوح مع أحكام الشريعة الإسلامية، أو يسيء إلى الديانات السماوية، أو ينتهك الكرامة الإنسانية والسلامة والحقوق والأعراف العامة السوية." &&
  arabicIneligible?.presentation.closing === "يمكنك تعديل الفكرة لتكون نشاطاً مشروعاً وأخلاقياً ونافعاً." &&
  englishIneligible?.presentation.heading === "The evaluation cannot be completed" &&
  englishIneligible?.presentation.body.includes("cannot evaluate this idea or provide guidance") &&
  clarificationResult?.presentation.heading === "We need clarification before evaluation" &&
  !arabicIneligible?.presentationText.includes(contentAr.labels.summary) &&
  !arabicIneligible?.presentationText.includes(contentAr.labels.guidance) &&
  !arabicIneligible?.presentationText.includes(contentAr.states.error) &&
  !arabicIneligible?.presentationText.includes(contentAr.labels.overallScore) &&
  !arabicIneligible?.presentationText.includes(contentAr.labels.reportTitle) &&
  !arabicIneligible?.presentationText.includes(contentAr.labels.copyReport) &&
  !arabicIneligible?.presentationText.includes(contentAr.labels.downloadReport) &&
  pageSource.includes("showClarificationCard") &&
  pageSource.includes("showGenericStatusPanel = false") &&
  pageSource.includes("journeyState === BIV_JOURNEY_STATES.NORMAL_EVALUATION") &&
  pageSource.includes("{canCopyReport ? (") &&
  pageSource.includes("{canDownloadReport ? (") &&
  !pageSource.includes("result.evaluationStatus === 'ineligible' ? pageContent.states.error");

const industrialClarificationPresentationPassed =
  pageSource.includes("{pageContent.labels.status}") &&
  !pageSource.includes("result.evaluationStatus === 'ineligible' ? pageContent.labels.status : result.title") &&
  pageSource.includes("clarification-questions__title") &&
  pageSource.includes("<ol>") &&
  styleSource.includes(".clarification-questions") &&
  plasticResult.presentation?.closing === "أجب عن الحقول الناقصة أدناه، ثم تابع التقييم." &&
  englishIndustrialResult.presentation?.closing === "Answer the missing fields below, then continue the evaluation.";

const eligibilityPassed =
  eligibilityResults.every((result) => result.actualStatus === result.expectedStatus) &&
  eligibilityResults
    .filter((result) => result.expectedStatus !== "evaluated")
    .every((result) => !result.hasScore && !result.hasReport && result.message && result.policyText && result.presentation?.heading) &&
  eligibilityResults
    .filter((result) => result.expectedStatus === "evaluated")
    .every((result) => result.hasScore && result.hasReport) &&
  englishIneligible?.message.includes("cannot evaluate") &&
  clarificationResult?.message.includes("please clarify") &&
  arabicIneligible?.policyText.includes("أحكام الشريعة الإسلامية") &&
  eligibilityUiRegressionPassed &&
  clarificationUiRegressionPassed &&
  industrialClarificationPresentationPassed;

console.log(
  JSON.stringify(
    {
      eligibilityPassed,
      eligibilityUiRegressionPassed,
      clarificationUiRegressionPassed,
      industrialClarificationPresentationPassed,
      eligibilityResults,
    },
    null,
    2
  )
);

if (!eligibilityPassed) {
  process.exitCode = 1;
}

const stageInputs = {
  businessIdea: "A meal planning assistant for independent restaurants",
  targetCustomer: "Independent restaurant owners with one to three locations",
  problem: "They sometimes need help planning menus",
  currentSolution: "A simple weekly planning dashboard",
  competitiveAdvantage: "Fast setup using each restaurant's existing menu",
  monetization: "Monthly subscription",
};

const stageResults = ["idea", "mvp", "launched"].map((stage) => {
  const result = executeValidation({ ...stageInputs, stage }, "en");
  return {
    stage,
    ok: result.ok,
    weakest: result.criteria?.reduce((min, c) => (c.score < min.score ? c : min), result.criteria[0])?.key,
    nextAction: result.nextAction,
  };
});

const stageAwarenessPassed =
  stageResults.every((result) => result.ok && result.weakest === "marketNeed") &&
  new Set(stageResults.map((result) => result.nextAction)).size === stageResults.length &&
  /Speak with 10 people/.test(stageResults.find((result) => result.stage === "idea")?.nextAction || "") &&
  /14-day repeat usage/.test(stageResults.find((result) => result.stage === "mvp")?.nextAction || "") &&
  /retention evidence/.test(stageResults.find((result) => result.stage === "launched")?.nextAction || "");

console.log(JSON.stringify({ stageAwarenessPassed, stageResults }, null, 2));

if (!stageAwarenessPassed) {
  process.exitCode = 1;
}

if (failed.length) {
  process.exitCode = 1;
}
