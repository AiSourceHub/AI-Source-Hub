import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSemanticIntentRequest, SEMANTIC_INTENT_SCHEMA_VERSION } from "./semanticIntentContract.js";
import {
  OPENAI_RESPONSES_API_URL,
  SEMANTIC_OPENAI_ADAPTER_STATUS,
  SEMANTIC_OPENAI_SERVER_BOUNDARY,
  buildOpenAIResponsesSemanticPayload,
  createDisabledOpenAIResponsesSemanticProvider,
  createOpenAIResponsesServerInvoker,
  extractStructuredOutputFromResponsesApi,
} from "./semanticOpenAIProviderAdapter.js";
import { interpretWithSemanticProvider } from "./semanticIntentProvider.js";

const request = createSemanticIntentRequest({
  locale: "en",
  originalIdea: "A service idea that needs semantic clarification.",
});

assert.equal(SEMANTIC_OPENAI_ADAPTER_STATUS, "disabled_until_server_boundary_exists");
assert.equal(SEMANTIC_OPENAI_SERVER_BOUNDARY.execution, "server_or_serverless_only");
assert.equal(SEMANTIC_OPENAI_SERVER_BOUNDARY.clientPolicy, "browser_code_must_never_hold_provider_credentials");
assert.equal(SEMANTIC_OPENAI_SERVER_BOUNDARY.providerApi, "responses");
assert.equal(SEMANTIC_OPENAI_SERVER_BOUNDARY.outputMode, "structured_json_schema");
assert.ok(SEMANTIC_OPENAI_SERVER_BOUNDARY.bivAuthority.includes("eligibility"));
assert.ok(SEMANTIC_OPENAI_SERVER_BOUNDARY.bivAuthority.includes("journey_state"));
assert.ok(SEMANTIC_OPENAI_SERVER_BOUNDARY.providerMayAssistWith.includes("semantic_classification_suggestions"));

assert.throws(
  () => buildOpenAIResponsesSemanticPayload({ request }),
  /model name must be supplied/
);

const payload = buildOpenAIResponsesSemanticPayload({
  request,
  model: "future-server-selected-model",
});
assert.equal(payload.model, "future-server-selected-model");
assert.equal(payload.text.format.type, "json_schema");
assert.equal(payload.text.format.strict, true);
assert.equal(payload.text.format.schema.properties.schemaVersion.enum[0], SEMANTIC_INTENT_SCHEMA_VERSION);
assert.equal(payload.text.format.schema.additionalProperties, false);
assert.equal(payload.input.length, 2);
assert.equal(JSON.stringify(payload).includes("eligibility decisions"), true);
assert.equal(JSON.stringify(payload).includes("route decisions"), true);

const disabledProvider = createDisabledOpenAIResponsesSemanticProvider({
  model: "future-server-selected-model",
});
const disabledResult = await interpretWithSemanticProvider(disabledProvider, request);
assert.equal(disabledResult.status, "fallback");
assert.ok(disabledResult.reasonCodes.includes("provider_failure"));

