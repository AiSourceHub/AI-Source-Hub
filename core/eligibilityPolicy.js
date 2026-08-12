export const eligibilityPolicyText = {
  en:
    "AI Source Hub does not evaluate or support any project that clearly conflicts with Islamic principles, disrespects revealed religions, violates human dignity, safety, rights, or sound public morals.",
  ar:
    "تلتزم AI Source Hub بعدم تقديم تقييم أو دعم لأي مشروع يتعارض بوضوح مع أحكام الشريعة الإسلامية، أو يسيء إلى الديانات السماوية، أو ينتهك الكرامة الإنسانية والسلامة والحقوق والأعراف العامة السوية.",
};

const refusalMessages = {
  en:
    "AI Source Hub cannot evaluate this idea or provide guidance to develop it because it clearly conflicts with our eligibility policy.",
  ar:
    "لا يمكن لـ AI Source Hub تقييم هذه الفكرة أو تقديم إرشادات لتطويرها؛ لأنها تتعارض بوضوح مع سياسة الأهلية لدينا.",
};

const clarificationMessages = {
  general: {
    en:
      "Before evaluating this idea, please clarify that the activity is lawful, ethical, respectful of revealed religions, and does not involve exploitation, harm, indecency, fraud, or illegal conduct.",
    ar:
      "قبل تقييم هذه الفكرة، يرجى توضيح أن النشاط مشروع وأخلاقي ويحترم الديانات السماوية ولا يتضمن استغلالاً أو ضرراً أو فاحشة أو احتيالاً أو مخالفة قانونية.",
  },
  financing: {
    en:
      "The financing structure and nature of the return are not clear in this idea. Please clarify whether the funding is based on lawful profit-and-loss participation, an eligible financing structure under the platform policy, and not a loan with a fixed return or interest.",
    ar:
      "لم تتضح صيغة التمويل وطبيعة العائد في هذه الفكرة. يرجى توضيح ما إذا كان التمويل قائمًا على مشاركة مشروعة في الربح والخسارة، أو صيغة تمويل متوافقة مع سياسة المنصة، وليس قرضًا بعائد أو فائدة محددة.",
  },
};

const resultTitles = {
  ineligible: {
    en: "The evaluation cannot be completed",
    ar: "لا يمكن إكمال التقييم",
  },
  needs_clarification: {
    en: "We need clarification before evaluation",
    ar: "نحتاج إلى توضيح قبل التقييم",
  },
};

const closingMessages = {
  ineligible: {
    en: "You may revise the idea into a lawful, ethical, and beneficial activity.",
    ar: "يمكنك تعديل الفكرة لتكون نشاطاً مشروعاً وأخلاقياً ونافعاً.",
  },
  needs_clarification: {
    en: "After clarifying the contract and return structure, the idea can be evaluated again.",
    ar: "بعد توضيح طبيعة العقد والعائد، يمكن إعادة تقييم الفكرة.",
  },
};

const preventionTerms = [
  "prevent",
  "prevention",
  "detect",
  "detection",
  "education",
  "awareness",
  "safety",
  "compliance",
  "anti-fraud",
  "interest awareness",
  "financial education",
  "critical",
  "critically",
  " مكافحة",
  "منع",
  "كشف",
  "رصد",
  "توعية",
  "تعليم",
  "سلامة",
  "امتثال",
  "توعية مالية",
  "التوعية بالفائدة",
  "نقد",
  "تحذير",
];

const financingPatterns = {
  financing: [
    /\b(?:funding|financing|finance|fund|funds|loan|lending|capital|credit|investment|investor|funder|lender)\b/i,
    /(?:تمويل|ممول|ممولين|مستثمر|مستثمرين|قرض|إقراض|رأس مال|استثمار|ائتمان)/u,
  ],
  return: [
    /\b(?:return|financial return|periodic return|fixed return|guaranteed return|profit|yield|repayment|payback)\b/i,
    /(?:عائد|ربح|أرباح|مردود|عوائد|سداد|تسديد|إرجاع|دفعات|دفعة|نسبة ربح)/u,
  ],
  obligation: [
    /\b(?:repayment period|repayment obligation|repay|repayment|monthly payment|installment|instalment|term|maturity|lender|borrower)\b/i,
    /(?:مدة السداد|فترة السداد|التزام بالسداد|يلتزم بالسداد|يسدد|أقساط|قسط|مدة التمويل|المقرض|المقترض|الدائن)/u,
  ],
  role: [
    /\b(?:lender|funder|investor|borrower|people providing funds|capital provider)\b/i,
    /(?:مقرض|ممول|ممولين|مستثمر|مستثمرين|مقترض|جهات التمويل|مقدمي التمويل|أشخاص يقدمون التمويل)/u,
  ],
  explicitInterest: [
    /\b(?:fixed[-\s]?interest|interest[-\s]?bearing|interest rate|usury|riba|loan with interest|fixed return loan|guaranteed interest)\b/i,
    /(?:فائدة محددة|فائدة ثابتة|نسبة فائدة|قرض بفائدة|قرض ربوي|ربا|ربوي|عائد ثابت مضمون)/u,
  ],
  lawfulStructure: [
    /\b(?:equity|partnership|profit[-\s]?and[-\s]?loss|profit sharing|loss sharing|revenue sharing|asset[-\s]?backed|sale contract|murabaha|ijara|lease-to-own|permissible financing|lawful financing)\b/i,
    /(?:ملكية|حصة|شراكة|مشاركة في الربح والخسارة|مشاركة الربح والخسارة|تقاسم الأرباح والخسائر|تقاسم الأرباح|تمويل قائم على أصل|بيع آجل|مرابحة|إجارة|صيغة مشروعة|تمويل مشروع|تمويل متوافق)/u,
  ],
  donation: [
    /\b(?:donation|donate|crowdfunding donation|grant|charity|no financial return|without financial return|no repayment)\b/i,
    /(?:تبرع|تبرعات|منحة|عمل خيري|بدون عائد مالي|دون عائد مالي|لا يوجد عائد|بدون سداد|دون سداد)/u,
  ],
  sale: [
    /\b(?:buy now pay later|installment sale|instalment sale|sale price|asset sale|product financing|invoice payment|trade credit)\b/i,
    /(?:بيع بالتقسيط|تقسيط سلعة|سعر البيع|بيع أصل|تمويل سلعة|تمويل منتج|سداد فاتورة|ائتمان تجاري)/u,
  ],
};

