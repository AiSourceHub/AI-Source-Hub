import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEvidenceLedgerV1, BIV_EVIDENCE_LEDGER_VERSION } from "./evidenceLedger.js";
import {
  BIV_ANALYTICAL_PLAN_VERSION,
  buildAnalyticalPlanV1,
  validateAnalyticalPlanV1,
} from "./analyticalPlan.js";
import {
  BIV_BUSINESS_MODEL_LENS_VERSION,
  BUSINESS_MODEL_LENSES,
  selectBusinessModelLensV1,
} from "./businessModelLenses.js";
import {
  BIV_STRUCTURED_FINDINGS_VERSION,
  buildStructuredFindingsV1,
  validateStructuredFindingsV1,
} from "./analyticalFindings.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";
import contentEn from "./content.en.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const benchmarkCases = {
  rentalWarehouses: {
    businessIdea: "Rental warehouses for small merchants that need flexible storage units.",
    targetCustomer: "Small merchants",
    problem: "They need flexible storage without long leases.",
    monetization: "Monthly warehouse rental.",
  },
  technicianPlatform: {
    businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
    targetCustomer: "Homeowners and technicians",
    problem: "Customers struggle to find trusted technicians quickly.",
    monetization: "Commission on completed bookings.",
  },
  packagingStore: {
    businessIdea: "A packaging store that sells boxes and shipping supplies to small shops.",
    targetCustomer: "Small shop owners",
    problem: "They need reliable packaging supplies nearby.",
    monetization: "Sell packaging products with retail margin.",
  },
  stainlessWorkshop: {
    businessIdea: "A stainless manufacturing workshop that fabricates tables for restaurants.",
    targetCustomer: "Restaurants",
    problem: "They need custom stainless equipment.",
    monetization: "Sell fabricated equipment and installation.",
  },
};

const plans = Object.fromEntries(Object.entries(benchmarkCases).map(([name, rawInput]) => {
  const evidenceLedger = buildEvidenceLedgerV1({ rawInput });
  const lensSelection = selectBusinessModelLensV1({ rawInput });
  const plan = buildAnalyticalPlanV1({ lensSelection, evidenceLedger });
  assert.equal(plan.version, BIV_ANALYTICAL_PLAN_VERSION, name);
  assert.equal(validateAnalyticalPlanV1(plan).ok, true, name);
  assert.equal(plan.authority.determinesVerdict, false, name);
  assert.equal(plan.authority.changesRuntimeBehavior, false, name);
  return [name, plan];
}));

assert.equal(plans.rentalWarehouses.primaryLens, BUSINESS_MODEL_LENSES.REAL_ESTATE);
assert.deepEqual(moduleIds(plans.rentalWarehouses), [
  "market_demand",
  "economic_feasibility",
  "startup_capital",
  "location",
  "operational_capacity",
  "risk_sensitivity",
]);
assert.equal(moduleIds(plans.rentalWarehouses).includes("location"), true);

assert.equal(plans.technicianPlatform.primaryLens, BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM);
assert.deepEqual(moduleIds(plans.technicianPlatform), [
  "market_demand",
  "customer_stakeholders",
  "revenue_model",
  "operational_capacity",
  "risk_sensitivity",
]);

assert.equal(plans.packagingStore.primaryLens, BUSINESS_MODEL_LENSES.RETAIL_TRADING);
assert.deepEqual(moduleIds(plans.packagingStore), [
  "market_demand",
  "competition_alternatives",
  "revenue_model",
  "equipment_inventory",
  "economic_feasibility",
  "risk_sensitivity",
]);

assert.equal(plans.stainlessWorkshop.primaryLens, BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL);
assert.deepEqual(moduleIds(plans.stainlessWorkshop), [
  "market_demand",
  "revenue_model",
  "startup_capital",
  "equipment_inventory",
  "labor_skills",
  "operational_capacity",
  "risk_sensitivity",
]);

assert.notDeepEqual(moduleIds(plans.rentalWarehouses), moduleIds(plans.technicianPlatform));
assert.notDeepEqual(moduleIds(plans.technicianPlatform), moduleIds(plans.packagingStore));
assert.notDeepEqual(moduleIds(plans.packagingStore), moduleIds(plans.stainlessWorkshop));

const ownerOnlyInput = {
  businessIdea: "A mobile AC repair service for homeowners.",
  targetCustomer: "Homeowners",
  problem: "They need fast repair when the AC fails.",
  monetization: "Customers pay per repair visit.",
};
const ownerOnlyLedger = buildEvidenceLedgerV1({ rawInput: ownerOnlyInput });
const ownerOnlyLens = selectBusinessModelLensV1({ rawInput: ownerOnlyInput });
const ownerOnlyFindings = buildStructuredFindingsV1({
  evidenceLedger: ownerOnlyLedger,
  lensSelection: ownerOnlyLens,
});
assert.equal(ownerOnlyFindings.version, BIV_STRUCTURED_FINDINGS_VERSION);
assert.equal(ownerOnlyFindings.sourceVersions.evidenceLedger, BIV_EVIDENCE_LEDGER_VERSION);
assert.equal(ownerOnlyFindings.sourceVersions.lensSelection, BIV_BUSINESS_MODEL_LENS_VERSION);
assert.equal(ownerOnlyFindings.sourceVersions.analyticalPlan, BIV_ANALYTICAL_PLAN_VERSION);
assert.equal(validateStructuredFindingsV1(ownerOnlyFindings).ok, true);
assert.equal(ownerOnlyFindings.authority.determinesVerdict, false);
assert.equal(ownerOnlyFindings.authority.affectsScore, false);
assert.equal(ownerOnlyFindings.authority.affectsReport, false);

