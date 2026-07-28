import { ReportBuilder } from "../../../core/engines.js";
import { inputSchema } from "./questions.js";
import { getActionSteps } from "./rules.js";

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
  const executiveSummary = `${content.verdicts[verdictKey]} — ${recommendation.action}`;

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
  lines.push(`${content.verdicts[result.verdictKey]} — ${result.nextAction}`);
  lines.push("");

  // Key findings
  lines.push(content.report.sections.keyFindings + ":");
  result.criteria.forEach((c) => lines.push(`- ${content.categories[c.key]}: ${c.reason}`));
  lines.push("");

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
  lines.push(content.report.sections.actionPlan + ":");
  lines.push(`- ${result.nextAction}`);
  getActionSteps(result.criteria.reduce((min, c) => (c.score < min.score ? c : min), result.criteria[0]), result.verdictKey, language).forEach((step) =>
    lines.push(`- ${step}`)
  );
  lines.push("");

  lines.push(content.report.disclaimer);
  return lines.join("\n");
}
