const classificationLabels = {
  en: {
    industrialManufacturing: "Industrial / manufacturing project",
    investmentAssessment: "Investment assessment request",
  },
  ar: {
    industrialManufacturing: "مشروع صناعي / تصنيعي",
    investmentAssessment: "طلب تقييم استثماري",
  },
};

const industrialClarification = {
  en: {
    heading: "We need project details before evaluation",
    body:
      "This looks like an industrial investment-assessment request, not a simple startup idea. The current information is not enough for a reliable preliminary decision.",
    policy:
      "After clarification, AI Source Hub can prepare a preliminary view of viability, location criteria, equipment categories, operating skills, and marketing route. This is not a certified feasibility study or a guarantee of profitability.",
    closing: "Add the missing details below, then run the evaluation again.",
    questions: [
      "What type of plastic waste will be processed: PET, HDPE, LDPE, PP, mixed, or unknown?",
      "What is the intended output: sorted/baled plastic, washed flakes, pellets/granules, or finished products?",
      "What investment budget is available in SAR?",
      "Which city or region is preferred?",
      "What is the expected source and quantity of plastic waste?",
      "What target production capacity is expected per day or month?",
      "Does the customer already have land, a warehouse, or industrial premises?",
      "What industrial experience or operating team is available?",
      "Who are the expected buyers of the final output?",
      "Will sales be local, export, or both?",
    ],
  },
  ar: {
    heading: "نحتاج إلى تفاصيل المشروع قبل التقييم",
    body:
      "تبدو هذه الحالة طلب تقييم استثماري لمشروع صناعي، وليست فكرة ناشئة بسيطة. المعلومات الحالية غير كافية لإصدار قرار أولي موثوق.",
    policy:
      "بعد التوضيح يمكن لـ AI Source Hub تقديم تقييم أولي للجدوى، ومعايير الموقع، وفئات المعدات، والمهارات التشغيلية، ومسار التسويق. هذا لا يُعد دراسة جدوى معتمدة ولا ضماناً للربحية.",
    closing: "أضف التفاصيل الناقصة أدناه، ثم أعد تشغيل التقييم.",
    questions: [
      "ما نوع مخلفات البلاستيك: PET، HDPE، LDPE، PP، مختلطة، أم غير معروف؟",
      "ما المخرج المطلوب: بلاستيك مفروز ومكبس، رقائق مغسولة، حبيبات/جرانول، أم منتجات نهائية؟",
      "ما الميزانية الاستثمارية المتاحة بالريال السعودي؟",
      "ما المدينة أو المنطقة المفضلة؟",
      "ما مصدر وكمية مخلفات البلاستيك المتوقعة؟",
      "ما الطاقة الإنتاجية المستهدفة يومياً أو شهرياً؟",
      "هل لدى العميل أرض أو مستودع أو مقر صناعي؟",
      "ما الخبرة الصناعية أو فريق التشغيل المتاح؟",
      "من المشترون المتوقعون للمخرج النهائي؟",
      "هل البيع محلي أم للتصدير أم كلاهما؟",
    ],
  },
};

const genericClarification = {
  en: {
    heading: "We need clarification before evaluation",
    body:
      "The request is not clear enough to choose a reliable evaluation path. Please clarify the project type, the customer problem, and the decision you want the report to support.",
    policy:
      "AI Source Hub pauses unclear requests instead of forcing a generic score or inventing missing facts.",
    closing: "Clarify the request, then run the evaluation again.",
    questions: [
      "Is this a startup idea, an investment assessment, an industrial project, or another type of request?",
      "What one customer or business problem should be evaluated first?",
      "What decision do you want the report to help you make?",
    ],
  },
  ar: {
    heading: "نحتاج إلى توضيح قبل التقييم",
    body:
      "الطلب غير واضح بما يكفي لاختيار مسار تقييم موثوق. يرجى توضيح نوع المشروع، ومشكلة العميل، والقرار الذي تريد أن يساعدك التقرير على اتخاذه.",
    policy:
      "تتوقف AI Source Hub عند الطلبات غير الواضحة بدلاً من إصدار درجة عامة أو افتراض معلومات ناقصة.",
    closing: "وضّح الطلب، ثم أعد تشغيل التقييم.",
    questions: [
      "هل هذا طلب تقييم لفكرة ناشئة، أم تقييم استثماري، أم مشروع صناعي، أم نوع آخر؟",
      "ما مشكلة العميل أو العمل التي يجب تقييمها أولاً؟",
      "ما القرار الذي تريد أن يساعدك التقرير على اتخاذه؟",
    ],
  },
};

