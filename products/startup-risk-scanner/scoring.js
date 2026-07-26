import { ScoreEngine } from "../../core/engines.js";

export const dimensionWeights = {
  marketRisk: 0.2,
  customerDemandRisk: 0.2,
  businessModelRisk: 0.15,
  competitiveRisk: 0.15,
  executionRisk: 0.15,
  financialRisk: 0.15,
};

export const dimensionLabels = {
  marketRisk: { en: "Market Risk", ar: "مخاطر السوق" },
  customerDemandRisk: { en: "Customer Demand Risk", ar: "مخاطر طلب العملاء" },
  businessModelRisk: { en: "Business Model Risk", ar: "مخاطر نموذج العمل" },
  competitiveRisk: { en: "Competitive Risk", ar: "مخاطر المنافسة" },
  executionRisk: { en: "Execution Risk", ar: "مخاطر التنفيذ" },
  financialRisk: { en: "Financial Risk", ar: "المخاطر المالية" },
};

const riskValues = {
  startupStage: { idea: 70, prototype: 55, beta: 45, launched: 30, growth: 20 },
  problemClarity: { unclear: 85, general: 55, specific: 25, measured: 10 },
  targetCustomer: { broad: 80, segment: 45, niche: 20, validated: 10 },
  demandEvidence: { none: 90, conversations: 65, waitlist: 45, pilots: 25, paying: 10 },
  marketAccess: { unknown: 75, hard: 60, reachable: 35, existing_channel: 20 },
  competitiveAdvantage: { none: 85, feature: 55, distribution: 30, defensible: 15 },
  businessModel: { unclear: 80, single: 35, tested: 20, repeatable: 10 },
  pricingEvidence: { guess: 75, competitor: 45, tested: 25, paid: 10 },
  teamCapability: { major_gaps: 80, some_gaps: 55, capable: 25, experienced: 15 },
  executionComplexity: { high: 80, medium: 45, low: 20 },
  dependencyRisks: { unresolved: 80, known: 50, controlled: 25, minimal: 10 },
};

export function scoreStartupRisk(analysis, language = "en") {
  const input = analysis.input;
  const criteria = createRiskCriteria(input, analysis.startupRisk);
  const scoreEngine = new ScoreEngine({ criteria });
  const score = scoreEngine.score({ analysis, input });
  const dimensions = score.criteria.map((criterion) => ({
    key: criterion.key,
    label: dimensionLabels[criterion.key],
    score: criterion.score,
    max: 100,
    weight: criterion.weight,
    level: getRiskLevel(criterion.score),
    reason: getDimensionReason(criterion.key, criterion.score, language),
  }));
  const overallRiskScore = Math.round(score.total);
  const overallRiskLevel = getRiskLevel(overallRiskScore);
  const sortedByRisk = [...dimensions].sort((a, b) => b.score - a.score);
  const sortedByStrength = [...dimensions].sort((a, b) => a.score - b.score);

  return {
    overallRiskScore,
    overallRiskLevel,
    dimensions,
    strongestArea: sortedByStrength[0],
    mostDangerousRisk: sortedByRisk[0],
    topPriorityRisks: sortedByRisk.slice(0, 3),
    score,
    contradictions: analysis.startupRisk.contradictions,
    weakEvidence: analysis.startupRisk.weakEvidence,
  };
}

function createRiskCriteria(input, startupRisk) {
  return [
    {
      key: "marketRisk",
      min: 0,
      max: 100,
      weight: dimensionWeights.marketRisk,
      score: () => weightedAverage([
        [valueRisk("marketAccess", input.marketAccess), 0.45],
        [valueRisk("problemClarity", input.problemClarity), 0.2],
        [valueRisk("targetCustomer", input.targetCustomer), 0.15],
        [valueRisk("startupStage", input.startupStage), 0.1],
        [valueRisk("dependencyRisks", input.dependencyRisks), 0.1],
      ]) + contradictionPenalty(startupRisk, ["existing_channel_for_broad_customer"]),
    },
    {
      key: "customerDemandRisk",
      min: 0,
      max: 100,
      weight: dimensionWeights.customerDemandRisk,
      score: () => weightedAverage([
        [valueRisk("demandEvidence", input.demandEvidence), 0.5],
        [valueRisk("problemClarity", input.problemClarity), 0.2],
        [valueRisk("targetCustomer", input.targetCustomer), 0.2],
        [valueRisk("pricingEvidence", input.pricingEvidence), 0.1],
      ]) + contradictionPenalty(startupRisk, ["paying_customers_before_launch_stage"]),
    },
    {
      key: "businessModelRisk",
      min: 0,
      max: 100,
      weight: dimensionWeights.businessModelRisk,
      score: () => weightedAverage([
        [valueRisk("businessModel", input.businessModel), 0.4],
        [valueRisk("pricingEvidence", input.pricingEvidence), 0.35],
        [runwayRisk(input.runwayMonths), 0.15],
        [valueRisk("startupStage", input.startupStage), 0.1],
      ]) + contradictionPenalty(startupRisk, [
        "repeatable_model_without_demand_evidence",
        "paid_pricing_without_demand",
        "paying_customers_but_pricing_is_guess",
      ]),
    },
    {
      key: "competitiveRisk",
      min: 0,
      max: 100,
      weight: dimensionWeights.competitiveRisk,
      score: () => weightedAverage([
        [valueRisk("competitiveAdvantage", input.competitiveAdvantage), 0.55],
        [valueRisk("marketAccess", input.marketAccess), 0.2],
        [valueRisk("executionComplexity", input.executionComplexity), 0.15],
        [valueRisk("demandEvidence", input.demandEvidence), 0.1],
      ]),
    },
    {
      key: "executionRisk",
      min: 0,
      max: 100,
      weight: dimensionWeights.executionRisk,
      score: () => weightedAverage([
        [valueRisk("teamCapability", input.teamCapability), 0.35],
        [valueRisk("executionComplexity", input.executionComplexity), 0.25],
        [valueRisk("dependencyRisks", input.dependencyRisks), 0.25],
        [valueRisk("startupStage", input.startupStage), 0.15],
      ]) + contradictionPenalty(startupRisk, ["short_runway_high_complexity"]),
    },
    {
      key: "financialRisk",
      min: 0,
      max: 100,
      weight: dimensionWeights.financialRisk,
      score: () => weightedAverage([
        [runwayRisk(input.runwayMonths), 0.45],
        [valueRisk("businessModel", input.businessModel), 0.2],
        [valueRisk("pricingEvidence", input.pricingEvidence), 0.2],
        [valueRisk("demandEvidence", input.demandEvidence), 0.15],
      ]),
    },
  ];
}

