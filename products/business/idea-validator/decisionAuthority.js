import { buildEvidenceLedgerV1 } from "./evidenceLedger.js";
import { selectBusinessModelLensV1, validateBusinessModelLensSelectionV1 } from "./businessModelLenses.js";
import { buildAnalyticalPlanV1, validateAnalyticalPlanV1 } from "./analyticalPlan.js";
import { buildStructuredFindingsV1, validateStructuredFindingsV1 } from "./analyticalFindings.js";
import {
  SHADOW_DECISION_STATES,
  synthesizeDecisionV1,
  validateDecisionSynthesisV1,
} from "./decisionSynthesis.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";

export const BIV_DECISION_AUTHORITY_VERSION = "biv_decision_authority_v1";

export const BIV_DECISION_AUTHORITY_MODES = {
  LEGACY: "legacy",
  DUAL_RUN: "dual_run",
  V2_CANDIDATE: "v2_candidate",
};

export const BIV_DECISION_AUTHORITY_SOURCES = {
  LEGACY: "legacy",
  V2: "v2",
};

export const BIV_DECISION_DISAGREEMENT_CATEGORIES = {
  SAME_DIRECTION: "same_direction",
  V2_MORE_CONSERVATIVE: "v2_more_conservative",
  V2_MORE_POSITIVE: "v2_more_positive",
  MATERIALLY_DIFFERENT: "materially_different",
  LEGACY_CANNOT_EXPRESS_V2_STATE: "legacy_cannot_express_v2_state",
  V2_UNAVAILABLE: "v2_unavailable",
  FALLBACK_USED: "fallback_used",
};

const validModes = new Set(Object.values(BIV_DECISION_AUTHORITY_MODES));
const supportedV2States = new Set(Object.values(SHADOW_DECISION_STATES));

export function resolveDecisionAuthorityMode(value = "") {
  return validModes.has(value) ? value : BIV_DECISION_AUTHORITY_MODES.LEGACY;
}

export function resolveDecisionAuthorityModeFromEnv(env = {}) {
  return resolveDecisionAuthorityMode(env.BIV_DECISION_AUTHORITY);
}

export function executeBusinessIdeaValidationWithAuthority({
  authorityMode = "",
  env = {},
  v2Options = {},
  ...legacyInput
} = {}) {
  const mode = authorityMode || resolveDecisionAuthorityModeFromEnv(env);
  const legacyDecision = executeBusinessIdeaValidation(legacyInput);

  if (resolveDecisionAuthorityMode(mode) === BIV_DECISION_AUTHORITY_MODES.LEGACY) {
    return selectBusinessIdeaDecisionAuthorityV1({
      mode,
      legacyDecision,
    });
  }

  let v2Result = null;
  let v2Error = null;
  try {
    v2Result = buildAnalyticalCoreV2Decision({
      rawInput: legacyInput.rawInput || {},
      language: legacyInput.language || "en",
      classification: legacyDecision.orchestrationDecision?.classification || null,
      legacyDecision,
      ...v2Options,
    });
  } catch (error) {
    v2Error = error;
  }

  return selectBusinessIdeaDecisionAuthorityV1({
    mode,
    legacyDecision,
    v2Result,
    v2Error,
  });
}

export function selectBusinessIdeaDecisionAuthorityV1({
  mode = "",
  legacyDecision = null,
  v2Result = null,
  v2Error = null,
  fallbackRequested = false,
} = {}) {
  const resolvedMode = resolveDecisionAuthorityMode(mode);
  const legacySummary = summarizeLegacyDecision(legacyDecision);
  const v2Summary = summarizeV2Result(v2Result);
  const v2Validation = validateV2Result(v2Result);
  const fallbackReason = resolveFallbackReason({
    mode: resolvedMode,
    legacyDecision,
    v2Result,
    v2Error,
    v2Validation,
    fallbackRequested,
  });
  const fallbackUsed = Boolean(fallbackReason);
  const v2CanBeCandidate = resolvedMode === BIV_DECISION_AUTHORITY_MODES.V2_CANDIDATE && !fallbackUsed;
  const authoritativeSource = v2CanBeCandidate
    ? BIV_DECISION_AUTHORITY_SOURCES.V2
    : BIV_DECISION_AUTHORITY_SOURCES.LEGACY;
  const disagreement = classifyAuthorityDisagreement({
    mode: resolvedMode,
    fallbackUsed,
    legacySummary,
    v2Summary,
    v2Error,
  });

  return {
    version: BIV_DECISION_AUTHORITY_VERSION,
    mode: resolvedMode,
    authoritativeSource,
    authoritativeDecision: authoritativeSource === BIV_DECISION_AUTHORITY_SOURCES.V2
      ? v2Result.shadowDecision
      : legacyDecision,
    legacyDecision,
    ...(v2Result ? { v2Decision: v2Result.shadowDecision } : {}),
    fallbackAvailable: Boolean(legacyDecision),
    fallbackUsed,
    ...(fallbackReason ? { fallbackReason } : {}),
    disagreement,
    diagnostics: {
      legacyVerdict: legacySummary.verdict,
      legacyStatus: legacySummary.status,
      v2State: v2Summary.state,
      v2Confidence: v2Summary.confidence,
      primaryReasonFindingId: v2Summary.primaryReasonFindingId,
      disagreementCategory: disagreement.category,
      fallbackStatus: fallbackUsed ? "fallback_used" : "not_used",
    },
  };
}

