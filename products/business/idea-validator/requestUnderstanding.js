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
      "You are asking for an initial investment assessment for an industrial project. The current information is not enough for a reliable preliminary decision.",
    policy:
      "After clarification, AI Source Hub can prepare a preliminary view of viability, location criteria, equipment categories, operating skills, and marketing route. This is not a certified feasibility study or a guarantee of profitability.",
    closing: "Answer the missing fields below, then continue the evaluation.",
    continueAction: "Continue evaluation",
    detailsTitle: "Missing industrial details",
  },
  ar: {
    heading: "نحتاج إلى تفاصيل المشروع قبل التقييم",
    body:
      "أنت تطلب تقييماً استثمارياً أولياً لمشروع صناعي. المعلومات الحالية غير كافية لإصدار قرار أولي موثوق.",
    policy:
      "بعد التوضيح يمكن لـ AI Source Hub تقديم تقييم أولي للجدوى، ومعايير الموقع، وفئات المعدات، والمهارات التشغيلية، ومسار التسويق. هذا لا يُعد دراسة جدوى معتمدة ولا ضماناً للربحية.",
    closing: "أجب عن الحقول الناقصة أدناه، ثم تابع التقييم.",
    continueAction: "متابعة التقييم",
    detailsTitle: "التفاصيل الصناعية الناقصة",
  },
};

const industrialReadyPresentation = {
  en: {
    heading: "Ready for industrial analysis",
    body:
      "The original request and structured industrial details are now separated and ready for a dedicated industrial preliminary-analysis engine.",
    policy:
      "Phase 1 stops here to avoid falling back to the old generic business-idea report. Phase 2 should produce the industrial viability, location, equipment, operations, and marketing analysis.",
    closing: "No score is shown yet because the industrial analysis engine has not been built.",
  },
  ar: {
    heading: "جاهز للتحليل الصناعي",
    body:
      "تم فصل الطلب الأصلي عن التفاصيل الصناعية المنظمة، وأصبحت البيانات جاهزة لمحرك تحليل صناعي أولي مخصص.",
    policy:
      "تتوقف المرحلة الأولى هنا حتى لا يعود النظام إلى التقرير العام القديم. المرحلة الثانية يجب أن تنتج تحليل الجدوى والموقع والمعدات والتشغيل والتسويق للمشروع الصناعي.",
    closing: "لن تظهر درجة تقييم الآن لأن محرك التحليل الصناعي لم يُبنَ بعد.",
  },
};

export const industrialClarificationSteps = [
  {
    id: "production",
    title: {
      en: "Production",
      ar: "الإنتاج",
    },
    fields: ["plasticWasteType", "intendedOutput", "targetProductionCapacity"],
  },
  {
    id: "investmentLocation",
    title: {
      en: "Investment and location",
      ar: "الاستثمار والموقع",
    },
    fields: ["availableBudgetSar", "preferredCityRegion", "existingPremises"],
  },
  {
    id: "supplyOperations",
    title: {
      en: "Supply and operations",
      ar: "التوريد والتشغيل",
    },
    fields: ["wasteSourceQuantity", "industrialExperienceTeam"],
  },
  {
    id: "market",
    title: {
      en: "Market",
      ar: "السوق",
    },
    fields: ["expectedBuyers", "salesScope"],
  },
];

