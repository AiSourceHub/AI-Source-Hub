import assert from "node:assert/strict";
import {
  applyDiscoveryFieldChange,
  buildDiscoveryState,
  confirmDiscoveryUnderstanding,
  discoveryJourneyStates,
} from "./intentDiscoveryPrototype.js";
import {
  buildGuidedDiscoveryBivHandoff,
  GUIDED_DISCOVERY_HANDOFF_VERSION,
} from "./guidedDiscoveryHandoffMapper.js";

function confirmedDiscovery(overrides = {}) {
  return confirmDiscoveryUnderstanding(buildDiscoveryState({
    originalIdea: "A service business that repairs air-conditioning units for homes and small offices.",
    selectedIntent: "service",
    coreOffering: "Air-conditioning repair",
    selectedOperatingApproach: "customer_site",
    ...overrides,
  }));
}

const completeDownstreamInput = {
  targetCustomer: "Homeowners and small offices",
  problem: "Air-conditioning failures interrupt comfort and operations.",
  monetization: "Customers pay per repair visit.",
};

const confirmedService = confirmedDiscovery();
const serviceHandoff = buildGuidedDiscoveryBivHandoff(confirmedService, {
  locale: "en",
  downstreamInput: completeDownstreamInput,
});

assert.equal(serviceHandoff.ok, true);
assert.equal(serviceHandoff.source, "guided_discovery");
assert.equal(serviceHandoff.version, GUIDED_DISCOVERY_HANDOFF_VERSION);
assert.equal(serviceHandoff.handoffReady, true);
assert.equal(serviceHandoff.evaluationReady, true);
assert.equal(serviceHandoff.confirmationStatus, "confirmed");
assert.equal(serviceHandoff.originalIdea, confirmedService.originalIdea);
assert.deepEqual(serviceHandoff.confirmedUnderstanding, {
  selectedIntent: "service",
  coreOffering: "Air-conditioning repair",
  coreOfferingStatus: "provided",
  selectedOperatingApproach: "customer_site",
  selectedOperatingApproaches: [],
});
assert.equal(serviceHandoff.bivDraftInput.businessIdea, confirmedService.originalIdea);
assert.equal(serviceHandoff.bivDraftInput.targetCustomer, completeDownstreamInput.targetCustomer);
assert.equal(serviceHandoff.bivDraftInput.problem, completeDownstreamInput.problem);
assert.equal(serviceHandoff.bivDraftInput.monetization, completeDownstreamInput.monetization);
assert.deepEqual(serviceHandoff.downstreamClarifications, {
  additionalIdeaContext: "",
  targetCustomer: completeDownstreamInput.targetCustomer,
  problem: completeDownstreamInput.problem,
  monetization: completeDownstreamInput.monetization,
});
assert.deepEqual(serviceHandoff.missingRequiredInformation, []);

const mixedDiscovery = confirmedDiscovery({
  selectedOperatingApproach: "mixed",
  selectedOperatingApproaches: ["fixed_location", "customer_site"],
});
const mixedHandoff = buildGuidedDiscoveryBivHandoff(mixedDiscovery, {
  locale: "en",
  downstreamInput: completeDownstreamInput,
});
assert.equal(mixedHandoff.confirmedUnderstanding.selectedOperatingApproach, "mixed");
assert.deepEqual(mixedHandoff.confirmedUnderstanding.selectedOperatingApproaches, ["fixed_location", "customer_site"]);
assert.equal(mixedHandoff.bivDraftInput.businessIdea, mixedDiscovery.originalIdea);

