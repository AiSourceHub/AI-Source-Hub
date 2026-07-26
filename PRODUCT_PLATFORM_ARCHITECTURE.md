# AI Source Hub Product Platform Architecture

## 1. Architecture Principles

AI Source Hub products should be easy to add, test, localize, and maintain without duplicating platform logic.

Principles:

- Configuration-driven products
- Shared UI components
- Shared core engine
- Product-specific rules isolated from the core
- Arabic and English localization
- Mobile-first design
- No duplicated platform logic
- Progressive enhancement
- Accessibility by default
- Products should be addable without changing global platform files unnecessarily

The architecture should stay simple. AI Source Hub is a small-budget startup, so the platform should prefer plain JavaScript, clear configuration, and reusable modules over enterprise complexity.

## 2. Recommended Product Structure

Target structure:

```text
/products
  /business
    /idea-validator
      product.config.js
      schema.js
      rules.js
      content.ar.js
      content.en.js
      index.js
      README.md

    /name-generator
    /business-model-analyzer
    /pricing-strategy-advisor
    /startup-risk-scanner
    /customer-persona-builder
    /marketing-plan-generator
    /landing-page-generator
    /business-plan-builder

  /ai-productivity
    /prompt-optimizer
```

Business Idea Validator has been safely migrated into this structure. Future products should start from the reusable starter template.

## 3. New Product Starter Template

The reusable starter template lives at:

```text
/templates/new-product
```

It contains:

- `product.config.template.js`
- `schema.template.js`
- `rules.template.js`
- `content.ar.template.js`
- `content.en.template.js`
- `index.template.js`
- `README.md`
- `CHECKLIST.md`

The optional generator helper lives at:

```text
/tools/create-product.js
```

Recommended usage:

```bash
node tools/create-product.js business startup-risk-scanner
```

The helper copies the template into `/products/{category}/{slug}`, refuses to overwrite existing products, replaces basic placeholders, and prints the next setup steps.

The template is not a real product. It is a reusable starting point for product-specific configuration, schema, isolated rules, localization, and product entry wiring.

## 4. Product Configuration Contract

Each product should expose a standard product configuration object.

Recommended fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable unique product identifier. |
| `slug` | URL-safe product slug. |
| `category` | Product group such as `business` or `ai-productivity`. |
| `version` | Product version, such as `1.0.0`. |
| `status` | Availability state such as `draft`, `beta`, `active`, or `planned`. |
| `title` | Localized or default product title. |
| `shortDescription` | Short product summary for cards and navigation. |
| `longDescription` | Longer product explanation for the product page. |
| `icon` | Shared icon identifier. |
| `languages` | Supported languages, usually `["en", "ar"]`. |
| `inputSchema` | Input field definitions used to render and validate forms. |
| `outputSchema` | Expected result structure. |
| `enginePipeline` | Ordered engine stages used by the product. |
| `scoringEnabled` | Whether the product uses ScoreEngine. |
| `reportEnabled` | Whether the product produces a structured report. |
| `estimatedCompletionTime` | Expected user completion time. |
| `featured` | Whether the product appears prominently on the homepage. |
| `availability` | User-facing availability label or rule. |
| `route` | Product route path. |

Example shape:

```js
export const productConfig = {
  id: "example-product",
  slug: "example-product",
  category: "business",
  version: "1.0.0",
  status: "draft",
  title: { en: "Example Product", ar: "منتج تجريبي" },
  shortDescription: { en: "Short outcome.", ar: "نتيجة مختصرة." },
  longDescription: { en: "Longer explanation.", ar: "شرح أطول." },
  icon: "Gauge",
  languages: ["en", "ar"],
  inputSchema: [],
  outputSchema: [],
  enginePipeline: ["validation", "analyzer", "rules", "scoring", "recommendation", "reporting"],
  scoringEnabled: true,
  reportEnabled: true,
  estimatedCompletionTime: "10 minutes",
  featured: false,
  availability: "planned",
  route: "/products/business/example-product",
};
```

## 5. Product Registry

Shared registry file:

```text
/platform/product-registry.js
```

The registry should:

- Register products.
- Power the homepage product showcase.
- Power product navigation.
- Group tools by category.
- Control availability status.
- Prevent product data duplication.
- Allow products to be added through configuration.

The registry should not contain product rules. It should only import product configurations and expose product metadata.

Minimal illustrative example:

```js
export const productRegistry = [
  productConfig,
];

export function getProductsByCategory(category) {
  return productRegistry.filter((product) => product.category === category);
}
```

The current registry already contains active and planned product metadata. Keep product rules out of this file.

## 6. Standard Product Execution Flow

Standard flow:

```text
Product configuration
→ Input schema
→ ValidationEngine
→ Analyzer
→ Product-specific rules
→ ScoreEngine when applicable
→ RecommendationEngine
→ ReportBuilder
→ Localized result renderer
```

Required stages:

- Product configuration
- Input schema
- ValidationEngine
- Analyzer
- Product-specific rules
- RecommendationEngine
- Localized result renderer

Optional stages:

- ScoreEngine, for products that use scores.
- ReportBuilder, for products that generate structured reports.
- Product-specific comparison logic, for products that compare options.
- Export formatter, for copy/download features.

## 7. Standard Product Page

Common `ProductLayout` sections:

- Shared Header
- Breadcrumb
- Product title and description
- Language switcher
- Progress indicator
- Input form
- Validation messages
- Processing state
- Result summary
- Detailed results
- Recommendations
- Copy report
- Download report
- Start again
- Related products
- Shared Footer

The product page should keep the task visible quickly on mobile. Product-specific pages should not recreate global layout patterns.

