import { discoveryContent, discoveryIntentOptions } from "./intentDiscoveryPrototype.js";

export const SEMANTIC_INTENT_SCHEMA_VERSION = "biv_intent_discovery_v1";

export const SUPPORTED_SEMANTIC_LOCALES = ["ar", "en"];

export const SEMANTIC_CONFIDENCE_LEVELS = ["high", "medium", "low"];

export const SEMANTIC_EVIDENCE_STRENGTHS = ["strong", "medium", "weak"];

export const SEMANTIC_REQUEST_FIELDS = [
  "schemaVersion",
  "locale",
  "originalIdea",
  "confirmedAnswers",
  "currentDiscoveryState",
  "allowedTaxonomyOptions",
  "policySafeContext",
];

export const SEMANTIC_OUTPUT_FIELDS = [
  "schemaVersion",
  "locale",
  "conciseReflection",
  "intentHypotheses",
  "ambiguities",
  "recommendedNextQuestion",
  "extractedFacts",
  "inferredNeedsConfirmation",
  "unresolvedItems",
  "safetySignals",
  "reasonCodes",
];

export const FORBIDDEN_SEMANTIC_AUTHORITY_FIELDS = [
  "route",
  "journeyState",
  "selectedRoute",
  "eligibilityDecision",
  "score",
  "totalScore",
  "successProbability",
  "paymentDecision",
  "price",
  "capitalEstimate",
  "costEstimate",
  "rentEstimate",
  "wageEstimate",
  "regulatoryFinding",
  "licenseRequired",
  "finalReport",
  "report",
  "religiousApproval",
  "legalApproval",
  "investmentApproval",
];

export const FORBIDDEN_SEMANTIC_REQUEST_FIELDS = [
  "email",
  "phone",
  "payment",
  "card",
  "billing",
  "marketingConsent",
  "apiKey",
  "token",
  "password",
];

export const INTERNAL_INTENT_LABELS = [
  "service",
  "retail",
  "manufacturing",
  "digital",
  "marketplace",
  "different",
  "not_decided",
  "retail_trading",
  "manufacturing_industrial",
  "digital_software",
  "marketplace_platform",
  "professional_service",
  "primarytype",
  "operatingmodel",
  "fieldsignals",
];

export function createAllowedTaxonomyOptions(locale = "en") {
  const content = discoveryContent[locale] || discoveryContent.en;
  return discoveryIntentOptions.map((option) => ({
    id: option.id,
    primaryType: option.primaryType,
    label: content.intentOptions[option.id],
  }));
}

export function createSemanticIntentRequest({
  locale = "en",
  originalIdea = "",
  confirmedAnswers = {},
  currentDiscoveryState = {},
  allowedTaxonomyOptions = createAllowedTaxonomyOptions(locale),
  policySafeContext = {},
} = {}) {
  return {
    schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
    locale,
    originalIdea,
    confirmedAnswers,
    currentDiscoveryState,
    allowedTaxonomyOptions,
    policySafeContext,
  };
}

export function createSemanticIntentFallback({
  request = {},
  reasonCodes = [],
  errors = [],
} = {}) {
  const locale = SUPPORTED_SEMANTIC_LOCALES.includes(request.locale) ? request.locale : "en";
  const content = discoveryContent[locale] || discoveryContent.en;
  return {
    schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
    locale,
    status: "fallback",
    conciseReflection: locale === "ar"
      ? "لا أريد افتراض معنى الفكرة من دون تأكيدك."
      : "I should not assume the meaning of the idea without your confirmation.",
    intentHypotheses: [],
    ambiguities: [
      {
        id: "intent_confirmation_needed",
        label: locale === "ar"
          ? "نحتاج إلى اختيار أقرب وصف عام للفكرة."
          : "We need to choose the closest general description of the idea.",
        requiresConfirmation: true,
      },
    ],
    recommendedNextQuestion: {
      id: "choose_general_intent",
      targetField: "selectedIntent",
      question: locale === "ar"
        ? "ما الوصف العام الأقرب لفكرتك؟"
        : "Which general description is closest to your idea?",
      answerType: "single_choice",
      options: [
        ...createAllowedTaxonomyOptions(locale).map((option) => ({
          id: option.id,
          label: option.label,
        })),
        { id: "different", label: content.intentOptions.different },
        { id: "not_decided", label: content.intentOptions.not_decided },
      ],
      whyItMatters: locale === "ar"
        ? "يساعد هذا على طرح أسئلة مناسبة من دون تخمين."
        : "This helps ask relevant questions without guessing.",
      blocksProgress: true,
    },
    extractedFacts: [],
    inferredNeedsConfirmation: [],
    unresolvedItems: [
      {
        id: "general_intent_unresolved",
        label: locale === "ar"
          ? "دور المشروع الأساسي لم يُحدد بعد."
          : "The main role of the business is not defined yet.",
        source: "biv_fallback",
      },
    ],
    safetySignals: [],
    reasonCodes: [...new Set(["semantic_fallback", ...reasonCodes])],
    errors,
  };
}

