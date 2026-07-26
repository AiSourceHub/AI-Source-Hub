# AI Source Hub Launch Checklist

Use this checklist before public launch or deployment preparation.

## Branding

- [ ] Product name is consistent across homepage, product page, registry, and report.
- [ ] Arabic and English names are correct.
- [ ] Product promise is clear and practical.
- [ ] Header and footer use AI Source Hub platform branding.

## Product Metadata

- [ ] Product is registered in `core/productRegistry.js`.
- [ ] Product status is correct.
- [ ] Product route is correct.
- [ ] Product category is correct.
- [ ] Version is documented.
- [ ] Featured status is intentional.

## SEO Readiness

- [ ] Page title is clear.
- [ ] Meta description is present.
- [ ] Product page has one clear H1.
- [ ] Homepage product card links to the correct route.
- [ ] Product copy does not overclaim accuracy or guarantee outcomes.

## Accessibility

- [ ] Form fields have labels.
- [ ] Help text and error messages are connected to fields.
- [ ] Required fields are validated clearly.
- [ ] Keyboard navigation works through form, language switcher, submit, copy, download, and restart actions.
- [ ] Focus states are visible.
- [ ] Result sections use a logical heading order.
- [ ] RTL and LTR direction switch correctly.
- [ ] Color contrast uses shared design tokens.

## Mobile

- [ ] Product page fits narrow screens without horizontal overflow.
- [ ] Radio groups remain readable.
- [ ] Buttons remain at least 44px tall.
- [ ] Score and result sections stack cleanly.
- [ ] Report actions wrap without overlap.

## Desktop

- [ ] Product form and result area use the shared responsive grid.
- [ ] Cards align consistently.
- [ ] Result hierarchy is easy to scan.
- [ ] No layout shift occurs after validation.

## Error Handling

- [ ] Empty inputs show friendly validation messages.
- [ ] Invalid select or number values are rejected safely.
- [ ] Partial or critical results do not crash the page.
- [ ] Copy failure shows a helpful message.
- [ ] Restart clears result state and preserves language preference.

## Testing

- [ ] Product validation passes for Startup Risk Scanner.
- [ ] Product validation passes for Business Idea Validator.
- [ ] Product validation passes for Product Template.
- [ ] Registry loads active products.
- [ ] Homepage product cards load from registry.
- [ ] Low, moderate, high, and critical scenarios produce logical ordering.
- [ ] Arabic scenario works.
- [ ] English scenario works.
- [ ] Empty-input scenario works.
- [ ] Contradictory-input scenario works.
- [ ] Business Idea Validator scoring remains unchanged.

## Documentation

- [ ] Product README is current.
- [ ] Root README lists active products.
- [ ] ROADMAP marks completed sprint only after verification.
- [ ] Known limitations are documented.
- [ ] Disclaimer is visible in product and report.

## Deployment Preparation

- [ ] No backend services are required.
- [ ] No database is required.
- [ ] No authentication is required.
- [ ] No payments are required.
- [ ] No external APIs are required.
- [ ] No unnecessary dependencies are introduced.
- [ ] Browser QA limitations are documented if local file access is blocked.

