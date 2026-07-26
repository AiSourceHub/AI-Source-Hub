# AI Source Hub Product Template

The product template defines how future AI Source Hub products are created without duplicating platform code.

## Template Location

Use:

```text
products/template/
```

The template contains:

- `config.js` for product configuration.
- `metadata.js` for product card and platform metadata.
- `prompts.js` for product instruction copy if a future engine needs prompt-like guidance.
- `questions.js` for input and output schema.
- `scoring.js` for product-specific score categories and verdict mapping.
- `analyzer.js` for product input preparation and validation wiring.
- `recommendations.js` for product-specific next actions.
- `report.js` for product-specific report assembly.
- `ProductPage.jsx` for product page composition.
- `ResultPage.jsx` for result composition.

## Product Rules

Product-specific logic must stay inside the product folder.

Allowed inside a product folder:

- Input schema
- Output schema
- Scoring categories
- Score weights
- Verdict thresholds
- Risk detection
- Recommendations
- Report sections
- Localized product copy

Not allowed inside a product folder:

- Shared design tokens
- Shared layout primitives
- Shared engine classes
- Global navigation logic
- Backend services
- Databases
- Authentication
- Payments
- External APIs

## Shared Engines

Use the shared engine access point:

```text
core/engines.js
```

Products should import shared engines from `/core` and keep only product-specific rules in their own folder.

## Workflow For A New Product

1. Copy `products/template/` into `products/{category}/{product-slug}/`.
2. Replace placeholder configuration in `config.js`.
3. Add product metadata in `metadata.js`.
4. Define questions and output schema in `questions.js`.
5. Add isolated product rules in `scoring.js`, `analyzer.js`, `recommendations.js`, and `report.js`.
6. Connect the product page to shared layout and shared components.
7. Register the product in `platform/product-registry.js`.
8. Test Arabic and English.
9. Test mobile and desktop.
10. Verify empty, weak, and strong input cases.

## Business Idea Validator Reference

Business Idea Validator is the first product aligned to this product template.

Its product-specific files live in:

```text
products/business/idea-validator/
```

The refactor keeps the same UI, design, scoring, recommendation, and report behavior while moving product-specific responsibilities into template-shaped modules.

