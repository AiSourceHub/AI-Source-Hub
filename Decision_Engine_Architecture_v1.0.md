# Decision Engine Architecture v1.0

## 1. Engine Overview

The Business Idea Validator decision engine evaluates one business idea and returns a structured validation report.

The engine is not an open-ended chatbot. It is a controlled decision system that takes four user inputs, processes them through a defined evaluation framework, assigns scores, detects uncertainty or contradictions, and returns one clear recommendation.

### Engine Objective

Help an entrepreneur decide whether to pursue, improve, or pause a business idea.

### Primary Output

The engine must return:

- Verdict
- Total score
- Confidence score
- Criterion score breakdown
- Biggest risk
- Contradiction warnings, when relevant
- Recommended next action
- Improved idea statement

### Required Inputs

The engine accepts four user-provided fields:

1. Business idea
2. Target customer
3. Problem being solved
4. Monetization model

### Engine Modules

The decision engine contains nine internal modules:

1. Input Processing
2. Evaluation Flow
3. Scoring Logic
4. Confidence Score Logic
5. Contradiction Detection
6. Recommendation Engine
7. Improved Idea Generator
8. Output Formatter
9. Error Handling

Each module should produce structured intermediate data that can be inspected, tested, and improved over time.

## 2. Input Processing

Input Processing prepares user submissions for evaluation.

The module should clean, normalize, classify, and validate the four required fields before scoring begins.

### Input Fields

| Field | Required | Purpose |
| --- | --- | --- |
| Business idea | Yes | Describes what the user wants to build or sell. |
| Target customer | Yes | Describes who the idea is for. |
| Problem being solved | Yes | Describes the customer pain, need, or frustration. |
| Monetization model | Yes | Describes how the business will make money. |

### Accepted Input Quality

The engine should accept imperfect input.

Examples of acceptable imperfect input:

- "Not sure"
- Short phrases
- Vague customer descriptions
- Incomplete monetization ideas
- Early draft business ideas

The engine should not reject weak input unless the submission is empty or unusable.

### Processing Steps

1. Trim unnecessary whitespace.
2. Normalize repeated spaces and line breaks.
3. Detect empty fields.
4. Detect "not sure" or equivalent uncertainty phrases.
5. Detect extremely broad phrases such as "everyone", "all people", or "any business".
6. Extract key entities from each field:
   - Product or service
   - Customer segment
   - Problem or pain
   - Revenue model
7. Pass normalized data to the Evaluation Flow.

### Input Quality Flags

The module should create flags used by later modules.

| Flag | Meaning |
| --- | --- |
| missing_business_idea | Business idea is empty or unusable. |
| missing_customer | Target customer is empty or unusable. |
| missing_problem | Problem field is empty or unusable. |
| missing_monetization | Monetization field is empty or unusable. |
| uncertain_customer | User indicates they are not sure who the customer is. |
| uncertain_problem | User indicates they are not sure what problem is solved. |
| uncertain_monetization | User indicates they are not sure how money will be made. |
| broad_customer | Target customer is too broad to evaluate strongly. |
| vague_problem | Problem is generic, weak, or unclear. |
| vague_business_idea | Business idea is too abstract or feature-only. |

### Processing Output

Input Processing should return:

- Normalized input values
- Extracted business elements
- Input quality flags
- Missing field status
- Initial confidence impact

## 3. Evaluation Flow

The Evaluation Flow coordinates the full decision process.

It should run modules in a predictable order so results are consistent and easy to test.

### Flow Sequence

1. Receive raw user inputs.
2. Run Input Processing.
3. If required data is unusable, send to Error Handling.
4. Run Contradiction Detection.
5. Score each evaluation criterion.
6. Calculate total score.
7. Calculate confidence score.
8. Identify weakest criterion.
9. Generate verdict.
10. Generate recommendation.
11. Generate improved idea statement.
12. Format final output report.

### Evaluation Criteria

The engine evaluates five criteria:

1. Problem Clarity
2. Customer Clarity
3. Pain Level
4. Monetization
5. Differentiation

Each criterion is scored from 0 to 20.

### Evaluation Requirements

The flow must:

- Score all five criteria when enough information exists.
- Penalize vague or missing information.
- Avoid inventing external market facts.
- Use contradiction warnings to reduce confidence.
- Produce a result even when the idea is weak.
- Return one clear verdict and one best next action.

## 4. Scoring Logic

Scoring Logic assigns a score from 0 to 20 for each criterion.

