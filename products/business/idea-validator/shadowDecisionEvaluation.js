import { buildEvidenceLedgerV1 } from "./evidenceLedger.js";
import { selectBusinessModelLensV1 } from "./businessModelLenses.js";
import { buildAnalyticalPlanV1 } from "./analyticalPlan.js";
import { buildStructuredFindingsV1 } from "./analyticalFindings.js";
import { synthesizeDecisionV1, compareLegacyDecision } from "./decisionSynthesis.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";
import contentEn from "./content.en.js";

export const BIV_SHADOW_DECISION_EVALUATION_VERSION = "biv_shadow_decision_evaluation_v1";

export function evaluateShadowDecisionFixtureV1({
  fixture,
  content = contentEn,
} = {}) {
  if (!fixture?.fixtureId) {
    throw new Error("fixtureId is required");
  }
  const evidenceLedger = buildEvidenceLedgerV1({
    rawInput: fixture.rawInput || {},
    confirmedUnderstanding: fixture.confirmedUnderstanding || null,
    downstreamClarifications: fixture.downstreamClarifications || null,
    optionalContext: fixture.optionalContext || null,
    classification: fixture.classification || null,
    externalEvidence: fixture.externalEvidence || [],
  });
  const lensSelection = selectBusinessModelLensV1({
    rawInput: fixture.rawInput || {},
    confirmedUnderstanding: fixture.confirmedUnderstanding || null,
    classification: fixture.classification || null,
    locale: fixture.locale || "en",
  });
  const analyticalPlan = buildAnalyticalPlanV1({ lensSelection, evidenceLedger });
  const baseFindings = buildStructuredFindingsV1({ evidenceLedger, lensSelection, analyticalPlan });
  const structuredFindings = {
    ...baseFindings,
    findings: [
      ...baseFindings.findings,
      ...(fixture.additionalFindings || []),
    ],
  };
  const legacyResult = runLegacyDiagnostic({ fixture, content });
  const shadowDecision = synthesizeDecisionV1({
    structuredFindings,
    evidenceLedger,
    lensSelection,
    decisionObjective: fixture.decisionObjective || fixture.optionalContext?.decisionObjective || "",
    legacyVerdict: legacyResult.legacyVerdict,
  });

  return {
    version: BIV_SHADOW_DECISION_EVALUATION_VERSION,
    fixtureId: fixture.fixtureId,
    category: fixture.category || "uncategorized",
    evidenceLevel: fixture.evidenceLevel || "owner_belief_only",
    lensSelection,
    analyticalModules: analyticalPlan.modules.map((modulePlan) => modulePlan.module),
    findingSummary: summarizeFindings(structuredFindings.findings),
    shadowDecision,
    legacyVerdict: legacyResult.legacyVerdict,
    legacyStatus: legacyResult.legacyStatus,
    expectedDecision: fixture.expectedDecision || "",
    assertions: buildFixtureAssertions({ fixture, shadowDecision }),
    warnings: buildFixtureWarnings({ fixture, shadowDecision, structuredFindings }),
    comparison: classifyLegacyShadowComparison({
      legacyVerdict: legacyResult.legacyVerdict,
      shadowDecisionState: shadowDecision.state,
    }),
  };
}

export function runShadowDecisionEvaluationV1({
  fixtures = getShadowDecisionEvaluationFixturesV1(),
  content = contentEn,
} = {}) {
  const results = fixtures.map((fixture) => evaluateShadowDecisionFixtureV1({ fixture, content }));
  return {
    version: BIV_SHADOW_DECISION_EVALUATION_VERSION,
    results,
    metrics: buildShadowEvaluationMetrics(results),
    manualReviewRows: results.map(toManualReviewRow),
    authority: {
      qaOnly: true,
      determinesProductionVerdict: false,
      affectsScore: false,
      affectsReport: false,
      changesRuntimeBehavior: false,
    },
  };
}

