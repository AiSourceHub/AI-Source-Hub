# AI Source Hub — Master Blueprint

## 1. Purpose and Product Philosophy

AI Source Hub is a bilingual Arabic and English decision-engine platform for practical business tools.

Core principle:

> We sell decisions and results, not prompts.

The platform exists to guide users toward practical decisions and actionable outcomes. Products should not merely generate attractive text or generic encouragement. They should help users understand the situation, identify risks and missing information, and decide what to do next.

Business logic, methodology, policy, scoring, routing, and final recommendations remain owned by AI Source Hub product architecture. External AI providers may assist interpretation only when explicitly approved, validated, and filtered by AI Source Hub. They do not own product decisions.

## 2. Platform Architecture

The current application is a React and Vite single-page application.

Main application flow:

```text
index.html
→ src/main.jsx
→ src/App.jsx
→ React routes
→ product pages
```

The application uses React Router `HashRouter`. This means SPA routes use hash routing:

```text
https://aisourcehq.com/#/products/business-idea-validator
```

Clean paths without a hash are not the canonical SPA route form for the current app.

Shared platform elements include:

- shared Header component;
- shared Footer component;
- shared ProductLayout renderer;
- shared product registry;
- shared localization helpers;
- shared design tokens and reusable UI components.

Localization is bilingual:

- Arabic uses RTL direction.
- English uses LTR direction.
- Platform-level localization lives in `core/localization.js`.
- Product-level content lives in each product folder, such as `content.ar.js` and `content.en.js`.
- The app shell sets direction according to the active language.

Deployment architecture:

- Public frontend hosting uses GitHub Pages.
- Production domain is `aisourcehq.com`.
- GitHub Actions builds the Vite project and uploads `dist` to GitHub Pages.
- `CNAME` records the production domain.
- The Cloudflare Worker used for BIV semantic infrastructure is separate from the GitHub Pages frontend.

Production and development-only routes are separated:

- Production routes are normal product routes such as `#/products/business-idea-validator`.
- The Guided Discovery prototype route is development-only and guarded by `import.meta.env.DEV`.
- Guided Discovery is not exposed in normal production navigation.

## 3. Product Map

| Product or module | Status | Route | Architecture role | Classification |
| --- | --- | --- | --- | --- |
| Business Idea Validator | Active public product with local v2 work | `#/products/business-idea-validator` | Main BIV product surface using React page plus BIV engine modules | Production/live plus local under-development architecture |
| Startup Risk Scanner | Active public product | `#/products/startup-risk-scanner` | Registered product using shared product platform and product-specific engine modules | Production/live |
| Business Name Generator | Planned | No active product route; planned registry entry only | Future product concept | Planned/incomplete |
| Guided Discovery prototype | Local isolated prototype | `#/dev/biv-guided-discovery` | Validated first-interaction prototype for future BIV discovery layer | Local-only prototype |
| Standalone BIV entry | Parallel standalone product entry | `products/business/idea-validator/index.html` | Legacy-compatible product renderer sharing current BIV engine but duplicating UI/render flow | Local/compatibility, needs consolidation |
| BIV legacy v1 | Preserved rollback reference | `products/legacy/business-idea-validator-v1/prototype/index.html` | Historical pre-migration backup | Deprecated/legacy rollback |
| Old BIV prototype | Historical prototype | `products/business-idea-validator/prototype/index.html` | Original or older prototype artifact | Deprecated/prototype |
| Product template | Starter/scaffold | No public route | Template for future products | Test/scaffold only |

## 4. Business Idea Validator — Product Definition

Business Idea Validator must be one product, not multiple competing BIV implementations.

Primary objective:

Help a user progressively understand and validate a business idea, identify missing information and risks, evaluate feasibility, and leave with a responsible decision and practical next actions.

The intended BIV should guide the user from unclear idea language toward structured understanding, sufficiency, eligibility, classification, feasibility, decision, and report output. Guided Discovery, semantic interpretation, feasibility, specialist analysis, and reporting are internal stages of one BIV journey, not separate final products.

## 5. Target Unified BIV Pipeline

```text
Guided Discovery
→ Canonical Understanding
→ Sufficiency Gate
→ Eligibility
→ Classification
→ Research Layer (future)
→ Specialist Analysis
→ Feasibility
→ Decision
→ Actionable Report
```

