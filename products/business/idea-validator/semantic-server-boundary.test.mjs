import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSemanticIntentRequest, SEMANTIC_INTENT_SCHEMA_VERSION } from "./semanticIntentContract.js";
import {
  BIV_SEMANTIC_ENDPOINT_PATH,
  BIV_SEMANTIC_MAX_BODY_BYTES,
  BIV_SEMANTIC_SERVER_MODES,
  describeBivSemanticServerBoundary,
  handleBivSemanticIntentEndpoint,
  resolveBivSemanticServerConfig,
} from "./semanticServerBoundary.js";

function makeHttpRequest(body, overrides = {}) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(overrides.headers || {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...overrides,
  };
}

function makeSemanticRequest(overrides = {}) {
  return createSemanticIntentRequest({
    locale: "en",
    originalIdea: "A service idea that needs semantic clarification.",
    confirmedAnswers: {},
    currentDiscoveryState: {},
    policySafeContext: {
      eligibilityStatus: "biv_owned",
    },
    ...overrides,
  });
}

const boundaryDescription = describeBivSemanticServerBoundary();
assert.equal(boundaryDescription.path, BIV_SEMANTIC_ENDPOINT_PATH);
assert.deepEqual(boundaryDescription.methods, ["POST"]);
assert.equal(boundaryDescription.defaultMode, BIV_SEMANTIC_SERVER_MODES.MOCK);
assert.equal(boundaryDescription.browserSecretPolicy.includes("VITE_OPENAI_API_KEY"), true);

const configDefault = resolveBivSemanticServerConfig();
assert.equal(configDefault.mode, BIV_SEMANTIC_SERVER_MODES.MOCK);
assert.equal(configDefault.serverKeyAvailable, false);

const configWithBrowserKey = resolveBivSemanticServerConfig({
  env: { VITE_OPENAI_API_KEY: "browser-visible-key" },
});
assert.equal(configWithBrowserKey.browserKeySupplied, true);
assert.equal(configWithBrowserKey.serverKeyAvailable, false);

const validResponse = await handleBivSemanticIntentEndpoint(makeHttpRequest(makeSemanticRequest()));
assert.equal(validResponse.status, 200);
assert.equal(validResponse.body.ok, true);
assert.equal(validResponse.body.mode, "mock");
assert.equal(validResponse.body.schema, "biv_intent_discovery_v1_output");
assert.deepEqual(validResponse.body.clarification_questions.map((item) => item.id), ["selectedIntent"]);
assert.equal(validResponse.body.result.status, "accepted");
assert.equal(validResponse.body.result.schemaVersion, SEMANTIC_INTENT_SCHEMA_VERSION);
assert.equal("errors" in validResponse.body.result, false);

const malformedResponse = await handleBivSemanticIntentEndpoint(makeHttpRequest("{not json"));
assert.equal(malformedResponse.status, 400);
assert.equal(malformedResponse.body.error.code, "malformed_json");

const invalidShapeResponse = await handleBivSemanticIntentEndpoint(makeHttpRequest({
  schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
  locale: "en",
  originalIdea: "missing required fields",
}));
assert.equal(invalidShapeResponse.status, 400);
assert.equal(invalidShapeResponse.body.error.code, "invalid_semantic_request");
assert.deepEqual(invalidShapeResponse.body.error.missing_required_fields, [
  "confirmedAnswers",
  "currentDiscoveryState",
  "allowedTaxonomyOptions",
  "policySafeContext",
]);
assert.equal("clarification_questions" in invalidShapeResponse.body.error, false);

const invalidArabicShapeResponse = await handleBivSemanticIntentEndpoint(makeHttpRequest({
  schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
  locale: "ar",
  originalIdea: "فكرة أولية تحتاج إلى فهم.",
}));
assert.equal(invalidArabicShapeResponse.status, 400);
assert.equal("clarification_questions" in invalidArabicShapeResponse.body.error, false);

