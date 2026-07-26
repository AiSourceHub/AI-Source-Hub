import { Analyzer, ValidationEngine } from "../../core/engines.js";
import { inputSchema } from "./questions.js";

const uncertaintyTerms = ["not sure", "unknown", "tbd", "maybe", "غير متأكد", "لا أعرف", "غير معروف"];

export function analyzeProductInput(rawInput = {}) {
  const analyzer = new Analyzer({
    fields: inputSchema.map((field) => ({ key: field.id })),
    uncertaintyTerms,
  });
  const analysis = analyzer.analyze(rawInput);
  const input = normalizeStartupInput(analysis.input);

  return {
    ...analysis,
    input,
    startupRisk: {
      missingFields: getMissingFields(input),
      weakEvidence: detectWeakEvidence(input),
      contradictions: detectContradictions(input),
      unsupportedAssumptions: detectUnsupportedAssumptions(input),
    },
  };
}

export function validateAnalysis(analysis) {
  const validator = new ValidationEngine({
    requiredFields: inputSchema.filter((field) => field.required).map((field) => field.id),
    rules: createValidationRules(),
  });

  return validator.validate(analysis);
}

export function validateForExecution(rawInput = {}) {
  const analysis = analyzeProductInput(rawInput);
  const validation = validateAnalysis(analysis);

  return { analysis, validation };
}

function normalizeStartupInput(input = {}) {
  return {
    startupStage: normalizeValue(input.startupStage),
    problemClarity: normalizeValue(input.problemClarity),
    targetCustomer: normalizeValue(input.targetCustomer),
    demandEvidence: normalizeValue(input.demandEvidence),
    marketAccess: normalizeValue(input.marketAccess),
    competitiveAdvantage: normalizeValue(input.competitiveAdvantage),
    businessModel: normalizeValue(input.businessModel),
    pricingEvidence: normalizeValue(input.pricingEvidence),
    teamCapability: normalizeValue(input.teamCapability),
    runwayMonths: normalizeNumber(input.runwayMonths),
    executionComplexity: normalizeValue(input.executionComplexity),
    dependencyRisks: normalizeValue(input.dependencyRisks),
  };
}

function normalizeValue(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeNumber(value) {
  if (String(value ?? "").trim() === "") return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : "";
}

function getMissingFields(input) {
  return inputSchema
    .filter((field) => field.required)
    .filter((field) => input[field.id] === "" || input[field.id] === undefined)
    .map((field) => field.id);
}

function createValidationRules() {
  return inputSchema.map((field) => (analysis) => {
    const value = analysis.input[field.id];

    if (field.type === "number") {
      if (value === "" || value === undefined) return null;
      if (field.minimum !== undefined && value < field.minimum) {
        return { code: "below_minimum", field: field.id, severity: "error" };
      }
      if (field.maximum !== undefined && value > field.maximum) {
        return { code: "above_maximum", field: field.id, severity: "error" };
      }
    }

    if (field.options && value) {
      const allowedValues = field.options.map((option) => option.value);
      if (!allowedValues.includes(value)) {
        return { code: "invalid_option", field: field.id, severity: "error" };
      }
    }

    return null;
  });
}

function detectWeakEvidence(input) {
  const weak = [];

  if (input.demandEvidence === "none" || input.demandEvidence === "conversations") {
    weak.push("customer_demand");
  }
  if (input.pricingEvidence === "guess") {
    weak.push("pricing");
  }
  if (input.marketAccess === "unknown") {
    weak.push("market_access");
  }
  if (input.competitiveAdvantage === "none") {
    weak.push("competitive_advantage");
  }

  return weak;
}

function detectUnsupportedAssumptions(input) {
  const assumptions = [];

  if (input.businessModel === "repeatable" && !["paying", "pilots"].includes(input.demandEvidence)) {
    assumptions.push("repeatable_model_without_demand_evidence");
  }
  if (input.pricingEvidence === "paid" && input.demandEvidence === "none") {
    assumptions.push("paid_pricing_without_demand");
  }
  if (input.marketAccess === "existing_channel" && input.targetCustomer === "broad") {
    assumptions.push("existing_channel_for_broad_customer");
  }

  return assumptions;
}

function detectContradictions(input) {
  const contradictions = [];

  if (["idea", "prototype"].includes(input.startupStage) && input.demandEvidence === "paying") {
    contradictions.push("paying_customers_before_launch_stage");
  }
  if (input.startupStage === "growth" && input.businessModel === "unclear") {
    contradictions.push("growth_stage_unclear_business_model");
  }
  if (input.demandEvidence === "paying" && input.pricingEvidence === "guess") {
    contradictions.push("paying_customers_but_pricing_is_guess");
  }
  if (input.runwayMonths !== "" && input.runwayMonths < 3 && input.executionComplexity === "high") {
    contradictions.push("short_runway_high_complexity");
  }

  return contradictions;
}
