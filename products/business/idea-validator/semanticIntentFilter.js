import {
  FORBIDDEN_SEMANTIC_AUTHORITY_FIELDS,
  INTERNAL_INTENT_LABELS,
  SEMANTIC_CONFIDENCE_LEVELS,
  SEMANTIC_EVIDENCE_STRENGTHS,
  SEMANTIC_INTENT_SCHEMA_VERSION,
  SEMANTIC_OUTPUT_FIELDS,
  SUPPORTED_SEMANTIC_LOCALES,
  createSemanticIntentFallback,
} from "./semanticIntentContract.js";
import { collectForbiddenKeys, isPlainObject } from "./semanticIntentValidator.js";

const UNSUPPORTED_CLAIM_PATTERN = /(\b\d[\d,]*(\.\d+)?\s*(sar|riyals?|usd|dollars?|%|percent)\b|\b(sar|usd|riyals?|dollars?)\s*\d[\d,]*(\.\d+)?\b|(?:ريال|دولار|٪|%)|capital cost|startup cost|rent|wage|salary|license required|permit required|تكلفة|رأس مال|إيجار|راتب|أجر|ترخيص مطلوب|رخصة مطلوبة)/iu;

export function filterSemanticIntentOutput({ request = {}, output = {} } = {}) {
  const errors = [];
  const reasonCodes = [];

  if (!isPlainObject(output)) {
    return fallback("output_not_object", "Semantic output must be an object.");
  }

  for (const key of Object.keys(output)) {
    if (!SEMANTIC_OUTPUT_FIELDS.includes(key)) {
      errors.push(`Unknown output field: ${key}`);
      reasonCodes.push("unknown_output_field");
    }
  }

  collectForbiddenKeys(output, FORBIDDEN_SEMANTIC_AUTHORITY_FIELDS).forEach((keyPath) => {
    errors.push(`Forbidden provider authority field: ${keyPath}`);
    reasonCodes.push("forbidden_provider_authority");
  });

  if (output.schemaVersion !== SEMANTIC_INTENT_SCHEMA_VERSION || request.schemaVersion !== SEMANTIC_INTENT_SCHEMA_VERSION) {
    errors.push("Unsupported semantic output schema version.");
    reasonCodes.push("unsupported_output_schema_version");
  }

  if (!SUPPORTED_SEMANTIC_LOCALES.includes(output.locale) || output.locale !== request.locale) {
    errors.push("Semantic output locale must match the request locale.");
    reasonCodes.push("locale_mismatch");
  }

  if (typeof output.conciseReflection !== "string" || !output.conciseReflection.trim()) {
    errors.push("conciseReflection is required.");
    reasonCodes.push("missing_reflection");
  }

  const allowedIds = new Set((request.allowedTaxonomyOptions || []).map((option) => option.id));
  const hypotheses = Array.isArray(output.intentHypotheses) ? output.intentHypotheses : [];
  if (hypotheses.length < 2 || hypotheses.length > 5) {
    errors.push("intentHypotheses must contain 2 to 5 items.");
    reasonCodes.push("invalid_hypothesis_count");
  }

  const hypothesisIds = new Set();
  for (const hypothesis of hypotheses) {
    validateHypothesis(hypothesis, { allowedIds, hypothesisIds, errors, reasonCodes });
  }

  if (!Array.isArray(output.ambiguities)) {
    errors.push("ambiguities must be an array.");
    reasonCodes.push("invalid_ambiguities");
  }

  validateRecommendedQuestion(output.recommendedNextQuestion, { errors, reasonCodes });
  validateEvidenceItems("extractedFacts", output.extractedFacts, { request, errors, reasonCodes });
  validateEvidenceItems("inferredNeedsConfirmation", output.inferredNeedsConfirmation, { request, errors, reasonCodes });

  if (!Array.isArray(output.unresolvedItems)) {
    errors.push("unresolvedItems must be an array.");
    reasonCodes.push("invalid_unresolved_items");
  }

  validateSafetySignals(output.safetySignals, { errors, reasonCodes });

  if (!Array.isArray(output.reasonCodes)) {
    errors.push("reasonCodes must be an array.");
    reasonCodes.push("invalid_reason_codes");
  }

  const claimText = collectTextValues(output).join(" ");
  if (UNSUPPORTED_CLAIM_PATTERN.test(claimText)) {
    errors.push("Provider output includes unsupported cost, price, wage, rent, percentage, or regulatory claims.");
    reasonCodes.push("unsupported_claim");
  }

  if (errors.length > 0) {
    return createSemanticIntentFallback({
      request,
      reasonCodes,
      errors,
    });
  }

  return normalizeSemanticIntentOutput(output);

  function fallback(reasonCode, message) {
    return createSemanticIntentFallback({
      request,
      reasonCodes: [reasonCode],
      errors: [message],
    });
  }
}

