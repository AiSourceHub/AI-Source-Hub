export function buildReportTemplate(reportBuilder, context) {
  return reportBuilder.build(context);
}

export function buildReportTextTemplate({ title, lines }) {
  return [title, "", ...lines].join("\n");
}

