# Business Idea Validator Specification v1.0

## 1. Product Purpose

Business Idea Validator is a focused AI product that helps entrepreneurs evaluate whether a business idea is worth pursuing, improving, or pausing.

The product exists to solve one problem: entrepreneurs often spend too much time developing ideas before checking whether the idea has a clear customer, a real problem, a believable revenue path, and a reason to exist in the market.

The product must help the user reach a practical decision within 10 minutes.

### Primary Goal

Help the user quickly understand the strength of a business idea and identify the most important next action.

### Product Promise

In a few minutes, the user enters a business idea and receives:

- A clear verdict
- A total validation score
- A simple score breakdown
- The biggest risk
- One recommended next action
- A stronger version of the idea

### Product Principles

- Solve one problem only: validate one business idea.
- Keep the experience usable within 2 minutes.
- Avoid unnecessary questions.
- Prioritize decisions over explanations.
- Make every output practical and measurable.
- Keep the MVP narrow and useful.

## 2. Target User

### Primary User

Early-stage entrepreneurs who have a business idea and need a fast, practical reality check before investing more time, money, or effort.

### Secondary Users

- Solo founders testing new ideas
- Freelancers considering productized services
- Small business owners exploring a new offer
- Students or first-time founders learning how to evaluate ideas
- Startup coaches who want a quick first-pass validation tool

### User Characteristics

The target user may:

- Have limited business planning experience
- Be excited about an idea but unsure if it is viable
- Need direct feedback, not a long business plan
- Prefer simple guidance over complex strategy frameworks
- Want to know what to do next

### User Success Definition

The user succeeds when they can answer:

- Is this idea worth pursuing right now?
- What is the weakest part of the idea?
- What should I do next?

## 3. User Journey

### Journey Overview

The product should follow a short, linear journey from idea input to validation result.

1. User opens the product.
2. User enters basic information about one business idea.
3. User submits the idea for validation.
4. Product evaluates the idea using the defined framework.
5. Product returns a concise validation report.
6. User leaves with a verdict and one next action.

### Step 1: Start

The first screen should immediately show the idea validation form.

The user should not be required to:

- Create an account
- Complete onboarding
- Read instructions
- Choose a template
- Answer advanced business questions

### Step 2: Input

The user enters four required inputs:

1. Business idea
2. Target customer
3. Problem being solved
4. How the business will make money

The product should allow the user to write "not sure" when they do not know an answer.

### Step 3: Submit

The user selects one primary action: "Validate Idea".

The product should then generate the validation report.

### Step 4: Result

The result should be displayed as a short report with a clear verdict.

The report should make the decision obvious without requiring the user to interpret a long explanation.

### Step 5: Next Action

The report should end with one recommended next action.

The next action must be specific, practical, and tied to the weakest part of the idea.

## 4. Inputs Required From The User

The MVP requires only four inputs.

### Input 1: Business Idea

Purpose: understand what the user wants to build or sell.

Expected format: one to three sentences.

Example:

"A subscription meal planning app for busy professionals who want healthy dinners without spending time planning recipes."

Validation requirement:

- Must not be empty.
- If vague, the evaluation should lower relevant scores rather than block the user.

### Input 2: Target Customer

Purpose: understand who the idea is for.

Expected format: a specific customer segment.

Example:

"Busy professionals aged 25-40 who work long hours and want healthier meals."

Validation requirement:

- Must not be empty.
- "Everyone" should be treated as weak customer clarity.
- "Not sure" should be accepted but scored low.

### Input 3: Problem Being Solved

Purpose: understand the pain, need, or frustration the idea addresses.

Expected format: one clear problem statement.

Example:

"They do not have time to plan healthy dinners during the workweek."

Validation requirement:

- Must not be empty.
- Generic problems should receive lower problem clarity and pain scores.
- "Not sure" should be accepted but scored low.

### Input 4: Monetization

Purpose: understand how the business could make money.

Expected format: a simple revenue model.

Example:

"Monthly subscription, with a free trial and premium meal plans."

Validation requirement:

- Must not be empty.
- "Not sure" should be accepted but scored low.
- The product should not require detailed pricing, financial projections, or unit economics in v1.0.

## 5. Evaluation Framework