for (const finding of ownerOnlyFindings.findings) {
  assert.equal(finding.evidenceIds.length > 0 || finding.unknownIds.length > 0, true, finding.id);
  assert.doesNotMatch(finding.claim, /market demand is strong|execution is feasible|do not proceed/i);
}

const demandFinding = byId(ownerOnlyFindings, "finding_demand_not_yet_evidenced");
assert.match(demandFinding.claim, /does not establish demand strength/i);
assert.equal(demandFinding.effect, "unknown");
assert.doesNotMatch(demandFinding.claim, /demand is weak/i);
assert.match(demandFinding.whatWouldChangeIt, /paid orders|accepted quotations|customer interviews/i);

const revenueFinding = byId(ownerOnlyFindings, "finding_revenue_without_payment_evidence");
assert.match(revenueFinding.claim, /willingness to pay is not yet evidenced/i);
assert.equal(revenueFinding.effect, "unknown");
assert.match(revenueFinding.limitations, /Planned monetization does not create payment validation/i);

const targetFinding = byId(ownerOnlyFindings, "finding_target_customer_readiness");
assert.match(targetFinding.limitations, /does not prove demand/i);
assert.equal(targetFinding.effect, "supports");

const missingLedger = buildEvidenceLedgerV1({
  rawInput: {
    businessIdea: "A short idea",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
});
const missingFindings = buildStructuredFindingsV1({
  evidenceLedger: missingLedger,
  lensSelection: selectBusinessModelLensV1({ rawInput: { businessIdea: "A short idea" } }),
});
const missingTarget = byId(missingFindings, "finding_target_customer_readiness");
assert.equal(missingTarget.effect, "unknown");
assert.match(missingTarget.limitations, /not a negative business finding/i);
assert.equal(missingTarget.unknownIds.length, 1);
assert.equal(Boolean(byId(missingFindings, "finding_meaningful_unknowns_exist")), true);

const inferredResult = executeBusinessIdeaValidation({
  rawInput: ownerOnlyInput,
  language: "en",
  content: contentEn,
});
const inferredFindings = buildStructuredFindingsV1({
  evidenceLedger: inferredResult.evidenceLedger,
  lensSelection: ownerOnlyLens,
});
const systemFinding = byId(inferredFindings, "finding_system_inference_is_distinct");
assert.equal(Boolean(systemFinding), true);
assert.match(systemFinding.claim, /System inference exists/i);
assert.match(systemFinding.limitations, /cannot become a user-confirmed fact/i);

const serialized = JSON.parse(JSON.stringify(ownerOnlyFindings));
assert.equal(serialized.version, BIV_STRUCTURED_FINDINGS_VERSION);
assert.equal(Array.isArray(serialized.findings), true);
assert.equal(validateStructuredFindingsV1(serialized).ok, true);

const before = executeBusinessIdeaValidation({
  rawInput: ownerOnlyInput,
  language: "en",
  source: "guided_discovery",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
});
buildStructuredFindingsV1({
  evidenceLedger: before.evidenceLedger,
  lensSelection: ownerOnlyLens,
});
const after = executeBusinessIdeaValidation({
  rawInput: ownerOnlyInput,
  language: "en",
  source: "guided_discovery",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
});
assert.equal(after.route, before.route);
assert.equal(after.journeyState, before.journeyState);
assert.deepEqual(after.score, before.score);
assert.equal(after.verdictKey, before.verdictKey);
assert.deepEqual(after.recommendation, before.recommendation);
assert.deepEqual(after.report.sections, before.report.sections);

const petInput = {
  businessIdea: "An industrial workshop that makes stainless shelves for restaurants.",
  targetCustomer: "Restaurants",
  problem: "They need custom shelves.",
  monetization: "Sell manufactured shelves.",
};
const petSafeFindings = buildStructuredFindingsV1({
  evidenceLedger: buildEvidenceLedgerV1({ rawInput: petInput }),
  lensSelection: selectBusinessModelLensV1({ rawInput: petInput }),
});
const findingText = JSON.stringify(petSafeFindings);
assert.doesNotMatch(findingText, /PET|plastic waste|flakes|pellets|recycling buyer/i);

const runtimeFiles = [
  "executionResult.js",
  "validatorOrchestrator.js",
  "guidedDiscoveryBivAdapter.js",
  "guidedDiscoveryHandoffMapper.js",
  "guidedDiscoverySufficiencyBridge.js",
  "intentDiscoveryPrototype.js",
  "report.js",
  "recommendations.js",
  "scoring.js",
  "../../../src/pages/BusinessIdeaDiscoveryPrototypePage.jsx",
  "../../../src/pages/BusinessIdeaValidatorPage.jsx",
  "../../../src/pages/BusinessIdeaValidatorRoute.jsx",
];
for (const filePath of runtimeFiles) {
  const source = readFileSync(join(__dirname, filePath), "utf8");
  assert.equal(source.includes("analyticalFindings"), false, `${filePath} should not consume Structured Findings V1 at runtime`);
  assert.equal(source.includes("analyticalPlan"), false, `${filePath} should not consume Analytical Plan V1 at runtime`);
}

console.log("Structured Findings Foundation V1 tests: PASS");

function moduleIds(plan) {
  return plan.modules.map((modulePlan) => modulePlan.module);
}

function byId(result, id) {
  return result.findings.find((finding) => finding.id === id);
}
