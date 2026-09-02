import { BIV_EVIDENCE_LEDGER_VERSION } from "./evidenceLedger.js";
import { BIV_ANALYTICAL_PLAN_VERSION, buildAnalyticalPlanV1 } from "./analyticalPlan.js";
import { BIV_BUSINESS_MODEL_LENS_VERSION } from "./businessModelLenses.js";

export const BIV_STRUCTURED_FINDINGS_VERSION = "biv_structured_findings_v1";

export const FINDING_EFFECTS = {
  SUPPORTS: "supports",
  WEAKENS: "weakens",
  CONTRADICTS: "contradicts",
  NEUTRAL: "neutral",
  UNKNOWN: "unknown",
};

export const FINDING_CONFIDENCE = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const FINDING_SEVERITY = {
  CRITICAL: "critical",
  MATERIAL: "material",
  MINOR: "minor",
  INFORMATIONAL: "informational",
};

export function buildStructuredFindingsV1({
  evidenceLedger = {},
  lensSelection = {},
  analyticalPlan = null,
} = {}) {
  const plan = analyticalPlan || buildAnalyticalPlanV1({ lensSelection, evidenceLedger });
  const context = buildEvidenceContext(evidenceLedger);
  const findings = [
    buildKnownOrUnknownFinding({
      id: "finding_target_customer_readiness",
      module: "customer_stakeholders",
      dimension: "information_readiness",
      knownItem: findItem(context, "target_customer"),
      unknownItem: findUnknown(context, "target_customer"),
      knownClaim: "Target customer is stated as owner-provided context.",
      unknownClaim: "Target customer is not yet established.",
      knownReason: "The Evidence Ledger contains owner data for the target customer.",
      unknownReason: "The Evidence Ledger records target customer as unknown.",
      whatWouldChangeIt: "A clear owner answer naming the primary customer, buyer, user, or stakeholder.",
      limitations: "A named customer segment does not prove demand.",
      userFacingSummary: "The customer is named, but this is still owner-provided context.",
    }),
    buildKnownOrUnknownFinding({
      id: "finding_problem_hypothesis_readiness",
      module: "market_demand",
      dimension: "information_readiness",
      knownItem: findItem(context, "customer_problem"),
      unknownItem: findUnknown(context, "customer_problem"),
      knownClaim: "Customer problem hypothesis is stated.",
      unknownClaim: "Customer problem hypothesis is not yet established.",
      knownReason: "The Evidence Ledger contains owner data describing the customer problem.",
      unknownReason: "The Evidence Ledger records the customer problem as unknown.",
      whatWouldChangeIt: "A clear owner answer describing the customer problem, job, pain, or need.",
      limitations: "A stated problem is not proof of urgency, frequency, switching behavior, or willingness to pay.",
      userFacingSummary: "The customer problem is stated, but demand strength is not established.",
    }),
    buildKnownOrUnknownFinding({
      id: "finding_revenue_mechanism_readiness",
      module: "revenue_model",
      dimension: "information_readiness",
      knownItem: findItem(context, "planned_revenue_mechanism"),
      unknownItem: findUnknown(context, "planned_revenue_mechanism"),
      knownClaim: "Revenue mechanism is defined as an owner plan.",
      unknownClaim: "Revenue mechanism is not yet defined.",
      knownReason: "The Evidence Ledger contains owner data for planned monetization.",
      unknownReason: "The Evidence Ledger records planned revenue mechanism as unknown.",
      whatWouldChangeIt: "A clear owner answer explaining who pays and how the business earns revenue.",
      limitations: "A planned revenue mechanism is not payment evidence or validated willingness to pay.",
      userFacingSummary: "The revenue model is described, but commercial payment evidence is separate.",
    }),
    buildDemandEvidenceFinding(context),
    buildRevenueEvidenceFinding(context),
    buildEvidenceConfidenceFinding(context),
    buildSystemInferenceFinding(context),
    buildUnknownsFinding(context),
  ].filter(Boolean);

  return {
    version: BIV_STRUCTURED_FINDINGS_VERSION,
    sourceVersions: {
      evidenceLedger: evidenceLedger.version || "",
      lensSelection: lensSelection.version || "",
      analyticalPlan: plan.version || "",
    },
    analyticalPlan: plan,
    findings,
    authority: {
      determinesVerdict: false,
      affectsScore: false,
      affectsReport: false,
      changesRuntimeBehavior: false,
    },
  };
}

