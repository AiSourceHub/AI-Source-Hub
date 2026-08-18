# Business Idea Validator Product Specification v2.0

## 1. Product Purpose

Business Idea Validator v2 is the adaptive starting point for AI Source Hub. It is a decision-support product that helps a user move from a rough business idea to a practical preliminary decision.

The product must be valuable enough to justify payment because it sells decisions, structure, evidence, and actionable results. It does not sell prompts, attractive generic text, or unsupported encouragement.

The first paid product is:

- English: BIV Preliminary Decision Report
- Arabic: تقرير القرار الأولي للمشروع

Product promise:

"Through an adaptive interview and evidence-based research, BIV converts a business idea into a preliminary Saudi-market decision report covering implementation feasibility, startup-capital range, operating requirements, licensing, risks, assumptions, and the next actions required before investing."

“من خلال مقابلة متكيّفة وبحث قائم على الأدلة، يحوّل BIV فكرة المشروع إلى تقرير قرار أولي للسوق السعودي، يغطي قابلية التنفيذ، ونطاق رأس المال التأسيسي، والمتطلبات التشغيلية، والتراخيص، والمخاطر، والافتراضات، والخطوات المطلوبة قبل الاستثمار.”

This is a preliminary decision report. It is not a guaranteed-success prediction, a bank-certified feasibility study, legal approval, tax advice, religious ruling, engineering approval, investment approval, or a guarantee of profitability.

## 2. Target Users

First paid launch targets:

- First-time entrepreneurs
- Users with limited business experience
- Users in Saudi Arabia evaluating a new idea before committing substantial money

Post-validation expansion paths:

- Experienced business owners
- Investors/professionals
- Existing businesses evaluating expansion or a new activity

| User path | Launch status | Knowledge level | Language depth | Question depth | Report depth | Assistance required |
| --- | --- | --- | --- | --- | --- | --- |
| First-time beginner | First paid launch | Low business knowledge; may only have an idea | Simple, supportive, non-technical | Short grouped questions with examples | Clear preliminary decision, feasibility blockers, missing inputs, next steps | Explain terms, avoid jargon, guide step by step |
| Limited-experience user | First paid launch | Understands the idea but lacks feasibility structure | Plain business language | Practical questions with light explanation | Moderate detail across demand, costs, risks, assumptions, and actions | Help separate customer need, cost, operations, evidence, and assumptions |
| Experienced business owner | Post-validation expansion | Understands operations and may have real data | Concise, analytical | Deeper questions on evidence, capacity, margins, channels, bottlenecks | More operational and economic detail | Compare assumptions with current or expected operating realities |
| Investor/professional | Post-validation expansion | Comfortable with business analysis | Direct, structured, evidence-focused | Deeper questions on market, economics, risk, evidence quality, sensitivity | Strong evidence traceability and decision gates | Require source quality, assumptions, downside risks, and unresolved items |
| Existing business expansion/new activity | Post-validation expansion | Has an operating baseline | Comparative, performance-focused | Current revenue, costs, margins, capacity, staffing, bottlenecks, objective | Compare current performance with proposed expansion or improvement | Separate current facts from expansion assumptions |

Arabic examples should use natural business language, such as:

- "دعنا نفهم فكرتك بشكل أدق"
- "ما الذي تعرفه فعلاً، وما الذي يحتاج إلى تحقق؟"
- "لا يمكن تقدير التكلفة بثقة قبل معرفة الموقع والطاقة التشغيلية والمعدات المطلوبة."

## 3. Product Modes

### A. Quick Free Diagnostic

Purpose: determine whether the idea deserves deeper investigation.

The free diagnostic should give useful direction without becoming the complete paid report. It may accept general ideas and provide only clearly limited country-specific claims.

### B. Paid Preliminary Decision Report

Purpose: provide researched preliminary feasibility and execution guidance for the Saudi market.

The paid report should cover implementation feasibility, startup-capital range, operating requirements, licensing path to verify, risks, assumptions, evidence, and next actions before investing.

