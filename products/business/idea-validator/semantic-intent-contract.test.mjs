import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEMANTIC_INTENT_SCHEMA_VERSION,
  SEMANTIC_BUSINESS_CLARIFICATION_FIELD_IDS,
  SEMANTIC_CLARIFICATION_QUESTIONS,
  createOpenAIResponsesTextFormat,
  createAllowedTaxonomyOptions,
  buildSemanticClarificationQuestions,
  createSemanticIntentRequest,
  SEMANTIC_OUTPUT_SCHEMA_NAME,
  SEMANTIC_REQUIRED_REQUEST_FIELDS,
  sanitizeDiscoveryStateForSemanticRequest,
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
assert.deepEqual(validEn.result.inferredNeedsConfirmation.map((item) => item.id), ["intent_and_delivery_need_confirmation"]);

const sanitizedState = sanitizeDiscoveryStateForSemanticRequest({
  originalIdea: "A service idea",
  selectedIntent: "service",
  suggestedIntentOptions: [{ id: "service", score: 10 }],
  route: "normal_evaluation",
  journeyState: "normal_evaluation",
});
assert.equal("suggestedIntentOptions" in sanitizedState, false);
assert.equal(JSON.stringify(sanitizedState).includes("score"), false);
assert.equal("route" in sanitizedState, false);
assert.equal("journeyState" in sanitizedState, false);

const validAr = await runScenario("valid_ar", "ar");
assertAccepted(validAr.result);
assert.equal(validAr.result.locale, "ar");
assert.ok(validAr.result.intentHypotheses.every((item) => /[\u0600-\u06ff]/u.test(item.label)));

const lowConfidence = await runScenario("low_confidence_ambiguity", "en");
assertAccepted(lowConfidence.result);
assert.equal(lowConfidence.result.intentHypotheses.every((item) => item.requiresConfirmation === true), true);
assert.equal(lowConfidence.result.intentHypotheses.every((item) => item.selected === false), true);

const openAITextFormat = createOpenAIResponsesTextFormat();
assert.equal(openAITextFormat.type, "json_schema");
assert.equal(openAITextFormat.name, SEMANTIC_OUTPUT_SCHEMA_NAME);
assert.equal(openAITextFormat.strict, true);
assert.equal(openAITextFormat.schema.additionalProperties, false);
assert.deepEqual(openAITextFormat.schema.required, [
  "schemaVersion",
  "locale",
  "conciseReflection",
  "intentHypotheses",
  "ambiguities",
  "recommendedNextQuestion",
  "extractedFacts",
  "inferredNeedsConfirmation",
  "unresolvedItems",
  "safetySignals",
  "reasonCodes",
]);

assertFallback((await runScenario("invalid_schema_version", "en")).result, "structured_output_schema_invalid");
assertFallback((await runScenario("too_many_hypotheses", "en")).result, "structured_output_schema_invalid");
assertFallback((await runScenario("duplicate_ids", "en")).result, "duplicate_hypothesis_id");
assertFallback((await runScenario("unsupported_taxonomy_id", "en")).result, "unsupported_taxonomy_id");
assertFallback((await runScenario("internal_id_label", "en")).result, "internal_label_exposed");
assertFallback((await runScenario("forbidden_authority_fields", "en")).result, "structured_output_schema_invalid");
assertFallback((await runScenario("unsupported_claim", "en")).result, "unsupported_claim");
assertFallback((await runScenario("ungrounded_fact", "en")).result, "ungrounded_extracted_fact");
assertFallback((await runScenario("safety_signal_decision", "en")).result, "structured_output_schema_invalid");
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

const missingFieldsRequest = {
  locale: "ar",
  originalIdea: "فكرة أولية تحتاج إلى فهم.",
};
const missingFieldsValidation = validateSemanticIntentRequest(missingFieldsRequest);
assert.equal(missingFieldsValidation.ok, false);
assert.ok(missingFieldsValidation.reasonCodes.includes("missing_required_fields"));
assert.deepEqual(missingFieldsValidation.missingRequiredFields, [
  "schemaVersion",
  "confirmedAnswers",
  "currentDiscoveryState",
  "allowedTaxonomyOptions",
  "policySafeContext",
]);

assert.deepEqual(SEMANTIC_BUSINESS_CLARIFICATION_FIELD_IDS, [
  "selectedIntent",
  "coreOffering",
  "selectedOperatingApproach",
  "selectedOperatingApproaches",
]);
for (const technicalFieldId of SEMANTIC_REQUIRED_REQUEST_FIELDS) {
  assert.equal(
    SEMANTIC_BUSINESS_CLARIFICATION_FIELD_IDS.includes(technicalFieldId),
    false,
    `${technicalFieldId} must remain a technical validation field, not a business clarification question`
  );
}