export function getShadowDecisionEvaluationFixturesV1() {
  return [
    {
      fixtureId: "real_estate_warehouse_owner_belief",
      category: "core_business_model",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "Rental warehouses for small merchants that need flexible storage units.",
        targetCustomer: "Small merchants",
        problem: "They need flexible storage without long leases.",
        monetization: "Monthly warehouse rental.",
      },
    },
    {
      fixtureId: "marketplace_technician_owner_belief",
      category: "core_business_model",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
        targetCustomer: "Homeowners and technicians",
        problem: "Customers struggle to find trusted technicians quickly.",
        monetization: "Commission on completed bookings.",
      },
    },
    {
      fixtureId: "retail_packaging_owner_belief",
      category: "core_business_model",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "A packaging store that sells boxes and shipping supplies to small shops.",
        targetCustomer: "Small shop owners",
        problem: "They need reliable packaging supplies nearby.",
        monetization: "Sell packaging products with retail margin.",
        competitiveAdvantage: "Better availability and faster service.",
      },
    },
    {
      fixtureId: "manufacturing_stainless_owner_belief",
      category: "core_business_model",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "A stainless manufacturing workshop that fabricates tables for restaurants.",
        targetCustomer: "Restaurants",
        problem: "They need custom stainless equipment.",
        monetization: "Sell fabricated equipment and installation.",
      },
    },
    {
      fixtureId: "service_ac_repair_owner_belief",
      category: "cross_sector",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "Mobile AC repair and maintenance service for homes and small offices.",
        targetCustomer: "Homeowners and small offices",
        problem: "They need quick AC repair at their location.",
        monetization: "Customers pay per repair visit.",
      },
    },
    {
      fixtureId: "saas_b2b_subscription_owner_belief",
      category: "cross_sector",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "B2B subscription software that helps clinics reduce missed appointments.",
        targetCustomer: "Small private clinics",
        problem: "Patients miss appointments and staff lose time following up.",
        monetization: "Monthly subscription paid by clinics.",
      },
    },
    {
      fixtureId: "food_takeaway_owner_belief",
      category: "cross_sector",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "Small takeaway restaurant serving lunch meals near offices.",
        targetCustomer: "Office workers",
        problem: "They need fast lunch options during short breaks.",
        monetization: "Customers pay per meal.",
      },
    },
    {
      fixtureId: "wholesale_distribution_owner_belief",
      category: "cross_sector",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "Import and distribute cleaning supplies to small retailers.",
        targetCustomer: "Small retail shops",
        problem: "They need reliable stock at wholesale prices.",
        monetization: "Sell imported supplies with distributor margin.",
      },
    },
    {
      fixtureId: "professional_services_owner_belief",
      category: "cross_sector",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "Consulting and accounting practice for small businesses.",
        targetCustomer: "Small business owners",
        problem: "They need help organizing monthly accounts.",
        monetization: "Monthly advisory retainer.",
      },
      classification: {
        confirmedClassification: { primaryType: "professional_service" },
      },
    },
    {
      fixtureId: "existing_business_expansion_professional",
      category: "existing_business",
      evidenceLevel: "behavioral_evidence",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "Existing metal workshop adding a new stainless display shelf product line.",
        targetCustomer: "Restaurant and cafe operators",
        problem: "Existing customers request custom stainless display shelves.",
        monetization: "Sell made-to-order shelves with deposit before fabrication.",
        stage: "expanding",
        currentRevenue: "Current workshop has recurring B2B orders.",
        currentCustomerVolume: "About 20 active business customers.",
        currentCapacityStaffing: "Existing team has spare fabrication capacity two days per week.",
        improvementObjective: "Add a related product line using current equipment.",
      },
      externalEvidence: [
        trustedEvidence("current_customer_base", "Three existing restaurant customers requested shelf quotations.", "external_evidence__expansion_requests"),
        trustedEvidence("deposit_behavior", "Two customers previously paid deposits for custom stainless work.", "external_evidence__deposit_history"),
      ],
    },
    {
      fixtureId: "missing_target_customer",
      category: "missing_information",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "insufficient_information",
      rawInput: {
        businessIdea: "A helpful app for organizing daily tasks.",
        targetCustomer: "",
        problem: "People forget important tasks.",
        monetization: "Monthly subscription.",
      },
    },
    {
      fixtureId: "missing_problem",
      category: "missing_information",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "insufficient_information",
      rawInput: {
        businessIdea: "A service for offices.",
        targetCustomer: "Office managers",
        problem: "",
        monetization: "Monthly service fee.",
      },
    },
    {
      fixtureId: "missing_revenue",
      category: "missing_information",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "insufficient_information",
      rawInput: {
        businessIdea: "A packaging delivery service.",
        targetCustomer: "Small shops",
        problem: "They run out of packaging supplies.",
        monetization: "",
      },
    },
    {
      fixtureId: "beginner_simple_unclear",
      category: "beginner_input",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "insufficient_information",
      rawInput: {
        businessIdea: "I want to start something online.",
        targetCustomer: "",
        problem: "",
        monetization: "",
      },
    },
    {
      fixtureId: "customer_interest_only",
      category: "evidence_escalation",
      evidenceLevel: "stated_interest",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "A booking assistant for independent fitness coaches.",
        targetCustomer: "Independent fitness coaches",
        problem: "Scheduling no-shows waste coach time.",
        monetization: "Monthly subscription.",
      },
      externalEvidence: [
        trustedEvidence("customer_interview_interest", "Twelve coaches said the problem is real and worth solving.", "external_evidence__stated_interest"),
      ],
    },
    {
      fixtureId: "behavioral_paid_pilot",
      category: "evidence_escalation",
      evidenceLevel: "behavioral_evidence",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "A booking assistant for independent fitness coaches.",
        targetCustomer: "Independent fitness coaches",
        problem: "Scheduling no-shows waste coach time.",
        monetization: "Monthly subscription.",
      },
      externalEvidence: [
        trustedEvidence("paid_pilot", "Three coaches paid for a two-week manual pilot.", "external_evidence__paid_pilot"),
        trustedEvidence("customer_interview_interest", "Eight of ten interviewed coaches reported weekly no-show losses.", "external_evidence__customer_interviews"),
      ],
    },
    {
      fixtureId: "repeated_sales_ready_to_proceed",
      category: "proceed",
      evidenceLevel: "repeated_evidence",
      expectedDecision: "proceed",
      rawInput: {
        businessIdea: "A local lunch subscription for office teams.",
        targetCustomer: "Office teams near the kitchen",
        problem: "Teams need reliable daily lunch delivery.",
        monetization: "Weekly prepaid meal subscription.",
      },
      additionalFindings: [
        supported("finding_customer_paid_signal", "customer_stakeholders", "information_readiness", "external_evidence__paid_customers"),
        supported("finding_demand_supported", "market_demand", "opportunity_attractiveness", "external_evidence__repeat_orders"),
        supported("finding_execution_supported", "operational_capacity", "execution_feasibility", "external_evidence__delivery_capacity"),
        supported("finding_risk_controlled", "risk_sensitivity", "risk_exposure", "external_evidence__supplier_terms"),
        supported("finding_evidence_quality_supported", "implementation", "evidence_confidence", "external_evidence__verified_records"),
      ],
    },
    {
      fixtureId: "marketplace_provider_economics_conflict",
      category: "revise",
      evidenceLevel: "negative_evidence",
      expectedDecision: "revise",
      rawInput: {
        businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
        targetCustomer: "Homeowners and technicians",
        problem: "Customers need trusted technicians quickly.",
        monetization: "Commission on completed bookings.",
      },
      additionalFindings: [
        adverse("finding_marketplace_provider_incentive_conflict", "revenue_model", "risk_exposure", "weakens", "material", "Provider economics conflict with the planned commission model."),
      ],
    },
    {
      fixtureId: "retail_supplier_moq_conflict",
      category: "revise",
      evidenceLevel: "negative_evidence",
      expectedDecision: "revise",
      rawInput: {
        businessIdea: "A packaging store focused on small emergency orders.",
        targetCustomer: "Very small shops",
        problem: "They need small quantities of packaging quickly.",
        monetization: "Retail margin on packaging supplies.",
      },
      additionalFindings: [
        adverse("finding_retail_supplier_moq_model_conflict", "economic_feasibility", "risk_exposure", "weakens", "material", "Verified supplier MOQ conflicts with the small-order proposition."),
      ],
    },
    {
      fixtureId: "regulatory_blocker_verified",
      category: "blocker",
      evidenceLevel: "negative_evidence",
      expectedDecision: "do_not_proceed_yet",
      rawInput: {
        businessIdea: "A regulated delivery operation that requires a permit.",
        targetCustomer: "Local businesses",
        problem: "They need delivery support.",
        monetization: "Delivery service fees.",
      },
      additionalFindings: [
        adverse("finding_regulatory_blocker_verified", "risk_sensitivity", "risk_exposure", "contradicts", "critical", "A verified regulatory blocker prevents the proposed operating path."),
      ],
    },
    {
      fixtureId: "critical_supplier_unavailable",
      category: "blocker",
      evidenceLevel: "negative_evidence",
      expectedDecision: "do_not_proceed_yet",
      rawInput: {
        businessIdea: "Distribution of a product that depends on one exclusive supplier.",
        targetCustomer: "Retail shops",
        problem: "They need reliable supply.",
        monetization: "Distributor margin.",
      },
      additionalFindings: [
        adverse("finding_critical_supplier_unavailable", "risk_sensitivity", "risk_exposure", "contradicts", "critical", "The critical supplier is verified unavailable for the proposed channel."),
      ],
    },
    {
      fixtureId: "confident_wording_no_evidence",
      category: "adversarial",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      rawInput: {
        businessIdea: "This will definitely succeed because there is no competition for premium office snacks.",
        targetCustomer: "Office managers",
        problem: "They want better snack options.",
        monetization: "Monthly subscription.",
      },
    },
    {
      fixtureId: "arabic_service_equivalent",
      category: "cross_language",
      evidenceLevel: "owner_belief_only",
      expectedDecision: "test_first",
      locale: "ar",
      rawInput: {
        businessIdea: "خدمة صيانة مكيفات متنقلة للمنازل والمكاتب الصغيرة.",
        targetCustomer: "ملاك المنازل والمكاتب الصغيرة",
        problem: "يحتاجون إلى إصلاح سريع للمكيف في موقعهم.",
        monetization: "يدفع العميل لكل زيارة صيانة.",
      },
    },
  ];
}