const unconfirmedState = buildDiscoveryState({
  originalIdea: "A service business that repairs air-conditioning units.",
  selectedIntent: "service",
  coreOffering: "Air-conditioning repair",
  selectedOperatingApproach: "customer_site",
  journeyState: discoveryJourneyStates.understandingReview,
});
const unconfirmedHandoff = buildGuidedDiscoveryBivHandoff(unconfirmedState, {
  locale: "en",
  downstreamInput: completeDownstreamInput,
});
assert.equal(unconfirmedHandoff.ok, false);
assert.equal(unconfirmedHandoff.handoffReady, false);
assert.equal(unconfirmedHandoff.evaluationReady, false);
assert.equal(unconfirmedHandoff.reasonCode, "guided_discovery_not_confirmed");
assert.equal(unconfirmedHandoff.confirmedUnderstanding, null);

const unchangedRawIdea = "مشروع صيانة مكيفات يقدم الخدمة في موقع العميل.";
const arabicConfirmed = confirmedDiscovery({
  originalIdea: unchangedRawIdea,
  coreOffering: "فني إصلاح المكيفات و العميل",
});
const arabicHandoff = buildGuidedDiscoveryBivHandoff(arabicConfirmed, {
  locale: "ar",
  downstreamInput: completeDownstreamInput,
});
assert.equal(arabicHandoff.originalIdea, unchangedRawIdea);
assert.equal(arabicHandoff.bivDraftInput.businessIdea, unchangedRawIdea);
assert.equal(arabicHandoff.confirmedUnderstanding.coreOffering, "فني إصلاح المكيفات و العميل");
assert.equal(arabicHandoff.locale, "ar");

const providerSuggestedState = buildDiscoveryState({
  ...arabicConfirmed,
  selectedIntent: "marketplace",
  selectedOperatingApproach: "online",
  confirmedAnswers: arabicConfirmed.confirmedAnswers,
  confirmationStatus: "confirmed",
  semanticPresentation: {
    choices: [{ id: "marketplace" }],
  },
});
const providerSuggestionHandoff = buildGuidedDiscoveryBivHandoff(providerSuggestedState, {
  locale: "en",
  downstreamInput: completeDownstreamInput,
});
assert.equal(providerSuggestionHandoff.confirmedUnderstanding.selectedIntent, "service");
assert.equal(providerSuggestionHandoff.confirmedUnderstanding.selectedOperatingApproach, "customer_site");
assert.equal(providerSuggestionHandoff.semanticAssistance.providerOutputIsAuthoritative, false);
assert.equal(providerSuggestionHandoff.semanticAssistance.acceptedWithoutUserConfirmation, false);

const missingAllRequired = buildGuidedDiscoveryBivHandoff(confirmedService, { locale: "en" });
assert.equal(missingAllRequired.handoffReady, true);
assert.equal(missingAllRequired.evaluationReady, false);
assert.deepEqual(
  missingAllRequired.missingRequiredInformation.map((item) => item.id),
  ["targetCustomer", "problem", "monetization"]
);

const missingTargetCustomer = buildGuidedDiscoveryBivHandoff(confirmedService, {
  locale: "en",
  downstreamInput: {
    problem: completeDownstreamInput.problem,
    monetization: completeDownstreamInput.monetization,
  },
});
assert.deepEqual(missingTargetCustomer.missingRequiredInformation.map((item) => item.id), ["targetCustomer"]);

const missingProblem = buildGuidedDiscoveryBivHandoff(confirmedService, {
  locale: "en",
  downstreamInput: {
    targetCustomer: completeDownstreamInput.targetCustomer,
    monetization: completeDownstreamInput.monetization,
  },
});
assert.deepEqual(missingProblem.missingRequiredInformation.map((item) => item.id), ["problem"]);

const missingMonetization = buildGuidedDiscoveryBivHandoff(confirmedService, {
  locale: "en",
  downstreamInput: {
    targetCustomer: completeDownstreamInput.targetCustomer,
    problem: completeDownstreamInput.problem,
  },
});
assert.deepEqual(missingMonetization.missingRequiredInformation.map((item) => item.id), ["monetization"]);

