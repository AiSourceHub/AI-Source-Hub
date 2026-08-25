import { createMockSemanticIntentProvider } from "./semanticIntentMockProvider.js";
import { interpretWithSemanticProvider } from "./semanticIntentProvider.js";
import { validateSemanticIntentRequest } from "./semanticIntentValidator.js";
import { buildSemanticClarificationQuestions } from "./semanticIntentContract.js";
import {
  SEMANTIC_OPENAI_SERVER_BOUNDARY,
  buildOpenAIResponsesSemanticPayload,
  createDisabledOpenAIResponsesSemanticProvider,
} from "./semanticOpenAIProviderAdapter.js";

export const BIV_SEMANTIC_ENDPOINT_PATH = "/api/biv/semantic-intent";
export const BIV_SEMANTIC_SERVER_MODES = {
  MOCK: "mock",
  LIVE_OPENAI: "live_openai",
};
export const BIV_SEMANTIC_MAX_BODY_BYTES = 16 * 1024;
export const BIV_SEMANTIC_PROVIDER_TIMEOUT_MS = 1500;
export const BIV_SEMANTIC_DEFAULT_MODEL = "server-selected-model";

export function resolveBivSemanticServerConfig({
  env = {},
  mode = BIV_SEMANTIC_SERVER_MODES.MOCK,
  providerTimeoutMs = BIV_SEMANTIC_PROVIDER_TIMEOUT_MS,
  maxBodyBytes = BIV_SEMANTIC_MAX_BODY_BYTES,
  stubScenario = "valid",
  allowLiveOpenAI = false,
  serverInvoker,
  model = BIV_SEMANTIC_DEFAULT_MODEL,
} = {}) {
  const browserKeySupplied = Boolean(env.VITE_OPENAI_API_KEY);
  const serverKeyAvailable = Boolean(env.OPENAI_API_KEY);
  const normalizedMode = mode === BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI ? mode : BIV_SEMANTIC_SERVER_MODES.MOCK;
  return {
    mode: normalizedMode,
    providerTimeoutMs,
    maxBodyBytes,
    stubScenario,
    allowLiveOpenAI,
    serverKeyAvailable,
    browserKeySupplied,
    serverInvoker,
    model,
  };
}

export async function handleBivSemanticIntentEndpoint(httpRequest = {}, rawConfig = {}) {
  const config = resolveBivSemanticServerConfig(rawConfig);

  try {
    const method = String(httpRequest.method || "").toUpperCase();
    if (method !== "POST") {
      return jsonResponse(405, errorPayload("method_not_allowed", "Method not allowed."));
    }

    if (hasBrowserSuppliedCredential(httpRequest)) {
      return jsonResponse(400, errorPayload("browser_credentials_rejected", "Browser-supplied provider credentials are not accepted."));
    }

    if (!isJsonContentType(httpRequest.headers || {})) {
      return jsonResponse(415, errorPayload("unsupported_media_type", "Content-Type must be application/json."));
    }

    const rawBody = normalizeRawBody(httpRequest.body);
    if (byteLength(rawBody) > config.maxBodyBytes) {
      return jsonResponse(413, errorPayload("request_too_large", "Request body is too large."));
    }

    const parsed = parseJson(rawBody);
    if (!parsed.ok) {
      return jsonResponse(400, errorPayload("malformed_json", "Malformed JSON request."));
    }

    const requestValidation = validateSemanticIntentRequest(parsed.value);
    if (!requestValidation.ok) {
      return jsonResponse(400, validationErrorPayload("invalid_semantic_request", "Invalid semantic request.", {
        validation: requestValidation,
      }));
    }

    const preparedOpenAIPayload = buildOpenAIResponsesSemanticPayload({
      request: parsed.value,
      model: config.model,
    });
    const provider = createConfiguredBoundaryProvider(config);
    const semanticResult = await interpretWithSemanticProvider(provider, parsed.value, {
      timeoutMs: config.providerTimeoutMs,
    });

    return jsonResponse(200, {
      ok: semanticResult.status === "accepted",
      endpoint: "biv_semantic_intent",
      mode: config.mode === BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI ? "live_openai" : "mock",
      schema: preparedOpenAIPayload.text.format.name,
      clarification_questions: buildSemanticClarificationQuestions({
        currentDiscoveryState: parsed.value.currentDiscoveryState,
        confirmedAnswers: parsed.value.confirmedAnswers,
        locale: parsed.value.locale,
      }),
      result: stripInternalErrors(semanticResult),
    });
  } catch {
    return jsonResponse(500, errorPayload("server_error", "Semantic service is temporarily unavailable."));
  }
}

