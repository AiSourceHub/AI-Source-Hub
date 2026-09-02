import assert from "node:assert/strict";
import {
  buildDiscoveryState,
  confirmDiscoveryUnderstanding,
} from "./intentDiscoveryPrototype.js";
import { buildGuidedDiscoveryBivHandoff } from "./guidedDiscoveryHandoffMapper.js";
import { evaluateGuidedDiscoverySufficiency } from "./guidedDiscoverySufficiencyBridge.js";
import {
  adaptGuidedDiscoveryHandoffToBiv,
} from "./guidedDiscoveryBivAdapter.js";
import {
  BIV_EVIDENCE_LEDGER_VERSION,
  EVIDENCE_ORIGINS,
  buildEvidenceLedgerV1,
  getEvidenceItemsByOrigin,
} from "./evidenceLedger.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";
import contentEn from "./content.en.js";

function buildReadyGuidedCase() {
  const discovery = confirmDiscoveryUnderstanding(buildDiscoveryState({
    originalIdea: "A service business that repairs air-conditioning units at customer locations.",
    selectedIntent: "service",
    coreOffering: "Air-conditioning repair",
    selectedOperatingApproach: "customer_site",
  }));
  const handoff = buildGuidedDiscoveryBivHandoff(discovery, {
    locale: "en",
    downstreamInput: {
      targetCustomer: "Homeowners and small offices",
      problem: "Customers need fast repair when air-conditioning fails.",
      monetization: "Customers pay per repair visit or monthly maintenance package.",
    },
  });
  const sufficiency = evaluateGuidedDiscoverySufficiency(handoff, { locale: "en" });
  return { discovery, handoff, sufficiency };
}

function execute(input) {
  return executeBusinessIdeaValidation({
    ...input,
    content: contentEn,
  });
}

function withoutLedger(result) {
  const { evidenceLedger, ...rest } = result;
  return rest;
}

const plannedRevenueCase = {
  businessIdea: "A stainless restaurant equipment workshop that fabricates tables and shelves.",
  targetCustomer: "Restaurants and commercial kitchens",
  problem: "Restaurants need nearby suppliers for durable stainless equipment.",
  monetization: "The workshop makes money by selling stainless equipment and charging installation fees.",
  stage: "idea",
};

const ledger = buildEvidenceLedgerV1({ rawInput: plannedRevenueCase });
assert.equal(ledger.version, BIV_EVIDENCE_LEDGER_VERSION);

const ownerItems = getEvidenceItemsByOrigin(ledger, EVIDENCE_ORIGINS.OWNER_DATA);
assert.equal(ownerItems.some((item) => item.sourceField === "rawInput.targetCustomer"), true);
assert.equal(ownerItems.some((item) => item.sourceField === "rawInput.problem"), true);
assert.equal(ownerItems.some((item) => item.sourceField === "rawInput.monetization"), true);
assert.equal(ownerItems.every((item) => item.origin === EVIDENCE_ORIGINS.OWNER_DATA), true);
assert.equal(getEvidenceItemsByOrigin(ledger, EVIDENCE_ORIGINS.EXTERNAL_EVIDENCE).length, 0);

const monetizationItem = ownerItems.find((item) => item.sourceField === "rawInput.monetization");
assert.equal(monetizationItem.evidenceClass, "planned_revenue_mechanism");
assert.match(monetizationItem.limitations, /planned revenue mechanism/i);
assert.doesNotMatch(monetizationItem.evidenceClass, /payment|behavioral|willingness/i);

const problemItem = ownerItems.find((item) => item.sourceField === "rawInput.problem");
assert.equal(problemItem.evidenceClass, "customer_problem");
assert.match(problemItem.limitations, /not validated market demand/i);
assert.doesNotMatch(problemItem.evidenceClass, /demand_proof|validated_demand/i);