const unsupportedLocaleMissingFieldsResponse = await handleBivSemanticIntentEndpoint(makeHttpRequest({
  schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
  locale: "fr",
  originalIdea: "A service idea.",
}));
assert.equal(unsupportedLocaleMissingFieldsResponse.status, 400);
assert.equal(unsupportedLocaleMissingFieldsResponse.body.error.code, "invalid_semantic_request");
assert.equal("missing_required_fields" in unsupportedLocaleMissingFieldsResponse.body.error, true);
assert.equal("clarification_questions" in unsupportedLocaleMissingFieldsResponse.body.error, false);

const businessArabicClarificationResponse = await handleBivSemanticIntentEndpoint(makeHttpRequest(makeSemanticRequest({
  locale: "ar",
  currentDiscoveryState: {
    selectedIntent: "service",
    coreOffering: "",
    coreOfferingStatus: "missing",
  },
})));
assert.equal(businessArabicClarificationResponse.status, 200);
assert.deepEqual(businessArabicClarificationResponse.body.clarification_questions.map((item) => item.id), ["coreOffering"]);
assert.equal(businessArabicClarificationResponse.body.clarification_questions[0].question, "ما الخدمة الأساسية التي سيحصل عليها العميل؟");
assert.equal(/[\u0600-\u06ff]/u.test(businessArabicClarificationResponse.body.clarification_questions[0].question), true);

const businessEnglishClarificationResponse = await handleBivSemanticIntentEndpoint(makeHttpRequest(makeSemanticRequest({
  locale: "en",
  currentDiscoveryState: {
    selectedIntent: "service",
    coreOffering: "Car care",
    coreOfferingStatus: "provided",
  },
})));
assert.equal(businessEnglishClarificationResponse.status, 200);
assert.deepEqual(businessEnglishClarificationResponse.body.clarification_questions.map((item) => item.id), ["selectedOperatingApproach"]);
assert.equal(businessEnglishClarificationResponse.body.clarification_questions[0].question, "How will the customer receive what the business provides?");
assert.equal(/[\u0600-\u06ff]/u.test(businessEnglishClarificationResponse.body.clarification_questions[0].question), false);

const oversizedResponse = await handleBivSemanticIntentEndpoint(
  makeHttpRequest(makeSemanticRequest({ originalIdea: "x".repeat(BIV_SEMANTIC_MAX_BODY_BYTES + 1) }))
);
assert.equal(oversizedResponse.status, 413);
assert.equal(oversizedResponse.body.error.code, "request_too_large");

const getResponse = await handleBivSemanticIntentEndpoint(makeHttpRequest(makeSemanticRequest(), { method: "GET" }));
assert.equal(getResponse.status, 405);
assert.equal(getResponse.body.error.code, "method_not_allowed");

const contentTypeResponse = await handleBivSemanticIntentEndpoint(
  makeHttpRequest(makeSemanticRequest(), { headers: { "content-type": "text/plain" } })
);
assert.equal(contentTypeResponse.status, 415);
assert.equal(contentTypeResponse.body.error.code, "unsupported_media_type");

const browserHeaderKeyResponse = await handleBivSemanticIntentEndpoint(
  makeHttpRequest(makeSemanticRequest(), { headers: { "x-openai-api-key": "browser-supplied" } })
);
assert.equal(browserHeaderKeyResponse.status, 400);
assert.equal(browserHeaderKeyResponse.body.error.code, "browser_credentials_rejected");

const browserBodyKeyResponse = await handleBivSemanticIntentEndpoint(
  makeHttpRequest({ ...makeSemanticRequest(), apiKey: "browser-supplied" })
);
assert.equal(browserBodyKeyResponse.status, 400);
assert.equal(browserBodyKeyResponse.body.error.code, "browser_credentials_rejected");

