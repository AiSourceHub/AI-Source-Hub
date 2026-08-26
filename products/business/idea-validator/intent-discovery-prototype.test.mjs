import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyDiscoveryFieldChange,
  buildConfirmationContract,
  buildDiscoveryState,
  buildSuggestedIntentOptions,
  buildUnderstandingSummary,
  confirmDiscoveryUnderstanding,
  discoveryContent,
  getCoreOfferingQuestion,
  getDiscoverySteps,
  getIntentChoices,
  getMixedOperatingChoices,
  getNextStep,
  getOperatingChoices,
  getProgressText,
  reopenDiscoveryConfirmation,
  updateMixedOperatingSelection,
  INTENT_DISCOVERY_ROUTE,
  validateDiscoveryStep,
} from "./intentDiscoveryPrototype.js";

const appSource = readFileSync(new URL("../../../src/App.jsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../../../src/pages/HomePage.jsx", import.meta.url), "utf8");
const productPageSource = readFileSync(new URL("../../../src/pages/BusinessIdeaValidatorPage.jsx", import.meta.url), "utf8");
const prototypePageSource = readFileSync(new URL("../../../src/pages/BusinessIdeaDiscoveryPrototypePage.jsx", import.meta.url), "utf8");

const emptyState = buildDiscoveryState({ originalIdea: "" });
assert.equal(emptyState.originalIdea, "");
const emptyValidation = validateDiscoveryStep(emptyState, "idea", "en");
assert.equal(emptyValidation.ok, false);
assert.equal(emptyValidation.error, discoveryContent.en.validation.ideaRequired);

const serviceState = buildDiscoveryState({ originalIdea: "A mobile cleaning service for homes" });
const serviceChoices = getIntentChoices(serviceState);
assert.equal(serviceChoices.filter((choice) => !["different", "not_decided"].includes(choice.id)).length <= 5, true);
assert.equal(serviceChoices.some((choice) => choice.id === "different"), true);
assert.equal(serviceChoices.some((choice) => choice.id === "not_decided"), true);
assert.equal(serviceChoices[0].id, "service");
assert.equal(serviceChoices[0].suggested, true);

const ambiguousState = buildDiscoveryState({ originalIdea: "A new business idea in Jeddah" });
assert.equal(ambiguousState.suggestedIntentOptions.some((choice) => choice.suggested), false);
assert.equal(ambiguousState.selectedIntent, "");

const selectedRetail = buildDiscoveryState({
  originalIdea: "A software tool for stores",
  selectedIntent: "retail",
  coreOffering: "Daily household products",
  selectedOperatingApproach: "fixed_location",
});
assert.equal(selectedRetail.selectedIntent, "retail");
assert.equal(selectedRetail.coreOffering, "Daily household products");
assert.equal(buildSuggestedIntentOptions("A software tool for stores")[0].id, "digital");

const baseConfirmedState = buildDiscoveryState({
  originalIdea: "A service business with more than one delivery approach.",
  selectedIntent: "service",
  coreOffering: "Car cleaning and care",
  selectedOperatingApproach: "mixed",
  selectedOperatingApproaches: ["fixed_location", "customer_site"],
});
const baseContract = buildConfirmationContract(baseConfirmedState);
assert.equal(baseContract.isComplete, true);
assert.deepEqual(baseContract.fieldValues.selectedOperatingApproaches, ["fixed_location", "customer_site"]);
assert.deepEqual(baseContract.resolvedFields, {
  selectedIntent: true,
  coreOffering: true,
  selectedOperatingApproach: true,
  selectedOperatingApproaches: true,
});