| Layer | Responsibility | Current implementation status | Authoritative owner |
| --- | --- | --- | --- |
| Guided Discovery | Capture the user's idea in natural language and ask one useful question at a time | Prototype only | Guided Discovery orchestration, later unified BIV |
| Canonical Understanding | Preserve original text, confirmed answers, interpretations, assumptions, and unknowns separately | Prototype only | BIV-owned state and confirmation contract |
| Sufficiency Gate | Decide whether enough information exists to continue, pause, ask, research, or block payment/reporting | Partially implemented | BIV orchestrator and feasibility foundation |
| Eligibility | Stop ineligible ideas and clarify ambiguous policy/financing cases before analysis | Implemented | BIV eligibility policy |
| Classification | Identify business type, operating model, sector, specialist candidacy, and confidence | Implemented but duplicated | BIV orchestrator/classification layer |
| Research Layer | Gather current external evidence, sources, prices, regulatory information, and market data | Future | Future BIV research module |
| Specialist Analysis | Invoke specialist modules only after explicit specialist match | Partially implemented for PET/recycling industrial example | Central BIV orchestrator |
| Feasibility | Structure capital, operating, location, equipment, labor, supplier, capacity, and timeline inputs | Foundation implemented | BIV feasibility methodology |
| Decision | Decide proceed, test first, revise, or do not proceed yet using evidence and constraints | Existing deterministic implementation; v2 incomplete | BIV decision framework |
| Actionable Report | Produce useful free or paid output with assumptions, evidence, risks, and next actions | Current report exists; next-generation report incomplete | BIV reporting layer |

## 6. Guided Discovery

Guided Discovery currently exists as a local-only isolated prototype.

Key files:

- `src/pages/BusinessIdeaDiscoveryPrototypePage.jsx`
- `products/business/idea-validator/intentDiscoveryPrototype.js`

Development route:

```text
http://127.0.0.1:4173/#/dev/biv-guided-discovery
```

Important routing detail:

Because the application uses `HashRouter`, the hash route is required. Opening a non-hash URL such as `/dev/biv-guided-discovery` can make the app shell load without routing to the intended prototype path. The initial apparent Guided Discovery regression was caused by opening a non-hash URL. This should not be described as a code regression unless later code evidence proves otherwise.

Guided Discovery currently includes:

- canonical `journeyState`;
- route normalized to the Guided Discovery prototype route;
- idea capture;
- intent selection;
- core offering question;
- operating approach question;
- mixed operating approach detail when needed;
- understanding review;
- confirmed snapshot;
- Edit Answers behavior;
- Back behavior;
- reset behavior;
- Arabic and English presentation;
- Arabic RTL and English LTR support;
- confirmed-state language stability;
- display-only translation principle for known local examples.

Guided Discovery also has a local-only draft handoff mapper:

- `products/business/idea-validator/guidedDiscoveryHandoffMapper.js`
- `products/business/idea-validator/guidedDiscoverySufficiencyBridge.js`

The mapper converts only a confirmed Guided Discovery snapshot into a BIV-compatible draft handoff object. It preserves the original idea separately from confirmed interpretation, identifies missing downstream information, and does not generate a verdict, score, eligibility decision, classification decision, feasibility decision, recommendation, or report permission.

The sufficiency bridge consumes that draft handoff and selects only the next missing decision-critical concept to clarify before a future BIV handoff. It is local-only, one-question-at-a-time, and does not own eligibility, classification, feasibility, scoring, recommendations, reports, specialist conclusions, or report permission.

The local development prototype can render this sufficiency bridge after confirmed understanding, asking one missing BIV-required concept at a time and ending at a local `ready_for_biv_draft` state. This remains isolated behind the development-only Guided Discovery route and does not call the production BIV orchestrator.

Confirmed answers are preserved in a snapshot. Locale switching changes presentation only and should not mutate canonical user text, stable IDs, selected intent, operating approaches, or confirmation state.

Display-only translation is a presentation convenience. It must not rewrite canonical data, confirmed answers, original free text, semantic requests, route, or journey state.

Guided Discovery is intended to become the discovery/front-end layer of the single Business Idea Validator product. It is not intended to become a separate final product.

## 7. Current Production BIV

