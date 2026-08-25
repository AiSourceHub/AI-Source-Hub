import {
  FORBIDDEN_SEMANTIC_AUTHORITY_FIELDS,
  SEMANTIC_INTENT_SCHEMA_VERSION,
  SEMANTIC_OUTPUT_FIELDS,
  SEMANTIC_OUTPUT_SCHEMA_NAME,
} from "./semanticIntentContract.js";
import { collectForbiddenKeys, isPlainObject } from "./semanticIntentValidator.js";

export const BIV_SEMANTIC_SHADOW_ENABLED = false;
export const BIV_SEMANTIC_SHADOW_TIMEOUT_MS = 1000;
export const BIV_SEMANTIC_WORKER_ENDPOINT = "https://biv-semantic-intent.officialaisourcehub.workers.dev/api/biv/semantic-intent";

const SHADOW_STATUSES = {
  DISABLED: "disabled",
  COMPARED: "compared",
  FAILED: "failed",
};

export async function observeSemanticShadow({
  request = {},
  authoritativeResult = {},
  endpoint = BIV_SEMANTIC_WORKER_ENDPOINT,
  enabled = BIV_SEMANTIC_SHADOW_ENABLED,
  timeoutMs = BIV_SEMANTIC_SHADOW_TIMEOUT_MS,
  fetcher = globalThis.fetch,
} = {}) {
  if (!enabled) {
    return shadowDisabledMetadata(request);
  }

  if (typeof fetcher !== "function") {
    return shadowFailureMetadata(request, "fetch_unavailable");
  }

  try {
    const response = await fetchWithTimeout(fetcher, endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    }, timeoutMs);

    if (!response || typeof response.ok !== "boolean" || typeof response.status !== "number") {
      return shadowFailureMetadata(request, "invalid_http_response");
    }

    if (!response.ok) {
      return shadowFailureMetadata(request, "http_error", { httpStatus: response.status });
    }

    const envelope = await safeReadJson(response);
    const envelopeValidation = validateWorkerEnvelope(envelope, request);
    if (!envelopeValidation.ok) {
      return shadowFailureMetadata(request, envelopeValidation.failureCategory, envelopeValidation.metadata);
    }

    return compareShadowResults({
      request,
      authoritativeResult,
      workerEnvelope: envelope,
    });
  } catch (error) {
    return shadowFailureMetadata(request, error?.name === "AbortError" ? "timeout" : "worker_unavailable");
  }
}

export function validateWorkerEnvelope(envelope, request = {}) {
  if (!isPlainObject(envelope)) {
    return invalidEnvelope("malformed_envelope");
  }

  if (envelope.ok !== true || envelope.endpoint !== "biv_semantic_intent") {
    return invalidEnvelope("unexpected_envelope");
  }

  if (envelope.mode !== "mock") {
    return invalidEnvelope("non_mock_mode");
  }

  if (envelope.schema !== SEMANTIC_OUTPUT_SCHEMA_NAME) {
    return invalidEnvelope("schema_name_mismatch");
  }

  if (!Array.isArray(envelope.clarification_questions)) {
    return invalidEnvelope("invalid_clarification_questions");
  }

  const resultValidation = validateFilteredSemanticResult(envelope.result, request);
  if (!resultValidation.ok) {
    return invalidEnvelope(resultValidation.failureCategory, resultValidation.metadata);
  }

  return { ok: true };
}

export function validateFilteredSemanticResult(result, request = {}) {
  if (!isPlainObject(result)) {
    return invalidResult("invalid_result_shape");
  }

  if (result.schemaVersion !== SEMANTIC_INTENT_SCHEMA_VERSION || result.schemaVersion !== request.schemaVersion) {
    return invalidResult("schema_version_mismatch");
  }

  if (result.locale !== request.locale) {
    return invalidResult("locale_mismatch");
  }

  if (!["accepted", "fallback"].includes(result.status)) {
    return invalidResult("invalid_result_status");
  }

  for (const field of SEMANTIC_OUTPUT_FIELDS) {
    if (!(field in result)) {
      return invalidResult("missing_result_field");
    }
  }

  const forbiddenKeys = collectForbiddenKeys(result, FORBIDDEN_SEMANTIC_AUTHORITY_FIELDS);
  if (forbiddenKeys.length > 0) {
    return invalidResult("authority_field_present", {
      forbiddenAuthorityFieldCount: forbiddenKeys.length,
    });
  }

  if (!Array.isArray(result.intentHypotheses) || !Array.isArray(result.unresolvedItems)) {
    return invalidResult("invalid_result_collections");
  }

  return { ok: true };
}

function compareShadowResults({ request = {}, authoritativeResult = {}, workerEnvelope = {} } = {}) {
  const workerResult = workerEnvelope.result || {};
  const localQuestionId = authoritativeResult?.recommendedNextQuestion?.id || "";
  const workerQuestionId = workerResult?.recommendedNextQuestion?.id || "";
  const localIntentIds = intentIds(authoritativeResult);
  const workerIntentIds = intentIds(workerResult);
  const localUnresolvedCount = Array.isArray(authoritativeResult.unresolvedItems) ? authoritativeResult.unresolvedItems.length : 0;
  const workerUnresolvedCount = Array.isArray(workerResult.unresolvedItems) ? workerResult.unresolvedItems.length : 0;
  const workerClarificationIds = workerEnvelope.clarification_questions.map((question) => question.id).filter(Boolean);

  return {
    shadowStatus: SHADOW_STATUSES.COMPARED,
    locale: request.locale || "",
    schemaVersion: request.schemaVersion || "",
    envelopeValid: true,
    resultValidationPassed: true,
    statusMatch: authoritativeResult.status === workerResult.status,
    localStatus: authoritativeResult.status || "",
    workerStatus: workerResult.status || "",
    recommendedNextQuestionIdMatch: localQuestionId === workerQuestionId,
    localRecommendedNextQuestionId: localQuestionId,
    workerRecommendedNextQuestionId: workerQuestionId,
    intentHypothesisIdsMatch: sameList(localIntentIds, workerIntentIds),
    localIntentHypothesisIds: localIntentIds,
    workerIntentHypothesisIds: workerIntentIds,
    unresolvedItemCountMatch: localUnresolvedCount === workerUnresolvedCount,
    localUnresolvedItemCount: localUnresolvedCount,
    workerUnresolvedItemCount: workerUnresolvedCount,
    clarificationQuestionIds: workerClarificationIds,
    failureCategory: "",
  };
}

function shadowDisabledMetadata(request = {}) {
  return {
    shadowStatus: SHADOW_STATUSES.DISABLED,
    locale: request.locale || "",
    schemaVersion: request.schemaVersion || "",
    envelopeValid: false,
    resultValidationPassed: false,
    failureCategory: "shadow_disabled",
  };
}

function shadowFailureMetadata(request = {}, failureCategory, extra = {}) {
  return {
    shadowStatus: SHADOW_STATUSES.FAILED,
    locale: request.locale || "",
    schemaVersion: request.schemaVersion || "",
    envelopeValid: false,
    resultValidationPassed: false,
    failureCategory,
    ...extra,
  };
}

async function fetchWithTimeout(fetcher, endpoint, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(endpoint, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function intentIds(result = {}) {
  return Array.isArray(result.intentHypotheses)
    ? result.intentHypotheses.map((item) => item.intentId).filter(Boolean)
    : [];
}

function sameList(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function invalidEnvelope(failureCategory, metadata = {}) {
  return { ok: false, failureCategory, metadata };
}

function invalidResult(failureCategory, metadata = {}) {
  return { ok: false, failureCategory, metadata };
}
