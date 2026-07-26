import { Analyzer, ValidationEngine } from "../../core/engines.js";

export function analyzeProductInput(rawInput, inputSchema) {
  const analyzer = new Analyzer({
    fields: inputSchema.map((field) => ({ key: field.id })),
  });

  return analyzer.analyze(rawInput);
}

export function validateProductInput(analysis, inputSchema) {
  const validationRules = inputSchema.map((field) => (currentAnalysis) => {
    const value = currentAnalysis.input[field.id] || "";

    if (field.minLength && value && value.length < field.minLength) {
      return { code: "below_minimum_length", field: field.id, severity: "error" };
    }

    if (field.maxLength && value.length > field.maxLength) {
      return { code: "above_maximum_length", field: field.id, severity: "error" };
    }

    return null;
  });

  const validator = new ValidationEngine({
    requiredFields: inputSchema.filter((field) => field.required).map((field) => field.id),
    rules: validationRules,
  });

  return validator.validate(analysis);
}