### C. Existing Business / Professional Analysis

Purpose: future mode for operators, professionals, investors, and existing-business expansion cases.

This is not included in the first paid launch. It remains part of the long-term product vision after the first paid report is validated.

## 4. User Outcome

The completed journey should help answer:

- Is there credible demand?
- Is the idea economically feasible?
- Can it be implemented on the ground?
- What approximate startup capital range is required?
- What recurring operating costs are expected?
- What location characteristics are suitable?
- What labor roles and skills are required?
- What licenses, approvals, and government procedures may apply?
- What risks and unresolved assumptions remain?
- Should the user proceed, test first, revise, or stop?
- What are the next implementation steps?

The product should convert an unclear idea into a structured decision path, not simply rate the idea.

## 5. End-To-End User Journey

1. Eligibility and ethical check  
   The system checks whether the idea is eligible, ineligible, or needs clarification before any business guidance is generated.

2. User experience/profile  
   The user identifies whether they are a beginner, limited-experience user, experienced founder/operator, investor/professional, or existing-business owner.

3. Idea and objective  
   The user describes the idea and the decision they want support with.

4. Proposed classification  
   The system proposes the business type, sector, operating model, customer model, and project stage.

5. User confirmation/correction  
   If classification confidence is not high, the user confirms or corrects the classification in plain language.

6. Adaptive interview  
   The system asks only relevant grouped questions and separates required blockers from optional refinements.

7. Information-sufficiency gate  
   The system determines whether the case is ready for a paid report, needs more user information, needs external quotation/evidence, or cannot currently be evaluated with sufficient confidence.

8. Evidence and research  
   The system separates user-provided facts, assumptions, supplier quotations, official sources, market evidence, and unresolved unknowns.

9. Analysis  
   The system runs market, economic, operational, licensing, risk, and implementation analysis according to the confirmed path.

10. Free preview  
   The user receives useful but limited diagnostic value before payment.

11. Payment decision  
   The user decides whether to purchase the BIV Preliminary Decision Report only if the information-sufficiency gate allows it.

12. Paid report  
   The user receives a structured preliminary decision report with sources, assumptions, ranges, risks, and action plan.

13. Email delivery  
   Email is requested only for saving, delivery, or purchase. Marketing consent remains separate and unselected by default.

14. Bounded follow-up support  
   The first paid launch includes one report update and two clarification questions within 7 days.

15. Report update when new evidence is added  
   New quotations, customer evidence, or owner data can update the report within the defined support boundary.

## 6. Business Classification

Business classification must remain domain-agnostic. The taxonomy includes:

- Retail
- Wholesale/import/distribution
- Field service
- Professional service
- Manufacturing/industrial
- Food and beverage
- Digital/software
- Marketplace/platform
- Healthcare
- Real estate
- Generic fallback

Classification dimensions:

- Business type
- Sector
- Operating model
- Asset intensity
- Customer model
- Project stage
- Specialist candidate
- Classification confidence

Specialist modules must be invoked by one central orchestrator. No specialist module may override or bypass the unified journey. PET/recycling remains a specialist example only, never an industrial default.

## 7. Adaptive Interview Rules

- Ask only relevant questions.
- Do not repeat known information.
- Distinguish required blockers from optional refinements.
- Let the user answer "I don't know."
- Explain why a critical question is needed.
- Keep the beginner journey simple.
- Allow the professional path to go deeper in future modes.
- Pause rather than invent figures when critical evidence is missing.
- Detect contradictions and request clarification.
- Separate customer, end user, payer, and decision-maker.
- Never turn founder questions about cost, licenses, equipment, or operations into customer-pain statements.
- Keep original answers separate from structured follow-up answers.
- Do not add new product ideas or features during execution unless they are necessary to satisfy an approved acceptance criterion.
- Record useful future ideas in a deferred backlog without interrupting the active phase.

## 8. Information-Sufficiency Gate Before Payment