export const industrialClarificationFields = [
  {
    id: "plasticWasteType",
    type: "select",
    required: true,
    label: { en: "Type of plastic waste", ar: "نوع مخلفات البلاستيك" },
    placeholder: { en: "Select type", ar: "اختر النوع" },
    options: [
      { value: "pet", label: { en: "PET", ar: "PET" } },
      { value: "hdpe", label: { en: "HDPE", ar: "HDPE" } },
      { value: "ldpe", label: { en: "LDPE", ar: "LDPE" } },
      { value: "pp", label: { en: "PP", ar: "PP" } },
      { value: "mixed", label: { en: "Mixed", ar: "مختلطة" } },
      { value: "unknown", label: { en: "Unknown", ar: "غير معروف" } },
    ],
  },
  {
    id: "intendedOutput",
    type: "select",
    required: true,
    label: { en: "Intended output", ar: "المخرج المطلوب" },
    placeholder: { en: "Select output", ar: "اختر المخرج" },
    options: [
      { value: "sorted_baled", label: { en: "Sorted/baled plastic", ar: "بلاستيك مفروز ومكبس" } },
      { value: "washed_flakes", label: { en: "Washed flakes", ar: "رقائق مغسولة" } },
      { value: "pellets", label: { en: "Pellets/granules", ar: "حبيبات/جرانول" } },
      { value: "finished_products", label: { en: "Finished products", ar: "منتجات نهائية" } },
      { value: "unknown", label: { en: "Unknown", ar: "غير معروف" } },
    ],
  },
  {
    id: "targetProductionCapacity",
    type: "text",
    required: true,
    label: { en: "Target production capacity", ar: "الطاقة الإنتاجية المستهدفة" },
    placeholder: { en: "Example: 1 ton per day", ar: "مثال: طن واحد يومياً" },
  },
  {
    id: "availableBudgetSar",
    type: "text",
    required: true,
    label: { en: "Available budget in SAR", ar: "الميزانية المتاحة بالريال" },
    placeholder: { en: "Example: 750,000 SAR", ar: "مثال: 750,000 ريال" },
  },
  {
    id: "preferredCityRegion",
    type: "text",
    required: true,
    label: { en: "Preferred city or region", ar: "المدينة أو المنطقة المفضلة" },
    placeholder: { en: "Example: Riyadh Industrial City", ar: "مثال: المدينة الصناعية في الرياض" },
  },
  {
    id: "existingPremises",
    type: "select",
    required: true,
    label: { en: "Existing land, warehouse, or industrial premises", ar: "وجود أرض أو مستودع أو مقر صناعي" },
    placeholder: { en: "Select status", ar: "اختر الحالة" },
    options: [
      { value: "yes", label: { en: "Yes", ar: "نعم" } },
      { value: "no", label: { en: "No", ar: "لا" } },
      { value: "unknown", label: { en: "Unknown", ar: "غير معروف" } },
    ],
  },
  {
    id: "wasteSourceQuantity",
    type: "textarea",
    required: true,
    label: { en: "Source and expected quantity of plastic waste", ar: "مصدر وكمية مخلفات البلاستيك المتوقعة" },
    placeholder: { en: "Example: contracts with collection companies, about 20 tons monthly", ar: "مثال: عقود مع شركات جمع، نحو 20 طناً شهرياً" },
  },
  {
    id: "industrialExperienceTeam",
    type: "textarea",
    required: true,
    label: { en: "Industrial experience or operating team", ar: "الخبرة الصناعية أو فريق التشغيل" },
    placeholder: { en: "Example: one operations supervisor and two trained technicians", ar: "مثال: مشرف تشغيل وفنيان مدربان" },
  },
  {
    id: "expectedBuyers",
    type: "textarea",
    required: true,
    label: { en: "Expected buyers", ar: "المشترون المتوقعون" },
    placeholder: { en: "Example: packaging factories and plastic product manufacturers", ar: "مثال: مصانع التعبئة ومصانع المنتجات البلاستيكية" },
  },
  {
    id: "salesScope",
    type: "select",
    required: true,
    label: { en: "Sales scope", ar: "نطاق البيع" },
    placeholder: { en: "Select scope", ar: "اختر النطاق" },
    options: [
      { value: "local", label: { en: "Local sales", ar: "محلي" } },
      { value: "export", label: { en: "Export", ar: "تصدير" } },
      { value: "both", label: { en: "Local and export", ar: "محلي وتصدير" } },
      { value: "unknown", label: { en: "Unknown", ar: "غير معروف" } },
    ],
  },
];

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