export function createConfiguredBoundaryProvider(config = resolveBivSemanticServerConfig()) {
  if (config.mode !== BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI) {
    return createMockSemanticIntentProvider({ scenario: config.stubScenario || "valid" });
  }

  if (config.browserKeySupplied || !config.allowLiveOpenAI || !config.serverKeyAvailable || typeof config.serverInvoker !== "function") {
    return createDisabledOpenAIResponsesSemanticProvider({ model: config.model });
  }

  return createDisabledOpenAIResponsesSemanticProvider({
    model: config.model,
    serverInvoker: config.serverInvoker,
  });
}

export function describeBivSemanticServerBoundary() {
  return {
    path: BIV_SEMANTIC_ENDPOINT_PATH,
    methods: ["POST"],
    contentType: "application/json",
    defaultMode: BIV_SEMANTIC_SERVER_MODES.MOCK,
    maxBodyBytes: BIV_SEMANTIC_MAX_BODY_BYTES,
    providerTimeoutMs: BIV_SEMANTIC_PROVIDER_TIMEOUT_MS,
    serverBoundary: SEMANTIC_OPENAI_SERVER_BOUNDARY,
    liveModeRequirement: "explicit_server_side_configuration_with_OPENAI_API_KEY",
    browserSecretPolicy: "VITE_OPENAI_API_KEY_is_rejected_and_never_required",
  };
}

function hasBrowserSuppliedCredential(httpRequest) {
  const headers = normalizeHeaders(httpRequest.headers || {});
  if (headers.authorization || headers["x-openai-api-key"] || headers["x-api-key"]) return true;
  const rawBody = normalizeRawBody(httpRequest.body);
  return /"?(apiKey|openaiApiKey|OPENAI_API_KEY|VITE_OPENAI_API_KEY|token|password)"?\s*:/u.test(rawBody);
}

function isJsonContentType(headers) {
  const normalized = normalizeHeaders(headers);
  return String(normalized["content-type"] || "").toLowerCase().includes("application/json");
}

function normalizeHeaders(headers) {
  if (headers instanceof Map) {
    return Object.fromEntries([...headers.entries()].map(([key, value]) => [String(key).toLowerCase(), value]));
  }
  return Object.fromEntries(
    Object.entries(headers || {}).map(([key, value]) => [String(key).toLowerCase(), value])
  );
}

function normalizeRawBody(body) {
  if (typeof body === "string") return body;
  if (body === undefined || body === null) return "";
  return JSON.stringify(body);
}

function parseJson(rawBody) {
  try {
    return { ok: true, value: JSON.parse(rawBody) };
  } catch {
    return { ok: false, value: null };
  }
}

function byteLength(value) {
  return new TextEncoder().encode(String(value || "")).length;
}

function jsonResponse(status, body) {
  return {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body,
  };
}

function errorPayload(code, message) {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

function validationErrorPayload(code, message, { validation = {} } = {}) {
  const payload = errorPayload(code, message);
  const missingRequiredFields = Array.isArray(validation.missingRequiredFields)
    ? validation.missingRequiredFields
    : [];

  if (missingRequiredFields.length > 0) {
    payload.error.missing_required_fields = missingRequiredFields;
  }

  return payload;
}

function stripInternalErrors(semanticResult) {
  const { errors, ...safeResult } = semanticResult || {};
  return safeResult;
}
