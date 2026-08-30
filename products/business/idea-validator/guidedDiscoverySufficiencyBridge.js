export const GUIDED_DISCOVERY_SUFFICIENCY_STATUS = {
  BLOCKED: "blocked",
  NEEDS_CLARIFICATION: "needs_clarification",
  READY_FOR_BIV_DRAFT: "ready_for_biv_draft",
};

export const GUIDED_DISCOVERY_CLARIFICATION_IDS = {
  BUSINESS_IDEA: "businessIdea",
  TARGET_CUSTOMER: "targetCustomer",
  PROBLEM: "problem",
  MONETIZATION: "monetization",
};

const PRIORITY = [
  GUIDED_DISCOVERY_CLARIFICATION_IDS.BUSINESS_IDEA,
  GUIDED_DISCOVERY_CLARIFICATION_IDS.TARGET_CUSTOMER,
  GUIDED_DISCOVERY_CLARIFICATION_IDS.PROBLEM,
  GUIDED_DISCOVERY_CLARIFICATION_IDS.MONETIZATION,
];

const clarificationDefinitions = {
  businessIdea: {
    id: "businessIdea",
    concept: "safe_eligibility_review_description",
    answerField: "additionalIdeaContext",
    label: {
      en: "Add one clearer sentence about the business idea",
      ar: "أضف جملة أوضح عن فكرة المشروع",
    },
    prompt: {
      en: "What will the business do, and for whom, in one simple sentence?",
      ar: "ماذا سيفعل المشروع، ولمن، في جملة بسيطة؟",
    },
  },
  targetCustomer: {
    id: "targetCustomer",
    concept: "target_customer",
    answerField: "targetCustomer",
    label: {
      en: "Target customer",
      ar: "العميل المستهدف",
    },
    prompt: {
      en: "Who is the main customer for this business?",
      ar: "من العميل الأساسي لهذا المشروع؟",
    },
  },
  problem: {
    id: "problem",
    concept: "customer_problem",
    answerField: "problem",
    label: {
      en: "Customer problem",
      ar: "مشكلة العميل",
    },
    prompt: {
      en: "What problem, need, or job does this solve for that customer?",
      ar: "ما المشكلة أو الحاجة أو المهمة التي يحلها هذا المشروع لذلك العميل؟",
    },
  },
  monetization: {
    id: "monetization",
    concept: "monetization",
    answerField: "monetization",
    label: {
      en: "How the business makes money",
      ar: "كيف يحقق المشروع الإيرادات",
    },
    prompt: {
      en: "Who pays, and how will the business earn revenue?",
      ar: "من سيدفع، وكيف سيحقق المشروع الإيرادات؟",
    },
  },
};

export function evaluateGuidedDiscoverySufficiency(handoff = {}, options = {}) {
  const locale = options.locale === "ar" || handoff.locale === "ar" ? "ar" : "en";
  if (!handoff || typeof handoff !== "object" || handoff.handoffReady !== true) {
    return {
      ok: false,
      status: GUIDED_DISCOVERY_SUFFICIENCY_STATUS.BLOCKED,
      reasonCode: "handoff_not_ready",
      locale,
      activeClarification: null,
      remainingMissingInformation: [],
      deferredInformation: buildDeferredInformation(),
      blockedDecisions: buildBlockedDecisions(),
    };
  }

  const remainingMissingInformation = normalizeMissingInformation(handoff);
  const activeMissingId = PRIORITY.find((id) => remainingMissingInformation.some((item) => item.id === id)) || "";
  if (!activeMissingId) {
    return {
      ok: true,
      status: GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT,
      reasonCode: "ready_for_biv_draft",
      locale,
      activeClarification: null,
      remainingMissingInformation: [],
      deferredInformation: buildDeferredInformation(),
      blockedDecisions: buildBlockedDecisions(),
    };
  }

  return {
    ok: true,
    status: GUIDED_DISCOVERY_SUFFICIENCY_STATUS.NEEDS_CLARIFICATION,
    reasonCode: "missing_downstream_required_information",
    locale,
    activeClarification: buildClarification(activeMissingId, handoff, locale),
    remainingMissingInformation,
    deferredInformation: buildDeferredInformation(),
    blockedDecisions: buildBlockedDecisions(),
  };
}