Before allowing purchase, BIV must classify the case as one of:

- Ready for paid report
- Needs more user information
- Needs external quotation/evidence
- Cannot currently be evaluated with sufficient confidence

Rules:

- Do not accept payment when the report would consist mainly of unknowns.
- Tell the user exactly what is missing.
- Do not invent missing figures.
- Allow the user to return after adding the required information.
- If supplier quotations, official sources, local approval information, or market evidence are required, the system must say so before payment.
- Cases that exceed the initial report scope must be flagged, limited, repriced, or declined.

## 9. Report-Level Status

Every result or report must display one of:

- Preliminary Diagnostic: a free diagnostic view based mainly on user-provided information and visible gaps.
- Evidence-Supported Preliminary Feasibility: a paid preliminary report supported by traceable evidence, current sources, and clearly labeled assumptions.
- Needs More Evidence: a paused or limited result where critical information is missing and a reliable paid report should not yet be sold or delivered.

Do not use "complete feasibility study" or any language implying bank, government, investor, legal, engineering, tax, religious, or professional certification.

## 10. Evidence Model

Every material statement or number must be classified as one of:

- User-provided fact
- Official verified source
- Market evidence
- Quotation or supplier evidence
- Calculated estimate
- Assumption
- Unresolved unknown
- Not relevant

Every external source must include:

- Source name
- Direct URL
- Publication or access date
- Geography
- Claim supported
- Confidence
- Limitations

The system must not treat confident wording or detailed writing as proof.

## 11. Research Policy

Source priority:

1. Official government or regulator
2. Official statistics
3. Recognized industry source
4. Identifiable supplier or market quotation
5. Secondary source
6. Unsupported assumption

Research must be geography-aware and time-sensitive. Saudi Arabia is the first country pack.

The paid report must not claim capital, rent, licensing, wages, supplier pricing, market size, or regulatory requirements without current evidence and source traceability. Saudi official information must be checked for currency before report delivery.

## 12. Saudi Research Pack

The initial Saudi country pack should cover, where relevant:

- Saudi Business Center
- Ministry of Commerce
- Balady / municipal requirements
- ZATCA
- Monsha'at
- General Authority for Statistics
- Sector-specific regulators
- Identifiable market and supplier sources

Each source must record:

- Supported claim
- URL
- Geography
- Publication or access date
- Confidence
- Limitation

The system must not claim that a license, approval, cost, market size, wage, rent, supplier price, or regulatory requirement is confirmed without current supporting evidence.

## 13. Analysis Modules

| Module | Inputs | Outputs |
| --- | --- | --- |
| Market demand | Customer, problem, geography, alternatives, evidence | Demand strength, evidence gaps, validation plan |
| Customer and stakeholder analysis | End user, buyer, payer, approver, beneficiary, provider/operator | Role clarity, purchase path, stakeholder risks |
| Competition and alternatives | Current solution, competitors, substitutes, switching behavior | Differentiation strength, alternative risk |
| Business/revenue model | Revenue method, payer, pricing evidence, payment timing | Revenue clarity, monetization risk, pricing evidence need |
| Economic feasibility | Revenue assumptions, costs, capacity, margins | Preliminary viability logic, break-even readiness |
| Startup capital | Setup categories, equipment, location, inventory, working capital | Capital range only when evidence supports it |
| Recurring operating cost | Rent, payroll, utilities, software, logistics, maintenance | Operating cost range and confidence |
| Location suitability | Geography, site type, access, rent, zoning/approval path | Suitable location characteristics and blockers |
| Equipment and inventory | Tools, machinery, software stack, stock/raw materials, suppliers | Required categories, quotations needed, dependency risks |
| Labor and skills | Roles, licenses, team, shifts, operating hours | Staffing plan and skill gaps |
| Licensing and compliance | User-stated approvals, official sources, regulated contexts | Approval path to verify, not legal rulings |
| Operational capacity | Units, customers, orders, sessions, cars, visits, transactions | Capacity assumptions and bottlenecks |
| Risk and sensitivity | Demand, cost, capacity, approvals, suppliers, pricing | Top risks, sensitivities, go/no-go triggers |
| Implementation plan | Stage, readiness, missing evidence, next decision | 30/60/90-day path and immediate actions |

