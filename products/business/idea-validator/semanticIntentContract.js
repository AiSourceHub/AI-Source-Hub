import { discoveryContent, discoveryIntentOptions } from "./intentDiscoveryPrototype.js";

export const SEMANTIC_INTENT_SCHEMA_VERSION = "biv_intent_discovery_v1";

export const SUPPORTED_SEMANTIC_LOCALES = ["ar", "en"];

export const SEMANTIC_CONFIDENCE_LEVELS = ["high", "medium", "low"];

export const SEMANTIC_EVIDENCE_STRENGTHS = ["strong", "medium", "weak"];

export const SEMANTIC_OUTPUT_SCHEMA_NAME = "biv_intent_discovery_v1_output";

export const SEMANTIC_REQUEST_FIELDS = [
  "schemaVersion",
  "locale",
  "originalIdea",
  "confirmedAnswers",
  "currentDiscoveryState",
  "allowedTaxonomyOptions",
  "policySafeContext",
];

export const SEMANTIC_REQUIRED_REQUEST_FIELDS = [...SEMANTIC_REQUEST_FIELDS];

export const SEMANTIC_BUSINESS_CLARIFICATION_FIELD_IDS = [
  "selectedIntent",
  "coreOffering",
  "selectedOperatingApproach",
  "selectedOperatingApproaches",
];

export const SEMANTIC_CLARIFICATION_QUESTIONS = {
  selectedIntent: {
    ar: "أي وصف أقرب إلى طريقة عمل مشروعك؟",
    en: "Which description is closest to how your business would work?",
  },
  coreOffering: {
    service: {
      ar: "ما الخدمة الأساسية التي سيحصل عليها العميل؟",
      en: "What main service will the customer receive?",
    },
    retail: {
      ar: "ما فئة المنتجات الأساسية التي سيبيعها المشروع؟",
      en: "What main product category will the business sell?",
    },
    manufacturing: {
      ar: "ما المنتج الأساسي الذي سيصنعه المشروع؟",
      en: "What main product will the business make?",
    },
    digital: {
      ar: "ما المهمة الأساسية التي سيساعد البرنامج المستخدم على إنجازها؟",
      en: "What main task will the software help the user complete?",
    },
    marketplace: {
      ar: "من الطرفان اللذان ستربط بينهما المنصة؟",
      en: "Which two sides will the platform connect?",
    },
    different: {
      ar: "ما النتيجة الأساسية التي تريد أن يقدمها المشروع للعميل؟",
      en: "What main outcome do you want the business to give the customer?",
    },
    not_decided: {
      ar: "ما النتيجة الأساسية التي تريد أن يقدمها المشروع للعميل؟",
      en: "What main outcome do you want the business to give the customer?",
    },
  },
  selectedOperatingApproach: {
    ar: "كيف سيحصل العميل على ما يقدمه المشروع؟",
    en: "How will the customer receive what the business provides?",
  },
  selectedOperatingApproaches: {
    ar: "ما طرق تقديم المشروع التي تقصدها؟",
    en: "Which delivery approaches do you mean?",
  },
};

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

export const SEMANTIC_INTENT_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: SEMANTIC_OUTPUT_FIELDS,
  properties: {
    schemaVersion: { type: "string", enum: [SEMANTIC_INTENT_SCHEMA_VERSION] },
    locale: { type: "string", enum: SUPPORTED_SEMANTIC_LOCALES },
    conciseReflection: { type: "string" },
    intentHypotheses: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "intentId", "label", "rationale", "confidence", "groundingRefs", "requiresConfirmation"],
        properties: {
          id: { type: "string" },
          intentId: { type: "string" },
          label: { type: "string" },
          rationale: { type: "string" },
          confidence: { type: "string", enum: SEMANTIC_CONFIDENCE_LEVELS },
          groundingRefs: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["sourceField", "sourceText"],
              properties: {
                sourceField: { type: "string" },
                sourceText: { type: "string" },
              },
            },
          },
          requiresConfirmation: { type: "boolean" },
        },
      },
    },
    ambiguities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "requiresConfirmation"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          requiresConfirmation: { type: "boolean" },
        },
      },
    },
    recommendedNextQuestion: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "targetField", "question", "answerType", "options", "whyItMatters", "blocksProgress"],
          properties: {
            id: { type: "string" },
            targetField: { type: "string" },
            question: { type: "string" },
            answerType: { type: "string" },
            options: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["id", "label"],
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                },
              },
            },
            whyItMatters: { type: "string" },
            blocksProgress: { type: "boolean" },
          },
        },
      ],
    },
    extractedFacts: {
      type: "array",
      items: semanticEvidenceItemSchema(),
    },
    inferredNeedsConfirmation: {
      type: "array",
      items: semanticEvidenceItemSchema(),
    },
    unresolvedItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
        },
      },
    },
    safetySignals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "severity"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    reasonCodes: {
      type: "array",
      items: { type: "string" },
    },
  },
};

