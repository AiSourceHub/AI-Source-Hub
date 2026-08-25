import { collectClassificationEvidence } from "./classificationEvidence.js";

export const INTENT_DISCOVERY_ROUTE = "/dev/biv-guided-discovery";

export const discoveryIntentOptions = [
  { id: "service", primaryType: "service" },
  { id: "retail", primaryType: "retail" },
  { id: "manufacturing", primaryType: "manufacturing_industrial" },
  { id: "digital", primaryType: "digital_software" },
  { id: "marketplace", primaryType: "marketplace_platform" },
];

export const discoveryFallbackOptions = [
  { id: "different" },
  { id: "not_decided" },
];

export const operatingApproachOptions = [
  { id: "online", operatingModel: "digital_remote", relevantTo: ["digital", "marketplace", "retail", "service", "different", "not_decided"] },
  { id: "fixed_location", operatingModel: "fixed_location", relevantTo: ["service", "retail", "manufacturing", "marketplace", "different", "not_decided"] },
  { id: "customer_site", operatingModel: "mobile_or_customer_site", relevantTo: ["service", "marketplace", "different", "not_decided"] },
  { id: "home_based", operatingModel: "home_based", relevantTo: ["service", "retail", "different", "not_decided"] },
  { id: "mixed", operatingModel: "mixed", relevantTo: ["service", "retail", "manufacturing", "digital", "marketplace", "different", "not_decided"] },
  { id: "not_decided", operatingModel: "unknown", relevantTo: ["service", "retail", "manufacturing", "digital", "marketplace", "different", "not_decided"] },
];

export const mixedOperatingApproachOptions = [
  { id: "online" },
  { id: "fixed_location" },
  { id: "customer_site" },
  { id: "home_based" },
  { id: "other" },
  { id: "not_decided" },
];

