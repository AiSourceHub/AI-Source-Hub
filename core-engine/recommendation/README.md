# RecommendationEngine

## Responsibility

Selects one practical recommendation from product-provided rules.

## What It Does

- Sorts recommendation rules by priority.
- Selects the first rule that matches the context.
- Returns a consistent recommendation object.
- Uses a fallback recommendation when no rule matches.

## What It Does Not Do

- It does not create product strategy.
- It does not contain product-specific recommendation logic.
- It does not generate UI.

## Main Export

`RecommendationEngine`

## Primary Method

`recommend(context)`