const optionalProfileOnly = buildGuidedDiscoveryBivHandoff(confirmedService, {
  locale: "en",
  downstreamInput: {
    ...completeDownstreamInput,
    city: "",
    country: "",
    firstProject: "",
    userExperienceLevel: "",
    decisionObjective: "",
    currentSolution: "",
    competitiveAdvantage: "",
  },
});
assert.equal(optionalProfileOnly.evaluationReady, true);
assert.deepEqual(optionalProfileOnly.missingRequiredInformation, []);
assert.deepEqual(optionalProfileOnly.optionalContext, {});

const optionalProfileProvided = buildGuidedDiscoveryBivHandoff(confirmedService, {
  locale: "en",
  downstreamInput: {
    ...completeDownstreamInput,
    city: "Jeddah",
    country: "Saudi Arabia",
    firstProject: "yes",
    userExperienceLevel: "first_time_beginner",
    decisionObjective: "Decide whether to continue.",
    projectStageIntent: "initial_idea",
  },
});
assert.equal(optionalProfileProvided.evaluationReady, true);
assert.deepEqual(optionalProfileProvided.missingRequiredInformation, []);
assert.deepEqual(optionalProfileProvided.optionalContext, {
  city: "Jeddah",
  country: "Saudi Arabia",
  firstProject: "yes",
  userExperienceLevel: "first_time_beginner",
  decisionObjective: "Decide whether to continue.",
  projectStageIntent: "initial_idea",
});

const shortIdeaConfirmed = confirmedDiscovery({ originalIdea: "Repair" });
const shortIdeaHandoff = buildGuidedDiscoveryBivHandoff(shortIdeaConfirmed, {
  locale: "en",
  downstreamInput: completeDownstreamInput,
});
assert.deepEqual(shortIdeaHandoff.missingRequiredInformation.map((item) => item.id), ["businessIdea"]);
assert.equal(shortIdeaHandoff.evaluationReady, false);

const invalidJourneyState = buildGuidedDiscoveryBivHandoff({
  ...confirmedService,
  journeyState: "normal_evaluation",
}, {
  locale: "en",
  downstreamInput: completeDownstreamInput,
});
assert.equal(invalidJourneyState.ok, false);
assert.equal(invalidJourneyState.reasonCode, "invalid_discovery_journey_state");
assert.equal(invalidJourneyState.handoffReady, false);
assert.equal(invalidJourneyState.evaluationReady, false);

const invalidConfirmedAnswers = buildGuidedDiscoveryBivHandoff({
  ...confirmedService,
  confirmedAnswers: "provider text",
}, {
  locale: "en",
  downstreamInput: completeDownstreamInput,
});
assert.equal(invalidConfirmedAnswers.ok, false);
assert.equal(invalidConfirmedAnswers.reasonCode, "invalid_confirmed_answers");

const editedAfterConfirmation = applyDiscoveryFieldChange(confirmedService, "coreOffering", "Maintenance visits");
const editedHandoff = buildGuidedDiscoveryBivHandoff(editedAfterConfirmation, {
  locale: "en",
  downstreamInput: completeDownstreamInput,
});
assert.equal(editedHandoff.ok, false);
assert.equal(editedHandoff.confirmationStatus, "not_confirmed");

for (const decisionField of [
  "verdict",
  "score",
  "eligibility",
  "classification",
  "feasibilityDecision",
  "report",
  "recommendation",
]) {
  assert.equal(Object.hasOwn(serviceHandoff, decisionField), false, `${decisionField} must not be generated by the mapper`);
}
assert.deepEqual(serviceHandoff.blockedDecisions, [
  "verdict",
  "score",
  "eligibility_decision",
  "classification_decision",
  "feasibility_decision",
  "report_permission",
  "recommendation",
]);
assert.equal(serviceHandoff.ownership.rawIdeaCanonical, true);
assert.equal(serviceHandoff.ownership.confirmedUnderstandingCanonical, true);
assert.equal(serviceHandoff.ownership.semanticProviderCanonical, false);
assert.equal(serviceHandoff.ownership.bivDecisionAuthority, true);

console.log("Guided Discovery handoff mapper tests: PASS");
