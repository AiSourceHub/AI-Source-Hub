import {
  BIV_SEMANTIC_ENDPOINT_PATH,
  BIV_SEMANTIC_MAX_BODY_BYTES,
  BIV_SEMANTIC_SERVER_MODES,
  handleBivSemanticIntentEndpoint,
} from "../products/business/idea-validator/semanticServerBoundary.js";
import { createOpenAIResponsesServerInvoker } from "../products/business/idea-validator/semanticOpenAIProviderAdapter.js";

export const BIV_WORKER_ALLOWED_ORIGINS = ["https://aisourcehq.com"];

export default {
  async fetch(request, env = {}, ctx = {}) {
    return handleWorkerRequest(request, env, ctx);
  },
};

export async function handleWorkerRequest(request, env = {}, ctx = {}) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin") || "";
  const corsHeaders = buildCorsHeaders(origin);

  if (url.pathname !== BIV_SEMANTIC_ENDPOINT_PATH) {
    return jsonWorkerResponse(404, { ok: false, error: { code: "not_found", message: "Not found." } }, corsHeaders);
  }

  if (request.method.toUpperCase() === "OPTIONS") {
    return handleCorsPreflight(request, corsHeaders);
  }

  if (request.method.toUpperCase() !== "POST") {
    return jsonWorkerResponse(405, { ok: false, error: { code: "method_not_allowed", message: "Method not allowed." } }, corsHeaders);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > BIV_SEMANTIC_MAX_BODY_BYTES) {
    return jsonWorkerResponse(413, { ok: false, error: { code: "request_too_large", message: "Request body is too large." } }, corsHeaders);
  }

  const body = await request.text();
  const boundaryResponse = await handleBivSemanticIntentEndpoint(
    {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
    },
    createWorkerSemanticConfig(env, ctx)
  );

  return jsonWorkerResponse(boundaryResponse.status, boundaryResponse.body, {
    ...Object.fromEntries(Object.entries(boundaryResponse.headers || {})),
    ...corsHeaders,
  });
}

export function createWorkerSemanticConfig(env = {}, ctx = {}) {
  const requestedMode = env.BIV_SEMANTIC_PROVIDER_MODE === BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI
    ? BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI
    : BIV_SEMANTIC_SERVER_MODES.MOCK;
  const allowLiveOpenAI = env.BIV_ALLOW_LIVE_OPENAI === "true";
  const apiKey = env.OPENAI_API_KEY;
  const liveModeConfigured = requestedMode === BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI && allowLiveOpenAI && Boolean(apiKey);

  return {
    env: {
      OPENAI_API_KEY: apiKey,
      VITE_OPENAI_API_KEY: env.VITE_OPENAI_API_KEY,
    },
    mode: requestedMode,
    allowLiveOpenAI,
    stubScenario: env.BIV_SEMANTIC_STUB_SCENARIO || "valid",
    model: env.BIV_OPENAI_MODEL || "server-selected-model",
    serverInvoker: liveModeConfigured
      ? createOpenAIResponsesServerInvoker({
          apiKey,
          fetcher: ctx.openAIResponseFetcher,
        })
      : undefined,
  };
}

export function buildCorsHeaders(origin = "") {
  if (!BIV_WORKER_ALLOWED_ORIGINS.includes(origin)) return {};

  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}

function handleCorsPreflight(request, corsHeaders) {
  if (!corsHeaders["access-control-allow-origin"]) {
    return jsonWorkerResponse(403, { ok: false, error: { code: "origin_not_allowed", message: "Origin not allowed." } });
  }

  const requestedMethod = request.headers.get("access-control-request-method") || "";
  if (requestedMethod.toUpperCase() !== "POST") {
    return jsonWorkerResponse(405, { ok: false, error: { code: "method_not_allowed", message: "Method not allowed." } }, corsHeaders);
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function jsonWorkerResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}
