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

const genericReadinessModules = new Set([
  "customer_stakeholders",
  "implementation",
]);

const materialLensFindingPattern = /^finding_(real_estate|marketplace|retail|manufacturing|service|saas|food|wholesale|professional|expansion)_/;

const decisionDimensionPriority = {
  proceed: [
    "opportunity_attractiveness",
    "execution_feasibility",
    "evidence_confidence",
    "risk_exposure",
    "information_readiness",
  ],
  test_first: [
    "evidence_confidence",
    "opportunity_attractiveness",
    "execution_feasibility",
    "risk_exposure",
    "information_readiness",
  ],
  revise: [
    "execution_feasibility",
    "risk_exposure",
    "economic_feasibility",
    "opportunity_attractiveness",
    "evidence_confidence",
    "information_readiness",
  ],
  do_not_proceed_yet: [
    "risk_exposure",
    "execution_feasibility",
    "opportunity_attractiveness",
    "evidence_confidence",
    "information_readiness",
  ],
  insufficient_information: [
    "information_readiness",
    "evidence_confidence",
    "opportunity_attractiveness",
    "execution_feasibility",
    "risk_exposure",
  ],
};

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
  if (Object.values(dimensionAssessments).every((assessment) => assessment.status === "supported")) {
    return SHADOW_DECISION_STATES.PROCEED;
  }
  if (testAssumptionFindingIds.length) return SHADOW_DECISION_STATES.TEST_FIRST;
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
        : dimension === "information_readiness" && criticalUnknownIds.length
          ? "uncertain"
          : hasSupport
            ? "supported"
            : hasUnknown
              ? "uncertain"
              : dimensionFindings.length
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
  if (state === SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET) {
    return chooseHighestPriorityFinding({
      state,
      findings: findings.filter((finding) => blockerFindingIds.includes(finding.id)),
    })?.id || blockerFindingIds[0] || firstFindingId(findings);
  }
  if (state === SHADOW_DECISION_STATES.REVISE) {
    return chooseHighestPriorityFinding({
      state,
      findings: findings.filter((finding) => structuralRevisionFindingIds.includes(finding.id)),
    })?.id || structuralRevisionFindingIds[0] || firstFindingId(findings);
  }
  if (state === SHADOW_DECISION_STATES.TEST_FIRST) {
    return chooseHighestPriorityFinding({
      state,
      findings: findings.filter((finding) => testAssumptionFindingIds.includes(finding.id)),
    })?.id || firstFindingId(findings);
  }
  if (state === SHADOW_DECISION_STATES.PROCEED) {
    return chooseHighestPriorityFinding({
      state,
      findings: findings.filter((finding) => [FINDING_EFFECTS.SUPPORTS, FINDING_EFFECTS.NEUTRAL].includes(finding.effect)),
    })?.id || firstFindingId(findings);
  }
  return findings.find((finding) => coreReadinessFindingIds.has(finding.id) && finding.effect === FINDING_EFFECTS.UNKNOWN)?.id || firstFindingId(findings);
}

function chooseSupportingFindingIds({ state, findings, primaryReasonFindingId }) {
  const primary = findings.find((finding) => finding.id === primaryReasonFindingId);
  if (state === SHADOW_DECISION_STATES.PROCEED) {
    return rankFindingsForDecision({
      state,
      findings: findings.filter((finding) =>
        finding.id !== primaryReasonFindingId &&
        [FINDING_EFFECTS.SUPPORTS, FINDING_EFFECTS.NEUTRAL].includes(finding.effect)
      ),
    })
      .filter((finding) => !isDuplicateSupportFinding({ primary, candidate: finding }))
      .map((finding) => finding.id)
      .slice(0, 5);
  }
  return rankFindingsForDecision({
    state,
    findings: findings.filter((finding) => finding.id !== primaryReasonFindingId && finding.severity === "material"),
  })
    .filter((finding) => !isDuplicateSupportFinding({ primary, candidate: finding }))
    .map((finding) => finding.id)
    .slice(0, 6);
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
  const evidenceText = describeEvidenceStrength(primary);
  const claim = primary?.claim || "No primary finding available.";
  if (state === SHADOW_DECISION_STATES.PROCEED) {
    return `The next staged commitment is justified because ${claim} This is supported by ${evidenceText}, and it does not guarantee full-scale success. Lens: ${lens}${objectiveText}.`;
  }
  if (state === SHADOW_DECISION_STATES.TEST_FIRST) {
    return `The idea is coherent enough to test, but ${claim} This assumption is decision-driving because it determines whether the model can advance beyond owner belief. Lens: ${lens}${objectiveText}.`;
  }
  if (state === SHADOW_DECISION_STATES.REVISE) {
    return `The current model should be revised because ${claim} This is a structural issue, not just a request for more information. Lens: ${lens}${objectiveText}.`;
  }
  if (state === SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET) {
    return `A larger commitment is not justified because ${claim} This blocker or adverse evidence must be resolved before the idea can be relied on. Lens: ${lens}${objectiveText}.`;
  }
  return `The idea cannot be meaningfully judged yet because ${claim} The missing foundation prevents a responsible decision. Lens: ${lens}${objectiveText}.`;
}

