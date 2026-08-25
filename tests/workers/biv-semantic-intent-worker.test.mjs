import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSemanticIntentRequest } from "../../products/business/idea-validator/semanticIntentContract.js";
import { BIV_SEMANTIC_ENDPOINT_PATH, BIV_SEMANTIC_SERVER_MODES } from "../../products/business/idea-validator/semanticServerBoundary.js";
import {
  BIV_WORKER_ALLOWED_ORIGINS,
  buildCorsHeaders,
  createWorkerSemanticConfig,
  handleWorkerRequest,
} from "../../workers/biv-semantic-intent-worker.js";

const productionOrigin = "https://aisourcehq.com";
const unrelatedOrigin = "https://example.com";

function makeSemanticRequest(overrides = {}) {
  return createSemanticIntentRequest({
    locale: "en",
    originalIdea: "A simple service idea for local customers.",
    confirmedAnswers: {},
    currentDiscoveryState: {},
    policySafeContext: { eligibilityStatus: "biv_owned" },
    ...overrides,
  });
}

function makeRequest({ method = "POST", origin = productionOrigin, path = BIV_SEMANTIC_ENDPOINT_PATH, body = makeSemanticRequest(), headers = {} } = {}) {
  return new Request(`https://semantic-worker.test${path}`, {
    method,
    headers: {
      origin,
      "content-type": "application/json",
      ...(method === "OPTIONS" ? { "access-control-request-method": "POST" } : {}),
      ...headers,
    },
    body: method === "GET" || method === "OPTIONS" ? undefined : (typeof body === "string" ? body : JSON.stringify(body)),
  });
}

async function readJson(response) {
  return response.json();
}

assert.deepEqual(BIV_WORKER_ALLOWED_ORIGINS, [productionOrigin]);
assert.equal(buildCorsHeaders(productionOrigin)["access-control-allow-origin"], productionOrigin);
assert.equal(buildCorsHeaders(unrelatedOrigin)["access-control-allow-origin"], undefined);

const defaultConfig = createWorkerSemanticConfig({});
assert.equal(defaultConfig.mode, BIV_SEMANTIC_SERVER_MODES.MOCK);
assert.equal(defaultConfig.allowLiveOpenAI, false);
assert.equal(defaultConfig.env.OPENAI_API_KEY, undefined);

const liveWithoutExplicitPermission = createWorkerSemanticConfig({
  BIV_SEMANTIC_PROVIDER_MODE: BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI,
  OPENAI_API_KEY: "server-side-secret-present",
});
assert.equal(liveWithoutExplicitPermission.mode, BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI);
assert.equal(liveWithoutExplicitPermission.allowLiveOpenAI, false);

const validResponse = await handleWorkerRequest(makeRequest());
assert.equal(validResponse.status, 200);
assert.equal(validResponse.headers.get("access-control-allow-origin"), productionOrigin);
const validPayload = await readJson(validResponse);
assert.equal(validPayload.ok, true);
assert.equal(validPayload.mode, "mock");
assert.equal(validPayload.endpoint, "biv_semantic_intent");
assert.deepEqual(validPayload.clarification_questions.map((item) => item.id), ["selectedIntent"]);
assert.deepEqual(validPayload.result.intentHypotheses.map((item) => item.id), [
  "semantic_hypothesis_1",
  "semantic_hypothesis_2",
  "semantic_hypothesis_3",
]);
assert.deepEqual(validPayload.result.intentHypotheses.map((item) => item.intentId), ["service", "marketplace", "retail"]);

const arabicValidResponse = await handleWorkerRequest(makeRequest({
  body: makeSemanticRequest({
    locale: "ar",
    originalIdea: "فكرة خدمة محلية بسيطة.",
  }),
}));
assert.equal(arabicValidResponse.status, 200);
const arabicValidPayload = await readJson(arabicValidResponse);
assert.deepEqual(arabicValidPayload.result.intentHypotheses.map((item) => item.id), validPayload.result.intentHypotheses.map((item) => item.id));
assert.deepEqual(arabicValidPayload.result.intentHypotheses.map((item) => item.intentId), validPayload.result.intentHypotheses.map((item) => item.intentId));
assert.notEqual(arabicValidPayload.result.intentHypotheses[0].label, validPayload.result.intentHypotheses[0].label);