export const discoveryContent = {
  en: {
    language: "en",
    direction: "ltr",
    title: "Business Idea Discovery Prototype",
    eyebrow: "Local prototype",
    states: {
      idea: {
        heading: "Tell us about your idea",
        body: "Describe your idea in your own words, even if it is incomplete. We will help you clarify what you mean and what information you need before making a decision.",
        label: "What idea are you thinking about?",
        placeholder: "Write your idea the way you would explain it to someone whose opinion you trust...",
        button: "Start understanding the idea",
      },
      intent: {
        heading: "What is closest to your idea?",
        body: "To get closer to your idea, choose the description that best matches how the business would work.",
        suggested: "may be closest",
      },
      coreOffering: {
        headings: {
          service: "What main service will the customer receive?",
          retail: "What main product category will the business sell?",
          manufacturing: "What main product will the business make?",
          digital: "What main task will the software help the user complete?",
          marketplace: "Which two sides will the platform connect?",
          different: "What main outcome do you want the business to give the customer?",
          not_decided: "What main outcome do you want the business to give the customer?",
        },
        label: "Short answer",
        placeholder: "Write one clear service, product, task, or outcome...",
        undecided: "I have not decided yet",
      },
      operating: {
        heading: "How will the customer receive what the business provides?",
      },
      mixedOperating: {
        heading: "Which delivery approaches do you mean?",
        body: "Choose at least two, or say that you have not decided yet.",
      },
      summary: {
        heading: "This is what we understand so far",
        originalIdea: "Your original description",
        intent: "Business role",
        coreOffering: "What the business will provide",
        operating: "How it reaches the customer",
        unresolved: "Still needs clarification",
        complete: "The essential information required for this stage is complete.",
        confirmed: "We now have a clearer foundation for asking questions that fit your idea.",
      },
    },
    semanticIntent: {
      loading: "We are reviewing your description to find the closest ways to understand the idea...",
      validHeading: "This is what we understand so far",
      choiceQuestion: "Which description is closest to what you mean?",
      lowConfidenceHeading: "We found more than one possibility",
      lowConfidenceBody: "We found more than one possibility and need your choice before continuing correctly.",
      fallbackBody: "Let us define the idea step by step. Choose the closest description of how the business would work.",
    },
    progress: "Step {current} of {total}",
    validation: {
      ideaRequired: "Add a short idea before continuing.",
      intentRequired: "Choose the closest description before continuing.",
      coreOfferingRequired: "Add the main offering or choose that you have not decided yet.",
      operatingRequired: "Choose how the customer receives the value before continuing.",
      mixedRequired: "Choose at least two delivery approaches, or say that you have not decided yet.",
    },
    actions: {
      continue: "Continue",
      back: "Back",
      confirm: "Yes, this is what I mean",
      edit: "I want to edit my answers",
      reset: "Start again",
    },
    intentOptions: {
      service: "I provide a service to the customer",
      retail: "I sell products",
      manufacturing: "I make a product",
      digital: "I provide software or a digital service",
      marketplace: "I connect two sides",
      different: "My idea is different",
      not_decided: "I have not decided yet",
    },
    intentSummaryOptions: {
      service: "Providing a direct service to the customer",
      retail: "Selling products",
      manufacturing: "Making a product",
      digital: "Providing software or a digital service",
      marketplace: "Connecting two sides",
      different: "Different from the common options",
      not_decided: "Not decided yet",
    },
    operatingOptions: {
      online: "Online",
      fixed_location: "At a fixed location",
      customer_site: "The service reaches the customer’s location",
      home_based: "From home",
      mixed: "More than one way",
      not_decided: "I have not decided yet",
    },
    mixedOperatingOptions: {
      online: "Online",
      fixed_location: "At a fixed location",
      customer_site: "At the customer’s location",
      home_based: "From home",
      other: "Another way",
      not_decided: "I have not decided the approaches yet",
    },
    placeholders: {
      coreOfferingUndecided: "Not decided yet",
      operatingUndecided: "Not decided yet",
    },
    unresolved: {
      different: "The main role of the business is not defined yet.",
      not_decided: "The main role of the business is not defined yet.",
      coreOffering: "The main service or product has not been defined yet.",
      operating: "How the business will reach the customer has not been defined yet.",
      mixedOperating: "The multiple delivery approaches have not been defined yet.",
    },
  },
  ar: {
    language: "ar",
    direction: "rtl",
    title: "نموذج فهم فكرة العمل",
    eyebrow: "نموذج محلي أولي",
    states: {
      idea: {
        heading: "حدثنا عن فكرتك",
        body: "صف فكرتك بطريقتك، حتى لو كانت غير مكتملة. سنساعدك على تحديد ما تقصده والمعلومات التي تحتاج إليها قبل اتخاذ القرار.",
        label: "ما الفكرة التي تفكر فيها؟",
        placeholder: "اكتب فكرتك كما تشرحها لشخص تثق برأيه...",
        button: "ابدأ فهم الفكرة",
      },
      intent: {
        heading: "ما الوصف الأقرب لفكرتك؟",
        body: "حتى نقترب من فكرتك، اختر الوصف الأقرب لطريقة عمل المشروع.",
        suggested: "قد يكون الأقرب",
      },
      coreOffering: {
        headings: {
          service: "ما الخدمة الأساسية التي سيحصل عليها العميل؟",
          retail: "ما فئة المنتجات الأساسية التي سيبيعها المشروع؟",
          manufacturing: "ما المنتج الأساسي الذي سيصنعه المشروع؟",
          digital: "ما المهمة الأساسية التي سيساعد البرنامج المستخدم على إنجازها؟",
          marketplace: "من الطرفان اللذان ستربط بينهما المنصة؟",
          different: "ما النتيجة الأساسية التي تريد أن يقدمها المشروع للعميل؟",
          not_decided: "ما النتيجة الأساسية التي تريد أن يقدمها المشروع للعميل؟",
        },
        label: "إجابة قصيرة",
        placeholder: "اكتب خدمة أو منتجاً أو مهمة أو نتيجة واحدة بوضوح...",
        undecided: "لم أحدد بعد",
      },
      operating: {
        heading: "كيف سيحصل العميل على ما يقدمه المشروع؟",
      },
      mixedOperating: {
        heading: "ما طرق تقديم المشروع التي تقصدها؟",
        body: "اختر طريقتين على الأقل، أو أخبرنا أنك لم تحدد الطرق بعد.",
      },
      summary: {
        heading: "هذا ما فهمناه حتى الآن",
        originalIdea: "وصفك الأصلي",
        intent: "دور المشروع",
        coreOffering: "ما سيقدمه المشروع",
        operating: "طريقة تقديمه للعميل",
        unresolved: "ما زال يحتاج إلى تحديد",
        complete: "اكتملت المعلومات الأساسية المطلوبة لهذه المرحلة.",
        confirmed: "أصبح لدينا الآن أساس أوضح لطرح الأسئلة المناسبة لفكرتك.",
      },
    },
    semanticIntent: {
      loading: "نراجع وصفك لنحدد أقرب الطرق لفهم الفكرة...",
      validHeading: "هذا ما فهمناه مبدئيًا",
      choiceQuestion: "أي وصف أقرب إلى ما تقصده؟",
      lowConfidenceHeading: "وجدنا أكثر من احتمال",
      lowConfidenceBody: "وجدنا أكثر من احتمال، ونحتاج اختيارك حتى نكمل بصورة صحيحة.",
      fallbackBody: "لنحدد الفكرة خطوة بخطوة. اختر الوصف الأقرب لطريقة عمل المشروع.",
    },
    progress: "الخطوة {current} من {total}",
    validation: {
      ideaRequired: "أضف وصفاً مختصراً للفكرة قبل المتابعة.",
      intentRequired: "اختر الوصف الأقرب قبل المتابعة.",
      coreOfferingRequired: "أضف ما سيقدمه المشروع أساسياً أو اختر أنك لم تحدد بعد.",
      operatingRequired: "اختر كيف سيحصل العميل على القيمة قبل المتابعة.",
      mixedRequired: "اختر طريقتين على الأقل، أو اختر أنك لم تحدد الطرق بعد.",
    },
    actions: {
      continue: "متابعة",
      back: "رجوع",
      confirm: "نعم، هذا ما أقصده",
      edit: "أريد تعديل الإجابات",
      reset: "ابدأ من جديد",
    },
    intentOptions: {
      service: "أقدم خدمة للعميل",
      retail: "أبيع منتجات",
      manufacturing: "أصنع منتجاً",
      digital: "أقدم برنامجاً أو خدمة رقمية",
      marketplace: "أربط بين طرفين",
      different: "فكرتي مختلفة",
      not_decided: "لم أحدد بعد",
    },
    intentSummaryOptions: {
      service: "تقديم خدمة مباشرة للعميل",
      retail: "بيع منتجات",
      manufacturing: "صناعة منتج",
      digital: "تقديم برنامج أو خدمة رقمية",
      marketplace: "الربط بين طرفين",
      different: "مختلف عن الخيارات الشائعة",
      not_decided: "لم يُحدد بعد",
    },
    operatingOptions: {
      online: "عبر الإنترنت",
      fixed_location: "في موقع ثابت",
      customer_site: "تصل الخدمة إلى موقع العميل",
      home_based: "من المنزل",
      mixed: "بأكثر من طريقة",
      not_decided: "لم أحدد بعد",
    },
    mixedOperatingOptions: {
      online: "عبر الإنترنت",
      fixed_location: "في موقع ثابت",
      customer_site: "في موقع العميل",
      home_based: "من المنزل",
      other: "طريقة أخرى",
      not_decided: "لم أحدد الطرق بعد",
    },
    placeholders: {
      coreOfferingUndecided: "لم يُحدد بعد",
      operatingUndecided: "لم تُحدد بعد",
    },
    unresolved: {
      different: "دور المشروع الأساسي لم يُحدد بعد.",
      not_decided: "دور المشروع الأساسي لم يُحدد بعد.",
      coreOffering: "الخدمة أو المنتج الأساسي لم يُحدد بعد.",
      operating: "طريقة تقديم المشروع للعميل لم تُحدد بعد.",
      mixedOperating: "طرق تقديم المشروع المتعددة لم تُحدد بعد.",
    },
  },
};

