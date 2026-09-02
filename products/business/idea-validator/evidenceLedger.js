export const BIV_EVIDENCE_LEDGER_VERSION = "biv_evidence_ledger_v1";

export const EVIDENCE_ORIGINS = {
  OWNER_DATA: "owner_data",
  SYSTEM_INFERENCE: "system_inference",
  EXTERNAL_EVIDENCE: "external_evidence",
  UNKNOWN: "unknown",
};

const ownerInputFields = [
  ["businessIdea", "business_idea"],
  ["originalIdea", "original_idea"],
  ["targetCustomer", "target_customer"],
  ["problem", "customer_problem"],
  ["monetization", "planned_revenue_mechanism"],
  ["stage", "project_stage"],
  ["currentSolution", "current_solution_or_alternative"],
  ["competitiveAdvantage", "competitive_advantage_claim"],
];

const confirmedUnderstandingFields = [
  ["selectedIntent", "confirmed_business_role"],
  ["coreOffering", "confirmed_core_offering"],
  ["coreOfferingStatus", "confirmed_core_offering_status"],
  ["selectedOperatingApproach", "confirmed_operating_approach"],
  ["selectedOperatingApproaches", "confirmed_operating_approaches"],
];

const downstreamClarificationFields = [
  ["additionalIdeaContext", "additional_idea_context"],
  ["targetCustomer", "clarified_target_customer"],
  ["problem", "clarified_customer_problem"],
  ["monetization", "clarified_planned_revenue_mechanism"],
];

const optionalContextFields = [
  ["country", "owner_context_country"],
  ["city", "owner_context_city"],
  ["projectStageIntent", "owner_context_project_stage_intent"],
  ["firstProject", "owner_context_first_project"],
  ["userExperienceLevel", "owner_context_experience_level"],
  ["decisionObjective", "owner_context_decision_objective"],
  ["currentSolution", "owner_context_current_solution"],
  ["competitiveAdvantage", "owner_context_competitive_advantage"],
];

const coreUnknownFields = [
  ["businessIdea", "business_idea", "A short business idea is required before reliable analysis."],
  ["targetCustomer", "target_customer", "The target customer is not known yet."],
  ["problem", "customer_problem", "The customer problem, job, or need is not known yet."],
  ["monetization", "planned_revenue_mechanism", "The intended revenue mechanism is not known yet."],
];

export function buildEvidenceLedgerV1({
  rawInput = {},
  originalIdea = "",
  confirmedUnderstanding = null,
  downstreamClarifications = null,
  optionalContext = null,
  classification = null,
  externalEvidence = [],
} = {}) {
  const items = [];
  const unknowns = [];
  const source = normalizeSourceInput(rawInput, originalIdea);

  addOwnerDataItems(items, source, ownerInputFields, "rawInput");
  addOwnerDataItems(items, confirmedUnderstanding, confirmedUnderstandingFields, "confirmedUnderstanding");
  addOwnerDataItems(items, downstreamClarifications, downstreamClarificationFields, "downstreamClarifications");
  addOwnerDataItems(items, optionalContext, optionalContextFields, "optionalContext");
  addSystemInferenceItems(items, classification);
  addTrustedExternalEvidence(items, externalEvidence);
  addUnknowns(unknowns, source);
  addTrackedUnknowns(unknowns, confirmedUnderstanding?.unresolvedItems, "confirmedUnderstanding.unresolvedItems");

  return {
    version: BIV_EVIDENCE_LEDGER_VERSION,
    items,
    unknowns,
  };
}

export function getEvidenceItemsByOrigin(ledger = {}, origin = "") {
  return Array.isArray(ledger.items)
    ? ledger.items.filter((item) => item.origin === origin)
    : [];
}

function normalizeSourceInput(rawInput = {}, originalIdea = "") {
  return {
    ...rawInput,
    originalIdea: cleanString(originalIdea || rawInput.originalIdea),
  };
}

function addOwnerDataItems(items, source, fields, sourcePath) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return;
  for (const [field, evidenceClass] of fields) {
    const value = source[field];
    if (!hasValue(value)) continue;
    items.push(buildEvidenceItem({
      origin: EVIDENCE_ORIGINS.OWNER_DATA,
      evidenceClass,
      claim: buildOwnerClaim(evidenceClass),
      value,
      sourceField: `${sourcePath}.${field}`,
      confidence: "owner_provided",
      limitations: buildOwnerLimitations(evidenceClass),
    }));
  }
}

function addSystemInferenceItems(items, classification) {
  if (!classification || typeof classification !== "object" || Array.isArray(classification)) return;
  const proposed = classification.proposedClassification || {};
  if (hasValue(proposed.engineType || proposed.type)) {
    items.push(buildEvidenceItem({
      origin: EVIDENCE_ORIGINS.SYSTEM_INFERENCE,
      evidenceClass: "proposed_business_type",
      claim: "BIV proposed a business type from current input signals.",
      value: proposed.engineType || proposed.type,
      sourceField: "classification.proposedClassification",
      confidence: classification.classificationConfidence || proposed.confidence || "system_inferred",
      limitations: "This is a system inference, not user-confirmed classification and not external evidence.",
    }));
  }
  if (hasValue(proposed.operatingModel || classification.operatingModel)) {
    items.push(buildEvidenceItem({
      origin: EVIDENCE_ORIGINS.SYSTEM_INFERENCE,
      evidenceClass: "proposed_operating_model",
      claim: "BIV proposed an operating model from current input signals.",
      value: proposed.operatingModel || classification.operatingModel,
      sourceField: "classification.proposedClassification.operatingModel",
      confidence: classification.classificationConfidence || "system_inferred",
      limitations: "This is a system inference and cannot override confirmed owner answers.",
    }));
  }
  for (const record of classification.classificationEvidence || []) {
    items.push(buildEvidenceItem({
      origin: EVIDENCE_ORIGINS.SYSTEM_INFERENCE,
      evidenceClass: "classification_signal",
      claim: record.reasonCode || record.conceptId || "classification signal",
      value: record.proposedValue || record.conceptId || "",
      sourceField: record.sourceField ? `classificationEvidence.${record.sourceField}` : "classificationEvidence",
      sourceTextExcerpt: record.matchedPhrase || "",
      confidence: record.evidenceStrength || "system_inferred",
      limitations: "Matched phrases are system classification signals, not external market evidence.",
    }));
  }
}

