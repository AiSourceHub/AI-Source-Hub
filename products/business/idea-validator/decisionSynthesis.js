import { BIV_STRUCTURED_FINDINGS_VERSION, FINDING_EFFECTS } from "./analyticalFindings.js";

export const BIV_DECISION_SYNTHESIS_VERSION = "biv_decision_synthesis_v1";

export const SHADOW_DECISION_STATES = {
  PROCEED: "proceed",
  TEST_FIRST: "test_first",
  REVISE: "revise",
  DO_NOT_PROCEED_YET: "do_not_proceed_yet",
  INSUFFICIENT_INFORMATION: "insufficient_information",
};

export const DECISION_CONFIDENCE = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const decisionDimensions = [
  "information_readiness",
  "opportunity_attractiveness",
  "execution_feasibility",
  "risk_exposure",
  "evidence_confidence",
];

const coreReadinessFindingIds = new Set([
  "finding_target_customer_readiness",
  "finding_problem_hypothesis_readiness",
  "finding_revenue_mechanism_readiness",
]);

const structuralModules = new Set([
  "revenue_model",
  "economic_feasibility",
  "operational_capacity",
  "risk_sensitivity",
  "customer_stakeholders",
]);

export function synthesizeDecisionV1({
  structuredFindings = {},
  evidenceLedger = {},
  lensSelection = {},
  decisionObjective = "",
  legacyVerdict = "",
} = {}) {
  const findings = Array.isArray(structuredFindings.findings) ? structuredFindings.findings : [];
  const unknowns = Array.isArray(evidenceLedger.unknowns) ? evidenceLedger.unknowns : [];
  const criticalUnknownIds = classifyCriticalUnknownIds({ findings, unknowns });
  const blockerFindingIds = classifyBlockerFindingIds(findings);
  const structuralRevisionFindingIds = classifyStructuralRevisionFindingIds(findings);
  const testAssumptionFindingIds = classifyTestableAssumptionFindingIds(findings);
  const dimensionAssessments = buildDimensionAssessments({ findings, criticalUnknownIds, blockerFindingIds });
  const state = selectDecisionState({
    criticalUnknownIds,
    blockerFindingIds,
    structuralRevisionFindingIds,
    testAssumptionFindingIds,
    dimensionAssessments,
  });
  const primaryReasonFindingId = choosePrimaryReasonFindingId({
    state,
    findings,
    blockerFindingIds,
    structuralRevisionFindingIds,
    testAssumptionFindingIds,
    criticalUnknownIds,
  });
  const supportingFindingIds = chooseSupportingFindingIds({ state, findings, primaryReasonFindingId });
  const confidence = deriveDecisionConfidence({
    findings,
    state,
    criticalUnknownIds,
    blockerFindingIds,
    dimensionAssessments,
  });
  const rationale = buildRationale({ state, primaryReasonFindingId, findings, lensSelection, decisionObjective });
  const nextDecisionAction = buildNextDecisionAction({ state, primaryReasonFindingId, findings, lensSelection });
  const whatWouldChangeDecision = buildWhatWouldChangeDecision({ state, primaryReasonFindingId, findings });

  return {
    version: BIV_DECISION_SYNTHESIS_VERSION,
    state,
    primaryReasonFindingId,
    supportingFindingIds,
    criticalUnknownIds,
    blockerFindingIds,
    confidence,
    dimensionAssessments,
    rationale,
    whatWouldChangeDecision,
    nextDecisionAction,
    authority: {
      shadowOnly: true,
      determinesProductionVerdict: false,
      affectsScore: false,
      affectsReport: false,
      changesRuntimeBehavior: false,
    },
    ...(legacyVerdict ? { comparisonToLegacy: compareLegacyDecision({ legacyVerdict, shadowDecisionState: state }) } : {}),
  };
}

