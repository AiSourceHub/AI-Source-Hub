import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inputSchema } from "./schema.js";
import { GUIDED_DISCOVERY_CLARIFICATION_IDS } from "./guidedDiscoverySufficiencyBridge.js";
import {
  industrialClarificationFields,
  industrialClarificationSteps,
} from "./requestUnderstanding.js";
import {
  BIV_QUESTION_PURPOSE_MAP_VERSION,
  QUESTION_INFORMATION_OWNERS,
  QUESTION_REQUIREMENT_LEVELS,
  QUESTION_ROLES,
  QUESTION_UNKNOWN_HANDLING,
  getQuestionPurpose,
  getQuestionPurposeMapV1,
  listQuestionPurposes,
  validateQuestionPurposeMapV1,
} from "./questionPurposeMap.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const map = getQuestionPurposeMapV1();
const records = listQuestionPurposes();

assert.equal(BIV_QUESTION_PURPOSE_MAP_VERSION, "biv_question_purpose_map_v1");
assert.equal(validateQuestionPurposeMapV1(map).ok, true);
assert.equal(records.length, Object.keys(map).length);
assert.equal(new Set(records.map((record) => record.questionId)).size, records.length);

for (const record of records) {
  assert.equal(typeof record.questionId, "string");
  assert.equal(record.questionId.length > 0, true);
  assert.equal(typeof record.purpose, "string");
  assert.equal(record.purpose.length > 0, true);
  assert.equal(Object.values(QUESTION_INFORMATION_OWNERS).includes(record.informationOwner), true, record.questionId);
  assert.equal(Object.values(QUESTION_REQUIREMENT_LEVELS).includes(record.requirementLevel), true, record.questionId);
  assert.equal(Object.values(QUESTION_ROLES).includes(record.questionRole), true, record.questionId);
  assert.equal(Object.values(QUESTION_UNKNOWN_HANDLING).includes(record.unknownHandling), true, record.questionId);
  assert.equal(Array.isArray(record.decisionDimensions), true, record.questionId);
  assert.equal(record.decisionDimensions.length > 0, true, record.questionId);
}

const currentEngineFields = inputSchema.map((field) => field.id);
for (const fieldId of currentEngineFields) {
  assert.ok(getQuestionPurpose(fieldId), `missing current engine question purpose: ${fieldId}`);
}

const guidedDiscoveryFields = [
  "originalIdea",
  "selectedIntent",
  "coreOffering",
  "coreOfferingStatus",
  "selectedOperatingApproach",
  "selectedOperatingApproaches",
  ...Object.values(GUIDED_DISCOVERY_CLARIFICATION_IDS),
];
for (const fieldId of guidedDiscoveryFields) {
  assert.ok(getQuestionPurpose(fieldId), `missing Guided Discovery question purpose: ${fieldId}`);
}

const legacyFormFields = [
  "businessName",
  "ideaDescription",
  "industry",
  "problemSolved",
  "currentSolution",
  "competitiveAdvantage",
  "revenueModel",
  "stage",
];
for (const fieldId of legacyFormFields) {
  assert.ok(getQuestionPurpose(fieldId), `missing legacy form question purpose: ${fieldId}`);
}

const profileAndClassificationFields = [
  "firstProject",
  "userExperienceLevel",
  "decisionObjective",
  "country",
  "city",
  "projectStageIntent",
  "classificationConfirmation",
  "projectTypeCorrection",
  "operatingModelCorrection",
  "classificationCorrectionReason",
];
for (const fieldId of profileAndClassificationFields) {
  assert.ok(getQuestionPurpose(fieldId), `missing profile/classification question purpose: ${fieldId}`);
}

const feasibilityFieldIds = [
  "startupCapital",
  "recurringCosts",
  "locationPremises",
  "equipmentTools",
  "inventoryMaterials",
  "laborRolesSkills",
  "licensesCompliance",
  "suppliersDependencies",
  "operatingCapacity",
  "implementationTimeline",
  "countryCity",
  "operatingFormat",
  "deliveryModel",
  "targetCustomerPromise",
  "targetCapacity",
  "premisesStatus",
  "spaceRequirement",
  "locationCostIncluded",
  "budgetRange",
  "quotationStatus",
  "equipmentLevel",
  "installationMaintenance",
  "utilitiesNeeds",
  "operatingHours",
  "staffingPlan",
  "licensesDependencies",
  "knownFacts",
  "researchNeeded",
  "professionalInputs",
  "assumptionsToValidate",
  "improvementObjective",
  "currentRevenue",
  "currentCostsMargins",
  "currentCustomerVolume",
  "repeatBusiness",
  "currentCapacityStaffing",
  "currentBottlenecks",
];
for (const fieldId of feasibilityFieldIds) {
  assert.ok(getQuestionPurpose(fieldId), `missing feasibility question purpose: ${fieldId}`);
}

