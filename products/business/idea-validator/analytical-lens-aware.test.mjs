import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEvidenceLedgerV1 } from "./evidenceLedger.js";
import { selectBusinessModelLensV1, BUSINESS_MODEL_LENSES } from "./businessModelLenses.js";
import { buildAnalyticalPlanV1 } from "./analyticalPlan.js";
import {
  buildStructuredFindingsV1,
  validateStructuredFindingsV1,
} from "./analyticalFindings.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";
import contentEn from "./content.en.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const benchmarks = {
  rentalWarehouses: {
    expectedLens: BUSINESS_MODEL_LENSES.REAL_ESTATE,
    rawInput: {
      businessIdea: "Rental warehouses for small merchants that need flexible storage units.",
      targetCustomer: "Small merchants",
      problem: "They need flexible storage without long leases.",
      monetization: "Monthly warehouse rental.",
    },
    requiredFindingIds: [
      "finding_real_estate_occupancy_utilization_readiness",
      "finding_real_estate_location_dependency",
      "finding_real_estate_revenue_economic_readiness",
      "finding_real_estate_capital_site_commitment",
    ],
    forbiddenFindingIds: [
      "finding_marketplace_liquidity_dependency",
      "finding_manufacturing_production_capacity_unknown",
    ],
    expectedTerms: [/occupancy|utilization/i, /location/i, /rental/i, /capital|site commitment/i],
  },
  technicianPlatform: {
    expectedLens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
    rawInput: {
      businessIdea: "A marketplace platform that connects homeowners with independent technicians.",
      targetCustomer: "Homeowners and technicians",
      problem: "Customers struggle to find trusted technicians quickly.",
      monetization: "Commission on completed bookings.",
    },
    requiredFindingIds: [
      "finding_marketplace_supply_side_readiness",
      "finding_marketplace_demand_side_readiness",
      "finding_marketplace_liquidity_dependency",
      "finding_marketplace_monetization_participation_separation",
      "finding_marketplace_trust_quality_dependency",
    ],
    forbiddenFindingIds: [
      "finding_real_estate_occupancy_utilization_readiness",
      "finding_manufacturing_equipment_capacity_readiness",
    ],
    expectedTerms: [/supply/i, /demand/i, /liquidity/i, /commission|fee/i, /trust|quality/i],
  },
  packagingStore: {
    expectedLens: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
    rawInput: {
      businessIdea: "A packaging store that sells boxes and shipping supplies to small shops.",
      targetCustomer: "Small shop owners",
      problem: "They need reliable packaging supplies nearby.",
      monetization: "Sell packaging products with retail margin.",
      competitiveAdvantage: "Better availability and faster service.",
    },
    requiredFindingIds: [
      "finding_retail_repeat_purchase_readiness",
      "finding_retail_supplier_inventory_dependency",
      "finding_retail_differentiation_evidence",
      "finding_retail_working_capital_dependency",
    ],
    forbiddenFindingIds: [
      "finding_marketplace_liquidity_dependency",
      "finding_manufacturing_production_capacity_unknown",
    ],
    expectedTerms: [/repeat-purchase|repeat purchasing/i, /supplier|inventory/i, /differentiation/i, /working-capital/i],
  },
  stainlessWorkshop: {
    expectedLens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
    rawInput: {
      businessIdea: "A stainless manufacturing workshop that fabricates tables for restaurants.",
      targetCustomer: "Restaurants",
      problem: "They need custom stainless equipment.",
      monetization: "Sell fabricated equipment and installation.",
    },
    requiredFindingIds: [
      "finding_manufacturing_equipment_capacity_readiness",
      "finding_manufacturing_skilled_labor_dependency",
      "finding_manufacturing_production_capacity_unknown",
      "finding_manufacturing_b2b_procurement_order_evidence",
      "finding_manufacturing_material_supplier_dependency",
      "finding_manufacturing_capital_readiness",
    ],
    forbiddenFindingIds: [
      "finding_marketplace_liquidity_dependency",
      "finding_real_estate_occupancy_utilization_readiness",
    ],
    expectedTerms: [/equipment/i, /skilled labor/i, /production capacity/i, /procurement|order/i, /material|supplier/i, /capital/i],
  },
};

const results = {};