The product evaluates each idea using five criteria.

Each criterion is scored from 0 to 20 points.

Total possible score: 100 points.

### Criterion 1: Problem Clarity

Question: Is the problem specific, understandable, and clearly connected to the idea?

High score indicators:

- The problem is specific.
- The problem is easy to understand.
- The problem directly connects to the proposed idea.

Low score indicators:

- The problem is vague.
- The idea describes a feature but not a real problem.
- The user is unsure what problem is being solved.

### Criterion 2: Customer Clarity

Question: Is the target customer clearly defined?

High score indicators:

- The customer segment is specific.
- The user describes a recognizable group.
- The customer has a clear relationship to the problem.

Low score indicators:

- The customer is "everyone".
- The customer is too broad.
- The target user does not clearly experience the stated problem.

### Criterion 3: Pain Level

Question: Is the problem urgent, frequent, expensive, risky, or frustrating enough that the customer may act?

High score indicators:

- The problem happens often.
- The problem costs time, money, or opportunity.
- The customer likely wants a solution soon.

Low score indicators:

- The problem is mildly inconvenient.
- The customer may not care enough to pay or change behavior.
- The pain is unclear or unproven.

### Criterion 4: Monetization

Question: Is there a believable way for the idea to make money?

High score indicators:

- The revenue model is simple and plausible.
- The target customer appears able or willing to pay.
- The business model matches the problem and customer.

Low score indicators:

- No revenue model is stated.
- The revenue model is unclear or unrealistic.
- There is no clear buyer.

### Criterion 5: Differentiation

Question: Is there a reason this idea could stand out or be chosen over alternatives?

High score indicators:

- The idea has a clear angle, niche, speed advantage, cost advantage, convenience advantage, or specialized customer focus.
- The solution is meaningfully tailored to the target customer.
- The idea is not just a generic version of an existing product.

Low score indicators:

- The idea sounds generic.
- No advantage or positioning is clear.
- The product does not explain why customers would choose it.

## 6. Scoring System

### Score Range

Each criterion is scored from 0 to 20.

Total score is calculated as:

Problem Clarity + Customer Clarity + Pain Level + Monetization + Differentiation = Total Score

Maximum total score: 100

### Criterion Score Guidance

| Score Range | Meaning |
| --- | --- |
| 0-5 | Very weak or missing |
| 6-10 | Weak, vague, or unproven |
| 11-15 | Moderate, usable, but needs improvement |
| 16-20 | Strong and clearly expressed |

### Total Score Bands

| Total Score | Verdict | Meaning |
| --- | --- | --- |
| 75-100 | Pursue | The idea has enough clarity and potential to justify the next validation step. |
| 50-74 | Improve | The idea has potential but needs refinement before serious investment. |
| 0-49 | Pause | The idea is currently too unclear, weak, or risky to move forward without major changes. |

### Scoring Requirements

The scoring must:

- Be consistent across ideas.
- Penalize vague answers.
- Accept incomplete answers without blocking the user.
- Explain only the most important scoring reason per criterion.
- Avoid long educational explanations.

## 7. Recommendation Logic

The product must produce one primary recommendation based on the total score and the weakest criterion.

### Verdict Logic

If total score is 75-100:

- Verdict: Pursue
- Recommendation style: move to next validation step.
- Output should encourage testing with real customers, not full-scale building.

If total score is 50-74:

- Verdict: Improve
- Recommendation style: refine the weakest part of the idea.
- Output should identify the biggest gap and suggest a focused improvement.

If total score is 0-49:

- Verdict: Pause
- Recommendation style: do not invest significant time or money yet.
- Output should recommend clarifying the idea before continuing.

### Weakest Criterion Logic

The product should identify the lowest-scoring criterion as the biggest risk.

If multiple criteria have the same lowest score, priority should be:

1. Problem Clarity
2. Customer Clarity
3. Pain Level
4. Monetization
5. Differentiation

This priority exists because unclear problems and unclear customers make all other validation less reliable.

### Next Action Logic

The next action should map to the weakest criterion.

