import { SUPPORTED_LANGUAGES } from "./constants/languages.js";

export const LANGUAGE_STORAGE_KEY = "ai-source-hub-language";
export const DEFAULT_LANGUAGE = "en";
export const RTL_LANGUAGES = ["ar"];

export const PRODUCT_LOCALIZATION_CONTRACT = {
  metadata: ["title", "shortDescription"],
  content: [
    "language",
    "direction",
    "header.brand",
    "header.tagline",
    "header.navigationLabel",
    "footer.brand",
    "footer.version",
    "breadcrumbLabel",
    "homeLabel",
    "homeHref",
    "eyebrow",
    "title",
    "description",
    "states.idle",
    "states.input",
    "states.invalid",
    "states.success",
    "states.error",
    "states.reset",
  ],
  formField: ["label", "validationMessage"],
  report: ["labels", "report"],
};

export const platformCopy = {
  en: {
    brand: "AI Source Hub",
    tagline: "Decision engines",
    primaryNavigation: "Primary navigation",
    languageLabel: "Language",
    breadcrumbLabel: "Breadcrumb",
    homeLabel: "Home",
    productsLabel: "Products",
    faqLabel: "FAQ",
    businessDecisionEngine: "Business decision engine",
    businessProduct: "Business product",
    openProduct: "Open product",
    comingSoon: "Coming soon",
    featuredProduct: "Featured Product",
    featuredProductBadge: "Available",
    startValidation: "Start Validation",
    footerLinksLabel: "Footer links",
    footerVersion: "Platform foundation v1.0",
    productPoints: ["Built on the shared platform", "Bilingual", "Standard report"],
    businessIdeaPoints: ["Five-part scorecard", "Biggest risk", "One practical next action"],
    legalLinks: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Contact", href: "/contact" },
    ],
    about: {
      eyebrow: "About AI Source Hub",
      title: "What is AI Source Hub?",
      copy:
        "AI Source Hub provides practical AI-powered tools that help individuals, entrepreneurs, and business owners analyze ideas, understand opportunities and risks, and make better decisions.",
      cards: ["Clear Analysis", "Opportunity and Risk Insights", "Practical Recommendations", "Better Decisions"],
    },
    featuredBusinessIdea: {
      title: "Business Idea Validator",
      copy: [
        "Validate your business idea before investing time or money.",
        "Understand strengths, weaknesses, opportunities, risks, and receive practical recommendations.",
      ],
    },
  },
  ar: {
    brand: "AI Source Hub",
    tagline: "محركات قرار",
    primaryNavigation: "التنقل الرئيسي",
    languageLabel: "اللغة",
    breadcrumbLabel: "المسار",
    homeLabel: "الرئيسية",
    productsLabel: "المنتجات",
    faqLabel: "الأسئلة",
    businessDecisionEngine: "محرك قرار للأعمال",
    businessProduct: "منتج أعمال",
    openProduct: "افتح المنتج",
    comingSoon: "قادم قريباً",
    featuredProduct: "منتج مميز",
    featuredProductBadge: "مُتاح",
    startValidation: "ابدأ التحقق",
    footerLinksLabel: "روابط التذييل",
    footerVersion: "منصة AI Source Hub v1.0",
    productPoints: ["مبني على المنصة المشتركة", "ثنائي اللغة", "تقرير موحّد"],
    businessIdeaPoints: ["تقييم من خمسة معايير", "أكبر مخاطرة", "خطوة عملية تالية"],
    legalLinks: [
      { label: "الخصوصية", href: "/privacy" },
      { label: "الشروط", href: "/terms" },
      { label: "إخلاء المسؤولية", href: "/disclaimer" },
      { label: "التواصل", href: "/contact" },
    ],
    about: {
      eyebrow: "عن AI Source Hub",
      title: "ما هو مركز مصادر الذكاء الاصطناعي؟",
      copy:
        "مركز مصادر الذكاء الاصطناعي (AI Source Hub) منصة تقدم أدوات عملية مدعومة بالذكاء الاصطناعي، تساعد الأفراد ورواد الأعمال وأصحاب المشاريع على تحليل الأفكار، وفهم الفرص والمخاطر، واتخاذ قرارات أفضل.",
      cards: ["تحليل واضح", "فهم الفرص والمخاطر", "توصيات عملية", "قرارات أفضل"],
    },
    featuredBusinessIdea: {
      title: "Business Idea Validator",
      copy: [
        "تحقق من فكرة عملك قبل استثمار الوقت أو المال.",
        "افهم النقاط القوية والضعف والفرص والمخاطر، واحصل على توصيات عملية.",
      ],
    },
  },
};

