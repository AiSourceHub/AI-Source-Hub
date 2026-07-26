import { createResult } from "../utils/helpers.js";

/**
 * ValidationEngine checks whether analyzed input is usable for a product flow.
 *
 * Products define required fields and validation rules. The engine returns
 * structured validation results that can be shown in any UI or passed to
 * reporting.
 */
export class ValidationEngine {
  constructor(config = {}) {
    this.config = {
      requiredFields: [],
      rules: [],
      ...config,
    };
  }

  validate(analysis = {}) {
    const errors = [];
    const warnings = [];
    const input = analysis.input || {};

    this.config.requiredFields.forEach((fieldKey) => {
      if (!input[fieldKey]) {
        errors.push({
          code: "missing_required_field",
          field: fieldKey,
          severity: "error",
        });
      }
    });

    this.config.rules.forEach((rule) => {
      const result = rule(analysis);

      if (!result) {
        return;
      }

      if (result.severity === "error") {
        errors.push(result);
      } else {
        warnings.push(result);
      }
    });

    return createResult(errors.length === 0, {
      errors,
      warnings,
    });
  }
}

export default ValidationEngine;

