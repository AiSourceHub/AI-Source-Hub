import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SEMANTIC_BUSINESS_CLARIFICATION_FIELD_IDS,
  buildSemanticClarificationQuestions,
  createSemanticIntentRequest,
} from "./semanticIntentContract.js";
import { handleBivSemanticIntentEndpoint } from "./semanticServerBoundary.js";
import { validateSemanticIntentRequest } from "./semanticIntentValidator.js";

function ids(questions) {
  return questions.map((question) => question.id);
}

function questionsFor({ locale = "en", currentDiscoveryState = {}, confirmedAnswers = {} } = {}) {
  return buildSemanticClarificationQuestions({
    locale,
    currentDiscoveryState,
    confirmedAnswers,
  });
}

function makeRequestBody(overrides = {}) {
  return createSemanticIntentRequest({
    locale: "en",
    originalIdea: "A local service idea.",
    confirmedAnswers: {},
    currentDiscoveryState: {},
    policySafeContext: { eligibilityStatus: "biv_owned" },
    ...overrides,
  });
}

async function endpoint(body) {
  return handleBivSemanticIntentEndpoint({
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

assert.deepEqual(SEMANTIC_BUSINESS_CLARIFICATION_FIELD_IDS, [
  "selectedIntent",
  "coreOffering",
  "selectedOperatingApproach",
  "selectedOperatingApproaches",
]);

const missingSchema = validateSemanticIntentRequest({
  locale: "en",
  originalIdea: "A local service idea.",
  confirmedAnswers: {},
  currentDiscoveryState: {},
  allowedTaxonomyOptions: [],
  policySafeContext: {},
});
assert.equal(missingSchema.ok, false);
assert.ok(missingSchema.reasonCodes.includes("missing_required_fields"));
assert.deepEqual(missingSchema.missingRequiredFields, ["schemaVersion"]);

const missingLocaleResponse = await endpoint({
  schemaVersion: "biv_intent_discovery_v1",
  originalIdea: "A local service idea.",
  confirmedAnswers: {},
  currentDiscoveryState: {},
  allowedTaxonomyOptions: [],
  policySafeContext: {},
});
assert.equal(missingLocaleResponse.status, 400);
assert.equal("clarification_questions" in missingLocaleResponse.body.error, false);

const missingConfirmedAnswersResponse = await endpoint({
  schemaVersion: "biv_intent_discovery_v1",
  locale: "en",
  originalIdea: "A local service idea.",
  currentDiscoveryState: {},
  allowedTaxonomyOptions: [],
  policySafeContext: {},
});
assert.equal(missingConfirmedAnswersResponse.status, 400);
assert.equal("clarification_questions" in missingConfirmedAnswersResponse.body.error, false);

const validEmptyConfirmedAnswers = validateSemanticIntentRequest(makeRequestBody({
  confirmedAnswers: {},
}));
assert.equal(validEmptyConfirmedAnswers.ok, true);

const selectedIntentQuestion = questionsFor({ locale: "en" });
assert.deepEqual(ids(selectedIntentQuestion), ["selectedIntent"]);
assert.equal(selectedIntentQuestion[0].question, "Which description is closest to how your business would work?");

const selectedIntentQuestionAr = questionsFor({ locale: "ar" });
assert.deepEqual(ids(selectedIntentQuestionAr), ["selectedIntent"]);
assert.equal(selectedIntentQuestionAr[0].question, "أي وصف أقرب إلى طريقة عمل مشروعك؟");

const coreOfferingNotAskedBeforeIntent = questionsFor({
  locale: "en",
  currentDiscoveryState: {
    coreOffering: "",
    coreOfferingStatus: "missing",
    selectedOperatingApproach: "",
  },
});
assert.deepEqual(ids(coreOfferingNotAskedBeforeIntent), ["selectedIntent"]);

const intentSpecificCoreQuestions = {
  service: ["ما الخدمة الأساسية التي سيحصل عليها العميل؟", "What main service will the customer receive?"],
  retail: ["ما فئة المنتجات الأساسية التي سيبيعها المشروع؟", "What main product category will the business sell?"],
  manufacturing: ["ما المنتج الأساسي الذي سيصنعه المشروع؟", "What main product will the business make?"],
  digital: ["ما المهمة الأساسية التي سيساعد البرنامج المستخدم على إنجازها؟", "What main task will the software help the user complete?"],
  marketplace: ["من الطرفان اللذان ستربط بينهما المنصة؟", "Which two sides will the platform connect?"],
  different: ["ما النتيجة الأساسية التي تريد أن يقدمها المشروع للعميل؟", "What main outcome do you want the business to give the customer?"],
};

for (const [intentId, [arabicQuestion, englishQuestion]] of Object.entries(intentSpecificCoreQuestions)) {
  const ar = questionsFor({ locale: "ar", currentDiscoveryState: { selectedIntent: intentId } });
  const en = questionsFor({ locale: "en", currentDiscoveryState: { selectedIntent: intentId } });
  assert.deepEqual(ids(ar), ["coreOffering"]);
  assert.deepEqual(ids(en), ["coreOffering"]);
  assert.equal(ar[0].question, arabicQuestion);
  assert.equal(en[0].question, englishQuestion);
  assert.equal(/[\u0600-\u06ff]/u.test(ar[0].question), true);
  assert.equal(/[\u0600-\u06ff]/u.test(en[0].question), false);
  assert.equal(ar[0].question.includes("coreOffering"), false);
  assert.equal(en[0].question.includes("coreOffering"), false);
}

const operatingNotAskedBeforeCoreOffering = questionsFor({
  locale: "en",
  currentDiscoveryState: {
    selectedIntent: "service",
    selectedOperatingApproach: "",
  },
});
assert.deepEqual(ids(operatingNotAskedBeforeCoreOffering), ["coreOffering"]);

const operatingQuestion = questionsFor({
  locale: "en",
  currentDiscoveryState: {
    selectedIntent: "service",
    coreOffering: "Car cleaning",
    coreOfferingStatus: "provided",
  },
});
assert.deepEqual(ids(operatingQuestion), ["selectedOperatingApproach"]);
assert.equal(operatingQuestion[0].question, "How will the customer receive what the business provides?");

const mixedQuestion = questionsFor({
  locale: "ar",
  currentDiscoveryState: {
    selectedIntent: "service",
    coreOffering: "تنظيف السيارات",
    coreOfferingStatus: "provided",
    selectedOperatingApproach: "mixed",
    selectedOperatingApproaches: ["fixed_location"],
  },
});
assert.deepEqual(ids(mixedQuestion), ["selectedOperatingApproaches"]);
assert.equal(mixedQuestion[0].question, "ما طرق تقديم المشروع التي تقصدها؟");

const mixedQuestionForNotDecided = questionsFor({
  locale: "en",
  currentDiscoveryState: {
    selectedIntent: "service",
    coreOffering: "Car cleaning",
    coreOfferingStatus: "provided",
    selectedOperatingApproach: "mixed",
    selectedOperatingApproaches: ["not_decided"],
  },
});
assert.deepEqual(ids(mixedQuestionForNotDecided), ["selectedOperatingApproaches"]);

const completeState = questionsFor({
  locale: "en",
  currentDiscoveryState: {
    selectedIntent: "service",
    coreOffering: "Car cleaning",
    coreOfferingStatus: "provided",
    selectedOperatingApproach: "mixed",
    selectedOperatingApproaches: ["fixed_location", "customer_site"],
  },
});
assert.deepEqual(completeState, []);

const confirmedAnswersWin = questionsFor({
  locale: "en",
  currentDiscoveryState: {},
  confirmedAnswers: {
    selectedIntent: "service",
    coreOffering: "Car cleaning",
    coreOfferingStatus: "provided",
    selectedOperatingApproach: "fixed_location",
  },
});
assert.deepEqual(confirmedAnswersWin, []);

const endpointQuestionResponse = await endpoint(makeRequestBody({
  locale: "ar",
  currentDiscoveryState: {
    selectedIntent: "service",
  },
}));
assert.equal(endpointQuestionResponse.status, 200);
assert.deepEqual(endpointQuestionResponse.body.clarification_questions.map((item) => item.id), ["coreOffering"]);
assert.equal(endpointQuestionResponse.body.clarification_questions[0].question, "ما الخدمة الأساسية التي سيحصل عليها العميل؟");

const sourceFiles = [
  "semanticIntentContract.js",
  "semanticServerBoundary.js",
  "semanticIntentMockProvider.js",
];
for (const file of sourceFiles) {
  const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
  assert.equal(/car wash|مغسلة|grocery|clinic|PET|recycling/i.test(source), false, `${file} should not add project-specific clarification rules`);
}

console.log("Semantic relevant missing fields tests: PASS");
