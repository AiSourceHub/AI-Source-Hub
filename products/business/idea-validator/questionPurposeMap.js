export const BIV_QUESTION_PURPOSE_MAP_VERSION = "biv_question_purpose_map_v1";

export const QUESTION_INFORMATION_OWNERS = {
  OWNER: "owner",
  EXTERNAL_RESEARCH: "external_research",
  MARKET_TEST: "market_test",
  SYSTEM: "system",
};

export const QUESTION_REQUIREMENT_LEVELS = {
  REQUIRED: "required",
  OPTIONAL: "optional",
};

export const QUESTION_ROLES = {
  BLOCKER: "blocker",
  REFINEMENT: "refinement",
};

export const QUESTION_UNKNOWN_HANDLING = {
  CONTINUE: "continue",
  RECORD_UNKNOWN: "record_unknown",
  RESEARCH: "research",
  MARKET_TEST: "market_test",
  BLOCKS_CURRENT_DECISION: "blocks_current_decision",
};

export const QUESTION_AUDIT_STATUSES = {
  WELL_PURPOSED: "well_purposed",
  PURPOSE_UNCLEAR: "purpose_unclear",
  DUPLICATE_OR_OVERLAPPING: "duplicate_or_overlapping",
  WRONG_INFORMATION_OWNER: "wrong_information_owner",
  LOW_DECISION_VALUE: "low_decision_value",
  LEGACY_ONLY: "legacy_only",
  SPECIALIST_ONLY: "specialist_only",
};

const dimensions = {
  INFORMATION_READINESS: "information_readiness",
  OPPORTUNITY_ATTRACTIVENESS: "opportunity_attractiveness",
  EXECUTION_FEASIBILITY: "execution_feasibility",
  RISK_EXPOSURE: "risk_exposure",
  EVIDENCE_CONFIDENCE: "evidence_confidence",
};

const modules = {
  MARKET_DEMAND: "market_demand",
  CUSTOMER_STAKEHOLDERS: "customer_stakeholders",
  COMPETITION_ALTERNATIVES: "competition_alternatives",
  REVENUE_MODEL: "revenue_model",
  ECONOMIC_FEASIBILITY: "economic_feasibility",
  STARTUP_CAPITAL: "startup_capital",
  OPERATING_COST: "operating_cost",
  LOCATION: "location",
  EQUIPMENT_INVENTORY: "equipment_inventory",
  LABOR_SKILLS: "labor_skills",
  LICENSING_COMPLIANCE: "licensing_compliance",
  OPERATIONAL_CAPACITY: "operational_capacity",
  RISK_SENSITIVITY: "risk_sensitivity",
  IMPLEMENTATION: "implementation",
  CLASSIFICATION: "classification",
};

