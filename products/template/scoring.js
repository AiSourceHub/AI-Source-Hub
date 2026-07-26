export function createScoringCriteriaTemplate() {
  return [];
}

export function scoreProductTemplate(scoreEngine, context) {
  return scoreEngine.score(context);
}

export function getVerdictTemplate(totalScore) {
  if (totalScore >= 80) return "strong";
  if (totalScore >= 60) return "good";
  if (totalScore >= 40) return "unclear";
  return "weak";
}