The current public BIV route is:

```text
#/products/business-idea-validator
```

Current production page:

```text
src/pages/BusinessIdeaValidatorPage.jsx
```

The current public page uses a structured profile/idea/classification journey and calls the existing BIV execution pipeline. It includes deterministic validation, eligibility handling, classification confirmation, guided follow-up states, specialist industrial/PET handling, normal scoring, recommendation, copy, download, and report rendering.

Production remains unchanged until explicit integration approval. Guided Discovery must not replace or alter the public BIV flow without a documented and approved integration boundary.

## 8. Current BIV Decision Pipeline

Actual current production data flow:

```text
BusinessIdeaValidatorPage
→ buildEngineInput
→ executeBusinessIdeaValidation
→ orchestrateBusinessIdeaValidation
→ validateForExecution
→ evaluateIdeaEligibility
→ classifyValidatorRequest
→ collectClassificationEvidence
→ buildFeasibilityFoundation
→ buildGuidedFeasibilityFlow
→ matchSpecialist / assessBusinessIdeaRequest
→ scoreBusinessIdea
→ buildBusinessIdeaRecommendation
→ buildBusinessIdeaReport / buildIndustrialPreliminaryAnalysis
→ result rendering
```

Rendering decisions currently use `journeyState` from `executeBusinessIdeaValidation`, with fallback page state for profile, idea, and classification steps before a result exists.

The current route authority for the production BIV engine is the central orchestrator result. `route` is the canonical primary-route field. `selectedRoute` must not be reintroduced.

## 9. Decision Ownership

BIV owns:

- eligibility;
- sufficiency;
- classification authority;
- feasibility methodology;
- scoring;
- report permission;
- verdicts;
- final decisions;
- commercial boundaries.

Semantic or AI providers may assist interpretation only. They may propose normalized meaning, candidate classifications, ambiguities, contradictions, or follow-up questions, but they must not own product decisions.

No external AI provider may decide:

- eligibility;
- route;
- journey state;
- score;
- price;
- payment;
- capital estimate;
- regulatory conclusion;
- final recommendation;
- final report.

## 10. Semantic Intelligence Layer

The BIV semantic architecture currently includes:

- semantic intent contract;
- semantic request validation;
- semantic output validation;
- BIV filtering;
- mock provider;
- BIV-owned presentation model;
- secure server boundary;
- Cloudflare Worker wrapper;
- disabled OpenAI Responses adapter preparation;
- shadow adapter for observational comparison.

Key files:

- `products/business/idea-validator/semanticIntentContract.js`
- `products/business/idea-validator/semanticIntentValidator.js`
- `products/business/idea-validator/semanticIntentProvider.js`
- `products/business/idea-validator/semanticIntentMockProvider.js`
- `products/business/idea-validator/semanticIntentFilter.js`
- `products/business/idea-validator/semanticIntentPresentation.js`
- `products/business/idea-validator/semanticServerBoundary.js`
- `products/business/idea-validator/semanticShadowAdapter.js`
- `products/business/idea-validator/semanticOpenAIProviderAdapter.js`
- `workers/biv-semantic-intent-worker.js`

Current safeguards:

- Worker mode is `mock`.
- Live OpenAI is disabled.
- No OpenAI API key exists or is used.
- Shadow mode is OFF by default.
- Provider output is advisory only.
- Production BIV does not rely on Worker output.
- Browser-supplied provider credentials are rejected.
- Semantic output passes through validation and filtering before presentation.
- Worker and shadow responses do not own route, eligibility, scoring, payment, price, estimate, or report decisions.

## 11. Cloudflare Worker

The semantic Worker endpoint is:

```text
POST /api/biv/semantic-intent
```

Current deployed workers.dev endpoint:

```text
https://biv-semantic-intent.officialaisourcehub.workers.dev/api/biv/semantic-intent
```

The Worker is isolated from the GitHub Pages frontend. It exists as semantic infrastructure and currently operates in mock mode only.

Current Worker configuration:

- Worker name: `biv-semantic-intent`
- Entry file: `workers/biv-semantic-intent-worker.js`
- `BIV_SEMANTIC_PROVIDER_MODE = "mock"`
- `BIV_ALLOW_LIVE_OPENAI = "false"`
- default mock scenario: `valid`

