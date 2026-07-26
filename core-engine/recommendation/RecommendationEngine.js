/**
 * RecommendationEngine selects one practical next action from scored and
 * validated context.
 *
 * Products provide recommendation rules. The engine handles priority order,
 * fallback behavior, and consistent return shape.
 */
export class RecommendationEngine {
  constructor(config = {}) {
    this.config = {
      rules: [],
      fallbackRecommendation: {
        key: "review_inputs",
        title: "Review the input",
        action: "Clarify the weakest part of the submission before continuing.",
      },
      ...config,
    };
  }

  recommend(context = {}) {
    const orderedRules = [...this.config.rules].sort(
      (a, b) => (a.priority ?? 100) - (b.priority ?? 100)
    );

    const selectedRule = orderedRules.find((rule) => rule.when(context));

    if (!selectedRule) {
      return {
        ...this.config.fallbackRecommendation,
        source: "fallback",
      };
    }

    return {
      key: selectedRule.key,
      title: selectedRule.title,
      action:
        typeof selectedRule.action === "function"
          ? selectedRule.action(context)
          : selectedRule.action,
      reason:
        typeof selectedRule.reason === "function"
          ? selectedRule.reason(context)
          : selectedRule.reason,
      source: "rule",
    };
  }
}

export default RecommendationEngine;

