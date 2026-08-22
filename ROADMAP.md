# AI Source Hub Roadmap

## 1. Vision

AI Source Hub is a bilingual Arabic/English platform that delivers focused AI-powered decision tools.

Core principle:

> We sell decisions and results, not prompts.

The platform should stay practical, fast, and focused. Every product must solve one business problem and produce a useful result the user can act on.

## 2. Current Project Status

Completed:

- Sprint P1 - Design System
- Sprint P2 - Landing Platform
- Sprint P3 - Shared Core Engine
- Sprint P4 - Roadmap and Product Platform Architecture
- Sprint P5 - Safe Migration of Business Idea Validator
- Sprint P6 - Reusable New Product Starter Template
- Sprint P7 - Startup Risk Scanner
- Sprint P8 - Product Quality, Launch Readiness, and Deployment Preparation
- Sprint P9 - Version 1.0 Public Launch Preparation

Current platform capabilities:

- Shared design system
- Reusable components
- Arabic RTL support
- English support
- Responsive layout
- Dark-mode-ready tokens
- Accessibility-ready structure
- Shared validation engine
- Shared analyzer
- Shared scoring engine
- Shared recommendation engine
- Shared report builder
- Localization foundation
- Reusable new product starter template
- Optional product generator helper
- Active product registry with Business Idea Validator and Startup Risk Scanner
- Launch readiness checklist
- Startup Risk Scanner quality and accessibility polish
- SEO metadata, legal templates, brand assets, deployment guide, and v1.0 changelog
- Deployed browser QA passed on `https://aisourcehq.com/` for desktop, mobile, English, Arabic/RTL, Business Idea Validator, and Startup Risk Scanner
- Business Idea Validator v2 Phase 1 started locally with request understanding and a report quality gate for industrial/manufacturing investment-assessment requests
- Business Idea Validator v2 Phase 2 implemented locally with plastic recycling as the first supported industrial subtype
- The v2 industrial preliminary report now covers viability, location, equipment, operating skills, marketing, economics framework, scenarios, risks, decision gates, and next actions without using the old generic score
- Business Idea Validator v2 manual-QA correction implemented locally for plastic-recycling configuration readiness, including capacity-period clarification, PET/buyer fit checks, informal-supply handling, budget-readiness severity, and export-readiness guardrails
- Business Idea Validator stakeholder-role reasoning implemented locally to improve domain-agnostic interpretation of end users, buyers/customers, payers, approvers, beneficiaries, and provider/operator roles without adding UI fields or new score categories
- Business Idea Validator evidence/assumption reasoning implemented locally to distinguish unsupported claims from user-stated validation evidence such as customer interviews, paying customers, pilots, usage metrics, supplier quotations, operational data, and institutional discussions, with conservative confidence, scoring rationale, contradiction, and recommendation adjustments
- Business Idea Validator regulatory/approval dependency reasoning implemented locally to detect user-stated external permission paths such as permits, licensed professionals, medical or clinical approval, municipal authorization, inspections, import/export clearance, institutional vendor approval, platform approval, and facility approval, with conservative feasibility, confidence, contradiction, risk, and next-action adjustments
- Capital & Operational Feasibility foundation started locally with a domain-agnostic feasibility model for startup capital, recurring operating costs, location, equipment, inventory/materials, labor, licenses/compliance, suppliers/dependencies, operating capacity, implementation timeline, and evidence quality; adaptive bilingual question groups now cover industrial/manufacturing, service, retail/trading, digital/software, marketplace/platform, and generic fallback cases without producing unsupported figures
- Business Idea Validator unified guided journey started locally: feasibility, capital, location, equipment, labor, operations, research, and implementation planning are internal stages of the validator experience, not separate user-facing products. The first visible guided follow-up now appears when an early idea or founder feasibility question needs structured answers before scoring.
- Business Idea Validator guided journey now captures user experience level and project stage as separate structured dimensions for first paid-launch beginner and limited-experience paths while preserving the original idea/problem fields.
- Existing-business and professional paths remain deferred post-validation work. Structured current-business field definitions exist locally for future use, but they are not exposed as completed Phase 3 analysis behavior.
- Business Idea Validator Product Specification v2.0 approved locally in `BIV_PRODUCT_SPEC_V2.md`.
- Business Idea Validator v2 Phase 2 central orchestrator hardening implemented locally: one normalized route-decision layer now controls validation errors, eligibility refusal, clarification, guided follow-up, research-required placeholder, specialist analysis, and normal evaluation before UI rendering. Specialist modules remain subordinate to the orchestrator, and future free/paid routes remain dormant contract values only.
- Business Idea Validator v2 Phase 2 focused manual QA passed locally: mobile car-wash input stayed on the normal lawful path without PET/plastic/manufacturing analysis, clearly ineligible betting input blocked scoring and reports, and explicit PET sorting/baling input selected specialist analysis without unsupported prices or profitability claims.
- Business Idea Validator v2 Phase 3 beginner journey and classification confirmation implemented locally: first paid-launch users can identify as first-time beginners or limited-experience users, provide first-project status, project stage, country, city where relevant, and decision objective, then confirm or correct a plain-language business classification before the orchestrator continues through the existing route path.
- Confirmed classification now controls downstream routing and guided questions locally. Correction can redirect a broad idea toward retail, wholesale/import/distribution, field service, professional service, manufacturing/industrial, food and beverage, digital/software, marketplace/platform, healthcare, real estate, or generic fallback without bypassing eligibility or financing clarification.
- Business Idea Validator v2 Phase 3 Boundary 1 canonical journey-state rendering is locally accepted. Manual QA passed for `classification_review` isolation and `eligibility_clarification` isolation/subtype content. No generic status panel, score, report, copy, or download actions appeared in those non-report states.
- Phase 3 remains local and not production-approved. Known blockers before production approval: Arabic substring false positives such as `طبي` inside `طبيعة`, natural Arabic eligibility ambiguity gaps such as `فعاليات ترفيهية ليلية`, duplicated/mechanical classification explanation wording, no AI semantic interpretation layer, and incomplete repeated manual QA coverage for financing, ineligible, normal-report, and specialist journey states in the Boundary 1 checkpoint.

