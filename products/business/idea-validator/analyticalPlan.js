import { getQuestionPurpose, getQuestionPurposeMapV1 } from "./questionPurposeMap.js";

export const BIV_ANALYTICAL_PLAN_VERSION = "biv_analytical_plan_v1";

const lensModulePurposeIds = {
  marketplace_platform: [
    ["market_demand", ["problem", "assumptionsToValidate"]],
    ["customer_stakeholders", ["targetCustomer", "selectedIntent"]],
    ["revenue_model", ["monetization"]],
    ["operational_capacity", ["operatingCapacity", "targetCapacity"]],
    ["risk_sensitivity", ["suppliersDependencies", "professionalInputs"]],
  ],
  real_estate: [
    ["market_demand", ["problem", "assumptionsToValidate"]],
    ["economic_feasibility", ["currentRevenue", "currentCostsMargins"]],
    ["startup_capital", ["budgetRange", "startupCapital", "locationCostIncluded"]],
    ["location", ["locationPremises", "countryCity", "premisesStatus", "spaceRequirement"]],
    ["operational_capacity", ["operatingCapacity", "targetCapacity"]],
    ["risk_sensitivity", ["currentBottlenecks", "professionalInputs"]],
  ],
  retail_trading: [
    ["market_demand", ["problem", "assumptionsToValidate"]],
    ["competition_alternatives", ["currentSolution", "competitiveAdvantage"]],
    ["revenue_model", ["monetization"]],
    ["equipment_inventory", ["inventoryMaterials", "equipmentTools"]],
    ["economic_feasibility", ["currentRevenue", "currentCostsMargins"]],
    ["risk_sensitivity", ["suppliersDependencies"]],
  ],
  wholesale_import_distribution: [
    ["market_demand", ["problem", "assumptionsToValidate"]],
    ["revenue_model", ["monetization"]],
    ["startup_capital", ["budgetRange", "startupCapital"]],
    ["equipment_inventory", ["inventoryMaterials"]],
    ["operational_capacity", ["operatingCapacity", "targetCapacity"]],
    ["risk_sensitivity", ["suppliersDependencies", "currentBottlenecks"]],
  ],
  manufacturing_industrial: [
    ["market_demand", ["problem", "assumptionsToValidate"]],
    ["revenue_model", ["monetization"]],
    ["startup_capital", ["budgetRange", "startupCapital"]],
    ["equipment_inventory", ["equipmentTools", "inventoryMaterials", "quotationStatus"]],
    ["labor_skills", ["laborRolesSkills", "staffingPlan"]],
    ["operational_capacity", ["operatingCapacity", "targetCapacity"]],
    ["risk_sensitivity", ["suppliersDependencies", "professionalInputs"]],
  ],
  service: [
    ["market_demand", ["problem", "assumptionsToValidate"]],
    ["customer_stakeholders", ["targetCustomer", "targetCustomerPromise"]],
    ["revenue_model", ["monetization"]],
    ["labor_skills", ["laborRolesSkills", "staffingPlan"]],
    ["operational_capacity", ["operatingCapacity", "targetCapacity"]],
    ["risk_sensitivity", ["suppliersDependencies", "licensesDependencies"]],
  ],
  saas_software: [
    ["market_demand", ["problem", "assumptionsToValidate"]],
    ["customer_stakeholders", ["targetCustomer"]],
    ["revenue_model", ["monetization"]],
    ["equipment_inventory", ["deliveryModel", "equipmentTools"]],
    ["operational_capacity", ["operatingCapacity"]],
    ["risk_sensitivity", ["suppliersDependencies"]],
  ],
  food_beverage: [
    ["market_demand", ["problem", "repeatBusiness"]],
    ["revenue_model", ["monetization"]],
    ["operating_cost", ["recurringCosts", "utilitiesNeeds"]],
    ["location", ["locationPremises", "premisesStatus"]],
    ["labor_skills", ["laborRolesSkills", "staffingPlan"]],
    ["licensing_compliance", ["licensesCompliance", "licensesDependencies"]],
    ["risk_sensitivity", ["suppliersDependencies"]],
  ],
  professional_services: [
    ["market_demand", ["problem"]],
    ["customer_stakeholders", ["targetCustomer"]],
    ["revenue_model", ["monetization"]],
    ["labor_skills", ["laborRolesSkills", "staffingPlan"]],
    ["operational_capacity", ["operatingCapacity"]],
    ["risk_sensitivity", ["currentBottlenecks"]],
  ],
  existing_business_expansion: [
    ["implementation", ["improvementObjective", "projectStageIntent", "decisionObjective"]],
    ["economic_feasibility", ["currentRevenue", "currentCostsMargins"]],
    ["operational_capacity", ["currentCustomerVolume", "currentCapacityStaffing", "currentBottlenecks"]],
    ["risk_sensitivity", ["currentBottlenecks", "assumptionsToValidate"]],
  ],
  generic: [
    ["market_demand", ["problem"]],
    ["customer_stakeholders", ["targetCustomer"]],
    ["revenue_model", ["monetization"]],
    ["implementation", ["businessIdea", "knownFacts", "researchNeeded"]],
  ],
};

