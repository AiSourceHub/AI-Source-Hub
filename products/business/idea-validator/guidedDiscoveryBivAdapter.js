import { inputSchema } from "./questions.js";

export const GUIDED_DISCOVERY_CANONICAL_BIV_VERSION = "biv_canonical_input_v1";

const CORE_REQUIRED_FIELDS = ["businessIdea", "targetCustomer", "problem", "monetization"];

const legacyExecutionDependencies = [
  "userExperienceLevel",
  "firstProject",
  "projectStageIntent",
  "country",
  "decisionObjective",
  "classificationConfirmation",
];

const optionalContextFields = [
  "country",
  "city",
  "firstProject",
  "userExperienceLevel",
  "decisionObjective",
  "currentSolution",
  "competitiveAdvantage",
];

export function adaptGuidedDiscoveryHandoffToBiv(handoff = {}, sufficiency = {}) {
  const readiness = validateReadyHandoff(handoff, sufficiency);
  if (!readiness.ok) {
    return {
      ok: false,
      reasonCode: readiness.reasonCode,
      canonicalInput: null,
      currentEngineInput: null,
      compatibility: buildCompatibility({ schemaReady: false }),
    };
  }

  const canonicalInput = buildCanonicalBivInput(handoff);
  const currentEngineInput = projectCanonicalInputToCurrentEngine(canonicalInput);
  const compatibility = buildCompatibility({
    schemaReady: isCoreSchemaReady(canonicalInput.rawInput),
    currentEngineInput,
  });

  return {
    ok: true,
    reasonCode: "guided_discovery_biv_adapter_ready",
    canonicalInput,
    currentEngineInput,
    compatibility,
  };
}

export function buildCanonicalBivInput(handoff = {}) {
  const rawInput = {
    businessIdea: cleanString(handoff.bivDraftInput?.businessIdea || handoff.originalIdea),
    targetCustomer: cleanString(handoff.bivDraftInput?.targetCustomer || handoff.downstreamClarifications?.targetCustomer),
    problem: cleanString(handoff.bivDraftInput?.problem || handoff.downstreamClarifications?.problem),
    monetization: cleanString(handoff.bivDraftInput?.monetization || handoff.downstreamClarifications?.monetization),
    stage: cleanString(handoff.bivDraftInput?.stage) || "idea",
    currentSolution: cleanString(handoff.bivDraftInput?.currentSolution),
    competitiveAdvantage: cleanString(handoff.bivDraftInput?.competitiveAdvantage),
  };

  return {
    source: "guided_discovery",
    version: GUIDED_DISCOVERY_CANONICAL_BIV_VERSION,
    locale: handoff.locale === "ar" ? "ar" : "en",
    language: handoff.locale === "ar" ? "ar" : "en",
    rawInput,
    originalIdea: cleanString(handoff.originalIdea),
    confirmedUnderstanding: normalizeConfirmedUnderstanding(handoff.confirmedUnderstanding),
    downstreamClarifications: normalizeDownstreamClarifications(handoff.downstreamClarifications),
    optionalContext: normalizeOptionalContext(handoff),
    authority: {
      bivOwnsEligibility: true,
      bivOwnsClassification: true,
      bivOwnsFeasibility: true,
      bivOwnsScoring: true,
      bivOwnsRecommendation: true,
      bivOwnsReport: true,
      semanticProviderAuthoritative: false,
      guidedDiscoveryIntentIsFinalClassification: false,
    },
    sourceMetadata: {
      handoffVersion: handoff.version || "",
      handoffRoute: handoff.route || "",
      confirmationStatus: handoff.confirmationStatus || "",
      semanticProviderCanonical: Boolean(handoff.ownership?.semanticProviderCanonical),
      confirmedUnderstandingCanonical: Boolean(handoff.ownership?.confirmedUnderstandingCanonical),
    },
  };
}