External/current Saudi research must come before the paid report engine is considered complete.

Correct build order:

1. Evidence model
2. Saudi research pack
3. Paid report engine

## 14. Decision Framework

Do not present a false "success probability."

Use:

- Information Readiness Score: how complete and decision-ready the available information is.
- Opportunity Attractiveness: how compelling the customer need, market opening, and differentiation appear.
- Execution Feasibility: how practical the launch and operation appear with current resources and dependencies.
- Risk Exposure: how severe unresolved blockers or downside risks are.
- Evidence Confidence: how strongly the analysis is supported by facts, sources, quotations, sales, interviews, pilots, or measured data.

Decision recommendation:

- Proceed
- Test First
- Revise
- Do Not Proceed Yet

These measures are decision-support indicators. They are not guarantees of success, profit, funding, licensing, or market acceptance.

## 15. Free Experience

Visible for free:

- Understood business type
- Information completeness
- Top three missing inputs
- Biggest risk
- Preliminary readiness indicator
- Small evidence/value sample
- Contents of the paid report

The free result must provide real value. It should help the user understand what is missing and whether the idea is worth deeper analysis, but it must not include the complete decision report.

Anonymous free diagnostic use is allowed.

## 16. Paid Report

Official paid report name:

- English: BIV Preliminary Decision Report
- Arabic: تقرير القرار الأولي للمشروع

Paid report structure:

1. Executive decision
2. Understood business model
3. Report-level status
4. Information-sufficiency summary
5. Evidence summary
6. Market/customer analysis
7. Competition and alternatives
8. Economic feasibility
9. Startup capital range
10. Operating-cost range
11. Revenue assumptions
12. Break-even scenarios when supported
13. Location requirements
14. Labor plan
15. Equipment and suppliers
16. Licenses and official procedures
17. Risks and sensitivity
18. Confirmed facts vs assumptions vs unknowns
19. 30/60/90-day action plan
20. Sources
21. Unresolved questions

Every range must include confidence and evidence classification. If the system lacks enough information, the report must say the range cannot yet be trusted.

## 17. Monetization

Initial launch model:

- Free diagnostic
- One paid preliminary decision report
- Optional bounded follow-up/update

Owner-approved launch decisions:

- Paid report market: Saudi Arabia first.
- First paid customers: beginners and limited-experience users.
- Candidate launch price: SAR 149, subject to controlled market validation before final activation.
- Included follow-up: one report update and two clarification questions within 7 days.
- Professional report: deferred until the first paid product is validated.
- Payment provider: deferred technical decision.

Professional, investor, and existing-business report paths remain future expansion modes.

## 18. Unit Economics And Profitability Requirements

BIV is a profit-seeking product. The paid report must be operationally profitable at the unit level before broader launch.

Track internal report economics:

- AI/model cost
- Search/research cost
- Manual-review time
- PDF/email cost
- Payment fee
- Storage cost
- Customer-support cost
- Report-update cost

Initial profitability target:

The variable cost of producing, reviewing, delivering, and supporting a paid report should normally remain at or below 20-25% of net collected report revenue before fixed costs and marketing.

If manual review or research exceeds the allowed cost/time budget:

- Flag the case
- Limit scope
- Request additional payment
- Decline the report

Do not expose internal cost calculations to customers unless required.

## 19. Email, Privacy, And Report Delivery

Approved direction:

- Do not require email before showing initial free value.
- Request email only for saving, purchasing, or delivering the report.
- Separate transactional report-delivery consent from marketing consent.
- Marketing consent must not be preselected.
- Treat business ideas as potentially sensitive commercial information.
- Give the user clear expectations for report delivery timing, file format, and support boundaries.