export function buildAnalyticalCoreV2Decision({
  rawInput = {},
  originalIdea = "",
  confirmedUnderstanding = null,
  downstreamClarifications = null,
  optionalContext = null,
  classification = null,
  externalEvidence = [],
  additionalFindings = [],
  decisionObjective = "",
  language = "en",
  legacyDecision = null,
} = {}) {
  const evidenceLedger = buildEvidenceLedgerV1({
    rawInput,
    originalIdea,
    confirmedUnderstanding,
    downstreamClarifications,
    optionalContext,
    classification,
    externalEvidence,
  });
  const lensSelection = selectBusinessModelLensV1({
    rawInput,
    confirmedUnderstanding,
    classification,
    locale: language,
  });
  const analyticalPlan = buildAnalyticalPlanV1({ evidenceLedger, lensSelection });
  const baseFindings = buildStructuredFindingsV1({ evidenceLedger, lensSelection, analyticalPlan });
  const structuredFindings = {
    ...baseFindings,
    findings: [...baseFindings.findings, ...additionalFindings],
  };
  const shadowDecision = synthesizeDecisionV1({
    structuredFindings,
    evidenceLedger,
    lensSelection,
    decisionObjective,
    legacyVerdict: legacyDecision?.verdictKey || legacyDecision?.verdict || legacyDecision?.state || "",
  });

  return {
    evidenceLedger,
    lensSelection,
    analyticalPlan,
    structuredFindings,
    shadowDecision,
  };
}

export function validateDecisionAuthorityV1(result = {}) {
  const errors = [];
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return { ok: false, errors: ["authority result must be an object"] };
  }
  if (result.version !== BIV_DECISION_AUTHORITY_VERSION) errors.push("invalid version");
  if (!validModes.has(result.mode)) errors.push("invalid mode");
  if (!Object.values(BIV_DECISION_AUTHORITY_SOURCES).includes(result.authoritativeSource)) {
    errors.push("invalid authoritativeSource");
  }
  if (!result.authoritativeDecision) errors.push("authoritativeDecision is required");
  if (!result.legacyDecision) errors.push("legacyDecision is required");
  if (typeof result.fallbackAvailable !== "boolean") errors.push("fallbackAvailable must be boolean");
  if (typeof result.fallbackUsed !== "boolean") errors.push("fallbackUsed must be boolean");
  if (result.fallbackUsed && !result.fallbackReason) errors.push("fallbackReason required when fallback is used");
  if (!result.disagreement?.category) errors.push("disagreement category is required");
  if (!result.diagnostics?.disagreementCategory) errors.push("diagnostics disagreementCategory is required");
  if (result.authoritativeSource === BIV_DECISION_AUTHORITY_SOURCES.V2 && !result.v2Decision) {
    errors.push("v2Decision required when V2 is authoritative");
  }
  return { ok: errors.length === 0, errors };
}

function validateV2Result(v2Result) {
  if (!v2Result) return { ok: false, reason: "v2_unavailable" };
  if (!v2Result.shadowDecision) return { ok: false, reason: "v2_contract_invalid" };
  if (!supportedV2States.has(v2Result.shadowDecision.state)) return { ok: false, reason: "v2_unsupported_state" };
  if (validateBusinessModelLensSelectionV1(v2Result.lensSelection).ok !== true) return { ok: false, reason: "v2_lens_contract_invalid" };
  if (validateAnalyticalPlanV1(v2Result.analyticalPlan).ok !== true) return { ok: false, reason: "v2_plan_contract_invalid" };
  if (validateStructuredFindingsV1(v2Result.structuredFindings).ok !== true) return { ok: false, reason: "v2_findings_contract_invalid" };
  if (validateDecisionSynthesisV1(v2Result.shadowDecision).ok !== true) return { ok: false, reason: "v2_decision_contract_invalid" };
  if (v2Result.lensSelection.confidence === "low" && v2Result.lensSelection.requiresConfirmation) {
    return { ok: false, reason: "v2_low_confidence_review_required" };
  }
  return { ok: true, reason: "" };
}