function validateHypothesis(hypothesis, { allowedIds, hypothesisIds, errors, reasonCodes }) {
  if (!isPlainObject(hypothesis)) {
    errors.push("Each intent hypothesis must be an object.");
    reasonCodes.push("invalid_hypothesis");
    return;
  }

  const { id, intentId, label, rationale, confidence, requiresConfirmation } = hypothesis;
  if (typeof id !== "string" || !id.trim()) {
    errors.push("Each hypothesis requires a stable id.");
    reasonCodes.push("missing_hypothesis_id");
  } else if (hypothesisIds.has(id)) {
    errors.push(`Duplicate hypothesis id: ${id}`);
    reasonCodes.push("duplicate_hypothesis_id");
  } else {
    hypothesisIds.add(id);
  }

  if (!allowedIds.has(intentId)) {
    errors.push(`Unsupported intent taxonomy id: ${intentId}`);
    reasonCodes.push("unsupported_taxonomy_id");
  }

  if (typeof label !== "string" || !label.trim()) {
    errors.push(`Hypothesis ${id || "(missing)"} requires a localized label.`);
    reasonCodes.push("missing_hypothesis_label");
  } else if (isInternalLabel(label)) {
    errors.push(`Hypothesis ${id || "(missing)"} exposes an internal label.`);
    reasonCodes.push("internal_label_exposed");
  }

  if (typeof rationale !== "string" || !rationale.trim()) {
    errors.push(`Hypothesis ${id || "(missing)"} requires a short rationale.`);
    reasonCodes.push("missing_hypothesis_rationale");
  }

  if (!SEMANTIC_CONFIDENCE_LEVELS.includes(confidence)) {
    errors.push(`Hypothesis ${id || "(missing)"} has invalid confidence.`);
    reasonCodes.push("invalid_confidence");
  }

  if (confidence === "low" && requiresConfirmation !== true) {
    errors.push(`Low-confidence hypothesis ${id || "(missing)"} must require confirmation.`);
    reasonCodes.push("low_confidence_must_require_confirmation");
  }

  if (!Array.isArray(hypothesis.groundingRefs)) {
    errors.push(`Hypothesis ${id || "(missing)"} requires groundingRefs.`);
    reasonCodes.push("missing_grounding_refs");
  }
}

function validateRecommendedQuestion(question, { errors, reasonCodes }) {
  if (question === null) return;
  if (!isPlainObject(question)) {
    errors.push("recommendedNextQuestion must be one object or null.");
    reasonCodes.push("invalid_recommended_question");
    return;
  }
  const required = ["id", "targetField", "question", "answerType", "whyItMatters"];
  for (const key of required) {
    if (typeof question[key] !== "string" || !question[key].trim()) {
      errors.push(`recommendedNextQuestion.${key} is required.`);
      reasonCodes.push("invalid_recommended_question");
    }
  }
  if (typeof question.blocksProgress !== "boolean") {
    errors.push("recommendedNextQuestion.blocksProgress must be boolean.");
    reasonCodes.push("invalid_recommended_question");
  }
  if (question.options !== undefined && !Array.isArray(question.options)) {
    errors.push("recommendedNextQuestion.options must be an array when supplied.");
    reasonCodes.push("invalid_recommended_question_options");
  }
}