export function buildShadowEvaluationMetrics(results = []) {
  return {
    totalFixtures: results.length,
    decisionDistribution: countBy(results, (result) => result.shadowDecision.state),
    lensDistribution: countBy(results, (result) => result.lensSelection.primaryLens),
    confidenceDistribution: countBy(results, (result) => result.shadowDecision.confidence),
    blockerFrequency: results.filter((result) => result.shadowDecision.blockerFindingIds.length > 0).length,
    criticalUnknownFrequency: results.filter((result) => result.shadowDecision.criticalUnknownIds.length > 0).length,
    evidenceLevelDistribution: countBy(results, (result) => result.evidenceLevel),
    legacyComparisonDistribution: countBy(results, (result) => result.comparison.classification),
  };
}

function runLegacyDiagnostic({ fixture, content }) {
  try {
    const result = executeBusinessIdeaValidation({
      rawInput: fixture.rawInput || {},
      source: "guided_discovery",
      language: fixture.locale || "en",
      feasibilityAnswers: { classificationConfirmation: "confirm" },
      content,
    });
    return {
      legacyStatus: result.status || result.journeyState || result.route || "unknown",
      legacyVerdict: result.verdictKey || result.verdict || result.status || "",
    };
  } catch {
    return {
      legacyStatus: "legacy_unavailable",
      legacyVerdict: "legacy_unavailable",
    };
  }
}

