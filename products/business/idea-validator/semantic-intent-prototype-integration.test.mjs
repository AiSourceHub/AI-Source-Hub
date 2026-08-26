import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildDiscoveryState,
  buildUnderstandingSummary,
  discoveryContent,
  getNextStep,
  validateDiscoveryStep,
} from "./intentDiscoveryPrototype.js";
import { createSemanticIntentRequest } from "./semanticIntentContract.js";
import { createMockSemanticIntentProvider } from "./semanticIntentMockProvider.js";
import { buildSemanticIntentPresentation } from "./semanticIntentPresentation.js";
import { interpretWithSemanticProvider } from "./semanticIntentProvider.js";

const prototypePageSource = readFileSync(new URL("../../../src/pages/BusinessIdeaDiscoveryPrototypePage.jsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../../../src/App.jsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../../../src/pages/HomePage.jsx", import.meta.url), "utf8");
const productionBivSource = readFileSync(new URL("../../../src/pages/BusinessIdeaValidatorPage.jsx", import.meta.url), "utf8");

function makeRequest(locale = "en", originalIdea = "A service idea for car cleaning and care") {
  return createSemanticIntentRequest({
    locale,
    originalIdea,
    confirmedAnswers: {},
    currentDiscoveryState: buildDiscoveryState({ originalIdea }),
    policySafeContext: {
      prototypeOnly: true,
    },
  });
}

async function buildPresentation({ scenario, locale = "en", originalIdea }) {
  const request = makeRequest(locale, originalIdea);
  const result = await interpretWithSemanticProvider(
    createMockSemanticIntentProvider({ scenario }),
    request
  );
  return {
    request,
    result,
    presentation: buildSemanticIntentPresentation({
      filteredResult: result,
      request,
      locale,
    }),
  };
}

function visiblePresentationText(presentation) {
  return [
    presentation.heading,
    presentation.body,
    presentation.reflection,
    presentation.question,
    ...presentation.choices.flatMap((choice) => [choice.label, choice.rationale]),
  ].filter(Boolean).join(" ");
}

function assertNoForbiddenVisibleContent(presentation) {
  const text = visiblePresentationText(presentation);
  for (const forbidden of ["route", "journeyState", "selectedRoute", "score", "payment", "price", "report", "capital"]) {
    assert.equal(text.includes(forbidden), false, `Visible presentation leaked ${forbidden}`);
  }
  for (const internal of ["marketplace_platform", "digital_software", "manufacturing_industrial", "primaryType", "operatingModel"]) {
    assert.equal(text.includes(internal), false, `Visible presentation leaked internal id ${internal}`);
  }
}

const validAr = await buildPresentation({
  scenario: "valid_ar",
  locale: "ar",
  originalIdea: "مشروع يقدم تنظيف وعناية بالسيارات وقد يكون في موقع ثابت أو يصل إلى العميل.",
});
assert.equal(validAr.result.status, "accepted");
assert.equal(validAr.presentation.mode, "valid");
assert.equal(validAr.presentation.heading, discoveryContent.ar.semanticIntent.validHeading);
assert.equal(validAr.presentation.choices.length, 5);
assert.equal(validAr.presentation.choices.some((choice) => choice.id === "different"), true);
assert.equal(validAr.presentation.choices.some((choice) => choice.id === "not_decided"), true);
assert.equal(validAr.presentation.choices.some((choice) => /[\u0600-\u06ff]/u.test(choice.label)), true);
assert.equal(validAr.presentation.choices.every((choice) => choice.id && choice.label), true);
assertNoForbiddenVisibleContent(validAr.presentation);

const lowConfidence = await buildPresentation({
  scenario: "low_confidence_ambiguity",
  locale: "en",
  originalIdea: "A business idea that could be service, platform, or product sales.",
});
assert.equal(lowConfidence.result.status, "accepted");
assert.equal(lowConfidence.presentation.mode, "low_confidence");
assert.equal(lowConfidence.presentation.reflection, "");
assert.equal(lowConfidence.presentation.body, discoveryContent.en.semanticIntent.lowConfidenceBody);
assert.equal(lowConfidence.presentation.choices.every((choice) => choice.id), true);
assert.equal(lowConfidence.presentation.choices.some((choice) => choice.id === "different"), true);
assert.equal(lowConfidence.presentation.choices.some((choice) => choice.id === "not_decided"), true);
assertNoForbiddenVisibleContent(lowConfidence.presentation);

