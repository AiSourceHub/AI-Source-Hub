import assert from "node:assert/strict";
import {
  buildDiscoveryState,
  confirmDiscoveryUnderstanding,
} from "./intentDiscoveryPrototype.js";
import { buildGuidedDiscoveryBivHandoff } from "./guidedDiscoveryHandoffMapper.js";
import {
  applyGuidedDiscoveryClarificationAnswer,
  evaluateGuidedDiscoverySufficiency,
  getGuidedDiscoveryClarificationDefinition,
  GUIDED_DISCOVERY_SUFFICIENCY_STATUS,
} from "./guidedDiscoverySufficiencyBridge.js";

function confirmedDiscovery(overrides = {}) {
  return confirmDiscoveryUnderstanding(buildDiscoveryState({
    originalIdea: "A service business that repairs air-conditioning units for homes and small offices.",
    selectedIntent: "service",
    coreOffering: "Air-conditioning repair",
    selectedOperatingApproach: "customer_site",
    ...overrides,
  }));
}

function handoff(overrides = {}, downstreamInput = {}) {
  return buildGuidedDiscoveryBivHandoff(confirmedDiscovery(overrides), {
    locale: "en",
    downstreamInput,
  });
}

const completeInput = {
  targetCustomer: "Homeowners and small offices",
  problem: "Air-conditioning failures interrupt comfort and operations.",
  monetization: "Customers pay per repair visit.",
};

const ready = evaluateGuidedDiscoverySufficiency(handoff({}, completeInput));
assert.equal(ready.ok, true);
assert.equal(ready.status, GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT);
assert.equal(ready.activeClarification, null);
assert.deepEqual(ready.remainingMissingInformation, []);

const editedTargetCustomerInput = {
  ...completeInput,
  targetCustomer: "Villa owners, tenants, and small businesses",
};
const editedTargetCustomer = evaluateGuidedDiscoverySufficiency(handoff({}, editedTargetCustomerInput));
assert.equal(editedTargetCustomer.status, GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT);
assert.equal(editedTargetCustomer.activeClarification, null);
assert.equal(editedTargetCustomerInput.problem, completeInput.problem);
assert.equal(editedTargetCustomerInput.monetization, completeInput.monetization);

const editedProblemInput = {
  ...completeInput,
  problem: "They need urgent repairs when cooling stops at home or work.",
};
const editedProblem = evaluateGuidedDiscoverySufficiency(handoff({}, editedProblemInput));
assert.equal(editedProblem.status, GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT);
assert.equal(editedProblem.activeClarification, null);
assert.equal(editedProblemInput.targetCustomer, completeInput.targetCustomer);
assert.equal(editedProblemInput.monetization, completeInput.monetization);

const editedMonetizationInput = {
  ...completeInput,
  monetization: "Customers pay inspection and repair fees per visit.",
};
const editedMonetization = evaluateGuidedDiscoverySufficiency(handoff({}, editedMonetizationInput));
assert.equal(editedMonetization.status, GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT);
assert.equal(editedMonetization.activeClarification, null);
assert.equal(editedMonetizationInput.targetCustomer, completeInput.targetCustomer);
assert.equal(editedMonetizationInput.problem, completeInput.problem);

const onlyProblemMissing = evaluateGuidedDiscoverySufficiency(handoff({}, {
  targetCustomer: completeInput.targetCustomer,
  monetization: completeInput.monetization,
}));
assert.equal(onlyProblemMissing.activeClarification.id, "problem");
assert.deepEqual(onlyProblemMissing.remainingMissingInformation.map((item) => item.id), ["problem"]);

const onlyMonetizationMissing = evaluateGuidedDiscoverySufficiency(handoff({}, {
  targetCustomer: completeInput.targetCustomer,
  problem: completeInput.problem,
}));
assert.equal(onlyMonetizationMissing.activeClarification.id, "monetization");
assert.deepEqual(onlyMonetizationMissing.remainingMissingInformation.map((item) => item.id), ["monetization"]);

const missingTarget = evaluateGuidedDiscoverySufficiency(handoff({}, {
  problem: completeInput.problem,
  monetization: completeInput.monetization,
}));
assert.equal(missingTarget.status, GUIDED_DISCOVERY_SUFFICIENCY_STATUS.NEEDS_CLARIFICATION);
assert.equal(missingTarget.activeClarification.id, "targetCustomer");
assert.equal(missingTarget.activeClarification.field.id, "targetCustomer");
assert.equal(missingTarget.activeClarification.prompt, "Who is the main customer for this service?");

