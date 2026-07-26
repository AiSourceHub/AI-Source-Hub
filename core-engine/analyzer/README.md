# Analyzer

## Responsibility

Prepares raw product input for the rest of the engine.

## What It Does

- Normalizes configured fields.
- Detects primary language.
- Detects text direction.
- Flags missing fields.
- Flags uncertain fields.
- Returns metadata about field count, filled fields, and word count.

## What It Does Not Do

- It does not score.
- It does not validate product-specific rules.
- It does not generate recommendations.
- It does not contain product-specific logic.

## Main Export

`Analyzer`

## Primary Method

`analyze(rawInput)`

