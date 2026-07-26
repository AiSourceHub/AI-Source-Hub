import {
  detectPrimaryLanguage,
  detectTextDirection,
  normalizeText,
  uniqueList,
} from "../utils/helpers.js";

/**
 * Analyzer prepares raw product input for downstream validation, scoring,
 * recommendation, and reporting.
 *
 * It is intentionally generic. Product teams provide field definitions and
 * optional analyzer rules through the product configuration.
 */
export class Analyzer {
  constructor(config = {}) {
    this.config = {
      fields: [],
      uncertaintyTerms: ["not sure", "unknown", "tbd"],
      ...config,
    };
  }

  analyze(rawInput = {}) {
    const normalized = this.normalizeFields(rawInput);
    const combinedText = Object.values(normalized).join(" ");

    return {
      input: normalized,
      language: detectPrimaryLanguage(combinedText),
      direction: detectTextDirection(combinedText),
      flags: this.buildFlags(normalized),
      metadata: this.buildMetadata(normalized),
    };
  }

  normalizeFields(rawInput = {}) {
    return this.config.fields.reduce((fields, field) => {
      fields[field.key] = normalizeText(rawInput[field.key] || "");
      return fields;
    }, {});
  }

  buildFlags(input = {}) {
    const missingFields = [];
    const uncertainFields = [];

    this.config.fields.forEach((field) => {
      const value = input[field.key] || "";

      if (!value) {
        missingFields.push(field.key);
      }

      if (this.hasUncertainty(value)) {
        uncertainFields.push(field.key);
      }
    });

    return {
      missingFields,
      uncertainFields,
      hasMissingFields: missingFields.length > 0,
      hasUncertainFields: uncertainFields.length > 0,
    };
  }

  buildMetadata(input = {}) {
    const values = Object.values(input);
    const wordCount = values.join(" ").split(/\s+/).filter(Boolean).length;

    return {
      fieldCount: this.config.fields.length,
      filledFieldCount: values.filter(Boolean).length,
      wordCount,
      detectedTerms: uniqueList(
        values.flatMap((value) =>
          this.config.uncertaintyTerms.filter((term) =>
            value.toLowerCase().includes(term.toLowerCase())
          )
        )
      ),
    };
  }

  hasUncertainty(value = "") {
    const text = value.toLowerCase();
    return this.config.uncertaintyTerms.some((term) => text.includes(term.toLowerCase()));
  }
}

export default Analyzer;