The total validation score is the sum of all five criterion scores.

Maximum score: 100.

### Criterion Score Bands

| Score Range | Meaning |
| --- | --- |
| 0-5 | Very weak or missing |
| 6-10 | Weak, vague, or unproven |
| 11-15 | Moderate, usable, but needs improvement |
| 16-20 | Strong and clearly expressed |

### Problem Clarity Scoring

Question: Is the problem specific, understandable, and connected to the idea?

High score indicators:

- Specific problem is named.
- Problem is easy to understand.
- Problem connects directly to the idea.
- Problem is stated from the customer's perspective.

Score guidance:

- 0-5: No clear problem or "not sure".
- 6-10: Generic problem with little detail.
- 11-15: Understandable problem but still broad.
- 16-20: Specific, clear, customer-relevant problem.

### Customer Clarity Scoring

Question: Is the target customer clearly defined?

High score indicators:

- Customer segment is specific.
- Customer can be identified or reached.
- Customer has a clear relationship to the problem.
- Customer is narrower than a general population.

Score guidance:

- 0-5: No customer or "not sure".
- 6-10: Very broad customer such as "everyone".
- 11-15: Reasonable customer group but still broad.
- 16-20: Specific customer segment with clear context.

### Pain Level Scoring

Question: Is the problem urgent, frequent, costly, risky, or frustrating enough to motivate action?

High score indicators:

- Problem costs time, money, revenue, reputation, health, or opportunity.
- Problem happens repeatedly.
- Customer likely wants a solution soon.
- Problem creates clear business or personal consequences.

Score guidance:

- 0-5: No evidence of meaningful pain.
- 6-10: Mild inconvenience or unclear urgency.
- 11-15: Plausible pain but not strongly proven.
- 16-20: Clear, recurring, expensive, or urgent pain.

### Monetization Scoring

Question: Is there a believable way to make money?

High score indicators:

- Revenue model is named.
- Buyer is clear.
- Revenue model fits the customer and problem.
- Payment behavior is plausible based on the user's own input.

Score guidance:

- 0-5: No monetization or "not sure".
- 6-10: Unclear or weak revenue model.
- 11-15: Plausible revenue model but needs detail.
- 16-20: Clear, simple, believable revenue model.

### Differentiation Scoring

Question: Is there a reason this idea could stand out or be chosen over alternatives?

High score indicators:

- Clear niche or specialized user.
- Specific speed, ease, cost, quality, convenience, or expertise advantage.
- Product is tailored to a defined customer.
- Idea has a distinct angle without relying on unsupported claims.

Score guidance:

- 0-5: No differentiation visible.
- 6-10: Generic idea with weak positioning.
- 11-15: Some angle, but not strong enough yet.
- 16-20: Clear, believable reason to choose this solution.

### Total Score Logic

The total score is:

Problem Clarity + Customer Clarity + Pain Level + Monetization + Differentiation.

### Verdict Logic

| Total Score | Verdict |
| --- | --- |
| 75-100 | Pursue |
| 50-74 | Improve |
| 0-49 | Pause |

### Score Explanation Requirements

For each criterion, the engine should provide:

- Score out of 20
- One short reason
- Optional flag if the score was reduced by missing, vague, or contradictory input

## 5. Confidence Score Logic

The confidence score measures how reliable the engine's evaluation is based on input quality and internal consistency.

The confidence score is different from the validation score.

Validation score answers:

"How strong is this business idea based on the framework?"

Confidence score answers:

"How much should the user trust this evaluation based on the information provided?"

### Confidence Score Range

Confidence is scored from 0 to 100.

### Confidence Bands

| Score Range | Label | Meaning |
| --- | --- | --- |
| 80-100 | High | Inputs are clear and consistent enough for a reliable evaluation. |
| 50-79 | Medium | Evaluation is useful, but some inputs are vague, incomplete, or uncertain. |
| 0-49 | Low | Evaluation is directional only because key information is missing or contradictory. |

### Base Confidence

Start with base confidence of 100.

Apply deductions for uncertainty, vagueness, missing information, and contradictions.

### Confidence Deductions

| Condition | Deduction |
| --- | --- |
| Business idea is vague | -10 |
| Target customer is broad | -15 |
| Target customer is "not sure" | -20 |
| Problem is vague | -15 |
| Problem is "not sure" | -20 |
| Monetization is "not sure" | -15 |
| Monetization is vague | -10 |
| One contradiction detected | -10 |
| Multiple contradictions detected | -20 |
| Input is too short to evaluate deeply | -10 |

