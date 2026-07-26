# AI Source Hub Core Engine v1.0

## Architecture

The AI Source Hub Core Engine is a reusable foundation for building focused AI decision-engine products.

It is intentionally product-agnostic. It does not include Business Idea Validator rules, UI behavior, backend services, external APIs, authentication, databases, or payment logic.

The engine is organized into independent modules:

```text
/core-engine
  analyzer/
    Analyzer.js
  validation/
    ValidationEngine.js
  scoring/
    ScoreEngine.js
  recommendation/
    RecommendationEngine.js
  reporting/
    ReportBuilder.js
  localization/
    ar.js
    en.js
  utils/
    helpers.js
```

Each future AI Source Hub product should define its own product configuration and pass that configuration into the shared engine modules.

## Responsibilities

### Analyzer

The Analyzer prepares raw user input for the rest of the engine.

Responsibilities:

- Normalize configured fields.
- Detect primary language.
- Detect text direction.
- Identify missing fields.
- Identify uncertain fields.
- Return metadata about input completeness.

The Analyzer does not score, recommend, or contain product-specific rules.

### ValidationEngine

The ValidationEngine checks whether analyzed input is usable.

Responsibilities:

- Check required fields.
- Run product-provided validation rules.
- Return structured errors and warnings.

The ValidationEngine does not decide product outcomes. It only determines whether the engine can continue safely.

### ScoreEngine

The ScoreEngine calculates scores from product-provided criteria.

Responsibilities:

- Score each criterion.
- Clamp scores to configured minimum and maximum values.
- Apply weights.
- Calculate total score.
- Calculate maximum possible score.
- Calculate score percentage.
- Identify the lowest-scoring criterion when requested.

The ScoreEngine does not define product-specific criteria. Products supply those criteria.

### RecommendationEngine

The RecommendationEngine selects one practical recommendation.

Responsibilities:

- Sort recommendation rules by priority.
- Select the first matching rule.
- Return a consistent recommendation object.
- Use a fallback recommendation when no rule matches.

The RecommendationEngine does not create product strategy by itself. Products supply recommendation rules.

### ReportBuilder

The ReportBuilder creates a structured report object.

Responsibilities:

- Add product name.
- Add language and direction.
- Add status.
- Include score data.
- Include recommendation data.
- Build configured report sections.
- Add generation metadata.

The ReportBuilder does not render UI. It prepares structured output that any interface can use.

### Localization

Localization provides shared language defaults.

Responsibilities:

- Provide English labels and statuses.
- Provide Arabic labels and statuses.
- Define text direction.
- Give products a clean base for translated output.

Products should extend localization dictionaries with product-specific copy.

### Utilities

Utilities provide small shared helpers.

Responsibilities:

- Text normalization
- Number clamping
- Number rounding
- Score summing
- Primary language detection
- Text direction detection
- Unique list generation
- Structured result creation

Utilities must stay small and product-agnostic.

## Execution Flow

A typical AI Source Hub product should use the core engine in this order:

1. Product receives user input.
2. Analyzer normalizes and prepares input.
3. ValidationEngine checks required fields and product rules.
4. If validation fails, ReportBuilder can create a recovery report.
5. ScoreEngine calculates configured criteria scores.
6. Product logic determines product-specific outcome bands if needed.
7. RecommendationEngine selects one next action from configured rules.
8. ReportBuilder creates a structured report.
9. UI renders the report using the design system.

The core engine handles the repeatable mechanics. The product owns its own decision framework.

## Module Dependencies

The modules are intentionally independent.

| Module | Depends On | Used By |
| --- | --- | --- |
| `utils/helpers.js` | None | Analyzer, ValidationEngine, ScoreEngine |
| `analyzer/Analyzer.js` | Utilities | Product engines |
| `validation/ValidationEngine.js` | Utilities | Product engines |
| `scoring/ScoreEngine.js` | Utilities | Product engines |
| `recommendation/RecommendationEngine.js` | None | Product engines |
| `reporting/ReportBuilder.js` | None | Product engines |
| `localization/ar.js` | None | Product engines, reporting |
| `localization/en.js` | None | Product engines, reporting |

No module should import UI components.

No module should import a product file.

No module should call a backend or external service.

## Future Extension Guide

### Adding A New Product

Each new product should create its own product engine configuration:

- Product name
- Input fields
- Required fields
- Validation rules
- Scoring criteria
- Score thresholds
- Recommendation rules
- Report sections
- Product-specific localization

The product should pass those configurations into the shared core engine modules.

### Adding New Criteria

New criteria should be added at the product level.

The ScoreEngine should not be edited unless the scoring mechanism itself changes for every product.

### Adding New Languages

To add a new language:

1. Create a new file in `core-engine/localization`.
2. Follow the shape of `en.js` and `ar.js`.
3. Define language code, direction, status labels, shared labels, and validation messages.
4. Let individual products extend the shared dictionary.

### Adding Confidence Logic

Confidence should be added as a reusable module only if multiple products need the same confidence behavior.

Until then, confidence can live in product-specific configuration or product-specific engine composition.

### Adding Report Formats

ReportBuilder should keep returning structured objects.

If products need HTML, PDF, or email output, create separate formatter layers outside the core engine.

### Scaling To 20+ Products

To support many products, the core engine must remain:

- Small
- Composable
- Product-agnostic
- Configuration-driven
- Easy to test
- Independent from UI and backend decisions

The core engine is the heart of AI Source Hub because it standardizes how products analyze input, validate readiness, score criteria, select recommendations, and produce structured reports without forcing every product to share the same business rules.