let serverPayload = null;
const serverBoundaryProvider = createDisabledOpenAIResponsesSemanticProvider({
  model: "future-server-selected-model",
  serverInvoker: async (payloadFromAdapter) => {
    serverPayload = payloadFromAdapter;
    return {
      schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
      locale: "en",
      conciseReflection: "The idea needs user confirmation before progress.",
      intentHypotheses: [
        {
          id: "hypothesis_1",
          intentId: "service",
          label: "I provide a service to the customer",
          rationale: "The description mentions a service idea and needs confirmation.",
          confidence: "medium",
          groundingRefs: [{ sourceField: "originalIdea", sourceText: request.originalIdea }],
          requiresConfirmation: true,
        },
        {
          id: "hypothesis_2",
          intentId: "marketplace",
          label: "I connect two sides",
          rationale: "A platform possibility is not confirmed and must remain secondary.",
          confidence: "low",
          groundingRefs: [{ sourceField: "originalIdea", sourceText: request.originalIdea }],
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
        whyItMatters: "This keeps the next question aligned with the user's confirmed intent.",
        blocksProgress: true,
      },
      extractedFacts: [
        {
          id: "original_idea_present",
          label: "The user supplied an initial idea.",
          sourceField: "originalIdea",
          sourceText: request.originalIdea,
          evidenceStrength: "medium",
        },
      ],
      inferredNeedsConfirmation: [
        {
          id: "intent_needs_confirmation",
          label: "The business intent needs confirmation.",
          sourceField: "originalIdea",
          sourceText: request.originalIdea,
          evidenceStrength: "weak",
        },
      ],
      unresolvedItems: [{ id: "intent_unresolved", label: "Intent is not confirmed." }],
      safetySignals: [],
      reasonCodes: ["server_boundary_test"],
    };
  },
});
const serverResult = await interpretWithSemanticProvider(serverBoundaryProvider, request);
assert.equal(serverResult.status, "accepted");
assert.equal(serverPayload.text.format.type, "json_schema");
assert.equal(serverPayload.text.format.strict, true);

function makeStructuredOutput(overrides = {}) {
  return {
    schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
    locale: "en",
    conciseReflection: "The idea needs confirmation before progress.",
    intentHypotheses: [
      {
        id: "hypothesis_1",
        intentId: "service",
        label: "I provide a service to the customer",
        rationale: "The request describes a service-like idea.",
        confidence: "medium",
        groundingRefs: [{ sourceField: "originalIdea", sourceText: request.originalIdea }],
        requiresConfirmation: true,
      },
      {
        id: "hypothesis_2",
        intentId: "marketplace",
        label: "I connect two sides",
        rationale: "A platform possibility may exist but requires confirmation.",
        confidence: "low",
        groundingRefs: [{ sourceField: "originalIdea", sourceText: request.originalIdea }],
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
      whyItMatters: "This keeps the next step aligned with the user.",
      blocksProgress: true,
    },
    extractedFacts: [
      {
        id: "original_idea_present",
        label: "The user supplied an initial idea.",
        sourceField: "originalIdea",
        sourceText: request.originalIdea,
        evidenceStrength: "medium",
      },
    ],
    inferredNeedsConfirmation: [
      {
        id: "intent_needs_confirmation",
        label: "The intent needs confirmation.",
        sourceField: "originalIdea",
        sourceText: request.originalIdea,
        evidenceStrength: "weak",
      },
    ],
    unresolvedItems: [{ id: "intent_unresolved", label: "Intent is not confirmed." }],
    safetySignals: [],
    reasonCodes: ["fake_openai_response"],
    ...overrides,
  };
}

assert.deepEqual(
  extractStructuredOutputFromResponsesApi({ output_text: JSON.stringify(makeStructuredOutput()) }).schemaVersion,
  SEMANTIC_INTENT_SCHEMA_VERSION
);
assert.throws(() => extractStructuredOutputFromResponsesApi({ output_text: "{not json" }), /structured output/);
assert.throws(() => extractStructuredOutputFromResponsesApi({ output: [] }), /structured output text/);

let fakeFetchCalled = 0;
let capturedUrl = "";
let capturedOptions = null;
const fakeOpenAIInvoker = createOpenAIResponsesServerInvoker({
  apiKey: "server-only-test-key",
  timeoutMs: 100,
  fetcher: async (url, options) => {
    fakeFetchCalled += 1;
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      json: async () => ({
        output_text: JSON.stringify(makeStructuredOutput()),
      }),
    };
  },
});
const fakeOpenAIResult = await fakeOpenAIInvoker(payload);
assert.equal(fakeFetchCalled, 1);
assert.equal(capturedUrl, OPENAI_RESPONSES_API_URL);
assert.equal(capturedOptions.method, "POST");
assert.equal(capturedOptions.headers["content-type"], "application/json");
assert.equal(capturedOptions.headers.authorization, "Bearer server-only-test-key");
const capturedBody = JSON.parse(capturedOptions.body);
assert.equal(capturedBody.text.format.type, "json_schema");
assert.equal(capturedBody.text.format.strict, true);
assert.equal(fakeOpenAIResult.schemaVersion, SEMANTIC_INTENT_SCHEMA_VERSION);

const fakeOpenAIProvider = createDisabledOpenAIResponsesSemanticProvider({
  model: "future-server-selected-model",
  serverInvoker: createOpenAIResponsesServerInvoker({
    apiKey: "server-only-test-key",
    timeoutMs: 100,
    fetcher: async () => ({
      ok: true,
      json: async () => ({ output_text: JSON.stringify(makeStructuredOutput()) }),
    }),
  }),
});
const fakeOpenAIProviderResult = await interpretWithSemanticProvider(fakeOpenAIProvider, request);
assert.equal(fakeOpenAIProviderResult.status, "accepted");

const malformedOpenAIProvider = createDisabledOpenAIResponsesSemanticProvider({
  model: "future-server-selected-model",
  serverInvoker: createOpenAIResponsesServerInvoker({
    apiKey: "server-only-test-key",
    timeoutMs: 100,
    fetcher: async () => ({
      ok: true,
      json: async () => ({ output_text: JSON.stringify({ invalid: true }) }),
    }),
  }),
});
const malformedOpenAIProviderResult = await interpretWithSemanticProvider(malformedOpenAIProvider, request);
assert.equal(malformedOpenAIProviderResult.status, "fallback");
assert.ok(malformedOpenAIProviderResult.reasonCodes.includes("structured_output_schema_invalid"));

const non2xxOpenAIProvider = createDisabledOpenAIResponsesSemanticProvider({
  model: "future-server-selected-model",
  serverInvoker: createOpenAIResponsesServerInvoker({
    apiKey: "server-only-test-key",
    timeoutMs: 100,
    fetcher: async () => ({ ok: false, status: 500, json: async () => ({ error: "server" }) }),
  }),
});
const non2xxOpenAIProviderResult = await interpretWithSemanticProvider(non2xxOpenAIProvider, request);
assert.equal(non2xxOpenAIProviderResult.status, "fallback");
assert.ok(non2xxOpenAIProviderResult.reasonCodes.includes("provider_failure"));

const timeoutOpenAIProvider = createDisabledOpenAIResponsesSemanticProvider({
  model: "future-server-selected-model",
  serverInvoker: createOpenAIResponsesServerInvoker({
    apiKey: "server-only-test-key",
    timeoutMs: 1,
    fetcher: async () => new Promise(() => {}),
  }),
});
const timeoutOpenAIProviderResult = await interpretWithSemanticProvider(timeoutOpenAIProvider, request, { timeoutMs: 50 });
assert.equal(timeoutOpenAIProviderResult.status, "fallback");
assert.ok(timeoutOpenAIProviderResult.reasonCodes.includes("provider_failure"));

const source = readFileSync(new URL("./semanticOpenAIProviderAdapter.js", import.meta.url), "utf8");
assert.equal(/fetch\s*\(/.test(source), false);
assert.equal(/XMLHttpRequest/.test(source), false);
assert.equal(/process\.env|import\.meta\.env/.test(source), false);
assert.equal(/sk-[a-z0-9]|secret\s*[:=]/i.test(source), false);

console.log("Semantic OpenAI provider adapter tests: PASS");