const confirmedContractState = confirmDiscoveryUnderstanding(baseConfirmedState);
assert.equal(confirmedContractState.confirmationStatus, "confirmed");
assert.equal(confirmedContractState.confirmedAnswers.selectedIntent, "service");
assert.equal(confirmedContractState.confirmedAnswers.coreOffering, "Car cleaning and care");
const confirmedAgain = confirmDiscoveryUnderstanding(confirmedContractState);
assert.equal(confirmedAgain.confirmationStatus, "confirmed");
assert.deepEqual(confirmedAgain.confirmedAnswers, confirmedContractState.confirmedAnswers);
const reopenedConfirmation = reopenDiscoveryConfirmation(confirmedContractState);
assert.equal(reopenedConfirmation.confirmationStatus, "not_confirmed");
assert.equal(reopenedConfirmation.selectedIntent, "service");
assert.equal(reopenedConfirmation.coreOffering, "Car cleaning and care");
assert.deepEqual(reopenedConfirmation.selectedOperatingApproaches, ["fixed_location", "customer_site"]);
assert.deepEqual(reopenedConfirmation.confirmedAnswers, confirmedContractState.confirmedAnswers);

const incompleteConfirmation = confirmDiscoveryUnderstanding(buildDiscoveryState({
  originalIdea: "A service idea.",
  selectedIntent: "service",
}));
assert.equal(incompleteConfirmation.confirmationStatus, "not_confirmed");
assert.deepEqual(incompleteConfirmation.confirmedAnswers, {});

const changedIntent = applyDiscoveryFieldChange(baseConfirmedState, "selectedIntent", "retail");
assert.equal(changedIntent.selectedIntent, "retail");
assert.equal(changedIntent.coreOffering, "");
assert.equal(changedIntent.coreOfferingStatus, "missing");
assert.equal(changedIntent.selectedOperatingApproach, "mixed");
assert.deepEqual(changedIntent.selectedOperatingApproaches, ["fixed_location", "customer_site"]);
assert.deepEqual(changedIntent.dependencyResets, ["coreOffering"]);

const changedCoreOffering = applyDiscoveryFieldChange(baseConfirmedState, "coreOffering", "Exterior cleaning");
assert.equal(changedCoreOffering.selectedIntent, "service");
assert.equal(changedCoreOffering.coreOffering, "Exterior cleaning");
assert.equal(changedCoreOffering.selectedOperatingApproach, "mixed");
assert.deepEqual(changedCoreOffering.selectedOperatingApproaches, ["fixed_location", "customer_site"]);
assert.deepEqual(changedCoreOffering.dependencyResets, []);

const changedMixedToFixed = applyDiscoveryFieldChange(baseConfirmedState, "selectedOperatingApproach", "fixed_location");
assert.equal(changedMixedToFixed.selectedIntent, "service");
assert.equal(changedMixedToFixed.coreOffering, "Car cleaning and care");
assert.equal(changedMixedToFixed.selectedOperatingApproach, "fixed_location");
assert.deepEqual(changedMixedToFixed.selectedOperatingApproaches, []);
assert.deepEqual(changedMixedToFixed.dependencyResets, ["selectedOperatingApproaches"]);

const changedFixedToMixed = applyDiscoveryFieldChange(
  buildDiscoveryState({
    originalIdea: "A service idea.",
    selectedIntent: "service",
    coreOffering: "Cleaning",
    selectedOperatingApproach: "fixed_location",
  }),
  "selectedOperatingApproach",
  "mixed"
);
assert.equal(changedFixedToMixed.selectedOperatingApproach, "mixed");
assert.deepEqual(changedFixedToMixed.selectedOperatingApproaches, []);
assert.equal(changedFixedToMixed.unresolvedItems.includes("mixedOperating"), true);

const editedMixedApproaches = applyDiscoveryFieldChange(baseConfirmedState, "selectedOperatingApproaches", ["online", "customer_site"]);
assert.equal(editedMixedApproaches.selectedIntent, "service");
assert.equal(editedMixedApproaches.coreOffering, "Car cleaning and care");
assert.equal(editedMixedApproaches.selectedOperatingApproach, "mixed");
assert.deepEqual(editedMixedApproaches.selectedOperatingApproaches, ["online", "customer_site"]);

const userStateAfterProviderSuggestion = applyDiscoveryFieldChange(
  buildDiscoveryState({
    originalIdea: "A service idea.",
    selectedIntent: "marketplace",
    coreOffering: "Clients and providers",
    selectedOperatingApproach: "online",
  }),
  "coreOffering",
  "Clients and service providers"
);
assert.equal(userStateAfterProviderSuggestion.selectedIntent, "marketplace");
assert.equal(userStateAfterProviderSuggestion.coreOffering, "Clients and service providers");

