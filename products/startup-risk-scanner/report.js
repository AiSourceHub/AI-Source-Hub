import { ReportBuilder } from "../../core/engines.js";
import productConfig from "./config.js";
import { inputSchema } from "./questions.js";

export function buildStartupRiskReport({ content, language, analysis, riskResult, recommendationResult }) {
  const reportBuilder = new ReportBuilder({
    productName: productConfig.title[language],
    sections: [
      {
        key: "executiveSummary",
        title: content.labels.executiveSummary,
        content: () => buildExecutiveSummary(riskResult, content, language),
      },
      {
        key: "riskDimensions",
        title: content.labels.riskBreakdown,
        content: () => riskResult.dimensions,
      },
      {
        key: "topRisks",
        title: content.labels.topRisks,
        content: () => riskResult.topPriorityRisks,
      },
      {
        key: "recommendations",
        title: content.labels.recommendations,
        content: () => recommendationResult.recommendations,
      },
      {
        key: "validationPlan",
        title: content.labels.validationPlan,
        content: () => recommendationResult.validationPlan,
      },
      {
        key: "disclaimer",
        title: content.labels.disclaimer,
        content: () => content.disclaimer,
      },
    ],
  });

  return reportBuilder.build({
    language,
    direction: content.direction,
    status: riskResult.overallRiskLevel === "critical" ? "partial" : "complete",
    summary: buildExecutiveSummary(riskResult, content, language),
    score: {
      total: riskResult.overallRiskScore,
      level: riskResult.overallRiskLevel,
      dimensions: riskResult.dimensions,
    },
    recommendation: recommendationResult.primary,
    analysis,
  });
}

export function buildExecutiveSummary(riskResult, content, language) {
  const level = content.levels[riskResult.overallRiskLevel];
  const topRisk = riskResult.mostDangerousRisk.label[language];
  const strongest = riskResult.strongestArea.label[language];

  return language === "ar"
    ? `درجة المخاطر الكلية هي ${riskResult.overallRiskScore}/100، بمستوى ${level}. أخطر جانب هو ${topRisk}، بينما أقوى جانب حالي هو ${strongest}.`
    : `The overall risk score is ${riskResult.overallRiskScore}/100, which indicates ${level}. The most dangerous area is ${topRisk}, while the strongest current area is ${strongest}.`;
}

export function buildStartupRiskReportText({
  content,
  language,
  analysis,
  riskResult,
  recommendationResult,
  generatedAt = new Date(),
}) {
  const lines = [
    productConfig.title[language],
    generatedAt.toLocaleString(language === "ar" ? "ar-SA" : "en-US"),
    "",
    content.labels.originalInputs,
    ...inputSchema.map((field) => `${field.label[language]}: ${formatInputValue(field, analysis.input[field.id], language)}`),
    "",
    `${content.labels.overallRiskScore}: ${riskResult.overallRiskScore}/100`,
    `${content.labels.riskLevel}: ${content.levels[riskResult.overallRiskLevel]}`,
    `${content.labels.executiveSummary}: ${buildExecutiveSummary(riskResult, content, language)}`,
    "",
    content.labels.riskBreakdown,
    ...riskResult.dimensions.map(
      (dimension) =>
        `${dimension.label[language]}: ${dimension.score}/100 - ${content.levels[dimension.level]} - ${dimension.reason}`
    ),
    "",
    `${content.labels.strongestArea}: ${riskResult.strongestArea.label[language]} (${riskResult.strongestArea.score}/100)`,
    `${content.labels.mostDangerousRisk}: ${riskResult.mostDangerousRisk.label[language]} (${riskResult.mostDangerousRisk.score}/100)`,
    "",
    content.labels.topRisks,
    ...riskResult.topPriorityRisks.map((risk, index) => `${index + 1}. ${risk.label[language]} (${risk.score}/100)`),
    "",
    `${content.labels.immediateNextAction}: ${recommendationResult.immediateNextAction}`,
    "",
    content.labels.recommendations,
    ...recommendationResult.recommendations.flatMap((item, index) => [
      `${index + 1}. ${item.riskTitle}`,
      `${item.whyItMatters}`,
      `${item.recommendedAction}`,
      `${item.firstValidationStep}`,
      `${item.expectedOutcome}`,
    ]),
    "",
    content.labels.validationPlan,
    ...recommendationResult.validationPlan.map((step, index) => `${index + 1}. ${step}`),
    "",
    `${content.labels.disclaimer}: ${content.disclaimer}`,
  ];

  return lines.join("\n");
}

function formatInputValue(field, value, language) {
  const option = field.options?.find((item) => item.value === value);
  return option ? option.label[language] : value;
}

