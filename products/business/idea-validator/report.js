import { ReportBuilder } from "../../../core/engines.js";
import { inputSchema } from "./questions.js";

export function buildBusinessIdeaReport({
  productConfig,
  content,
  language,
  score,
  criteria,
  recommendation,
  verdictKey,
}) {
  const reportBuilder = new ReportBuilder({
    productName: productConfig.title[language],
    sections: [
      {
        key: "scores",
        title: content.labels.scoreBreakdown,
        content: ({ criteria }) => criteria,
      },
      {
        key: "recommendation",
        title: content.labels.nextAction,
        content: () => recommendation.action,
      },
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
  const lines = [
    productConfig.title[language],
    generatedAt.toLocaleString(language === "ar" ? "ar-SA" : "en-US"),
    "",
    content.labels.originalInputs,
    ...inputSchema.map((field) => `${field.label[language]}: ${result.analysis.input[field.id]}`),
    "",
    `${content.labels.verdict}: ${content.verdicts[result.verdictKey]}`,
    `${content.labels.totalScore}: ${result.score.total}/100`,
    `${content.labels.confidence}: ${content.confidence[result.confidence.level]} (${result.confidence.value}/100)`,
    "",
    content.labels.scoreBreakdown,
    ...result.criteria.map(
      (criterion) => `${content.categories[criterion.key]}: ${criterion.score}/20 - ${criterion.reason}`
    ),
    "",
    `${content.labels.biggestRisk}: ${result.biggestRisk}`,
    `${content.labels.nextAction}: ${result.nextAction}`,
    `${content.labels.improvedIdea}: ${result.improvedIdea}`,
    "",
    content.report.disclaimer,
  ];

  return lines.join("\n");
}