for (const [name, benchmark] of Object.entries(benchmarks)) {
  const lensSelection = selectBusinessModelLensV1({ rawInput: benchmark.rawInput });
  const evidenceLedger = buildEvidenceLedgerV1({ rawInput: benchmark.rawInput });
  const analyticalPlan = buildAnalyticalPlanV1({ lensSelection, evidenceLedger });
  const structured = buildStructuredFindingsV1({ evidenceLedger, lensSelection, analyticalPlan });
  const text = findingText(structured);

  assert.equal(lensSelection.primaryLens, benchmark.expectedLens, name);
  assert.equal(validateStructuredFindingsV1(structured).ok, true, name);
  assert.equal(structured.authority.determinesVerdict, false, name);
  assert.equal(structured.authority.affectsScore, false, name);
  assert.equal(structured.authority.affectsReport, false, name);
  assert.equal(structured.authority.changesRuntimeBehavior, false, name);

  for (const id of benchmark.requiredFindingIds) {
    assert.equal(Boolean(byId(structured, id)), true, `${name} should include ${id}`);
  }
  for (const id of benchmark.forbiddenFindingIds) {
    assert.equal(Boolean(byId(structured, id)), false, `${name} should not include ${id}`);
  }
  for (const term of benchmark.expectedTerms) {
    assert.match(text, term, `${name} should surface ${term}`);
  }
  for (const finding of structured.findings) {
    assert.equal(finding.evidenceIds.length > 0 || finding.unknownIds.length > 0, true, finding.id);
    assert.doesNotMatch(finding.claim, /execution is feasible|market demand is strong|do not proceed/i);
  }
  results[name] = structured;
}

assertBenchmarkSetsDiffer(results);

const realEstateText = findingText(results.rentalWarehouses);
assert.doesNotMatch(realEstateText, /provider-side supply|marketplace liquidity|machine|labor production/i);

const marketplaceText = findingText(results.technicianPlatform);
assert.match(marketplaceText, /Provider-side supply is not yet evidenced/i);
assert.match(marketplaceText, /Demand-side customer participation/i);
assert.match(marketplaceText, /liquidity cannot yet be assessed/i);
assert.doesNotMatch(marketplaceText, /occupancy|gross margin|production capacity/i);

const retailText = findingText(results.packagingStore);
assert.match(retailText, /repeat-purchase behavior has not been evidenced/i);
assert.match(retailText, /owner-stated rather than evidenced/i);
assert.match(retailText, /working-capital dependency/i);
assert.doesNotMatch(retailText, /marketplace liquidity|skilled labor/i);

const manufacturingText = findingText(results.stainlessWorkshop);
assert.match(manufacturingText, /required equipment set and capacity/i);
assert.match(manufacturingText, /Skilled labor or staffing requirements/i);
assert.match(manufacturingText, /B2B procurement or order evidence/i);
assert.doesNotMatch(manufacturingText, /PET|plastic waste|flakes|pellets|recycling buyer/i);

const carWashInput = {
  businessIdea: "A car wash service with washing machines and cleaning equipment.",
  targetCustomer: "Car owners",
  problem: "They need convenient car cleaning.",
  monetization: "Customers pay per wash.",
};
const carWashResult = buildFindingsFor(carWashInput);
assert.equal(carWashResult.lensSelection.primaryLens, BUSINESS_MODEL_LENSES.SERVICE);
assert.equal(carWashResult.structured.findings.some((item) => item.id.startsWith("finding_manufacturing_")), false);

const ownerOnlyRuntimeInput = {
  businessIdea: "A mobile AC repair service for homeowners.",
  targetCustomer: "Homeowners",
  problem: "They need fast repair when the AC fails.",
  monetization: "Customers pay per repair visit.",
};
const before = executeBusinessIdeaValidation({
  rawInput: ownerOnlyRuntimeInput,
  language: "en",
  source: "guided_discovery",
  feasibilityAnswers: { classificationConfirmation: "confirm" },
  content: contentEn,
});
buildFindingsFor(ownerOnlyRuntimeInput);
const after = executeBusinessIdeaValidation({
  rawInput: ownerOnlyRuntimeInput,
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

const moduleSource = readFileSync(join(__dirname, "analyticalFindings.js"), "utf8");
assert.equal(moduleSource.includes("petSpecialist"), false);
assert.equal(moduleSource.includes("plasticWasteSpecialist"), false);

console.log("Lens-Aware Analysis Modules V1 tests: PASS");

function buildFindingsFor(rawInput) {
  const lensSelection = selectBusinessModelLensV1({ rawInput });
  const evidenceLedger = buildEvidenceLedgerV1({ rawInput });
  const analyticalPlan = buildAnalyticalPlanV1({ lensSelection, evidenceLedger });
  const structured = buildStructuredFindingsV1({ evidenceLedger, lensSelection, analyticalPlan });
  return { lensSelection, evidenceLedger, analyticalPlan, structured };
}

function byId(result, id) {
  return result.findings.find((finding) => finding.id === id);
}

function findingText(result) {
  return JSON.stringify(result.findings);
}

function materialSignature(result) {
  return result.findings
    .filter((finding) => finding.severity === "material")
    .map((finding) => `${finding.module}:${finding.id}:${finding.unknownIds.length}`)
    .sort();
}

function assertBenchmarkSetsDiffer(resultMap) {
  const signatures = Object.entries(resultMap).map(([name, result]) => [name, materialSignature(result)]);
  for (let index = 0; index < signatures.length; index += 1) {
    for (let next = index + 1; next < signatures.length; next += 1) {
      assert.notDeepEqual(
        signatures[index][1],
        signatures[next][1],
        `${signatures[index][0]} and ${signatures[next][0]} should not generate the same material finding set`
      );
    }
  }
}