const purposeRecords = [
  core("businessIdea", {
    purpose: "Define the business being evaluated before any decision is made.",
    analysisModule: modules.IMPLEMENTATION,
    expectedEvidence: "owner_data.business_idea",
    notes: "Covers the current engine question and the Guided Discovery additional-idea clarification when the original description is too thin.",
  }),
  core("originalIdea", {
    purpose: "Preserve the owner's raw first description separately from confirmed interpretation.",
    analysisModule: modules.IMPLEMENTATION,
    expectedEvidence: "owner_data.original_idea",
  }),
  core("ideaDescription", {
    purpose: "Legacy form description of what the business provides and how it operates.",
    analysisModule: modules.IMPLEMENTATION,
    expectedEvidence: "owner_data.business_idea",
    auditStatus: QUESTION_AUDIT_STATUSES.LEGACY_ONLY,
    notes: "Legacy UI field projected into businessIdea by buildEngineInput.",
  }),
  refinement("businessName", {
    purpose: "Optional legacy label that can help identify the idea but should not drive business attractiveness.",
    analysisModule: modules.IMPLEMENTATION,
    expectedEvidence: "owner_data.business_label",
    auditStatus: QUESTION_AUDIT_STATUSES.LEGACY_ONLY,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.CONTINUE,
  }),
  refinement("industry", {
    purpose: "Owner-provided sector hint for classification and report context.",
    analysisModule: modules.CLASSIFICATION,
    expectedEvidence: "owner_data.industry_hint",
    auditStatus: QUESTION_AUDIT_STATUSES.LEGACY_ONLY,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.CONTINUE,
  }),
  refinement("stage", {
    purpose: "Owner-provided business maturity context for current engine stage handling.",
    analysisModule: modules.IMPLEMENTATION,
    expectedEvidence: "owner_data.project_stage",
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RECORD_UNKNOWN,
  }),
  guided("selectedIntent", {
    purpose: "Confirm the owner's intended business role before downstream interpretation.",
    analysisModule: modules.CLASSIFICATION,
    expectedEvidence: "owner_data.confirmed_business_role",
    notes: "Supporting evidence only; it is not final BIV classification.",
  }),
  guided("coreOffering", {
    purpose: "Confirm what the project will primarily provide to the customer.",
    analysisModule: modules.CLASSIFICATION,
    expectedEvidence: "owner_data.confirmed_core_offering",
  }),
  guided("coreOfferingStatus", {
    purpose: "Record whether the core offering was defined or intentionally left undecided.",
    analysisModule: modules.IMPLEMENTATION,
    expectedEvidence: "owner_data.confirmed_core_offering_status",
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RECORD_UNKNOWN,
  }),
  guided("selectedOperatingApproach", {
    purpose: "Confirm the primary operating approach used to reach the customer.",
    analysisModule: modules.CLASSIFICATION,
    expectedEvidence: "owner_data.confirmed_operating_approach",
    notes: "Supporting evidence for operating model only; BIV remains classification authority.",
  }),
  guided("selectedOperatingApproaches", {
    purpose: "Confirm the specific approaches included when the owner chooses a mixed delivery model.",
    analysisModule: modules.CLASSIFICATION,
    expectedEvidence: "owner_data.confirmed_operating_approaches",
    notes: "Supports fixed, customer-site, online, home-based, or mixed operating-model evidence.",
  }),
  blocker("targetCustomer", {
    purpose: "Identify the customer, buyer, user, or stakeholder whose problem should be evaluated.",
    analysisModule: modules.CUSTOMER_STAKEHOLDERS,
    expectedEvidence: "owner_data.target_customer_hypothesis",
    dimensions: [dimensions.INFORMATION_READINESS, dimensions.OPPORTUNITY_ATTRACTIVENESS],
    notes: "Owner data only. Naming a target customer does not prove demand.",
  }),
  blocker("problem", {
    purpose: "State the customer problem, need, job, or pain the business is trying to address.",
    analysisModule: modules.MARKET_DEMAND,
    expectedEvidence: "owner_data.customer_problem_hypothesis",
    dimensions: [dimensions.INFORMATION_READINESS, dimensions.OPPORTUNITY_ATTRACTIVENESS],
    notes: "This is a hypothesis/input, not demand proof or willingness-to-pay evidence.",
  }),
  blocker("problemSolved", {
    purpose: "Legacy form version of the customer problem statement.",
    analysisModule: modules.MARKET_DEMAND,
    expectedEvidence: "owner_data.customer_problem_hypothesis",
    dimensions: [dimensions.INFORMATION_READINESS, dimensions.OPPORTUNITY_ATTRACTIVENESS],
    auditStatus: QUESTION_AUDIT_STATUSES.LEGACY_ONLY,
    notes: "Overlaps current engine field problem.",
  }),
  blocker("monetization", {
    purpose: "Record the intended revenue mechanism and who is expected to pay.",
    analysisModule: modules.REVENUE_MODEL,
    expectedEvidence: "owner_data.planned_revenue_mechanism",
    dimensions: [dimensions.INFORMATION_READINESS, dimensions.OPPORTUNITY_ATTRACTIVENESS],
    notes: "Planned monetization is not payment evidence, validated revenue, or willingness-to-pay proof.",
  }),
  blocker("revenueModel", {
    purpose: "Legacy form version of intended revenue mechanism.",
    analysisModule: modules.REVENUE_MODEL,
    expectedEvidence: "owner_data.planned_revenue_mechanism",
    dimensions: [dimensions.INFORMATION_READINESS, dimensions.OPPORTUNITY_ATTRACTIVENESS],
    auditStatus: QUESTION_AUDIT_STATUSES.LEGACY_ONLY,
    notes: "Overlaps current engine field monetization and remains planned revenue mechanism only.",
  }),
  refinement("currentSolution", {
    purpose: "Capture the customer's current workaround or alternative.",
    analysisModule: modules.COMPETITION_ALTERNATIVES,
    expectedEvidence: "owner_data.current_solution_or_alternative",
    dimensions: [dimensions.OPPORTUNITY_ATTRACTIVENESS, dimensions.EVIDENCE_CONFIDENCE],
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RECORD_UNKNOWN,
  }),
  refinement("competitiveAdvantage", {
    purpose: "Capture the owner's differentiation hypothesis.",
    analysisModule: modules.COMPETITION_ALTERNATIVES,
    expectedEvidence: "owner_data.competitive_advantage_claim",
    dimensions: [dimensions.OPPORTUNITY_ATTRACTIVENESS, dimensions.EVIDENCE_CONFIDENCE],
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RECORD_UNKNOWN,
    notes: "A differentiation claim remains an owner hypothesis until supported.",
  }),
  profile("firstProject", "Record whether this is the owner's first project for guidance depth only."),
  profile("userExperienceLevel", "Record owner experience for explanation depth and support level only."),
  profile("decisionObjective", "Record what decision the owner wants the evaluation to support."),
  profile("projectStageIntent", "Record the owner's intended project stage for adaptive guidance."),
  context("country", {
    purpose: "Record country context for later policy, cost, permit, and localization research.",
    analysisModule: modules.LOCATION,
    expectedEvidence: "owner_data.country_context",
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RECORD_UNKNOWN,
  }),
  context("city", {
    purpose: "Record city or region context for later local research and report specificity.",
    analysisModule: modules.LOCATION,
    expectedEvidence: "owner_data.city_context",
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RECORD_UNKNOWN,
  }),
  classification("classificationConfirmation", {
    purpose: "Require owner review of BIV proposed classification before execution continues.",
    expectedEvidence: "owner_confirmation.classification_review",
    unknownHandling: QUESTION_UNKNOWN_HANDLING.BLOCKS_CURRENT_DECISION,
    notes: "Protects classification correctness and specialist routing.",
  }),
  classification("projectTypeCorrection", {
    purpose: "Allow owner correction of proposed BIV project type.",
    expectedEvidence: "owner_data.project_type_correction",
  }),
  classification("operatingModelCorrection", {
    purpose: "Allow owner correction of proposed BIV operating model.",
    expectedEvidence: "owner_data.operating_model_correction",
  }),
  classification("classificationCorrectionReason", {
    purpose: "Optional owner explanation for why classification was corrected.",
    expectedEvidence: "owner_data.classification_correction_reason",
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.OPTIONAL,
    questionRole: QUESTION_ROLES.REFINEMENT,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.CONTINUE,
  }),
  feasibility("startupCapital", modules.STARTUP_CAPITAL, {
    purpose: "Separate owner available capital from the business capital required to execute.",
    expectedEvidence: "owner_data.available_capital_and_setup_cost_assumption",
    notes: "Available capital is not proof that the business is fully feasible.",
  }),
  feasibility("budgetRange", modules.STARTUP_CAPITAL, {
    purpose: "Capture the owner's available budget range without inventing a capital estimate.",
    expectedEvidence: "owner_data.available_budget_range",
    notes: "This records owner capacity; required capital still needs evidence or calculation.",
  }),
  feasibility("locationCostIncluded", modules.STARTUP_CAPITAL, {
    purpose: "Clarify whether location-related costs are included in the owner's budget.",
    expectedEvidence: "owner_data.budget_scope_assumption",
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.OPTIONAL,
  }),
  feasibility("recurringCosts", modules.OPERATING_COST, {
    purpose: "Identify expected monthly operating-cost categories.",
    expectedEvidence: "owner_data.operating_cost_assumption",
  }),
  feasibility("locationPremises", modules.LOCATION, {
    purpose: "Identify the location or premises requirement for delivery.",
    expectedEvidence: "owner_data.location_requirement",
  }),
  feasibility("countryCity", modules.LOCATION, {
    purpose: "Capture local context for permits, demand, supplier, and cost research.",
    expectedEvidence: "owner_data.location_context",
  }),
  feasibility("operatingFormat", modules.LOCATION, {
    purpose: "Record the intended operating format so feasibility questions match the model.",
    expectedEvidence: "owner_data.operating_format",
  }),
  feasibility("premisesStatus", modules.LOCATION, {
    purpose: "Separate owned, rented, undecided, or not-needed premises from the customer problem.",
    expectedEvidence: "owner_data.premises_status",
  }),
  feasibility("spaceRequirement", modules.LOCATION, {
    purpose: "Capture or mark unknown approximate space needs for later local research.",
    expectedEvidence: "external_research.space_requirement_or_owner_unknown",
    informationOwner: QUESTION_INFORMATION_OWNERS.EXTERNAL_RESEARCH,
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.OPTIONAL,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RESEARCH,
  }),
  feasibility("equipmentTools", modules.EQUIPMENT_INVENTORY, {
    purpose: "Identify equipment, tools, vehicles, devices, software, or systems needed to operate.",
    expectedEvidence: "owner_data.equipment_requirement",
  }),
  feasibility("equipmentLevel", modules.EQUIPMENT_INVENTORY, {
    purpose: "Capture the owner-described equipment or tool level required.",
    expectedEvidence: "owner_data.equipment_level_assumption",
  }),
  feasibility("deliveryModel", modules.EQUIPMENT_INVENTORY, {
    purpose: "Describe manual, automated, software-led, or partner-led delivery assumptions.",
    expectedEvidence: "owner_data.delivery_model",
  }),
  feasibility("quotationStatus", modules.EQUIPMENT_INVENTORY, {
    purpose: "Separate supplier quotes, rough prices, and absent pricing evidence.",
    expectedEvidence: "supplier_quote.pricing_evidence_status",
    informationOwner: QUESTION_INFORMATION_OWNERS.EXTERNAL_RESEARCH,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RESEARCH,
  }),
  feasibility("installationMaintenance", modules.EQUIPMENT_INVENTORY, {
    purpose: "Identify installation and maintenance dependencies that may need supplier input.",
    expectedEvidence: "supplier_quote.installation_maintenance_input",
    informationOwner: QUESTION_INFORMATION_OWNERS.EXTERNAL_RESEARCH,
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.OPTIONAL,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RESEARCH,
  }),
  feasibility("inventoryMaterials", modules.EQUIPMENT_INVENTORY, {
    purpose: "Identify inventory, raw materials, supplies, goods, parts, or inputs required.",
    expectedEvidence: "owner_data.inventory_materials_requirement",
  }),
  feasibility("laborRolesSkills", modules.LABOR_SKILLS, {
    purpose: "Identify roles, staffing, and skills required to operate.",
    expectedEvidence: "owner_data.labor_skills_requirement",
  }),
  feasibility("staffingPlan", modules.LABOR_SKILLS, {
    purpose: "Capture the first-version staffing plan and required skills.",
    expectedEvidence: "owner_data.staffing_plan",
  }),
  feasibility("licensesCompliance", modules.LICENSING_COMPLIANCE, {
    purpose: "Identify permits, licenses, approvals, or compliance checks that must be researched.",
    expectedEvidence: "external_research.licensing_requirement",
    informationOwner: QUESTION_INFORMATION_OWNERS.EXTERNAL_RESEARCH,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RESEARCH,
  }),
  feasibility("licensesDependencies", modules.LICENSING_COMPLIANCE, {
    purpose: "Capture known or unknown license and compliance dependencies.",
    expectedEvidence: "external_research.license_dependency",
    informationOwner: QUESTION_INFORMATION_OWNERS.EXTERNAL_RESEARCH,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RESEARCH,
  }),
  feasibility("utilitiesNeeds", modules.OPERATING_COST, {
    purpose: "Identify utilities, infrastructure, or technical operating requirements.",
    expectedEvidence: "external_research.utilities_or_infrastructure_requirement",
    informationOwner: QUESTION_INFORMATION_OWNERS.EXTERNAL_RESEARCH,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RESEARCH,
  }),
  feasibility("suppliersDependencies", modules.RISK_SENSITIVITY, {
    purpose: "Identify supplier, partner, platform, API, vendor, logistics, or dependency risks.",
    expectedEvidence: "owner_or_supplier_input.supplier_dependency",
    dimensions: [dimensions.EXECUTION_FEASIBILITY, dimensions.RISK_EXPOSURE, dimensions.EVIDENCE_CONFIDENCE],
  }),
  feasibility("operatingCapacity", modules.OPERATIONAL_CAPACITY, {
    purpose: "Capture the operating capacity needed for the first test or first version.",
    expectedEvidence: "owner_data.operating_capacity_assumption",
  }),
  feasibility("targetCapacity", modules.OPERATIONAL_CAPACITY, {
    purpose: "Capture the owner's target capacity using the natural unit for the idea.",
    expectedEvidence: "owner_data.target_operating_capacity",
  }),
  feasibility("operatingHours", modules.OPERATIONAL_CAPACITY, {
    purpose: "Record service window or operating hours for later labor and capacity estimates.",
    expectedEvidence: "owner_data.operating_hours",
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.OPTIONAL,
  }),
  feasibility("targetCustomerPromise", modules.CUSTOMER_STAKEHOLDERS, {
    purpose: "Connect the intended customer to the promise the offer makes.",
    expectedEvidence: "owner_data.customer_promise_hypothesis",
    notes: "Useful for clarity; does not prove demand.",
  }),
  feasibility("implementationTimeline", modules.IMPLEMENTATION, {
    purpose: "Identify a realistic setup, testing, launch, and first milestone timeline.",
    expectedEvidence: "owner_data.implementation_timeline_assumption",
  }),
  feasibility("knownFacts", modules.IMPLEMENTATION, {
    purpose: "Separate owner-known facts from wishes, guesses, and unknowns.",
    expectedEvidence: "owner_data.known_fact_claims",
    dimensions: [dimensions.INFORMATION_READINESS, dimensions.EVIDENCE_CONFIDENCE],
  }),
  feasibility("researchNeeded", modules.IMPLEMENTATION, {
    purpose: "Identify what should be researched or estimated later instead of invented now.",
    expectedEvidence: "owner_data.research_need",
    informationOwner: QUESTION_INFORMATION_OWNERS.EXTERNAL_RESEARCH,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RESEARCH,
  }),
  feasibility("professionalInputs", modules.RISK_SENSITIVITY, {
    purpose: "Identify inputs requiring a supplier, authority, or professional.",
    expectedEvidence: "external_research.professional_or_supplier_input",
    informationOwner: QUESTION_INFORMATION_OWNERS.EXTERNAL_RESEARCH,
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.OPTIONAL,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RESEARCH,
  }),
  feasibility("assumptionsToValidate", modules.MARKET_DEMAND, {
    purpose: "Record assumptions that need future evidence before relying on the decision.",
    expectedEvidence: "market_test.assumptions_to_validate",
    informationOwner: QUESTION_INFORMATION_OWNERS.MARKET_TEST,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.MARKET_TEST,
  }),
  feasibility("improvementObjective", modules.IMPLEMENTATION, {
    purpose: "State the improvement or expansion decision for an existing business.",
    expectedEvidence: "owner_data.improvement_objective",
  }),
  feasibility("currentRevenue", modules.ECONOMIC_FEASIBILITY, {
    purpose: "Capture current revenue range for an existing business.",
    expectedEvidence: "owner_data.current_revenue_claim",
  }),
  feasibility("currentCostsMargins", modules.ECONOMIC_FEASIBILITY, {
    purpose: "Capture current cost and margin context for an existing business.",
    expectedEvidence: "owner_data.current_cost_margin_claim",
  }),
  feasibility("currentCustomerVolume", modules.OPERATIONAL_CAPACITY, {
    purpose: "Capture current customer, order, booking, user, or transaction volume.",
    expectedEvidence: "owner_data.current_customer_volume",
  }),
  feasibility("repeatBusiness", modules.MARKET_DEMAND, {
    purpose: "Capture repeat purchase or retention context when the owner knows it.",
    expectedEvidence: "owner_data.repeat_business_claim",
    informationOwner: QUESTION_INFORMATION_OWNERS.MARKET_TEST,
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.OPTIONAL,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.MARKET_TEST,
  }),
  feasibility("currentCapacityStaffing", modules.LABOR_SKILLS, {
    purpose: "Capture current team, shifts, equipment, and output capacity.",
    expectedEvidence: "owner_data.current_capacity_staffing",
  }),
  feasibility("currentBottlenecks", modules.RISK_SENSITIVITY, {
    purpose: "Identify what currently limits growth or execution.",
    expectedEvidence: "owner_data.current_bottleneck_claim",
  }),
  specialist("plasticWasteType", "Identify the waste stream for industrial plastic analysis.", "owner_data.plastic_waste_type"),
  specialist("intendedOutput", "Identify the intended industrial output.", "owner_data.intended_output"),
  specialist("targetProductionCapacity", "Capture target production capacity with a time basis.", "owner_data.production_capacity_target"),
  specialist("availableBudgetSar", "Capture available industrial budget in SAR.", "owner_data.available_industrial_budget"),
  specialist("preferredCityRegion", "Capture preferred industrial city or region.", "owner_data.preferred_industrial_location"),
  specialist("existingPremises", "Identify whether industrial land, warehouse, or premises already exist.", "owner_data.existing_industrial_premises"),
  specialist("wasteSourceQuantity", "Identify source and expected quantity of plastic waste.", "owner_data.waste_source_quantity"),
  specialist("industrialExperienceTeam", "Capture industrial experience or operating team readiness.", "owner_data.industrial_experience_team"),
  specialist("expectedBuyers", "Capture expected buyer categories for the industrial output.", "owner_data.expected_buyers_hypothesis"),
  specialist("salesScope", "Identify whether sales are local, export, or both.", "owner_data.sales_scope"),
  marketTest("willingnessToPay", "Future market-test concept for whether customers will pay at the intended price."),
  marketTest("switchingBehavior", "Future market-test concept for whether customers will switch from current alternatives."),
  marketTest("actualPurchases", "Future evidence concept for purchases, orders, paid pilots, or invoices."),
];