const trustedLowConfidenceWorkerResponse = await handleWorkerRequest(
  makeRequest(),
  { BIV_SEMANTIC_STUB_SCENARIO: "low_confidence" }
);
assert.equal(trustedLowConfidenceWorkerResponse.status, 200);
const trustedLowConfidenceWorkerPayload = await readJson(trustedLowConfidenceWorkerResponse);
assert.ok(trustedLowConfidenceWorkerPayload.result.reasonCodes.includes("mock_low_confidence"));
assert.equal(trustedLowConfidenceWorkerPayload.result.intentHypotheses.every((item) => item.confidence === "low"), true);

const trustedForbiddenWorkerResponse = await handleWorkerRequest(
  makeRequest(),
  { BIV_SEMANTIC_STUB_SCENARIO: "forbidden_authority_fields" }
);
assert.equal(trustedForbiddenWorkerResponse.status, 200);
const trustedForbiddenWorkerPayload = await readJson(trustedForbiddenWorkerResponse);
assert.equal(trustedForbiddenWorkerPayload.result.status, "fallback");
assert.ok(trustedForbiddenWorkerPayload.result.reasonCodes.includes("structured_output_schema_invalid"));

const browserJsonScenarioAttemptResponse = await handleWorkerRequest(makeRequest({
  body: makeSemanticRequest({
    policySafeContext: {
      eligibilityStatus: "biv_owned",
      mockScenario: "forbidden_authority_fields",
      BIV_SEMANTIC_STUB_SCENARIO: "low_confidence",
    },
  }),
}));
assert.equal(browserJsonScenarioAttemptResponse.status, 200);
const browserJsonScenarioAttemptPayload = await readJson(browserJsonScenarioAttemptResponse);
assert.equal(browserJsonScenarioAttemptPayload.result.status, "accepted");
assert.ok(browserJsonScenarioAttemptPayload.result.reasonCodes.includes("mock_fixture_valid_semantic_intent"));

const browserHeaderScenarioAttemptResponse = await handleWorkerRequest(makeRequest({
  headers: {
    "x-biv-semantic-stub-scenario": "forbidden_authority_fields",
    "biv-semantic-stub-scenario": "low_confidence",
  },
}));
assert.equal(browserHeaderScenarioAttemptResponse.status, 200);
const browserHeaderScenarioAttemptPayload = await readJson(browserHeaderScenarioAttemptResponse);
assert.equal(browserHeaderScenarioAttemptPayload.result.status, "accepted");
assert.ok(browserHeaderScenarioAttemptPayload.result.reasonCodes.includes("mock_fixture_valid_semantic_intent"));

const preflightResponse = await handleWorkerRequest(makeRequest({ method: "OPTIONS" }));
assert.equal(preflightResponse.status, 204);
assert.equal(preflightResponse.headers.get("access-control-allow-origin"), productionOrigin);
assert.equal(preflightResponse.headers.get("access-control-allow-methods"), "POST, OPTIONS");

const unrelatedOriginResponse = await handleWorkerRequest(makeRequest({ origin: unrelatedOrigin }));
assert.equal(unrelatedOriginResponse.status, 200);
assert.equal(unrelatedOriginResponse.headers.get("access-control-allow-origin"), null);

const unrelatedPreflight = await handleWorkerRequest(makeRequest({ method: "OPTIONS", origin: unrelatedOrigin }));
assert.equal(unrelatedPreflight.status, 403);
assert.equal(unrelatedPreflight.headers.get("access-control-allow-origin"), null);

const getResponse = await handleWorkerRequest(makeRequest({ method: "GET" }));
assert.equal(getResponse.status, 405);
const getPayload = await readJson(getResponse);
assert.equal(getPayload.error.code, "method_not_allowed");

const malformedResponse = await handleWorkerRequest(makeRequest({ body: "{not json" }));
assert.equal(malformedResponse.status, 400);
const malformedPayload = await readJson(malformedResponse);
assert.equal(malformedPayload.error.code, "malformed_json");

