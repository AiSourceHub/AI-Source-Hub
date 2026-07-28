SPRINT 8.1 — Decision Experience Upgrade

Scope

- Product: Business Idea Validator only (no platform redesign, no new features).
- Objective: Improve the decision experience from first screen to final report by refining wording, simplifying questions, adding field-specific validation guidance, and restructuring the final report into: Executive Summary, Key Findings, Opportunities, Risks, and Action Plan.
- Constraints: Do NOT change product purpose, do NOT add features, do NOT modify platform-level code outside this product.

Planned changes (what)

1. Streamline the onboarding and stepper flow copy so the first screen commits the user quickly and sets expectations (time, outcome).
2. Simplify and clarify every input label and placeholder; reduce explanatory text to a single-line hint where needed.
3. Add explicit field-level validation messages (e.g., "Briefly describe the customer in one sentence") and map them to the form fields so users get actionable guidance.
4. Rework the report builder to produce the new structured report sections: Executive Summary, Key Findings, Opportunities, Risks, and Action Plan. Each section will be concise and advisory in tone.
5. Provide concise English phrasing and parallel simple, natural Arabic translations. Tone: experienced business advisor — concise, directive, and pragmatic.
6. Keep existing UI structure and interactions; only replace copy and the report assembly logic (no new UI components).

Rationale (why)

- Reduce cognitive load: shorter, clearer questions produce better inputs and faster completion.
- Increase decision confidence: a structured, advisor-like report is easier to scan and act on.
- Improve completion rate: field-level guidance reduces validation friction and repeated submissions.
- Bilingual parity: ensure Arabic reads naturally and preserves the advisory tone.

Expected UX improvements

- Faster time-to-submit (users understand expected inputs and can complete the form quickly).
- Fewer validation rejections and clearer correction paths when errors occur.
- More actionable final output that reads like a short advisory memo a founder can act on.
- Better bilingual experience: Arabic reads naturally without literal translation artifacts.

Files to be modified (exact targets)

- `src/pages/BusinessIdeaValidatorPage.jsx` — adapt flow language, validation wiring, and UX small fixes (no structural UI changes).
- `products/business/idea-validator/content.en.js` — update English labels, placeholders, validation messages, steps text, and report labels.
- `products/business/idea-validator/content.ar.js` — update Arabic labels, placeholders, validation messages, steps text, and report labels.
- `products/business/idea-validator/report.js` — modify report builder to produce the new structured sections and reduce verbose text.
- `products/business/idea-validator/recommendations.js` — ensure recommendation phrasing supports the Action Plan section (concise steps).
- `products/business/idea-validator/scoring.js` — (minor) ensure scoring outputs map neatly to Key Findings and Opportunities sections.
- `products/business/idea-validator/rules.js` — add/adjust field validation rules and human-friendly error messages.
- `products/business/idea-validator/TEST_PLAN.md` — update tests and QA checklist for the revised flow and copy.

Non-code artifacts to update

- `PRODUCT_TEMPLATE.md` — note updated copy conventions for Business Idea Validator (if applicable).
- `LAUNCH_CHECKLIST.md` — add a bullet to review report tone and bilingual parity.

Implementation plan (high level)

1. Finalize wording and translations in draft content files (`content.en.js`, `content.ar.js`).
2. Wire validation messages in `rules.js` and ensure `BusinessIdeaValidatorPage.jsx` displays them field-specifically.
3. Update `report.js` to emit the new structure and concise phrasing.
4. Run manual QA: English & Arabic, desktop and mobile, keyboard-only navigation, and basic accessibility checks.
5. Iterate copy after QA and finalize.

Acceptance criteria

- New content files load without breaking the product (no runtime errors).
- Each form field shows a clear field-specific validation message when required data is missing or invalid.
- Final report contains the five required sections with concise advisory language in English and Arabic.
- Language switching preserves the new copy and report structure.

Notes & constraints

- No UI redesigns or added components will be introduced.
- No external services or analytics will be touched as part of this sprint.
- All changes will be limited to the product directory and the specific `src/pages` file noted above.

Next step

- If you confirm this plan, I'll prepare the exact copy drafts (English + Arabic) for review and then implement the changes in code.

Do not modify code until the plan is approved.
