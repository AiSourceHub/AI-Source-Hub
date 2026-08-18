import { executeValidation } from "./index.js";
import contentAr from "./content.ar.js";
import contentEn from "./content.en.js";
import { inputSchema } from "./schema.js";
import { readFileSync } from "node:fs";
import { buildIndustrialReportText } from "./industrialAnalysis.js";
import { buildFeasibilityFoundation } from "./feasibilityFoundation.js";
import { orchestrateBusinessIdeaValidation } from "./validatorOrchestrator.js";
import {
  assessBusinessIdeaRequest,
  industrialClarificationFields,
  industrialClarificationSteps,
} from "./requestUnderstanding.js";

const pageSource = readFileSync(new URL("../../../src/pages/BusinessIdeaValidatorPage.jsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../../../src/styles.css", import.meta.url), "utf8");

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

const guidedFeasibilityArabicSeed = executeValidation(
  {
    businessIdea: "مغسلة سيارات آلية",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "ar"
);

const guidedFeasibilityQuestion = executeValidation(
  {
    businessIdea: "مغسلة سيارات آلية",
    targetCustomer: "أصحاب السيارات في الأحياء السكنية",
    problem: "كم تكلف الفكرة وما المعدات والتراخيص والعمالة المطلوبة؟",
    monetization: "الدفع لكل عملية غسيل.",
  },
  "ar"
);

const guidedFeasibilityCompleted = executeValidation(
  {
    businessIdea: "مغسلة سيارات آلية",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "ar",
  {},
  {
    userExperienceLevel: "beginner_first_business",
    projectStageIntent: "initial_idea",
    countryCity: "السعودية، الرياض",
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

const guidedFeasibilityEnglishQuestion = executeValidation(
  {
    businessIdea: "An automated car wash",
    targetCustomer: "Drivers near residential neighborhoods",
    problem: "How much will it cost and what equipment, licenses, and staff are needed?",
    monetization: "Customers pay per wash.",
  },
  "en"
);

const beginnerInitialIdea = executeValidation(
  {
    businessIdea: "A simple home baking service",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    userExperienceLevel: "beginner_first_business",
    projectStageIntent: "initial_idea",
  }
);

const experiencedInitialIdea = executeValidation(
  {
    businessIdea: "A SaaS app for independent clinic scheduling",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    userExperienceLevel: "experienced_new_idea",
    projectStageIntent: "initial_idea",
  }
);

const beginnerOperatingBusiness = executeValidation(
  {
    businessIdea: "A neighborhood laundry shop that already operates",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    userExperienceLevel: "beginner_first_business",
    projectStageIntent: "operating",
  }
);

const existingOwnerImproving = executeValidation(
  {
    businessIdea: "A salon owner wants to reduce waiting time and improve repeat bookings",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "en",
  {},
  {
    userExperienceLevel: "existing_business_owner",
    projectStageIntent: "improving",
  }
);

const experiencedOwnerExpanding = executeValidation(
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
    projectStageIntent: "expanding",
  }
);

const switchedProfile = executeValidation(
  {
    businessIdea: "مغسلة سيارات آلية",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
  "ar",
  {},
  {
    userExperienceLevel: "existing_business_owner",
    projectStageIntent: "improving",
    countryCity: "الرياض",
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
  guidedFeasibilityArabicSeed.clarificationFlow?.steps?.[0]?.fields?.some((field) => field.labelText === "في أي مرحلة يوجد المشروع؟") &&
  guidedFeasibilityArabicSeed.clarificationFlow?.steps?.some((step) => step.title === "إعداد الفكرة") &&
  guidedFeasibilityArabicSeed.clarificationFlow?.steps?.some((step) => step.title === "رأس المال والمعدات") &&
  guidedFeasibilityArabicSeed.clarificationFlow?.steps?.some((step) => step.title === "التشغيل") &&
  guidedFeasibilityArabicSeed.clarificationFlow?.steps?.some((step) => step.title === "الأدلة والبحث") &&
  guidedFeasibilityQuestion.evaluationStatus === "feasibility_followup" &&
  !guidedFeasibilityQuestion.score &&
  !guidedFeasibilityQuestion.biggestRisk &&
  !guidedFeasibilityQuestion.report &&
  guidedFeasibilityCompleted.evaluationStatus === "feasibility_ready" &&
  !guidedFeasibilityCompleted.score &&
  guidedFeasibilityCompleted.feasibilityGuidance?.structuredReadiness?.originalInput.problem === "" &&
  guidedFeasibilityEnglishQuestion.evaluationStatus === "feasibility_followup" &&
  guidedFeasibilityEnglishQuestion.presentation.heading === "Let’s understand your idea more clearly" &&
  beginnerInitialIdea.feasibilityGuidance?.userProfile?.adaptationStyle === "beginner" &&
  JSON.stringify(beginnerInitialIdea.clarificationFlow?.steps || []).includes("Simple answer is fine") &&
  experiencedInitialIdea.feasibilityGuidance?.userProfile?.adaptationStyle === "experienced" &&
  JSON.stringify(experiencedInitialIdea.clarificationFlow?.steps || []).includes("unit economics") &&
  beginnerOperatingBusiness.feasibilityGuidance?.userProfile?.isBeginner === true &&
  beginnerOperatingBusiness.feasibilityGuidance?.userProfile?.isExistingBusinessPath === true &&
  JSON.stringify(beginnerOperatingBusiness.clarificationFlow?.steps || []).includes("Current revenue") &&
  existingOwnerImproving.feasibilityGuidance?.userProfile?.adaptationStyle === "existing_business" &&
  JSON.stringify(existingOwnerImproving.clarificationFlow?.steps || []).includes("Current costs and margins") &&
  experiencedOwnerExpanding.feasibilityGuidance?.userProfile?.isExperienced === true &&
  experiencedOwnerExpanding.feasibilityGuidance?.userProfile?.isExistingBusinessPath === true &&
  JSON.stringify(experiencedOwnerExpanding.clarificationFlow?.steps || []).includes("Current bottlenecks") &&
  switchedProfile.feasibilityGuidance?.userProfile?.experienceLevel === "existing_business_owner" &&
  switchedProfile.feasibilityGuidance?.userProfile?.projectStageIntent === "improving" &&
  switchedProfile.feasibilityGuidance?.answers?.countryCity === "الرياض" &&
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
    requiredText: ["provider", "buyer", "payment", "trust"],
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
  const decision = orchestrateBusinessIdeaValidation({
    rawInput: testCase.input,
    language: testCase.language,
    industrialDetails: testCase.industrialDetails || {},
  });
  const execution = executeValidation(
    testCase.input,
    testCase.language,
    testCase.industrialDetails || {}
  );
  const flowText = JSON.stringify(decision.guidedFeasibility?.clarificationFlow || decision.requestAssessment?.clarificationFlow || {});
  const primaryRouteKeys = Object.keys(decision).filter((key) => key === "route" || key === "selectedRoute");
  const liveRoutes = [decision.route].filter(Boolean);
  const futureRoutesAreDormant =
    Array.isArray(decision.futureRoutes) &&
    decision.futureRoutes.every((item) => item.implemented === false) &&
    !decision.futureRoutes.some((item) => liveRoutes.includes(item.route));

  return {
    name: testCase.name,
    route: decision.route,
    hasCanonicalRouteOnly: primaryRouteKeys.length === 1 && primaryRouteKeys[0] === "route",
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

const orchestrationPassed =
  orchestrationResults.every((result) => result.route === result.expected.expectRoute) &&
  orchestrationResults.every((result) => result.hasCanonicalRouteOnly && result.hasExactlyOnePrimaryRoute) &&
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
  pageReadsCanonicalRouteOnly;

console.log(JSON.stringify({ orchestrationPassed, pageUsesSharedExecutionAdapter, pageReadsCanonicalRouteOnly, orchestrationResults }, null, 2));

if (!orchestrationPassed) {
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
    expectRoute: "guided_follow_up",
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
  const decision = orchestrateBusinessIdeaValidation({
    rawInput: testCase.input,
    language: testCase.language,
    feasibilityAnswers: testCase.feasibilityAnswers || {},
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
  feasibilityAnswers: { projectTypeCorrection: "digital_software" },
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
  financePriorityDecision.route === "needs_clarification";

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
  pageSource.includes("{!isEligibilityResult && !industrialReport ? (") &&
  pageSource.includes("{result && reportSignals ? (") &&
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