export function validateDecisionSynthesisV1(decision = {}) {
  const errors = [];
  if (!decision || typeof decision !== "object" || Array.isArray(decision)) {
    return { ok: false, errors: ["decision must be an object"] };
  }
  if (decision.version !== BIV_DECISION_SYNTHESIS_VERSION) errors.push("invalid version");
  if (!Object.values(SHADOW_DECISION_STATES).includes(decision.state)) errors.push("invalid state");
  for (const field of ["primaryReasonFindingId", "rationale", "whatWouldChangeDecision", "nextDecisionAction", "confidence"]) {
    if (!decision[field]) errors.push(`missing ${field}`);
  }
  if (!Array.isArray(decision.supportingFindingIds)) errors.push("supportingFindingIds must be an array");
  if (!Array.isArray(decision.criticalUnknownIds)) errors.push("criticalUnknownIds must be an array");
  if (!Array.isArray(decision.blockerFindingIds)) errors.push("blockerFindingIds must be an array");
  if (!Object.values(DECISION_CONFIDENCE).includes(decision.confidence)) errors.push("invalid confidence");
  if (!decision.dimensionAssessments || typeof decision.dimensionAssessments !== "object" || Array.isArray(decision.dimensionAssessments)) {
    errors.push("dimensionAssessments must be an object");
  }
  for (const dimension of decisionDimensions) {
    if (!decision.dimensionAssessments?.[dimension]) errors.push(`missing dimension ${dimension}`);
  }
  if (decision.authority?.shadowOnly !== true) errors.push("decision must be shadow-only");
  if (decision.authority?.determinesProductionVerdict !== false) errors.push("decision must not determine production verdict");
  if (decision.authority?.affectsScore !== false) errors.push("decision must not affect score");
  if (decision.authority?.affectsReport !== false) errors.push("decision must not affect report");
  if (decision.authority?.changesRuntimeBehavior !== false) errors.push("decision must not change runtime behavior");
  return { ok: errors.length === 0, errors };
}

export function compareLegacyDecision({ legacyVerdict = "", shadowDecisionState = "" } = {}) {
  const legacyNormalized = normalizeLegacyVerdict(legacyVerdict);
  const shadowNormalized = normalizeShadowDecision(shadowDecisionState);
  return {
    legacyVerdict,
    shadowDecision: shadowDecisionState,
    agreesAtHighLevel: legacyNormalized !== "unknown" && legacyNormalized === shadowNormalized,
    keyDifference: buildComparisonDifference(legacyNormalized, shadowNormalized),
  };
}

function selectDecisionState({
  criticalUnknownIds,
  blockerFindingIds,
  structuralRevisionFindingIds,
  testAssumptionFindingIds,
  dimensionAssessments,
}) {
  if (blockerFindingIds.length) return SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET;
  if (criticalUnknownIds.length) return SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION;
  if (structuralRevisionFindingIds.length) return SHADOW_DECISION_STATES.REVISE;
  if (testAssumptionFindingIds.length) return SHADOW_DECISION_STATES.TEST_FIRST;
  if (Object.values(dimensionAssessments).every((assessment) => assessment.status === "supported")) {
    return SHADOW_DECISION_STATES.PROCEED;
  }
  return SHADOW_DECISION_STATES.TEST_FIRST;
}

function classifyCriticalUnknownIds({ findings, unknowns }) {
  const findingUnknowns = findings
    .filter((finding) =>
      finding.effect === FINDING_EFFECTS.UNKNOWN &&
      finding.severity === "material" &&
      coreReadinessFindingIds.has(finding.id)
    )
    .flatMap((finding) => finding.unknownIds || []);
  const coreUnknowns = unknowns
    .filter((unknown) => /target_customer|customer_problem|planned_revenue_mechanism|business_idea/i.test(unknown.topic || ""))
    .map((unknown) => unknown.id);
  return [...new Set([...findingUnknowns, ...coreUnknowns])];
}

function classifyBlockerFindingIds(findings) {
  return findings
    .filter((finding) =>
      finding.severity === "critical" &&
      [FINDING_EFFECTS.CONTRADICTS, FINDING_EFFECTS.WEAKENS].includes(finding.effect) &&
      !isMissingInformationFinding(finding)
    )
    .map((finding) => finding.id);
}

function classifyStructuralRevisionFindingIds(findings) {
  return findings
    .filter((finding) =>
      finding.severity === "material" &&
      [FINDING_EFFECTS.CONTRADICTS, FINDING_EFFECTS.WEAKENS].includes(finding.effect) &&
      structuralModules.has(finding.module) &&
      !isMissingInformationFinding(finding)
    )
    .map((finding) => finding.id);
}

function classifyTestableAssumptionFindingIds(findings) {
  return findings
    .filter((finding) =>
      finding.severity === "material" &&
      [FINDING_EFFECTS.UNKNOWN, FINDING_EFFECTS.NEUTRAL].includes(finding.effect) &&
      !coreReadinessFindingIds.has(finding.id) &&
      !isMissingInformationFinding(finding)
    )
    .map((finding) => finding.id);
}