const missingFieldsEnglishResponse = await handleWorkerRequest(makeRequest({
  body: {
    schemaVersion: "biv_intent_discovery_v1",
    locale: "en",
    originalIdea: "A simple service idea.",
  },
}));
assert.equal(missingFieldsEnglishResponse.status, 400);
const missingFieldsEnglishPayload = await readJson(missingFieldsEnglishResponse);
assert.deepEqual(missingFieldsEnglishPayload.error.missing_required_fields, [
  "confirmedAnswers",
  "currentDiscoveryState",
  "allowedTaxonomyOptions",
  "policySafeContext",
]);
assert.equal("clarification_questions" in missingFieldsEnglishPayload.error, false);

const missingFieldsArabicResponse = await handleWorkerRequest(makeRequest({
  body: {
    schemaVersion: "biv_intent_discovery_v1",
    locale: "ar",
    originalIdea: "فكرة خدمة بسيطة.",
  },
}));
assert.equal(missingFieldsArabicResponse.status, 400);
const missingFieldsArabicPayload = await readJson(missingFieldsArabicResponse);
assert.deepEqual(missingFieldsArabicPayload.error.missing_required_fields, missingFieldsEnglishPayload.error.missing_required_fields);
assert.equal("clarification_questions" in missingFieldsArabicPayload.error, false);

const coreOfferingArabicResponse = await handleWorkerRequest(makeRequest({
  body: makeSemanticRequest({
    locale: "ar",
    currentDiscoveryState: {
      selectedIntent: "service",
      coreOffering: "",
      coreOfferingStatus: "missing",
    },
  }),
}));
assert.equal(coreOfferingArabicResponse.status, 200);
const coreOfferingArabicPayload = await readJson(coreOfferingArabicResponse);
assert.deepEqual(coreOfferingArabicPayload.clarification_questions.map((item) => item.id), ["coreOffering"]);
assert.equal(coreOfferingArabicPayload.clarification_questions[0].question, "ما الخدمة الأساسية التي سيحصل عليها العميل؟");
assert.equal(coreOfferingArabicPayload.clarification_questions[0].question.includes("coreOffering"), false);

const mixedApproachesEnglishResponse = await handleWorkerRequest(makeRequest({
  body: makeSemanticRequest({
    locale: "en",
    currentDiscoveryState: {
      selectedIntent: "service",
      coreOffering: "Car care",
      coreOfferingStatus: "provided",
      selectedOperatingApproach: "mixed",
      selectedOperatingApproaches: ["fixed_location"],
    },
  }),
}));
assert.equal(mixedApproachesEnglishResponse.status, 200);
const mixedApproachesEnglishPayload = await readJson(mixedApproachesEnglishResponse);
assert.deepEqual(mixedApproachesEnglishPayload.clarification_questions.map((item) => item.id), ["selectedOperatingApproaches"]);
assert.equal(mixedApproachesEnglishPayload.clarification_questions[0].question, "Which delivery approaches do you mean?");

const oversizedResponse = await handleWorkerRequest(
  makeRequest({
    body: JSON.stringify(makeSemanticRequest({ originalIdea: "x".repeat(17 * 1024) })),
    headers: { "content-length": String(17 * 1024) },
  })
);
assert.equal(oversizedResponse.status, 413);

const browserCredentialResponse = await handleWorkerRequest(
  makeRequest({ headers: { "x-openai-api-key": "browser-supplied" } })
);
assert.equal(browserCredentialResponse.status, 400);
const browserCredentialPayload = await readJson(browserCredentialResponse);
assert.equal(browserCredentialPayload.error.code, "browser_credentials_rejected");

const liveMissingConfigResponse = await handleWorkerRequest(
  makeRequest(),
  {
    BIV_SEMANTIC_PROVIDER_MODE: BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI,
    BIV_ALLOW_LIVE_OPENAI: "true",
  }
);
assert.equal(liveMissingConfigResponse.status, 200);
const liveMissingConfigPayload = await readJson(liveMissingConfigResponse);
assert.equal(liveMissingConfigPayload.ok, false);
assert.equal(liveMissingConfigPayload.mode, "live_openai");
assert.equal(liveMissingConfigPayload.result.status, "fallback");

