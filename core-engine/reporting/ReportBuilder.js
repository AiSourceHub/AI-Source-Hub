/**
 * ReportBuilder converts engine output into a structured report object.
 *
 * It does not render UI. Product interfaces can use this report shape to build
 * cards, PDFs, emails, dashboards, or API responses later.
 */
export class ReportBuilder {
  constructor(config = {}) {
    this.config = {
      productName: "AI Source Hub Product",
      sections: [],
      ...config,
    };
  }

  build(context = {}) {
    return {
      productName: this.config.productName,
      language: context.language || "en",
      direction: context.direction || "ltr",
      status: context.status || "complete",
      summary: context.summary || "",
      score: context.score || null,
      recommendation: context.recommendation || null,
      sections: this.buildSections(context),
      metadata: {
        generatedAt: new Date().toISOString(),
        engineVersion: context.engineVersion || "core-engine-v1",
      },
    };
  }

  buildSections(context = {}) {
    return this.config.sections.map((section) => ({
      key: section.key,
      title:
        typeof section.title === "function" ? section.title(context) : section.title,
      content:
        typeof section.content === "function" ? section.content(context) : section.content,
      priority: section.priority ?? 100,
    }));
  }
}

export default ReportBuilder;

