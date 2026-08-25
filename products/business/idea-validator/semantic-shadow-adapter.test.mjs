import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSemanticIntentRequest } from "./semanticIntentContract.js";
import { createMockSemanticIntentProvider } from "./semanticIntentMockProvider.js";
import { interpretWithSemanticProvider } from "./semanticIntentProvider.js";
import {
  BIV_SEMANTIC_SHADOW_ENABLED,
  observeSemanticShadow,
  validateWorkerEnvelope,
} from "./semanticShadowAdapter.js";

const request = createSemanticIntentRequest({
  locale: "en",
  originalIdea: "A local service idea for appointment reminders.",
  confirmedAnswers: {},
  currentDiscoveryState: {},
  policySafeContext: {
    prototypeOnly: true,
    providerCannotControlRoute: true,
  },
});

const localResult = await interpretWithSemanticProvider(
  createMockSemanticIntentProvider({ scenario: "valid" }),
  request
);

const workerEnvelope = {
  ok: true,
  endpoint: "biv_semantic_intent",
  mode: "mock",
  schema: "biv_intent_discovery_v1_output",
  clarification_questions: [
    {
      id: "selectedIntent",
      question: "Which description is closest to how your business would work?",
    },
  ],
  result: localResult,
};

function makeJsonResponse(body, { status = 200, ok = true } = {}) {
  return {
    ok,
    status,
    async json() {
      return body;
    },
  };
}

assert.equal(BIV_SEMANTIC_SHADOW_ENABLED, false);

let disabledCalls = 0;
const disabled = await observeSemanticShadow({
  request,
  authoritativeResult: localResult,
  enabled: false,
  fetcher: async () => {
    disabledCalls += 1;
    return makeJsonResponse(workerEnvelope);
  },
});
assert.equal(disabledCalls, 0);
assert.equal(disabled.shadowStatus, "disabled");
assert.equal(disabled.failureCategory, "shadow_disabled");
assert.deepEqual(localResult, localResult);

let successCalls = 0;
const success = await observeSemanticShadow({
  request,
  authoritativeResult: localResult,
  enabled: true,
  fetcher: async () => {
    successCalls += 1;
    return makeJsonResponse(workerEnvelope);
  },
});
assert.equal(successCalls, 1);
assert.equal(success.shadowStatus, "compared");
assert.equal(success.locale, "en");
assert.equal(success.schemaVersion, "biv_intent_discovery_v1");
assert.equal(success.envelopeValid, true);
assert.equal(success.resultValidationPassed, true);
assert.equal(success.statusMatch, true);
assert.deepEqual(success.clarificationQuestionIds, ["selectedIntent"]);
assert.equal("result" in success, false);
assert.equal("workerEnvelope" in success, false);
assert.equal("rawResponse" in success, false);
assert.equal(JSON.stringify(success).includes(request.originalIdea), false);
assert.equal(JSON.stringify(success).includes("confirmedAnswers"), false);
assert.equal(JSON.stringify(success).includes("currentDiscoveryState"), false);

const timeout = await observeSemanticShadow({
  request,
  authoritativeResult: localResult,
  enabled: true,
  timeoutMs: 5,
  fetcher: async (_endpoint, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => {
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    });
  }),
});
assert.equal(timeout.shadowStatus, "failed");
assert.equal(timeout.failureCategory, "timeout");

const httpFailure = await observeSemanticShadow({
  request,
  authoritativeResult: localResult,
  enabled: true,
  fetcher: async () => makeJsonResponse({ ok: false }, { status: 500, ok: false }),
});
assert.equal(httpFailure.shadowStatus, "failed");
assert.equal(httpFailure.failureCategory, "http_error");
assert.equal(httpFailure.httpStatus, 500);

const malformed = await observeSemanticShadow({
  request,
  authoritativeResult: localResult,
  enabled: true,
  fetcher: async () => ({
    ok: true,
    status: 200,
    async json() {
      throw new Error("bad json");
    },
  }),
});
assert.equal(malformed.shadowStatus, "failed");
assert.equal(malformed.failureCategory, "malformed_envelope");

const nonMock = await observeSemanticShadow({
  request,
  authoritativeResult: localResult,
  enabled: true,
  fetcher: async () => makeJsonResponse({ ...workerEnvelope, mode: "live_openai" }),
});
assert.equal(nonMock.shadowStatus, "failed");
assert.equal(nonMock.failureCategory, "non_mock_mode");

const schemaInvalid = await observeSemanticShadow({
  request,
  authoritativeResult: localResult,
  enabled: true,
  fetcher: async () => makeJsonResponse({
    ...workerEnvelope,
    result: {
      ...workerEnvelope.result,
      schemaVersion: "wrong",
    },
  }),
});
assert.equal(schemaInvalid.shadowStatus, "failed");
assert.equal(schemaInvalid.failureCategory, "schema_version_mismatch");

const forbiddenAuthority = await observeSemanticShadow({
  request,
  authoritativeResult: localResult,
  enabled: true,
  fetcher: async () => makeJsonResponse({
    ...workerEnvelope,
    result: {
      ...workerEnvelope.result,
      score: 90,
    },
  }),
});
assert.equal(forbiddenAuthority.shadowStatus, "failed");
assert.equal(forbiddenAuthority.failureCategory, "authority_field_present");
assert.equal("score" in forbiddenAuthority, false);

const envelopeCheck = validateWorkerEnvelope(workerEnvelope, request);
assert.equal(envelopeCheck.ok, true);

const adapterSource = readFileSync(new URL("./semanticShadowAdapter.js", import.meta.url), "utf8");
assert.equal(/buildSemanticIntentPresentation/.test(adapterSource), false);
assert.equal(/semanticIntentPresentation/.test(adapterSource), false);
assert.equal(/semanticOpenAIProviderAdapter|createOpenAI|Responses API|OPENAI_API_KEY|VITE_OPENAI/i.test(adapterSource), false);
assert.equal(/localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|analytics|telemetry/i.test(adapterSource), false);

console.log("Semantic shadow adapter tests: PASS");
