import businessIdeaValidator from "../products/business/idea-validator/config.js";
import startupRiskScanner from "../products/startup-risk-scanner/config.js";
import { PRODUCT_CATEGORIES } from "./constants/categories.js";
import { SUPPORTED_LANGUAGES } from "./constants/languages.js";
import { PRODUCT_STATUS, PRODUCT_STATUS_LABELS } from "./constants/productStatus.js";

const activeProducts = [businessIdeaValidator, startupRiskScanner];

const plannedProducts = [
  {
    id: "business-name-generator",
    slug: "business-name-generator",
    category: PRODUCT_CATEGORIES.BUSINESS,
    status: PRODUCT_STATUS.PLANNED,
    availability: "coming-soon",
    featured: false,
    version: "planned",
    icon: "Sparkles",
    languages: SUPPORTED_LANGUAGES,
    title: {
      en: "Business Name Generator",
      ar: "مولّد أسماء الأعمال",
    },
    shortDescription: {
      en: "Generate practical business name options based on positioning.",
      ar: "أنشئ خيارات أسماء عملية للأعمال بناءً على التموضع.",
    },
    route: "#",
  },
];

export const productRegistry = [...activeProducts, ...plannedProducts].map(normalizeProduct);

export function getAllProducts() {
  return productRegistry;
}

export function getProductsByCategory(category) {
  return productRegistry.filter((product) => product.category === category);
}

export function getFeaturedProducts() {
  return productRegistry.filter((product) => product.featured);
}

export function getProductById(id) {
  return productRegistry.find((product) => product.id === id);
}

export function getLocalizedProductCards(language = "en") {
  return getFeaturedProducts().map((product) => ({
    id: product.id,
    name: product.name[language] || product.name.en || product.id,
    status: getStatusLabel(product.status, language),
    description: product.shortDescription[language] || product.shortDescription.en || "",
    route: product.route,
    points: getProductPoints(product, language),
  }));
}

function normalizeProduct(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.title || product.name || { en: product.id, ar: product.id },
    shortDescription: product.shortDescription || { en: "", ar: "" },
    category: product.category,
    icon: product.icon || "Sparkles",
    languages: product.languages || SUPPORTED_LANGUAGES,
    version: product.version || "1.0.0",
    status: product.status || PRODUCT_STATUS.DRAFT,
    featured: Boolean(product.featured),
    availability: product.availability || product.status || PRODUCT_STATUS.DRAFT,
    route: product.route || "#",
  };
}

function getStatusLabel(status, language) {
  return PRODUCT_STATUS_LABELS[status]?.[language] || PRODUCT_STATUS_LABELS.draft[language];
}

function getProductPoints(product, language) {
  if (product.id === "business-idea-validator") {
    return language === "ar"
      ? ["تقييم من خمسة معايير", "أكبر مخاطرة", "خطوة عملية تالية"]
      : ["Five-part scorecard", "Biggest risk", "One practical next action"];
  }

  return language === "ar"
    ? ["مبني على المنصة المشتركة", "ثنائي اللغة", "تقرير موحّد"]
    : ["Built on the shared platform", "Bilingual", "Standard report"];
}

export default productRegistry;
