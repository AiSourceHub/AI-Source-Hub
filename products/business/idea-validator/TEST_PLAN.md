# Business Idea Validator Test Plan

## Scope

This test plan covers the migrated Business Idea Validator at:

`products/business/idea-validator/index.html`

Legacy reference:

`products/legacy/business-idea-validator-v1/prototype/index.html`

## Manual Test Cases

| Case | Input | Expected Result |
| --- | --- | --- |
| Empty inputs | Submit with all fields empty. | Invalid input state; field validation messages appear. |
| Very short inputs | Enter one or two words per field. | Invalid or low-confidence result; no high score. |
| Strong detailed inputs | Specific idea, customer, painful problem, clear monetization. | Higher score, useful verdict, five category scores, report actions. |
| Vague inputs | Generic platform, everyone, not sure, not sure. | Low score, weak verdict, biggest risk identifies unclear customer/problem. |
| Contradictory inputs | Idea and problem do not match. | Lower confidence and reduced feasibility. |
| Arabic inputs | All fields in Arabic. | Arabic UI and report remain readable RTL. |
| English inputs | All fields in English. | English UI and report remain LTR. |
| Mixed-language inputs | Mix Arabic and English. | Selected interface language controls system labels; generated report remains usable. |
| Mobile layout | Narrow viewport. | Form and result stack cleanly. |
| Desktop layout | Wide viewport. | Form and result sit in responsive product layout. |
| RTL | Switch to Arabic. | Direction is RTL and labels are Arabic. |
| LTR | Switch to English. | Direction is LTR and labels are English. |
| Copy report | Generate result and press Copy Report. | Readable report is copied to clipboard where browser permits. |
| Download report | Generate result and press Download Report. | Local text report downloads. |
| Reset | Generate result and press Start Again. | Form clears and result hides. |
| Repeated analyses | Analyze, edit inputs, analyze again. | Result updates without reload or console errors. |
| No console errors | Complete normal workflow. | Browser console has no application errors. |

## Legacy Comparison

Compare migrated version with the legacy version for:

- Four input fields
- Score output
- Verdict output
- Biggest risk
- Next action
- Improved idea
- Arabic and English handling

The migrated version may use improved scoring categories, but must not lose the useful validation-result workflow.

## Executable Smoke Test

Run from the project root:

`node products/business/idea-validator/smoke-test.mjs`

Smoke test covers:

- Strong English input
- Weak vague input
- Arabic input
- Contradictory input
- Empty input validation