## 3. Milestones

| Milestone | Objective | Deliverables | Completion Criteria | Dependencies | Status |
| --- | --- | --- | --- | --- | --- |
| Milestone 1 - Platform Foundation | Create a reusable visual and layout foundation. | Design system, reusable components, homepage foundation. | Shared tokens and components exist; homepage can use them. | Product charter. | Completed |
| Milestone 2 - Core Engine | Create reusable product logic modules. | Analyzer, validation engine, scoring engine, recommendation engine, report builder, localization foundation. | Modules work with generic product configuration and contain no product-specific rules. | Platform foundation. | Completed foundation |
| Milestone 3 - Product Platform | Define how products are registered, rendered, executed, and maintained. | Product architecture, product contracts, registry, migrated Business Idea Validator, reusable starter template. | Product Platform Architecture is documented, the first product migration passes available smoke tests, and future products can start from a reusable template. | Core engine. | Completed foundation |
| Milestone 4 - Product Suite | Build the initial suite of focused AI products. | Migrated Business Idea Validator plus prioritized additional products. | Products use shared layout, shared engine modules, Arabic/English support, and standard reports. | Product platform. | Current |
| Milestone 5 - Quality and Release Candidate | Stabilize the platform for public release. | Manual test checklist, accessibility checks, browser testing, copy/download tools, regression checks, launch documentation. | No console errors; product outputs are useful; Arabic and English work correctly. | Product suite. | Completed |
| Milestone 6 - Public Launch | Launch the first public version. | Release 0.1 or later public package, launch content, support process. | Public users can access the platform and complete core workflows. | Release candidate. | Completed |

## 4. Product Suite

### Business Category