export function validateStructuredFindingsV1(result = {}) {
  const errors = [];
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return { ok: false, errors: ["result must be an object"] };
  }
  if (result.version !== BIV_STRUCTURED_FINDINGS_VERSION) errors.push("invalid version");
  if (result.sourceVersions?.evidenceLedger && result.sourceVersions.evidenceLedger !== BIV_EVIDENCE_LEDGER_VERSION) errors.push("unexpected evidence ledger version");
  if (result.sourceVersions?.lensSelection && result.sourceVersions.lensSelection !== BIV_BUSINESS_MODEL_LENS_VERSION) errors.push("unexpected lens selection version");
  if (result.sourceVersions?.analyticalPlan && result.sourceVersions.analyticalPlan !== BIV_ANALYTICAL_PLAN_VERSION) errors.push("unexpected analytical plan version");
  if (!Array.isArray(result.findings)) errors.push("findings must be an array");
  for (const finding of result.findings || []) {
    validateFinding(finding, errors);
  }
  return { ok: errors.length === 0, errors };
}

function validateFinding(finding, errors) {
  for (const field of ["id", "module", "dimension", "claim", "reason", "confidence", "severity", "effect", "whatWouldChangeIt", "limitations"]) {
    if (!finding[field]) errors.push(`${finding.id || "finding"}: missing ${field}`);
  }
  if (!Array.isArray(finding.evidenceIds)) errors.push(`${finding.id}: evidenceIds must be an array`);
  if (!Array.isArray(finding.unknownIds)) errors.push(`${finding.id}: unknownIds must be an array`);
  if (!Object.values(FINDING_EFFECTS).includes(finding.effect)) errors.push(`${finding.id}: invalid effect`);
  if (!Object.values(FINDING_CONFIDENCE).includes(finding.confidence)) errors.push(`${finding.id}: invalid confidence`);
  if (!Object.values(FINDING_SEVERITY).includes(finding.severity)) errors.push(`${finding.id}: invalid severity`);
  if ((finding.evidenceIds || []).length === 0 && (finding.unknownIds || []).length === 0) {
    errors.push(`${finding.id}: must reference evidenceIds or unknownIds`);
  }
}

function buildKnownOrUnknownFinding({
  id,
  module,
  dimension,
  knownItem,
  unknownItem,
  knownClaim,
  unknownClaim,
  knownReason,
  unknownReason,
  whatWouldChangeIt,
  limitations,
  userFacingSummary,
}) {
  if (knownItem) {
    return finding({
      id,
      module,
      dimension,
      claim: knownClaim,
      reason: knownReason,
      evidenceIds: [knownItem.id],
      confidence: "medium",
      severity: "informational",
      effect: "supports",
      whatWouldChangeIt,
      limitations,
      userFacingSummary,
    });
  }
  if (unknownItem) {
    return finding({
      id,
      module,
      dimension,
      claim: unknownClaim,
      reason: unknownReason,
      unknownIds: [unknownItem.id],
      confidence: "medium",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt,
      limitations: "Unknown means information is missing; it is not a negative business finding.",
      userFacingSummary: unknownClaim,
    });
  }
  return null;
}

function buildDemandEvidenceFinding(context) {
  const problemItem = findItem(context, "customer_problem");
  if (!problemItem) return null;
  const demandEvidence = context.items.filter((item) =>
    item.origin === "external_evidence" || /customer_interview|paid|pilot|order|purchase|behavior|validated_demand/i.test(item.evidenceClass)
  );
  return finding({
    id: "finding_demand_not_yet_evidenced",
    module: "market_demand",
    dimension: "evidence_confidence",
    claim: demandEvidence.length
      ? "Customer problem has some supporting evidence, but demand strength still requires careful interpretation."
      : "Customer problem is stated, but current evidence does not establish demand strength.",
    reason: demandEvidence.length
      ? "The Evidence Ledger contains problem context and separate demand-related evidence."
      : "The Evidence Ledger contains owner problem context but no external or behavioral demand evidence.",
    evidenceIds: [problemItem.id, ...demandEvidence.map((item) => item.id)],
    confidence: demandEvidence.length ? "medium" : "high",
    severity: "material",
    effect: demandEvidence.length ? "neutral" : "unknown",
    whatWouldChangeIt: "Behavioral evidence such as paid orders, accepted quotations, repeated customer actions, or structured customer interviews.",
    limitations: "Problem evidence and demand evidence remain separate.",
    userFacingSummary: "The problem is described, but demand strength is not proven by this evidence alone.",
  });
}

