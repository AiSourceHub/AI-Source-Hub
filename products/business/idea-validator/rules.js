const categoryKeys = [
  "problemClarity",
  "customerClarity",
  "marketNeed",
  "monetizationClarity",
  "feasibility",
];

const signals = {
  uncertain: [
    "not sure",
    "unsure",
    "unknown",
    "tbd",
    "don't know",
    "غير متأكد",
    "لا أعرف",
    "غير معروف",
  ],
  vague: [
    "platform",
    "solution",
    "tool",
    "app",
    "system",
    "service",
    "better",
    "improve",
    "منصة",
    "حل",
    "أداة",
    "تطبيق",
    "نظام",
    "خدمة",
    "أفضل",
  ],
  broadCustomer: [
    "everyone",
    "anyone",
    "all people",
    "all businesses",
    "people",
    "businesses",
    "الجميع",
    "أي شخص",
    "كل الناس",
    "كل الشركات",
    "الناس",
    "الشركات",
  ],
  need: [
    "waste",
    "cost",
    "expensive",
    "slow",
    "manual",
    "difficult",
    "risk",
    "urgent",
    "delay",
    "lost",
    "money",
    "time",
    "errors",
    "يهدر",
    "هدر",
    "تكلفة",
    "مكلف",
    "بطيء",
    "يدوي",
    "صعب",
    "مخاطرة",
    "عاجل",
    "تأخير",
    "مال",
    "وقت",
    "أخطاء",
  ],
  frequency: [
    "daily",
    "weekly",
    "monthly",
    "often",
    "recurring",
    "every day",
    "every week",
    "يومياً",
    "أسبوعياً",
    "شهرياً",
    "متكرر",
    "كل يوم",
    "كل أسبوع",
  ],
  revenue: [
    "subscription",
    "monthly",
    "annual",
    "license",
    "fee",
    "commission",
    "paid",
    "freemium",
    "consulting",
    "marketplace",
    "اشتراك",
    "شهري",
    "سنوي",
    "ترخيص",
    "رسوم",
    "عمولة",
    "مدفوع",
    "استشارة",
    "سوق",
  ],
  feasibility: [
    "simple",
    "small",
    "local",
    "manual",
    "pilot",
    "mvp",
    "existing",
    "available",
    "بسيط",
    "صغير",
    "محلي",
    "تجريبي",
    "أولي",
    "متاح",
    "موجود",
  ],
  tooBroad: [
    "all-in-one",
    "everything",
    "every problem",
    "any problem",
    "كل شيء",
    "كل مشكلة",
    "جميع المشاكل",
  ],
};

