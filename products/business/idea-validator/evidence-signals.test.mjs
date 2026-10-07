import assert from "node:assert/strict";
import { interpretEvidenceSignals } from "./evidenceSignals.js";

const zeroEvidence = interpretEvidenceSignals({
  businessIdea: "Restaurant inventory SaaS. No customers, no revenue, no sales, no orders, no pre-orders, no active users, no retention, no pilot, and untested assumptions only.",
  targetCustomer: "Restaurants",
  problem: "Inventory waste may be a problem, but there have been no interviews and no customer conversations.",
  monetization: "Revenue model: subscription at 199 SAR/month. This price is an untested assumption and no customer has paid.",
  currentSolution: "No bookings and no paid pilot.",
  competitiveAdvantage: "Expected workflow improvement only; not validated.",
  stage: "idea",
}, "en");

assert.equal(zeroEvidence.signals.customerValidation, 0);
assert.equal(zeroEvidence.signals.payment, 0);
assert.equal(zeroEvidence.signals.usage, 0);
assert.equal(zeroEvidence.hasAnyEvidence, false);
assert.equal(zeroEvidence.hasCustomerEvidence, false);
assert.equal(zeroEvidence.hasPaymentEvidence, false);
assert.equal(zeroEvidence.strongestEvidence, "");

const actualEvidence = interpretEvidenceSignals({
  businessIdea: "We interviewed 8 restaurant owners and have 3 paying customers.",
  targetCustomer: "Restaurants",
  problem: "Customers reported stock-counting errors during interviews.",
  monetization: "Subscription at 199 SAR/month.",
  currentSolution: "Two customers completed a paid pilot and active users show repeat usage.",
  competitiveAdvantage: "Measured usage data is available.",
  stage: "early",
}, "en");

assert.equal(actualEvidence.signals.customerValidation > 0, true);
assert.equal(actualEvidence.signals.payment > 0, true);
assert.equal(actualEvidence.signals.usage > 0, true);
assert.equal(actualEvidence.hasAnyEvidence, true);
assert.equal(actualEvidence.hasCustomerEvidence, true);
assert.equal(actualEvidence.hasPaymentEvidence, true);
assert.equal(actualEvidence.strongestEvidence, "payment");

const actualRevenueEvidence = interpretEvidenceSignals({
  businessIdea: "A restaurant inventory SaaS.",
  targetCustomer: "Restaurants",
  problem: "Reduce inventory waste.",
  monetization: "Revenue model: monthly subscription. Actual revenue was 20000 SAR from paying customers.",
  stage: "early",
}, "en");

assert.equal(actualRevenueEvidence.hasPaymentEvidence, true);
assert.equal(actualRevenueEvidence.signals.payment > 0, true);

console.log("Evidence Signals A/B regression: PASS");