const evidenceIntentMap = {
  service: "service",
  professional_service: "service",
  retail_trading: "retail",
  manufacturing_industrial: "manufacturing",
  digital_software: "digital",
  marketplace_platform: "marketplace",
};

export function createInitialDiscoveryState() {
  return {
    originalIdea: "",
    suggestedIntentOptions: discoveryIntentOptions.map((option) => ({ ...option, suggested: false })),
    selectedIntent: "",
    coreOffering: "",
    coreOfferingStatus: "missing",
    selectedOperatingApproach: "",
    selectedOperatingApproaches: [],
    unresolvedItems: [],
    confirmationStatus: "not_confirmed",
  };
}

export function buildDiscoveryState({
  originalIdea = "",
  selectedIntent = "",
  coreOffering = "",
  coreOfferingStatus = "",
  selectedOperatingApproach = "",
  selectedOperatingApproaches = [],
  confirmationStatus = "not_confirmed",
} = {}) {
  const suggestedIntentOptions = buildSuggestedIntentOptions(originalIdea);
  const normalizedCoreOfferingStatus = normalizeCoreOfferingStatus(coreOffering, coreOfferingStatus);
  const normalizedOperatingApproaches = normalizeSelectedOperatingApproaches(selectedOperatingApproach, selectedOperatingApproaches);
  const unresolvedItems = buildUnresolvedItems({
    selectedIntent,
    coreOffering,
    coreOfferingStatus: normalizedCoreOfferingStatus,
    selectedOperatingApproach,
    selectedOperatingApproaches: normalizedOperatingApproaches,
  });
  return {
    originalIdea,
    suggestedIntentOptions,
    selectedIntent,
    coreOffering,
    coreOfferingStatus: normalizedCoreOfferingStatus,
    selectedOperatingApproach,
    selectedOperatingApproaches: normalizedOperatingApproaches,
    unresolvedItems,
    confirmationStatus,
  };
}