const explicitHarmPatterns = [
  /\b(?:online\s+)?(?:casino|gambling|betting|sportsbook|lottery)\b/i,
  /\b(?:sell|selling|deliver|delivery|marketplace|subscription|promote|monetize)\b[^.]{0,50}\b(?:alcohol|liquor|wine|beer|vape|tobacco|narcotics|illegal drugs)\b/i,
  /\b(?:adult content|pornography|porn|escort service|prostitution|sexual services)\b/i,
  /\b(?:phishing|scam|fake reviews|counterfeit|money laundering|identity theft|stolen cards|tax evasion)\b/i,
  /\b(?:weapon marketplace|illegal weapons|human trafficking|exploit workers|exploit vulnerable)\b/i,
  /\b(?:mock|insult|attack|disrespect)\b[^.]{0,50}\b(?:islam|christianity|judaism|religion|religions|prophets|quran|bible)\b/i,
  /(?:قمار|مراهنات|كازينو|يانصيب)/u,
  /(?:بيع|توصيل|متجر|منصة|اشتراك|ترويج|تسويق)[^.؟]{0,50}(?:خمور|كحول|مشروبات كحولية|مخدرات|تبغ|فيب)/u,
  /(?:محتوى إباحي|إباحية|دعارة|خدمات جنسية)/u,
  /(?:تصيد|احتيال|نصب|مراجعات مزيفة|تزوير|غسيل أموال|بطاقات مسروقة|تهرب ضريبي)/u,
  /(?:سوق أسلحة|أسلحة غير قانونية|اتجار بالبشر|استغلال العمال|استغلال الضعفاء)/u,
  /(?:السخرية|الإساءة|إهانة|ازدراء)[^.؟]{0,50}(?:الإسلام|المسيحية|اليهودية|الدين|الأديان|الأنبياء|القرآن|الإنجيل)/u,
];

const ambiguousPatterns = [
  /\b(?:nightlife|adult entertainment|dating for adults|crypto trading|high leverage|religious debate|controversial content)\b/i,
  /(?:ترفيه ليلي|ترفيه للكبار|تعارف للكبار|تداول عملات رقمية|رافعة مالية|نقاش ديني|محتوى مثير للجدل)/u,
];

export function evaluateIdeaEligibility(input = {}, language = "en") {
  const text = normalizeInput(input);
  const safeContext = hasPreventionContext(text);
  const financingDecision = evaluateFinancingEligibility(text, safeContext);

  if (financingDecision === "ineligible") {
    return buildEligibilityResult("ineligible", language);
  }

  if (financingDecision === "needs_clarification") {
    return buildEligibilityResult("needs_clarification", language, "financing");
  }

  if (!safeContext && explicitHarmPatterns.some((pattern) => pattern.test(text))) {
    return buildEligibilityResult("ineligible", language);
  }

  if (!safeContext && ambiguousPatterns.some((pattern) => pattern.test(text))) {
    return buildEligibilityResult("needs_clarification", language);
  }

  return buildEligibilityResult("eligible", language);
}

function buildEligibilityResult(status, language, clarificationType = "general") {
  const clarificationMessage = clarificationMessages[clarificationType] || clarificationMessages.general;
  const message =
    status === "ineligible"
      ? refusalMessages[language] || refusalMessages.en
      : status === "needs_clarification"
        ? clarificationMessage[language] || clarificationMessage.en
        : "";
  const title = resultTitles[status]?.[language] || "";
  const policyText = eligibilityPolicyText[language] || eligibilityPolicyText.en;

  return {
    status,
    ok: status === "eligible",
    policyText,
    title,
    message,
    presentation:
      status === "eligible"
        ? null
        : {
            heading: title,
            body: message,
            policy: policyText,
            closing: closingMessages[status]?.[language] || "",
          },
  };
}

function normalizeInput(input) {
  return Object.values(input)
    .filter((value) => typeof value === "string")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPreventionContext(text) {
  const lower = text.toLowerCase();
  return preventionTerms.some((term) => lower.includes(term.trim().toLowerCase()));
}

function evaluateFinancingEligibility(text, safeContext) {
  if (safeContext) {
    return "eligible";
  }

  if (!hasPattern(text, financingPatterns.financing)) {
    return "eligible";
  }

  if (hasPattern(text, financingPatterns.donation)) {
    return "eligible";
  }

  if (hasPattern(text, financingPatterns.lawfulStructure) || hasPattern(text, financingPatterns.sale)) {
    return "eligible";
  }

  if (hasPattern(text, financingPatterns.explicitInterest)) {
    return "ineligible";
  }

  const hasReturn = hasPattern(text, financingPatterns.return);
  const hasObligation = hasPattern(text, financingPatterns.obligation);
  const hasFinancingRole = hasPattern(text, financingPatterns.role);

  if (hasReturn && (hasObligation || hasFinancingRole)) {
    return "needs_clarification";
  }

  return "eligible";
}

function hasPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}