function resolveFallbackReason({
  mode,
  legacyDecision,
  v2Result,
  v2Error,
  v2Validation,
  fallbackRequested,
}) {
  if (!legacyDecision) return "legacy_unavailable";
  if (mode === BIV_DECISION_AUTHORITY_MODES.LEGACY) return "";
  if (fallbackRequested) return "explicit_fallback_requested";
  if (v2Error) return "v2_error";
  if (!v2Result) return "v2_unavailable";
  if (!v2Validation.ok) return v2Validation.reason || "v2_contract_invalid";
  return "";
}

function classifyAuthorityDisagreement({
  mode,
  fallbackUsed,
  legacySummary,
  v2Summary,
}) {
  if (fallbackUsed) {
    return {
      category: BIV_DECISION_DISAGREEMENT_CATEGORIES.FALLBACK_USED,
      legacyDirection: legacySummary.direction,
      v2Direction: v2Summary.direction,
    };
  }
  if (mode === BIV_DECISION_AUTHORITY_MODES.LEGACY && !v2Summary.state) {
    return {
      category: BIV_DECISION_DISAGREEMENT_CATEGORIES.V2_UNAVAILABLE,
      legacyDirection: legacySummary.direction,
      v2Direction: "unknown",
    };
  }
  if (!v2Summary.state) {
    return {
      category: BIV_DECISION_DISAGREEMENT_CATEGORIES.V2_UNAVAILABLE,
      legacyDirection: legacySummary.direction,
      v2Direction: "unknown",
    };
  }
  if (legacySummary.direction === "unknown" && v2Summary.direction !== "unknown") {
    return {
      category: BIV_DECISION_DISAGREEMENT_CATEGORIES.LEGACY_CANNOT_EXPRESS_V2_STATE,
      legacyDirection: legacySummary.direction,
      v2Direction: v2Summary.direction,
    };
  }
  if (legacySummary.direction === v2Summary.direction) {
    return {
      category: BIV_DECISION_DISAGREEMENT_CATEGORIES.SAME_DIRECTION,
      legacyDirection: legacySummary.direction,
      v2Direction: v2Summary.direction,
    };
  }
  if (directionRank(v2Summary.direction) < directionRank(legacySummary.direction)) {
    return {
      category: BIV_DECISION_DISAGREEMENT_CATEGORIES.V2_MORE_CONSERVATIVE,
      legacyDirection: legacySummary.direction,
      v2Direction: v2Summary.direction,
    };
  }
  if (directionRank(v2Summary.direction) > directionRank(legacySummary.direction)) {
    return {
      category: BIV_DECISION_DISAGREEMENT_CATEGORIES.V2_MORE_POSITIVE,
      legacyDirection: legacySummary.direction,
      v2Direction: v2Summary.direction,
    };
  }
  return {
    category: BIV_DECISION_DISAGREEMENT_CATEGORIES.MATERIALLY_DIFFERENT,
    legacyDirection: legacySummary.direction,
    v2Direction: v2Summary.direction,
  };
}

function summarizeLegacyDecision(legacyDecision) {
  const verdict = legacyDecision?.verdictKey || legacyDecision?.verdict || "";
  const status = legacyDecision?.evaluationStatus || legacyDecision?.journeyState || legacyDecision?.route || legacyDecision?.state || "";
  return {
    verdict,
    status,
    direction: normalizeLegacyDirection({ verdict, status }),
  };
}

function summarizeV2Result(v2Result) {
  const decision = v2Result?.shadowDecision || {};
  return {
    state: decision.state || "",
    confidence: decision.confidence || "",
    primaryReasonFindingId: decision.primaryReasonFindingId || "",
    direction: normalizeV2Direction(decision.state),
  };
}

function normalizeLegacyDirection({ verdict = "", status = "" }) {
  const text = `${verdict} ${status}`;
  if (/good|strong|proceed|viable|success|evaluated|normal_evaluation/i.test(text)) return "positive";
  if (/weak|unclear|partial|test|clarification|followup|follow_up|guided|needs_clarification/i.test(text)) return "cautious";
  if (/invalid|ineligible|do_not|do not|reject|blocked/i.test(text)) return "negative";
  return "unknown";
}

function normalizeV2Direction(state = "") {
  if (state === SHADOW_DECISION_STATES.PROCEED) return "positive";
  if ([SHADOW_DECISION_STATES.TEST_FIRST, SHADOW_DECISION_STATES.REVISE, SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION].includes(state)) {
    return "cautious";
  }
  if (state === SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET) return "negative";
  return "unknown";
}

function directionRank(direction = "") {
  return {
    negative: 0,
    cautious: 1,
    positive: 2,
    unknown: 1,
  }[direction] ?? 1;
}
