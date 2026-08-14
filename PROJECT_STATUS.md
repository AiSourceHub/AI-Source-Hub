# Project Vision

AI Source Hub is a bilingual Arabic and English platform for practical AI decision tools built on a shared product platform and reusable core engines.

# Project Timeline

- Sprint P1 - Design System
- Sprint P2 - Landing Platform
- Sprint P3 - Shared Core Engine
- Sprint P4 - Roadmap and Product Platform Architecture
- Sprint P5 - Safe Migration of Business Idea Validator
- Sprint P6 - Reusable New Product Starter Template and Product Management Foundation
- Sprint P7 - Startup Risk Scanner
- Sprint P8 - Product Quality, Launch Readiness, and Deployment Preparation
- Sprint P9 - Version 1.0 Public Launch Preparation

# Current Status

AI Source Hub is currently a static v1.0 public launch-ready platform with a shared design system, bilingual landing experience, and two active products: Business Idea Validator and Startup Risk Scanner.

# Completed

- Shared design system and reusable components
- Responsive bilingual homepage and supporting sections
- Business Idea Validator migrated into the shared platform structure
- Startup Risk Scanner implemented and registered as an active product
- Shared analyzer, scoring, recommendation, reporting, and localization foundation
- Launch readiness documentation, SEO assets, legal templates, deployment guidance, and product registry
- Deployed browser QA passed on `https://aisourcehq.com/` for desktop, mobile, English, Arabic/RTL, Business Idea Validator, and Startup Risk Scanner

# Under Development

- Business Idea Validator deterministic interpretation checkpoint is complete locally but not approved for production deployment.
- Manual QA confirms measurable improvement in Arabic report handling: raw numbered problem lists are no longer inserted directly, founder-side execution challenges are separated from customer problems, mechanical ellipses are avoided, revenue wording is safer, and report sections repeat less.
- Known limitation: broad or ambiguous Arabic inputs still do not receive sufficiently strong analytical interpretation. The current deterministic wording patches are paused rather than expanded further.
- Future Validator v2 should use either stricter structured inputs or a properly designed AI interpretation layer before production deployment of deeper report-quality changes.
- Business Idea Validator v2 has started locally with Phase 1: request understanding and report quality gate. The first real-world regression case is an Arabic plastic-recycling plant request that asks feasibility, location, equipment, operating-skill, and marketing questions.
- Phase 1 now pauses industrial/manufacturing investment-assessment requests when essential project details are missing, instead of forcing a generic scored report.
- Business Idea Validator v2 Phase 2 is implemented locally for the first supported industrial subtype: plastic recycling. After structured industrial details are completed, the validator now produces a preliminary industrial decision report instead of the temporary "ready for industrial analysis" message.
- The new industrial report covers preliminary viability, location criteria, equipment pathway, operating skills, B2B marketing route, economics framework, scenarios, project-specific risks, go/no-go gates, and sequenced next actions.
- A focused manual-QA correction is implemented locally for plastic-recycling readiness: incomplete capacity periods now trigger clarification, PET/buyer material mismatch is flagged, informal street/bin collection is not treated as verified feedstock, low budget plus no premises/team/quotations is treated as not ready for factory investment, and export is treated as a later route until volume, quality, logistics, and buyer requirements are established.
- Business Idea Validator general reasoning has been strengthened locally with stakeholder-role interpretation. The validator can now conservatively distinguish supported end-user, buyer/customer, payer, approver, beneficiary, and provider/operator signals from existing inputs, and it adjusts customer clarity, monetization clarity, feasibility, confidence, contradictions, and recommendations when role ambiguity materially affects the business model.
- Business Idea Validator general reasoning has been strengthened locally with evidence and assumption interpretation. The validator now distinguishes unsupported founder claims from stated real-world validation such as customer interviews, paying customers, pilots, usage metrics, supplier quotations, operational data, and institutional discussions; it uses those signals conservatively to adjust confidence, scoring rationale, contradictions, and the most relevant next action without adding UI fields or new score categories.
- Business Idea Validator general reasoning has been strengthened locally with regulatory, licensing, approval, and external-permission dependency interpretation. The validator now detects user-stated approval paths such as permits, licensed professionals, medical or clinical approval, municipal/government authorization, inspections, import/export clearance, institutional vendor approval, platform approval, and facility approval, then adjusts feasibility, confidence, contradictions, risk wording, and next actions conservatively.

# Planned

- Business Name Generator
- Business Model Analyzer
- Pricing Strategy Advisor
- Customer Persona Builder
- Marketing Plan Generator
- Landing Page Generator
- Business Plan Builder
- AI Prompt Optimizer

# Protected Components

- Business Idea Validator implementation and its legacy rollback backup
- Shared core engine modules
- Shared product registry and product configuration
- Shared platform layout, components, and localization foundation

# Known Issues

- The migrated validator uses deterministic client-side rules rather than live AI calls.
- Business Idea Validator report quality is improved but not fully solved for broad or ambiguous Arabic submissions.
- Business Idea Validator v2 industrial analysis does not yet include sourced market research, verified supplier pricing, regulatory evidence, or certified feasibility calculations. Those remain future enhancements.
- Business Idea Validator v2 industrial analysis remains deterministic. It can flag obvious readiness and configuration problems, but it does not replace a verified feasibility study, supplier quotations, buyer specifications, or site/regulatory review.
- Stakeholder-role reasoning remains deterministic and conservative. It can flag clear multi-party ambiguity, but it does not replace deeper customer discovery, sales-process mapping, procurement analysis, or legal/regulatory review.
- Evidence and assumption reasoning remains deterministic and self-reported. It can recognize validation signals stated by the user, but it does not independently verify market facts, revenue, quotations, contracts, or operating data.
- Regulatory and approval dependency reasoning remains deterministic and non-advisory. It can flag approval paths stated or strongly implied by the user, but it does not provide legal, medical, regulatory, religious, or licensing rulings and does not replace qualified review.
- Copy report depends on browser clipboard permission.
- Download report creates a local text file.
- Deferred UX refinement: the homepage Products navigation should eventually keep the visitor at the top of the homepage and reveal a horizontal product selector directly beneath the main navigation instead of scrolling down to the Products section.

# Next Approved Sprint

TBD by project owner. Recommended next step: public launch communication and post-launch monitoring preparation.

# Last Updated

2026-08-14
