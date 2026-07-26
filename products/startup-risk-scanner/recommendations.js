import { RecommendationEngine } from "../../core/engines.js";

const recommendationLibrary = {
  marketRisk: {
    title: { en: "Unproven Market Access", ar: "الوصول إلى السوق غير مثبت" },
    why: {
      en: "A startup can have a useful product and still fail if the first reachable market is not clear.",
      ar: "قد يمتلك المشروع منتجاً مفيداً ويفشل إذا لم تكن الشريحة الأولى القابلة للوصول واضحة.",
    },
    action: {
      en: "Define one reachable first segment and list three channels you can use this week to reach real buyers.",
      ar: "حدد شريحة أولى يمكن الوصول إليها واكتب ثلاث قنوات يمكنك استخدامها هذا الأسبوع للوصول إلى مشترين حقيقيين.",
    },
    validationStep: {
      en: "Contact 20 people in that segment and record response rate, problem relevance, and buying authority.",
      ar: "تواصل مع 20 شخصاً من تلك الشريحة وسجل معدل الاستجابة وارتباط المشكلة وصلاحية الشراء.",
    },
    expectedOutcome: {
      en: "A clearer first market and evidence of whether it can be reached cheaply.",
      ar: "سوق أول أوضح ودليل على إمكانية الوصول إليه بتكلفة مناسبة.",
    },
  },
  customerDemandRisk: {
    title: { en: "Weak Customer Demand Evidence", ar: "دليل طلب العملاء ضعيف" },
    why: {
      en: "Building before confirming demand can waste time on a problem customers do not prioritize.",
      ar: "البناء قبل تأكيد الطلب قد يهدر الوقت على مشكلة لا يعطيها العملاء أولوية.",
    },
    action: {
      en: "Run 10 structured customer interviews using the same five questions about pain, current workaround, urgency, budget, and decision owner.",
      ar: "أجرِ 10 مقابلات منظمة مع العملاء باستخدام الأسئلة الخمسة نفسها عن الألم والحل الحالي والإلحاح والميزانية وصاحب القرار.",
    },
    validationStep: {
      en: "Count how many interviewees report the problem as current, frequent, and costly.",
      ar: "احسب عدد من وصفوا المشكلة بأنها حالية ومتكررة ومكلفة.",
    },
    expectedOutcome: {
      en: "Evidence that demand is real enough to continue, or a clear reason to narrow the customer segment.",
      ar: "دليل على أن الطلب حقيقي بما يكفي للاستمرار، أو سبب واضح لتضييق شريحة العملاء.",
    },
  },
  businessModelRisk: {
    title: { en: "Unvalidated Revenue Model", ar: "نموذج الإيرادات غير مثبت" },
    why: {
      en: "A product that users like may still fail if payment, pricing, or buyer ownership is unclear.",
      ar: "قد يفشل منتج يحبه المستخدمون إذا كان الدفع أو التسعير أو صاحب قرار الشراء غير واضح.",
    },
    action: {
      en: "Choose one pricing model and test it in five sales conversations without discounting the first offer.",
      ar: "اختر نموذج تسعير واحداً واختبره في خمس محادثات بيع دون تخفيض العرض الأول.",
    },
    validationStep: {
      en: "Track how many prospects accept, object, ask for approval, or reject the price.",
      ar: "تتبع عدد العملاء المحتملين الذين قبلوا السعر أو اعترضوا عليه أو طلبوا موافقة أو رفضوه.",
    },
    expectedOutcome: {
      en: "A practical signal about willingness to pay and buyer objections.",
      ar: "إشارة عملية حول الاستعداد للدفع واعتراضات المشتري.",
    },
  },
  competitiveRisk: {
    title: { en: "Weak Reason to Win", ar: "سبب التفوق غير كافٍ" },
    why: {
      en: "Customers compare against existing alternatives, even when those alternatives are manual or imperfect.",
      ar: "يقارن العملاء الحل بالبدائل الحالية حتى عندما تكون يدوية أو غير مثالية.",
    },
    action: {
      en: "Create a one-page alternative map with the top five alternatives, their weakness, and your specific reason to win.",
      ar: "أنشئ خريطة من صفحة واحدة لأهم خمسة بدائل، ونقطة ضعف كل بديل، وسبب تفوقك المحدد.",
    },
    validationStep: {
      en: "Ask five target customers which alternative they use today and what would make them switch.",
      ar: "اسأل خمسة عملاء مستهدفين عن البديل الذي يستخدمونه اليوم وما الذي قد يدفعهم للتغيير.",
    },
    expectedOutcome: {
      en: "A sharper competitive position that can be tested in messaging and sales.",
      ar: "تموضع تنافسي أوضح يمكن اختباره في الرسائل والمبيعات.",
    },
  },
  executionRisk: {
    title: { en: "Execution Scope Is Too Risky", ar: "نطاق التنفيذ عالي المخاطر" },
    why: {
      en: "Complex first versions delay validation and increase the chance of running out of time.",
      ar: "النسخ الأولى المعقدة تؤخر التحقق وتزيد احتمال نفاد الوقت.",
    },
    action: {
      en: "Reduce the first version to one workflow, one customer segment, and one measurable outcome.",
      ar: "اختصر النسخة الأولى إلى مسار عمل واحد وشريحة عميل واحدة ونتيجة واحدة قابلة للقياس.",
    },
    validationStep: {
      en: "Prototype that workflow manually or with no-code tools and test it with three real users in seven days.",
      ar: "اختبر مسار العمل يدوياً أو بأدوات دون برمجة مع ثلاثة مستخدمين حقيقيين خلال سبعة أيام.",
    },
    expectedOutcome: {
      en: "A smaller first release that validates risk before heavy building.",
      ar: "إطلاق أول أصغر يختبر المخاطر قبل البناء المكثف.",
    },
  },
  financialRisk: {
    title: { en: "Runway Pressure", ar: "ضغط المدة المالية المتاحة" },
    why: {
      en: "Short runway forces faster validation choices and makes broad execution dangerous.",
      ar: "المدة القصيرة تفرض قرارات تحقق أسرع وتجعل التنفيذ الواسع خطيراً.",
    },
    action: {
      en: "Create a 30-day validation plan with one revenue or demand signal required before spending more.",
      ar: "أنشئ خطة تحقق لمدة 30 يوماً تتطلب إشارة طلب أو إيراد واحدة قبل إنفاق المزيد.",
    },
    validationStep: {
      en: "Set a stop-or-continue threshold, such as 3 paid pilots, 10 qualified interviews, or 20% positive response from outreach.",
      ar: "حدد عتبة توقف أو استمرار مثل 3 تجارب مدفوعة أو 10 مقابلات مؤهلة أو استجابة إيجابية بنسبة 20% من التواصل.",
    },
    expectedOutcome: {
      en: "A concrete decision point before runway pressure becomes an emergency.",
      ar: "نقطة قرار واضحة قبل أن يتحول ضغط المدة إلى حالة طارئة.",
    },
  },
};

