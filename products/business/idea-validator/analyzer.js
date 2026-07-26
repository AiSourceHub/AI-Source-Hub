import { Analyzer, ValidationEngine } from "../../../core/engines.js";
import { inputSchema } from "./questions.js";

export function analyzeProductInput(rawInput) {
  const analyzer = new Analyzer({
    fields: inputSchema.map((field) => ({ key: field.id })),
    uncertaintyTerms: ["not sure", "unknown", "tbd", "غير متأكد", "لا أعرف"],
  });

  return analyzer.analyze(rawInput);
}

export function createValidationRules() {
  return inputSchema.map((field) => (currentAnalysis) => {
    const value = currentAnalysis.input[field.id] || "";

    if (field.minLength && value && value.length < field.minLength) {
      return { code: "below_minimum_length", field: field.id, severity: "error" };
    }

    return null;
  });
}

export function validateAnalysis(analysis) {
  const validator = new ValidationEngine({
    requiredFields: inputSchema.filter((field) => field.required).map((field) => field.id),
    rules: createValidationRules(),
  });

  return validator.validate(analysis);
}

export function validateForExecution(rawInput) {
  const analysis = analyzeProductInput(rawInput);
  const validation = validateAnalysis(analysis);

  return { analysis, validation };
}