const missingProblem = evaluateGuidedDiscoverySufficiency(handoff({}, {
  targetCustomer: completeInput.targetCustomer,
  monetization: completeInput.monetization,
}));
assert.equal(missingProblem.activeClarification.id, "problem");
assert.equal(missingProblem.activeClarification.field.id, "problem");

const missingMonetization = evaluateGuidedDiscoverySufficiency(handoff({}, {
  targetCustomer: completeInput.targetCustomer,
  problem: completeInput.problem,
}));
assert.equal(missingMonetization.activeClarification.id, "monetization");
assert.equal(missingMonetization.activeClarification.field.id, "monetization");

const multipleMissing = evaluateGuidedDiscoverySufficiency(handoff({}, {}));
assert.equal(multipleMissing.activeClarification.id, "targetCustomer");
assert.deepEqual(multipleMissing.remainingMissingInformation.map((item) => item.id), [
  "targetCustomer",
  "problem",
  "monetization",
]);

const afterTarget = applyGuidedDiscoveryClarificationAnswer(
  handoff({}, {}),
  "targetCustomer",
  "Homeowners and small offices"
);
assert.equal(afterTarget.ok, true);
assert.equal(afterTarget.handoff.originalIdea, "A service business that repairs air-conditioning units for homes and small offices.");
assert.equal(afterTarget.handoff.confirmedUnderstanding.coreOffering, "Air-conditioning repair");
assert.equal(afterTarget.handoff.downstreamClarifications.targetCustomer, "Homeowners and small offices");
assert.equal(afterTarget.handoff.bivDraftInput.targetCustomer, "Homeowners and small offices");
assert.equal(afterTarget.sufficiency.activeClarification.id, "problem");
const rebuiltAfterTarget = buildGuidedDiscoveryBivHandoff(confirmedDiscovery(), {
  locale: "en",
  downstreamInput: afterTarget.handoff.downstreamClarifications,
});
assert.equal(rebuiltAfterTarget.downstreamClarifications.targetCustomer, "Homeowners and small offices");
assert.equal(evaluateGuidedDiscoverySufficiency(rebuiltAfterTarget).activeClarification.id, "problem");

const afterProblem = applyGuidedDiscoveryClarificationAnswer(
  afterTarget.handoff,
  "problem",
  "Air-conditioning failures interrupt comfort and operations."
);
assert.equal(afterProblem.ok, true);
assert.equal(afterProblem.handoff.downstreamClarifications.targetCustomer, "Homeowners and small offices");
assert.equal(afterProblem.handoff.downstreamClarifications.problem, "Air-conditioning failures interrupt comfort and operations.");
assert.equal(afterProblem.sufficiency.activeClarification.id, "monetization");
const rebuiltAfterProblem = buildGuidedDiscoveryBivHandoff(confirmedDiscovery(), {
  locale: "en",
  downstreamInput: afterProblem.handoff.downstreamClarifications,
});
assert.equal(evaluateGuidedDiscoverySufficiency(rebuiltAfterProblem).activeClarification.id, "monetization");

const afterMonetization = applyGuidedDiscoveryClarificationAnswer(
  afterProblem.handoff,
  "monetization",
  "Customers pay per repair visit."
);
assert.equal(afterMonetization.ok, true);
assert.equal(afterMonetization.sufficiency.status, GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT);
assert.equal(afterMonetization.handoff.evaluationReady, true);
assert.deepEqual(afterMonetization.handoff.downstreamClarifications, {
  additionalIdeaContext: "",
  targetCustomer: "Homeowners and small offices",
  problem: "Air-conditioning failures interrupt comfort and operations.",
  monetization: "Customers pay per repair visit.",
});
assert.equal(afterMonetization.handoff.confirmedUnderstanding.selectedIntent, "service");
assert.equal(afterMonetization.handoff.confirmedUnderstanding.selectedOperatingApproach, "customer_site");
const rebuiltAfterMonetization = buildGuidedDiscoveryBivHandoff(confirmedDiscovery(), {
  locale: "en",
  downstreamInput: afterMonetization.handoff.downstreamClarifications,
});
assert.equal(evaluateGuidedDiscoverySufficiency(rebuiltAfterMonetization).status, GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT);