function buildRevenueEvidenceFinding(context) {
  const revenueItem = findItem(context, "planned_revenue_mechanism");
  if (!revenueItem) return null;
  const paymentEvidence = context.items.filter((item) =>
    item.origin === "external_evidence" && /payment|paid|invoice|deposit|purchase|transaction|commercial/i.test(item.evidenceClass)
  );
  return finding({
    id: "finding_revenue_without_payment_evidence",
    module: "revenue_model",
    dimension: "evidence_confidence",
    claim: paymentEvidence.length
      ? "Revenue mechanism is defined and separate payment evidence is present."
      : "Revenue mechanism is defined, but willingness to pay is not yet evidenced.",
    reason: paymentEvidence.length
      ? "The Evidence Ledger separates planned revenue mechanism from commercial behavior evidence."
      : "The Evidence Ledger contains planned monetization but no external payment or behavioral revenue evidence.",
    evidenceIds: [revenueItem.id, ...paymentEvidence.map((item) => item.id)],
    confidence: paymentEvidence.length ? "medium" : "high",
    severity: "material",
    effect: paymentEvidence.length ? "neutral" : "unknown",
    whatWouldChangeIt: "A paid pilot, deposit, completed purchase, invoice, accepted quotation, or equivalent commercial behavior.",
    limitations: "Planned monetization does not create payment validation.",
    userFacingSummary: "The revenue mechanism is clear, but payment behavior is still unproven.",
  });
}

function buildEvidenceConfidenceFinding(context) {
  const ownerItems = context.items.filter((item) => item.origin === "owner_data");
  if (!ownerItems.length) return null;
  const externalItems = context.items.filter((item) => item.origin === "external_evidence");
  return finding({
    id: "finding_owner_data_only_evidence_confidence",
    module: "implementation",
    dimension: "evidence_confidence",
    claim: externalItems.length
      ? "Owner data and external evidence are distinguishable in the current ledger."
      : "Current case evidence is owner-provided only; no external evidence is present.",
    reason: externalItems.length
      ? "The Evidence Ledger keeps owner data and external evidence under separate origins."
      : "All available material evidence items are owner_data or system inference, not externally verified facts.",
    evidenceIds: ownerItems.map((item) => item.id).slice(0, 8),
    confidence: "high",
    severity: "informational",
    effect: "neutral",
    whatWouldChangeIt: "Trusted external records such as official requirements, supplier quotes, invoices, measured results, or verified market data.",
    limitations: "Owner-provided information is useful input but must not be laundered into verified fact.",
    userFacingSummary: "Most current evidence is owner-provided, so confidence should remain cautious.",
  });
}

function buildSystemInferenceFinding(context) {
  const systemItems = context.items.filter((item) => item.origin === "system_inference");
  if (!systemItems.length) return null;
  return finding({
    id: "finding_system_inference_is_distinct",
    module: "implementation",
    dimension: "evidence_confidence",
    claim: "System inference exists but remains separate from owner-confirmed or external evidence.",
    reason: "The Evidence Ledger records classification signals under system_inference.",
    evidenceIds: systemItems.map((item) => item.id).slice(0, 8),
    confidence: "high",
    severity: "informational",
    effect: "neutral",
    whatWouldChangeIt: "Owner confirmation, correction, or trusted external evidence that supports or contradicts the inference.",
    limitations: "System inference cannot become a user-confirmed fact by being restated as a finding.",
    userFacingSummary: "The system has inferred context, but it is not final evidence.",
  });
}

function buildUnknownsFinding(context) {
  if (!context.unknowns.length) return null;
  return finding({
    id: "finding_meaningful_unknowns_exist",
    module: "implementation",
    dimension: "information_readiness",
    claim: "Meaningful unknowns remain in the current evidence state.",
    reason: "The Evidence Ledger tracks missing concepts as unknowns rather than negative findings.",
    unknownIds: context.unknowns.map((item) => item.id).slice(0, 8),
    confidence: "high",
    severity: "material",
    effect: "unknown",
    whatWouldChangeIt: "Owner answers, external research, or market tests that directly resolve the listed unknowns.",
    limitations: "Unknowns should not be scored as business weakness without evidence.",
    userFacingSummary: "Some important information is still unknown.",
  });
}

function finding({
  id,
  module,
  dimension,
  claim,
  reason,
  evidenceIds = [],
  unknownIds = [],
  confidence,
  severity,
  effect,
  whatWouldChangeIt,
  limitations,
  userFacingSummary = "",
}) {
  return {
    id,
    module,
    dimension,
    claim,
    reason,
    evidenceIds,
    unknownIds,
    confidence,
    severity,
    effect,
    whatWouldChangeIt,
    limitations,
    ...(userFacingSummary ? { userFacingSummary } : {}),
  };
}

function buildEvidenceContext(evidenceLedger = {}) {
  return {
    items: Array.isArray(evidenceLedger.items) ? evidenceLedger.items : [],
    unknowns: Array.isArray(evidenceLedger.unknowns) ? evidenceLedger.unknowns : [],
  };
}

function findItem(context, evidenceClass) {
  return context.items.find((item) => item.evidenceClass === evidenceClass || item.evidenceClass?.includes(evidenceClass)) || null;
}

function findUnknown(context, topic) {
  return context.unknowns.find((item) => item.topic === topic || item.topic?.includes(topic)) || null;
}