export function assessBusinessIdeaRequest(rawInput = {}, language = "en", industrialDetails = {}) {
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
  const missingIndustrialFields = getMissingIndustrialFields(text, industrialDetails);
  const needsIndustrialDetails = isIndustrial && isInvestmentAssessment && missingIndustrialFields.length > 0;
  const cannotDetermineProjectType = !isIndustrial && !hasClearCustomerProblem && problemLooksLikeQuestions;

  if (isIndustrial && (isInvestmentAssessment || problemLooksLikeQuestions) && missingIndustrialFields.length === 0) {
    return buildReadyResult({
      requestType: "investment_assessment",
      projectType: "industrial_manufacturing",
      requestedQuestions,
      industrialDetails,
      language,
    });
  }

  if (isIndustrial && (isInvestmentAssessment || problemLooksLikeQuestions) && needsIndustrialDetails) {
    return buildGateResult({
      reason: "industrial_investment_details_required",
      requestType: "investment_assessment",
      projectType: "industrial_manufacturing",
      requestedQuestions,
      missingFields: missingIndustrialFields,
      industrialDetails,
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
      missingFields: isIndustrial ? missingIndustrialFields : [],
      industrialDetails,
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

function buildGateResult({ reason, requestType, projectType, requestedQuestions, missingFields = [], industrialDetails = {}, language, presentation }) {
  const localized = presentation[language] || presentation.en;
  const clarificationFlow =
    projectType === "industrial_manufacturing"
      ? buildIndustrialClarificationFlow({ missingFields, industrialDetails, language })
      : null;

  return {
    status: "needs_clarification",
    ok: false,
    reason,
    requestType,
    projectType,
    requestedQuestions,
    missingFields: missingFields.map((field) => field.id),
    industrialDetails,
    classifications: buildClassificationLabels({
      isIndustrial: projectType === "industrial_manufacturing",
      isInvestmentAssessment: requestType === "investment_assessment",
      language,
    }),
    title: localized.heading,
    message: localized.body,
    presentation: {
      ...localized,
      questions: missingFields.map((field) => field.label[language] || field.label.en),
    },
    clarificationFlow,
  };
}

function buildReadyResult({ requestType, projectType, requestedQuestions, industrialDetails, language }) {
  const localized = industrialReadyPresentation[language] || industrialReadyPresentation.en;

  return {
    status: "ready_for_industrial_analysis",
    ok: true,
    reason: "industrial_details_complete",
    requestType,
    projectType,
    requestedQuestions,
    missingFields: [],
    industrialDetails,
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

function buildIndustrialClarificationFlow({ missingFields = [], industrialDetails = {}, language }) {
  const missingIds = new Set(missingFields.map((field) => field.id));
  const steps = industrialClarificationSteps
    .map((step) => ({
      id: step.id,
      title: step.title[language] || step.title.en,
      fields: step.fields
        .filter((fieldId) => missingIds.has(fieldId))
        .map((fieldId) => localizeIndustrialField(industrialClarificationFields.find((field) => field.id === fieldId), language)),
    }))
    .filter((step) => step.fields.length > 0);

  return {
    type: "industrial",
    details: industrialDetails,
    missingFieldIds: [...missingIds],
    steps,
    labels: {
      previous: language === "ar" ? "السابق" : "Previous",
      next: language === "ar" ? "التالي" : "Next",
      continue: industrialClarification[language]?.continueAction || industrialClarification.en.continueAction,
      missing: language === "ar" ? "حقول ناقصة" : "Missing fields",
      step: language === "ar" ? "خطوة" : "Step",
    },
  };
}

function localizeIndustrialField(field, language) {
  return {
    ...field,
    labelText: field.label[language] || field.label.en,
    placeholderText: field.placeholder?.[language] || field.placeholder?.en || "",
    options: field.options?.map((option) => ({
      value: option.value,
      labelText: option.label[language] || option.label.en,
    })),
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

function getMissingIndustrialFields(text = "", industrialDetails = {}) {
  const inferred = {
    plasticWasteType: /(?:PET|HDPE|LDPE|PP|mixed plastic|بولي إيثيلين|بولي بروبلين|مختلط|مختلطة)/iu.test(text),
    intendedOutput: /(?:flakes|pellets|granules|baled|finished products|رقائق|حبيبات|جرانول|منتجات نهائية|مكبس|مفروز)/iu.test(text),
    availableBudgetSar: /(?:\d[\d,\s]*(?:SAR|ريال)|(?:SAR|ريال)\s*\d|budget\s+of|ميزانية\s+\d|رأس مال\s+\d)/iu.test(text),
    preferredCityRegion: /(?:Riyadh|Jeddah|Dammam|Qassim|Makkah|Madinah|الرياض|جدة|الدمام|القصيم|مكة|المدينة الصناعية)/iu.test(text),
    targetProductionCapacity: /(?:\d[\d,\s]*(?:tons?|kg|kilograms)|\d[\d,\s]*(?:طن|كيلو)|طاقة إنتاجية\s+\d)/iu.test(text),
    wasteSourceQuantity: /(?:(?:source|supplier|collection)\b[^.؟]{0,60}\d|\d[\d,\s]*(?:tons?|kg|طن|كيلو)[^.؟]{0,60}(?:source|supplier|collection|مصدر|توريد|مورد|جمع))/iu.test(text),
    existingPremises: /(?:land|warehouse|industrial premises|أرض|مستودع|مقر صناعي|مصنع جاهز)/iu.test(text),
    industrialExperienceTeam: /(?:experience|team|operator|خبرة|فريق|مشغل|تشغيل)/iu.test(text),
    expectedBuyers: /(?:expected buyers|buyers are|buyers include|المشترون المتوقعون|المشترين المتوقعين|المشترون هم)/iu.test(text),
    salesScope: /(?:export|local sales|local market|تصدير|محلي|السوق الداخلي|بيع محلي)/iu.test(text),
  };

  return industrialClarificationFields.filter((field) => {
    if (!field.required) return false;
    const value = normalizeText(industrialDetails[field.id] || "");
    return !value && !inferred[field.id];
  });
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