Data retention direction:

- Operational copies of idea/report data are retained for 30 days unless the user requests earlier deletion or explicitly chooses longer saving.
- Legally required transaction, invoice, tax, fraud-prevention, or accounting records may follow their separate required retention period.
- Report-delivery consent and marketing consent remain separate.
- Business ideas are treated as confidential commercial information.
- Final retention and privacy wording must be legally reviewed before paid launch.

Do not claim final legal compliance approval until legal review is complete.

## 20. Follow-Up Support

First paid launch includes:

- One report update within 7 days after the user adds supplier quotations or missing evidence
- Two clarification questions about the delivered report within 7 days

Bounded support is a product support boundary, not unlimited consulting.

New market research, new sector analysis, a materially different business idea, a professional feasibility study, or implementation support requires a new paid service or future product offering.

## 21. Internal Review For First 50 Reports

The first 50 paid reports require internal human quality review before delivery.

Internal review is a quality-control process, not unlimited consulting.

Review must check:

- Unsupported claims
- Source validity
- Arabic/English quality
- Capital and cost ranges
- Regulatory statements
- Contradictions
- Ethical eligibility
- Decision usefulness

Release rule:

A paid report cannot be delivered during the first-50-report pilot until it passes internal quality review.

## 22. Payment Readiness Conditions

Payment must not be implemented or activated until:

- The core paid report passes cross-sector QA.
- The information-sufficiency gate works.
- Saudi research sources are traceable.
- Report production cost is measurable.
- Privacy and email flows are approved.
- Delivery and refund/failure handling are defined.
- Internal review workflow is ready.

## 23. Ethical Eligibility

AI Source Hub does not evaluate, guide, or support ideas or projects that clearly conflict with Islamic principles, disrespect revealed religions, violate human dignity, safety or rights, or contradict sound public morals.

Arabic product wording:

"تلتزم AI Source Hub بعدم تقديم تقييم أو دعم لأي مشروع يتعارض بوضوح مع أحكام الشريعة الإسلامية، أو يسيء إلى الديانات السماوية، أو ينتهك الكرامة الإنسانية والسلامة والحقوق والأعراف العامة السوية."

Eligibility states:

- Eligible: continue the journey.
- Ineligible: stop normal evaluation and provide a short respectful refusal.
- Needs clarification: pause and ask for clarification without issuing a religious, legal, or regulatory ruling.

The product must not claim to issue fatwas.

## 24. Beginner Experience Example

Example idea: "Opening a neighborhood grocery store in Jeddah."

Initial inputs:

- Idea: neighborhood grocery store in Jeddah
- User profile: first-time beginner
- Stage: initial idea
- Objective: understand whether the idea is worth pursuing and what information is missing

Adaptive questions:

- Which neighborhood or customer group are you considering?
- Is the store location owned, rented, or not selected yet?
- What product categories will be sold first?
- What budget range is available?
- What do you already know about rent, suppliers, and expected daily customers?
- What information do you still need AI Source Hub to research?
- Do you know whether licenses, municipal procedures, or commercial registration steps are required?

Research required:

- Local location/rent evidence
- Official Saudi procedure sources
- Supplier or distributor availability
- Comparable customer demand signals
- Basic staffing and operating-hours assumptions

Considerations:

- Licensing/location: must be checked using official Saudi sources.
- Labor: cashier, stocking, delivery, and basic management needs must be estimated from operating hours.
- Capital: shelving, refrigeration, POS, initial inventory, rent/deposit, licenses, utilities, and working capital.

Free preview:

- Business type: retail
- Readiness: incomplete
- Top missing inputs: location, budget range, supplier/inventory plan
- Biggest risk: choosing a location before proving local demand and cost fit

Paid-report value:

- Structured capital categories
- Operating-cost ranges when evidence supports them
- Location criteria
- Supplier and inventory questions
- Licensing source checklist
- 30/60/90-day action plan

Final decision language:

