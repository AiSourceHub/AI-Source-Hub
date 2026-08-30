import {
  buildConfirmationContract,
  buildConfirmedDiscoverySnapshot,
  buildDiscoveryState,
  discoveryJourneyStates,
} from "./intentDiscoveryPrototype.js";

export const GUIDED_DISCOVERY_HANDOFF_VERSION = "biv_guided_discovery_v1";

const REQUIRED_EVALUATION_FIELDS = [
  {
    id: "targetCustomer",
    concept: "target_customer",
    meaning: "Who the business is for and who should be evaluated as the buyer, user, or customer.",
  },
  {
    id: "problem",
    concept: "customer_problem",
    meaning: "The customer problem, job, need, or pain that the business is trying to solve.",
  },
  {
    id: "monetization",
    concept: "monetization",
    meaning: "Who pays and how the business expects to earn revenue.",
  },
];

const OPTIONAL_LATER_FIELDS = [
  "city",
  "country",
  "firstProject",
  "userExperienceLevel",
  "decisionObjective",
  "projectStageIntent",
  "currentSolution",
  "competitiveAdvantage",
];

export function buildGuidedDiscoveryBivHandoff(discoveryState = {}, options = {}) {
  const locale = options.locale === "ar" ? "ar" : "en";
  const stateValidation = validateDiscoveryStateShape(discoveryState);
  if (!stateValidation.ok) {
    return buildBlockedHandoff({
      locale,
      reasonCode: stateValidation.reasonCode,
      originalIdea: typeof discoveryState.originalIdea === "string" ? discoveryState.originalIdea : "",
    });
  }

  const normalizedState = buildDiscoveryState(discoveryState);
  const confirmedSnapshot = buildConfirmedDiscoverySnapshot(normalizedState);
  const confirmationContract = buildConfirmationContract(confirmedSnapshot);

  if (confirmedSnapshot.confirmationStatus !== "confirmed" || !confirmationContract.isComplete) {
    return buildBlockedHandoff({
      locale,
      reasonCode: "guided_discovery_not_confirmed",
      originalIdea: confirmedSnapshot.originalIdea,
      normalizedState,
      confirmationContract,
    });
  }

  const confirmedUnderstanding = buildConfirmedUnderstanding(confirmedSnapshot);
  const downstreamClarifications = normalizeDownstreamClarifications(options.downstreamInput);
  const optionalContext = normalizeOptionalContext(options.downstreamInput);
  const missingRequiredInformation = collectMissingRequiredInformation({
    originalIdea: confirmedSnapshot.originalIdea,
    downstreamInput: downstreamClarifications,
  });

  return {
    ok: true,
    source: "guided_discovery",
    version: GUIDED_DISCOVERY_HANDOFF_VERSION,
    locale,
    route: confirmedSnapshot.route,
    handoffReady: true,
    evaluationReady: missingRequiredInformation.length === 0,
    confirmationStatus: confirmedSnapshot.confirmationStatus,
    originalIdea: confirmedSnapshot.originalIdea,
    confirmedUnderstanding,
    unresolvedItems: [...confirmedSnapshot.unresolvedItems],
    missingRequiredInformation,
    downstreamClarifications,
    optionalContext,
    optionalLaterInformation: [...OPTIONAL_LATER_FIELDS],
    bivDraftInput: buildBivDraftInput({
      originalIdea: confirmedSnapshot.originalIdea,
      downstreamInput: downstreamClarifications,
    }),
    ownership: {
      rawIdeaCanonical: true,
      confirmedUnderstandingCanonical: true,
      semanticProviderCanonical: false,
      bivDecisionAuthority: true,
    },
    semanticAssistance: {
      providerOutputIsAuthoritative: false,
      acceptedWithoutUserConfirmation: false,
    },
    blockedDecisions: buildBlockedDecisionList(),
  };
}

function buildBlockedHandoff({
  locale,
  reasonCode,
  originalIdea = "",
  normalizedState = null,
  confirmationContract = null,
}) {
  return {
    ok: false,
    source: "guided_discovery",
    version: GUIDED_DISCOVERY_HANDOFF_VERSION,
    locale,
    route: normalizedState?.route || "/dev/biv-guided-discovery",
    handoffReady: false,
    evaluationReady: false,
    confirmationStatus: normalizedState?.confirmationStatus || "not_confirmed",
    originalIdea,
    confirmedUnderstanding: null,
    unresolvedItems: normalizedState?.unresolvedItems ? [...normalizedState.unresolvedItems] : [],
    missingRequiredInformation: [],
    downstreamClarifications: {},
    optionalContext: {},
    optionalLaterInformation: [...OPTIONAL_LATER_FIELDS],
    reasonCode,
    confirmationContract: confirmationContract ? {
      resolvedFields: { ...confirmationContract.resolvedFields },
      unresolvedItems: [...confirmationContract.unresolvedItems],
    } : null,
    ownership: {
      rawIdeaCanonical: true,
      confirmedUnderstandingCanonical: false,
      semanticProviderCanonical: false,
      bivDecisionAuthority: true,
    },
    semanticAssistance: {
      providerOutputIsAuthoritative: false,
      acceptedWithoutUserConfirmation: false,
    },
    blockedDecisions: buildBlockedDecisionList(),
  };
}

