import assert from "node:assert/strict";
import { createSemanticIntentRequest } from "./semanticIntentContract.js";
import {
  SEMANTIC_MOCK_SCENARIOS,
  buildScenarioOutput,
  createMockSemanticIntentProvider,
  normalizeTrustedSemanticMockScenario,
} from "./semanticIntentMockProvider.js";
import { interpretWithSemanticProvider } from "./semanticIntentProvider.js";

function makeRequest(locale = "en") {
  return createSemanticIntentRequest({
    locale,
    originalIdea: locale === "ar" ? "فكرة خدمة محلية بسيطة." : "A simple local service idea.",
    confirmedAnswers: {},
    currentDiscoveryState: {},
    policySafeContext: { prototypeOnly: true },
  });
}

async function runScenario(locale, scenario) {
  return interpretWithSemanticProvider(
    createMockSemanticIntentProvider({ scenario }),
    makeRequest(locale)
  );
}

const validAr = await runScenario("ar", SEMANTIC_MOCK_SCENARIOS.VALID);
const validEn = await runScenario("en", SEMANTIC_MOCK_SCENARIOS.VALID);
assert.equal(validAr.status, "accepted");
assert.equal(validEn.status, "accepted");
assert.deepEqual(validAr.intentHypotheses.map((item) => item.id), validEn.intentHypotheses.map((item) => item.id));
assert.deepEqual(validAr.intentHypotheses.map((item) => item.intentId), validEn.intentHypotheses.map((item) => item.intentId));
assert.deepEqual(validAr.intentHypotheses.map((item) => item.id), [
  "semantic_hypothesis_1",
  "semantic_hypothesis_2",
  "semantic_hypothesis_3",
]);
assert.deepEqual(validAr.intentHypotheses.map((item) => item.intentId), ["service", "marketplace", "retail"]);
assert.notEqual(validAr.intentHypotheses[0].label, validEn.intentHypotheses[0].label);

const validArAlias = await runScenario("ar", "valid_ar");
const validEnAlias = await runScenario("en", "valid_en");
assert.deepEqual(validArAlias.intentHypotheses.map((item) => item.id), validAr.intentHypotheses.map((item) => item.id));
assert.deepEqual(validEnAlias.intentHypotheses.map((item) => item.id), validEn.intentHypotheses.map((item) => item.id));

const lowConfidence = await runScenario("en", SEMANTIC_MOCK_SCENARIOS.LOW_CONFIDENCE);
assert.equal(lowConfidence.status, "accepted");
assert.equal(lowConfidence.intentHypotheses.every((item) => item.confidence === "low"), true);
assert.equal(lowConfidence.intentHypotheses.every((item) => item.requiresConfirmation === true), true);

const forbidden = await runScenario("en", SEMANTIC_MOCK_SCENARIOS.FORBIDDEN_AUTHORITY_FIELDS);
assert.equal(forbidden.status, "fallback");
assert.ok(forbidden.reasonCodes.includes("structured_output_schema_invalid"));
assert.deepEqual(forbidden.intentHypotheses, []);

assert.equal(normalizeTrustedSemanticMockScenario("valid"), "valid");
assert.equal(normalizeTrustedSemanticMockScenario("valid_ar"), "valid");
assert.equal(normalizeTrustedSemanticMockScenario("low_confidence_ambiguity"), "low_confidence");
assert.equal(normalizeTrustedSemanticMockScenario("forbidden_authority_fields"), "forbidden_authority_fields");
assert.equal(normalizeTrustedSemanticMockScenario("invalid_schema_version"), "valid");
assert.equal(normalizeTrustedSemanticMockScenario("user_controlled_unknown"), "valid");

const internalNegativeFixture = buildScenarioOutput(makeRequest("en"), "invalid_schema_version");
assert.equal(internalNegativeFixture.schemaVersion, "invalid_version");

console.log("Semantic mock provider tests: PASS");
