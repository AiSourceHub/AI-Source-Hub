import { ReportBuilder } from "../../../core/engines.js";
import { inputSchema } from "./questions.js";
import { getActionSteps } from "./rules.js";

function buildOwnerEvidenceItems(recommendation, language) {
  const reported = recommendation?.interpretedContext?.evidenceSignals?.reportedEvidence;
  if (!reported?.facts?.length) return [];

  const items = reported.facts.map((fact) => {
    if (fact.ambiguous) {
      const labels = {
        completed_customer_interviews: {
          en: "The owner reported conflicting interview counts, so the exact completed count remains unresolved.",
          ar: "أفاد المالك بأعداد متعارضة للمقابلات، لذلك يبقى العدد الدقيق للمقابلات المكتملة غير محسوم.",
        },
        completed_paid_trial: {
          en: "The owner reported conflicting paid-trial counts, so the exact count remains unresolved.",
          ar: "أفاد المالك بأعداد متعارضة للتجارب المدفوعة، لذلك يبقى العدد الدقيق غير محسوم.",
        },
        payment_received: {
          en: "The owner reported conflicting received-payment amounts, so the exact amount remains unresolved.",
          ar: "أفاد المالك بمبالغ متعارضة للمبالغ المستلمة، لذلك يبقى المبلغ الدقيق غير محسوم.",
        },
      };
      return labels[fact.type]?.[language] || "";
    }
    if (fact.type === "completed_customer_interviews") {
      return language === "ar"
        ? `أفاد المالك بإكمال ${fact.count} مقابلات مع عملاء.`
        : `The owner reported completing ${fact.count} customer interviews.`;
    }
    if (fact.type === "completed_paid_trial") {
      if (language === "ar") {
        if (fact.count === 1) {
          return fact.durationMonths === 1
            ? "أفاد المالك بوجود تجربة مدفوعة واحدة لمدة شهر واحد."
            : "أفاد المالك بوجود تجربة مدفوعة واحدة.";
        }
        return `أفاد المالك بوجود ${fact.count} تجارب مدفوعة.`;
      }
      if (fact.count === 1) {
        return fact.durationMonths === 1
          ? "The owner reported one paid one-month trial."
          : "The owner reported one paid trial.";
      }
      return `The owner reported ${fact.count} paid trials.`;
    }
    if (fact.type === "payment_received") {
      return language === "ar"
        ? `أفاد المالك باستلام ${fact.amount} ريال سعودي فعلياً.`
        : `The owner reported actually receiving SAR ${fact.amount}.`;
    }
    return "";
  }).filter(Boolean);

  if (items.length) {
    items.push(language === "ar"
      ? "هذه إفادات من المالك وليست أدلة متحققاً منها بصورة مستقلة، ولا تثبت اشتراكات متكررة أو احتفاظاً أو استخداماً نشطاً."
      : "These are owner-reported claims, not independently verified evidence, and do not establish recurring subscriptions, retention, or active usage.");
  }
  return items;
}

export function buildBusinessIdeaReport({
  productConfig,
  content,
  language,
  score,
  criteria,
  recommendation,
  verdictKey,
}) {
  // Build structured report sections: Executive Summary, Key Findings, Opportunities, Risks, Action Plan
  const executiveSummary = recommendation.executiveSummary || content.verdicts[verdictKey];
  const ownerEvidence = buildOwnerEvidenceItems(recommendation, language);

  const keyFindings = criteria.map((c) => ({ title: content.categories[c.key], detail: c.reason }));

  const opportunities = criteria
    .filter((c) => c.score >= 12)
    .map((c) => ({ title: content.categories[c.key], detail: c.reason }));

  const risks = [];
  const lowest = criteria.reduce((min, c) => (c.score < min.score ? c : min), criteria[0]);
  if (lowest) {
    risks.push({ title: content.categories[lowest.key], detail: lowest.reason });
  }

  // Include contradictions as risks when available
  if (recommendation?.reason) {
    // recommendation.reason is usually the biggest risk string
  }

  const actionPlan = [
    { title: content.labels.nextAction, detail: recommendation.action },
    // add tactical steps
    ...getActionSteps(lowest, verdictKey, language).map((step, i) => ({ title: `${content.report.sections.nextActions} ${i + 1}`, detail: step })),
  ];

  const reportBuilder = new ReportBuilder({
    productName: productConfig.title[language],
    sections: [
      { key: "executive", title: content.report.sections.executiveSummary, content: () => executiveSummary },
      { key: "findings", title: content.report.sections.keyFindings, content: () => keyFindings },
      ...(ownerEvidence.length
        ? [{
            key: "ownerEvidence",
            title: language === "ar" ? "أدلة أفاد بها المالك" : "Owner-reported evidence",
            content: () => ownerEvidence,
          }]
        : []),
      { key: "opportunities", title: content.report.sections.opportunities, content: () => opportunities },
      { key: "risks", title: content.report.sections.risks, content: () => risks },
      { key: "action", title: content.report.sections.actionPlan, content: () => actionPlan },
    ],
  });

  return reportBuilder.build({
    language,
    direction: content.direction,
    status: "success",
    score,
    criteria,
    recommendation,
    summary: content.verdicts[verdictKey],
  });
}

export function buildBusinessIdeaReportText({
  productConfig,
  content,
  language,
  result,
  generatedAt = new Date(),
}) {
  const lines = [];

  lines.push(productConfig.title[language]);
  lines.push(generatedAt.toLocaleString(language === "ar" ? "ar-SA" : "en-US"));
  lines.push("");

  // Executive summary
  lines.push(content.report.sections.executiveSummary + ":");
  lines.push(result.recommendation?.executiveSummary || content.verdicts[result.verdictKey]);
  lines.push("");

  // Key findings
  lines.push(content.report.sections.keyFindings + ":");
  result.criteria.forEach((c) => lines.push(`- ${content.categories[c.key]}: ${c.reason}`));
  lines.push("");

  const ownerEvidence = buildOwnerEvidenceItems(result.recommendation, language);
  if (ownerEvidence.length) {
    lines.push(language === "ar" ? "أدلة أفاد بها المالك:" : "Owner-reported evidence:");
    ownerEvidence.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }

  // Opportunities
  lines.push(content.report.sections.opportunities + ":");
  result.criteria
    .filter((c) => c.score >= 12)
    .forEach((c) => lines.push(`- ${content.categories[c.key]}: ${c.reason}`));
  lines.push("");

  // Risks
  lines.push(content.report.sections.risks + ":");
  if (result.biggestRisk) {
    lines.push(`- ${result.biggestRisk}`);
  }
  if (result.contradictions && result.contradictions.length) {
    result.contradictions.forEach((ct) => lines.push(`- ${ct.message}`));
  }
  lines.push("");

  // Action Plan + Next Actions
  const steps = getActionSteps(
    result.criteria.reduce((min, c) => (c.score < min.score ? c : min), result.criteria[0]),
    result.verdictKey,
    language
  );

  lines.push(content.report.sections.actionPlan + ":");
  lines.push(`- ${result.nextAction}`);
  lines.push("");
  lines.push(content.report.sections.nextActions + ":");
  steps.forEach((step) => lines.push(`- ${step}`));
  lines.push("");

  lines.push(content.report.disclaimer);
  return lines.join("\n");
}