function validateDiscoveryStateShape(discoveryState = {}) {
  if (!discoveryState || typeof discoveryState !== "object" || Array.isArray(discoveryState)) {
    return { ok: false, reasonCode: "invalid_discovery_state" };
  }
  if (
    typeof discoveryState.journeyState === "string" &&
    discoveryState.journeyState &&
    !Object.values(discoveryJourneyStates).includes(discoveryState.journeyState)
  ) {
    return { ok: false, reasonCode: "invalid_discovery_journey_state" };
  }
  if (discoveryState.confirmedAnswers && (typeof discoveryState.confirmedAnswers !== "object" || Array.isArray(discoveryState.confirmedAnswers))) {
    return { ok: false, reasonCode: "invalid_confirmed_answers" };
  }
  return { ok: true, reasonCode: "" };
}

function buildConfirmedUnderstanding(confirmedSnapshot) {
  const confirmedAnswers = confirmedSnapshot.confirmedAnswers || {};
  return {
    selectedIntent: confirmedAnswers.selectedIntent || confirmedSnapshot.selectedIntent || "",
    coreOffering: confirmedAnswers.coreOffering || confirmedSnapshot.coreOffering || "",
    coreOfferingStatus: confirmedSnapshot.coreOfferingStatus || "",
    selectedOperatingApproach: confirmedAnswers.selectedOperatingApproach || confirmedSnapshot.selectedOperatingApproach || "",
    selectedOperatingApproaches: Array.isArray(confirmedAnswers.selectedOperatingApproaches)
      ? [...confirmedAnswers.selectedOperatingApproaches]
      : [...confirmedSnapshot.selectedOperatingApproaches],
  };
}

function buildBivDraftInput({ originalIdea = "", downstreamInput = {} } = {}) {
  return {
    businessIdea: originalIdea,
    additionalIdeaContext: cleanOptionalString(downstreamInput.additionalIdeaContext),
    targetCustomer: cleanOptionalString(downstreamInput.targetCustomer),
    problem: cleanOptionalString(downstreamInput.problem || downstreamInput.problemSolved),
    monetization: cleanOptionalString(downstreamInput.monetization || downstreamInput.revenueModel),
    stage: cleanOptionalString(downstreamInput.stage) || "idea",
    currentSolution: cleanOptionalString(downstreamInput.currentSolution),
    competitiveAdvantage: cleanOptionalString(downstreamInput.competitiveAdvantage),
  };
}

function normalizeDownstreamClarifications(downstreamInput = {}) {
  return {
    additionalIdeaContext: cleanOptionalString(downstreamInput.additionalIdeaContext),
    targetCustomer: cleanOptionalString(downstreamInput.targetCustomer),
    problem: cleanOptionalString(downstreamInput.problem || downstreamInput.problemSolved),
    monetization: cleanOptionalString(downstreamInput.monetization || downstreamInput.revenueModel),
  };
}

function normalizeOptionalContext(downstreamInput = {}) {
  return OPTIONAL_LATER_FIELDS.reduce((context, field) => {
    const value = cleanOptionalString(downstreamInput[field]);
    if (value) context[field] = value;
    return context;
  }, {});
}

function collectMissingRequiredInformation({ originalIdea = "", downstreamInput = {} } = {}) {
  const draftInput = buildBivDraftInput({ originalIdea, downstreamInput });
  const missing = [];
  if (draftInput.businessIdea.trim().length < 10) {
    missing.push({
      id: "businessIdea",
      concept: "safe_eligibility_review_description",
      meaning: "Enough idea description for safe eligibility review.",
    });
  }
  for (const field of REQUIRED_EVALUATION_FIELDS) {
    if (!draftInput[field.id]?.trim()) {
      missing.push({ ...field });
    }
  }
  return missing;
}

function buildBlockedDecisionList() {
  return [
    "verdict",
    "score",
    "eligibility_decision",
    "classification_decision",
    "feasibility_decision",
    "report_permission",
    "recommendation",
  ];
}

function cleanOptionalString(value = "") {
  return typeof value === "string" ? value.trim() : "";
}