export function applyGuidedDiscoveryClarificationAnswer(handoff = {}, clarificationId = "", answer = "", options = {}) {
  const currentSufficiency = evaluateGuidedDiscoverySufficiency(handoff, options);
  const activeId = currentSufficiency.activeClarification?.id || "";
  const normalizedAnswer = typeof answer === "string" ? answer.trim() : "";
  if (!activeId || clarificationId !== activeId) {
    return {
      ok: false,
      reasonCode: "clarification_not_active",
      handoff,
      sufficiency: currentSufficiency,
    };
  }
  if (!normalizedAnswer) {
    return {
      ok: false,
      reasonCode: "empty_clarification_answer",
      handoff,
      sufficiency: currentSufficiency,
    };
  }

  const definition = clarificationDefinitions[activeId];
  const updatedHandoff = buildUpdatedHandoffWithAnswer(handoff, definition.answerField, normalizedAnswer);
  return {
    ok: true,
    reasonCode: "clarification_applied",
    handoff: updatedHandoff,
    sufficiency: evaluateGuidedDiscoverySufficiency(updatedHandoff, options),
  };
}

export function getGuidedDiscoveryClarificationDefinition(clarificationId = "", locale = "en") {
  const definition = clarificationDefinitions[clarificationId];
  if (!definition) return null;
  return localizeDefinition(definition, locale === "ar" ? "ar" : "en");
}

function buildUpdatedHandoffWithAnswer(handoff, answerField, answer) {
  const downstreamClarifications = {
    ...(handoff.downstreamClarifications || {}),
    [answerField]: answer,
  };
  const bivDraftInput = {
    ...(handoff.bivDraftInput || {}),
  };
  if (["targetCustomer", "problem", "monetization"].includes(answerField)) {
    bivDraftInput[answerField] = answer;
  }
  if (answerField === "additionalIdeaContext") {
    bivDraftInput.additionalIdeaContext = answer;
  }

  const updated = {
    ...handoff,
    downstreamClarifications,
    bivDraftInput,
  };
  const missingRequiredInformation = normalizeMissingInformation(updated);
  return {
    ...updated,
    missingRequiredInformation,
    evaluationReady: missingRequiredInformation.length === 0,
  };
}

function normalizeMissingInformation(handoff = {}) {
  const draft = handoff.bivDraftInput || {};
  const additionalIdeaContext = handoff.downstreamClarifications?.additionalIdeaContext || draft.additionalIdeaContext || "";
  const missing = [];

  if (!isEnoughIdeaDescription(handoff.originalIdea, additionalIdeaContext)) {
    missing.push(buildMissingItem("businessIdea"));
  }
  for (const id of ["targetCustomer", "problem", "monetization"]) {
    if (!String(draft[id] || handoff.downstreamClarifications?.[id] || "").trim()) {
      missing.push(buildMissingItem(id));
    }
  }
  return missing;
}

function isEnoughIdeaDescription(originalIdea = "", additionalIdeaContext = "") {
  return String(originalIdea || "").trim().length >= 10 || String(additionalIdeaContext || "").trim().length >= 10;
}

function buildMissingItem(id) {
  const definition = clarificationDefinitions[id];
  return {
    id,
    concept: definition.concept,
  };
}

function buildClarification(id, handoff, locale) {
  const definition = localizeDefinition(clarificationDefinitions[id], locale);
  const coreOffering = handoff.confirmedUnderstanding?.coreOffering || "";
  const selectedIntent = handoff.confirmedUnderstanding?.selectedIntent || "";
  const prompt = withContextualPrompt(definition.prompt, { id, coreOffering, selectedIntent, locale });
  return {
    ...definition,
    prompt,
    field: {
      id: definition.answerField,
      type: "textarea",
      required: true,
      label: definition.label,
    },
  };
}

function localizeDefinition(definition, locale) {
  return {
    id: definition.id,
    concept: definition.concept,
    answerField: definition.answerField,
    label: definition.label[locale] || definition.label.en,
    prompt: definition.prompt[locale] || definition.prompt.en,
  };
}

function withContextualPrompt(prompt, { id, coreOffering, selectedIntent, locale }) {
  if (id !== "targetCustomer" || !coreOffering.trim()) return prompt;
  if (locale === "ar") {
    return selectedIntent === "service"
      ? "من العميل الرئيسي لهذه الخدمة؟"
      : `من العميل الأساسي لما يقدمه المشروع: ${coreOffering}؟`;
  }
  return selectedIntent === "service"
    ? "Who is the main customer for this service?"
    : `Who is the main customer for what the business provides: ${coreOffering}?`;
}

function buildDeferredInformation() {
  return [
    "city",
    "country",
    "firstProject",
    "userExperienceLevel",
    "decisionObjective",
    "currentSolution",
    "competitiveAdvantage",
    "specialistOnlyDetails",
  ];
}

function buildBlockedDecisions() {
  return [
    "verdict",
    "score",
    "eligibility_decision",
    "classification_decision",
    "feasibility_decision",
    "specialist_conclusion",
    "report_permission",
    "recommendation",
  ];
}