function buildDimensionAssessments({ findings, criticalUnknownIds, blockerFindingIds }) {
  return Object.fromEntries(decisionDimensions.map((dimension) => {
    const dimensionFindings = findings.filter((finding) => finding.dimension === dimension);
    const hasBlocker = dimensionFindings.some((finding) => blockerFindingIds.includes(finding.id));
    const hasContradiction = dimensionFindings.some((finding) => finding.effect === FINDING_EFFECTS.CONTRADICTS);
    const hasWeakness = dimensionFindings.some((finding) => finding.effect === FINDING_EFFECTS.WEAKENS);
    const hasUnknown = dimensionFindings.some((finding) => finding.effect === FINDING_EFFECTS.UNKNOWN);
    const hasSupport = dimensionFindings.some((finding) => finding.effect === FINDING_EFFECTS.SUPPORTS);
    const status = hasBlocker || hasContradiction
      ? "contradicted"
      : hasWeakness
        ? "weak"
        : hasUnknown || (dimension === "information_readiness" && criticalUnknownIds.length)
          ? "uncertain"
          : hasSupport || dimensionFindings.length
            ? "supported"
            : "not_assessable";
    return [dimension, {
      status,
      findingIds: dimensionFindings.map((finding) => finding.id),
    }];
  }));
}

function choosePrimaryReasonFindingId({
  state,
  findings,
  blockerFindingIds,
  structuralRevisionFindingIds,
  testAssumptionFindingIds,
}) {
  if (state === SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET) return blockerFindingIds[0] || firstFindingId(findings);
  if (state === SHADOW_DECISION_STATES.REVISE) return structuralRevisionFindingIds[0] || firstFindingId(findings);
  if (state === SHADOW_DECISION_STATES.TEST_FIRST) return chooseLensSpecificTestFinding(findings, testAssumptionFindingIds) || firstFindingId(findings);
  if (state === SHADOW_DECISION_STATES.PROCEED) return findings.find((finding) => finding.effect === FINDING_EFFECTS.SUPPORTS)?.id || firstFindingId(findings);
  return findings.find((finding) => coreReadinessFindingIds.has(finding.id) && finding.effect === FINDING_EFFECTS.UNKNOWN)?.id || firstFindingId(findings);
}

function chooseSupportingFindingIds({ state, findings, primaryReasonFindingId }) {
  const materialIds = findings
    .filter((finding) => finding.id !== primaryReasonFindingId && finding.severity === "material")
    .map((finding) => finding.id);
  if (state === SHADOW_DECISION_STATES.PROCEED) {
    return findings
      .filter((finding) => finding.id !== primaryReasonFindingId && finding.effect === FINDING_EFFECTS.SUPPORTS)
      .map((finding) => finding.id)
      .slice(0, 5);
  }
  return materialIds.slice(0, 6);
}

function chooseLensSpecificTestFinding(findings, testAssumptionFindingIds) {
  const preferredPatterns = [
    /^finding_real_estate_/,
    /^finding_marketplace_/,
    /^finding_retail_/,
    /^finding_manufacturing_/,
    /^finding_demand_/,
  ];
  for (const pattern of preferredPatterns) {
    const match = testAssumptionFindingIds.find((id) => pattern.test(id));
    if (match) return match;
  }
  return testAssumptionFindingIds[0] || "";
}

function deriveDecisionConfidence({ findings, state, criticalUnknownIds, blockerFindingIds, dimensionAssessments }) {
  const externalEvidenceCount = findings.reduce((count, finding) =>
    count + (finding.evidenceIds || []).filter((id) => id.includes("external_evidence")).length, 0);
  const contradictedCount = Object.values(dimensionAssessments).filter((assessment) => assessment.status === "contradicted").length;
  const uncertainCount = Object.values(dimensionAssessments).filter((assessment) => assessment.status === "uncertain").length;
  if (blockerFindingIds.length || state === SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET) return contradictedCount ? "medium" : "low";
  if (criticalUnknownIds.length >= 2) return "low";
  if (externalEvidenceCount >= 2 && uncertainCount === 0) return "high";
  if (externalEvidenceCount >= 1 && criticalUnknownIds.length === 0) return "medium";
  return state === SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION ? "low" : "medium";
}

function buildRationale({ state, primaryReasonFindingId, findings, lensSelection, decisionObjective }) {
  const primary = findings.find((finding) => finding.id === primaryReasonFindingId);
  const lens = lensSelection.primaryLens || "generic";
  const objectiveText = decisionObjective ? ` for the ${decisionObjective} objective` : "";
  const prefix = {
    proceed: "Evidence is sufficient for the next stage, while remaining conditional.",
    test_first: "The main business hypothesis is identifiable, but a high-impact assumption should be tested first.",
    revise: "The current model shows a structural issue that should be revised before relying on the decision.",
    do_not_proceed_yet: "A material blocker is present, so a larger commitment is not justified yet.",
    insufficient_information: "The basic commercial foundation is missing, so the idea itself cannot yet be judged.",
  }[state];
  return `${prefix} Primary basis: ${primary?.claim || "No primary finding available."} Lens: ${lens}${objectiveText}.`;
}