const industrialFieldIds = industrialClarificationFields.map((field) => field.id);
const industrialStepFieldIds = industrialClarificationSteps.flatMap((step) => step.fields);
assert.deepEqual(new Set(industrialFieldIds), new Set(industrialStepFieldIds));
for (const fieldId of industrialFieldIds) {
  const purpose = getQuestionPurpose(fieldId);
  assert.ok(purpose, `missing industrial specialist question purpose: ${fieldId}`);
  assert.equal(purpose.auditStatus, "specialist_only");
  assert.equal(purpose.questionRole, QUESTION_ROLES.BLOCKER);
}

const ArabicEnglishConceptualPairs = [
  ["selectedIntent", "selectedIntent"],
  ["coreOffering", "coreOffering"],
  ["selectedOperatingApproach", "selectedOperatingApproach"],
  ["selectedOperatingApproaches", "selectedOperatingApproaches"],
  ["targetCustomer", "targetCustomer"],
  ["problem", "problem"],
  ["monetization", "monetization"],
];
for (const [arabicPurposeId, englishPurposeId] of ArabicEnglishConceptualPairs) {
  assert.equal(arabicPurposeId, englishPurposeId);
  assert.equal(getQuestionPurpose(arabicPurposeId)?.questionId, englishPurposeId);
}

const targetCustomer = getQuestionPurpose("targetCustomer");
assert.equal(targetCustomer.informationOwner, QUESTION_INFORMATION_OWNERS.OWNER);
assert.match(targetCustomer.expectedEvidence, /target_customer_hypothesis/);
assert.doesNotMatch(targetCustomer.expectedEvidence, /validated|demand_proof|market_test/);
assert.match(targetCustomer.notes, /does not prove demand/i);

const problem = getQuestionPurpose("problem");
assert.match(problem.expectedEvidence, /customer_problem_hypothesis/);
assert.match(problem.notes, /not demand proof/i);
assert.doesNotMatch(problem.expectedEvidence, /validated|demand_proof/);

const monetization = getQuestionPurpose("monetization");
assert.match(monetization.expectedEvidence, /planned_revenue_mechanism/);
assert.match(monetization.notes, /not payment evidence/i);
assert.doesNotMatch(monetization.expectedEvidence, /actual_payment|paid|invoice|transaction/);

for (const fieldId of ["firstProject", "userExperienceLevel", "decisionObjective", "projectStageIntent"]) {
  const purpose = getQuestionPurpose(fieldId);
  assert.equal(purpose.questionRole, QUESTION_ROLES.REFINEMENT);
  assert.equal(purpose.unknownHandling, QUESTION_UNKNOWN_HANDLING.CONTINUE);
  assert.match(purpose.notes, /must not alter evidence strength or business attractiveness/i);
}

const budget = getQuestionPurpose("budgetRange");
assert.match(budget.expectedEvidence, /available_budget/);
assert.match(budget.notes, /required capital still needs evidence/i);
assert.doesNotMatch(budget.expectedEvidence, /required_capital_proof/);

for (const fieldId of ["spaceRequirement", "licensesCompliance", "licensesDependencies", "researchNeeded", "professionalInputs"]) {
  const purpose = getQuestionPurpose(fieldId);
  assert.equal(purpose.informationOwner, QUESTION_INFORMATION_OWNERS.EXTERNAL_RESEARCH);
  assert.equal(purpose.unknownHandling, QUESTION_UNKNOWN_HANDLING.RESEARCH);
}

for (const fieldId of ["assumptionsToValidate", "repeatBusiness", "willingnessToPay", "switchingBehavior", "actualPurchases"]) {
  const purpose = getQuestionPurpose(fieldId);
  assert.equal(purpose.informationOwner, QUESTION_INFORMATION_OWNERS.MARKET_TEST);
  assert.equal(purpose.unknownHandling, QUESTION_UNKNOWN_HANDLING.MARKET_TEST);
}

const classificationConfirmation = getQuestionPurpose("classificationConfirmation");
assert.equal(classificationConfirmation.questionRole, QUESTION_ROLES.BLOCKER);
assert.match(classificationConfirmation.stopImpact, /Blocks specialist routing, scoring, and reporting/i);

const runtimeFiles = [
  "executionResult.js",
  "validatorOrchestrator.js",
  "guidedDiscoveryBivAdapter.js",
  "guidedDiscoveryHandoffMapper.js",
  "guidedDiscoverySufficiencyBridge.js",
  "intentDiscoveryPrototype.js",
  "../../../src/pages/BusinessIdeaDiscoveryPrototypePage.jsx",
  "../../../src/pages/BusinessIdeaValidatorPage.jsx",
  "../../../src/pages/BusinessIdeaValidatorRoute.jsx",
];
for (const filePath of runtimeFiles) {
  const source = readFileSync(join(__dirname, filePath), "utf8");
  assert.equal(source.includes("questionPurposeMap"), false, `${filePath} should not consume Question Purpose Map V1 at runtime`);
}

console.log("Question Purpose Map V1 tests: PASS");