export function getRiskLevel(score) {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

function valueRisk(field, value) {
  return riskValues[field]?.[value] ?? 70;
}

function runwayRisk(value) {
  if (value === "" || value === undefined) return 70;
  if (value >= 12) return 15;
  if (value >= 6) return 35;
  if (value >= 3) return 60;
  return 85;
}

function weightedAverage(items) {
  const score = items.reduce((total, [value, weight]) => total + value * weight, 0);
  return clamp(score);
}

function contradictionPenalty(startupRisk, relevantCodes) {
  const codes = [...startupRisk.contradictions, ...startupRisk.unsupportedAssumptions];
  return relevantCodes.some((code) => codes.includes(code)) ? 10 : 0;
}

function clamp(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getDimensionReason(key, score, language) {
  const level = getRiskLevel(score);
  const reasons = {
    marketRisk: {
      low: ["The first market segment appears reachable.", "تبدو الشريحة الأولى من السوق قابلة للوصول."],
      moderate: ["Market access is plausible but still needs proof.", "الوصول إلى السوق محتمل لكنه يحتاج إلى دليل إضافي."],
      high: ["The market path is not proven enough yet.", "مسار الوصول إلى السوق غير مثبت بما يكفي بعد."],
      critical: ["Market size or access is too uncertain for confident execution.", "حجم السوق أو الوصول إليه غير مؤكد بدرجة عالية."],
    },
    customerDemandRisk: {
      low: ["Demand has meaningful evidence from customers.", "يوجد دليل قوي نسبياً على طلب العملاء."],
      moderate: ["Demand exists as a hypothesis and needs tighter validation.", "الطلب موجود كفرضية ويحتاج إلى تحقق أدق."],
      high: ["Customer demand is weakly supported.", "طلب العملاء مدعوم بدليل ضعيف."],
      critical: ["There is little direct evidence that customers need or will use this.", "يوجد دليل مباشر قليل على حاجة العملاء أو استخدامهم للحل."],
    },
    businessModelRisk: {
      low: ["Revenue assumptions are clear and tested.", "افتراضات الإيرادات واضحة ومختبرة."],
      moderate: ["The model is understandable but not fully validated.", "النموذج مفهوم لكنه غير مثبت بالكامل."],
      high: ["Revenue and pricing assumptions need validation.", "افتراضات الإيرادات والتسعير تحتاج إلى تحقق."],
      critical: ["The business model is not clear enough to rely on.", "نموذج العمل غير واضح بما يكفي للاعتماد عليه."],
    },
    competitiveRisk: {
      low: ["The startup has a credible advantage for the first segment.", "لدى المشروع ميزة مقنعة للشريحة الأولى."],
      moderate: ["The advantage is useful but may be easy to copy.", "الميزة مفيدة لكنها قد تكون سهلة التقليد."],
      high: ["The advantage is not strong enough yet.", "الميزة ليست قوية بما يكفي بعد."],
      critical: ["The startup lacks a clear reason to win against alternatives.", "يفتقر المشروع إلى سبب واضح للتفوق على البدائل."],
    },
    executionRisk: {
      low: ["The first version looks executable with current capability.", "تبدو النسخة الأولى قابلة للتنفيذ بالقدرات الحالية."],
      moderate: ["Execution is manageable but needs tighter scope.", "التنفيذ قابل للإدارة لكنه يحتاج إلى تضييق النطاق."],
      high: ["Execution complexity or capability gaps could slow progress.", "تعقيد التنفيذ أو فجوات القدرة قد تبطئ التقدم."],
      critical: ["Execution risk is high enough to threaten the first launch.", "مخاطر التنفيذ مرتفعة بما يكفي لتهديد الإطلاق الأول."],
    },
    financialRisk: {
      low: ["Runway and revenue evidence reduce financial pressure.", "المدة المتاحة ودليل الإيرادات يقللان الضغط المالي."],
      moderate: ["Financial pressure is manageable but should be watched closely.", "الضغط المالي قابل للإدارة لكنه يحتاج إلى متابعة دقيقة."],
      high: ["The startup may run out of time before validation is complete.", "قد ينفد الوقت قبل اكتمال التحقق."],
      critical: ["Financial runway is a serious immediate constraint.", "المدة المالية المتاحة قيد خطير وفوري."],
    },
  };
  const [en, ar] = reasons[key][level];
  return language === "ar" ? ar : en;
}