export function buildAnalyticalPlanV1({
  lensSelection = {},
  evidenceLedger = {},
  questionPurposeMap = getQuestionPurposeMapV1(),
} = {}) {
  const primaryLens = lensSelection.primaryLens || "generic";
  const secondaryLens = lensSelection.secondaryLens || "";
  const moduleRows = [
    ...modulesForLens(primaryLens),
    ...modulesForLens(secondaryLens),
  ];
  const modules = mergeModuleRows(moduleRows)
    .map(([module, purposeIds]) => buildPlanModule({
      module,
      purposeIds,
      primaryLens,
      secondaryLens,
      evidenceLedger,
      questionPurposeMap,
    }))
    .filter(Boolean);

  return {
    version: BIV_ANALYTICAL_PLAN_VERSION,
    primaryLens,
    ...(secondaryLens ? { secondaryLens } : {}),
    modules,
    authority: {
      determinesWhatToAnalyzeLater: true,
      determinesVerdict: false,
      changesRuntimeBehavior: false,
    },
  };
}

export function validateAnalyticalPlanV1(plan = {}) {
  const errors = [];
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return { ok: false, errors: ["plan must be an object"] };
  }
  if (plan.version !== BIV_ANALYTICAL_PLAN_VERSION) errors.push("invalid version");
  if (!plan.primaryLens) errors.push("primaryLens is required");
  if (!Array.isArray(plan.modules)) errors.push("modules must be an array");
  for (const modulePlan of plan.modules || []) {
    if (!modulePlan.module) errors.push("module is required");
    if (!modulePlan.reason) errors.push(`${modulePlan.module}: reason is required`);
    if (!Array.isArray(modulePlan.sourceQuestionPurposeIds)) errors.push(`${modulePlan.module}: sourceQuestionPurposeIds must be an array`);
    if (!Array.isArray(modulePlan.evidenceIds)) errors.push(`${modulePlan.module}: evidenceIds must be an array`);
    if (!Array.isArray(modulePlan.unknownIds)) errors.push(`${modulePlan.module}: unknownIds must be an array`);
  }
  return { ok: errors.length === 0, errors };
}

function modulesForLens(lens = "") {
  return lensModulePurposeIds[lens] || [];
}

function mergeModuleRows(rows = []) {
  const map = new Map();
  for (const [module, purposeIds] of rows) {
    const existing = map.get(module) || [];
    map.set(module, [...new Set([...existing, ...purposeIds])]);
  }
  return [...map.entries()];
}

function buildPlanModule({ module, purposeIds, primaryLens, secondaryLens, evidenceLedger, questionPurposeMap }) {
  const filteredPurposeIds = purposeIds.filter((id) => questionPurposeMap[id]);
  if (!filteredPurposeIds.length) return null;
  return {
    module,
    reason: buildReason({ module, primaryLens, secondaryLens }),
    sourceQuestionPurposeIds: filteredPurposeIds,
    evidenceIds: findEvidenceIdsForPurposes(evidenceLedger, filteredPurposeIds),
    unknownIds: findUnknownIdsForPurposes(evidenceLedger, filteredPurposeIds),
  };
}

function buildReason({ module, primaryLens, secondaryLens }) {
  const lensText = secondaryLens ? `${primaryLens} with ${secondaryLens}` : primaryLens;
  return `${module} is relevant to the ${lensText} lens plan; this does not affect the verdict.`;
}

function findEvidenceIdsForPurposes(evidenceLedger = {}, purposeIds = []) {
  const items = Array.isArray(evidenceLedger.items) ? evidenceLedger.items : [];
  const evidenceClasses = purposeIds
    .map((id) => getQuestionPurpose(id)?.expectedEvidence || "")
    .flatMap(splitEvidenceConcepts);
  return items
    .filter((item) =>
      purposeIds.some((id) => item.sourceField?.endsWith(`.${id}`) || item.sourceField === id) ||
      evidenceClasses.some((evidenceClass) => item.evidenceClass === evidenceClass || item.evidenceClass?.includes(evidenceClass))
    )
    .map((item) => item.id);
}

function findUnknownIdsForPurposes(evidenceLedger = {}, purposeIds = []) {
  const unknowns = Array.isArray(evidenceLedger.unknowns) ? evidenceLedger.unknowns : [];
  return unknowns
    .filter((unknown) =>
      purposeIds.some((id) => unknown.sourceField?.endsWith(`.${id}`) || unknown.topic === id || unknown.topic?.includes(id))
    )
    .map((unknown) => unknown.id);
}

function splitEvidenceConcepts(value = "") {
  return String(value)
    .split(/[._]/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 3);
}
