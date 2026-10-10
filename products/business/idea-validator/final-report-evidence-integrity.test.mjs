import assert from "node:assert/strict";
import { executeValidation } from "./index.js";
import { buildBusinessIdeaReportText } from "./report.js";
import productConfig from "./config.js";
import contentAr from "./content.ar.js";
import contentEn from "./content.en.js";
import { interpretEvidenceSignals } from "./evidenceSignals.js";

const feasibilityAnswers = {
  userExperienceLevel: "limited_experience",
  firstProject: "no",
  projectStageIntent: "existing_project",
  country: "Saudi Arabia",
  city: "Riyadh",
  decisionObjective: "Review the current evidence before further investment.",
  classificationConfirmation: "confirm",
};

const coordinatedNegationCases = [
  {
    id: "english coordinated negatives",
    language: "en",
    businessIdea: "There are no recurring subscriptions, verified retention data, or active users.",
  },
  {
    id: "arabic coordinated negatives",
    language: "ar",
    businessIdea: "لا توجد اشتراكات متكررة أو بيانات احتفاظ مؤكدة أو مستخدمون نشطون.",
  },
];

for (const testCase of coordinatedNegationCases) {
  const evidence = interpretEvidenceSignals({ businessIdea: testCase.businessIdea }, testCase.language);
  assert.equal(evidence.hasObservedUsageEvidence, false, `${testCase.id}: shared negation remains in scope`);
  assert.equal(evidence.reportedEvidence, null, `${testCase.id}: no owner evidence is fabricated`);
}

const laterAffirmativeCases = [
  {
    id: "english later interviews",
    language: "en",
    businessIdea: "We have not completed 3 customer interviews, but completed 8 customer interviews.",
    type: "completed_customer_interviews",
    expected: { count: 8 },
  },
  {
    id: "english later paid trial",
    language: "en",
    businessIdea: "We do not have one paid trial, but completed one paid one-month trial.",
    type: "completed_paid_trial",
    expected: { count: 1, durationMonths: 1 },
  },
  {
    id: "arabic later paid trial",
    language: "ar",
    businessIdea: "ليس لدينا تجربة مدفوعة واحدة، لكن لدينا تجربة مدفوعة واحدة لمدة شهر واحد.",
    type: "completed_paid_trial",
    expected: { count: 1, durationMonths: 1 },
  },
  {
    id: "arabic later payment",
    language: "ar",
    businessIdea: "لم نستلم 50 ريال، لكن استلمنا 199 ريال فعلياً.",
    type: "payment_received",
    expected: { amount: 199, currency: "SAR" },
  },
];

for (const testCase of laterAffirmativeCases) {
  const evidence = interpretEvidenceSignals({ businessIdea: testCase.businessIdea }, testCase.language);
  const fact = evidence.reportedEvidence?.facts.find((item) => item.type === testCase.type);
  assert.deepEqual(
    fact && Object.fromEntries(Object.keys(testCase.expected).map((key) => [key, fact[key]])),
    testCase.expected,
    `${testCase.id}: later affirmative match survives earlier negation`
  );
}