| Weakest Criterion | Recommended Next Action |
| --- | --- |
| Problem Clarity | Rewrite the idea as one specific problem for one specific customer. |
| Customer Clarity | Narrow the target customer to a specific group with a shared need. |
| Pain Level | Speak with potential customers to confirm whether the problem is urgent or costly. |
| Monetization | Choose one simple revenue model and identify who pays. |
| Differentiation | Define why this idea is faster, easier, cheaper, more specialized, or more convenient than alternatives. |

### Improved Idea Logic

The product should generate a one-sentence improved idea using this structure:

"A [product or service] for [specific customer] who need help with [specific problem], offered through [revenue model or delivery approach]."

The improved idea should use the user's original input where possible and clarify vague parts without inventing unsupported claims.

## 8. Output Report Structure

The output report should be compact, clear, and decision-focused.

### Required Report Sections

1. Verdict
2. Total Score
3. Score Breakdown
4. Biggest Risk
5. Recommended Next Action
6. Improved Idea Statement

### Section 1: Verdict

Display one of:

- Pursue
- Improve
- Pause

The verdict should be visually prominent.

### Section 2: Total Score

Display the total score out of 100.

Example:

"Total Score: 68/100"

### Section 3: Score Breakdown

Display all five criteria with their individual scores.

Each criterion should include:

- Criterion name
- Score out of 20
- One short reason

Example:

| Criterion | Score | Reason |
| --- | --- | --- |
| Problem Clarity | 14/20 | The problem is understandable but could be more specific. |

### Section 4: Biggest Risk

Identify the weakest part of the idea.

Example:

"Biggest Risk: The target customer is too broad, which makes the offer difficult to position."

### Section 5: Recommended Next Action

Provide one action only.

The action should be practical and immediately useful.

Example:

"Narrow the target customer to one specific segment and rewrite the idea for that group."

### Section 6: Improved Idea Statement

Provide a clearer one-sentence version of the business idea.

Example:

"A subscription meal planning tool for busy professionals who want healthy dinners during the workweek, offered through monthly paid plans."

### Output Constraints

The report should not include:

- Long business lessons
- Market-size claims
- Unsupported competitor claims
- Full business plans
- Financial projections
- Multiple next actions
- Generic motivational language

## 9. MVP Scope

### Included In MVP

The MVP includes:

- Single-page product experience
- Four required input fields
- One primary action: "Validate Idea"
- AI-generated validation report
- Five-part scorecard
- Total score
- Verdict
- Biggest risk
- One recommended next action
- One-sentence improved idea
- Copyable report summary

### Excluded From MVP

The MVP does not include:

- User accounts
- Saved projects
- Payment flow
- Market research
- Competitor analysis
- Financial projections
- Pitch deck generation
- Business plan generation
- Multi-idea comparison
- Collaboration features
- Advanced onboarding
- Long-form education content

### MVP Acceptance Criteria

The MVP is successful if:

- A first-time user can understand what to do without instructions.
- The user can complete the input form in under 2 minutes.
- The user receives a validation report in under 10 minutes.
- The report clearly shows a verdict and score.
- The report identifies one biggest risk.
- The report recommends one next action.
- The product stays focused on validating one business idea only.

## 10. Future Versions

Future versions should expand only after the MVP proves that users value fast idea validation.

### Version 1.1: Better Report Utility

Potential additions:

- Export report as PDF
- Save report locally
- Copy individual sections
- Cleaner visual scorecard
- Shorter mobile-friendly report layout

### Version 1.2: Guided Improvement

Potential additions:

- Rewrite weak inputs
- Suggest narrower customer segments
- Suggest stronger problem statements
- Generate three improved idea variations
- Let the user re-score after edits

### Version 1.3: Customer Validation Support

Potential additions:

- Generate customer interview questions
- Create a simple validation survey
- Suggest where to find first customers
- Track interview feedback manually

### Version 1.4: Market And Competitor Layer

Potential additions:

- Lightweight competitor discovery
- Basic market signals
- Alternative positioning suggestions
- Differentiation comparison

This version should be added only if it does not slow down the core validation experience.

### Version 2.0: Idea Validation Workspace

Potential additions:

- User accounts
- Saved ideas
- Side-by-side idea comparison
- Validation history
- Team collaboration
- Progress tracking from idea to first customer test

Version 2.0 should remain focused on practical validation decisions, not general business planning.

