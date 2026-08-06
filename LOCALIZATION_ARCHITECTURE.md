# AI Source Hub Localization Architecture

## Purpose

AI Source Hub uses one shared bilingual localization layer for platform pages and product pages. The goal is simple: Arabic experiences stay Arabic and RTL, English experiences stay English and LTR, and language switching never moves the user away from the current route.

## Shared Translation Structure

Platform-level copy lives in `/core/localization.js`.

It contains:

- Supported language behavior
- Arabic/English direction rules
- Header, footer, breadcrumb, product-card, and legal navigation labels
- Shared language switch behavior
- Product localization contract keys

Product-level copy stays inside each product folder.

Approved patterns:

- `content.en.js` and `content.ar.js`
- or a `content` export with `content.en` and `content.ar`

Each product must provide Arabic and English values for:

- Product metadata
- Step or tab labels when the product has steps
- Form labels, placeholders, help text, and validation messages
- Buttons and status messages
- Report headings and result interface labels

## Language Switch Behavior

All platform pages must use `bindLanguageSwitcher` from `/core/localization.js`.

The shared switcher:

- Updates the active language in app state
- Persists the language in local storage
- Keeps the current route and hash route
- Keeps the current product page open
- Does not call `location.reload`
- Does not redirect to the homepage

## Route Preservation

Language is treated as page state, not as navigation.

Switching AR/EN must preserve:

- Current route
- Current hash route
- Query parameters
- Current product
- Active product step or tab
- Entered form values where the product keeps state locally

## RTL And LTR Rules

Use `applyDocumentLocale(language)` from `/core/localization.js`.

Rules:

- Arabic: `lang="ar"` and `dir="rtl"`
- English: `lang="en"` and `dir="ltr"`
- Input fields may still use `dir="auto"` when user-entered text can be mixed

## Future Product Contract

Every future product must:

- Register bilingual metadata in product config or metadata
- Provide Arabic and English content resources
- Use shared ProductLayout and shared Header
- Use the shared LanguageSwitcher behavior
- Keep product-specific logic inside its own product folder
- Avoid English fallback interface text in Arabic content

## Required Validation Before Deployment

Run:

```bash
npm run build
npm run validate:products
npm run validate:localization
npm run validate:launch
```

`validate:localization` fails when:

- A registered product is missing Arabic or English metadata
- Required Arabic or English content keys are missing
- A product field is missing bilingual labels or validation messages
- Arabic mode has `direction` other than `rtl`
- English mode has `direction` other than `ltr`
- Known English fallback interface fragments appear in Arabic content
- A platform/product language switch uses page reload behavior