export function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
}

export function getDirection(language) {
  return RTL_LANGUAGES.includes(normalizeLanguage(language)) ? "rtl" : "ltr";
}

export function getInitialLanguage(storage = globalThis.localStorage) {
  if (!storage) return DEFAULT_LANGUAGE;
  return normalizeLanguage(storage.getItem(LANGUAGE_STORAGE_KEY));
}

export function getPlatformCopy(language = DEFAULT_LANGUAGE) {
  return platformCopy[normalizeLanguage(language)] || platformCopy[DEFAULT_LANGUAGE];
}

export function persistLanguage(language, storage = globalThis.localStorage) {
  const normalized = normalizeLanguage(language);
  if (storage) storage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  return normalized;
}

export function applyDocumentLocale(language, documentRef = globalThis.document) {
  if (!documentRef) return;
  const normalized = normalizeLanguage(language);
  const direction = getDirection(normalized);
  documentRef.documentElement.lang = normalized;
  documentRef.documentElement.dir = direction;
  documentRef.body.dir = direction;
}

export function bindLanguageSwitcher({ language, setLanguage, root = globalThis.document }) {
  if (!root || typeof setLanguage !== "function") return () => {};

  const buttons = root.querySelectorAll("[data-language]");
  const handleClick = (event) => {
    const nextLanguage = normalizeLanguage(event.currentTarget.dataset.language);
    if (nextLanguage === language) return;
    persistLanguage(nextLanguage);
    setLanguage(nextLanguage);
  };

  buttons.forEach((button) => button.addEventListener("click", handleClick));
  return () => buttons.forEach((button) => button.removeEventListener("click", handleClick));
}

export function getFooterContent(language = DEFAULT_LANGUAGE, version) {
  const copy = getPlatformCopy(language);
  return {
    brand: copy.brand,
    version: version || copy.footerVersion,
    linksLabel: copy.footerLinksLabel,
    links: copy.legalLinks,
  };
}

export function getHeaderContent(language = DEFAULT_LANGUAGE, nav = []) {
  const copy = getPlatformCopy(language);
  return {
    brand: copy.brand,
    tagline: copy.tagline,
    navigationLabel: copy.primaryNavigation,
    nav,
  };
}

export function getProductLayoutContent({ language = DEFAULT_LANGUAGE, product, footerVersion }) {
  const copy = getPlatformCopy(language);
  return {
    header: getHeaderContent(language, [{ label: copy.homeLabel, href: "/" }]),
    breadcrumbLabel: copy.breadcrumbLabel,
    homeHref: "/",
    homeLabel: copy.homeLabel,
    eyebrow: product?.category === "business" ? copy.businessProduct : "",
    title: product?.name?.[language] || product?.name?.en || "",
    description: product?.shortDescription?.[language] || product?.shortDescription?.en || "",
    footer: getFooterContent(language, footerVersion),
    actions: {
      openProduct: copy.openProduct,
      comingSoon: copy.comingSoon,
    },
  };
}

export function getBusinessValidatorShellContent(language = DEFAULT_LANGUAGE) {
  const copy = getPlatformCopy(language);
  return {
    header: getHeaderContent(language, [
      { label: copy.homeLabel, href: "/" },
      { label: copy.productsLabel, href: "/#products" },
    ]),
    breadcrumbLabel: copy.breadcrumbLabel,
    homeHref: "/",
    homeLabel: copy.homeLabel,
    eyebrow: copy.businessDecisionEngine,
    footer: getFooterContent(
      language,
      language === "ar" ? "منصة مقيّم فكرة العمل" : "Business Idea Validator platform"
    ),
  };
}

export function getProductCardCopy(product, language = DEFAULT_LANGUAGE) {
  const copy = getPlatformCopy(language);
  return {
    points: product.id === "business-idea-validator" ? copy.businessIdeaPoints : copy.productPoints,
    featuredLabel: copy.featuredProduct,
  };
}

export function hasLocalizedValue(value, language) {
  return Boolean(value && typeof value === "object" && typeof value[language] === "string" && value[language].trim());
}

export function getNestedValue(source, keyPath) {
  return keyPath.split(".").reduce((current, key) => current?.[key], source);
}
