# AI Source Hub

AI Source Hub creates practical AI products that solve real business problems.

## Current Status

AI Source Hub is now prepared as a static v1.0 public launch candidate.

Completed:

- Sprint P1 - Design System
- Sprint P2 - Landing Platform
- Sprint P3 - Shared Core Engine
- Sprint P4 - Roadmap and Product Platform Architecture
- Sprint P5 - Safe Migration of Business Idea Validator
- Sprint P6 - Reusable New Product Starter Template
- Sprint P5 Template Alignment - Business Idea Validator aligned to product template modules
- Sprint P6 Product Management - Core registry, dynamic homepage products, validation helper, and shared constants
- Sprint P7 - Startup Risk Scanner
- Sprint P8 - Product Quality, Launch Readiness, and Deployment Preparation
- Sprint P9 - Version 1.0 Public Launch Preparation

Existing product:

- Business Idea Validator
- Startup Risk Scanner

Status:

- Business Idea Validator has been migrated into the shared product platform.
- The previous working version is preserved as a legacy rollback backup.
- A reusable new product starter template now exists for future products.
- Business Idea Validator now uses the shared product template module pattern while preserving its existing UI and result behavior.
- Product cards now load from the core product registry instead of being hardcoded on the homepage.
- Startup Risk Scanner is now active and registered through the product registry.
- Startup Risk Scanner has received a launch-readiness quality pass covering clarity, accessibility, validation, result hierarchy, and documentation.
- AI Source Hub is internally tagged as v1.0.0.
- SEO files, legal templates, brand assets, analytics placeholders, and deployment documentation are prepared.

Next implementation task:

Replace launch placeholders with the real production domain, official contact method, and counsel-reviewed legal language, then deploy to a staging URL for browser QA.

## Product Routes

- Migrated Business Idea Validator: [products/business/idea-validator/index.html](products/business/idea-validator/index.html)
- Startup Risk Scanner: [products/startup-risk-scanner/index.html](products/startup-risk-scanner/index.html)
- Legacy backup: [products/legacy/business-idea-validator-v1/prototype/index.html](products/legacy/business-idea-validator-v1/prototype/index.html)

## How To Run

Open the migrated product HTML file directly in a browser:

`products/business/idea-validator/index.html`

The migrated product is fully client-side. It does not require a backend, authentication, database, payments, or external AI API.

## Product Registry

The shared product registry lives at:

[core/productRegistry.js](core/productRegistry.js)

It registers active and planned products, powers reusable product metadata, and prevents active product information from being duplicated across the platform.

The compatibility bridge remains at:

[platform/product-registry.js](platform/product-registry.js)

Shared constants live in:

[core/constants](core/constants)

Validate product structure with:

`node tools/validate-product.js`

Validate bilingual localization behavior with:

`node tools/validate-localization.js`

Validate public launch readiness with:

`node tools/validate-launch.js`

The launch validator is intentionally strict and will report unresolved production placeholders until the real domain, contact method, legal review state, and analytics decision are finalized.

## New Product Starter Template

The reusable starter template lives at:

[templates/new-product](templates/new-product)

Optional helper:

`node tools/create-product.js business startup-risk-scanner`

The template provides product configuration, schema, isolated rules, Arabic and English content, product entry wiring, README guidance, and a launch checklist.

## Product Template Workflow

The platform product workflow is documented in:

[PRODUCT_TEMPLATE.md](PRODUCT_TEMPLATE.md)

Future products should start from `products/template/`, keep product-specific logic inside their own product folder, and import shared engines through `core/engines.js`.

## Known Limitations

- The migrated validator uses deterministic client-side rules, not live AI calls.
- It does not perform market research.
- Browser preview still needs a full manual pass.
- Copy report depends on browser clipboard permission.
- Download report creates a local text file.

## Project Files

- [Project Charter](PRODUCT_CHARTER.md)
- [Design System](DESIGN_SYSTEM.md)
- [Core Engine](CORE_ENGINE.md)
- [Roadmap](ROADMAP.md)
- [Product Platform Architecture](PRODUCT_PLATFORM_ARCHITECTURE.md)
- [Product Template Workflow](PRODUCT_TEMPLATE.md)
- [Product Registry](PRODUCT_REGISTRY.md)
- [Localization Architecture](LOCALIZATION_ARCHITECTURE.md)
- [Launch Checklist](LAUNCH_CHECKLIST.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Changelog](CHANGELOG.md)
- [Production Improvements Log](PRODUCTION_IMPROVEMENTS.md)
- [New Product Starter Template](templates/new-product/README.md)
- [AI Source Hub Homepage](pages/Home/index.html)
- [Business Idea Validator Product Brief](products/business-idea-validator/PRODUCT_BRIEF.md)
- [Business Idea Validator Prototype](products/business-idea-validator/prototype/index.html)
- [Migrated Business Idea Validator](products/business/idea-validator/index.html)
- [Startup Risk Scanner](products/startup-risk-scanner/index.html)
- [Business Idea Validator Legacy Backup](products/legacy/business-idea-validator-v1/README.md)