const liveWithoutServerConfig = await handleBivSemanticIntentEndpoint(
  makeHttpRequest(makeSemanticRequest()),
  {
    mode: BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI,
    allowLiveOpenAI: true,
    env: {},
  }
);
assert.equal(liveWithoutServerConfig.status, 200);
assert.equal(liveWithoutServerConfig.body.ok, false);
assert.equal(liveWithoutServerConfig.body.mode, "live_openai");
assert.equal(liveWithoutServerConfig.body.result.status, "fallback");
assert.ok(liveWithoutServerConfig.body.result.reasonCodes.includes("provider_failure"));

const liveWithServerInvoker = await handleBivSemanticIntentEndpoint(
  makeHttpRequest(makeSemanticRequest()),
  {
    mode: BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI,
    allowLiveOpenAI: true,
    env: { OPENAI_API_KEY: "server-side-key-present" },
    model: "future-server-selected-model",
    serverInvoker: async (payload) => {
      assert.equal(payload.text.format.type, "json_schema");
      assert.equal(payload.text.format.strict, true);
      return {
        schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
        locale: "en",
        conciseReflection: "The idea needs confirmation before the next step.",
        intentHypotheses: [
          {
            id: "hypothesis_1",
            intentId: "service",
            label: "I provide a service to the customer",
            rationale: "The supplied idea says it is a service idea.",
            confidence: "medium",
            groundingRefs: [{ sourceField: "originalIdea", sourceText: "service idea" }],
            requiresConfirmation: true,
          },
          {
            id: "hypothesis_2",
            intentId: "digital",
            label: "I provide software or a digital service",
            rationale: "Digital delivery is possible but not confirmed.",
            confidence: "low",
            groundingRefs: [{ sourceField: "originalIdea", sourceText: "service idea" }],
            requiresConfirmation: true,
          },
        ],
        ambiguities: [],
        recommendedNextQuestion: {
          id: "confirm_intent",
          targetField: "selectedIntent",
          question: "Which description is closest to what you mean?",
          answerType: "single_choice",
          options: [
            { id: "service", label: "I provide a service to the customer" },
            { id: "digital", label: "I provide software or a digital service" },
          ],
          whyItMatters: "It keeps the next question aligned with the user's intent.",
          blocksProgress: true,
        },
        extractedFacts: [
          {
            id: "service_idea",
            label: "The idea mentions a service.",
            sourceField: "originalIdea",
            sourceText: "service idea",
            evidenceStrength: "medium",
          },
        ],
        inferredNeedsConfirmation: [
          {
            id: "intent_needs_confirmation",
            label: "The intent needs confirmation.",
            sourceField: "originalIdea",
            sourceText: "service idea",
            evidenceStrength: "weak",
          },
        ],
        unresolvedItems: [{ id: "intent_unresolved", label: "Intent is unresolved." }],
        safetySignals: [],
        reasonCodes: ["server_stub"],
      };
    },
  }
);
assert.equal(liveWithServerInvoker.status, 200);
assert.equal(liveWithServerInvoker.body.ok, true);
assert.equal(liveWithServerInvoker.body.result.status, "accepted");

const providerFailureResponse = await handleBivSemanticIntentEndpoint(
  makeHttpRequest(makeSemanticRequest()),
  {
    mode: BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI,
    allowLiveOpenAI: true,
    env: { OPENAI_API_KEY: "server-side-key-present" },
    model: "future-server-selected-model",
    serverInvoker: async () => {
      throw new Error("provider unavailable");
    },
  }
);
assert.equal(providerFailureResponse.status, 200);
assert.equal(providerFailureResponse.body.ok, false);
assert.equal(providerFailureResponse.body.result.status, "fallback");
assert.ok(providerFailureResponse.body.result.reasonCodes.includes("provider_failure"));

const source = readFileSync(new URL("./semanticServerBoundary.js", import.meta.url), "utf8");
assert.equal(/fetch\s*\(/.test(source), false);
assert.equal(/XMLHttpRequest/.test(source), false);
assert.equal(/process\.env|import\.meta\.env/.test(source), false);
assert.equal(/sk-[a-z0-9]|secret\s*[:=]/i.test(source), false);

console.log("Semantic server boundary tests: PASS");