function validateEvidenceItems(fieldName, items, { request, errors, reasonCodes }) {
  if (!Array.isArray(items)) {
    errors.push(`${fieldName} must be an array.`);
    reasonCodes.push(`invalid_${fieldName}`);
    return;
  }
  for (const item of items) {
    if (!isPlainObject(item)) {
      errors.push(`${fieldName} entries must be objects.`);
      reasonCodes.push(`invalid_${fieldName}`);
      continue;
    }
    if (typeof item.id !== "string" || !item.id.trim()) {
      errors.push(`${fieldName} entries require stable ids.`);
      reasonCodes.push(`invalid_${fieldName}_id`);
    }
    if (typeof item.label !== "string" || !item.label.trim()) {
      errors.push(`${fieldName} entries require labels.`);
      reasonCodes.push(`invalid_${fieldName}_label`);
    }
    if (item.evidenceStrength && !SEMANTIC_EVIDENCE_STRENGTHS.includes(item.evidenceStrength)) {
      errors.push(`${fieldName} entry has invalid evidenceStrength.`);
      reasonCodes.push(`invalid_${fieldName}_strength`);
    }
    if (fieldName === "extractedFacts" && !isGroundedInRequest(item, request)) {
      errors.push(`Extracted fact ${item.id || "(missing)"} is not grounded in the request.`);
      reasonCodes.push("ungrounded_extracted_fact");
    }
  }
}

function validateSafetySignals(safetySignals, { errors, reasonCodes }) {
  if (!Array.isArray(safetySignals)) {
    errors.push("safetySignals must be an array.");
    reasonCodes.push("invalid_safety_signals");
    return;
  }
  for (const signal of safetySignals) {
    if (!isPlainObject(signal)) {
      errors.push("safetySignals entries must be objects.");
      reasonCodes.push("invalid_safety_signal");
      continue;
    }
    if ("decision" in signal || "verdict" in signal || "eligible" in signal) {
      errors.push("Safety signals cannot make eligibility decisions.");
      reasonCodes.push("safety_signal_authority");
    }
  }
}

function normalizeSemanticIntentOutput(output) {
  return {
    ...output,
    status: "accepted",
    intentHypotheses: output.intentHypotheses.map((hypothesis) => ({
      ...hypothesis,
      selected: false,
      requiresConfirmation: hypothesis.confidence === "low" ? true : hypothesis.requiresConfirmation === true,
    })),
    reasonCodes: [...new Set(output.reasonCodes)],
  };
}

function isGroundedInRequest(item, request) {
  const sourceText = typeof item.sourceText === "string" ? item.sourceText.trim() : "";
  if (!sourceText) return false;
  const sourceField = typeof item.sourceField === "string" ? item.sourceField : "";
  const sourceValue = readRequestSource(request, sourceField);
  if (!sourceValue) return false;
  return normalizeText(sourceValue).includes(normalizeText(sourceText));
}

function readRequestSource(request, sourceField) {
  if (sourceField === "originalIdea") return request.originalIdea || "";
  if (sourceField.startsWith("confirmedAnswers.")) {
    const key = sourceField.slice("confirmedAnswers.".length);
    const value = request.confirmedAnswers?.[key];
    return typeof value === "string" ? value : JSON.stringify(value || "");
  }
  if (sourceField.startsWith("currentDiscoveryState.")) {
    const key = sourceField.slice("currentDiscoveryState.".length);
    const value = request.currentDiscoveryState?.[key];
    return typeof value === "string" ? value : JSON.stringify(value || "");
  }
  return "";
}

function isInternalLabel(label) {
  const normalized = normalizeLabel(label);
  return INTERNAL_INTENT_LABELS.some((internal) => normalized === normalizeLabel(internal));
}

function normalizeLabel(label) {
  return String(label || "").trim().toLowerCase().replace(/[\s_-]+/g, "_");
}

function normalizeText(text) {
  return String(text || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function collectTextValues(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectTextValues(item));
  return Object.values(value).flatMap((item) => collectTextValues(item));
}
