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
    ...buildLensAwareFindings({ context, lensSelection, analyticalPlan: plan }),
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

function buildLensAwareFindings({ context, lensSelection = {}, analyticalPlan = {} }) {
  const primaryLens = analyticalPlan.primaryLens || lensSelection.primaryLens || "generic";
  const moduleSet = new Set((analyticalPlan.modules || []).map((modulePlan) => modulePlan.module));
  const builders = {
    real_estate: buildRealEstateFindings,
    marketplace_platform: buildMarketplaceFindings,
    retail_trading: buildRetailTradingFindings,
    manufacturing_industrial: buildManufacturingFindings,
    service: buildServiceFindings,
    saas_software: buildSaasSoftwareFindings,
    food_beverage: buildFoodBeverageFindings,
    wholesale_import_distribution: buildWholesaleDistributionFindings,
    professional_services: buildProfessionalServicesFindings,
    existing_business_expansion: buildExistingBusinessExpansionFindings,
  };
  const builder = builders[primaryLens];
  if (!builder) return [];
  return builder({ context, analyticalPlan, hasModule: (module) => moduleSet.has(module) });
}

function buildRealEstateFindings({ context, hasModule }) {
  const businessIdea = findItem(context, "business_idea") || findItem(context, "original_idea");
  const revenueItem = findItem(context, "planned_revenue_mechanism");
  const locationEvidence = findAnyItem(context, ["location_requirement", "location_context", "owner_context_city", "owner_context_country"]);
  const capitalEvidence = findAnyItem(context, ["available_capital", "available_budget", "startup", "budget"]);
  const occupancyEvidence = findAnyItem(context, ["operating_capacity", "target_operating_capacity", "repeat_business"]);
  const rentalDemandEvidence = findExternalItem(context, /occupancy|tenant|rental|demand|lease|booking|reservation/i);
  const anchorIds = idsOf([businessIdea]);
  const findings = [];

  if (hasModule("operational_capacity") && businessIdea) {
    findings.push(finding({
      id: "finding_real_estate_occupancy_utilization_readiness",
      module: "operational_capacity",
      dimension: "information_readiness",
      claim: occupancyEvidence || rentalDemandEvidence
        ? "Real estate utilization has some case evidence, but viable occupancy still requires separate interpretation."
        : "The case does not yet establish what occupancy or utilization level is required for viable operation.",
      reason: occupancyEvidence || rentalDemandEvidence
        ? "The lens-aware plan treats utilization as a real estate capacity question distinct from demand and pricing."
        : "The real estate lens depends on units, space, or occupancy being used enough to support the economics.",
      evidenceIds: idsOf([businessIdea, occupancyEvidence, rentalDemandEvidence]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Evidence of expected occupancy, utilization, bookings, tenant commitments, or break-even occupancy assumptions.",
      limitations: "This does not predict low occupancy; it records that occupancy economics are not yet evidenced.",
      userFacingSummary: "Occupancy or utilization still needs evidence before economics can be trusted.",
    }));
  }

  if (hasModule("location") && businessIdea) {
    findings.push(finding({
      id: "finding_real_estate_location_dependency",
      module: "location",
      dimension: "risk_exposure",
      claim: locationEvidence
        ? "Location is present as case context and remains a decision-relevant dependency."
        : "Location is decision-relevant for this real estate model, but location evidence is not yet established.",
      reason: "Real estate demand and economics are materially affected by site, access, local competition, and customer or tenant proximity.",
      evidenceIds: idsOf([businessIdea, locationEvidence]),
      confidence: "high",
      severity: "material",
      effect: locationEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "A named area, site criteria, tenant catchment evidence, comparable rents, or location-specific demand evidence.",
      limitations: "The finding identifies dependency only; it does not rate the location as good or bad.",
    }));
  }

  if (hasModule("economic_feasibility") && (businessIdea || revenueItem)) {
    findings.push(finding({
      id: "finding_real_estate_revenue_economic_readiness",
      module: "economic_feasibility",
      dimension: "evidence_confidence",
      claim: revenueItem
        ? "Rental revenue mechanism is stated, but occupancy and economics remain separate evidence questions."
        : "Real estate economics cannot yet be assessed because revenue basis is not established.",
      reason: "Rental price assumptions, occupancy, operating cost, and site commitment are different evidence concepts.",
      evidenceIds: idsOf([businessIdea, revenueItem]),
      unknownIds: revenueItem ? [] : unknownIdsFor(context, ["planned_revenue_mechanism"]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Rental pricing basis, expected occupancy, operating-cost assumptions, and comparable tenant or customer demand evidence.",
      limitations: "A stated rental model is not proof of occupancy or profitability.",
    }));
  }

  if (hasModule("startup_capital") && businessIdea) {
    findings.push(finding({
      id: "finding_real_estate_capital_site_commitment",
      module: "startup_capital",
      dimension: "risk_exposure",
      claim: capitalEvidence
        ? "Owner capital context is present, but required real estate commitment remains a separate question."
        : "Capital and site commitment requirements are not yet established for this real estate model.",
      reason: "Real estate cases can involve rent, fit-out, deposits, property commitments, and irreversible setup costs.",
      evidenceIds: idsOf([businessIdea, capitalEvidence]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Required capital, deposit or lease terms, fit-out cost, ownership/rental status, and whether location costs are included.",
      limitations: "Available budget must not be treated as proof that required capital is sufficient.",
    }));
  }

  return findings;
}

function buildMarketplaceFindings({ context, hasModule }) {
  const businessIdea = findItem(context, "business_idea") || findItem(context, "original_idea");
  const targetCustomer = findItem(context, "target_customer");
  const problemItem = findItem(context, "customer_problem");
  const revenueItem = findItem(context, "planned_revenue_mechanism");
  const supplierEvidence = findExternalItem(context, /provider|supplier|technician|seller|supply|participation|availability/i);
  const demandEvidence = findExternalItem(context, /customer|buyer|demand|booking|order|purchase|interview|behavior/i);
  const findings = [];

  if (hasModule("customer_stakeholders") && businessIdea) {
    findings.push(finding({
      id: "finding_marketplace_supply_side_readiness",
      module: "customer_stakeholders",
      dimension: "information_readiness",
      claim: supplierEvidence
        ? "Provider-side participation has some supporting evidence and remains distinct from customer demand."
        : "Provider-side supply is not yet evidenced.",
      reason: "A marketplace depends on one participant group being willing and able to provide the product or service.",
      evidenceIds: idsOf([businessIdea, supplierEvidence]),
      confidence: "high",
      severity: "material",
      effect: supplierEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Evidence that providers, sellers, technicians, or suppliers are available and willing to participate.",
      limitations: "This does not claim suppliers are unavailable; it records that participation evidence is missing or limited.",
    }));
  }

  if (hasModule("market_demand") && (businessIdea || problemItem || targetCustomer)) {
    findings.push(finding({
      id: "finding_marketplace_demand_side_readiness",
      module: "market_demand",
      dimension: "evidence_confidence",
      claim: demandEvidence
        ? "Demand-side participation has some supporting evidence and remains distinct from provider supply."
        : "Demand-side customer participation is not yet evidenced beyond owner-provided context.",
      reason: "Marketplace demand must be assessed separately from supply availability and matching mechanics.",
      evidenceIds: idsOf([businessIdea, problemItem, targetCustomer, demandEvidence]),
      confidence: "high",
      severity: "material",
      effect: demandEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Customer interviews, booking attempts, waitlists, paid transactions, or other behavioral demand evidence.",
      limitations: "A stated customer problem does not prove marketplace demand or repeat usage.",
    }));
  }

  if (hasModule("operational_capacity") && businessIdea) {
    findings.push(finding({
      id: "finding_marketplace_liquidity_dependency",
      module: "operational_capacity",
      dimension: "risk_exposure",
      claim: supplierEvidence && demandEvidence
        ? "Marketplace liquidity can be examined because both sides have some evidence."
        : "Marketplace liquidity cannot yet be assessed because both sides do not have sufficient behavioral evidence.",
      reason: "Two-sided models require enough active demand and supply within the same time, location, category, or use case.",
      evidenceIds: idsOf([businessIdea, supplierEvidence, demandEvidence]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Matched transactions, response rates, active provider availability, customer bookings, or comparable liquidity evidence.",
      limitations: "This is a model dependency, not a claim that liquidity will be weak.",
    }));
  }

  if (hasModule("revenue_model") && revenueItem) {
    findings.push(finding({
      id: "finding_marketplace_monetization_participation_separation",
      module: "revenue_model",
      dimension: "evidence_confidence",
      claim: "Marketplace monetization is stated, but acceptance by each side is not yet evidenced.",
      reason: "A commission or fee model is revenue design; it is separate from customer tolerance and provider willingness.",
      evidenceIds: [revenueItem.id],
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Evidence that customers complete bookings at the resulting price and providers accept the platform economics.",
      limitations: "Planned commission or fees do not prove take-rate sustainability.",
    }));
  }

  if (hasModule("risk_sensitivity") && businessIdea) {
    findings.push(finding({
      id: "finding_marketplace_trust_quality_dependency",
      module: "risk_sensitivity",
      dimension: "risk_exposure",
      claim: "The marketplace model depends on trust and provider quality controls.",
      reason: "When fulfillment is performed by third-party providers, user trust, provider reliability, and quality assurance become model dependencies.",
      evidenceIds: [businessIdea.id],
      confidence: "high",
      severity: "material",
      effect: "neutral",
      whatWouldChangeIt: "Provider vetting evidence, service standards, dispute handling, ratings, guarantees, or quality control process.",
      limitations: "This identifies a dependency only; it does not conclude that trust risk is high.",
    }));
  }

  return findings;
}

function buildRetailTradingFindings({ context, hasModule }) {
  const businessIdea = findItem(context, "business_idea") || findItem(context, "original_idea");
  const problemItem = findItem(context, "customer_problem");
  const revenueItem = findItem(context, "planned_revenue_mechanism");
  const differentiationItem = findItem(context, "competitive_advantage_claim") || findItem(context, "owner_context_competitive_advantage");
  const supplierEvidence = findAnyItem(context, ["inventory_materials_requirement", "supplier_dependency"]);
  const repeatEvidence = findExternalItem(context, /repeat|recurring|reorder|retention|purchase|order|invoice/i);
  const findings = [];

  if (hasModule("market_demand") && (businessIdea || problemItem)) {
    findings.push(finding({
      id: "finding_retail_repeat_purchase_readiness",
      module: "market_demand",
      dimension: "evidence_confidence",
      claim: repeatEvidence
        ? "Repeat purchasing has some supporting evidence and should be interpreted separately from stated need."
        : "The customer need is stated, but repeat-purchase behavior has not been evidenced.",
      reason: "Retail and trading models often depend on reorder frequency, basket size, and customer switching from current suppliers.",
      evidenceIds: idsOf([businessIdea, problemItem, repeatEvidence]),
      confidence: "high",
      severity: "material",
      effect: repeatEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Repeat orders, reorder history, purchase frequency data, interviews about restocking, or signed customer commitments.",
      limitations: "Need for a product category is not the same as repeated buying behavior.",
    }));
  }

  if (hasModule("equipment_inventory") && businessIdea) {
    findings.push(finding({
      id: "finding_retail_supplier_inventory_dependency",
      module: "equipment_inventory",
      dimension: "execution_feasibility",
      claim: supplierEvidence
        ? "Inventory or supplier requirements are owner-stated and remain important to trading feasibility."
        : "Supplier terms and inventory requirements are not yet established.",
      reason: "Trading models depend on supply availability, minimum order quantities, stockouts, and capital tied in inventory.",
      evidenceIds: idsOf([businessIdea, supplierEvidence]),
      confidence: "high",
      severity: "material",
      effect: supplierEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Supplier quotes, MOQ terms, lead time, inventory list, purchase cost, or stocking plan.",
      limitations: "The finding does not assume favorable or unfavorable supplier terms.",
    }));
  }

  if (hasModule("competition_alternatives") && businessIdea) {
    findings.push(finding({
      id: "finding_retail_differentiation_evidence",
      module: "competition_alternatives",
      dimension: "evidence_confidence",
      claim: differentiationItem
        ? "Differentiation is currently owner-stated rather than evidenced against customer alternatives."
        : "Differentiation against current alternatives has not yet been evidenced.",
      reason: "Retail attractiveness depends on why customers would switch from existing suppliers or shops.",
      evidenceIds: idsOf([businessIdea, differentiationItem]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Evidence comparing price, availability, quality, service speed, assortment, or customer switching behavior.",
      limitations: "Owner-stated advantage is useful context but not independent differentiation evidence.",
    }));
  }

  if (hasModule("economic_feasibility") && (businessIdea || revenueItem)) {
    findings.push(finding({
      id: "finding_retail_working_capital_dependency",
      module: "economic_feasibility",
      dimension: "risk_exposure",
      claim: "The retail/trading model creates working-capital dependency before validated margins are known.",
      reason: "Inventory businesses may require cash tied in stock before sales convert that stock back into revenue.",
      evidenceIds: idsOf([businessIdea, revenueItem]),
      confidence: "high",
      severity: "material",
      effect: "neutral",
      whatWouldChangeIt: "Inventory cost, gross margin assumptions, supplier payment terms, stock turnover, and first-order quantities.",
      limitations: "This does not calculate working capital or margin without numerical inputs.",
    }));
  }

  return findings;
}

function buildManufacturingFindings({ context, hasModule }) {
  const businessIdea = findItem(context, "business_idea") || findItem(context, "original_idea");
  const revenueItem = findItem(context, "planned_revenue_mechanism");
  const equipmentEvidence = findAnyItem(context, ["equipment_requirement", "equipment_level"]);
  const materialsEvidence = findAnyItem(context, ["inventory_materials_requirement", "supplier_dependency"]);
  const laborEvidence = findAnyItem(context, ["labor_skills_requirement", "staffing_plan"]);
  const capacityEvidence = findAnyItem(context, ["operating_capacity_assumption", "target_operating_capacity", "production_capacity_target"]);
  const quoteEvidence = findAnyItem(context, ["pricing_evidence_status", "actualPurchases"]);
  const capitalEvidence = findAnyItem(context, ["available_capital", "available_budget", "startup"]);
  const findings = [];

  if (hasModule("equipment_inventory") && businessIdea) {
    findings.push(finding({
      id: "finding_manufacturing_equipment_capacity_readiness",
      module: "equipment_inventory",
      dimension: "execution_feasibility",
      claim: equipmentEvidence
        ? "Equipment requirements are partly stated, but capacity and suitability still need separate evidence."
        : "Execution feasibility cannot yet be assessed confidently because the required equipment set and capacity are not established.",
      reason: "Manufacturing feasibility depends on tools, machines, capacity, maintenance, installation, and suitability for the intended output.",
      evidenceIds: idsOf([businessIdea, equipmentEvidence]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Equipment list, supplier quotation, capacity rating, installation requirement, maintenance dependency, or tested production output.",
      limitations: "Specialist industrial equipment is not inferred from generic manufacturing evidence.",
    }));
  }

  if (hasModule("labor_skills") && businessIdea) {
    findings.push(finding({
      id: "finding_manufacturing_skilled_labor_dependency",
      module: "labor_skills",
      dimension: "execution_feasibility",
      claim: laborEvidence
        ? "Skilled labor requirements are owner-stated and remain a material execution dependency."
        : "Skilled labor or staffing requirements are not yet established for the manufacturing operation.",
      reason: "Custom or industrial production often depends on fabrication, installation, quality control, and operational skill.",
      evidenceIds: idsOf([businessIdea, laborEvidence]),
      confidence: "high",
      severity: "material",
      effect: laborEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Named roles, staffing plan, operator skill requirements, supervisor experience, or outsourcing plan.",
      limitations: "This identifies labor dependency; it does not assume the team lacks skills.",
    }));
  }

  if (hasModule("operational_capacity") && businessIdea) {
    findings.push(finding({
      id: "finding_manufacturing_production_capacity_unknown",
      module: "operational_capacity",
      dimension: "information_readiness",
      claim: capacityEvidence
        ? "Production capacity is owner-stated and should be compared with expected customer volume later."
        : "Production capacity is not yet established.",
      reason: "Manufacturing analysis must separate theoretical production capability from required order volume and available capacity.",
      evidenceIds: idsOf([businessIdea, capacityEvidence]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Capacity per day or month, batch size, lead time, bottleneck step, downtime assumption, or first customer volume target.",
      limitations: "Technical possibility is not the same as feasible operating capacity.",
    }));
  }

  if (hasModule("revenue_model") && (businessIdea || revenueItem)) {
    findings.push(finding({
      id: "finding_manufacturing_b2b_procurement_order_evidence",
      module: "revenue_model",
      dimension: "evidence_confidence",
      claim: quoteEvidence
        ? "Quotation or order evidence is present and remains separate from planned revenue."
        : "B2B procurement or order evidence is not yet established.",
      reason: "Workshop-style manufacturing often depends on quotation requests, approvals, specifications, deposits, and accepted orders.",
      evidenceIds: idsOf([businessIdea, revenueItem, quoteEvidence]),
      confidence: "high",
      severity: "material",
      effect: quoteEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Accepted quotation, paid deposit, purchase order, specification request, buyer approval process, or repeat order evidence.",
      limitations: "Naming restaurants or business buyers is not a complete procurement-path analysis.",
    }));
  }

  if (hasModule("risk_sensitivity") && businessIdea) {
    findings.push(finding({
      id: "finding_manufacturing_material_supplier_dependency",
      module: "risk_sensitivity",
      dimension: "risk_exposure",
      claim: materialsEvidence
        ? "Material or supplier dependency is present as owner context and should be validated before relying on feasibility."
        : "Raw material or supplier dependency is not yet established.",
      reason: "Manufacturing can depend on material availability, quality, lead time, supplier reliability, and input cost stability.",
      evidenceIds: idsOf([businessIdea, materialsEvidence]),
      confidence: "high",
      severity: "material",
      effect: materialsEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Material list, supplier quotes, lead times, quality specifications, alternate suppliers, or purchase terms.",
      limitations: "This does not infer favorable or unfavorable supplier conditions.",
    }));
  }

  if (hasModule("startup_capital") && businessIdea) {
    findings.push(finding({
      id: "finding_manufacturing_capital_readiness",
      module: "startup_capital",
      dimension: "execution_feasibility",
      claim: capitalEvidence
        ? "Owner capital context is present, but required manufacturing capital remains separate from available budget."
        : "Manufacturing capital requirement is not yet established.",
      reason: "Industrial execution can require equipment, installation, inventory, labor setup, utilities, and working capital.",
      evidenceIds: idsOf([businessIdea, capitalEvidence]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Equipment quotations, setup costs, raw material cost, installation cost, labor setup, utilities, and working-capital assumptions.",
      limitations: "Available capital is not treated as proof that required capital is sufficient.",
    }));
  }

  return findings;
}

function buildServiceFindings({ context, hasModule }) {
  const businessIdea = findItem(context, "business_idea") || findItem(context, "original_idea");
  const revenueItem = findItem(context, "planned_revenue_mechanism");
  const laborEvidence = findAnyItem(context, ["labor_skills_requirement", "staffing_plan"]);
  const capacityEvidence = findAnyItem(context, ["operating_capacity_assumption", "target_operating_capacity"]);
  const operatingEvidence = findAnyItem(context, ["confirmed_operating_approach", "confirmed_operating_approaches", "delivery_model"]);
  const repeatEvidence = findExternalItem(context, /repeat|recurring|retention|paid job|paid visit|booking|service history/i);
  const qualityEvidence = findExternalItem(context, /quality|complaint|rating|repeat technician|service standard/i);
  const findings = [];

  if (hasModule("operational_capacity") && businessIdea) {
    findings.push(finding({
      id: "finding_service_billable_utilization_dependency",
      module: "operational_capacity",
      dimension: "execution_feasibility",
      claim: capacityEvidence
        ? "Service capacity is partly stated, but billable utilization still needs operating evidence."
        : "The service model depends on converting staff time into sufficient billable or customer-serving utilization.",
      reason: "Service economics depend on visits, scheduling, travel or delivery time, and productive staff utilization.",
      evidenceIds: idsOf([businessIdea, capacityEvidence]),
      confidence: "high",
      severity: "material",
      effect: capacityEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Evidence of visit volume, schedule capacity, utilization, travel radius, response time, or paid service jobs.",
      limitations: "This does not assume poor utilization or high travel cost.",
    }));
  }

  if (hasModule("labor_skills") && businessIdea) {
    findings.push(finding({
      id: "finding_service_skill_quality_dependency",
      module: "labor_skills",
      dimension: "execution_feasibility",
      claim: laborEvidence || qualityEvidence
        ? "Service skill or quality evidence is present and remains a delivery dependency."
        : "Labor skill and quality consistency requirements are not yet established.",
      reason: "Direct services often rely on technician ability, service standards, and repeatable quality at the customer touchpoint.",
      evidenceIds: idsOf([businessIdea, laborEvidence, qualityEvidence]),
      confidence: "high",
      severity: "material",
      effect: laborEvidence || qualityEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Technician requirements, training process, quality standard, customer ratings, repeat service records, or staffing plan.",
      limitations: "Expertise claims do not prove demand or service quality by themselves.",
    }));
  }

  if (hasModule("risk_sensitivity") && businessIdea) {
    findings.push(finding({
      id: "finding_service_radius_delivery_burden",
      module: "risk_sensitivity",
      dimension: "risk_exposure",
      claim: operatingEvidence
        ? "The delivery approach is owner-stated and should be checked against travel, scheduling, or service-radius burden."
        : "Service radius, travel burden, or delivery approach is not yet evidenced.",
      reason: "Field or mobile service capacity can be constrained by geography, travel time, dispatching, and response expectations.",
      evidenceIds: idsOf([businessIdea, operatingEvidence]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Defined service area, travel time, jobs per day, dispatch process, fixed-location split, or paid customer-site evidence.",
      limitations: "A customer-site model is not automatically high cost; it is a dependency to validate.",
    }));
  }

  if (hasModule("market_demand") && (businessIdea || revenueItem)) {
    findings.push(finding({
      id: "finding_service_repeat_demand_readiness",
      module: "market_demand",
      dimension: "evidence_confidence",
      claim: repeatEvidence
        ? "Repeat service demand has some behavioral evidence and remains separate from general need."
        : "Repeat demand or service frequency is not yet behaviorally evidenced.",
      reason: "Service viability often depends on whether the problem recurs enough to sustain utilization and revenue.",
      evidenceIds: idsOf([businessIdea, revenueItem, repeatEvidence]),
      confidence: "high",
      severity: "material",
      effect: repeatEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Repeat jobs, maintenance contracts, recurring bookings, paid repair history, or customer interview evidence about frequency.",
      limitations: "A stated service need is not proof of repeat demand.",
    }));
  }

  return findings;
}

function buildSaasSoftwareFindings({ context, hasModule }) {
  const businessIdea = findItem(context, "business_idea") || findItem(context, "original_idea");
  const revenueItem = findItem(context, "planned_revenue_mechanism");
  const adoptionEvidence = findExternalItem(context, /activation|signup|onboarding|active user|trial use|adoption/i);
  const retentionEvidence = findExternalItem(context, /retention|renewal|repeat usage|recurring paid|subscription renewal/i);
  const paymentEvidence = findExternalItem(context, /paid subscription|payment|invoice|subscription|transaction/i);
  const integrationEvidence = findAnyItem(context, ["delivery_model", "equipment_requirement", "supplier_dependency"]);
  const findings = [];

  if (hasModule("operational_capacity") && businessIdea) {
    findings.push(finding({
      id: "finding_saas_activation_retention_readiness",
      module: "operational_capacity",
      dimension: "evidence_confidence",
      claim: retentionEvidence
        ? "Retention evidence is present and should be interpreted separately from initial adoption."
        : adoptionEvidence
          ? "Adoption evidence exists, but retention is not yet established."
          : "Product existence or signup interest does not yet establish adoption or retention.",
      reason: "Software viability depends on users activating, returning, and continuing to receive enough value to sustain the model.",
      evidenceIds: idsOf([businessIdea, adoptionEvidence, retentionEvidence]),
      confidence: "high",
      severity: "material",
      effect: retentionEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Activation data, retained usage, renewal behavior, cohort retention, or repeated paid use.",
      limitations: "Signup interest and product existence are not retention evidence.",
    }));
  }

  if (hasModule("revenue_model") && (businessIdea || revenueItem)) {
    findings.push(finding({
      id: "finding_saas_subscription_payment_separation",
      module: "revenue_model",
      dimension: "evidence_confidence",
      claim: paymentEvidence
        ? "Subscription payment evidence is present and remains distinct from pricing design."
        : "Subscription pricing is stated, but willingness to pay is not yet evidenced.",
      reason: "A SaaS subscription model records how revenue may work; it does not prove customers will pay or renew.",
      evidenceIds: idsOf([businessIdea, revenueItem, paymentEvidence]),
      confidence: "high",
      severity: "material",
      effect: paymentEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Paid subscriptions, renewals, invoices, conversion from trial, or retained paid usage.",
      limitations: "No CAC, LTV, churn, or gross margin is fabricated without evidence.",
    }));
  }

  if (hasModule("equipment_inventory") && businessIdea) {
    findings.push(finding({
      id: "finding_saas_switching_integration_dependency",
      module: "equipment_inventory",
      dimension: "risk_exposure",
      claim: integrationEvidence
        ? "Software delivery or integration dependency is present as case context."
        : "Switching, integration, support, or data dependency is not yet established.",
      reason: "B2B software can depend on workflow change, setup friction, support burden, integrations, and data/security expectations.",
      evidenceIds: idsOf([businessIdea, integrationEvidence]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Integration requirements, onboarding steps, support volume, data/security needs, or evidence that users switch from the current workflow.",
      limitations: "This does not infer technical complexity without evidence.",
    }));
  }

  return findings;
}

function buildFoodBeverageFindings({ context, hasModule }) {
  const businessIdea = findItem(context, "business_idea") || findItem(context, "original_idea");
  const revenueItem = findItem(context, "planned_revenue_mechanism");
  const locationEvidence = findAnyItem(context, ["location_requirement", "location_context", "premises_status"]);
  const laborEvidence = findAnyItem(context, ["labor_skills_requirement", "staffing_plan"]);
  const costEvidence = findAnyItem(context, ["operating_cost_assumption", "utilities_or_infrastructure_requirement", "inventory_materials_requirement"]);
  const throughputEvidence = findAnyItem(context, ["operating_capacity_assumption", "target_operating_capacity"]);
  const repeatEvidence = findExternalItem(context, /repeat|returning|recurring|daily|weekly|subscription|loyalty|order/i);
  const findings = [];

  if (hasModule("location") && businessIdea) {
    findings.push(finding({
      id: "finding_food_location_throughput_dependency",
      module: "location",
      dimension: "risk_exposure",
      claim: locationEvidence
        ? "Location context is present and should be tested against throughput and demand."
        : "Food and beverage location dependency is not yet established.",
      reason: "Food businesses can be sensitive to footfall, delivery radius, kitchen location, service format, and customer convenience.",
      evidenceIds: idsOf([businessIdea, locationEvidence]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Site criteria, delivery radius, footfall evidence, comparable demand, or customer access data.",
      limitations: "This does not assume the location is good or bad.",
    }));
  }

  if (hasModule("operating_cost") && businessIdea) {
    findings.push(finding({
      id: "finding_food_cost_waste_readiness",
      module: "operating_cost",
      dimension: "execution_feasibility",
      claim: costEvidence
        ? "Food-cost or operating-cost context is present but still needs economic interpretation."
        : "Ingredient, waste, utility, or food-cost readiness is not yet established.",
      reason: "Food and beverage economics depend on input costs, spoilage/waste, labor, utilities, and repeatable preparation.",
      evidenceIds: idsOf([businessIdea, costEvidence, revenueItem]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Ingredient costs, menu cost assumptions, waste level, labor cost, utilities, or supplier records.",
      limitations: "No food-cost percentage, average ticket, or delivery commission is invented.",
    }));
  }

  if (hasModule("operational_capacity") && businessIdea) {
    findings.push(finding({
      id: "finding_food_throughput_capacity_readiness",
      module: "operational_capacity",
      dimension: "execution_feasibility",
      claim: throughputEvidence
        ? "Throughput capacity is owner-stated and should be compared with demand and cost assumptions."
        : "Kitchen, order, seating, or delivery throughput is not yet established.",
      reason: "Food operations depend on preparation flow, service speed, staff, peak demand, and capacity constraints.",
      evidenceIds: idsOf([businessIdea, throughputEvidence]),
      confidence: "high",
      severity: "material",
      effect: throughputEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Expected orders per hour, kitchen capacity, seating, delivery slots, staff plan, or pilot throughput evidence.",
      limitations: "This does not calculate table turnover or capacity without inputs.",
    }));
  }

  if (hasModule("market_demand") && businessIdea) {
    findings.push(finding({
      id: "finding_food_repeat_demand_readiness",
      module: "market_demand",
      dimension: "evidence_confidence",
      claim: repeatEvidence
        ? "Repeat food demand has some behavioral evidence and remains distinct from stated appetite."
        : "Repeat demand for the food concept is not yet behaviorally evidenced.",
      reason: "Food concepts often require frequent or repeated customer behavior, not just one-time interest.",
      evidenceIds: idsOf([businessIdea, repeatEvidence]),
      confidence: "high",
      severity: "material",
      effect: repeatEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Repeat purchases, recurring orders, subscriptions, pilot sales, or customer return behavior.",
      limitations: "Stated interest in food is not proof of recurring demand.",
    }));
  }

  if (hasModule("labor_skills") && businessIdea) {
    findings.push(finding({
      id: "finding_food_labor_operational_complexity",
      module: "labor_skills",
      dimension: "execution_feasibility",
      claim: laborEvidence
        ? "Labor or staffing context is present and remains operationally important."
        : "Labor, preparation, or operational complexity is not yet established.",
      reason: "Food service depends on preparation consistency, service timing, staffing, and operational discipline.",
      evidenceIds: idsOf([businessIdea, laborEvidence]),
      confidence: "high",
      severity: "material",
      effect: laborEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Staffing plan, preparation workflow, operating hours, service format, or kitchen process evidence.",
      limitations: "This identifies operational dependency without judging quality.",
    }));
  }

  return findings;
}

function buildWholesaleDistributionFindings({ context, hasModule }) {
  const businessIdea = findItem(context, "business_idea") || findItem(context, "original_idea");
  const revenueItem = findItem(context, "planned_revenue_mechanism");
  const supplierEvidence = findAnyItem(context, ["supplier_dependency", "inventory_materials_requirement"]);
  const logisticsEvidence = findExternalItem(context, /lead time|logistics|shipping|customs|supplier terms|moq|minimum order/i);
  const repeatEvidence = findExternalItem(context, /repeat order|purchase order|retailer order|recurring order|invoice/i);
  const findings = [];

  if (hasModule("risk_sensitivity") && businessIdea) {
    findings.push(finding({
      id: "finding_wholesale_supplier_concentration_dependency",
      module: "risk_sensitivity",
      dimension: "risk_exposure",
      claim: supplierEvidence || logisticsEvidence
        ? "Supplier or logistics dependency evidence is present and should be interpreted separately from customer demand."
        : "Supplier concentration, MOQ, or lead-time dependency is not yet established.",
      reason: "Distribution models can depend on supplier reliability, order minimums, lead time, logistics, and channel concentration.",
      evidenceIds: idsOf([businessIdea, supplierEvidence, logisticsEvidence]),
      confidence: "high",
      severity: "material",
      effect: supplierEvidence || logisticsEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Supplier terms, MOQ, lead time, alternate suppliers, logistics plan, customs dependency when relevant, or purchase records.",
      limitations: "This does not assume importing, customs exposure, or unfavorable supplier terms without evidence.",
    }));
  }

  if (hasModule("equipment_inventory") && businessIdea) {
    findings.push(finding({
      id: "finding_wholesale_inventory_working_capital_dependency",
      module: "equipment_inventory",
      dimension: "execution_feasibility",
      claim: "Wholesale or distribution creates inventory and working-capital dependency before validated turnover is known.",
      reason: "Inventory must be purchased, stored, delivered, and converted into customer orders on a cycle that supports the margin.",
      evidenceIds: idsOf([businessIdea, revenueItem, supplierEvidence]),
      confidence: "high",
      severity: "material",
      effect: "neutral",
      whatWouldChangeIt: "Inventory quantity, supplier payment terms, customer payment terms, delivery cycle, and stock turnover evidence.",
      limitations: "No working-capital amount, customs rate, or FX exposure is calculated without inputs.",
    }));
  }

  if (hasModule("market_demand") && businessIdea) {
    findings.push(finding({
      id: "finding_wholesale_customer_order_concentration",
      module: "market_demand",
      dimension: "evidence_confidence",
      claim: repeatEvidence
        ? "Repeat customer order evidence is present and should be separated from supplier readiness."
        : "Customer order depth and concentration are not yet evidenced.",
      reason: "Distribution demand depends on repeat buyer orders, customer concentration, and channel access.",
      evidenceIds: idsOf([businessIdea, repeatEvidence]),
      confidence: "high",
      severity: "material",
      effect: repeatEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Repeat purchase orders, customer list, signed supply commitments, invoices, or buyer concentration evidence.",
      limitations: "Retailer need is not proof of recurring wholesale orders.",
    }));
  }

  if (hasModule("revenue_model") && (businessIdea || revenueItem)) {
    findings.push(finding({
      id: "finding_wholesale_margin_readiness",
      module: "revenue_model",
      dimension: "execution_feasibility",
      claim: "Distributor margin readiness is not yet established from the current evidence alone.",
      reason: "Distributor economics depend on purchase cost, selling price, order volume, logistics cost, credit terms, and inventory cycle.",
      evidenceIds: idsOf([businessIdea, revenueItem]),
      confidence: "high",
      severity: "material",
      effect: "unknown",
      whatWouldChangeIt: "Supplier price, sale price, margin, logistics cost, payment timing, MOQ, and repeat order evidence.",
      limitations: "Planned margin is not validated gross-margin evidence.",
    }));
  }

  return findings;
}

function buildProfessionalServicesFindings({ context, hasModule }) {
  const businessIdea = findItem(context, "business_idea") || findItem(context, "original_idea");
  const revenueItem = findItem(context, "planned_revenue_mechanism");
  const laborEvidence = findAnyItem(context, ["labor_skills_requirement", "staffing_plan"]);
  const capacityEvidence = findAnyItem(context, ["operating_capacity_assumption", "target_operating_capacity"]);
  const repeatEvidence = findExternalItem(context, /retainer|renewal|repeat client|recurring client|referral|paid engagement/i);
  const trustEvidence = findExternalItem(context, /credential|reputation|case study|referral|testimonial|trust/i);
  const findings = [];

  if (hasModule("labor_skills") && businessIdea) {
    findings.push(finding({
      id: "finding_professional_expertise_dependency",
      module: "labor_skills",
      dimension: "execution_feasibility",
      claim: laborEvidence || trustEvidence
        ? "Expertise or trust evidence is present and remains distinct from market proof."
        : "Expertise, trust, or reputation evidence is not yet established.",
      reason: "Professional services depend on credible expertise, buyer trust, scope control, and delivery quality.",
      evidenceIds: idsOf([businessIdea, laborEvidence, trustEvidence]),
      confidence: "high",
      severity: "material",
      effect: laborEvidence || trustEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Credentials, case studies, referrals, client testimonials, delivery examples, or partner expertise evidence.",
      limitations: "Expertise claims do not prove market demand.",
    }));
  }

  if (hasModule("operational_capacity") && businessIdea) {
    findings.push(finding({
      id: "finding_professional_billable_utilization_capacity",
      module: "operational_capacity",
      dimension: "execution_feasibility",
      claim: capacityEvidence
        ? "Billable capacity is partly stated and should be compared with delivery demand."
        : "Billable utilization and delivery capacity are not yet established.",
      reason: "Professional-service economics depend on available expert time, sales cycle, scope control, and project delivery capacity.",
      evidenceIds: idsOf([businessIdea, capacityEvidence, revenueItem]),
      confidence: "high",
      severity: "material",
      effect: capacityEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Billable hours, project capacity, utilization target, scope boundaries, delivery process, or client pipeline evidence.",
      limitations: "No utilization rate or project margin is calculated without inputs.",
    }));
  }

  if (hasModule("market_demand") && businessIdea) {
    findings.push(finding({
      id: "finding_professional_repeat_retainer_readiness",
      module: "market_demand",
      dimension: "evidence_confidence",
      claim: repeatEvidence
        ? "Repeat client or retainer evidence is present and should be separated from expertise evidence."
        : "Repeat, referral, or retainer demand is not yet evidenced.",
      reason: "Professional practices often depend on trust, referrals, repeat work, retainers, or a clear sales cycle.",
      evidenceIds: idsOf([businessIdea, repeatEvidence]),
      confidence: "high",
      severity: "material",
      effect: repeatEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Repeat clients, retainers, referrals, paid discovery calls, proposals accepted, or renewal evidence.",
      limitations: "A service capability is not proof of recurring client demand.",
    }));
  }

  if (hasModule("risk_sensitivity") && businessIdea) {
    findings.push(finding({
      id: "finding_professional_founder_dependency",
      module: "risk_sensitivity",
      dimension: "risk_exposure",
      claim: "Founder or key-person dependency should be examined for this professional-service model.",
      reason: "If expertise and sales are concentrated in one person, delivery capacity and growth can be constrained.",
      evidenceIds: [businessIdea.id],
      confidence: "high",
      severity: "material",
      effect: "neutral",
      whatWouldChangeIt: "Delivery team, documented process, delegation plan, repeatable service package, or partner capacity.",
      limitations: "This identifies dependency only; it does not assume the founder is a bottleneck.",
    }));
  }

  return findings;
}

function buildExistingBusinessExpansionFindings({ context, hasModule }) {
  const businessIdea = findItem(context, "business_idea") || findItem(context, "original_idea");
  const baselineEvidence = findExternalItem(context, /current|existing|baseline|revenue|customer base|active customer|operating data|deposit history/i);
  const incrementalEvidence = findExternalItem(context, /incremental|new product|new line|validated incremental|expansion request|additional demand/i);
  const capacityEvidence = findExternalItem(context, /spare capacity|available capacity|unused capacity|current capacity|management capacity/i) ||
    findAnyItem(context, ["current_customer_volume", "current_capacity_staffing", "current_bottleneck_claim"]);
  const cannibalizationEvidence = findExternalItem(context, /cannibal|core capacity|opportunity cost|management bandwidth|threatens core/i);
  const findings = [];

  if (hasModule("implementation") && businessIdea) {
    findings.push(finding({
      id: "finding_expansion_baseline_increment_separation",
      module: "implementation",
      dimension: "information_readiness",
      claim: baselineEvidence
        ? "Existing-business baseline evidence is present and must be separated from the proposed increment."
        : "Current baseline evidence is not yet established separately from the proposed expansion.",
      reason: "Expansion analysis should preserve existing customers, revenue, assets, and operating data without treating the new activity as startup-zero.",
      evidenceIds: idsOf([businessIdea, baselineEvidence]),
      confidence: "high",
      severity: "material",
      effect: baselineEvidence ? "supports" : "unknown",
      whatWouldChangeIt: "Current revenue, current customer base, existing assets, operating data, and a separate description of the proposed increment.",
      limitations: "Strong baseline evidence does not automatically prove the expansion is good.",
    }));
  }

  if (hasModule("operational_capacity") && businessIdea) {
    findings.push(finding({
      id: "finding_expansion_spare_capacity_dependency",
      module: "operational_capacity",
      dimension: "execution_feasibility",
      claim: capacityEvidence
        ? "Capacity evidence is present and should be compared with incremental demand."
        : "Spare capacity and management bandwidth are not yet established for the expansion.",
      reason: "Expansion feasibility depends on whether current assets, staff, and management can absorb the increment without harming the core business.",
      evidenceIds: idsOf([businessIdea, capacityEvidence]),
      confidence: "high",
      severity: "material",
      effect: capacityEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Spare capacity, staffing availability, management bandwidth, bottleneck evidence, or staged outsourcing plan.",
      limitations: "Existing operations help only if they are reusable for the new increment.",
    }));
  }

  if (hasModule("economic_feasibility") && businessIdea) {
    findings.push(finding({
      id: "finding_expansion_incremental_economics_readiness",
      module: "economic_feasibility",
      dimension: "execution_feasibility",
      claim: incrementalEvidence
        ? "Incremental demand or economics evidence is present and should be evaluated separately from baseline performance."
        : "Incremental revenue, cost, or capex evidence is not yet established.",
      reason: "An existing business may be healthy while a proposed expansion still has weak incremental economics.",
      evidenceIds: idsOf([businessIdea, incrementalEvidence]),
      confidence: "high",
      severity: "material",
      effect: incrementalEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Incremental revenue logic, incremental capex, operating cost, validated demand for the new activity, or accepted orders.",
      limitations: "Current revenue is not proof that the proposed increment is viable.",
    }));
  }

  if (hasModule("risk_sensitivity") && businessIdea) {
    findings.push(finding({
      id: "finding_expansion_cannibalization_management_risk",
      module: "risk_sensitivity",
      dimension: "risk_exposure",
      claim: cannibalizationEvidence
        ? "Cannibalization, opportunity-cost, or management-bandwidth evidence is present."
        : "Cannibalization, opportunity cost, and management bandwidth remain untested expansion risks.",
      reason: "Expansion can compete with the core business for staff time, capacity, customer attention, supplier allocation, or management focus.",
      evidenceIds: idsOf([businessIdea, cannibalizationEvidence]),
      confidence: "high",
      severity: "material",
      effect: cannibalizationEvidence ? "neutral" : "unknown",
      whatWouldChangeIt: "Evidence that the expansion does or does not displace core revenue, capacity, customer service, or management time.",
      limitations: "This does not assume cannibalization exists; it records a relevant expansion risk to examine.",
    }));
  }

  return findings;
}

function idsOf(items = []) {
  return items.filter(Boolean).map((item) => item.id);
}

function findAnyItem(context, evidenceClasses = []) {
  return context.items.find((item) =>
    evidenceClasses.some((evidenceClass) => item.evidenceClass === evidenceClass || item.evidenceClass?.includes(evidenceClass))
  ) || null;
}

function findExternalItem(context, pattern) {
  return context.items.find((item) =>
    item.origin === "external_evidence" && pattern.test(`${item.evidenceClass} ${item.claim} ${item.value}`)
  ) || null;
}

function unknownIdsFor(context, topics = []) {
  return context.unknowns
    .filter((unknown) => topics.some((topic) => unknown.topic === topic || unknown.topic?.includes(topic)))
    .map((unknown) => unknown.id);
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