const patterns = {
  industrial: [
    /\b(?:factory|plant|manufacturing|industrial|production line|machinery|machine|equipment|warehouse|recycling|plastic recycling)\b/i,
    /(?:مصنع|معمل|صناعي|الصناعات|تصنيع|خط إنتاج|آليات|الآليات|معدات|مكائن|مستودع|إعادة تدوير|إعادة التصنيع|البلاستيك)/u,
  ],
  investmentAssessment: [
    /\b(?:feasibility|viability|worth it|investment|profitable|profitability|budget|location|site|capital|payback|return)\b/i,
    /(?:جدوى|مجد|مجدٍ|يستحق العناء|استثمار|استثماري|مربح|مربحة|ربحية|ميزانية|موقع|الموقع|رأس مال|عائد)/u,
  ],
  requestedQuestions: [
    /(?:^|\s)[0-9]+[\).\-:]\s*\S/u,
    /(?:^|\s)[٠-٩١-٩]+[\).\-:ـ]\s*\S/u,
    /(?:هل|ما|ماذا|كيف|أين|كم|متى|which|what|how|where|when|whether)\b/iu,
    /\?/u,
    /؟/u,
  ],
  customerProblem: [
    /\b(?:customer|client|buyer|user|they struggle|they need|pain|problem|waste|lose|delay|cost)\b/i,
    /(?:العميل|العملاء|المشتري|المستخدم|يعاني|يعانون|مشكلة|صعوبة|يحتاجون|يهدرون|تأخير|تكلفة)/u,
  ],
  truncated: [
    /\.{3}$/u,
    /…$/u,
    /(?:كيفية حساب الع|احتساب النسب|مشرو|التسو)$/u,
  ],
};

export function assessBusinessIdeaRequest(rawInput = {}, language = "en") {
  const text = normalizeInput(rawInput);
  const problem = normalizeText(rawInput.problem || rawInput.problemSolved || "");
  const businessIdea = normalizeText(rawInput.businessIdea || rawInput.businessName || "");
  const industry = normalizeText(rawInput.industry || "");
  const targetCustomer = normalizeText(rawInput.targetCustomer || "");
  const monetization = normalizeText(rawInput.monetization || rawInput.revenueModel || "");
  const requestedQuestions = extractRequestedQuestions(problem);
  const isIndustrial = hasAny(`${businessIdea} ${industry} ${problem}`, patterns.industrial);
  const isInvestmentAssessment = hasAny(`${businessIdea} ${problem} ${monetization}`, patterns.investmentAssessment);
  const problemLooksLikeQuestions = requestedQuestions.length >= 2 || hasNumberedDecisionQuestions(problem);
  const hasClearCustomerProblem = hasAny(problem, patterns.customerProblem);
  const hasTruncatedInput = [businessIdea, targetCustomer, problem, monetization].some((value) => hasAny(value, patterns.truncated));
  const needsIndustrialDetails = isIndustrial && isInvestmentAssessment && hasMissingIndustrialDetails(text);
  const cannotDetermineProjectType = !isIndustrial && !hasClearCustomerProblem && problemLooksLikeQuestions;

  if (isIndustrial && (isInvestmentAssessment || problemLooksLikeQuestions) && needsIndustrialDetails) {
    return buildGateResult({
      reason: "industrial_investment_details_required",
      requestType: "investment_assessment",
      projectType: "industrial_manufacturing",
      requestedQuestions,
      language,
      presentation: industrialClarification,
    });
  }

  if (hasTruncatedInput || cannotDetermineProjectType) {
    return buildGateResult({
      reason: hasTruncatedInput ? "truncated_or_incomplete_input" : "request_type_unclear",
      requestType: isInvestmentAssessment ? "investment_assessment" : "unclear",
      projectType: isIndustrial ? "industrial_manufacturing" : "unclear",
      requestedQuestions,
      language,
      presentation: isIndustrial ? industrialClarification : genericClarification,
    });
  }

  return {
    status: "pass",
    ok: true,
    requestType: isInvestmentAssessment ? "investment_assessment" : "business_idea",
    projectType: isIndustrial ? "industrial_manufacturing" : "general_business",
    requestedQuestions,
    classifications: buildClassificationLabels({ isIndustrial, isInvestmentAssessment, language }),
  };
}

