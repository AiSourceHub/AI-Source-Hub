# ScoreEngine

## Responsibility

Calculates criteria scores and aggregate score data.

## What It Does

- Scores each configured criterion.
- Applies score limits.
- Applies criterion weights.
- Calculates total score.
- Calculates maximum possible score.
- Calculates percentage.
- Identifies the lowest-scoring criterion when requested.

## What It Does Not Do

- It does not define product-specific scoring criteria.
- It does not create recommendations.
- It does not render UI.

## Main Export

`ScoreEngine`

## Primary Methods

- `score(context)`
- `scoreCriterion(criterion, context)`
- `findLowestCriterion(criteria, priority)`

