import {
  BIV_DECISION_AUTHORITY_MODES,
  executeBusinessIdeaValidationWithAuthority,
} from "./decisionAuthority.js";

export const BIV_RUNTIME_AUTHORITY_MODES = {
  LEGACY: BIV_DECISION_AUTHORITY_MODES.LEGACY,
  DUAL_RUN: BIV_DECISION_AUTHORITY_MODES.DUAL_RUN,
};

const allowedRuntimeModes = new Set(Object.values(BIV_RUNTIME_AUTHORITY_MODES));

export function resolveRuntimeDecisionAuthorityMode({ authorityMode = "", env = {} } = {}) {
  const configuredMode = authorityMode || env.VITE_BIV_DECISION_AUTHORITY || env.BIV_DECISION_AUTHORITY || "";
  return allowedRuntimeModes.has(configuredMode)
    ? configuredMode
    : BIV_RUNTIME_AUTHORITY_MODES.LEGACY;
}

export function executeBusinessIdeaValidationRuntime({
  authorityMode = "",
  env = {},
  v2Options = {},
  ...legacyInput
} = {}) {
  const mode = resolveRuntimeDecisionAuthorityMode({ authorityMode, env });
  const authorityResult = executeBusinessIdeaValidationWithAuthority({
    ...legacyInput,
    authorityMode: mode,
    v2Options,
  });

  return attachAuthorityMetadata(authorityResult.authoritativeDecision, authorityResult);
}

function attachAuthorityMetadata(publicResult = {}, authorityResult = {}) {
  return {
    ...publicResult,
    authority: {
      mode: authorityResult.mode || BIV_RUNTIME_AUTHORITY_MODES.LEGACY,
      authoritativeSource: authorityResult.authoritativeSource || "legacy",
      v2State: authorityResult.diagnostics?.v2State || "",
      v2Confidence: authorityResult.diagnostics?.v2Confidence || "",
      primaryReasonFindingId: authorityResult.diagnostics?.primaryReasonFindingId || "",
      disagreement: authorityResult.diagnostics?.disagreementCategory || "",
      fallbackUsed: Boolean(authorityResult.fallbackUsed),
      fallbackReason: authorityResult.fallbackReason || "",
    },
  };
}
