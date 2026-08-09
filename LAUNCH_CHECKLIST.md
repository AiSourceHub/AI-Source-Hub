# AI Source Hub Launch Checklist

Use this checklist before public launch or deployment preparation.

## Branding

- [x] Product name is consistent across homepage, product page, registry, and report.
- [x] Arabic and English names are correct.
- [x] Product promise is clear and practical.
- [x] Header and footer use AI Source Hub platform branding.

## Product Metadata

- [x] Product is registered in `core/productRegistry.js`.
- [x] Product status is correct.
- [x] Product route is correct.
- [x] Product category is correct.
- [x] Version is documented.
- [x] Featured status is intentional.

## SEO Readiness

- [x] Page title is clear.
- [x] Meta description is present.
- [x] Product page has one clear H1.
- [x] Homepage product card links to the correct route.
- [x] Product copy does not overclaim accuracy or guarantee outcomes.

## Accessibility

- [x] Form fields have labels.
- [x] Help text and error messages are connected to fields.
- [x] Required fields are validated clearly.
- [x] Keyboard navigation works through form, language switcher, submit, copy, download, and restart actions.
- [x] Focus states are visible.
- [x] Result sections use a logical heading order.
- [x] RTL and LTR direction switch correctly.
- [x] Color contrast uses shared design tokens.

## Mobile

- [x] Product page fits narrow screens without horizontal overflow.
- [x] Radio groups remain readable.
- [x] Buttons remain at least 44px tall.
- [x] Score and result sections stack cleanly.
- [x] Report actions wrap without overlap.

## Desktop

- [x] Product form and result area use the shared responsive grid.
- [x] Cards align consistently.
- [x] Result hierarchy is easy to scan.
- [x] No layout shift occurs after validation.

## Error Handling

- [x] Empty inputs show friendly validation messages.
- [x] Invalid select or number values are rejected safely.
- [x] Partial or critical results do not crash the page.
- [x] Copy failure shows a helpful message.
- [x] Restart clears result state and preserves language preference.

## Testing

- [x] Product validation passes for Startup Risk Scanner.
- [x] Product validation passes for Business Idea Validator.
- [x] Product validation passes for Product Template.
- [x] Registry loads active products.
- [x] Homepage product cards load from registry.
- [x] Low, moderate, high, and critical scenarios produce logical ordering.
- [x] Arabic scenario works.
- [x] English scenario works.
- [x] Empty-input scenario works.
- [x] Contradictory-input scenario works.
- [x] Business Idea Validator scoring remains unchanged.
- [x] `node tools/validate-product.js` passes.
- [x] `node tools/validate-launch.js` passes after production placeholders are replaced.

## Documentation

- [x] Product README is current.
- [x] Root README lists active products.
- [x] ROADMAP marks completed sprint only after verification.
- [x] Known limitations are documented.
- [x] Disclaimer is visible in product and report.

## Deployment Preparation

- [x] No backend services are required.
- [x] No database is required.
- [x] No authentication is required.
- [x] No payments are required.
- [x] No external APIs are required.
- [x] No unnecessary dependencies are introduced.
- [x] Browser QA limitations are documented if local file access is blocked.
- [x] Production launch blockers are resolved or explicitly accepted by the owner.

## Deployed Manual Browser QA

Date: 2026-08-09

URL: `https://aisourcehq.com/`

Result: PASS

### Desktop

- [x] Homepage English: PASS
- [x] Homepage Arabic/RTL: PASS
- [x] Language switching: PASS
- [x] Business Idea Validator: PASS
- [x] Validator language switching inside product: PASS
- [x] Validator evaluation/report: PASS
- [x] Biggest Risk / Next Action rendering: PASS
- [x] Copy report: PASS
- [x] Download report: PASS
- [x] Startup Risk Scanner: PASS
- [x] Scanner language switching: PASS
- [x] Scanner analysis/results: PASS

### Mobile / iPhone

- [x] Homepage responsive layout: PASS
- [x] Arabic/English switching: PASS
- [x] Business Idea Validator responsive experience: PASS
- [x] Startup Risk Scanner responsive experience: PASS
- [x] No visible clipping, overlap, or navigation problems observed.