const intentQuestions = {
  service: {
    en: "What main service will the customer receive?",
    ar: "ما الخدمة الأساسية التي سيحصل عليها العميل؟",
  },
  retail: {
    en: "What main product category will the business sell?",
    ar: "ما فئة المنتجات الأساسية التي سيبيعها المشروع؟",
  },
  manufacturing: {
    en: "What main product will the business make?",
    ar: "ما المنتج الأساسي الذي سيصنعه المشروع؟",
  },
  digital: {
    en: "What main task will the software help the user complete?",
    ar: "ما المهمة الأساسية التي سيساعد البرنامج المستخدم على إنجازها؟",
  },
  marketplace: {
    en: "Which two sides will the platform connect?",
    ar: "من الطرفان اللذان ستربط بينهما المنصة؟",
  },
  different: {
    en: "What main outcome do you want the business to give the customer?",
    ar: "ما النتيجة الأساسية التي تريد أن يقدمها المشروع للعميل؟",
  },
  not_decided: {
    en: "What main outcome do you want the business to give the customer?",
    ar: "ما النتيجة الأساسية التي تريد أن يقدمها المشروع للعميل؟",
  },
};
for (const [intentId, questions] of Object.entries(intentQuestions)) {
  assert.equal(getCoreOfferingQuestion(intentId, "en"), questions.en);
  assert.equal(getCoreOfferingQuestion(intentId, "ar"), questions.ar);
}

const operatingChoices = getOperatingChoices("digital");
assert.equal(operatingChoices.some((choice) => choice.id === "online"), true);
assert.equal(operatingChoices.some((choice) => choice.id === "fixed_location"), false);
assert.equal(operatingChoices.length < 6, true);

const rawIdeaOnly = buildDiscoveryState({ originalIdea: "A mobile cleaning service for homes" });
assert.equal(rawIdeaOnly.coreOffering, "");
assert.equal(rawIdeaOnly.coreOfferingStatus, "missing");
assert.equal(validateDiscoveryStep(rawIdeaOnly, "coreOffering", "en").ok, false);

const undecidedOffering = buildDiscoveryState({
  originalIdea: "A business idea",
  selectedIntent: "service",
  coreOfferingStatus: "undecided",
});
assert.equal(validateDiscoveryStep(undecidedOffering, "coreOffering", "en").ok, true);
assert.equal(undecidedOffering.unresolvedItems.includes("coreOffering"), true);

const mixedWithoutChannels = buildDiscoveryState({
  originalIdea: "A service idea",
  selectedIntent: "service",
  coreOffering: "Cleaning",
  selectedOperatingApproach: "mixed",
});
assert.equal(getNextStep(mixedWithoutChannels, "operating"), "mixedOperating");
assert.equal(getDiscoverySteps(mixedWithoutChannels).length, 6);
assert.equal(validateDiscoveryStep(mixedWithoutChannels, "mixedOperating", "en").ok, false);
assert.equal(mixedWithoutChannels.unresolvedItems.includes("mixedOperating"), true);
assert.equal(getProgressText(mixedWithoutChannels, "mixedOperating", "en"), "Step 5 of 6");
assert.equal(getProgressText(mixedWithoutChannels, "summary", "ar"), "الخطوة 6 من 6");

const oneMixedChannel = buildDiscoveryState({
  ...mixedWithoutChannels,
  selectedOperatingApproaches: ["online"],
});
assert.equal(validateDiscoveryStep(oneMixedChannel, "mixedOperating", "en").ok, false);

const mixedUndecided = buildDiscoveryState({
  ...mixedWithoutChannels,
  selectedOperatingApproaches: ["not_decided"],
});
assert.equal(validateDiscoveryStep(mixedUndecided, "mixedOperating", "en").ok, true);
assert.equal(mixedUndecided.unresolvedItems.includes("mixedOperating"), true);