export function projectCanonicalInputToCurrentEngine(canonicalInput = {}) {
  const optionalContext = canonicalInput.optionalContext || {};
  return {
    rawInput: { ...(canonicalInput.rawInput || {}) },
    language: canonicalInput.locale === "ar" ? "ar" : "en",
    industrialDetails: {},
    feasibilityAnswers: buildCurrentEngineFeasibilityAnswers(optionalContext),
  };
}

function validateReadyHandoff(handoff, sufficiency) {
  if (!handoff || typeof handoff !== "object" || Array.isArray(handoff)) {
    return { ok: false, reasonCode: "invalid_handoff" };
  }
  if (handoff.source !== "guided_discovery") return { ok: false, reasonCode: "unsupported_handoff_source" };
  if (handoff.handoffReady !== true) return { ok: false, reasonCode: "handoff_not_ready" };
  if (handoff.evaluationReady !== true) return { ok: false, reasonCode: "handoff_evaluation_not_ready" };
  if (handoff.confirmationStatus !== "confirmed") return { ok: false, reasonCode: "understanding_not_confirmed" };
  if (Array.isArray(handoff.missingRequiredInformation) && handoff.missingRequiredInformation.length > 0) {
    return { ok: false, reasonCode: "missing_required_information" };
  }
  if (!sufficiency || typeof sufficiency !== "object" || Array.isArray(sufficiency)) {
    return { ok: false, reasonCode: "missing_sufficiency_status" };
  }
  if (sufficiency.status !== "ready_for_biv_draft") {
    return { ok: false, reasonCode: "sufficiency_not_ready" };
  }
  return { ok: true, reasonCode: "" };
}

function normalizeConfirmedUnderstanding(value = {}) {
  return {
    selectedIntent: cleanString(value.selectedIntent),
    coreOffering: cleanString(value.coreOffering),
    coreOfferingStatus: cleanString(value.coreOfferingStatus),
    selectedOperatingApproach: cleanString(value.selectedOperatingApproach),
    selectedOperatingApproaches: Array.isArray(value.selectedOperatingApproaches)
      ? value.selectedOperatingApproaches.map(cleanString).filter(Boolean)
      : [],
  };
}

function normalizeDownstreamClarifications(value = {}) {
  return {
    additionalIdeaContext: cleanString(value.additionalIdeaContext),
    targetCustomer: cleanString(value.targetCustomer),
    problem: cleanString(value.problem),
    monetization: cleanString(value.monetization),
  };
}

function normalizeOptionalContext(handoff = {}) {
  const source = {
    ...(handoff.optionalContext || {}),
    ...(handoff.downstreamClarifications || {}),
    ...(handoff.bivDraftInput || {}),
  };
  return optionalContextFields.reduce((context, field) => {
    const value = cleanString(source[field]);
    if (value) context[field] = value;
    return context;
  }, {});
}

function buildCurrentEngineFeasibilityAnswers(optionalContext = {}) {
  return ["country", "city", "firstProject", "userExperienceLevel", "decisionObjective"]
    .reduce((answers, field) => {
      if (cleanString(optionalContext[field])) answers[field] = cleanString(optionalContext[field]);
      return answers;
    }, {});
}

function buildCompatibility({ schemaReady, currentEngineInput = null } = {}) {
  const providedLegacyAnswers = currentEngineInput?.feasibilityAnswers || {};
  const blockingLegacyDependencies = legacyExecutionDependencies.filter((field) => !cleanString(providedLegacyAnswers[field]));
  return {
    schemaReady: Boolean(schemaReady),
    currentEngineExecutionReady: Boolean(schemaReady) && blockingLegacyDependencies.length === 0,
    blockingLegacyDependencies,
    notes: [
      "Canonical readiness is based on core BIV input fields only.",
      "Current-engine execution readiness still reflects legacy profile and classification-confirmation dependencies.",
    ],
  };
}

function isCoreSchemaReady(rawInput = {}) {
  return CORE_REQUIRED_FIELDS.every((field) => {
    const definition = inputSchema.find((item) => item.id === field);
    const value = cleanString(rawInput[field]);
    return value.length >= (definition?.minLength || 1);
  });
}

function cleanString(value = "") {
  return typeof value === "string" ? value.trim() : "";
}