function buildNextDecisionAction({ state, primaryReasonFindingId, findings, lensSelection }) {
  const primary = findings.find((finding) => finding.id === primaryReasonFindingId);
  if (state === SHADOW_DECISION_STATES.PROCEED) {
    return buildProceedAction({ primary, lens: lensSelection.primaryLens || "generic" });
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
    service: "Test paid repeat demand, delivery capacity, and service quality before adding fixed overhead.",
    saas_software: "Test activation, retention, and payment behavior before expanding product scope.",
    food_beverage: "Test repeat demand, throughput, waste, and site economics before larger location commitment.",
    wholesale_import_distribution: "Test repeat orders, supplier terms, margin, and working-capital timing before holding significant stock.",
    professional_services: "Test retainer demand, delivery capacity, and quality control before adding delivery commitments.",
    existing_business_expansion: "Test incremental demand, spare capacity, and cannibalization risk before expanding beyond the core business.",
  };
  const assumption = primary?.claim || "the critical assumption";
  const evidence = primary?.whatWouldChangeIt || "behavioral evidence from the relevant customer or operating path";
  return `${lensActions[lens] || "Run a focused test before a larger commitment."} Assumption: ${assumption} Evidence needed: ${evidence}`;
}

function buildWhatWouldChangeDecision({ state, primaryReasonFindingId, findings }) {
  const primary = findings.find((finding) => finding.id === primaryReasonFindingId);
  const fallback = primary?.whatWouldChangeIt || "More reliable evidence tied to the primary finding.";
  if (state === SHADOW_DECISION_STATES.PROCEED) return `Downgrade if the supporting evidence weakens or a material blocker appears. Watch the most material condition: ${fallback}`;
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

function chooseHighestPriorityFinding({ state, findings }) {
  return rankFindingsForDecision({ state, findings })[0] || null;
}

function rankFindingsForDecision({ state, findings }) {
  return [...findings].sort((a, b) => findingPriorityValue({ state, finding: b }) - findingPriorityValue({ state, finding: a }));
}

function findingPriorityValue({ state, finding }) {
  return [
    statePriorityValue({ state, finding }),
    testAssumptionPriorityValue({ state, finding }),
    severityPriorityValue(finding.severity),
    effectPriorityValue({ state, effect: finding.effect }),
    dimensionPriorityValue({ state, dimension: finding.dimension }),
    lensSpecificPriorityValue(finding),
    evidenceStrengthPriorityValue(finding.evidenceIds),
    confidencePriorityValue(finding.confidence),
    genericReadinessPenalty(finding),
  ].reduce((total, value) => total + value, 0);
}

function testAssumptionPriorityValue({ state, finding }) {
  if (state !== SHADOW_DECISION_STATES.TEST_FIRST) return 0;
  const preferredPatterns = [
    /_occupancy_|_utilization_/,
    /marketplace_supply_side|provider/,
    /marketplace_liquidity/,
    /retail_repeat_purchase/,
    /manufacturing_equipment_capacity|manufacturing_production_capacity/,
    /service_billable_utilization|service_repeat_demand/,
    /saas_activation_retention/,
    /food_location_throughput|food_repeat_demand/,
    /wholesale_supplier_concentration|wholesale_customer_order/,
    /professional_expertise|professional_billable/,
    /expansion_spare_capacity|expansion_baseline/,
    /finding_demand_/,
  ];
  const index = preferredPatterns.findIndex((pattern) => pattern.test(finding.id));
  return index === -1 ? 0 : (preferredPatterns.length - index) * 12;
}

function statePriorityValue({ state, finding }) {
  if (state === SHADOW_DECISION_STATES.PROCEED) {
    if (![FINDING_EFFECTS.SUPPORTS, FINDING_EFFECTS.NEUTRAL].includes(finding.effect)) return -100;
    if (genericReadinessModules.has(finding.module) && finding.dimension === "information_readiness") return 0;
    return finding.effect === FINDING_EFFECTS.SUPPORTS ? 35 : 28;
  }
  if (state === SHADOW_DECISION_STATES.TEST_FIRST) {
    if (![FINDING_EFFECTS.UNKNOWN, FINDING_EFFECTS.NEUTRAL].includes(finding.effect)) return -30;
    return isMissingInformationFinding(finding) ? -25 : 30;
  }
  if (state === SHADOW_DECISION_STATES.REVISE) {
    return [FINDING_EFFECTS.CONTRADICTS, FINDING_EFFECTS.WEAKENS].includes(finding.effect) ? 35 : -30;
  }
  if (state === SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET) {
    return finding.severity === "critical" && [FINDING_EFFECTS.CONTRADICTS, FINDING_EFFECTS.WEAKENS].includes(finding.effect) ? 45 : -30;
  }
  return isMissingInformationFinding(finding) ? 35 : 0;
}

function severityPriorityValue(severity = "") {
  return {
    critical: 30,
    material: 20,
    informational: 8,
  }[severity] || 0;
}

function effectPriorityValue({ state, effect }) {
  if (state === SHADOW_DECISION_STATES.PROCEED) {
    return effect === FINDING_EFFECTS.SUPPORTS ? 18 : effect === FINDING_EFFECTS.NEUTRAL ? 10 : 0;
  }
  if (state === SHADOW_DECISION_STATES.TEST_FIRST) return [FINDING_EFFECTS.UNKNOWN, FINDING_EFFECTS.NEUTRAL].includes(effect) ? 18 : 0;
  if ([SHADOW_DECISION_STATES.REVISE, SHADOW_DECISION_STATES.DO_NOT_PROCEED_YET].includes(state)) {
    return effect === FINDING_EFFECTS.CONTRADICTS ? 20 : effect === FINDING_EFFECTS.WEAKENS ? 16 : 0;
  }
  return effect === FINDING_EFFECTS.UNKNOWN ? 16 : 0;
}

function dimensionPriorityValue({ state, dimension }) {
  const index = (decisionDimensionPriority[state] || []).indexOf(dimension);
  return index === -1 ? 0 : (decisionDimensionPriority[state].length - index) * 6;
}

function lensSpecificPriorityValue(finding) {
  return materialLensFindingPattern.test(finding.id) ? 16 : 0;
}

function evidenceStrengthPriorityValue(evidenceIds = []) {
  const joined = evidenceIds.join(" ").toLowerCase();
  if (/repeat|renew|retention|retainer|deposit|paid|order|verified|records/.test(joined)) return 22;
  if (/pilot|behavior|usage|capacity|supplier_terms|quote/.test(joined)) return 18;
  if (/external_evidence/.test(joined)) return 14;
  if (/owner_data/.test(joined)) return 6;
  return 0;
}

function confidencePriorityValue(confidence = "") {
  return {
    high: 10,
    medium: 6,
    low: 2,
  }[confidence] || 0;
}

function genericReadinessPenalty(finding) {
  if (coreReadinessFindingIds.has(finding.id)) return -35;
  if (materialLensFindingPattern.test(finding.id)) return 0;
  if (genericReadinessModules.has(finding.module) && finding.dimension === "information_readiness") return -18;
  return 0;
}

function isDuplicateSupportFinding({ primary, candidate }) {
  if (!primary || !candidate) return false;
  if (primary.id === candidate.id) return true;
  return claimFamily(primary.id) && claimFamily(primary.id) === claimFamily(candidate.id);
}

function claimFamily(id = "") {
  return id
    .replace(/^finding_/, "")
    .replace(/_(readiness|supported|dependency|evidence|unknown|conflict|failure|blocker|signal)$/, "");
}

function describeEvidenceStrength(finding) {
  const evidenceIds = finding?.evidenceIds || [];
  const joined = evidenceIds.join(" ").toLowerCase();
  if (/repeat|renew|retention|retainer|deposit|paid|order/.test(joined)) return "repeated or paid behavioral evidence";
  if (/pilot|behavior|usage|capacity|verified|records/.test(joined)) return "behavioral operating evidence";
  if (/external_evidence/.test(joined)) return "external or owner-supplied factual evidence";
  if (/owner_data/.test(joined)) return "owner-provided operating facts";
  return "the structured findings available at this stage";
}

function buildProceedAction({ primary, lens }) {
  const lensActions = {
    service: "Proceed to a controlled service-capacity pilot, not broad hiring or fixed overhead.",
    saas_software: "Proceed to the next commercial validation stage focused on retained paid usage.",
    food_beverage: "Proceed only to a limited operating test that protects cash, waste, and throughput risk.",
    wholesale_import_distribution: "Proceed to supplier negotiation or a limited first order, not major inventory exposure.",
    professional_services: "Proceed to a limited client-capacity expansion while protecting delivery quality.",
    existing_business_expansion: "Proceed to a limited incremental expansion that protects the existing core business.",
    real_estate: "Proceed only to lease or site negotiation subject to verified occupancy and site economics.",
    marketplace_platform: "Proceed to a controlled marketplace pilot with both sides active in the same transaction flow.",
    retail_trading: "Proceed to a limited inventory test tied to repeat purchasing and supplier terms.",
    manufacturing_industrial: "Proceed to a limited production or procurement commitment tied to buyer and capacity evidence.",
  };
  const watch = primary?.whatWouldChangeIt || "new contradictory evidence";
  return `${lensActions[lens] || "Proceed only to the next staged commitment, keeping it reversible."} Continue monitoring the downgrade condition: ${watch}`;
}