The Worker has no BIV decision authority. It returns a semantic envelope and filtered semantic result only. BIV remains the owner of decisions.

## 12. Privacy and Security Principles

AI Source Hub should preserve local-first and privacy-first behavior wherever possible.

Principles:

- The user's original free text remains canonical.
- Confirmed user answers remain authoritative.
- Display translations must not rewrite canonical user data.
- Semantic providers may receive only the minimum data needed for the current interpretation task.
- Secrets must be server-side only.
- No API key may be stored in frontend code, Vite browser variables, fixtures, or documentation examples.
- Browser requests must never provide or override provider secrets.
- No unnecessary external data sharing.
- No telemetry, analytics, storage, or external data flow should be added without explicit owner approval.
- Semantic providers never own business decisions.

Business ideas should be treated as potentially confidential commercial information.

## 13. Domain-Agnostic Principle

PET/recycling and air-conditioning examples are test cases only.

BIV must remain sector-independent and support business ideas across:

- services;
- retail;
- wholesale/import/distribution;
- industrial and manufacturing;
- technology and software;
- marketplaces and platforms;
- food and beverage;
- healthcare;
- logistics and transport;
- real estate;
- future domains.

Specialist modules extend the general engine. They must not replace the general engine and must not become defaults for broad or ambiguous ideas.

The system should improve general reasoning rather than overfitting to individual manual QA examples.

## 14. Specialist Analysis

Current specialist work includes an industrial/PET recycling specialist example.

This work should be classified as:

```text
KEEP, but isolate behind general specialist selection architecture.
```

Specialist analysis should activate only when explicit and sufficiently confident specialist evidence exists. Generic industrial, service, retail, digital, marketplace, and ambiguous ideas must remain isolated from PET/recycling behavior unless the user supplies real PET/recycling evidence.

## 15. Architecture Drift / Consolidation Register

| Area | Current issue | Classification | Target |
| --- | --- | --- | --- |
| React BIV page vs standalone renderer | `src/pages/BusinessIdeaValidatorPage.jsx` and `products/business/idea-validator/index.js` both render BIV-like flows | MERGE later | One primary BIV UI surface, with standalone entry retained only if explicitly needed |
| Guided Discovery vs production first steps | Guided Discovery is isolated while production BIV still has its own profile/idea/classification first journey | MERGE | Guided Discovery becomes the front-end discovery layer of the single BIV product |
| Duplicated classification-style logic | `classificationEvidence.js`, `feasibilityFoundation.js`, and `requestUnderstanding.js` contain overlapping matcher logic | REFACTOR | One canonical classification evidence layer feeding downstream modules |
| Legacy BIV v1 | Preserved historical rollback copy | DEPRECATE / rollback reference | Keep as reference until owner approves removal |
| Old prototype | Older BIV prototype artifacts remain | DEPRECATE | Preserve until consolidation plan defines deletion boundary |
| Semantic mock/Worker/shadow | Approved semantic infrastructure exists and is isolated | KEEP | Keep as assistive infrastructure with BIV authority preserved |
| Inline Guided Discovery localization | Guided Discovery has inline `discoveryContent` separate from product localization files | REFACTOR later | Move or reconcile localization once production integration is approved |
| PET specialist | Useful specialist example can dominate architecture if not isolated | KEEP / isolate | Specialist modules remain subordinate to central orchestrator |

Do not delete anything from this register without explicit owner approval.

## 16. Architecture Gap Map

| Layer | Audited status |
| --- | --- |
| Discovery | Prototype only |
| Canonical Understanding | Prototype only |
| Sufficiency | Partial |
| Eligibility | Implemented |
| Classification | Implemented but duplicated |
| Research | Future |
| Specialist Analysis | Partially implemented |
| Feasibility | Foundation implemented |
| Decision | Existing deterministic implementation; v2 incomplete |
| Actionable Report | Current report exists; next-generation report incomplete |

## 17. Production / Local / Legacy Boundaries

### Production

- Public GitHub Pages site at `aisourcehq.com`.
- React app entry through `src/main.jsx` and `src/App.jsx`.
- Public Business Idea Validator route: `#/products/business-idea-validator`.
- Public Startup Risk Scanner route: `#/products/startup-risk-scanner`.
- Current production BIV remains the active public BIV until explicit integration approval.

