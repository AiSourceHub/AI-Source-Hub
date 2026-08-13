import { executeValidation } from "./index.js";
import contentAr from "./content.ar.js";
import contentEn from "./content.en.js";
import { inputSchema } from "./schema.js";
import { readFileSync } from "node:fs";
import { assessBusinessIdeaRequest } from "./requestUnderstanding.js";

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
  plasticPresentationText.includes("تقييم استثماري") &&
  plasticPresentationText.includes("نوع مخلفات البلاستيك") &&
  plasticPresentationText.includes("الميزانية الاستثمارية") &&
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
  englishIndustrialText.includes("industrial investment-assessment request") &&
  englishIndustrialText.includes("type of plastic waste") &&
  englishIndustrialText.includes("investment budget") &&
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
  completeIndustrialCase.evaluationStatus === "evaluated" &&
  Boolean(completeIndustrialCase.score) &&
  Boolean(completeIndustrialCase.report) &&
  truncatedCase.evaluationStatus === "needs_clarification" &&
  !truncatedCase.score &&
  !truncatedCase.report;

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
const pageSource = readFileSync(new URL("../../../src/pages/BusinessIdeaValidatorPage.jsx", import.meta.url), "utf8");
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
  pageSource.includes("{!isEligibilityResult ? (") &&
  pageSource.includes("{result && reportSignals ? (") &&
  !pageSource.includes("result.evaluationStatus === 'ineligible' ? pageContent.states.error");

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
  clarificationUiRegressionPassed;

console.log(JSON.stringify({ eligibilityPassed, eligibilityUiRegressionPassed, clarificationUiRegressionPassed, eligibilityResults }, null, 2));

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