const cases = [
  {
    id: "case_a_en",
    language: "en",
    input: {
      businessIdea: "Restaurant inventory SaaS. We have not completed interviews or a paid trial and have received no payments. We plan to conduct 8 interviews and expect to receive SAR 199 from a future trial.",
      targetCustomer: "Independent restaurant owners",
      problem: "Inventory errors may cause waste, but this is still a hypothesis.",
      monetization: "A proposed SAR 199 monthly subscription; there is no revenue yet.",
      stage: "idea",
    },
    mustNotInclude: [/Owner-reported evidence:/i, /owner reported completing/i, /owner reported actually receiving/i],
  },
  {
    id: "case_a_ar",
    language: "ar",
    input: {
      businessIdea: "خدمة لإدارة مخزون المطاعم. لم ننجز مقابلات أو تجربة مدفوعة ولم نستلم أي مدفوعات. نخطط لإجراء 8 مقابلات ونتوقع استلام 199 ريال من تجربة مستقبلية.",
      targetCustomer: "أصحاب المطاعم المستقلة",
      problem: "قد تسبب أخطاء المخزون هدراً، لكن ذلك ما زال افتراضاً.",
      monetization: "اشتراك شهري مقترح بقيمة 199 ريال، ولا توجد إيرادات حتى الآن.",
      stage: "idea",
    },
    mustNotInclude: [/أدلة أفاد بها المالك:/u, /أفاد المالك بإكمال/u, /أفاد المالك باستلام/u],
  },
  {
    id: "case_b_en",
    language: "en",
    input: {
      businessIdea: "Restaurant inventory SaaS. We completed 8 customer interviews and completed one paid one-month trial. We actually received SAR 199. There are no recurring subscriptions, verified retention data, or active users.",
      targetCustomer: "Independent restaurant owners",
      problem: "Restaurant owners reported recurring inventory errors and waste.",
      monetization: "A proposed monthly subscription; only SAR 199 from one paid trial has actually been received.",
      stage: "mvp",
    },
    mustInclude: [
      "The owner reported completing 8 customer interviews.",
      "The owner reported one paid one-month trial.",
      "The owner reported actually receiving SAR 199.",
      "not independently verified evidence",
      "do not establish recurring subscriptions, retention, or active usage",
    ],
    expectEvidenceSection: true,
    verifyTrialBoundary: true,
  },
  {
    id: "case_b_ar",
    language: "ar",
    input: {
      businessIdea: "تطبيق لإدارة مخزون المطاعم. أنجزنا 8 مقابلات مع عملاء، ولدينا تجربة مدفوعة واحدة لمدة شهر استلمنا عنها 199 ريال فعلياً. لا توجد اشتراكات متكررة أو بيانات احتفاظ مؤكدة أو مستخدمون نشطون.",
      targetCustomer: "أصحاب المطاعم المستقلة",
      problem: "أفاد أصحاب المطاعم بوجود أخطاء متكررة في المخزون وهدر.",
      monetization: "اشتراك شهري مقترح؛ لم نستلم سوى 199 ريال من تجربة مدفوعة واحدة.",
      stage: "mvp",
    },
    mustInclude: [
      "أفاد المالك بإكمال 8 مقابلات مع عملاء.",
      "أفاد المالك بوجود تجربة مدفوعة واحدة لمدة شهر واحد.",
      "أفاد المالك باستلام 199 ريال سعودي فعلياً.",
      "ليست أدلة متحققاً منها بصورة مستقلة",
      "لا تثبت اشتراكات متكررة أو احتفاظاً أو استخداماً نشطاً",
    ],
    expectEvidenceSection: true,
    verifyTrialBoundary: true,
  },
  {
    id: "case_b_corrected_en",
    language: "en",
    input: {
      businessIdea: "Restaurant inventory SaaS. We completed 8 customer interviews, but completed 5 customer interviews after excluding duplicates. We completed 2 paid trials, but completed one paid one-month trial after excluding an unpaid test. We received SAR 199, but actually received SAR 99 after a refund. There are no recurring subscriptions, verified retention data, or active users.",
      targetCustomer: "Independent restaurant owners",
      problem: "Restaurant owners reported recurring inventory errors and waste.",
      monetization: "A proposed monthly subscription; the corrected received amount is SAR 99.",
      stage: "mvp",
    },
    mustInclude: [
      "The owner reported completing 5 customer interviews.",
      "The owner reported one paid one-month trial.",
      "The owner reported actually receiving SAR 99.",
    ],
    mustNotInclude: [
      /owner reported completing 8 customer interviews/i,
      /owner reported 2 paid trials/i,
      /owner reported actually receiving SAR 199/i,
    ],
    expectEvidenceSection: true,
    verifyTrialBoundary: true,
  },
  {
    id: "case_b_corrected_ar",
    language: "ar",
    input: {
      businessIdea: "تطبيق لإدارة مخزون المطاعم. أجرينا 8 مقابلات، لكن أجرينا 5 مقابلات بعد استبعاد التكرار. أجرينا 2 تجارب مدفوعة، لكن أجرينا تجربة مدفوعة واحدة لمدة شهر واحد بعد استبعاد تجربة غير مدفوعة. استلمنا 199 ريال، لكن استلمنا 99 ريال فعلياً بعد الاسترداد. لا توجد اشتراكات متكررة أو بيانات احتفاظ مؤكدة أو مستخدمون نشطون.",
      targetCustomer: "أصحاب المطاعم المستقلة",
      problem: "أفاد أصحاب المطاعم بوجود أخطاء متكررة في المخزون وهدر.",
      monetization: "اشتراك شهري مقترح؛ المبلغ المستلم المصحح هو 99 ريالاً.",
      stage: "mvp",
    },
    mustInclude: [
      "أفاد المالك بإكمال 5 مقابلات مع عملاء.",
      "أفاد المالك بوجود تجربة مدفوعة واحدة لمدة شهر واحد.",
      "أفاد المالك باستلام 99 ريال سعودي فعلياً.",
    ],
    mustNotInclude: [
      /أفاد المالك بإكمال 8 مقابلات/u,
      /أفاد المالك بوجود 2 تجارب/u,
      /أفاد المالك باستلام 199 ريال/u,
    ],
    expectEvidenceSection: true,
    verifyTrialBoundary: true,
  },
  {
    id: "case_b_actual_payment_correction_en",
    language: "en",
    input: {
      businessIdea: "Restaurant inventory SaaS. We received SAR 199. Actually received SAR 99 after a refund. There are no recurring subscriptions, verified retention data, or active users.",
      targetCustomer: "Independent restaurant owners",
      problem: "Restaurant owners reported recurring inventory errors and waste.",
      monetization: "A proposed monthly subscription.",
      stage: "mvp",
    },
    mustInclude: ["The owner reported actually receiving SAR 99."],
    mustNotInclude: [
      /owner reported actually receiving SAR 199/i,
      /exact amount remains unresolved/i,
    ],
    expectEvidenceSection: true,
  },
  {
    id: "case_b_unresolved_en",
    language: "en",
    input: {
      businessIdea: "Restaurant inventory SaaS. We completed 8 customer interviews and completed 5 customer interviews. We completed 2 paid trials and completed one paid trial. We received SAR 199 and received SAR 99. There are no recurring subscriptions, verified retention data, or active users.",
      targetCustomer: "Independent restaurant owners",
      problem: "Restaurant owners reported recurring inventory errors and waste.",
      monetization: "A proposed monthly subscription with conflicting reported payment amounts.",
      stage: "mvp",
    },
    mustInclude: [
      "conflicting interview counts",
      "conflicting paid-trial counts",
      "conflicting received-payment amounts",
    ],
    mustNotInclude: [
      /owner reported completing (?:8|5) customer interviews/i,
      /owner reported (?:2|1|one) paid trials?/i,
      /owner reported actually receiving SAR (?:199|99)/i,
    ],
    expectEvidenceSection: true,
  },
  {
    id: "case_b_unresolved_ar",
    language: "ar",
    input: {
      businessIdea: "تطبيق لإدارة مخزون المطاعم. أجرينا 8 مقابلات وأجرينا 5 مقابلات. أجرينا 2 تجارب مدفوعة وأجرينا تجربة مدفوعة واحدة. استلمنا 199 ريال واستلمنا 99 ريال. لا توجد اشتراكات متكررة أو بيانات احتفاظ مؤكدة أو مستخدمون نشطون.",
      targetCustomer: "أصحاب المطاعم المستقلة",
      problem: "أفاد أصحاب المطاعم بوجود أخطاء متكررة في المخزون وهدر.",
      monetization: "اشتراك شهري مقترح مع تعارض في المبالغ المذكورة.",
      stage: "mvp",
    },
    mustInclude: [
      "أعداد متعارضة للمقابلات",
      "أعداد متعارضة للتجارب المدفوعة",
      "مبالغ متعارضة للمبالغ المستلمة",
    ],
    mustNotInclude: [
      /أفاد المالك بإكمال (?:8|5) مقابلات/u,
      /أفاد المالك بوجود (?:2|1) تجارب? مدفوعة/u,
      /أفاد المالك باستلام (?:199|99) ريال/u,
    ],
    expectEvidenceSection: true,
  },
];

