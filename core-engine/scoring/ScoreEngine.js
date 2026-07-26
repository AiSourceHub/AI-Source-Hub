import { clampNumber, roundNumber, sumNumbers } from "../utils/helpers.js";

/**
 * ScoreEngine calculates criterion scores and aggregate scores.
 *
 * Product teams provide criteria as data. Each criterion can define a scoring
 * function, weight, minimum, and maximum. This module does not contain any
 * product-specific scoring rules.
 */
export class ScoreEngine {
  constructor(config = {}) {
    this.config = {
      criteria: [],
      defaultMin: 0,
      defaultMax: 100,
      ...config,
    };
  }

  score(context = {}) {
    const criteria = this.config.criteria.map((criterion) =>
      this.scoreCriterion(criterion, context)
    );
    const total = roundNumber(sumNumbers(criteria.map((item) => item.weightedScore)));
    const maxTotal = roundNumber(sumNumbers(criteria.map((item) => item.weightedMax)));

    return {
      criteria,
      total,
      maxTotal,
      percentage: maxTotal > 0 ? roundNumber((total / maxTotal) * 100) : 0,
    };
  }

  scoreCriterion(criterion, context) {
    const min = criterion.min ?? this.config.defaultMin;
    const max = criterion.max ?? this.config.defaultMax;
    const weight = criterion.weight ?? 1;
    const rawScore =
      typeof criterion.score === "function" ? criterion.score(context) : criterion.defaultScore ?? min;
    const score = roundNumber(clampNumber(rawScore, min, max));

    return {
      key: criterion.key,
      label: criterion.label || criterion.key,
      score,
      min,
      max,
      weight,
      weightedScore: roundNumber(score * weight),
      weightedMax: roundNumber(max * weight),
    };
  }

  findLowestCriterion(criteria = [], priority = []) {
    return [...criteria].sort((a, b) => {
      if (a.score === b.score && priority.length) {
        return priority.indexOf(a.key) - priority.indexOf(b.key);
      }

      return a.score - b.score;
    })[0];
  }
}

export default ScoreEngine;