| Product | Purpose | Required Inputs | Main Outputs | Shared Engine Modules Used | MVP Priority | Current Status |
| --- | --- | --- | --- | --- | --- | --- |
| Business Idea Validator | Evaluate whether a business idea is worth pursuing, improving, or pausing. | Idea, target customer, problem, monetization. | Verdict, score, score breakdown, confidence, biggest risk, next action, improved idea, copy/download report. | Analyzer, ValidationEngine, ScoreEngine, RecommendationEngine, ReportBuilder, localization. | Priority 1 | Migrated to shared platform; legacy backup preserved |
| Business Name Generator | Generate practical business name options based on positioning. | Business description, audience, tone, language, optional keywords. | Name options, rationale, availability checklist, shortlist. | Analyzer, ValidationEngine, RecommendationEngine, ReportBuilder, localization. | Priority 2 | Pending |
| Business Model Analyzer | Evaluate how a business creates, delivers, and captures value. | Offer, customer, revenue model, delivery model, cost drivers. | Model summary, strengths, weaknesses, risks, improvement actions. | Analyzer, ValidationEngine, ScoreEngine, RecommendationEngine, ReportBuilder, localization. | Priority 3 | Pending |
| Pricing Strategy Advisor | Recommend a practical pricing direction. | Product/service, customer, value delivered, cost range, competitors if known. | Pricing model, suggested range, risks, test plan. | Analyzer, ValidationEngine, ScoreEngine, RecommendationEngine, ReportBuilder, localization. | Priority 2 | Pending |
| Startup Risk Scanner | Identify the biggest risks facing a startup and prioritize risk-reduction actions. | Startup stage, problem clarity, customer clarity, demand evidence, market access, advantage, business model, pricing evidence, team capability, runway, execution complexity, dependency risks. | Overall risk score, risk level, six dimension scores, strongest area, most dangerous risk, top risks, next action, validation plan. | Analyzer, ValidationEngine, ScoreEngine, RecommendationEngine, ReportBuilder, localization. | Priority 2 | Active |
| Customer Persona Builder | Create a useful customer persona for business decisions. | Customer segment, problem, goal, buying context, objections. | Persona, needs, pains, triggers, objections, messaging notes. | Analyzer, ValidationEngine, RecommendationEngine, ReportBuilder, localization. | Priority 3 | Pending |
| Marketing Plan Generator | Create a simple action-oriented marketing plan. | Product, audience, goal, budget, channels, timeline. | Marketing plan, channel priorities, weekly actions, success metrics. | Analyzer, ValidationEngine, RecommendationEngine, ReportBuilder, localization. | Priority 3 | Pending |
| Landing Page Generator | Generate a structured landing page draft. | Product, audience, problem, offer, proof, call to action. | Page structure, hero copy, sections, CTA, FAQ draft. | Analyzer, ValidationEngine, RecommendationEngine, ReportBuilder, localization. | Priority 4 | Pending |
| Business Plan Builder | Create a concise business plan draft. | Idea, customer, market, revenue model, operations, goals. | Business plan sections, assumptions, risks, next steps. | Analyzer, ValidationEngine, RecommendationEngine, ReportBuilder, localization. | Priority 4 | Pending |

### AI Productivity Category

| Product | Purpose | Required Inputs | Main Outputs | Shared Engine Modules Used | MVP Priority | Current Status |
| --- | --- | --- | --- | --- | --- | --- |
| AI Prompt Optimizer | Improve a user prompt for clearer AI output. | Original prompt, goal, target AI task, desired format. | Improved prompt, structure notes, missing context checklist. | Analyzer, ValidationEngine, RecommendationEngine, ReportBuilder, localization. | Priority 4 | Pending |

## 5. Product Priorities

### Priority 1

- Business Idea Validator migration and polish

### Priority 2

- Business Name Generator
- Pricing Strategy Advisor

### Priority 3

- Customer Persona Builder
- Business Model Analyzer
- Marketing Plan Generator

### Priority 4

- Landing Page Generator
- Business Plan Builder
- AI Prompt Optimizer

This order maximizes reuse because the first products share similar input, validation, scoring, recommendation, and reporting patterns. Migrating Business Idea Validator first proves the platform architecture with an existing working product. The next three products reuse the same decision-report pattern without requiring accounts, payments, saved data, or external services.

## 6. Release Strategy

### Release 0.1

- Platform foundation
- Business Idea Validator
- Homepage
- Arabic and English support
- Local browser operation

### Release 0.2

- Three additional working products
- Shared product navigation
- Standardized reports

### Release 0.3

- Full initial product suite
- Quality testing
- Export and copy tools
- Release candidate

### Future Releases

Out of current scope:

- Accounts
- Saved reports
- Payments
- External AI integration
- Analytics
- Admin dashboard

These should be added only after the core product experience proves useful.

## 7. Definition of Done

A product is complete only when:

- Arabic and English work correctly.
- RTL and LTR are correct.
- Mobile and desktop layouts work.
- Validation handles empty and weak inputs.
- Results are useful and understandable.
- Shared components are used.
- Shared engine modules are used where appropriate.
- Copy and download report functions work.
- No console errors exist.
- Basic accessibility checks pass.
- Documentation exists.
- Manual test checklist passes.

## 8. Backlog

### Now