function buildNextDecisionAction({ state, primaryReasonFindingId, findings, lensSelection }) {
  const primary = findings.find((finding) => finding.id === primaryReasonFindingId);
  if (state === SHADOW_DECISION_STATES.PROCEED) {
    return `Proceed only to the next staged commitment while monitoring: ${primary?.whatWouldChangeIt || "new contradictory evidence"}.`;
  }
  if (state === SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION) {
    return `Collect the missing owner inputs first: ${primary?.whatWouldChangeIt || "target customer, problem, and revenue mechanism"}.`;
  }
  if (state === SHADOW_DECISION_STATES.REVISE) {
    return `Revise the model around this issue, then retest the changed assumption: ${primary?.whatWouldChangeIt || "evidence that resolves the structural issue"}.`;
  }
  if (state === SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET) {
    return `Stop larger commitment until this blocker is resolved with verified evidence: ${primary?.whatWouldChangeIt || "blocker resolution evidence"}.`;
  }
  return buildTestFirstAction({ primary, lens: lensSelection.primaryLens || "generic" });
}

function buildTestFirstAction({ primary, lens }) {
  const lensActions = {
    real_estate: "Test occupancy, location demand, and site economics before lease or property commitment.",
    marketplace_platform: "Test both customer demand and provider participation in the same matching flow before building scale.",
    retail_trading: "Test repeat purchasing, supplier terms, and margin assumptions before holding significant inventory.",
    manufacturing_industrial: "Test equipment/capacity assumptions and buyer procurement evidence before major setup cost.",
  };
  const assumption = primary?.claim || "the critical assumption";
  const evidence = primary?.whatWouldChangeIt || "behavioral evidence from the relevant customer or operating path";
  return `${lensActions[lens] || "Run a focused test before a larger commitment."} Assumption: ${assumption} Evidence needed: ${evidence}`;
}

function buildWhatWouldChangeDecision({ state, primaryReasonFindingId, findings }) {
  const primary = findings.find((finding) => finding.id === primaryReasonFindingId);
  const fallback = primary?.whatWouldChangeIt || "More reliable evidence tied to the primary finding.";
  if (state === SHADOW_DECISION_STATES.PROCEED) return `Downgrade if new evidence contradicts the primary assumption or exposes a blocker. Watch: ${fallback}`;
  if (state === SHADOW_DECISION_STATES.TEST_FIRST) return `Move toward proceed if the test produces credible supportive evidence. Reconsider or revise if it fails. Evidence: ${fallback}`;
  if (state === SHADOW_DECISION_STATES.REVISE) return `A revised model with evidence resolving the structural issue. Evidence: ${fallback}`;
  if (state === SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET) return `Verified resolution of the blocker. Evidence: ${fallback}`;
  return `Clear owner inputs and evidence that resolve the critical unknown. Evidence: ${fallback}`;
}

function normalizeLegacyVerdict(verdict = "") {
  if (/good|strong|proceed|viable/i.test(verdict)) return "positive";
  if (/weak|unclear|partial|test/i.test(verdict)) return "cautious";
  if (/invalid|ineligible|do_not|do not|reject/i.test(verdict)) return "negative";
  return "unknown";
}

function normalizeShadowDecision(state = "") {
  if (state === SHADOW_DECISION_STATES.PROCEED) return "positive";
  if ([SHADOW_DECISION_STATES.TEST_FIRST, SHADOW_DECISION_STATES.REVISE, SHADOW_DECISION_STATES.INSUFFICIENT_INFORMATION].includes(state)) return "cautious";
  if (state === SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET) return "negative";
  return "unknown";
}

function buildComparisonDifference(legacyNormalized, shadowNormalized) {
  if (legacyNormalized === "unknown") return "Legacy verdict could not be normalized for comparison.";
  if (legacyNormalized === shadowNormalized) return "Legacy and shadow decision point in the same broad direction.";
  return `Legacy reads as ${legacyNormalized}; shadow synthesis reads as ${shadowNormalized}.`;
}

function isMissingInformationFinding(finding) {
  return coreReadinessFindingIds.has(finding.id);
}

function firstFindingId(findings) {
  return findings[0]?.id || "no_structured_finding";
}