export function buildSuggestedIntentOptions(originalIdea = "") {
  const sourceFields = [{ field: "businessIdea", value: originalIdea }];
  const evidence = collectClassificationEvidence(sourceFields);
  const scores = new Map();
  for (const record of evidence) {
    const intentId = evidenceIntentMap[record.proposedValue];
    if (!intentId || record.dimension !== "businessType") continue;
    scores.set(intentId, (scores.get(intentId) || 0) + record.weight);
  }

  const strongestScore = Math.max(0, ...scores.values());
  return [...discoveryIntentOptions]
    .map((option, index) => ({
      ...option,
      score: scores.get(option.id) || 0,
      suggested: strongestScore > 0 && scores.get(option.id) === strongestScore,
      originalIndex: index,
    }))
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
    .slice(0, 5)
    .map(({ originalIndex, ...option }) => option);
}

export function getIntentChoices(discoveryState = createInitialDiscoveryState()) {
  return [...(discoveryState.suggestedIntentOptions || []), ...discoveryFallbackOptions];
}

export function getOperatingChoices(selectedIntent = "") {
  return operatingApproachOptions.filter((option) => option.relevantTo.includes(selectedIntent || "not_decided"));
}

export function getMixedOperatingChoices() {
  return [...mixedOperatingApproachOptions];
}

export function getCoreOfferingQuestion(selectedIntent = "", language = "en") {
  const content = discoveryContent[language] || discoveryContent.en;
  return content.states.coreOffering.headings[selectedIntent] || content.states.coreOffering.headings.not_decided;
}

export function getDiscoverySteps(discoveryState = createInitialDiscoveryState()) {
  const steps = ["idea", "intent", "coreOffering", "operating"];
  if (discoveryState.selectedOperatingApproach === "mixed") steps.push("mixedOperating");
  steps.push("summary");
  return steps;
}

export function getProgressText(discoveryState = createInitialDiscoveryState(), step = "idea", language = "en") {
  const content = discoveryContent[language] || discoveryContent.en;
  const steps = getDiscoverySteps(discoveryState);
  const current = Math.max(1, steps.indexOf(step) + 1);
  return content.progress.replace("{current}", String(current)).replace("{total}", String(steps.length));
}

export function getNextStep(discoveryState = createInitialDiscoveryState(), step = "idea") {
  if (step === "idea") return "intent";
  if (step === "intent") return "coreOffering";
  if (step === "coreOffering") return "operating";
  if (step === "operating") return discoveryState.selectedOperatingApproach === "mixed" ? "mixedOperating" : "summary";
  if (step === "mixedOperating") return "summary";
  return "summary";
}

export function getPreviousStep(discoveryState = createInitialDiscoveryState(), step = "summary") {
  if (step === "summary") return discoveryState.selectedOperatingApproach === "mixed" ? "mixedOperating" : "operating";
  if (step === "mixedOperating") return "operating";
  if (step === "operating") return "coreOffering";
  if (step === "coreOffering") return "intent";
  if (step === "intent") return "idea";
  return "idea";
}

export function updateMixedOperatingSelection(currentSelections = [], optionId = "") {
  if (optionId === "not_decided") return ["not_decided"];
  const withoutNotDecided = currentSelections.filter((item) => item !== "not_decided");
  if (withoutNotDecided.includes(optionId)) {
    return withoutNotDecided.filter((item) => item !== optionId);
  }
  return [...withoutNotDecided, optionId];
}

