import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEMANTIC_INTENT_SCHEMA_VERSION,
  createAllowedTaxonomyOptions,
  createSemanticIntentRequest,
} from "./semanticIntentContract.js";
import { filterSemanticIntentOutput } from "./semanticIntentFilter.js";
import { createMockSemanticIntentProvider } from "./semanticIntentMockProvider.js";
import { interpretWithSemanticProvider } from "./semanticIntentProvider.js";
import { validateSemanticIntentRequest } from "./semanticIntentValidator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function makeRequest(locale = "en", overrides = {}) {
  return createSemanticIntentRequest({
    locale,
    originalIdea: locale === "ar"
      ? "فكرة لخدمة العملاء ومساعدتهم على اختيار أقرب وصف للمشروع."
      : "A service idea that needs help choosing the closest business intent.",
    confirmedAnswers: {
      selectedIntent: "",
    },
    currentDiscoveryState: {
      step: "intent",
    },
    allowedTaxonomyOptions: createAllowedTaxonomyOptions(locale),
    policySafeContext: {
      eligibilityStatus: "not_evaluated_by_semantic_provider",
    },
    ...overrides,
  });
}

async function runScenario(scenario, locale = "en", options = {}) {
  const request = makeRequest(locale, options.requestOverrides || {});
  const provider = createMockSemanticIntentProvider({
    scenario,
    delayMs: options.delayMs || 0,
  });
  const result = await interpretWithSemanticProvider(provider, request, {
    timeoutMs: options.timeoutMs || 1500,
  });
  return { request, result };
}

function assertFallback(result, reasonCode) {
  assert.equal(result.status, "fallback");
  assert.ok(result.reasonCodes.includes(reasonCode), `Expected fallback reason ${reasonCode}, got ${result.reasonCodes.join(", ")}`);
  assert.equal(result.intentHypotheses.length, 0);
  assert.equal(result.recommendedNextQuestion.targetField, "selectedIntent");
}

function assertAccepted(result) {
  assert.equal(result.status, "accepted");
  assert.equal(result.schemaVersion, SEMANTIC_INTENT_SCHEMA_VERSION);
  assert.ok(result.intentHypotheses.length >= 2);
  assert.ok(result.intentHypotheses.length <= 5);
}

const validEn = await runScenario("valid_en", "en");
assertAccepted(validEn.result);
assert.equal(validEn.result.locale, "en");
assert.equal(validEn.result.intentHypotheses.every((item) => item.selected === false), true);
assert.deepEqual(validEn.result.extractedFacts.map((item) => item.id), ["original_idea_present"]);
assert.deepEqual(validEn.result.inferredNeedsConfirmation.map((item) => item.id), ["intent_needs_confirmation"]);

const validAr = await runScenario("valid_ar", "ar");
assertAccepted(validAr.result);
assert.equal(validAr.result.locale, "ar");
assert.ok(validAr.result.intentHypotheses.every((item) => /[\u0600-\u06ff]/u.test(item.label)));

const lowConfidence = await runScenario("low_confidence_ambiguity", "en");
assertAccepted(lowConfidence.result);
assert.equal(lowConfidence.result.intentHypotheses.every((item) => item.requiresConfirmation === true), true);
assert.equal(lowConfidence.result.intentHypotheses.every((item) => item.selected === false), true);

assertFallback((await runScenario("invalid_schema_version", "en")).result, "unsupported_output_schema_version");
assertFallback((await runScenario("too_many_hypotheses", "en")).result, "invalid_hypothesis_count");
assertFallback((await runScenario("duplicate_ids", "en")).result, "duplicate_hypothesis_id");
assertFallback((await runScenario("unsupported_taxonomy_id", "en")).result, "unsupported_taxonomy_id");
assertFallback((await runScenario("internal_id_label", "en")).result, "internal_label_exposed");
assertFallback((await runScenario("forbidden_authority_fields", "en")).result, "unknown_output_field");
assertFallback((await runScenario("unsupported_claim", "en")).result, "unsupported_claim");
assertFallback((await runScenario("ungrounded_fact", "en")).result, "ungrounded_extracted_fact");
assertFallback((await runScenario("safety_signal_decision", "en")).result, "safety_signal_authority");
assertFallback((await runScenario("low_confidence_without_confirmation", "en")).result, "low_confidence_must_require_confirmation");

const safetySignalOnly = await runScenario("safety_signal_only", "en");
assertAccepted(safetySignalOnly.result);
assert.equal(safetySignalOnly.result.safetySignals.length, 1);
assert.equal("decision" in safetySignalOnly.result.safetySignals[0], false);

const providerError = await runScenario("error", "en");
assertFallback(providerError.result, "provider_failure");

const providerTimeout = await runScenario("timeout", "en", { timeoutMs: 5 });
assertFallback(providerTimeout.result, "provider_failure");

const invalidRequest = {
  ...makeRequest("en"),
  schemaVersion: "wrong",
};
assert.equal(validateSemanticIntentRequest(invalidRequest).ok, false);

const requestWithForbiddenAuthority = makeRequest("en", {
  policySafeContext: {
    route: "normal_evaluation",
  },
});
const forbiddenAuthorityValidation = validateSemanticIntentRequest(requestWithForbiddenAuthority);
assert.equal(forbiddenAuthorityValidation.ok, false);
assert.ok(forbiddenAuthorityValidation.reasonCodes.includes("forbidden_request_field"));

const requestWithPrivateField = {
  ...makeRequest("en"),
  email: "founder@example.com",
};
const privateFieldValidation = validateSemanticIntentRequest(requestWithPrivateField);
assert.equal(privateFieldValidation.ok, false);
assert.ok(privateFieldValidation.reasonCodes.includes("unknown_request_field"));
assert.ok(privateFieldValidation.reasonCodes.includes("forbidden_request_field"));

const unknownOutput = filterSemanticIntentOutput({
  request: makeRequest("en"),
  output: {
    schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
    locale: "en",
    conciseReflection: "I need confirmation.",
    intentHypotheses: [],
    ambiguities: [],
    recommendedNextQuestion: null,
    extractedFacts: [],
    inferredNeedsConfirmation: [],
    unresolvedItems: [],
    safetySignals: [],
    reasonCodes: [],
    selectedRoute: "normal_evaluation",
  },
});
assertFallback(unknownOutput, "unknown_output_field");

const sourceFiles = [
  "semanticIntentContract.js",
  "semanticIntentValidator.js",
  "semanticIntentProvider.js",
  "semanticIntentMockProvider.js",
  "semanticIntentFilter.js",
];
for (const file of sourceFiles) {
  const source = readFileSync(join(__dirname, file), "utf8");
  assert.equal(/fetch\s*\(/.test(source), false, `${file} must not call fetch`);
  assert.equal(/XMLHttpRequest/.test(source), false, `${file} must not use XMLHttpRequest`);
  assert.equal(/process\.env|import\.meta\.env/.test(source), false, `${file} must not read environment secrets`);
  assert.equal(/openai|sk-[a-z0-9]|secret\s*[:=]/i.test(source), false, `${file} must not contain provider secrets or OpenAI wiring`);
}

console.log("Semantic intent contract tests: PASS");
