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

export const discoveryJourneyStates = {
  ideaCapture: "idea_capture",
  intentSelection: "intent_selection",
  coreOffering: "core_offering",
  operatingApproach: "operating_approach",
  mixedOperatingDetail: "mixed_operating_detail",
  understandingReview: "understanding_review",
  understandingConfirmed: "understanding_confirmed",
};

const legacyStepJourneyStateMap = {
  idea: discoveryJourneyStates.ideaCapture,
  intent: discoveryJourneyStates.intentSelection,
  coreOffering: discoveryJourneyStates.coreOffering,
  operating: discoveryJourneyStates.operatingApproach,
  mixedOperating: discoveryJourneyStates.mixedOperatingDetail,
  summary: discoveryJourneyStates.understandingReview,
};

const journeyStateStepMap = {
  [discoveryJourneyStates.ideaCapture]: "idea",
  [discoveryJourneyStates.intentSelection]: "intent",
  [discoveryJourneyStates.coreOffering]: "coreOffering",
  [discoveryJourneyStates.operatingApproach]: "operating",
  [discoveryJourneyStates.mixedOperatingDetail]: "mixedOperating",
  [discoveryJourneyStates.understandingReview]: "summary",
  [discoveryJourneyStates.understandingConfirmed]: "summary",
};

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
      },
      displayTranslation: {
        label: "Translated for viewing",
        unavailable: "No local viewing translation is available for this text yet. The original remains unchanged.",
      },
      confirmed: {
        heading: "Understanding confirmed",
        body: "The information you confirmed for this stage has been saved. Your idea is now ready to move to the next step when it is approved.",
        notice: "This is a local idea-understanding prototype only; evaluation or report preparation has not started yet.",
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
      edit: "Edit",
      editAnswers: "Edit answers",
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
    mixedOperatingJoinOptions: {
      online: "online",
      fixed_location: "at a fixed location",
      customer_site: "at the customer’s location",
      home_based: "from home",
      other: "another way",
      not_decided: "not decided yet",
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
      },
      displayTranslation: {
        label: "ترجمة للعرض فقط",
        unavailable: "لا تتوفر ترجمة محلية للعرض لهذا النص حالياً. يبقى النص الأصلي كما هو.",
      },
      confirmed: {
        heading: "تم تأكيد فهم الفكرة",
        body: "تم حفظ المعلومات التي أكّدتها لهذه المرحلة. أصبحت فكرتك الآن جاهزة للانتقال إلى الخطوة التالية عندما يتم اعتمادها.",
        notice: "هذا نموذج محلي لفهم الفكرة فقط، ولم يبدأ التقييم أو إعداد التقرير بعد.",
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
      edit: "تعديل",
      editAnswers: "تعديل الإجابات",
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

export const confirmationFieldIds = [
  "selectedIntent",
  "coreOffering",
  "selectedOperatingApproach",
  "selectedOperatingApproaches",
];

export const confirmationFieldStepMap = {
  selectedIntent: discoveryJourneyStates.intentSelection,
  coreOffering: discoveryJourneyStates.coreOffering,
  selectedOperatingApproach: discoveryJourneyStates.operatingApproach,
  selectedOperatingApproaches: discoveryJourneyStates.mixedOperatingDetail,
};

const displayTranslationFixtures = {
  originalIdea: {
    ar: {
      en: {
        "مشروع صيانة مكيفات يقدم الخدمة بأكثر من طريقة.": "An air-conditioning maintenance business that provides the service in more than one way.",
        "منصة تربط بين مزودي الخدمة والعملاء.": "A platform connecting service providers and customers.",
        "منصة تربط بين طرفين.": "A platform connecting two sides.",
        "خدمة سيارات.": "A car service.",
      },
    },
    en: {
      ar: {
        "A service business with more than one delivery approach.": "مشروع خدمي يقدم الخدمة بأكثر من طريقة.",
        "A shop for practical home products.": "متجر لمنتجات منزلية عملية.",
        "A long original idea paragraph with several details.": "وصف أولي طويل للفكرة يتضمن عدة تفاصيل.",
        "Car care service.": "خدمة عناية بالسيارات.",
      },
    },
  },
  coreOffering: {
    ar: {
      en: {
        "فني إصلاح المكيفات و العميل": "Air-conditioning repair technician and the customer",
        "مزودو الخدمة والعملاء": "Service providers and customers",
        "تنظيف وعناية بالسيارات": "Car cleaning and care",
      },
    },
    en: {
      ar: {
        "Car cleaning and care": "تنظيف السيارات والعناية بها",
        "Home products": "منتجات منزلية",
        "Parents and tutors": "أولياء الأمور والمعلمون الخصوصيون",
      },
    },
  },
};

export function createInitialDiscoveryState() {
  return {
    route: INTENT_DISCOVERY_ROUTE,
    journeyState: discoveryJourneyStates.ideaCapture,
    originalIdea: "",
    suggestedIntentOptions: discoveryIntentOptions.map((option) => ({ ...option, suggested: false })),
    selectedIntent: "",
    coreOffering: "",
    coreOfferingStatus: "missing",
    selectedOperatingApproach: "",
    selectedOperatingApproaches: [],
    unresolvedItems: [],
    confirmationStatus: "not_confirmed",
    editingField: "",
    dependencyResets: [],
    confirmedAnswers: {},
  };
}

export function buildDiscoveryState({
  route = INTENT_DISCOVERY_ROUTE,
  journeyState = discoveryJourneyStates.ideaCapture,
  originalIdea = "",
  selectedIntent = "",
  coreOffering = "",
  coreOfferingStatus = "",
  selectedOperatingApproach = "",
  selectedOperatingApproaches = [],
  confirmationStatus = "not_confirmed",
  editingField = "",
  dependencyResets = [],
  confirmedAnswers = {},
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
  const normalizedJourneyState = normalizeDiscoveryJourneyState(journeyState, confirmationStatus);
  return {
    route: normalizeDiscoveryRoute(route),
    journeyState: normalizedJourneyState,
    originalIdea,
    suggestedIntentOptions,
    selectedIntent,
    coreOffering,
    coreOfferingStatus: normalizedCoreOfferingStatus,
    selectedOperatingApproach,
    selectedOperatingApproaches: normalizedOperatingApproaches,
    unresolvedItems,
    confirmationStatus,
    editingField,
    dependencyResets: Array.isArray(dependencyResets) ? [...dependencyResets] : [],
    confirmedAnswers: isPlainObject(confirmedAnswers) ? { ...confirmedAnswers } : {},
  };
}

export function resolveDiscoveryTransition(discoveryState = createInitialDiscoveryState(), targetJourneyState = discoveryJourneyStates.ideaCapture) {
  const currentState = buildDiscoveryState(discoveryState);
  const mappedTarget = legacyStepJourneyStateMap[targetJourneyState] || targetJourneyState;
  if (!Object.values(discoveryJourneyStates).includes(mappedTarget)) {
    return buildTransitionResult(currentState, false, "invalid_journey_state");
  }
  const normalizedTarget = normalizeDiscoveryJourneyState(targetJourneyState, currentState.confirmationStatus);
  if (!isJourneyStateReachable(currentState, normalizedTarget)) {
    return buildTransitionResult(currentState, false, "incomplete_state");
  }
  return buildTransitionResult(buildDiscoveryState({
    ...currentState,
    route: INTENT_DISCOVERY_ROUTE,
    journeyState: normalizedTarget,
  }), true, "");
}

export function applyDiscoveryFieldChange(discoveryState = createInitialDiscoveryState(), fieldId = "", value) {
  if (fieldId === "selectedIntent") {
    const nextIntent = typeof value === "string" ? value : "";
    const preserveOperating = isOperatingApproachStructurallyValid(nextIntent, discoveryState.selectedOperatingApproach);
    const selectedOperatingApproach = preserveOperating ? discoveryState.selectedOperatingApproach : "";
    const dependencyResets = ["coreOffering"];
    if (!preserveOperating && discoveryState.selectedOperatingApproach) dependencyResets.push("selectedOperatingApproach");
    if (selectedOperatingApproach !== "mixed" && discoveryState.selectedOperatingApproaches.length) {
      dependencyResets.push("selectedOperatingApproaches");
    }
    return buildDiscoveryState({
      ...discoveryState,
      journeyState: discoveryJourneyStates.intentSelection,
      selectedIntent: nextIntent,
      coreOffering: "",
      coreOfferingStatus: "missing",
      selectedOperatingApproach,
      selectedOperatingApproaches: selectedOperatingApproach === "mixed" ? discoveryState.selectedOperatingApproaches : [],
      confirmationStatus: "not_confirmed",
      editingField: "selectedIntent",
      dependencyResets,
      confirmedAnswers: {},
    });
  }

  if (fieldId === "coreOffering") {
    const coreOffering = typeof value === "string" ? value : "";
    return buildDiscoveryState({
      ...discoveryState,
      journeyState: discoveryJourneyStates.coreOffering,
      coreOffering,
      coreOfferingStatus: coreOffering.trim() ? "provided" : "missing",
      confirmationStatus: "not_confirmed",
      editingField: "coreOffering",
      dependencyResets: [],
      confirmedAnswers: {},
    });
  }

  if (fieldId === "coreOfferingStatus") {
    return buildDiscoveryState({
      ...discoveryState,
      journeyState: discoveryJourneyStates.coreOffering,
      coreOffering: "",
      coreOfferingStatus: value === "undecided" ? "undecided" : "missing",
      confirmationStatus: "not_confirmed",
      editingField: "coreOffering",
      dependencyResets: [],
      confirmedAnswers: {},
    });
  }

  if (fieldId === "selectedOperatingApproach") {
    const nextApproach = typeof value === "string" ? value : "";
    const clearingMixed = discoveryState.selectedOperatingApproach === "mixed" && nextApproach !== "mixed";
    return buildDiscoveryState({
      ...discoveryState,
      journeyState: discoveryJourneyStates.operatingApproach,
      selectedOperatingApproach: nextApproach,
      selectedOperatingApproaches: nextApproach === "mixed" ? discoveryState.selectedOperatingApproaches : [],
      confirmationStatus: "not_confirmed",
      editingField: "selectedOperatingApproach",
      dependencyResets: clearingMixed && discoveryState.selectedOperatingApproaches.length ? ["selectedOperatingApproaches"] : [],
      confirmedAnswers: {},
    });
  }

  if (fieldId === "selectedOperatingApproaches") {
    return buildDiscoveryState({
      ...discoveryState,
      journeyState: discoveryJourneyStates.mixedOperatingDetail,
      selectedOperatingApproaches: Array.isArray(value) ? value : [],
      confirmationStatus: "not_confirmed",
      editingField: "selectedOperatingApproaches",
      dependencyResets: [],
      confirmedAnswers: {},
    });
  }

  return buildDiscoveryState(discoveryState);
}

export function startDiscoveryFieldEdit(discoveryState = createInitialDiscoveryState(), fieldId = "") {
  if (!confirmationFieldIds.includes(fieldId)) return buildDiscoveryState(discoveryState);
  return buildDiscoveryState({
    ...discoveryState,
    journeyState: confirmationFieldStepMap[fieldId] || discoveryState.journeyState,
    editingField: fieldId,
    confirmationStatus: "not_confirmed",
  });
}

export function buildConfirmationContract(discoveryState = createInitialDiscoveryState()) {
  const fieldValues = {
    selectedIntent: discoveryState.selectedIntent || "",
    coreOffering: discoveryState.coreOfferingStatus === "provided" ? discoveryState.coreOffering : "",
    selectedOperatingApproach: discoveryState.selectedOperatingApproach || "",
    selectedOperatingApproaches: discoveryState.selectedOperatingApproach === "mixed"
      ? [...discoveryState.selectedOperatingApproaches]
      : [],
  };
  const resolvedFields = {
    selectedIntent: Boolean(discoveryState.selectedIntent && !["different", "not_decided"].includes(discoveryState.selectedIntent)),
    coreOffering: discoveryState.coreOfferingStatus === "provided",
    selectedOperatingApproach: Boolean(discoveryState.selectedOperatingApproach && discoveryState.selectedOperatingApproach !== "not_decided"),
    selectedOperatingApproaches: discoveryState.selectedOperatingApproach !== "mixed" || (
      discoveryState.selectedOperatingApproaches.includes("not_decided") ||
      discoveryState.selectedOperatingApproaches.length >= 2
    ),
  };
  const isComplete = Object.values(resolvedFields).every(Boolean) && discoveryState.unresolvedItems.length === 0;
  return {
    fieldValues,
    resolvedFields,
    editingField: discoveryState.editingField || "",
    confirmationStatus: discoveryState.confirmationStatus,
    unresolvedItems: [...discoveryState.unresolvedItems],
    dependencyResetsPerformed: [...discoveryState.dependencyResets],
    confirmedAnswers: isComplete && discoveryState.confirmationStatus === "confirmed"
      ? { ...fieldValues }
      : {},
    isComplete,
  };
}

export function confirmDiscoveryUnderstanding(discoveryState = createInitialDiscoveryState()) {
  const currentState = buildDiscoveryState(discoveryState);
  const contract = buildConfirmationContract(currentState);
  if (!contract.isComplete) {
    return buildDiscoveryState({
      ...currentState,
      confirmationStatus: "not_confirmed",
      editingField: "",
    });
  }
  return buildDiscoveryState({
    ...currentState,
    journeyState: discoveryJourneyStates.understandingConfirmed,
    confirmationStatus: "confirmed",
    editingField: "",
    dependencyResets: [],
    confirmedAnswers: contract.fieldValues,
  });
}

export function reopenDiscoveryConfirmation(discoveryState = createInitialDiscoveryState()) {
  return buildDiscoveryState({
    ...discoveryState,
    journeyState: discoveryJourneyStates.understandingReview,
    confirmationStatus: "not_confirmed",
    editingField: "",
  });
}

export function buildConfirmedDiscoverySnapshot(discoveryState = createInitialDiscoveryState()) {
  const currentState = buildDiscoveryState(discoveryState);
  if (currentState.confirmationStatus !== "confirmed" || !isPlainObject(currentState.confirmedAnswers)) {
    return currentState;
  }
  const snapshot = currentState.confirmedAnswers;
  const coreOffering = typeof snapshot.coreOffering === "string" ? snapshot.coreOffering : currentState.coreOffering;
  const selectedOperatingApproach = typeof snapshot.selectedOperatingApproach === "string"
    ? snapshot.selectedOperatingApproach
    : currentState.selectedOperatingApproach;
  return buildDiscoveryState({
    ...currentState,
    journeyState: discoveryJourneyStates.understandingConfirmed,
    selectedIntent: typeof snapshot.selectedIntent === "string" ? snapshot.selectedIntent : currentState.selectedIntent,
    coreOffering,
    coreOfferingStatus: coreOffering.trim() ? "provided" : currentState.coreOfferingStatus,
    selectedOperatingApproach,
    selectedOperatingApproaches: Array.isArray(snapshot.selectedOperatingApproaches)
      ? [...snapshot.selectedOperatingApproaches]
      : currentState.selectedOperatingApproaches,
    confirmationStatus: "confirmed",
    editingField: "",
    dependencyResets: [],
    confirmedAnswers: {
      ...snapshot,
      selectedOperatingApproaches: Array.isArray(snapshot.selectedOperatingApproaches)
        ? [...snapshot.selectedOperatingApproaches]
        : [],
    },
  });
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
  const steps = [
    discoveryJourneyStates.ideaCapture,
    discoveryJourneyStates.intentSelection,
    discoveryJourneyStates.coreOffering,
    discoveryJourneyStates.operatingApproach,
  ];
  if (discoveryState.selectedOperatingApproach === "mixed") steps.push(discoveryJourneyStates.mixedOperatingDetail);
  steps.push(discoveryJourneyStates.understandingReview);
  return steps;
}

export function getProgressText(discoveryState = createInitialDiscoveryState(), journeyState = discoveryJourneyStates.ideaCapture, language = "en") {
  const content = discoveryContent[language] || discoveryContent.en;
  const steps = getDiscoverySteps(discoveryState);
  const progressJourneyState = normalizeProgressJourneyState(journeyState);
  const current = Math.max(1, steps.indexOf(progressJourneyState) + 1);
  return content.progress.replace("{current}", String(current)).replace("{total}", String(steps.length));
}

export function getJourneyStep(journeyState = discoveryJourneyStates.ideaCapture) {
  return journeyStateStepMap[normalizeDiscoveryJourneyState(journeyState)] || "idea";
}

export function getJourneyStateForStep(step = "idea", discoveryState = createInitialDiscoveryState()) {
  if (step === "summary" && discoveryState.confirmationStatus === "confirmed") {
    return discoveryJourneyStates.understandingConfirmed;
  }
  return legacyStepJourneyStateMap[step] || normalizeDiscoveryJourneyState(step);
}

export function getNextJourneyState(discoveryState = createInitialDiscoveryState(), journeyState = discoveryJourneyStates.ideaCapture) {
  const transition = resolveDiscoveryTransition(
    discoveryState,
    getJourneyStateForStep(getNextStep(discoveryState, getJourneyStep(journeyState)), discoveryState)
  );
  return transition.nextState.journeyState;
}

export function getPreviousJourneyState(discoveryState = createInitialDiscoveryState(), journeyState = discoveryJourneyStates.understandingReview) {
  const transition = resolveDiscoveryTransition(
    discoveryState,
    getJourneyStateForStep(getPreviousStep(discoveryState, getJourneyStep(journeyState)), discoveryState)
  );
  return transition.nextState.journeyState;
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
  const summaryState = buildConfirmedDiscoverySnapshot(discoveryState);
  const intentLabel = content.intentSummaryOptions[summaryState.selectedIntent] || content.intentSummaryOptions.not_decided;
  const coreOfferingLabel = summaryState.coreOfferingStatus === "provided"
    ? summaryState.coreOffering
    : content.placeholders.coreOfferingUndecided;
  const operatingLabel = buildOperatingSummaryLabel(summaryState, content);
  return {
    originalIdea: summaryState.originalIdea,
    intentLabel,
    coreOfferingLabel,
    operatingLabel,
    unresolvedItems: summaryState.unresolvedItems.map((item) => content.unresolved[item] || item),
    confirmationStatus: summaryState.confirmationStatus,
    confirmationContract: buildConfirmationContract(summaryState),
    displayTranslations: {
      originalIdea: buildDisplayTranslation({
        fieldId: "originalIdea",
        value: summaryState.originalIdea,
        targetLanguage: content.language,
      }),
      coreOffering: summaryState.coreOfferingStatus === "provided"
        ? buildDisplayTranslation({
          fieldId: "coreOffering",
          value: summaryState.coreOffering,
          targetLanguage: content.language,
        })
        : buildEmptyDisplayTranslation("coreOffering", content.language),
    },
  };
}

export function detectPrototypeTextLanguage(value = "") {
  const text = String(value);
  if (/[\u0600-\u06FF]/u.test(text)) return "ar";
  if (/[A-Za-z]/u.test(text)) return "en";
  return "unknown";
}

export function buildDisplayTranslation({ fieldId = "", value = "", targetLanguage = "en" } = {}) {
  const text = String(value || "");
  const sourceLanguage = detectPrototypeTextLanguage(text);
  const normalizedTargetLanguage = targetLanguage === "ar" ? "ar" : targetLanguage === "en" ? "en" : "unknown";
  if (!text.trim()) {
    return buildEmptyDisplayTranslation(fieldId, normalizedTargetLanguage, sourceLanguage, "empty");
  }
  if (!["ar", "en"].includes(sourceLanguage) || !["ar", "en"].includes(normalizedTargetLanguage)) {
    return buildEmptyDisplayTranslation(fieldId, normalizedTargetLanguage, sourceLanguage, "unknown_language");
  }
  if (sourceLanguage === normalizedTargetLanguage) {
    return buildEmptyDisplayTranslation(fieldId, normalizedTargetLanguage, sourceLanguage, "same_language");
  }
  const textValue = displayTranslationFixtures[fieldId]?.[sourceLanguage]?.[normalizedTargetLanguage]?.[text] || "";
  return {
    fieldId,
    sourceLanguage,
    targetLanguage: normalizedTargetLanguage,
    shouldDisplay: true,
    status: textValue ? "available" : "unavailable",
    text: textValue,
  };
}

function buildEmptyDisplayTranslation(fieldId = "", targetLanguage = "en", sourceLanguage = "unknown", status = "not_needed") {
  return {
    fieldId,
    sourceLanguage,
    targetLanguage,
    shouldDisplay: false,
    status,
    text: "",
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

function normalizeDiscoveryRoute(route = INTENT_DISCOVERY_ROUTE) {
  return route === INTENT_DISCOVERY_ROUTE ? INTENT_DISCOVERY_ROUTE : INTENT_DISCOVERY_ROUTE;
}

function normalizeDiscoveryJourneyState(journeyState = discoveryJourneyStates.ideaCapture, confirmationStatus = "not_confirmed") {
  const mappedJourneyState = legacyStepJourneyStateMap[journeyState] || journeyState;
  if (!Object.values(discoveryJourneyStates).includes(mappedJourneyState)) {
    return discoveryJourneyStates.ideaCapture;
  }
  if (confirmationStatus === "confirmed" && mappedJourneyState === discoveryJourneyStates.understandingReview) {
    return discoveryJourneyStates.understandingConfirmed;
  }
  if (confirmationStatus !== "confirmed" && mappedJourneyState === discoveryJourneyStates.understandingConfirmed) {
    return discoveryJourneyStates.understandingReview;
  }
  return mappedJourneyState;
}

function normalizeProgressJourneyState(journeyState = discoveryJourneyStates.ideaCapture) {
  const normalizedJourneyState = normalizeDiscoveryJourneyState(journeyState);
  if (normalizedJourneyState === discoveryJourneyStates.understandingConfirmed) {
    return discoveryJourneyStates.understandingReview;
  }
  return normalizedJourneyState;
}

function buildTransitionResult(nextState, ok, blockedReason = "") {
  return {
    ok,
    blockedReason,
    route: INTENT_DISCOVERY_ROUTE,
    nextState: buildDiscoveryState({
      ...nextState,
      route: INTENT_DISCOVERY_ROUTE,
    }),
  };
}

function isJourneyStateReachable(discoveryState, targetJourneyState) {
  if (targetJourneyState === discoveryJourneyStates.ideaCapture) return true;
  if (!discoveryState.originalIdea.trim()) return false;
  if (targetJourneyState === discoveryJourneyStates.intentSelection) return true;
  if (!discoveryState.selectedIntent) return false;
  if (targetJourneyState === discoveryJourneyStates.coreOffering) return true;
  if (!["provided", "undecided"].includes(discoveryState.coreOfferingStatus)) return false;
  if (targetJourneyState === discoveryJourneyStates.operatingApproach) return true;
  if (!discoveryState.selectedOperatingApproach) return false;
  if (targetJourneyState === discoveryJourneyStates.mixedOperatingDetail) {
    return discoveryState.selectedOperatingApproach === "mixed";
  }
  if (targetJourneyState === discoveryJourneyStates.understandingReview) {
    return discoveryState.selectedOperatingApproach !== "mixed" || validateDiscoveryStep(discoveryState, "mixedOperating").ok;
  }
  if (targetJourneyState === discoveryJourneyStates.understandingConfirmed) {
    return discoveryState.confirmationStatus === "confirmed" && buildConfirmationContract(discoveryState).isComplete;
  }
  return false;
}

function normalizeSelectedOperatingApproaches(selectedOperatingApproach = "", selectedOperatingApproaches = []) {
  if (selectedOperatingApproach !== "mixed") return [];
  return selectedOperatingApproaches.filter((item, index, list) => item && list.indexOf(item) === index);
}

function isOperatingApproachStructurallyValid(selectedIntent = "", selectedOperatingApproach = "") {
  if (!selectedOperatingApproach) return true;
  return getOperatingChoices(selectedIntent).some((option) => option.id === selectedOperatingApproach);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildOperatingSummaryLabel(discoveryState, content) {
  if (discoveryState.selectedOperatingApproach === "mixed") {
    if (discoveryState.selectedOperatingApproaches.includes("not_decided") || discoveryState.selectedOperatingApproaches.length < 2) {
      return content.placeholders.operatingUndecided;
    }
    return discoveryState.selectedOperatingApproaches
      .map((item, index) => {
        if (content.language === "en" && index > 0) {
          return content.mixedOperatingJoinOptions?.[item] || content.mixedOperatingOptions[item];
        }
        return content.mixedOperatingOptions[item];
      })
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
