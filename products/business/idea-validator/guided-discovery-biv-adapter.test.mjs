import assert from "node:assert/strict";
import {
  buildDiscoveryState,
  confirmDiscoveryUnderstanding,
} from "./intentDiscoveryPrototype.js";
import { buildGuidedDiscoveryBivHandoff } from "./guidedDiscoveryHandoffMapper.js";
import { evaluateGuidedDiscoverySufficiency } from "./guidedDiscoverySufficiencyBridge.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";
import {
  adaptGuidedDiscoveryHandoffToBiv,
  buildCanonicalBivInput,
  GUIDED_DISCOVERY_CANONICAL_BIV_VERSION,
  projectCanonicalInputToCurrentEngine,
} from "./guidedDiscoveryBivAdapter.js";

function buildReadyFixture(overrides = {}, downstreamInput = {}) {
  const discovery = confirmDiscoveryUnderstanding(buildDiscoveryState({
    originalIdea: "A service business that repairs air-conditioning units at customer locations and from a fixed workshop.",
    selectedIntent: "service",
    coreOffering: "Air-conditioning repair and maintenance",
    selectedOperatingApproach: "mixed",
    selectedOperatingApproaches: ["customer_site", "fixed_location"],
    ...overrides,
  }));
  const handoff = buildGuidedDiscoveryBivHandoff(discovery, {
    locale: overrides.locale || "en",
    downstreamInput: {
      targetCustomer: "Homeowners, tenants, and small businesses that need air-conditioning repair at their location.",
      problem: "Customers need fast repair when air-conditioning fails and they do not know which technician to trust.",
      monetization: "Customers pay per repair visit, with optional maintenance packages.",
      ...downstreamInput,
    },
  });
  return {
    discovery,
    handoff,
    sufficiency: evaluateGuidedDiscoverySufficiency(handoff, { locale: overrides.locale || "en" }),
  };
}

const { discovery, handoff, sufficiency } = buildReadyFixture();
const adapted = adaptGuidedDiscoveryHandoffToBiv(handoff, sufficiency);

assert.equal(adapted.ok, true);
assert.equal(adapted.reasonCode, "guided_discovery_biv_adapter_ready");
assert.equal(adapted.canonicalInput.version, GUIDED_DISCOVERY_CANONICAL_BIV_VERSION);
assert.equal(adapted.canonicalInput.source, "guided_discovery");
assert.equal(adapted.canonicalInput.locale, "en");
assert.equal(adapted.canonicalInput.language, "en");

assert.deepEqual(adapted.canonicalInput.rawInput, {
  businessIdea: discovery.originalIdea,
  targetCustomer: "Homeowners, tenants, and small businesses that need air-conditioning repair at their location.",
  problem: "Customers need fast repair when air-conditioning fails and they do not know which technician to trust.",
  monetization: "Customers pay per repair visit, with optional maintenance packages.",
  stage: "idea",
  currentSolution: "",
  competitiveAdvantage: "",
});
assert.equal(adapted.canonicalInput.originalIdea, discovery.originalIdea);
assert.deepEqual(adapted.canonicalInput.confirmedUnderstanding, {
  selectedIntent: "service",
  coreOffering: "Air-conditioning repair and maintenance",
  coreOfferingStatus: "provided",
  selectedOperatingApproach: "mixed",
  selectedOperatingApproaches: ["customer_site", "fixed_location"],
});
assert.deepEqual(adapted.canonicalInput.downstreamClarifications, {
  additionalIdeaContext: "",
  targetCustomer: "Homeowners, tenants, and small businesses that need air-conditioning repair at their location.",
  problem: "Customers need fast repair when air-conditioning fails and they do not know which technician to trust.",
  monetization: "Customers pay per repair visit, with optional maintenance packages.",
});

assert.equal(adapted.canonicalInput.authority.bivOwnsEligibility, true);
assert.equal(adapted.canonicalInput.authority.bivOwnsClassification, true);
assert.equal(adapted.canonicalInput.authority.semanticProviderAuthoritative, false);
assert.equal(adapted.canonicalInput.authority.guidedDiscoveryIntentIsFinalClassification, false);
assert.equal(adapted.canonicalInput.sourceMetadata.semanticProviderCanonical, false);
assert.equal(adapted.canonicalInput.sourceMetadata.confirmedUnderstandingCanonical, true);

assert.equal(Object.hasOwn(adapted.canonicalInput.rawInput, "classificationConfirmation"), false);
assert.equal(Object.hasOwn(adapted.canonicalInput.rawInput, "projectTypeCorrection"), false);
assert.equal(Object.hasOwn(adapted.canonicalInput.rawInput, "operatingModelCorrection"), false);
assert.equal(Object.hasOwn(adapted.canonicalInput.confirmedUnderstanding, "finalClassification"), false);