const mixedResolved = buildDiscoveryState({
  ...mixedWithoutChannels,
  selectedOperatingApproaches: updateMixedOperatingSelection(["online"], "fixed_location"),
});
assert.equal(validateDiscoveryStep(mixedResolved, "mixedOperating", "en").ok, true);
assert.equal(mixedResolved.unresolvedItems.includes("mixedOperating"), false);
assert.deepEqual(mixedResolved.unresolvedItems, []);
assert.deepEqual(updateMixedOperatingSelection(["not_decided"], "online"), ["online"]);
assert.equal(getMixedOperatingChoices().some((choice) => choice.id === "other"), true);

const summary = buildUnderstandingSummary(
  buildDiscoveryState({
    originalIdea: "A long original idea paragraph with several details.",
    selectedIntent: "marketplace",
    coreOffering: "Parents and tutors",
    selectedOperatingApproach: "online",
    confirmationStatus: "confirmed",
  }),
  "en"
);
assert.equal(summary.originalIdea, "A long original idea paragraph with several details.");
assert.equal(summary.intentLabel, discoveryContent.en.intentSummaryOptions.marketplace);
assert.equal(summary.coreOfferingLabel, "Parents and tutors");
assert.equal(summary.confirmationStatus, "confirmed");
assert.deepEqual(summary.unresolvedItems, []);
assert.equal(discoveryContent.en.states.summary.complete, "The essential information required for this stage is complete.");
assert.equal(discoveryContent.en.states.confirmed.heading, "Understanding confirmed");
assert.equal(discoveryContent.en.states.confirmed.body, "The information you confirmed for this stage has been saved. Your idea is now ready to move to the next step when it is approved.");
assert.equal(discoveryContent.en.states.confirmed.notice, "This is a local idea-understanding prototype only; evaluation or report preparation has not started yet.");

const arSummary = buildUnderstandingSummary(
  buildDiscoveryState({
    originalIdea: "منصة تربط بين طرفين.",
    selectedIntent: "marketplace",
    coreOfferingStatus: "undecided",
    selectedOperatingApproach: "online",
  }),
  "ar"
);
assert.equal(arSummary.intentLabel, discoveryContent.ar.intentSummaryOptions.marketplace);
assert.equal(arSummary.coreOfferingLabel, discoveryContent.ar.placeholders.coreOfferingUndecided);
assert.equal(arSummary.unresolvedItems.includes(discoveryContent.ar.unresolved.coreOffering), true);

const arCompleteMixedSummary = buildUnderstandingSummary(
  buildDiscoveryState({
    originalIdea: "خدمة سيارات.",
    selectedIntent: "service",
    coreOffering: "تنظيف وعناية بالسيارات",
    selectedOperatingApproach: "mixed",
    selectedOperatingApproaches: ["fixed_location", "customer_site"],
  }),
  "ar"
);
assert.deepEqual(arCompleteMixedSummary.unresolvedItems, []);
assert.equal(arCompleteMixedSummary.operatingLabel, "في موقع ثابت، وفي موقع العميل");
assert.equal(discoveryContent.ar.states.summary.complete, "اكتملت المعلومات الأساسية المطلوبة لهذه المرحلة.");
assert.equal(discoveryContent.ar.states.confirmed.heading, "تم تأكيد فهم الفكرة");
assert.equal(discoveryContent.ar.states.confirmed.body, "تم حفظ المعلومات التي أكّدتها لهذه المرحلة. أصبحت فكرتك الآن جاهزة للانتقال إلى الخطوة التالية عندما يتم اعتمادها.");
assert.equal(discoveryContent.ar.states.confirmed.notice, "هذا نموذج محلي لفهم الفكرة فقط، ولم يبدأ التقييم أو إعداد التقرير بعد.");

const enCompleteMixedSummary = buildUnderstandingSummary(
  buildDiscoveryState({
    originalIdea: "Car care service.",
    selectedIntent: "service",
    coreOffering: "Car cleaning and care",
    selectedOperatingApproach: "mixed",
    selectedOperatingApproaches: ["fixed_location", "customer_site"],
  }),
  "en"
);
assert.equal(enCompleteMixedSummary.operatingLabel, "At a fixed location and At the customer’s location");