let fakeOpenAIFetchCalls = 0;
let capturedOpenAIRequest = null;
const liveWithAllGatesResponse = await handleWorkerRequest(
  makeRequest(),
  {
    BIV_SEMANTIC_PROVIDER_MODE: BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI,
    BIV_ALLOW_LIVE_OPENAI: "true",
    OPENAI_API_KEY: "server-side-secret-present",
    BIV_OPENAI_MODEL: "future-server-selected-model",
  },
  {
    openAIResponseFetcher: async (url, options) => {
      fakeOpenAIFetchCalls += 1;
      capturedOpenAIRequest = { url, options };
      return {
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            schemaVersion: "biv_intent_discovery_v1",
            locale: "en",
            conciseReflection: "The idea needs confirmation before progress.",
            intentHypotheses: [
              {
                id: "hypothesis_1",
                intentId: "service",
                label: "I provide a service to the customer",
                rationale: "The request describes a service-like idea.",
                confidence: "medium",
                groundingRefs: [{ sourceField: "originalIdea", sourceText: "service idea" }],
                requiresConfirmation: true,
              },
              {
                id: "hypothesis_2",
                intentId: "marketplace",
                label: "I connect two sides",
                rationale: "A platform possibility may exist but requires confirmation.",
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
                { id: "marketplace", label: "I connect two sides" },
              ],
              whyItMatters: "It keeps the next step aligned with the user's answer.",
              blocksProgress: true,
            },
            extractedFacts: [
              {
                id: "original_idea_present",
                label: "The user supplied an initial idea.",
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
            unresolvedItems: [{ id: "intent_unresolved", label: "Intent is not confirmed." }],
            safetySignals: [],
            reasonCodes: ["worker_fake_openai"],
          }),
        }),
      };
    },
  }
);
assert.equal(liveWithAllGatesResponse.status, 200);
const liveWithAllGatesPayload = await readJson(liveWithAllGatesResponse);
assert.equal(liveWithAllGatesPayload.ok, true);
assert.equal(liveWithAllGatesPayload.mode, "live_openai");
assert.equal(liveWithAllGatesPayload.result.status, "accepted");
assert.equal(fakeOpenAIFetchCalls, 1);
assert.equal(capturedOpenAIRequest.url, "https://api.openai.com/v1/responses");
const capturedOpenAIBody = JSON.parse(capturedOpenAIRequest.options.body);
assert.equal(capturedOpenAIBody.text.format.type, "json_schema");
assert.equal(capturedOpenAIBody.text.format.strict, true);
assert.equal(capturedOpenAIBody.text.format.name, "biv_intent_discovery_v1_output");
assert.equal(capturedOpenAIRequest.options.headers.authorization, "Bearer server-side-secret-present");

const liveMalformedProviderResponse = await handleWorkerRequest(
  makeRequest(),
  {
    BIV_SEMANTIC_PROVIDER_MODE: BIV_SEMANTIC_SERVER_MODES.LIVE_OPENAI,
    BIV_ALLOW_LIVE_OPENAI: "true",
    OPENAI_API_KEY: "server-side-secret-present",
    BIV_OPENAI_MODEL: "future-server-selected-model",
  },
  {
    openAIResponseFetcher: async () => ({
      ok: true,
      json: async () => ({ output_text: JSON.stringify({ invalid: true }) }),
    }),
  }
);
assert.equal(liveMalformedProviderResponse.status, 200);
const liveMalformedProviderPayload = await readJson(liveMalformedProviderResponse);
assert.equal(liveMalformedProviderPayload.ok, false);
assert.equal(liveMalformedProviderPayload.result.status, "fallback");
assert.ok(liveMalformedProviderPayload.result.reasonCodes.includes("structured_output_schema_invalid"));

const notFoundResponse = await handleWorkerRequest(makeRequest({ path: "/api/other" }));
assert.equal(notFoundResponse.status, 404);

const workerSource = readFileSync(new URL("../../workers/biv-semantic-intent-worker.js", import.meta.url), "utf8");
assert.equal(/https:\/\/api\.openai\.com|responses\.create|XMLHttpRequest/.test(workerSource), false);
assert.equal(/process\.env|import\.meta\.env/.test(workerSource), false);
assert.equal(/VITE_OPENAI_API_KEY/.test(workerSource), true);
assert.equal(/VITE_OPENAI_API_KEY.*env|env.*VITE_OPENAI_API_KEY/s.test(workerSource), true);
assert.equal(/sk-[a-z0-9]/i.test(workerSource), false);

console.log("Cloudflare BIV semantic Worker tests: PASS");