assert.equal(typeof SEMANTIC_CLARIFICATION_QUESTIONS.selectedIntent.ar, "string");
assert.equal(typeof SEMANTIC_CLARIFICATION_QUESTIONS.selectedIntent.en, "string");
assert.equal(typeof SEMANTIC_CLARIFICATION_QUESTIONS.coreOffering.service.ar, "string");
assert.equal(typeof SEMANTIC_CLARIFICATION_QUESTIONS.coreOffering.service.en, "string");
assert.equal(typeof SEMANTIC_CLARIFICATION_QUESTIONS.selectedOperatingApproach.ar, "string");
assert.equal(typeof SEMANTIC_CLARIFICATION_QUESTIONS.selectedOperatingApproaches.en, "string");

const unconfirmedIntentAr = buildSemanticClarificationQuestions({
  currentDiscoveryState: {},
  confirmedAnswers: {},
  locale: "ar",
});
const unconfirmedIntentEn = buildSemanticClarificationQuestions({
  currentDiscoveryState: {},
  confirmedAnswers: {},
  locale: "en",
});
assert.deepEqual(unconfirmedIntentAr.map((item) => item.id), ["selectedIntent"]);
assert.deepEqual(unconfirmedIntentEn.map((item) => item.id), ["selectedIntent"]);
assert.equal(unconfirmedIntentAr[0].question, "أي وصف أقرب إلى طريقة عمل مشروعك؟");
assert.equal(unconfirmedIntentEn[0].question, "Which description is closest to how your business would work?");
assert.equal(/[\u0600-\u06ff]/u.test(unconfirmedIntentAr[0].question), true);
assert.equal(/[\u0600-\u06ff]/u.test(unconfirmedIntentEn[0].question), false);
assert.equal(unconfirmedIntentAr[0].question.includes("selectedIntent"), false);

const coreOfferingBeforeIntent = buildSemanticClarificationQuestions({
  currentDiscoveryState: { coreOffering: "", coreOfferingStatus: "missing" },
  locale: "en",
});
assert.deepEqual(coreOfferingBeforeIntent.map((item) => item.id), ["selectedIntent"]);

const coreOfferingServiceAr = buildSemanticClarificationQuestions({
  currentDiscoveryState: { selectedIntent: "service" },
  locale: "ar",
});
const coreOfferingServiceEn = buildSemanticClarificationQuestions({
  currentDiscoveryState: { selectedIntent: "service" },
  locale: "en",
});
assert.deepEqual(coreOfferingServiceAr.map((item) => item.id), ["coreOffering"]);
assert.deepEqual(coreOfferingServiceEn.map((item) => item.id), ["coreOffering"]);
assert.equal(coreOfferingServiceAr[0].question, "ما الخدمة الأساسية التي سيحصل عليها العميل؟");
assert.equal(coreOfferingServiceEn[0].question, "What main service will the customer receive?");

const operatingBeforeCoreOffering = buildSemanticClarificationQuestions({
  currentDiscoveryState: { selectedIntent: "service", selectedOperatingApproach: "" },
  locale: "en",
});
assert.deepEqual(operatingBeforeCoreOffering.map((item) => item.id), ["coreOffering"]);

const operatingQuestionAr = buildSemanticClarificationQuestions({
  currentDiscoveryState: {
    selectedIntent: "service",
    coreOffering: "تنظيف السيارات",
    coreOfferingStatus: "provided",
  },
  locale: "ar",
});
assert.deepEqual(operatingQuestionAr.map((item) => item.id), ["selectedOperatingApproach"]);
assert.equal(operatingQuestionAr[0].question, "كيف سيحصل العميل على ما يقدمه المشروع؟");

const mixedQuestionEn = buildSemanticClarificationQuestions({
  currentDiscoveryState: {
    selectedIntent: "service",
    coreOffering: "Car care",
    coreOfferingStatus: "provided",
    selectedOperatingApproach: "mixed",
    selectedOperatingApproaches: ["fixed_location"],
  },
  locale: "en",
});
assert.deepEqual(mixedQuestionEn.map((item) => item.id), ["selectedOperatingApproaches"]);
assert.equal(mixedQuestionEn[0].question, "Which delivery approaches do you mean?");

const completeClarification = buildSemanticClarificationQuestions({
  currentDiscoveryState: {
    selectedIntent: "service",
    coreOffering: "Car care",
    coreOfferingStatus: "provided",
    selectedOperatingApproach: "mixed",
    selectedOperatingApproaches: ["fixed_location", "customer_site"],
  },
  locale: "en",
});
assert.deepEqual(completeClarification, []);

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
assertFallback(unknownOutput, "structured_output_schema_invalid");

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
  assert.equal(/sk-[a-z0-9]|secret\s*[:=]/i.test(source), false, `${file} must not contain provider secrets`);
}

console.log("Semantic intent contract tests: PASS");