export function buildUnderstandingSummary(discoveryState = createInitialDiscoveryState(), language = "en") {
  const content = discoveryContent[language] || discoveryContent.en;
  const intentLabel = content.intentSummaryOptions[discoveryState.selectedIntent] || content.intentSummaryOptions.not_decided;
  const coreOfferingLabel = discoveryState.coreOfferingStatus === "provided"
    ? discoveryState.coreOffering
    : content.placeholders.coreOfferingUndecided;
  const operatingLabel = buildOperatingSummaryLabel(discoveryState, content);
  return {
    originalIdea: discoveryState.originalIdea,
    intentLabel,
    coreOfferingLabel,
    operatingLabel,
    unresolvedItems: discoveryState.unresolvedItems.map((item) => content.unresolved[item] || item),
    confirmationStatus: discoveryState.confirmationStatus,
  };
}

export function validateDiscoveryStep(discoveryState = createInitialDiscoveryState(), step = "idea", language = "en") {
  const content = discoveryContent[language] || discoveryContent.en;
  if (step === "idea" && !discoveryState.originalIdea.trim()) {
    return { ok: false, error: content.validation.ideaRequired };
  }
  if (step === "intent" && !discoveryState.selectedIntent) {
    return { ok: false, error: content.validation.intentRequired };
  }
  if (step === "coreOffering" && discoveryState.coreOfferingStatus !== "provided" && discoveryState.coreOfferingStatus !== "undecided") {
    return { ok: false, error: content.validation.coreOfferingRequired };
  }
  if (step === "operating" && !discoveryState.selectedOperatingApproach) {
    return { ok: false, error: content.validation.operatingRequired };
  }
  if (
    step === "mixedOperating" &&
    discoveryState.selectedOperatingApproach === "mixed" &&
    !(
      discoveryState.selectedOperatingApproaches.includes("not_decided") ||
      discoveryState.selectedOperatingApproaches.length >= 2
    )
  ) {
    return { ok: false, error: content.validation.mixedRequired };
  }
  return { ok: true, error: "" };
}

function normalizeCoreOfferingStatus(coreOffering = "", coreOfferingStatus = "") {
  if (coreOfferingStatus === "undecided") return "undecided";
  if (coreOffering.trim()) return "provided";
  return "missing";
}

function normalizeSelectedOperatingApproaches(selectedOperatingApproach = "", selectedOperatingApproaches = []) {
  if (selectedOperatingApproach !== "mixed") return [];
  return selectedOperatingApproaches.filter((item, index, list) => item && list.indexOf(item) === index);
}

function buildOperatingSummaryLabel(discoveryState, content) {
  if (discoveryState.selectedOperatingApproach === "mixed") {
    if (discoveryState.selectedOperatingApproaches.includes("not_decided") || discoveryState.selectedOperatingApproaches.length < 2) {
      return content.placeholders.operatingUndecided;
    }
    return discoveryState.selectedOperatingApproaches
      .map((item) => content.mixedOperatingOptions[item])
      .filter(Boolean)
      .reduce((label, item, index, list) => {
        if (index === 0) return item;
        if (content.language === "ar") {
          return index === list.length - 1 ? `${label}، و${item}` : `${label}، ${item}`;
        }
        if (index === list.length - 1) {
          return `${label} and ${item}`;
        }
        return `${label}, ${item}`;
      }, "");
  }
  if (!discoveryState.selectedOperatingApproach || discoveryState.selectedOperatingApproach === "not_decided") {
    return content.placeholders.operatingUndecided;
  }
  return content.operatingOptions[discoveryState.selectedOperatingApproach] || content.placeholders.operatingUndecided;
}

function buildUnresolvedItems({
  selectedIntent = "",
  coreOffering = "",
  coreOfferingStatus = "missing",
  selectedOperatingApproach = "",
  selectedOperatingApproaches = [],
} = {}) {
  const items = [];
  if (selectedIntent === "different") items.push("different");
  if (!selectedIntent || selectedIntent === "not_decided") items.push("not_decided");
  if (!coreOffering.trim() || coreOfferingStatus === "undecided") items.push("coreOffering");
  if (!selectedOperatingApproach || selectedOperatingApproach === "not_decided") items.push("operating");
  if (
    selectedOperatingApproach === "mixed" &&
    (
      selectedOperatingApproaches.includes("not_decided") ||
      selectedOperatingApproaches.length < 2
    )
  ) {
    items.push("mixedOperating");
  }
  return items;
}