"Test First. The idea may be practical, but the decision is not ready until location cost, supplier plan, licensing path, and expected customer volume are clarified. Do not commit to rent or inventory before validating the neighborhood demand and startup cost range."

Arabic example:

"اختبر أولاً. قد تكون الفكرة عملية، لكن القرار غير جاهز قبل توضيح تكلفة الموقع، وخطة الموردين، ومسار الترخيص، وحجم العملاء المتوقع. لا تلتزم بالإيجار أو المخزون قبل اختبار الطلب في الحي ونطاق تكلفة التأسيس."

## 25. Professional Experience Example

Scenario: an experienced operator evaluating a second location or expansion.

This path is deferred from the first paid launch and remains a post-validation expansion mode.

The product should ask for current operating data first:

- Current monthly revenue
- Current costs and margins
- Customer volume and repeat business
- Current capacity and staffing
- Existing bottlenecks
- Expansion objective
- Evidence from current customers or unmet demand

The report should compare:

- Current performance vs proposed expansion
- Existing capacity vs new capacity requirement
- Known costs vs expansion assumptions
- Current demand evidence vs new location uncertainty
- Approval, staffing, and supplier dependencies

Professional decision language should be concise:

"Revise before expansion. Current demand may support growth, but the second location decision depends on rent, staffing, supplier reliability, and whether demand is transferable to the new area. Validate those four items before committing capital."

## 26. Central Orchestrator Architecture

One central decision flow must control:

- Eligibility
- User profile
- Classification and confirmation
- Adaptive questions
- Information-sufficiency gate
- Specialist modules
- Research
- Evidence quality
- Analysis
- Free/paid boundary
- Report generation
- Delivery
- Follow-up

The orchestrator must return one primary route at a time. Existing specialist modules are subordinate contributors and may not decide their own route independently.

Required route types:

- validation_error
- ineligible
- needs_clarification
- guided_follow_up
- specialist_analysis
- normal_evaluation
- research_required
- free_preview
- paid_report_ready
- paid_report_blocked

Current local checkpoint note: the feasibility foundation and initial central orchestration exist locally in checkpoint commit `d5d039e78a459f9d5f4f1464bb688086539fa906`. They are not approved production behavior, must be audited against this approved v2 specification, and require cross-domain manual QA before production deployment. `origin/main` and the live website remain unchanged by that checkpoint.

## 27. Non-Goals For The First Paid Version

- No guaranteed success.
- No bank-certified feasibility study.
- No legal, tax, religious, engineering, or investment guarantee.
- No unsupported exact costs.
- No unlimited consulting.
- No automatic implementation of the business.
- No external AI research claims without source traceability.
- No hidden marketing opt-in.
- No specialist module acting as a fallback for unrelated ideas.
- No professional/investor report mode in the first paid launch.
- No existing-business expansion report in the first paid launch.

## 28. Acceptance Criteria

Product approval requires:

- Beginner path works in Arabic and English.
- Limited-experience path works in Arabic and English.
- First paid launch handles Saudi-market new business ideas.
- Professional/operator and existing-business paths are clearly deferred and do not leak into the first paid launch as unfinished promises.
- Cross-sector tests pass for at least 10 materially different ideas across retail, service, digital/software, marketplace, industrial, healthcare, food, real estate, and generic fallback.
- Saudi regulatory-source behavior uses official sources when claiming procedures.
- Saudi official information is checked for currency before report delivery.
- Evidence traceability exists for every material external claim.
- No false precision appears in capital, cost, licensing, market, wage, rent, supplier, regulatory, or profitability statements.
- The information-sufficiency gate prevents payment when the report would consist mainly of unknowns.
- Report-level status is visible: Preliminary Diagnostic, Evidence-Supported Preliminary Feasibility, or Needs More Evidence.
- Arabic reads naturally and avoids literal translated business jargon.
- English is concise, professional, and actionable.
- Ethical eligibility states work: eligible, ineligible, needs clarification.
- Free/paid boundary is clear and gives real free value.
- Email is not required before free value.
- Transactional email consent and marketing consent are separate.
- Internal review works for the first 50 paid reports.
- Report-production variable cost is measurable.
- The variable cost target is normally at or below 20-25% of net collected report revenue before fixed costs and marketing.
- Delivery and refund/failure handling are defined before payment activation.
- Report is useful enough for a real preliminary decision.
- Copy/download behavior works for reports where allowed.
- Mobile and desktop experiences work in RTL and LTR.