const purposeMap = Object.freeze(
  purposeRecords.reduce((map, record) => {
    map[record.questionId] = Object.freeze({
      ...record,
      decisionDimensions: Object.freeze([...record.decisionDimensions]),
    });
    return map;
  }, {})
);

export function getQuestionPurposeMapV1() {
  return purposeMap;
}

export function getQuestionPurpose(questionId = "") {
  return purposeMap[questionId] || null;
}

export function listQuestionPurposes() {
  return Object.values(purposeMap);
}

export function validateQuestionPurposeMapV1(map = purposeMap) {
  const errors = [];
  if (!map || typeof map !== "object" || Array.isArray(map)) {
    return { ok: false, errors: ["map must be an object"] };
  }
  const seen = new Set();
  for (const [key, record] of Object.entries(map)) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      errors.push(`${key}: record must be an object`);
      continue;
    }
    if (record.questionId !== key) errors.push(`${key}: questionId must match key`);
    if (seen.has(record.questionId)) errors.push(`${key}: duplicate questionId`);
    seen.add(record.questionId);
    for (const field of ["questionId", "purpose", "informationOwner", "analysisModule", "requirementLevel", "questionRole", "expectedEvidence", "unknownHandling", "stopImpact", "auditStatus"]) {
      if (!record[field]) errors.push(`${key}: missing ${field}`);
    }
    if (!Array.isArray(record.decisionDimensions) || record.decisionDimensions.length === 0) {
      errors.push(`${key}: decisionDimensions must be non-empty`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function core(questionId, overrides = {}) {
  return record(questionId, {
    informationOwner: QUESTION_INFORMATION_OWNERS.OWNER,
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.REQUIRED,
    questionRole: QUESTION_ROLES.BLOCKER,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.BLOCKS_CURRENT_DECISION,
    stopImpact: "Blocks current BIV decision until enough owner context exists.",
    decisionDimensions: [dimensions.INFORMATION_READINESS, dimensions.EVIDENCE_CONFIDENCE],
    auditStatus: QUESTION_AUDIT_STATUSES.WELL_PURPOSED,
    ...overrides,
  });
}

function guided(questionId, overrides = {}) {
  return record(questionId, {
    informationOwner: QUESTION_INFORMATION_OWNERS.OWNER,
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.REQUIRED,
    questionRole: QUESTION_ROLES.BLOCKER,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RECORD_UNKNOWN,
    stopImpact: "Blocks confirmed-understanding readiness, not final BIV authority.",
    decisionDimensions: [dimensions.INFORMATION_READINESS, dimensions.EVIDENCE_CONFIDENCE],
    auditStatus: QUESTION_AUDIT_STATUSES.WELL_PURPOSED,
    ...overrides,
  });
}

function blocker(questionId, overrides = {}) {
  return record(questionId, {
    informationOwner: QUESTION_INFORMATION_OWNERS.OWNER,
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.REQUIRED,
    questionRole: QUESTION_ROLES.BLOCKER,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.BLOCKS_CURRENT_DECISION,
    stopImpact: "Blocks current evaluation because the engine cannot responsibly evaluate this concept as missing.",
    decisionDimensions: [dimensions.INFORMATION_READINESS, dimensions.EVIDENCE_CONFIDENCE],
    auditStatus: QUESTION_AUDIT_STATUSES.WELL_PURPOSED,
    ...overrides,
  });
}

function refinement(questionId, overrides = {}) {
  return record(questionId, {
    informationOwner: QUESTION_INFORMATION_OWNERS.OWNER,
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.OPTIONAL,
    questionRole: QUESTION_ROLES.REFINEMENT,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RECORD_UNKNOWN,
    stopImpact: "Should not block by itself.",
    decisionDimensions: [dimensions.EVIDENCE_CONFIDENCE],
    auditStatus: QUESTION_AUDIT_STATUSES.WELL_PURPOSED,
    ...overrides,
  });
}

function profile(questionId, purpose) {
  return refinement(questionId, {
    purpose,
    analysisModule: modules.IMPLEMENTATION,
    expectedEvidence: `owner_data.profile_${questionId}`,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.CONTINUE,
    notes: "Profile/adaptive context only; it must not alter evidence strength or business attractiveness.",
  });
}

function context(questionId, overrides = {}) {
  return refinement(questionId, {
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.OPTIONAL,
    questionRole: QUESTION_ROLES.REFINEMENT,
    decisionDimensions: [dimensions.INFORMATION_READINESS, dimensions.RISK_EXPOSURE],
    ...overrides,
  });
}

function classification(questionId, overrides = {}) {
  return record(questionId, {
    informationOwner: QUESTION_INFORMATION_OWNERS.OWNER,
    analysisModule: modules.CLASSIFICATION,
    decisionDimensions: [dimensions.INFORMATION_READINESS, dimensions.RISK_EXPOSURE, dimensions.EVIDENCE_CONFIDENCE],
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.REQUIRED,
    questionRole: QUESTION_ROLES.BLOCKER,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.BLOCKS_CURRENT_DECISION,
    stopImpact: "Blocks specialist routing, scoring, and reporting until classification is sufficiently trustworthy.",
    auditStatus: QUESTION_AUDIT_STATUSES.WELL_PURPOSED,
    ...overrides,
  });
}

function feasibility(questionId, analysisModule, overrides = {}) {
  return record(questionId, {
    informationOwner: QUESTION_INFORMATION_OWNERS.OWNER,
    analysisModule,
    decisionDimensions: [dimensions.EXECUTION_FEASIBILITY, dimensions.RISK_EXPOSURE, dimensions.EVIDENCE_CONFIDENCE],
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.REQUIRED,
    questionRole: QUESTION_ROLES.BLOCKER,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.RECORD_UNKNOWN,
    stopImpact: "May block a more specific feasibility decision but should not fabricate missing facts.",
    auditStatus: QUESTION_AUDIT_STATUSES.WELL_PURPOSED,
    ...overrides,
  });
}

function specialist(questionId, purpose, expectedEvidence) {
  return record(questionId, {
    purpose,
    informationOwner: QUESTION_INFORMATION_OWNERS.OWNER,
    analysisModule: modules.IMPLEMENTATION,
    decisionDimensions: [dimensions.INFORMATION_READINESS, dimensions.EXECUTION_FEASIBILITY, dimensions.RISK_EXPOSURE],
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.REQUIRED,
    questionRole: QUESTION_ROLES.BLOCKER,
    expectedEvidence,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.BLOCKS_CURRENT_DECISION,
    stopImpact: "Blocks industrial specialist analysis until the required specialist detail is provided.",
    auditStatus: QUESTION_AUDIT_STATUSES.SPECIALIST_ONLY,
  });
}

function marketTest(questionId, purpose) {
  return record(questionId, {
    purpose,
    informationOwner: QUESTION_INFORMATION_OWNERS.MARKET_TEST,
    analysisModule: modules.MARKET_DEMAND,
    decisionDimensions: [dimensions.OPPORTUNITY_ATTRACTIVENESS, dimensions.EVIDENCE_CONFIDENCE],
    requirementLevel: QUESTION_REQUIREMENT_LEVELS.OPTIONAL,
    questionRole: QUESTION_ROLES.REFINEMENT,
    expectedEvidence: `market_test.${questionId}`,
    unknownHandling: QUESTION_UNKNOWN_HANDLING.MARKET_TEST,
    stopImpact: "Should be recorded as unvalidated market evidence until tested.",
    auditStatus: QUESTION_AUDIT_STATUSES.WELL_PURPOSED,
  });
}

function record(questionId, values) {
  return {
    questionId,
    purpose: values.purpose,
    informationOwner: values.informationOwner,
    analysisModule: values.analysisModule,
    decisionDimensions: values.decisionDimensions,
    requirementLevel: values.requirementLevel,
    questionRole: values.questionRole,
    expectedEvidence: values.expectedEvidence,
    unknownHandling: values.unknownHandling,
    stopImpact: values.stopImpact,
    auditStatus: values.auditStatus,
    notes: values.notes || "",
  };
}
