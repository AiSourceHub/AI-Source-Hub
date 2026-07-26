import { RecommendationEngine } from "../../../core/engines.js";
import { getBiggestRisk, getNextAction } from "./rules.js";

export function buildBusinessIdeaRecommendation({
  score,
  criteria,
  lowestCriterion,
  verdictKey,
  confidence,
  language,
}) {
  const recommendationEngine = new RecommendationEngine({
    rules: [
      {
        key: "primary_next_action",
        title: "Primary next action",
        priority: 1,
        when: () => true,
        action: () => getNextAction(lowestCriterion, verdictKey, language),
        reason: () => getBiggestRisk(lowestCriterion, language),
      },
    ],
  });

  return recommendationEngine.recommend({
    score,
    criteria,
    lowestCriterion,
    verdictKey,
    confidence,
  });
}