function summarizeFindings(findings = []) {
  return findings.map((finding) => ({
    id: finding.id,
    module: finding.module,
    dimension: finding.dimension,
    effect: finding.effect,
    severity: finding.severity,
    confidence: finding.confidence,
    evidenceCount: finding.evidenceIds?.length || 0,
    unknownCount: finding.unknownIds?.length || 0,
  }));
}

function buildFixtureAssertions({ fixture, shadowDecision }) {
  return {
    expectedDecisionMet: fixture.expectedDecision ? shadowDecision.state === fixture.expectedDecision : true,
    hasPrimaryReason: Boolean(shadowDecision.primaryReasonFindingId),
    hasWhatWouldChangeDecision: Boolean(shadowDecision.whatWouldChangeDecision),
    hasNextDecisionAction: Boolean(shadowDecision.nextDecisionAction),
    shadowOnly: shadowDecision.authority?.shadowOnly === true,
  };
}

function buildFixtureWarnings({ fixture, shadowDecision, structuredFindings }) {
  const warnings = [];
  if (fixture.expectedDecision && shadowDecision.state !== fixture.expectedDecision) {
    warnings.push(`Expected ${fixture.expectedDecision}, received ${shadowDecision.state}.`);
  }
  if (structuredFindings.findings.some((finding) => finding.claim && /will definitely succeed|guaranteed success/i.test(finding.claim))) {
    warnings.push("Potential evidence laundering or overconfident finding wording.");
  }
  if (shadowDecision.state === "do_not_proceed_yet" && shadowDecision.blockerFindingIds.length === 0) {
    warnings.push("Do-not-proceed decision has no explicit blocker finding.");
  }
  return warnings;
}