function addTrustedExternalEvidence(items, externalEvidence) {
  if (!Array.isArray(externalEvidence)) return;
  for (const record of externalEvidence) {
    if (!record || typeof record !== "object" || record.trusted !== true) continue;
    if (!hasValue(record.claim) && !hasValue(record.value)) continue;
    items.push(buildEvidenceItem({
      origin: EVIDENCE_ORIGINS.EXTERNAL_EVIDENCE,
      evidenceClass: cleanString(record.evidenceClass) || "trusted_external_record",
      claim: cleanString(record.claim) || "Trusted external evidence record",
      value: record.value,
      sourceField: cleanString(record.sourceField) || "externalEvidence",
      sourceTextExcerpt: record.sourceTextExcerpt || "",
      confidence: cleanString(record.confidence) || "unverified_trusted_input",
      limitations: cleanString(record.limitations) || "External evidence was supplied explicitly; this module does not verify it.",
    }));
  }
}

function addUnknowns(unknowns, source) {
  for (const [field, topic, reason] of coreUnknownFields) {
    if (hasValue(source[field])) continue;
    unknowns.push({
      id: buildId("unknown", topic),
      topic,
      sourceField: `rawInput.${field}`,
      reason,
      decisionRelevance: "Required to avoid treating missing information as a negative business finding.",
    });
  }
}

function addTrackedUnknowns(unknowns, unresolvedItems, sourceField) {
  if (!Array.isArray(unresolvedItems)) return;
  for (const item of unresolvedItems) {
    const id = typeof item === "string" ? item : item?.id;
    if (!hasValue(id)) continue;
    unknowns.push({
      id: buildId("unknown", id),
      topic: cleanString(id),
      sourceField,
      reason: "The confirmed discovery flow still marks this item as unresolved.",
      decisionRelevance: "Tracked unresolved discovery item; it must remain separate from negative findings.",
    });
  }
}

function buildEvidenceItem({
  origin,
  evidenceClass,
  claim,
  value,
  sourceField,
  sourceTextExcerpt = "",
  confidence,
  limitations,
}) {
  const item = {
    id: buildId(origin, sourceField, evidenceClass, String(itemsSafeValue(value)).slice(0, 32)),
    origin,
    evidenceClass,
    claim,
    value,
    sourceField,
    confidence,
    limitations,
  };
  if (sourceTextExcerpt) item.sourceTextExcerpt = truncate(sourceTextExcerpt, 160);
  return item;
}

function buildOwnerClaim(evidenceClass) {
  const claims = {
    business_idea: "Owner described the business idea.",
    original_idea: "Owner original wording was preserved.",
    target_customer: "Owner identified the target customer.",
    customer_problem: "Owner described the customer problem or need.",
    planned_revenue_mechanism: "Owner described the intended revenue mechanism.",
    project_stage: "Owner provided the project stage.",
    current_solution_or_alternative: "Owner described the current alternative or workaround.",
    competitive_advantage_claim: "Owner described a competitive advantage claim.",
    confirmed_business_role: "Owner confirmed the understood business role.",
    confirmed_core_offering: "Owner confirmed the core offering.",
    confirmed_operating_approach: "Owner confirmed the operating approach.",
    confirmed_operating_approaches: "Owner confirmed multiple operating approaches.",
    clarified_target_customer: "Owner clarified the target customer for BIV execution.",
    clarified_customer_problem: "Owner clarified the customer problem for BIV execution.",
    clarified_planned_revenue_mechanism: "Owner clarified the intended revenue mechanism for BIV execution.",
  };
  return claims[evidenceClass] || "Owner provided this information.";
}

function buildOwnerLimitations(evidenceClass) {
  if (evidenceClass.includes("revenue") || evidenceClass.includes("monetization")) {
    return "This is a planned revenue mechanism, not evidence that customers have paid or will pay.";
  }
  if (evidenceClass.includes("problem")) {
    return "This is an owner-stated problem hypothesis, not validated market demand.";
  }
  if (evidenceClass.includes("competitive_advantage")) {
    return "This is an owner-stated advantage claim, not independently verified differentiation.";
  }
  return "Owner-provided information is preserved as input provenance, not external validation.";
}

function buildId(...parts) {
  return parts
    .map((part) => cleanString(part).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""))
    .filter(Boolean)
    .join("__")
    .slice(0, 120);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.some((item) => hasValue(item));
  return cleanString(value).length > 0;
}

function itemsSafeValue(value) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function cleanString(value = "") {
  if (Array.isArray(value)) return value.map(cleanString).filter(Boolean).join(", ");
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function truncate(value = "", max = 160) {
  const text = cleanString(value);
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}