### Local / Development

- Guided Discovery prototype route: `#/dev/biv-guided-discovery`.
- `BusinessIdeaDiscoveryPrototypePage.jsx`.
- `intentDiscoveryPrototype.js`.
- Semantic mock integration and BIV-owned presentation layer.
- Shadow adapter, OFF by default.
- Local BIV v2 orchestration and feasibility work that is not fully production-approved.

### Legacy / Rollback

- `products/legacy/business-idea-validator-v1/prototype/index.html`.
- Old BIV prototype folder under `products/business-idea-validator/prototype`.
- Standalone BIV renderer under `products/business/idea-validator/index.js` should be treated as a compatibility or transitional surface until ownership is clarified.

### Future

- Saudi research layer.
- Full paid preliminary decision report.
- Information-sufficiency gate before payment.
- Payment and email delivery.
- Real OpenAI activation after explicit approval.
- Production Guided Discovery integration.
- Unified BIV decision/report flow.

## 18. Current Session 11 Status

Repository state from the Session 11 audit:

- Branch: `main`
- HEAD: `bcc682ec042eb1b6f283a1cd1f65d5db8198f73f`
- Commit title: `fix: preserve confirmed discovery state across locales`
- Ahead/behind versus `origin/main`: ahead 1, behind 0
- Staged changes before this blueprint: none
- Unstaged tracked changes before this blueprint: none
- Tracked working tree before this blueprint: clean
- Relevant untracked files:
  - `استئناف AI Source Hub.html`
  - `استئناف AI Source Hub_files/`

The initial apparent Guided Discovery regression was caused by opening a non-hash URL. The correct dev URL is:

```text
http://127.0.0.1:4173/#/dev/biv-guided-discovery
```

Do not describe this as a code regression unless code evidence later proves otherwise.

## 19. Consolidation Strategy

Smallest safe consolidation approach:

### Phase 1 — Blueprint / Ownership Definition

Create this master blueprint and define the product/platform ownership model before runtime changes.

### Phase 2 — Route and Component Ownership Cleanup

Clarify which BIV surfaces are production, local, legacy, or transitional. Avoid multiple BIV renderers owning the same behavior.

### Phase 3 — Connect Confirmed Guided Discovery Output to BIV Input Contract

Define the contract that maps confirmed Guided Discovery output into the existing BIV orchestrator without changing eligibility or decision authority.

Status: a local isolated draft mapper, sufficiency bridge, and prototype UI bridge flow exist. They are not connected to the production BIV route.

### Phase 4 — Unify Sufficiency / Classification Ownership

Consolidate classification, sufficiency, and missing-information ownership so downstream modules use one canonical understanding.

### Phase 5 — Integrate Specialist + Feasibility Pipeline

Keep specialist modules subordinate to the orchestrator and connect feasibility only after confirmed understanding and sufficiency gates.

### Phase 6 — Unified Decision / Report Flow

Align decision framework, report permission, free preview, paid report readiness, and actionable report output.

### Phase 7 — Controlled Local / Manual QA

Run Arabic, English, mobile, desktop, eligibility, clarification, generic, specialist, and normal-report regression QA before production exposure.

### Phase 8 — Production Integration Only After Explicit Approval

Expose unified BIV behavior publicly only after owner approval. Do not rebuild from scratch.

## 20. Guardrails

- No Guided Discovery production exposure yet.
- No live OpenAI yet.
- Shadow mode remains OFF by default.
- No DNS changes.
- Preserve production BIV while consolidation is occurring.
- No destructive legacy cleanup without explicit approval.
- Changes should improve the general engine, not overfit test cases.
- Keep `route` as the canonical BIV route field.
- Keep Guided Discovery `journeyState` canonical inside the isolated prototype until integration is approved.
- Do not let semantic or Worker output control UI, journey state, eligibility, scoring, payment, report permission, or final decision.
- Preserve unrelated untracked resume/export files unless the owner explicitly authorizes cleanup.

## 21. Exact Next Step

Next implementation step after this blueprint is approved:
perform a focused route/component ownership consolidation review for BIV, then define the canonical contract between confirmed Guided Discovery output and the existing BIV orchestrator. No runtime change should begin until that boundary is explicitly documented.
