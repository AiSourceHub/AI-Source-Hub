import { discoveryContent, discoveryFallbackOptions } from "./intentDiscoveryPrototype.js";
import { createAllowedTaxonomyOptions } from "./semanticIntentContract.js";

export const SEMANTIC_PRESENTATION_MODES = {
  VALID: "valid",
  LOW_CONFIDENCE: "low_confidence",
  FALLBACK: "fallback",
};

export function buildSemanticIntentPresentation({
  filteredResult,
  request,
  locale = "en",
} = {}) {
  const language = locale === "ar" ? "ar" : "en";
  const content = discoveryContent[language] || discoveryContent.en;

  if (!filteredResult || filteredResult.status === "fallback") {
    return buildFallbackPresentation({ filteredResult, request, content, locale: language });
  }

  const hypotheses = Array.isArray(filteredResult.intentHypotheses)
    ? filteredResult.intentHypotheses.slice(0, 5)
    : [];
  const allLowConfidence = hypotheses.length > 0 && hypotheses.every((item) => item.confidence === "low");
  const mode = allLowConfidence ? SEMANTIC_PRESENTATION_MODES.LOW_CONFIDENCE : SEMANTIC_PRESENTATION_MODES.VALID;
  const semanticCopy = content.semanticIntent;

  return {
    mode,
    heading: mode === SEMANTIC_PRESENTATION_MODES.LOW_CONFIDENCE
      ? semanticCopy.lowConfidenceHeading
      : semanticCopy.validHeading,
    body: mode === SEMANTIC_PRESENTATION_MODES.LOW_CONFIDENCE
      ? semanticCopy.lowConfidenceBody
      : "",
    reflection: mode === SEMANTIC_PRESENTATION_MODES.LOW_CONFIDENCE
      ? ""
      : filteredResult.conciseReflection,
    question: semanticCopy.choiceQuestion,
    choices: appendBivOwnedChoices(
      hypotheses.map((hypothesis) => ({
        id: hypothesis.intentId,
        label: hypothesis.label,
        rationale: hypothesis.rationale,
        requiresConfirmation: true,
        source: "semantic_filter",
      })),
      content
    ),
    fallbackReasonCodes: [],
    originalIdea: request?.originalIdea || "",
    diagnostics: {
      status: filteredResult.status,
      reasonCodes: filteredResult.reasonCodes || [],
    },
  };
}
export function buildDeterministicIntentPresentation({ choices = [], locale = "en" } = {}) {
  const language = locale === "ar" ? "ar" : "en";
  const content = discoveryContent[language] || discoveryContent.en;
  return {
    mode: "deterministic",
    heading: content.states.intent.heading,
    body: content.states.intent.body,
    reflection: "",
    question: "",
    choices: choices.map((choice) => ({
      ...choice,
      label: content.intentOptions[choice.id],
      rationale: "",
      source: "deterministic",
    })),
    fallbackReasonCodes: [],
    originalIdea: "",
    diagnostics: {
      status: "deterministic",
      reasonCodes: [],
    },
  };
}

function buildFallbackPresentation({ filteredResult, request, content, locale }) {
  const semanticCopy = content.semanticIntent;
  const fallbackOptions = filteredResult?.recommendedNextQuestion?.options || [
    ...createAllowedTaxonomyOptions(locale),
    ...discoveryFallbackOptions.map((option) => ({
      id: option.id,
      label: content.intentOptions[option.id],
    })),
  ];

  return {
    mode: SEMANTIC_PRESENTATION_MODES.FALLBACK,
    heading: content.states.intent.heading,
    body: semanticCopy.fallbackBody,
    reflection: "",
    question: semanticCopy.choiceQuestion,
    choices: appendBivOwnedChoices(
      fallbackOptions.map((option) => ({
        id: option.id,
        label: option.label || content.intentOptions[option.id],
        rationale: "",
        requiresConfirmation: true,
        source: "biv_fallback",
      })),
      content
    ),
    fallbackReasonCodes: filteredResult?.reasonCodes || [],
    originalIdea: request?.originalIdea || "",
    diagnostics: {
      status: "fallback",
      reasonCodes: filteredResult?.reasonCodes || [],
    },
  };
}

function appendBivOwnedChoices(choices, content) {
  const byId = new Map();
  for (const choice of choices) {
    if (choice?.id && !byId.has(choice.id)) {
      byId.set(choice.id, choice);
    }
  }
  for (const fallback of discoveryFallbackOptions) {
    byId.set(fallback.id, {
      id: fallback.id,
      label: content.intentOptions[fallback.id],
      rationale: "",
      requiresConfirmation: true,
      source: "biv_owned",
    });
  }
  return [...byId.values()];
}