- Business Idea Validator v2 Phase 3 Boundary 2A is locally accepted: Unicode-safe classification evidence matching fixed the false healthcare match where `طبي` matched inside `طبيعة`, and `classificationEvidence.js` now supplies traceable evidence records. Vague inputs may intentionally remain `generic` / `unknown`; legacy matchers remain in `feasibilityFoundation.js` and `requestUnderstanding.js`, and the current generic/unknown user-facing experience is not approved for production.
- Guided Discovery Iteration 2 exists as an isolated local prototype only. Manual QA passed for the service-idea path: idea capture → intent selection → core offering → operating approach → summary. It is not connected to production Business Idea Validator, is not exposed in public navigation, and does not include semantic AI/API integration, scoring, reports, research, eligibility changes, or deployment approval.

### Next

- Specification reconciliation and semantic-provider integration planning for Guided Discovery before any production connection or OpenAI/API work.
- Capital & Operational Feasibility Phase 2: turn the guided follow-up readiness state into a coherent preliminary feasibility output covering market/customer need, feasibility, capital confidence, cost categories, location, equipment, labor, operating model, licenses/dependencies, risks, unknowns, and next actions without inventing figures.
- Use the captured user experience level and project stage to tailor the preliminary feasibility report structure for beginners, experienced founders, and existing-business improvement/expansion cases.
- After orchestration QA passes, prepare a production checkpoint for the Business Idea Validator v2 routing architecture without adding final capital estimates.
- Business Idea Validator v2 external-evidence readiness: add sourced market research, independently verified supplier pricing, regulatory evidence, and certified-feasibility handoff guidance where appropriate.
- Add shared product navigation.
- Build Business Name Generator.
- Build Pricing Strategy Advisor.

### Later

- Refine homepage product navigation so the Products control keeps the visitor at the top of the homepage and reveals a horizontal product selector directly beneath the main navigation instead of scrolling down to the Products section.
- Build remaining initial product suite.
- Add saved reports.
- Add accounts.
- Add payments.
- Add analytics.
- Add admin dashboard.
- Explore external AI integration.

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Overbuilding before launch | Keep Release 0.1 focused on one polished product and the platform foundation. |
| Creating too many disconnected products | Use shared configuration, shared ProductLayout, shared reports, and the product registry. |
| Duplicate code | Move repeated logic into core-engine or shared components only after at least two products need it. |
| Inconsistent Arabic localization | Keep shared terminology in localization files and require Arabic QA before release. |
| Weak product outputs | Define output schemas, test sample inputs, and require useful next actions for every product. |
| Spending time on authentication and payments too early | Mark accounts and payments as future scope until product usefulness is proven. |
| Documentation replacing actual implementation | Keep documentation tied to implementation tasks and release criteria. |
| Lack of browser testing | Add manual browser checks to the Definition of Done before release candidate. |
| Treating stated claims as verified facts | Keep deterministic evidence reasoning conservative and require explicit user-stated validation signals before increasing confidence. |
| Inventing legal or regulatory requirements | Treat approvals and licenses as dependencies to check, not rulings, and avoid sector-name-only penalties. |
| Producing false precision in capital estimates | Do not calculate capital or operating figures until required inputs and evidence quality are separated. |
| Fragmenting the user journey into disconnected tools | Keep feasibility, capital, location, labor, operations, research, and implementation planning as internal stages inside Business Idea Validator unless a later product has a clearly separate job. |
| Treating every user as the same type of founder | Capture experience level and project stage explicitly, keep them separate, and adapt question depth without making assumptions from writing style. |

## 10. Progress Tracking

| Milestone | Status | Progress | Next Action |
| --- | --- | --- | --- |
| Platform Foundation | Completed | 100% | Keep components stable while products migrate. |
| Core Engine | Completed foundation | 100% | Use it in the first migrated product. |
| Product Platform | Completed foundation | 90% | Use the starter template for the next product. |
| Product Suite | Current | 35% | Stabilize active products before adding the next product. |
| Quality and Release Candidate | Completed | 100% | Preserve regression checks while planning the next product. |
| Public Launch | Completed | 100% | Prepare public launch communication and post-launch monitoring. |
| Business Idea Validator v2 | Guided Discovery Iteration 2 isolated local prototype accepted; not production-approved | Phase 2 central orchestration hardening + Phase 3 beginner/classification confirmation + canonical journey-state rendering + Boundary 2A Unicode-safe classification evidence matching + isolated guided discovery prototype | Reconcile the specification and semantic-provider integration plan before production approval or Phase 4/OpenAI work. |