export function buildStartupRiskRecommendations(riskResult, language = "en") {
  const recommendationEngine = new RecommendationEngine({
    rules: [
      {
        key: "highest_risk_action",
        title: "Highest risk action",
        priority: 1,
        when: () => true,
        action: () => buildImmediateNextAction(riskResult.mostDangerousRisk.key, language),
        reason: () => recommendationLibrary[riskResult.mostDangerousRisk.key].why[language],
      },
    ],
  });
  const primary = recommendationEngine.recommend(riskResult);
  const recommendations = riskResult.topPriorityRisks.map((dimension, index) =>
    buildRecommendation(dimension, index, language)
  );
  const validationPlan = recommendations.map((item) => item.validationStep);

  return {
    primary,
    recommendations,
    validationPlan,
    immediateNextAction: primary.action,
  };
}

function buildRecommendation(dimension, index, language) {
  const source = recommendationLibrary[dimension.key];

  return {
    key: dimension.key,
    riskTitle: source.title[language],
    whyItMatters: source.why[language],
    recommendedAction: source.action[language],
    firstValidationStep: source.validationStep[language],
    validationStep: source.validationStep[language],
    priority: index === 0 ? "high" : index === 1 ? "medium" : "low",
    expectedOutcome: source.expectedOutcome[language],
    score: dimension.score,
    level: dimension.level,
  };
}

function buildImmediateNextAction(key, language) {
  const source = recommendationLibrary[key];
  return language === "ar"
    ? `${source.action.ar} ابدأ بخطوة التحقق التالية: ${source.validationStep.ar}`
    : `${source.action.en} Start with this validation step: ${source.validationStep.en}`;
}