### Confidence Floor

If the engine produces a report, confidence should not fall below 20 unless the input is almost entirely unusable.

If the input is unusable, the engine should not produce a normal validation report and should instead return an error or recovery prompt.

### Confidence Output

The final report should include:

- Confidence score
- Confidence label
- One short reason for confidence level

Example:

"Confidence: Medium, 64/100. The idea is understandable, but the customer and monetization details are still vague."

## 6. Contradiction Detection

Contradiction Detection identifies conflicts between user inputs that reduce trust in the evaluation.

Contradictions should not automatically block the report. They should reduce confidence and appear as warnings when they materially affect the recommendation.

### Contradiction Types

| Type | Description | Example |
| --- | --- | --- |
| Customer-problem mismatch | Target customer does not appear to experience the stated problem. | Customer is "students", problem is "enterprise payroll compliance". |
| Idea-problem mismatch | Business idea does not solve the stated problem. | Idea is a fitness app, problem is invoice collection. |
| Monetization-customer mismatch | Revenue model does not fit the target customer. | Customer is low-income students, monetization is high-ticket consulting. |
| Buyer-user mismatch | User benefits but another party must pay, and payer is not explained. | Product helps employees, but employer payment is assumed without explanation. |
| Scope mismatch | Idea is too broad compared with the target customer or problem. | "All-in-one platform for every small business problem." |
| Claim without support | Input makes a strong factual claim without evidence. | "No competitors exist" or "everyone will pay for this." |

### Detection Rules

The module should compare:

- Business idea vs. problem
- Target customer vs. problem
- Target customer vs. monetization model
- User vs. buyer
- Stated scope vs. product focus
- Strong claims vs. available evidence

### Contradiction Severity

| Severity | Meaning | Engine Action |
| --- | --- | --- |
| Low | Minor inconsistency or wording issue. | Reduce confidence slightly; no major warning required. |
| Medium | Meaningful mismatch that may affect scoring. | Reduce confidence and include warning. |
| High | Core idea conflict that affects verdict reliability. | Reduce confidence, include warning, and make recommendation address the conflict. |

### Contradiction Output

Each contradiction should include:

- Type
- Severity
- Short explanation
- Suggested correction

Example:

"Customer-problem mismatch: The target customer is students, but the problem describes payroll compliance. Clarify who has the problem before evaluating the idea further."

## 7. Recommendation Engine

The Recommendation Engine converts scores, confidence, and contradictions into one best next action.

The engine must not provide a long list of recommendations.

### Inputs To Recommendation Engine

- Total validation score
- Verdict
- Confidence score
- Lowest-scoring criterion
- Contradiction warnings
- Input quality flags

### Weakest Criterion Selection

Select the criterion with the lowest score.

If multiple criteria tie, use this priority order:

1. Problem Clarity
2. Customer Clarity
3. Pain Level
4. Monetization
5. Differentiation

This priority reflects dependency: a weak problem or unclear customer makes all other analysis less reliable.

### Recommendation Priority

The recommendation should be selected in this order:

1. Resolve high-severity contradiction.
2. Fix missing or uncertain problem.
3. Fix missing or broad customer.
4. Address the lowest-scoring criterion.
5. If the idea scores high with high confidence, recommend customer validation.

### Recommendation Mapping

| Weakest Criterion | Recommended Next Action |
| --- | --- |
| Problem Clarity | Rewrite the idea around one specific customer problem. |
| Customer Clarity | Narrow the target customer to one specific segment. |
| Pain Level | Talk to potential customers to confirm the problem is urgent or costly. |
| Monetization | Choose one simple revenue model and identify who pays. |
| Differentiation | Define why this solution is faster, easier, cheaper, more specialized, or more convenient. |

### Verdict-Specific Behavior

For Pursue:

- Recommend a small validation action.
- Do not tell the user to fully build the product.
- Example: "Interview five target customers before building."

For Improve:

- Recommend fixing the weakest part of the idea.
- Example: "Narrow the customer segment before testing demand."

For Pause:

- Recommend clarifying the foundation before investing more.
- Example: "Rewrite the idea around one clear customer and one painful problem."

### Recommendation Output

The recommendation must include:

- One action
- Why this action matters
- Optional success check

Example:

"Next Action: Narrow the target customer to one specific segment. This matters because the current customer group is too broad to validate or position clearly. Success check: you can name exactly who has the problem and where to find them."