assert.deepEqual(adapted.currentEngineInput, {
  rawInput: adapted.canonicalInput.rawInput,
  language: "en",
  industrialDetails: {},
  feasibilityAnswers: {},
});
assert.equal(Object.hasOwn(adapted.currentEngineInput.feasibilityAnswers, "classificationConfirmation"), false);
assert.equal(Object.hasOwn(adapted.currentEngineInput.feasibilityAnswers, "userExperienceLevel"), false);
assert.equal(Object.hasOwn(adapted.currentEngineInput.feasibilityAnswers, "firstProject"), false);
assert.equal(Object.hasOwn(adapted.currentEngineInput.feasibilityAnswers, "projectStageIntent"), false);
assert.equal(Object.hasOwn(adapted.currentEngineInput.feasibilityAnswers, "country"), false);
assert.equal(Object.hasOwn(adapted.currentEngineInput.feasibilityAnswers, "decisionObjective"), false);

assert.equal(adapted.compatibility.schemaReady, true);
assert.equal(adapted.compatibility.currentEngineExecutionReady, false);
assert.deepEqual(adapted.compatibility.blockingLegacyDependencies, [
  "userExperienceLevel",
  "firstProject",
  "projectStageIntent",
  "country",
  "decisionObjective",
  "classificationConfirmation",
]);

const currentEngineProbe = executeBusinessIdeaValidation(adapted.currentEngineInput);
assert.equal(currentEngineProbe.validation.ok, true);
assert.equal(currentEngineProbe.route, "guided_follow_up");
assert.equal(currentEngineProbe.journeyState, "profile_input");
assert.deepEqual(currentEngineProbe.orchestrationDecision.missingInformation, [
  "userExperienceLevel",
  "firstProject",
  "projectStageIntent",
  "country",
  "decisionObjective",
  "classificationConfirmation",
]);
assert.deepEqual(currentEngineProbe.orchestrationDecision.blockedActions, [
  "score",
  "report",
  "copy_report",
  "download_report",
]);

const arabicReady = buildReadyFixture({
  locale: "ar",
  originalIdea: "مشروع خدمة صيانة مكيفات يصل إلى موقع العميل وله ورشة ثابتة عند الحاجة.",
  coreOffering: "صيانة المكيفات",
});
const arabicAdapted = adaptGuidedDiscoveryHandoffToBiv(arabicReady.handoff, arabicReady.sufficiency);
assert.equal(arabicAdapted.ok, true);
assert.equal(arabicAdapted.canonicalInput.locale, "ar");
assert.equal(arabicAdapted.currentEngineInput.language, "ar");
assert.equal(arabicAdapted.canonicalInput.rawInput.businessIdea, "مشروع خدمة صيانة مكيفات يصل إلى موقع العميل وله ورشة ثابتة عند الحاجة.");

const canonicalDirect = buildCanonicalBivInput(handoff);
const projectedDirect = projectCanonicalInputToCurrentEngine(canonicalDirect);
assert.deepEqual(projectedDirect.industrialDetails, {});
assert.deepEqual(projectedDirect.rawInput, canonicalDirect.rawInput);

const notReady = adaptGuidedDiscoveryHandoffToBiv({
  ...handoff,
  evaluationReady: false,
  missingRequiredInformation: [{ id: "targetCustomer" }],
}, sufficiency);
assert.equal(notReady.ok, false);
assert.equal(notReady.reasonCode, "handoff_evaluation_not_ready");
assert.equal(notReady.canonicalInput, null);

const unconfirmed = adaptGuidedDiscoveryHandoffToBiv({
  ...handoff,
  confirmationStatus: "review",
}, sufficiency);
assert.equal(unconfirmed.ok, false);
assert.equal(unconfirmed.reasonCode, "understanding_not_confirmed");

const sufficiencyNotReady = adaptGuidedDiscoveryHandoffToBiv(handoff, {
  ...sufficiency,
  status: "needs_clarification",
});
assert.equal(sufficiencyNotReady.ok, false);
assert.equal(sufficiencyNotReady.reasonCode, "sufficiency_not_ready");

const profileOptional = buildReadyFixture({}, {
  country: "Saudi Arabia",
  city: "Jeddah",
  userExperienceLevel: "first_time_beginner",
  firstProject: "yes",
  decisionObjective: "Decide whether to continue.",
});
const optionalAdapted = adaptGuidedDiscoveryHandoffToBiv(profileOptional.handoff, profileOptional.sufficiency);
assert.equal(optionalAdapted.compatibility.blockingLegacyDependencies.includes("country"), true);
assert.deepEqual(optionalAdapted.currentEngineInput.industrialDetails, {});
assert.equal(optionalAdapted.canonicalInput.confirmedUnderstanding.selectedIntent, "service");
assert.equal(optionalAdapted.canonicalInput.authority.guidedDiscoveryIntentIsFinalClassification, false);

console.log("Guided Discovery BIV adapter tests: PASS");