function classifyLegacyShadowComparison({ legacyVerdict, shadowDecisionState }) {
  const comparison = compareLegacyDecision({ legacyVerdict, shadowDecisionState });
  let classification = "legacy unable to express V2 state";
  if (comparison.agreesAtHighLevel) {
    classification = "broadly aligned";
  } else if (/good|strong|proceed|viable/i.test(legacyVerdict) && shadowDecisionState !== "proceed") {
    classification = "shadow more conservative";
  } else if (/weak|invalid|ineligible/i.test(legacyVerdict) && shadowDecisionState === "proceed") {
    classification = "shadow more positive";
  } else if (legacyVerdict) {
    classification = "materially different reasoning";
  }
  return {
    ...comparison,
    classification,
  };
}

function toManualReviewRow(result) {
  const primaryFinding = result.findingSummary.find((finding) => finding.id === result.shadowDecision.primaryReasonFindingId);
  return {
    fixture: result.fixtureId,
    lens: result.lensSelection.primaryLens,
    evidenceLevel: result.evidenceLevel,
    shadowDecision: result.shadowDecision.state,
    confidence: result.shadowDecision.confidence,
    primaryReason: result.shadowDecision.primaryReasonFindingId,
    criticalUnknownOrBlocker: [
      ...result.shadowDecision.criticalUnknownIds,
      ...result.shadowDecision.blockerFindingIds,
    ].join(", "),
    legacy: result.legacyVerdict,
    primaryModule: primaryFinding?.module || "",
  };
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function trustedEvidence(evidenceClass, claim, sourceField) {
  return {
    trusted: true,
    evidenceClass,
    claim,
    value: claim,
    sourceField,
    confidence: "trusted_fixture",
    limitations: "QA fixture evidence only; not externally verified by this system.",
  };
}

function supported(id, module, dimension, evidenceId) {
  return {
    id,
    module,
    dimension,
    claim: "This dimension has stage-appropriate supporting evidence.",
    reason: "The fixture supplies behavioral or repeated evidence for this stage.",
    evidenceIds: [evidenceId],
    unknownIds: [],
    confidence: "high",
    severity: "informational",
    effect: "supports",
    whatWouldChangeIt: "Contradictory evidence or a newly discovered blocker.",
    limitations: "Proceed means next justified commitment only, not guaranteed success.",
  };
}

function adverse(id, module, dimension, effect, severity, claim) {
  return {
    id,
    module,
    dimension,
    claim,
    reason: "The fixture supplies structured negative evidence for this model issue.",
    evidenceIds: [`external_evidence__${id}`],
    unknownIds: [],
    confidence: "high",
    severity,
    effect,
    whatWouldChangeIt: "Verified evidence resolving the adverse condition or a materially changed model.",
    limitations: "This adverse finding is fixture-scoped and does not come from missing information alone.",
  };
}