## 8. Standard Product States

| State | Meaning | Expected UI Behavior |
| --- | --- | --- |
| Idle | User has not started. | Show product description, input form, and primary action. |
| Input in progress | User is entering information. | Preserve input, avoid interruptions, show lightweight helper text. |
| Invalid input | Required or minimum input is missing. | Show clear validation messages near relevant fields. |
| Ready to analyze | Inputs are sufficient. | Enable primary action. |
| Processing | Product is generating result. | Show short processing state; do not clear input. |
| Success | Product generated a complete result. | Show result summary, detailed results, recommendation, copy/download actions. |
| Partial result | Product can answer but confidence is limited. | Show result with caveat and one action to improve input. |
| Error | Product cannot complete. | Show friendly error message and recovery action. |
| Reset | User starts again. | Clear result and return to input state while keeping language preference. |

## 9. Input Schema Rules

Reusable input types:

- `text`
- `textarea`
- `number`
- `select`
- `radio`
- `checkbox`
- `range`

Every input definition should support:

| Field | Purpose |
| --- | --- |
| `id` | Stable input identifier. |
| `type` | Input type. |
| `label` | Localized visible label. |
| `placeholder` | Localized example or hint. |
| `helpText` | Short localized helper text. |
| `required` | Whether the field is required. |
| `minLength` | Minimum text length. |
| `maxLength` | Maximum text length. |
| `minimum` | Minimum numeric value. |
| `maximum` | Maximum numeric value. |
| `options` | Options for select, radio, checkbox, or range labels. |
| `validationMessage` | Localized message for invalid input. |
| `direction` | `ltr`, `rtl`, or `auto`. |

## 10. Output Schema Rules

Reusable result types:

- `verdict`
- `score`
- `score breakdown`
- `strengths`
- `weaknesses`
- `risks`
- `recommendations`
- `next action`
- `generated text`
- `comparison`
- `checklist`

Each output definition should specify:

- `id`
- `type`
- `label`
- `priority`
- `copyable`
- `downloadable`
- `localized`
- `required`

## 11. Localization Architecture

Localization should be split between shared platform language and product-specific language.

Shared localization:

- Global labels
- Shared button copy
- Shared validation messages
- Shared report labels
- Shared product states

Product-specific localization:

- Product titles
- Product descriptions
- Input labels
- Placeholder examples
- Product-specific result labels
- Product-specific recommendation copy

Rules:

- Arabic content lives in product `content.ar.js` files.
- English content lives in product `content.en.js` files.
- Document direction should be automatic from selected language.
- No mixed-language system labels.
- Product-specific translations stay separate from shared translations.
- Use consistent terminology across products.
- Fallback behavior should use English only when the requested language is missing, never inside the same sentence.

## 12. Free and Future Paid Boundaries

Current release:

- No accounts
- No payments
- No saved cloud data
- No external AI dependency
- All processing remains client-side where possible

Future extension points:

- Free tool limits
- Premium reports
- Product bundles
- Subscriptions
- Saved history

These are future architecture options only. They are not part of the current scope.

## 13. Adding a New Product

Checklist:

1. Choose product category and slug.
2. Generate the product folder with `/tools/create-product.js` or copy `/templates/new-product`.
3. Replace basic placeholders.
4. Define `schema.js` with input and output schemas.
5. Add isolated product rules in `rules.js`.
6. Add English content in `content.en.js`.
7. Add Arabic content in `content.ar.js`.
8. Compose the product in `index.js`.
9. Use shared core-engine modules.
10. Use shared ProductLayout and reusable components.
11. Add product documentation in `README.md`.
12. Register the product in `/platform/product-registry.js`.
13. Add route and homepage metadata.
14. Test English and Arabic.
15. Test mobile and desktop.
16. Test empty, weak, and strong inputs.
17. Confirm copy/download report actions.
18. Run manual accessibility and console checks.

Target:

A simple product can be added mainly through configuration, schemas, localized content, and isolated rules.

## 14. Migration Plan for Business Idea Validator

Completed safe migration pattern:

1. Preserve current working version.
2. Create backup.
3. Map existing inputs to the standard schema.
4. Extract product-specific rules.
5. Connect shared core engine.
6. Replace duplicated UI with ProductLayout.
7. Preserve Arabic functionality.
8. Compare old and new results.
9. Run regression testing.
10. Switch only after the migrated version passes.

Use this pattern only for future migrations of existing products.

## 15. Architecture Decision Records

### ADR 1 - Products Use Configuration

Decision: Products should be configuration-driven.

Reason: Configuration keeps products consistent and lets new products reuse platform rendering, validation, navigation, and reporting without duplicating structure.

### ADR 2 - Product-Specific Rules Stay Outside Core Engine

Decision: Product rules must stay outside `core-engine`.

Reason: The core engine should remain reusable for 20+ products. Product-specific rules would make the core harder to test, maintain, and reuse.

### ADR 3 - Authentication Is Delayed

Decision: Do not add authentication in the current release.

Reason: Accounts add complexity before the platform has proven product value. Current work should focus on useful decisions and reports.

### ADR 4 - Payments Are Delayed

Decision: Do not add payments in the current release.

Reason: Payments should come after product usefulness, pricing, and packaging are validated.

### ADR 5 - Bilingual Support Is Mandatory From The Beginning

Decision: Arabic and English support must be built into the platform foundation.

Reason: Retrofitting RTL, localization, and terminology later would create rework and inconsistent user experiences.

### ADR 6 - Shared Reports Are Standardized

Decision: Product reports should follow standard output patterns.

Reason: Standard reports make products easier to understand, compare, copy, download, test, and improve.
