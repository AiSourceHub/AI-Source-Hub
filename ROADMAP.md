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

## 3. Milestones

| Milestone | Objective | Deliverables | Completion Criteria | Dependencies | Status |
| --- | --- | --- | --- | --- | --- |
| Milestone 1 - Platform Foundation | Create a reusable visual and layout foundation. | Design system, reusable components, homepage foundation. | Shared tokens and components exist; homepage can use them. | Product charter. | Completed |
| Milestone 2 - Core Engine | Create reusable product logic modules. | Analyzer, validation engine, scoring engine, recommendation engine, report builder, localization foundation. | Modules work with generic product configuration and contain no product-specific rules. | Platform foundation. | Completed foundation |
| Milestone 3 - Product Platform | Define how products are registered, rendered, executed, and maintained. | Product architecture, product contracts, registry, migrated Business Idea Validator, reusable starter template. | Product Platform Architecture is documented, the first product migration passes available smoke tests, and future products can start from a reusable template. | Core engine. | Completed foundation |
| Milestone 4 - Product Suite | Build the initial suite of focused AI products. | Migrated Business Idea Validator plus prioritized additional products. | Products use shared layout, shared engine modules, Arabic/English support, and standard reports. | Product platform. | Current |
| Milestone 5 - Quality and Release Candidate | Stabilize the platform for public release. | Manual test checklist, accessibility checks, browser testing, copy/download tools, regression checks, launch documentation. | No console errors; product outputs are useful; Arabic and English work correctly. | Product suite. | Current |
| Milestone 6 - Public Launch | Launch the first public version. | Release 0.1 or later public package, launch content, support process. | Public users can access the platform and complete core workflows. | Release candidate. | Pending |

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

- Replace launch placeholders with the real production domain and official contact method.
- Browser-test active products on a deployed staging URL.
- Add full manual browser test checklist results.
- Complete legal review before public traffic.

### Next

- Add shared product navigation.
- Build Business Name Generator.
- Build Pricing Strategy Advisor.

### Later

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

## 10. Progress Tracking

| Milestone | Status | Progress | Next Action |
| --- | --- | --- | --- |
| Platform Foundation | Completed | 100% | Keep components stable while products migrate. |
| Core Engine | Completed foundation | 100% | Use it in the first migrated product. |
| Product Platform | Completed foundation | 90% | Use the starter template for the next product. |
| Product Suite | Current | 35% | Stabilize active products before adding the next product. |
| Quality and Release Candidate | Current | 55% | Replace launch placeholders and run deployed browser QA. |
| Public Launch | Pending | 10% | Deploy staging, complete legal review, then publish. |