for (const testCase of cases) {
  const result = executeValidation(testCase.input, testCase.language, {}, feasibilityAnswers);
  assert.equal(result.evaluationStatus, "evaluated", `${testCase.id}: reaches final evaluation`);
  const content = testCase.language === "ar" ? contentAr : contentEn;
  const reportText = buildBusinessIdeaReportText({
    productConfig,
    content,
    language: testCase.language,
    result,
    generatedAt: new Date("2026-10-10T00:00:00Z"),
  });

  for (const expected of testCase.mustInclude || []) {
    assert.equal(reportText.includes(expected), true, `${testCase.id}: preserves ${expected}`);
  }
  for (const forbidden of testCase.mustNotInclude || []) {
    assert.doesNotMatch(reportText, forbidden, `${testCase.id}: does not fabricate evidence`);
  }

  if (testCase.verifyTrialBoundary) {
    assert.doesNotMatch(result.nextAction, /5 active MVP users|مستخدمين نشطين في النموذج الأولي/u);
    assert.match(result.nextAction, /not proof of retention or active usage|لا كإثبات للاحتفاظ أو الاستخدام النشط/u);
  }
  if (testCase.expectEvidenceSection) {
    const evidenceSection = result.report.sections.find((section) => section.key === "ownerEvidence");
    assert.equal(Boolean(evidenceSection), true, `${testCase.id}: structured final report preserves evidence`);
  } else {
    assert.equal(result.report.sections.some((section) => section.key === "ownerEvidence"), false);
  }
}

console.log("Final report evidence integrity A/B regression: PASS");
