export const analyzerRules = {
  requiredSignals: ["clarity", "specificity", "urgency"],
  weakInputSignals: ["too_short", "generic", "missing_customer", "missing_outcome"],
  strongInputSignals: ["specific_user", "clear_problem", "measurable_goal", "practical_constraint"],
};

export const scoreCategories = [
  {
    id: "category_one",
    label: { en: "Category One", ar: "الفئة الأولى" },
    weight: 0.2,
    description: {
      en: "Replace with the first reusable product scoring dimension.",
      ar: "استبدلها بأول بُعد تقييم خاص بالمنتج.",
    },
  },
  {
    id: "category_two",
    label: { en: "Category Two", ar: "الفئة الثانية" },
    weight: 0.2,
    description: {
      en: "Replace with the second reusable product scoring dimension.",
      ar: "استبدلها بثاني بُعد تقييم خاص بالمنتج.",
    },
  },
  {
    id: "category_three",
    label: { en: "Category Three", ar: "الفئة الثالثة" },
    weight: 0.2,
    description: {
      en: "Replace with the third reusable product scoring dimension.",
      ar: "استبدلها بثالث بُعد تقييم خاص بالمنتج.",
    },
  },
  {
    id: "category_four",
    label: { en: "Category Four", ar: "الفئة الرابعة" },
    weight: 0.2,
    description: {
      en: "Replace with the fourth reusable product scoring dimension.",
      ar: "استبدلها برابع بُعد تقييم خاص بالمنتج.",
    },
  },
  {
    id: "category_five",
    label: { en: "Category Five", ar: "الفئة الخامسة" },
    weight: 0.2,
    description: {
      en: "Replace with the fifth reusable product scoring dimension.",
      ar: "استبدلها بخامس بُعد تقييم خاص بالمنتج.",
    },
  },
];

export const verdictRanges = [
  {
    id: "strong",
    min: 75,
    max: 100,
    label: { en: "Strong", ar: "قوي" },
    tone: "positive",
  },
  {
    id: "needs_improvement",
    min: 45,
    max: 74,
    label: { en: "Needs Improvement", ar: "يحتاج إلى تطوير" },
    tone: "warning",
  },
  {
    id: "not_ready",
    min: 0,
    max: 44,
    label: { en: "Not Ready", ar: "غير جاهز" },
    tone: "critical",
  },
];

export function buildRuleContext({ input, analysis, language }) {
  return {
    input,
    analysis,
    language,
    normalizedText: Object.values(input || {}).join(" ").trim().toLowerCase(),
  };
}

export function scoreCategory(category, context) {
  const textLength = context.normalizedText.length;
  const baseScore = textLength >= 160 ? 70 : textLength >= 80 ? 55 : 40;
  const signalBonus = (context.analysis?.signals?.length || 0) * 5;

  return {
    id: category.id,
    label: category.label,
    score: Math.max(0, Math.min(100, baseScore + signalBonus)),
    weight: category.weight,
    reason: {
      en: "Replace this placeholder reason with product-specific scoring evidence.",
      ar: "استبدل هذا السبب المؤقت بدليل تقييم خاص بالمنتج.",
    },
  };
}

export function detectRisks(context, scores) {
  const weakestScore = scores.reduce((weakest, score) => {
    return score.score < weakest.score ? score : weakest;
  }, scores[0]);

  return [
    {
      id: "weakest_category_risk",
      severity: weakestScore?.score < 45 ? "high" : "medium",
      categoryId: weakestScore?.key || weakestScore?.id,
      title: {
        en: "Weakest area needs attention",
        ar: "أضعف جانب يحتاج إلى اهتمام",
      },
      description: {
        en: "Replace this with a product-specific risk generated from the weakest criterion.",
        ar: "استبدل هذا بنص مخاطرة خاص بالمنتج بناء على أضعف معيار.",
      },
    },
  ];
}

export function calculateConfidence({ validation, analysis, scores }) {
  const validInputBonus = validation?.isValid ? 25 : 0;
  const analysisBonus = Math.min(35, (analysis?.signals?.length || 0) * 7);
  const scoreSpreadPenalty = getScoreSpread(scores) > 45 ? 10 : 0;

  return Math.max(0, Math.min(100, 40 + validInputBonus + analysisBonus - scoreSpreadPenalty));
}

export function getVerdict(totalScore) {
  return verdictRanges.find((range) => totalScore >= range.min && totalScore <= range.max) || verdictRanges[2];
}

export function generateRecommendation({ verdict, risks, language }) {
  const topRisk = risks[0];

  return {
    verdict,
    risk: topRisk,
    nextAction: {
      en: "Replace this with one specific next action the user can complete quickly.",
      ar: "استبدل هذا بخطوة عملية واحدة يستطيع المستخدم تنفيذها بسرعة.",
    }[language],
  };
}

export function generateImprovedOutput({ input, recommendation, language }) {
  const firstInput = Object.values(input || {}).find(Boolean) || "";

  return {
    en: `Refine this output around a clearer user, problem, and measurable result: ${firstInput}`,
    ar: `طوّر هذه المخرجات حول مستخدم أوضح، ومشكلة محددة، ونتيجة قابلة للقياس: ${firstInput}`,
  }[language];
}

function getScoreSpread(scores) {
  if (!scores?.length) return 0;
  const values = scores.map((item) => item.score);
  return Math.max(...values) - Math.min(...values);
}
