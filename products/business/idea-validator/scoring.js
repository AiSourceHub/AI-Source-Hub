import { ScoreEngine } from "../../../core/engines.js";
import {
  attachReasons,
  buildImprovedIdea,
  buildRuleContext,
  createScoringCriteria,
  getConfidence,
  getVerdictKey,
} from "./rules.js";

export function scoreBusinessIdea(analysis, language = "en") {
  const ruleContext = buildRuleContext(analysis.input, language);
  const scoringCriteria = createScoringCriteria(ruleContext);
  const scoreEngine = new ScoreEngine({ criteria: scoringCriteria });
  const score = scoreEngine.score({ analysis, ruleContext });
  const criteria = attachReasons(score.criteria, scoringCriteria);
  const lowestCriterion = scoreEngine.findLowestCriterion(criteria, [
    "problemClarity",
    "customerClarity",
    "marketNeed",
    "monetizationClarity",
    "feasibility",
  ]);
  const verdictKey = getVerdictKey(score.total);
  const confidence = getConfidence(ruleContext, criteria);

  return {
    ruleContext,
    scoringCriteria,
    score,
    criteria,
    lowestCriterion,
    verdictKey,
    confidence,
  };
}

export function buildImprovedIdeaStatement(input, language = "en") {
  return buildImprovedIdea(input, language);
}