## 29. Current-Code Reconciliation

| Current capability | Keep | Refactor | Remove | Build new | Reason |
| --- | --- | --- | --- | --- | --- |
| Production v1.0 on `origin/main` | Yes | No | No | No | Live site remains healthy and unchanged. |
| Eligibility gate | Yes | Minor | No | No | Preserve ethical boundary and priority before guidance. |
| Scoring | Yes | Later | No | No | Useful for simple idea validation, but not enough for paid feasibility. |
| Localization/RTL | Yes | Minor | No | No | Required for Arabic/English product quality. |
| Copy/download | Yes | Later | No | No | Useful for completed reports; must not show in refusal/clarification states. |
| Stakeholder roles | Yes | Minor | No | No | Needed to separate user, buyer, payer, approver, beneficiary, and provider/operator. |
| Evidence vs assumption | Yes | Expand | No | Yes | Must become the basis for paid report confidence and source traceability. |
| Regulatory dependency | Yes | Expand | No | Yes | Must connect to official-source research without issuing rulings. |
| Industrial/PET analysis | Keep as example | Subordinate to orchestrator | No | No | PET/recycling is a specialist example only, not an industrial default. |
| Feasibility foundation | Keep local checkpoint | Significant | No | Yes | Good foundation, but not yet complete paid feasibility logic. |
| Guided flow | Keep local checkpoint | Significant | No | Yes | Should become the unified adaptive journey. |
| Current routing/classification | Keep checkpoint | Centralize and audit | Legacy bypasses | Yes | One orchestrator must control all paths. |
| Local feasibility/orchestration checkpoint `d5d039e78a459f9d5f4f1464bb688086539fa906` | Preserve | Audit against this spec | No | Later | Not approved production behavior. |
| Payment/email | No current production feature | N/A | N/A | Later | Must wait until core report value, sufficiency gate, privacy, delivery, review, and economics are ready. |
| External research | Not built | N/A | N/A | Later | Must be source-traceable, Saudi-aware, and current. |

## 30. Phased Execution Roadmap

### Phase 1 — Approve product specification and launch model

Outcome: owner-approved BIV v2 scope, first paid offer, Saudi-first launch model, free/paid boundary, and remaining owner decisions.

Acceptance criteria:

- This specification is approved.
- First paid product name and promise are accepted.
- Deferred paths are clearly marked.
- No future functionality is described as already built.

Verification:

- Owner review.
- Documentation-only diff.

### Phase 2 — Central orchestrator hardening

Outcome: one route decision layer controls eligibility, classification, guided flow, specialist modules, and normal evaluation.

Acceptance criteria:

- Exactly one primary route is selected.
- Specialist modules cannot act as fallback.
- PET/recycling remains a specialist example only.
- Eligibility and financing clarification gates retain priority.

Verification:

- Automated routing tests.
- Cross-domain manual QA.

### Phase 3 — Beginner journey and classification confirmation

Outcome: beginner and limited-experience users can confirm project type and proceed through plain-language guidance.

Acceptance criteria:

- Beginner path is clear in Arabic and English.
- Classification correction changes subsequent questions.
- No specialist terminology is required from the user.

Verification:

- Arabic/English browser QA.
- Mobile and desktop QA.

### Phase 4 — Adaptive interview and information-sufficiency gate

Outcome: BIV asks relevant questions and determines whether the case can proceed toward a paid report.

Acceptance criteria:

- User-provided facts remain separate from assumptions and unknowns.
- Required blockers are distinct from optional refinements.
- Payment is blocked when the report would mainly contain unknowns.

Verification:

- Automated sufficiency tests.
- Manual tests with weak, partial, and strong inputs.

### Phase 5 — Evidence model and Saudi research pack

Outcome: material claims are evidence-tagged and Saudi sources are traceable.

Acceptance criteria:

- Saudi Business Center, Ministry of Commerce, Balady, ZATCA, Monsha'at, General Authority for Statistics, relevant sector regulators, and identifiable market/supplier sources can be referenced where relevant.
- Each source records supported claim, URL, geography, access/publication date, confidence, and limitation.
- Current Saudi official information is checked before report delivery.

Verification:

- Source traceability tests.
- Manual source review.

### Phase 6 — Free diagnostic

Outcome: useful free preview that shows business type, completeness, top gaps, biggest risk, readiness, and paid-report contents.

Acceptance criteria:

- Free result gives real value.
- Free result does not include the complete paid decision report.
- Anonymous use works.

Verification:

- Browser QA.
- Free/paid boundary review.

### Phase 7 — Paid Preliminary Decision Report

Outcome: coherent Saudi-market preliminary report covering demand, economics, capital, location, labor, equipment, licensing, operations, risks, assumptions, sources, and actions.

Acceptance criteria:

- Report-level status is visible.
- Capital and operating ranges include confidence and evidence classification.
- Unsupported precision is blocked.

Verification:

- Cross-sector report QA.
- Arabic/English quality review.

### Phase 8 — Cross-sector testing with at least 10 materially different ideas

Outcome: product behavior is validated across diverse business types.

Acceptance criteria:

- At least 10 materially different ideas pass the expected route, interview, free preview, and report behavior.
- No sector-specific overfitting appears.

Verification:

- Automated regression matrix.
- Manual browser QA.

### Phase 9 — First-50-report human review workflow

Outcome: internal quality-control workflow is ready before paid delivery.

Acceptance criteria:

- Review checklist exists.
- Report cannot be delivered until review passes.
- Review checks unsupported claims, source validity, Arabic/English quality, capital/cost ranges, regulatory statements, contradictions, eligibility, and usefulness.

Verification:

- Internal process dry run.
- Sample report review.

### Phase 10 — Privacy, email, PDF delivery, failure and refund handling

Outcome: non-payment operational flow is ready.

Acceptance criteria:

- Email is requested only for saving, purchasing, or delivery.
- Transactional consent and marketing consent are separate.
- Retention wording is legally reviewed.
- Delivery failure and refund/failure policy are defined.

Verification:

- Legal/content review.
- Manual flow QA.

### Phase 11 — Payment integration

Outcome: payment can be activated only after readiness conditions are met.

Acceptance criteria:

- Payment provider selected.
- Payment flow does not start before sufficiency gate approval.
- Report production cost is measurable.

Verification:

- Payment sandbox QA.
- Failure-path QA.

### Phase 12 — Limited paid launch

Outcome: controlled Saudi-first paid launch.

Acceptance criteria:

- Candidate SAR 149 price is tested under controlled market validation.
- First 50 reports receive internal human review before delivery.
- Support boundaries are enforced.

Verification:

- Paid pilot monitoring.
- Customer feedback review.

### Phase 13 — Professional, existing-business, and advanced-report expansion

Outcome: deferred professional and existing-business paths are expanded only after the first paid product is validated.

Acceptance criteria:

- First paid launch metrics justify expansion.
- Professional/existing-business report requirements are separately approved.

Verification:

- Owner decision.
- New specification or addendum.

## 31. Open Owner Decisions

The following decisions remain open:

- Final activation price after validation of SAR 149.
- Exact report turnaround time.
- Final refund/failure policy.
- Payment provider.
- Final privacy/retention wording after legal review.
- Criteria for ending the first-50-report manual review.
- Whether the first paid launch is invite-only or publicly available.
