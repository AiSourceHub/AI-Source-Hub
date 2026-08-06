# New Product Starter Template

This template creates a reusable starting point for future AI Source Hub products without duplicating platform code.

Use it when adding a real product after the product strategy is approved. Do not place product-specific logic inside `/core-engine`.

## How To Copy The Template

Recommended helper:

```bash
node tools/create-product.js business startup-risk-scanner
```

Manual copy:

1. Copy `/templates/new-product` into `/products/{category}/{slug}`.
2. Rename template files:
   - `product.config.template.js` to `product.config.js`
   - `schema.template.js` to `schema.js`
   - `rules.template.js` to `rules.js`
   - `content.ar.template.js` to `content.ar.js`
   - `content.en.template.js` to `content.en.js`
   - `index.template.js` to `index.js`
3. Replace every `__PLACEHOLDER__`.
4. Remove unused example fields and rules.

## How To Select A Category

Use an existing platform category whenever possible:

- `business`
- `ai-productivity`
- `marketing`
- `finance`
- `operations`

Add a new category only when multiple future products will belong to it.

## How To Define Inputs

Edit `schema.js`.

Supported field types:

- `text`
- `textarea`
- `number`
- `select`
- `radio`
- `checkbox`
- `range`

Every field should include bilingual labels, placeholders, help text, validation messages, required status, limits, and direction.

## How To Define Outputs

Edit `outputSchema` inside `schema.js`.

Use standard result types when possible:

- `verdict`
- `score`
- `risks`
- `recommendations`
- `next_action`
- `generated_text`
- `checklist`
- `comparison`

Keep outputs focused on one user problem.

## How To Create Rules

Edit `rules.js`.

Product rules may include:

- Analyzer signals
- Score categories
- Score weights
- Verdict ranges
- Risk detection
- Confidence calculation
- Recommendation generation
- Next action generation
- Generated or improved output logic

Keep these rules inside the product folder. Only move code to `/core-engine` after at least two products need the same behavior.

## How To Register The Product

Open `/platform/product-registry.js`.

Import the new product configuration and add it to the registry. The registry should only contain metadata and routing. It should not contain product rules.

## How To Test Arabic And English

Test both languages before marking the product ready:

- Arabic content uses RTL direction.
- English content uses LTR direction.
- Language switching uses `/core/localization.js` and never reloads the page.
- Switching language preserves the current product route and local product state where applicable.
- No bilingual sentences appear in generated output.
- Labels, help text, validation, errors, buttons, and report headings are localized.
- Copy and download report text matches the selected language.

Run:

```bash
npm run validate:localization
```

The product must pass the shared localization contract before deployment.

## How To Avoid Duplicate Platform Code

Use shared assets first:

- Design tokens from `/core`
- Components from `/components`
- Layout from `/pages/ProductLayout`
- Logic modules from `/core-engine`
- Registry from `/platform/product-registry.js`
- Localization helpers and contract from `/core/localization.js`

Do not add backend services, authentication, databases, payments, or external APIs for starter products.
