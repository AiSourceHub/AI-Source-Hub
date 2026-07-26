# Business Idea Validator

## Status

Migrated MVP for the shared AI Source Hub product platform.

## Route

Open:

`products/business/idea-validator/index.html`

## Purpose

Evaluate one business idea and produce a decision-support report with:

- Verdict
- Total score
- Five category scores
- Confidence level
- Biggest risk
- Practical next action
- Improved idea
- Copy report
- Download report

## Shared Platform Modules Used

- `Analyzer`
- `ValidationEngine`
- `ScoreEngine`
- `RecommendationEngine`
- `ReportBuilder`
- Shared components
- Shared ProductLayout
- Shared design-system CSS

## Product-Specific Files

- `product.config.js`
- `schema.js`
- `rules.js`
- `content.ar.js`
- `content.en.js`
- `index.js`

## Legacy Backup

The previous working version is preserved at:

`products/legacy/business-idea-validator-v1`

Do not modify the legacy backup unless needed for emergency rollback.

## Known Limitations

- The engine is deterministic and client-side.
- It does not use external AI services.
- It does not perform live market research.
- Download report creates a local text file.

## Run Smoke Test

From the project root:

`node products/business/idea-validator/smoke-test.mjs`