const missingLedger = buildEvidenceLedgerV1({
  rawInput: {
    businessIdea: "A short business idea",
    targetCustomer: "",
    problem: "",
    monetization: "",
  },
});
assert.deepEqual(missingLedger.unknowns.map((item) => item.topic), [
  "target_customer",
  "customer_problem",
  "planned_revenue_mechanism",
]);
assert.equal(getEvidenceItemsByOrigin(missingLedger, EVIDENCE_ORIGINS.EXTERNAL_EVIDENCE).length, 0);

const before = execute({
  rawInput: plannedRevenueCase,
  language: "en",
  source: "guided_discovery",
  feasibilityAnswers: {
    classificationConfirmation: "confirm",
  },
});
const after = execute({
  rawInput: plannedRevenueCase,
  language: "en",
  source: "guided_discovery",
  feasibilityAnswers: {
    classificationConfirmation: "confirm",
  },
});
assert.equal(after.evidenceLedger.version, BIV_EVIDENCE_LEDGER_VERSION);
assert.equal(after.evidenceLedger.unknowns.length, 0);
assert.equal(withoutLedger(after).route, withoutLedger(before).route);
assert.equal(withoutLedger(after).journeyState, withoutLedger(before).journeyState);
assert.deepEqual(after.score, before.score);
assert.equal(after.verdictKey, before.verdictKey);
assert.deepEqual(after.criteria, before.criteria);
assert.deepEqual(after.recommendation, before.recommendation);
assert.deepEqual(after.report.sections, before.report.sections);

const inferred = execute({
  rawInput: plannedRevenueCase,
  language: "en",
});
const systemItems = getEvidenceItemsByOrigin(inferred.evidenceLedger, EVIDENCE_ORIGINS.SYSTEM_INFERENCE);
assert.equal(systemItems.some((item) => item.evidenceClass === "proposed_business_type"), true);
assert.equal(systemItems.some((item) => item.evidenceClass === "classification_signal"), true);
assert.equal(systemItems.every((item) => item.origin === EVIDENCE_ORIGINS.SYSTEM_INFERENCE), true);
assert.equal(systemItems.some((item) => item.origin === EVIDENCE_ORIGINS.OWNER_DATA), false);

const { discovery, handoff, sufficiency } = buildReadyGuidedCase();
const adapted = adaptGuidedDiscoveryHandoffToBiv(handoff, sufficiency);
assert.equal(adapted.ok, true);
assert.equal(adapted.canonicalInput.evidenceLedger.version, BIV_EVIDENCE_LEDGER_VERSION);
const guidedOwnerItems = getEvidenceItemsByOrigin(adapted.canonicalInput.evidenceLedger, EVIDENCE_ORIGINS.OWNER_DATA);
assert.equal(guidedOwnerItems.some((item) => item.sourceField === "rawInput.businessIdea"), true);
assert.equal(guidedOwnerItems.some((item) => item.sourceField === "rawInput.originalIdea"), true);
assert.equal(guidedOwnerItems.some((item) => item.sourceField === "confirmedUnderstanding.selectedIntent"), true);
assert.equal(guidedOwnerItems.some((item) => item.sourceField === "confirmedUnderstanding.coreOffering"), true);
assert.equal(guidedOwnerItems.some((item) => item.sourceField === "confirmedUnderstanding.selectedOperatingApproach"), true);
assert.equal(guidedOwnerItems.some((item) => item.sourceField === "downstreamClarifications.targetCustomer"), true);
assert.equal(adapted.canonicalInput.originalIdea, discovery.originalIdea);
assert.equal(adapted.canonicalInput.confirmedUnderstanding.coreOffering, "Air-conditioning repair");
assert.equal(getEvidenceItemsByOrigin(adapted.canonicalInput.evidenceLedger, EVIDENCE_ORIGINS.EXTERNAL_EVIDENCE).length, 0);

const externalIgnored = buildEvidenceLedgerV1({
  rawInput: plannedRevenueCase,
  externalEvidence: [
    { claim: "Customers paid", value: "One invoice" },
  ],
});
assert.equal(getEvidenceItemsByOrigin(externalIgnored, EVIDENCE_ORIGINS.EXTERNAL_EVIDENCE).length, 0);

console.log("Evidence Ledger V1 tests: PASS");
