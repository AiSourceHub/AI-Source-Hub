import { PRODUCT_CATEGORIES } from "../../core/constants/categories.js";
import { SUPPORTED_LANGUAGES } from "../../core/constants/languages.js";
import { PRODUCT_STATUS } from "../../core/constants/productStatus.js";
import metadata from "./metadata.js";
import { inputSchema, outputSchema } from "./questions.js";

export const productConfig = {
  id: "startup-risk-scanner",
  slug: "startup-risk-scanner",
  category: PRODUCT_CATEGORIES.BUSINESS,
  categoryLabel: metadata.categoryLabel,
  version: "1.0.0",
  status: PRODUCT_STATUS.ACTIVE,
  title: metadata.title,
  shortDescription: metadata.shortDescription,
  longDescription: metadata.longDescription,
  promise: metadata.promise,
  icon: metadata.icon,
  languages: SUPPORTED_LANGUAGES,
  inputSchema,
  outputSchema,
  enginePipeline: [
    "Analyzer",
    "ValidationEngine",
    "ProductRiskRules",
    "ScoreEngine",
    "RecommendationEngine",
    "ReportBuilder",
  ],
  scoringEnabled: true,
  reportEnabled: true,
  estimatedCompletionTime: metadata.estimatedCompletionTime,
  featured: metadata.featured,
  availability: metadata.availability,
  route: "products/startup-risk-scanner/index.html",
};

export default productConfig;

