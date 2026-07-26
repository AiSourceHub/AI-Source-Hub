import { inputSchema, outputSchema } from "./schema.js";

export const productConfig = {
  id: "business-idea-validator",
  slug: "business-idea-validator",
  category: "business",
  version: "2.0.0-platform-migration",
  status: "active",
  title: {
    en: "Business Idea Validator",
    ar: "مقيّم فكرة العمل",
  },
  shortDescription: {
    en: "Evaluate whether a business idea is weak, promising, good, or strong.",
    ar: "قيّم ما إذا كانت فكرة العمل ضعيفة أو واعدة أو جيدة أو قوية.",
  },
  longDescription: {
    en: "A bilingual decision-support tool that scores one business idea across clarity, customer, need, monetization, and feasibility.",
    ar: "أداة ثنائية اللغة لدعم القرار تقيّم فكرة عمل واحدة عبر الوضوح والعميل والحاجة والإيرادات وقابلية التنفيذ.",
  },
  icon: "Gauge",
  languages: ["en", "ar"],
  inputSchema,
  outputSchema,
  enginePipeline: [
    "ValidationEngine",
    "Analyzer",
    "ProductRules",
    "ScoreEngine",
    "RecommendationEngine",
    "ReportBuilder",
    "LocalizedResultRenderer",
  ],
  scoringEnabled: true,
  reportEnabled: true,
  estimatedCompletionTime: "10 minutes",
  featured: true,
  availability: "active",
  route: "products/business/idea-validator/index.html",
};

export default productConfig;