function buildGateResult({ reason, requestType, projectType, requestedQuestions, language, presentation }) {
  const localized = presentation[language] || presentation.en;

  return {
    status: "needs_clarification",
    ok: false,
    reason,
    requestType,
    projectType,
    requestedQuestions,
    classifications: buildClassificationLabels({
      isIndustrial: projectType === "industrial_manufacturing",
      isInvestmentAssessment: requestType === "investment_assessment",
      language,
    }),
    title: localized.heading,
    message: localized.body,
    presentation: localized,
  };
}

function buildClassificationLabels({ isIndustrial, isInvestmentAssessment, language }) {
  const labels = classificationLabels[language] || classificationLabels.en;
  return [
    isIndustrial ? labels.industrialManufacturing : "",
    isInvestmentAssessment ? labels.investmentAssessment : "",
  ].filter(Boolean);
}

function extractRequestedQuestions(problem = "") {
  const normalized = normalizeText(problem);
  if (!normalized) return [];

  const numberedItems = normalized
    .split(/(?:^|\s)(?:[0-9]+|[٠-٩١-٩]+)[\).\-:ـ]\s*/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 4)
    .slice(0, 8);

  if (numberedItems.length >= 2) {
    return numberedItems;
  }

  return normalized
    .split(/[؟?]/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 4 && hasAny(item, patterns.requestedQuestions))
    .slice(0, 8);
}

function hasNumberedDecisionQuestions(problem = "") {
  const numberedItems = normalizeText(problem).split(/(?:^|\s)(?:[0-9]+|[٠-٩١-٩]+)[\).\-:ـ]\s*/u).filter((item) => item.trim().length > 3);
  if (numberedItems.length < 2) return false;
  return numberedItems.some((item) => hasAny(item, patterns.requestedQuestions));
}

function hasMissingIndustrialDetails(text = "") {
  const detailGroups = [
    /(?:PET|HDPE|LDPE|PP|mixed plastic|نوع مخلفات|مخلفات البلاستيك|بولي|مختلط)/iu,
    /(?:flakes|pellets|granules|baled|finished products|رقائق|حبيبات|جرانول|منتجات نهائية|مكبس|مفروز)/iu,
    /(?:SAR|ريال|budget|ميزانية|تكلفة|رأس مال)/iu,
    /(?:city|region|location|مدينة|منطقة|موقع)/iu,
    /(?:tons|kg|kilograms|quantity|capacity|طن|كيلو|كمية|طاقة إنتاجية|الإنتاجية)/iu,
    /(?:land|warehouse|industrial premises|أرض|مستودع|مقر صناعي|مصنع جاهز)/iu,
    /(?:experience|team|operator|خبرة|فريق|مشغل|تشغيل)/iu,
    /(?:buyers|customers|export|local sales|مشترين|البيع|تصدير|محلي)/iu,
  ];

  const presentCount = detailGroups.filter((pattern) => pattern.test(text)).length;
  return presentCount < 5;
}

function normalizeInput(input = {}) {
  return Object.values(input)
    .filter((value) => typeof value === "string")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function hasAny(text = "", patternList = []) {
  return patternList.some((pattern) => pattern.test(text));
}
