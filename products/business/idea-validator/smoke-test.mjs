import { executeValidation } from "./index.js";
import contentAr from "./content.ar.js";
import contentEn from "./content.en.js";
import { inputSchema } from "./schema.js";

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
