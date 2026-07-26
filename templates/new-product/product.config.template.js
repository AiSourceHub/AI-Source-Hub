import { inputSchema, outputSchema } from "./schema.js";

export const productConfig = {
  id: "__PRODUCT_ID__",
  slug: "__PRODUCT_SLUG__",
  category: "__PRODUCT_CATEGORY__",
  version: "__PRODUCT_VERSION__",
  status: "__PRODUCT_STATUS__",
  title: {
    en: "__PRODUCT_TITLE_EN__",
    ar: "__PRODUCT_TITLE_AR__",
  },
  shortDescription: {
    en: "__PRODUCT_SHORT_DESCRIPTION_EN__",
    ar: "__PRODUCT_SHORT_DESCRIPTION_AR__",
  },
  longDescription: {
    en: "__PRODUCT_LONG_DESCRIPTION_EN__",
    ar: "__PRODUCT_LONG_DESCRIPTION_AR__",
  },
  icon: "__PRODUCT_ICON__",
  languages: ["en", "ar"],
  inputSchema,
  outputSchema,
  enginePipeline: [
    "validation",
    "analysis",
    "productRules",
    "scoring",
    "recommendation",
    "reporting",
  ],
  scoringEnabled: true,
  reportEnabled: true,
  estimatedCompletionTime: "__ESTIMATED_COMPLETION_TIME__",
  featured: false,
  availability: {
    status: "__PRODUCT_STATUS__",
    label: {
      en: "__AVAILABILITY_LABEL_EN__",
      ar: "__AVAILABILITY_LABEL_AR__",
    },
  },
  route: "__PRODUCT_ROUTE__",
};