const forbidden = await buildPresentation({
  scenario: "forbidden_authority_fields",
  locale: "en",
  originalIdea: "A normal service idea.",
});
assert.equal(forbidden.result.status, "fallback");
assert.equal(forbidden.presentation.mode, "fallback");
assert.equal(forbidden.presentation.body, discoveryContent.en.semanticIntent.fallbackBody);
assert.equal(forbidden.presentation.choices.length >= 7, true);
assert.equal(forbidden.presentation.choices.some((choice) => choice.id === "different"), true);
assert.equal(forbidden.presentation.choices.some((choice) => choice.id === "not_decided"), true);
assertNoForbiddenVisibleContent(forbidden.presentation);

const selectedByUser = buildDiscoveryState({
  originalIdea: validAr.request.originalIdea,
  selectedIntent: "marketplace",
});
assert.equal(selectedByUser.selectedIntent, "marketplace");
const providerCannotOverwriteSelection = buildDiscoveryState({
  ...selectedByUser,
  coreOffering: "Event organizers and members",
  selectedOperatingApproach: "online",
});
assert.equal(providerCannotOverwriteSelection.selectedIntent, "marketplace");

const coreOfferingState = buildDiscoveryState({
  originalIdea: "A service idea.",
  selectedIntent: "service",
  coreOffering: "Car cleaning and care",
});
assert.equal(validateDiscoveryStep(coreOfferingState, "coreOffering", "en").ok, true);
assert.equal(getNextStep(coreOfferingState, "coreOffering"), "operating");

const operatingState = buildDiscoveryState({
  ...coreOfferingState,
  selectedOperatingApproach: "mixed",
  selectedOperatingApproaches: ["fixed_location", "customer_site"],
});
assert.equal(validateDiscoveryStep(operatingState, "mixedOperating", "en").ok, true);
const summary = buildUnderstandingSummary(operatingState, "en");
assert.equal(summary.originalIdea, "A service idea.");
assert.equal(summary.coreOfferingLabel, "Car cleaning and care");
assert.equal(summary.unresolvedItems.length, 0);

assert.equal(discoveryContent.ar.semanticIntent.loading, "نراجع وصفك لنحدد أقرب الطرق لفهم الفكرة...");
assert.equal(discoveryContent.en.semanticIntent.loading, "We are reviewing your description to find the closest ways to understand the idea...");
assert.equal(discoveryContent.ar.semanticIntent.fallbackBody.includes("خطوة بخطوة"), true);
assert.equal(discoveryContent.en.semanticIntent.fallbackBody.includes("step by step"), true);

assert.equal(prototypePageSource.includes("interpretWithSemanticProvider"), true);
assert.equal(prototypePageSource.includes("createMockSemanticIntentProvider"), true);
assert.equal(prototypePageSource.includes("void observeSemanticShadow"), true);
assert.equal(prototypePageSource.includes("setSemanticPresentation(buildSemanticIntentPresentation"), true);
assert.equal(prototypePageSource.includes("workerEnvelope.result"), false);
assert.equal(prototypePageSource.includes("buildScenarioOutput"), false);
assert.equal(prototypePageSource.includes("semanticPresentation?.diagnostics"), false);
assert.equal(prototypePageSource.includes("fallbackReasonCodes"), false);
assert.equal(prototypePageSource.includes("semanticScenario === 'deterministic'"), true);
assert.equal(prototypePageSource.includes("score"), false);
assert.equal(prototypePageSource.includes("reportText"), false);
assert.equal(prototypePageSource.includes("copyReport"), false);
assert.equal(prototypePageSource.includes("downloadReport"), false);
assert.equal(productionBivSource.includes("semanticIntent"), false);
assert.equal(productionBivSource.includes("createMockSemanticIntentProvider"), false);
assert.equal(homeSource.includes("/dev/biv-guided-discovery"), false);
assert.equal(appSource.includes("/dev/biv-guided-discovery"), false);
assert.equal(appSource.includes("INTENT_DISCOVERY_ROUTE"), true);

for (const file of [
  "semanticIntentContract.js",
  "semanticIntentValidator.js",
  "semanticIntentProvider.js",
  "semanticIntentMockProvider.js",
  "semanticIntentFilter.js",
  "semanticIntentPresentation.js",
]) {
  const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
  assert.equal(/fetch\s*\(/.test(source), false, `${file} must not call fetch`);
  assert.equal(/XMLHttpRequest/.test(source), false, `${file} must not use XMLHttpRequest`);
  assert.equal(/process\.env|import\.meta\.env/.test(source), false, `${file} must not read environment secrets`);
}

console.log("Semantic intent prototype integration tests: PASS");
