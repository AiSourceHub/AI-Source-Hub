# AI Source Hub Product Registry

The product registry lets AI Source Hub scale to many products without manually wiring product cards into the homepage.

## Registry Location

```text
core/productRegistry.js
```

The registry exposes normalized product metadata:

- `id`
- `slug`
- `name`
- `shortDescription`
- `category`
- `icon`
- `languages`
- `version`
- `status`
- `featured`

The older platform path remains available as a compatibility bridge:

```text
platform/product-registry.js
```

New code should import from `core/productRegistry.js`.

## Shared Constants

Reusable platform constants live in:

```text
core/constants/
```

Files:

- `languages.js`
- `categories.js`
- `productStatus.js`

Use these constants when adding product metadata so status, category, and language values stay consistent.

## Folder Structure

Each real product should follow this structure:

```text
products/{category}/{product-slug}/
  config.js
  metadata.js
  prompts.js
  questions.js
  analyzer.js
  scoring.js
  recommendations.js
  report.js
  index.html
  index.js
  README.md
```

The reusable template lives at:

```text
products/template/
```

## How To Create A New Product

1. Copy `products/template/`.
2. Rename the folder to `products/{category}/{product-slug}/`.
3. Replace placeholder metadata in `config.js` and `metadata.js`.
4. Define inputs and outputs in `questions.js`.
5. Keep product-specific scoring in `scoring.js`.
6. Keep product-specific analysis wiring in `analyzer.js`.
7. Keep product-specific recommendations in `recommendations.js`.
8. Keep product-specific report assembly in `report.js`.
9. Use shared engines through `core/engines.js`.
10. Register the product in `core/productRegistry.js`.

## How To Register A Product

Import the product config into `core/productRegistry.js`, then add it to the active products list.

Required registry metadata:

- Stable `id`
- URL-safe `slug`
- Bilingual `title`
- Bilingual `shortDescription`
- `category`
- `icon`
- Supported `languages`
- `version`
- `status`
- `featured`
- `route`

Do not put scoring rules, recommendation rules, report logic, or UI rendering logic inside the registry.

## Homepage Workflow

The homepage imports product cards from:

```text
core/productRegistry.js
```

This keeps the product showcase dynamic while preserving the existing homepage UI.

## Validation Workflow

Run the product validator when a product is added or changed:

```bash
node tools/validate-product.js products/business/idea-validator
```

To validate the default platform targets:

```bash
node tools/validate-product.js
```

The validator checks:

- Required files exist
- Metadata exists
- Questions exist
- Analyzer exists
- Scoring exists
- Recommendations exist
- Report exists

## Best Practices

- One product solves one problem.
- Keep the product usable within two minutes.
- Keep product-specific logic inside the product folder.
- Keep shared engines in `/core`.
- Keep shared UI in `/components` and `/pages`.
- Register products once in `core/productRegistry.js`.
- Do not hardcode homepage product cards.
- Do not add backend services, databases, authentication, payments, or external APIs during MVP product work.