export function createOpenAIResponsesTextFormat() {
  return {
    type: "json_schema",
    name: SEMANTIC_OUTPUT_SCHEMA_NAME,
    strict: true,
    schema: SEMANTIC_INTENT_RESPONSE_JSON_SCHEMA,
  };
}

function semanticEvidenceItemSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["id", "label", "sourceField", "sourceText", "evidenceStrength"],
    properties: {
      id: { type: "string" },
      label: { type: "string" },
      sourceField: { type: "string" },
      sourceText: { type: "string" },
      evidenceStrength: { type: "string", enum: SEMANTIC_EVIDENCE_STRENGTHS },
    },
  };
}

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
    currentDiscoveryState: sanitizeDiscoveryStateForSemanticRequest(currentDiscoveryState),
    allowedTaxonomyOptions,
    policySafeContext,
  };
}

export function buildSemanticClarificationQuestions({
  currentDiscoveryState = {},
  confirmedAnswers = {},
  locale = "en",
} = {}) {
  const language = SUPPORTED_SEMANTIC_LOCALES.includes(locale) ? locale : "en";
  const state = mergeDiscoveryState(
    sanitizeDiscoveryStateForSemanticRequest(currentDiscoveryState),
    sanitizeDiscoveryStateForSemanticRequest(confirmedAnswers)
  );
  const question = getPrincipalSemanticClarificationQuestion(state, language);
  return question ? [question] : [];
}

export function sanitizeDiscoveryStateForSemanticRequest(currentDiscoveryState = {}) {
  return {
    originalIdea: typeof currentDiscoveryState.originalIdea === "string" ? currentDiscoveryState.originalIdea : "",
    selectedIntent: typeof currentDiscoveryState.selectedIntent === "string" ? currentDiscoveryState.selectedIntent : "",
    coreOffering: typeof currentDiscoveryState.coreOffering === "string" ? currentDiscoveryState.coreOffering : "",
    coreOfferingStatus: typeof currentDiscoveryState.coreOfferingStatus === "string" ? currentDiscoveryState.coreOfferingStatus : "",
    selectedOperatingApproach: typeof currentDiscoveryState.selectedOperatingApproach === "string" ? currentDiscoveryState.selectedOperatingApproach : "",
    selectedOperatingApproaches: Array.isArray(currentDiscoveryState.selectedOperatingApproaches)
      ? currentDiscoveryState.selectedOperatingApproaches.filter((item) => typeof item === "string")
      : [],
    unresolvedItems: Array.isArray(currentDiscoveryState.unresolvedItems)
      ? currentDiscoveryState.unresolvedItems.filter((item) => typeof item === "string")
      : [],
    confirmationStatus: typeof currentDiscoveryState.confirmationStatus === "string" ? currentDiscoveryState.confirmationStatus : "",
  };
}

function getPrincipalSemanticClarificationQuestion(state, language) {
  if (!isConfirmedIntent(state.selectedIntent)) {
    return {
      id: "selectedIntent",
      question: SEMANTIC_CLARIFICATION_QUESTIONS.selectedIntent[language],
    };
  }

  if (!isConfirmedCoreOffering(state)) {
    const intent = SEMANTIC_CLARIFICATION_QUESTIONS.coreOffering[state.selectedIntent]
      ? state.selectedIntent
      : "not_decided";
    return {
      id: "coreOffering",
      question: SEMANTIC_CLARIFICATION_QUESTIONS.coreOffering[intent][language],
    };
  }

  if (!isConfirmedOperatingApproach(state.selectedOperatingApproach)) {
    return {
      id: "selectedOperatingApproach",
      question: SEMANTIC_CLARIFICATION_QUESTIONS.selectedOperatingApproach[language],
    };
  }

  if (state.selectedOperatingApproach === "mixed" && !hasConfirmedMixedOperatingApproaches(state.selectedOperatingApproaches)) {
    return {
      id: "selectedOperatingApproaches",
      question: SEMANTIC_CLARIFICATION_QUESTIONS.selectedOperatingApproaches[language],
    };
  }

  return null;
}

function isConfirmedIntent(selectedIntent = "") {
  return discoveryIntentOptions.some((option) => option.id === selectedIntent) || selectedIntent === "different";
}

function isConfirmedCoreOffering(state) {
  return state.coreOfferingStatus === "provided" && Boolean(state.coreOffering.trim());
}

function isConfirmedOperatingApproach(selectedOperatingApproach = "") {
  return Boolean(selectedOperatingApproach) && selectedOperatingApproach !== "not_decided";
}

function hasConfirmedMixedOperatingApproaches(selectedOperatingApproaches = []) {
  return !selectedOperatingApproaches.includes("not_decided") && selectedOperatingApproaches.length >= 2;
}

function mergeDiscoveryState(base, confirmed) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(confirmed)) {
    if (Array.isArray(value)) {
      if (value.length > 0) merged[key] = value;
      continue;
    }
    if (typeof value === "string" && value.trim()) {
      merged[key] = value;
    }
  }
  return merged;
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