## 8. Improved Idea Generator

The Improved Idea Generator rewrites the user's idea into one clearer sentence.

It should clarify the idea without inventing unsupported facts.

### Purpose

Help the user see a stronger version of the idea based on the available input.

### Required Structure

The improved idea should follow this structure:

"A [product or service] for [specific customer] who need help with [specific problem], offered through [revenue model or delivery approach]."

### Generation Rules

The generator should:

- Use the user's original wording where useful.
- Make vague phrasing more specific when supported by the input.
- Keep the sentence short.
- Avoid unsupported claims about market size, competitors, or demand.
- Avoid adding features not implied by the user.
- Avoid making the idea sound stronger than the evidence supports.

### Handling Missing Information

If customer is missing or uncertain:

- Use "a clearly defined customer segment" as a placeholder.

If problem is missing or uncertain:

- Use "a specific customer problem" as a placeholder.

If monetization is missing or uncertain:

- Use "a simple revenue model that still needs to be chosen" as the ending.

### Example

Input:

- Business idea: "AI tool for restaurants"
- Target customer: "small restaurants"
- Problem: "not sure"
- Monetization: "monthly subscription"

Improved idea:

"An AI tool for small restaurants that helps solve a specific operational problem, offered through a monthly subscription."

## 9. Output Formatter

The Output Formatter converts engine results into a clean report for the user interface.

The formatter should prioritize readability, decision clarity, and short sections.

### Required Report Structure

1. Verdict
2. Total Score
3. Confidence Score
4. Score Breakdown
5. Biggest Risk
6. Contradiction Warnings, when present
7. Recommended Next Action
8. Improved Idea Statement

### Formatting Rules

The report should:

- Show the verdict first.
- Show total score near the verdict.
- Show confidence separately from validation score.
- Use short labels.
- Use tables or compact rows for score breakdown.
- Keep each reason to one sentence.
- End with the recommended next action or improved idea.

### Score Breakdown Format

Each criterion row should include:

- Criterion name
- Score out of 20
- Short reason

Example:

| Criterion | Score | Reason |
| --- | --- | --- |
| Customer Clarity | 8/20 | The customer is broad, so the idea is difficult to target. |

### Warning Display

Contradiction warnings should appear only when relevant.

Warnings should be direct but not alarming.

Example:

"Warning: The target customer may not match the problem. Clarify who actually experiences this pain before testing the idea."

### Copyable Summary

The formatter should support a compact copyable summary containing:

- Verdict
- Total score
- Confidence
- Biggest risk
- Next action
- Improved idea

## 10. Error Handling

Error Handling manages cases where the engine cannot produce a useful report or where input quality is too low.

The engine should avoid blocking users unless necessary.

### Recoverable Input Issues

These should not stop evaluation:

- "Not sure" in one or more fields
- Vague target customer
- Weak monetization model
- Generic problem statement
- Short but understandable business idea
- Contradictions that can be explained

Action:

- Continue evaluation.
- Reduce scores where appropriate.
- Reduce confidence.
- Include a short reason in the report.

### Blocking Input Issues

These may stop normal evaluation:

- All fields are empty.
- Business idea is empty and no product or service can be inferred.
- Input is unrelated to business ideas.
- Input is abusive, spam, or impossible to evaluate.
- Input contains only random characters.

Action:

- Do not produce a normal validation report.
- Return a short recovery message.
- Ask for the minimum missing information only.

### Recovery Message Rules

Recovery messages should:

- Be short.
- Ask for one clear correction.
- Avoid long explanations.
- Preserve the product's simple experience.

Example:

"I need at least a basic business idea to validate. Add one sentence describing what you want to build or sell."

### Error Types

| Error Type | Meaning | User-Facing Response |
| --- | --- | --- |
| empty_submission | No usable input provided. | Ask user to enter a basic business idea. |
| missing_core_idea | Business idea is missing. | Ask for one sentence describing the idea. |
| non_business_input | Submission is not a business idea. | Ask user to enter a business idea, offer, product, or service. |
| unusable_text | Text cannot be interpreted. | Ask user to rewrite the idea in plain language. |
| system_failure | Engine or model failed to return a result. | Ask user to try again. |

### System Failure Handling

If the engine fails internally:

- Do not show technical details.
- Preserve user input if possible.
- Provide a retry option.
- Log the failure for review.

User-facing message:

"The validation could not be completed. Please try again."