const hiddenTerms = ["generic", "unknown", "primaryType", "operatingModel", "marketplace_platform", "confidence", "fieldSignals"];
const visiblePrototypeText = [
  ...Object.values(discoveryContent.en.intentOptions),
  ...Object.values(discoveryContent.ar.intentOptions),
  ...Object.values(discoveryContent.en.intentSummaryOptions),
  ...Object.values(discoveryContent.ar.intentSummaryOptions),
  ...Object.values(discoveryContent.en.operatingOptions),
  ...Object.values(discoveryContent.ar.operatingOptions),
  ...Object.values(discoveryContent.en.mixedOperatingOptions),
  ...Object.values(discoveryContent.ar.mixedOperatingOptions),
].join(" ");
for (const term of hiddenTerms) {
  assert.equal(visiblePrototypeText.includes(term), false);
}

assert.equal(prototypePageSource.includes("{index + 1}"), false);
assert.equal(prototypePageSource.includes("step-pill"), false);
assert.equal(prototypePageSource.includes("discovery-progress__text"), true);
assert.equal(discoveryContent.en.progress, "Step {current} of {total}");
assert.equal(discoveryContent.ar.progress, "الخطوة {current} من {total}");
assert.equal(prototypePageSource.includes("score"), false);
assert.equal(prototypePageSource.includes("reportText"), false);
assert.equal(prototypePageSource.includes("copyReport"), false);
assert.equal(prototypePageSource.includes("downloadReport"), false);
assert.equal(prototypePageSource.includes("states.summary.operating"), true);
assert.equal(prototypePageSource.includes("states.operating.heading}</p>"), false);
assert.equal(prototypePageSource.includes("summary.unresolvedItems.length"), true);
assert.equal(prototypePageSource.includes("states.summary.complete"), true);
assert.equal(prototypePageSource.includes("discovery-confirmed-state"), true);
assert.equal(prototypePageSource.includes("content.states.confirmed.heading"), true);
assert.equal(prototypePageSource.includes("content.states.confirmed.body"), true);
assert.equal(prototypePageSource.includes("content.states.confirmed.notice"), true);
assert.equal(prototypePageSource.includes("state.confirmationStatus === 'confirmed' ? null"), true);
assert.equal(prototypePageSource.includes("content.actions.editAnswers"), true);
assert.equal(prototypePageSource.includes("reopenDiscoveryConfirmation"), true);
assert.equal(prototypePageSource.includes("editSummaryField('selectedIntent')"), true);
assert.equal(prototypePageSource.includes("editSummaryField('coreOffering')"), true);
assert.equal(prototypePageSource.includes("selectedOperatingApproaches"), true);
assert.equal(prototypePageSource.includes("confirmDiscoveryUnderstanding"), true);
assert.equal(prototypePageSource.includes("buildConfirmationContract"), true);
assert.equal(prototypePageSource.includes("reset"), true);
assert.equal(productPageSource.includes("BusinessIdeaDiscoveryPrototypePage"), false);
assert.equal(homeSource.includes(INTENT_DISCOVERY_ROUTE), false);
assert.equal(appSource.includes("INTENT_DISCOVERY_ROUTE"), true);
assert.equal(appSource.includes("BusinessIdeaDiscoveryPrototypePage"), true);

console.log(
  JSON.stringify(
    {
      intentDiscoveryPrototypePassed: true,
      route: INTENT_DISCOVERY_ROUTE,
      checks: [
        "empty idea blocked by page validation",
        "at most five main choices plus fallbacks",
        "internal labels hidden from localized choices",
        "suggestion ordering only",
        "user selection authoritative",
        "core offering asked after intent",
        "mixed operating approach requires details",
        "localized progress text hides raw step numbers",
        "summary separates original idea",
        "prototype absent from public navigation",
        "no score/report/copy/download flow",
      ],
    },
    null,
    2
  )
);