const shortIdea = handoff({ originalIdea: "Repair" }, completeInput);
const shortIdeaSufficiency = evaluateGuidedDiscoverySufficiency(shortIdea);
assert.equal(shortIdeaSufficiency.activeClarification.id, "businessIdea");
const afterIdeaClarification = applyGuidedDiscoveryClarificationAnswer(
  shortIdea,
  "businessIdea",
  "Repair air-conditioning units for homeowners."
);
assert.equal(afterIdeaClarification.ok, true);
assert.equal(afterIdeaClarification.handoff.originalIdea, "Repair");
assert.equal(afterIdeaClarification.handoff.downstreamClarifications.additionalIdeaContext, "Repair air-conditioning units for homeowners.");
assert.equal(afterIdeaClarification.sufficiency.status, GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT);

const mixedHandoff = handoff({
  selectedOperatingApproach: "mixed",
  selectedOperatingApproaches: ["fixed_location", "customer_site"],
}, {});
const mixedSufficiency = evaluateGuidedDiscoverySufficiency(mixedHandoff);
assert.equal(mixedSufficiency.activeClarification.id, "targetCustomer");
assert.notEqual(mixedSufficiency.activeClarification.id, "selectedOperatingApproach");
assert.deepEqual(mixedHandoff.confirmedUnderstanding.selectedOperatingApproaches, ["fixed_location", "customer_site"]);

const optionalProfileDoesNotBlock = evaluateGuidedDiscoverySufficiency(buildGuidedDiscoveryBivHandoff(confirmedDiscovery(), {
  locale: "en",
  downstreamInput: {
    ...completeInput,
    city: "",
    country: "",
    firstProject: "",
    userExperienceLevel: "",
    decisionObjective: "",
    currentSolution: "",
    competitiveAdvantage: "",
    productionCapacity: "",
    premises: "",
    buyers: "",
  },
}));
assert.equal(optionalProfileDoesNotBlock.status, GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT);

const providerSuggestionCannotFill = evaluateGuidedDiscoverySufficiency({
  ...handoff({}, {}),
  semanticSuggestion: {
    targetCustomer: "Suggested users",
    problem: "Suggested problem",
    monetization: "Suggested revenue",
  },
});
assert.equal(providerSuggestionCannotFill.activeClarification.id, "targetCustomer");
assert.deepEqual(providerSuggestionCannotFill.remainingMissingInformation.map((item) => item.id), [
  "targetCustomer",
  "problem",
  "monetization",
]);

const emptyAnswer = applyGuidedDiscoveryClarificationAnswer(handoff({}, {}), "targetCustomer", " ");
assert.equal(emptyAnswer.ok, false);
assert.equal(emptyAnswer.reasonCode, "empty_clarification_answer");
assert.equal(emptyAnswer.sufficiency.activeClarification.id, "targetCustomer");

const wrongAnswer = applyGuidedDiscoveryClarificationAnswer(handoff({}, {}), "problem", "They need help.");
assert.equal(wrongAnswer.ok, false);
assert.equal(wrongAnswer.reasonCode, "clarification_not_active");

const blocked = evaluateGuidedDiscoverySufficiency(buildGuidedDiscoveryBivHandoff(buildDiscoveryState({
  originalIdea: "A service idea.",
  selectedIntent: "service",
})));
assert.equal(blocked.status, GUIDED_DISCOVERY_SUFFICIENCY_STATUS.BLOCKED);
assert.equal(blocked.activeClarification, null);

const arDefinition = getGuidedDiscoveryClarificationDefinition("targetCustomer", "ar");
assert.equal(arDefinition.label, "العميل المستهدف");
assert.equal(arDefinition.prompt, "من العميل الأساسي لهذا المشروع؟");
const arabicServiceTargetPrompt = evaluateGuidedDiscoverySufficiency(buildGuidedDiscoveryBivHandoff(confirmedDiscovery({
  originalIdea: "مشروع صيانة مكيفات يقدم الخدمة في موقع العميل.",
  coreOffering: "صيانة المكيفات",
}), { locale: "ar" }));
assert.equal(arabicServiceTargetPrompt.activeClarification.prompt, "من العميل الرئيسي لهذه الخدمة؟");
const enDefinition = getGuidedDiscoveryClarificationDefinition("monetization", "en");
assert.equal(enDefinition.label, "How the business makes money");

for (const decision of [
  "verdict",
  "score",
  "eligibility_decision",
  "classification_decision",
  "feasibility_decision",
  "specialist_conclusion",
  "report_permission",
  "recommendation",
]) {
  assert.equal(ready.blockedDecisions.includes(decision), true);
}

console.log("Guided Discovery sufficiency bridge tests: PASS");