function normalize(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function words(value = "") {
  return normalize(value)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function hasAny(value, list) {
  const text = normalize(value).toLowerCase();
  return list.some((term) => text.includes(term.toLowerCase()));
}

function countMatches(value, list) {
  const text = normalize(value).toLowerCase();
  return list.reduce((total, term) => total + (text.includes(term.toLowerCase()) ? 1 : 0), 0);
}

function clamp(score) {
  return Math.max(0, Math.min(20, Math.round(score)));
}

function isMissing(value) {
  return normalize(value).length === 0;
}

function isUncertain(value) {
  return hasAny(value, signals.uncertain);
}

function isVague(value) {
  const tokenCount = words(value).length;
  return tokenCount <= 3 && hasAny(value, signals.vague);
}

function isBroadCustomer(value) {
  const text = normalize(value).toLowerCase();
  return signals.broadCustomer.some((term) => text === term);
}

function meaningfulWordSet(value) {
  return new Set(words(value).filter((word) => word.length > 2));
}

function overlap(a, b) {
  const first = meaningfulWordSet(a);
  const second = meaningfulWordSet(b);
  let matches = 0;

  first.forEach((word) => {
    if (second.has(word)) matches += 1;
  });

  return matches;
}

function hasSpecificity(value) {
  return (
    words(value).length >= 6 ||
    /\d/.test(value) ||
    /\b(who|with|for|owners|teams|founders|restaurants|clinics|parents|professionals)\b/i.test(value) ||
    /(أصحاب|فرق|مطاعم|عيادات|رواد|موظفين|عملاء|شركات|مستقلين)/.test(value)
  );
}

function languageFallback(language, en, ar) {
  return language === "ar" ? ar : en;
}

function reasonFor(category, score, language) {
  const band = score >= 16 ? "strong" : score >= 11 ? "moderate" : score >= 6 ? "weak" : "critical";
  const reasons = {
    problemClarity: {
      strong: ["The problem is specific and connected to the idea.", "المشكلة محددة ومرتبطة بالفكرة."],
      moderate: ["The problem is understandable but still needs sharper detail.", "المشكلة مفهومة لكنها تحتاج إلى تفاصيل أوضح."],
      weak: ["The problem is vague or not clearly connected to the idea.", "المشكلة عامة أو غير مرتبطة بالفكرة بوضوح."],
      critical: ["The problem is missing or uncertain.", "المشكلة مفقودة أو غير مؤكدة."],
    },
    customerClarity: {
      strong: ["The target customer is specific enough to test.", "العميل المستهدف محدد بما يكفي للاختبار."],
      moderate: ["The target customer is usable but could be narrower.", "العميل المستهدف قابل للاستخدام لكنه يحتاج إلى تضييق."],
      weak: ["The customer group is too broad or unclear.", "شريحة العملاء واسعة أو غير واضحة."],
      critical: ["The target customer is missing or uncertain.", "العميل المستهدف مفقود أو غير مؤكد."],
    },
    marketNeed: {
      strong: ["The problem shows clear cost, urgency, or repeated pain.", "المشكلة توضّح تكلفة أو حاجة متكررة أو إلحاحاً واضحاً."],
      moderate: ["The need is plausible but should be validated with real customers.", "الحاجة محتملة لكنها تحتاج إلى تحقق مع عملاء حقيقيين."],
      weak: ["The need may not be painful enough yet.", "قد لا تكون الحاجة قوية بما يكفي بعد."],
      critical: ["The market need is not clear from the input.", "حاجة السوق غير واضحة من المدخلات."],
    },
    monetizationClarity: {
      strong: ["The revenue method is clear and believable.", "طريقة الإيرادات واضحة وقابلة للتصديق."],
      moderate: ["The revenue method is plausible but needs more detail.", "طريقة الإيرادات محتملة لكنها تحتاج إلى تفاصيل أكثر."],
      weak: ["The revenue path is weak or unclear.", "مسار الإيرادات ضعيف أو غير واضح."],
      critical: ["The monetization method is missing or uncertain.", "طريقة تحقيق الإيرادات مفقودة أو غير مؤكدة."],
    },
    feasibility: {
      strong: ["The idea looks focused enough for a first test.", "تبدو الفكرة مركزة بما يكفي لاختبار أولي."],
      moderate: ["The idea may be testable, but the first use case should be tighter.", "قد تكون الفكرة قابلة للاختبار لكن حالة الاستخدام الأولى تحتاج إلى تضييق."],
      weak: ["The idea may be too broad or hard to execute clearly.", "قد تكون الفكرة واسعة أو صعبة التنفيذ بوضوح."],
      critical: ["The idea is too unclear or contradictory to assess feasibility.", "الفكرة غير واضحة أو متناقضة بدرجة تمنع تقييم قابليتها للتنفيذ."],
    },
  };

  const [en, ar] = reasons[category][band];
  return languageFallback(language, en, ar);
}

function scoreProblem(input) {
  if (isMissing(input.problem) || isUncertain(input.problem)) return 3;
  let score = 6;
  score += Math.min(4, words(input.problem).length / 2);
  score += hasSpecificity(input.problem) ? 4 : 0;
  score += countMatches(input.problem, signals.need) > 0 ? 3 : 0;
  score += overlap(input.businessIdea, input.problem) > 0 ? 2 : 0;
  score -= isVague(input.problem) ? 4 : 0;
  return clamp(score);
}

function scoreCustomer(input) {
  if (isMissing(input.targetCustomer) || isUncertain(input.targetCustomer)) return 3;
  let score = 6;
  score += Math.min(4, words(input.targetCustomer).length / 2);
  score += hasSpecificity(input.targetCustomer) ? 5 : 0;
  score += isBroadCustomer(input.targetCustomer) ? -6 : 0;
  score += overlap(input.targetCustomer, input.problem) > 0 ? 2 : 0;
  return clamp(score);
}

function scoreNeed(input) {
  if (isMissing(input.problem) || isUncertain(input.problem)) return 3;
  let score = 5;
  score += Math.min(8, countMatches(input.problem, signals.need) * 2.3);
  score += Math.min(4, countMatches(input.problem, signals.frequency) * 2);
  score += hasSpecificity(input.problem) ? 2 : 0;
  score += isBroadCustomer(input.targetCustomer) ? -2 : 0;
  return clamp(score);
}

function scoreMonetization(input) {
  if (isMissing(input.monetization) || isUncertain(input.monetization)) return 3;
  let score = 5;
  score += countMatches(input.monetization, signals.revenue) ? 7 : 0;
  score += Math.min(4, words(input.monetization).length / 2);
  score += isVague(input.monetization) ? -3 : 0;
  score += isBroadCustomer(input.targetCustomer) ? -1 : 1;
  return clamp(score);
}

function scoreFeasibility(input, contradictions) {
  let score = 7;
  const combined = `${input.businessIdea} ${input.targetCustomer} ${input.problem}`;
  score += hasSpecificity(input.businessIdea) ? 3 : 0;
  score += hasSpecificity(input.targetCustomer) ? 3 : 0;
  score += countMatches(combined, signals.feasibility) ? 2 : 0;
  score += overlap(input.businessIdea, input.problem) > 0 ? 2 : 0;
  score -= hasAny(combined, signals.tooBroad) ? 5 : 0;
  score -= contradictions.length * 2;
  score -= isVague(input.businessIdea) ? 4 : 0;
  return clamp(score);
}

export function detectContradictions(input, language = "en") {
  const contradictions = [];
  const ideaProblemOverlap = overlap(input.businessIdea, input.problem);
  const customerProblemOverlap = overlap(input.targetCustomer, input.problem);

  if (
    language !== "ar" &&
    words(input.businessIdea).length >= 5 &&
    words(input.problem).length >= 5 &&
    ideaProblemOverlap === 0
  ) {
    contradictions.push({
      code: "idea_problem_mismatch",
      severity: "medium",
      message: languageFallback(
        language,
        "The idea and problem do not clearly connect.",
        "الفكرة والمشكلة غير مرتبطتين بوضوح."
      ),
    });
  }

  if (
    language !== "ar" &&
    words(input.targetCustomer).length >= 4 &&
    words(input.problem).length >= 5 &&
    customerProblemOverlap === 0 &&
    ideaProblemOverlap === 0 &&
    !isBroadCustomer(input.targetCustomer)
  ) {
    contradictions.push({
      code: "customer_problem_mismatch",
      severity: "medium",
      message: languageFallback(
        language,
        "The target customer and problem may not belong together clearly.",
        "قد لا يكون العميل المستهدف مرتبطاً بالمشكلة بوضوح."
      ),
    });
  }

  if (hasAny(`${input.businessIdea} ${input.problem}`, signals.tooBroad)) {
    contradictions.push({
      code: "scope_too_broad",
      severity: "high",
      message: languageFallback(
        language,
        "The idea is too broad for a clear first test.",
        "الفكرة واسعة جداً ولا تصلح لاختبار أولي واضح."
      ),
    });
  }

  return contradictions;
}

export function buildRuleContext(input, language = "en") {
  const normalized = {
    businessIdea: normalize(input.businessIdea),
    targetCustomer: normalize(input.targetCustomer),
    problem: normalize(input.problem),
    monetization: normalize(input.monetization),
  };
  const contradictions = detectContradictions(normalized, language);

  return {
    input: normalized,
    language,
    contradictions,
  };
}

export function createScoringCriteria(ruleContext) {
  const { input, language, contradictions } = ruleContext;

  return [
    {
      key: "problemClarity",
      label: "problemClarity",
      min: 0,
      max: 20,
      score: () => scoreProblem(input),
      reason: (score) => reasonFor("problemClarity", score, language),
    },
    {
      key: "customerClarity",
      label: "customerClarity",
      min: 0,
      max: 20,
      score: () => scoreCustomer(input),
      reason: (score) => reasonFor("customerClarity", score, language),
    },
    {
      key: "marketNeed",
      label: "marketNeed",
      min: 0,
      max: 20,
      score: () => scoreNeed(input),
      reason: (score) => reasonFor("marketNeed", score, language),
    },
    {
      key: "monetizationClarity",
      label: "monetizationClarity",
      min: 0,
      max: 20,
      score: () => scoreMonetization(input),
      reason: (score) => reasonFor("monetizationClarity", score, language),
    },
    {
      key: "feasibility",
      label: "feasibility",
      min: 0,
      max: 20,
      score: () => scoreFeasibility(input, contradictions),
      reason: (score) => reasonFor("feasibility", score, language),
    },
  ];
}

export function attachReasons(scoredCriteria, scoringCriteria) {
  return scoredCriteria.map((criterion) => {
    const source = scoringCriteria.find((item) => item.key === criterion.key);
    return {
      ...criterion,
      reason: source?.reason ? source.reason(criterion.score) : "",
    };
  });
}

export function getVerdictKey(totalScore) {
  if (totalScore >= 80) return "strong";
  if (totalScore >= 60) return "good";
  if (totalScore >= 40) return "unclear";
  return "weak";
}

export function getConfidence(ruleContext, criteria) {
  let confidence = 100;
  const input = ruleContext.input;

  Object.values(input).forEach((value) => {
    if (isMissing(value)) confidence -= 20;
    if (isUncertain(value)) confidence -= 15;
    if (isVague(value)) confidence -= 10;
  });

  if (isBroadCustomer(input.targetCustomer)) confidence -= 15;
  confidence -= ruleContext.contradictions.length * 25;
  if (criteria.some((item) => item.score <= 5)) confidence -= 10;

  const value = Math.max(20, Math.min(100, Math.round(confidence)));
  const level = value >= 80 ? "high" : value >= 55 ? "medium" : "low";

  return { value, level };
}

export function getBiggestRisk(lowestCriterion, language = "en") {
  const risks = {
    problemClarity: [
      "The problem is not clear enough to validate the idea confidently.",
      "المشكلة غير واضحة بما يكفي لتقييم الفكرة بثقة.",
    ],
    customerClarity: [
      "The target customer is not specific enough to test demand.",
      "العميل المستهدف غير محدد بما يكفي لاختبار الطلب.",
    ],
    marketNeed: [
      "The market need may not be painful or frequent enough.",
      "قد لا تكون حاجة السوق مؤلمة أو متكررة بما يكفي.",
    ],
    monetizationClarity: [
      "The monetization path is not clear enough.",
      "مسار تحقيق الإيرادات غير واضح بما يكفي.",
    ],
    feasibility: [
      "The first version may be too broad or difficult to execute.",
      "قد تكون النسخة الأولى واسعة أو صعبة التنفيذ.",
    ],
  };
  const [en, ar] = risks[lowestCriterion.key] || risks.problemClarity;
  return languageFallback(language, en, ar);
}

export function getNextAction(lowestCriterion, verdictKey, language = "en") {
  if (verdictKey === "strong") {
    return languageFallback(
      language,
      "Interview five target customers and test willingness to pay before building.",
      "تحدث مع خمسة عملاء مستهدفين واختبر استعدادهم للدفع قبل البناء."
    );
  }

  const actions = {
    problemClarity: [
      "Rewrite the idea around one specific painful problem.",
      "أعد صياغة الفكرة حول مشكلة واحدة مؤلمة ومحددة.",
    ],
    customerClarity: [
      "Narrow the target customer to one reachable segment.",
      "ضيّق العميل المستهدف إلى شريحة واحدة يمكن الوصول إليها.",
    ],
    marketNeed: [
      "Validate whether the problem is urgent, repeated, or costly.",
      "تحقق مما إذا كانت المشكلة عاجلة أو متكررة أو مكلفة.",
    ],
    monetizationClarity: [
      "Choose one simple revenue model and define who pays.",
      "اختر نموذج إيرادات بسيطاً وحدد من سيدفع.",
    ],
    feasibility: [
      "Reduce the idea to one first use case that can be tested quickly.",
      "اختصر الفكرة إلى حالة استخدام أولى يمكن اختبارها بسرعة.",
    ],
  };
  const [en, ar] = actions[lowestCriterion.key] || actions.problemClarity;
  return languageFallback(language, en, ar);
}

function sameLanguageFragment(value, language, fallback) {
  const text = normalize(value);
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const hasEnglish = /[A-Za-z]/.test(text);

  if (language === "ar") {
    return hasArabic ? text.replace(/[A-Za-z]+/g, "").replace(/\s+/g, " ").trim() || fallback : fallback;
  }

  return hasEnglish ? text.replace(/[\u0600-\u06FF]+/g, "").replace(/\s+/g, " ").trim() || fallback : fallback;
}

export function buildImprovedIdea(input, language = "en") {
  if (language === "ar") {
    const idea = sameLanguageFragment(input.businessIdea, language, "منتج مركز");
    const customer = isBroadCustomer(input.targetCustomer)
      ? "شريحة عملاء محددة"
      : sameLanguageFragment(input.targetCustomer, language, "شريحة عملاء محددة");
    const problem = sameLanguageFragment(input.problem, language, "مشكلة واضحة لدى العميل");
    const monetization = sameLanguageFragment(input.monetization, language, "نموذج إيرادات بسيط");
    return `${idea} موجّه إلى ${customer} لمعالجة ${problem}، مع الاعتماد على ${monetization} كنموذج للإيرادات.`;
  }

  const idea = sameLanguageFragment(input.businessIdea, language, "A focused product");
  const customer = isBroadCustomer(input.targetCustomer)
    ? "a specific customer segment"
    : sameLanguageFragment(input.targetCustomer, language, "a specific customer segment");
  const problem = sameLanguageFragment(input.problem, language, "a clear customer problem");
  const monetization = sameLanguageFragment(input.monetization, language, "a simple revenue model");
  return `${idea}; focus it on ${customer}, solve ${problem}, and earn revenue through ${monetization}.`;
}

export { categoryKeys };

export function getActionSteps(lowestCriterion, verdictKey, language = "en") {
  const steps = {
    problemClarity: [
      [
        "Rewrite the idea to state one clear problem in one sentence.",
        "أعد صياغة الفكرة لتذكر مشكلة واحدة واضحة في جملة واحدة.",
      ],
      [
        "List three example customers who experience this problem.",
        "اكتب ثلاثة أمثلة لعملاء يواجهون هذه المشكلة.",
      ],
      [
        "Ask two customers whether they would pay for a simple solution.",
        "اسأل عميلين عمّا إن كانوا سيدفعون للحصول على حل بسيط.",
      ],
    ],
    customerClarity: [
      [
        "Pick one customer segment and describe where to reach them.",
        "اختر شريحة واحدة للعميل وصف أين يمكن الوصول إليهم.",
      ],
      [
        "Write a one-sentence profile (role, size, pain).",
        "اكتب وصفاً جملة واحدة (الدور، الحجم، المشكلة).",
      ],
      [
        "Prepare a 2-question interview script to validate demand.",
        "حضّر نص مقابلتين سريعتين للتحقق من الطلب.",
      ],
    ],
    marketNeed: [
      [
        "Find evidence: price, frequency, or a measurable cost.",
        "ابحث عن دليل: سعر، تكرار، أو تكلفة قابلة للقياس.",
      ],
      [
        "Run one short customer interview to confirm urgency.",
        "أجرِ مقابلة قصيرة مع عميل واحد لتأكيد الإلحاح.",
      ],
      [
        "Map one common scenario where the problem occurs.",
        "رسم سيناريو واحد شائع لحدوث المشكلة.",
      ],
    ],
    monetizationClarity: [
      [
        "State who pays and how in one sentence.",
        "ذكر من سيدفع وكيف بغملة واحدة.",
      ],
      [
        "Price a simple offering and test willingness to pay.",
        "حدّد سعر عرض بسيط واختبر استعداد الدفع.",
      ],
      [
        "Define a minimum viable pricing model to test quickly.",
        "حدد نموذج تسعير أولي لاختباره سريعاً.",
      ],
    ],
    feasibility: [
      [
        "Identify one smallest test you can run in a week.",
        "حدد أصغر اختبار يمكنك تنفيذه خلال أسبوع.",
      ],
      [
        "List required resources and drop nonessential items.",
        "اكتب الموارد المطلوبة وتخلّص من العناصر غير الضرورية.",
      ],
      [
        "Commit to one measurable outcome for the test.",
        "التزم بنتيجة قابلة للقياس للاختبار.",
      ],
    ],
  };

  const bundle = steps[lowestCriterion.key] || steps.problemClarity;
  return bundle.map((pair) => (language === "ar" ? pair[1] : pair[0]));
}
