import { createSemanticIntentProvider } from "./semanticIntentProvider.js";
import { SEMANTIC_INTENT_SCHEMA_VERSION } from "./semanticIntentContract.js";

export function createMockSemanticIntentProvider({
  scenario = "valid",
  delayMs = 0,
} = {}) {
  return createSemanticIntentProvider({
    async interpret(request) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (scenario === "error") {
        throw new Error("Configured semantic mock provider error.");
      }
      if (scenario === "timeout") {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      return buildScenarioOutput(request, scenario);
    },
  });
}

export function buildScenarioOutput(request, scenario = "valid") {
  const locale = request.locale === "ar" ? "ar" : "en";
  const valid = buildValidOutput(request);

  if (scenario === "valid" || scenario === "valid_en" || scenario === "valid_ar") {
    if (scenario === "valid_ar" || scenario === "valid_en") return buildFixtureValidOutput(request);
    return valid;
  }
  if (scenario === "low_confidence_ambiguity") {
    return {
      ...valid,
      intentHypotheses: valid.intentHypotheses.map((hypothesis) => ({
        ...hypothesis,
        confidence: "low",
        requiresConfirmation: true,
      })),
      ambiguities: [
        {
          id: "intent_ambiguous",
          label: locale === "ar" ? "قد تنتمي الفكرة إلى أكثر من وصف عام." : "The idea may fit more than one general description.",
          requiresConfirmation: true,
        },
      ],
      reasonCodes: ["mock_low_confidence"],
    };
  }
  if (scenario === "invalid_schema_version") {
    return { ...valid, schemaVersion: "invalid_version" };
  }
  if (scenario === "too_many_hypotheses") {
    return {
      ...valid,
      intentHypotheses: [
        ...valid.intentHypotheses,
        createHypothesis(request, 2),
        createHypothesis(request, 3),
        createHypothesis(request, 4),
        createHypothesis(request, 5),
      ],
    };
  }
  if (scenario === "duplicate_ids") {
    return {
      ...valid,
      intentHypotheses: [
        valid.intentHypotheses[0],
        { ...valid.intentHypotheses[1], id: valid.intentHypotheses[0].id },
      ],
    };
  }
  if (scenario === "unsupported_taxonomy_id") {
    return {
      ...valid,
      intentHypotheses: [
        { ...valid.intentHypotheses[0], intentId: "unsupported_sector" },
        valid.intentHypotheses[1],
      ],
    };
  }
  if (scenario === "internal_id_label") {
    return {
      ...valid,
      intentHypotheses: [
        { ...valid.intentHypotheses[0], label: "marketplace_platform" },
        valid.intentHypotheses[1],
      ],
    };
  }
  if (scenario === "forbidden_authority_fields") {
    return {
      ...valid,
      route: "normal_evaluation",
      score: 82,
      paymentDecision: "paid_report",
      eligibilityDecision: "eligible",
    };
  }
  if (scenario === "unsupported_claim") {
    return {
      ...valid,
      conciseReflection: locale === "ar"
        ? "يبدو أن المشروع يحتاج إلى رأس مال 50000 ريال وترخيص مطلوب."
        : "The project likely needs SAR 50,000 and a required license.",
    };
  }
  if (scenario === "ungrounded_fact") {
    return {
      ...valid,
      extractedFacts: [
        {
          id: "fake_fact",
          label: locale === "ar" ? "لديك عشرة عملاء حاليين." : "You already have ten customers.",
          sourceField: "originalIdea",
          sourceText: "ten existing customers",
          evidenceStrength: "strong",
        },
      ],
    };
  }
  if (scenario === "safety_signal_only") {
    return {
      ...valid,
      safetySignals: [
        {
          id: "sensitive_activity",
          label: locale === "ar" ? "تحتاج الفكرة إلى مراجعة أهلية لاحقة." : "The idea may need later eligibility review.",
          severity: "medium",
        },
      ],
      reasonCodes: ["mock_safety_signal"],
    };
  }
  if (scenario === "safety_signal_decision") {
    return {
      ...valid,
      safetySignals: [
        {
          id: "eligibility_decision",
          decision: "ineligible",
          label: locale === "ar" ? "غير مؤهل" : "Ineligible",
        },
      ],
    };
  }
  if (scenario === "low_confidence_without_confirmation") {
    return {
      ...valid,
      intentHypotheses: valid.intentHypotheses.map((hypothesis) => ({
        ...hypothesis,
        confidence: "low",
        requiresConfirmation: false,
      })),
    };
  }
  return valid;
}

function buildValidOutput(request) {
  const locale = request.locale === "ar" ? "ar" : "en";
  return {
    schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
    locale,
    conciseReflection: locale === "ar"
      ? "أفهم أن لديك فكرة تحتاج إلى تحديد دور المشروع قبل الأسئلة التالية."
      : "I understand that the idea needs a clearer business role before the next questions.",
    intentHypotheses: [
      createHypothesis(request, 0),
      createHypothesis(request, 1),
    ],
    ambiguities: [],
    recommendedNextQuestion: {
      id: "confirm_intent",
      targetField: "selectedIntent",
      question: locale === "ar" ? "أي وصف أقرب لطريقة عمل المشروع؟" : "Which description is closest to how the business works?",
      answerType: "single_choice",
      options: (request.allowedTaxonomyOptions || []).slice(0, 3).map((option) => ({
        id: option.id,
        label: option.label,
      })),
      whyItMatters: locale === "ar"
        ? "يساعد هذا على اختيار الأسئلة التالية من دون تخمين."
        : "This helps choose the next questions without guessing.",
      blocksProgress: true,
    },
    extractedFacts: [
      {
        id: "original_idea_present",
        label: locale === "ar" ? "قدّم المستخدم وصفاً أولياً للفكرة." : "The user provided an initial idea description.",
        sourceField: "originalIdea",
        sourceText: request.originalIdea || "",
        evidenceStrength: "medium",
      },
    ],
    inferredNeedsConfirmation: [
      {
        id: "intent_needs_confirmation",
        label: locale === "ar" ? "دور المشروع يحتاج إلى تأكيد." : "The business role needs confirmation.",
        sourceField: "originalIdea",
        sourceText: request.originalIdea || "",
        evidenceStrength: "weak",
      },
    ],
    unresolvedItems: [
      {
        id: "intent_unresolved",
        label: locale === "ar" ? "الوصف العام للمشروع غير مؤكد بعد." : "The general business description is not confirmed yet.",
      },
    ],
    safetySignals: [],
    reasonCodes: ["mock_valid_semantic_intent"],
  };
}

function buildFixtureValidOutput(request) {
  const locale = request.locale === "ar" ? "ar" : "en";
  const optionById = new Map((request.allowedTaxonomyOptions || []).map((option) => [option.id, option]));
  const fixtureOrder = ["service", "marketplace", "retail"];
  return {
    schemaVersion: SEMANTIC_INTENT_SCHEMA_VERSION,
    locale,
    conciseReflection: locale === "ar"
      ? "يبدو أن الوصف يشير إلى مشروع يحتاج إلى تأكيد طريقة تقديم القيمة للعميل قبل المتابعة."
      : "The description points to a business idea that needs confirmation of how value is delivered before continuing.",
    intentHypotheses: fixtureOrder
      .map((intentId, index) => {
        const option = optionById.get(intentId);
        if (!option) return null;
        return {
          id: `fixture_hypothesis_${index + 1}`,
          intentId,
          label: option.label,
          rationale: locale === "ar"
            ? buildArabicFixtureRationale(intentId)
            : buildEnglishFixtureRationale(intentId),
          confidence: index === 0 ? "medium" : "low",
          groundingRefs: request.originalIdea ? [{ sourceField: "originalIdea", sourceText: request.originalIdea }] : [],
          requiresConfirmation: true,
        };
      })
      .filter(Boolean),
    ambiguities: [
      {
        id: "delivery_model_needs_confirmation",
        label: locale === "ar"
          ? "طريقة تقديم الخدمة أو القيمة تحتاج إلى تأكيد المستخدم."
          : "The delivery model still needs user confirmation.",
        requiresConfirmation: true,
      },
    ],
    recommendedNextQuestion: {
      id: "confirm_intent",
      targetField: "selectedIntent",
      question: locale === "ar" ? "أي وصف أقرب إلى ما تقصده؟" : "Which description is closest to what you mean?",
      answerType: "single_choice",
      options: fixtureOrder
        .map((intentId) => optionById.get(intentId))
        .filter(Boolean)
        .map((option) => ({ id: option.id, label: option.label })),
      whyItMatters: locale === "ar"
        ? "اختيار الوصف الصحيح يحدد السؤال التالي من دون افتراضات."
        : "Choosing the right description selects the next question without assumptions.",
      blocksProgress: true,
    },
    extractedFacts: [
      {
        id: "original_idea_present",
        label: locale === "ar" ? "قدّم المستخدم وصفاً أولياً للفكرة." : "The user provided an initial idea description.",
        sourceField: "originalIdea",
        sourceText: request.originalIdea || "",
        evidenceStrength: "medium",
      },
    ],
    inferredNeedsConfirmation: [
      {
        id: "intent_and_delivery_need_confirmation",
        label: locale === "ar"
          ? "دور المشروع وطريقة تقديمه يحتاجان إلى تأكيد."
          : "The business role and delivery approach need confirmation.",
        sourceField: "originalIdea",
        sourceText: request.originalIdea || "",
        evidenceStrength: "weak",
      },
    ],
    unresolvedItems: [
      {
        id: "intent_unresolved",
        label: locale === "ar" ? "الوصف الأقرب للمشروع يحتاج إلى اختيار المستخدم." : "The closest business description needs the user's choice.",
      },
    ],
    safetySignals: [],
    reasonCodes: ["mock_fixture_valid_semantic_intent"],
  };
}

function buildArabicFixtureRationale(intentId) {
  if (intentId === "service") return "قد يكون المشروع خدمة مباشرة إذا كان العميل يحصل على عناية أو إنجاز محدد.";
  if (intentId === "marketplace") return "قد يكون منصة إذا كان الهدف ربط طرفين يحتاج كل منهما إلى الآخر.";
  if (intentId === "retail") return "قد يتضمن بيع منتجات إذا كان جزء من القيمة قائماً على سلع أو مستلزمات.";
  return "هذا احتمال يحتاج إلى تأكيد المستخدم.";
}

function buildEnglishFixtureRationale(intentId) {
  if (intentId === "service") return "It may be a direct service if the customer receives a specific task or care outcome.";
  if (intentId === "marketplace") return "It may be a platform if the goal is to connect two sides that need each other.";
  if (intentId === "retail") return "It may include product sales if part of the value depends on goods or supplies.";
  return "This possibility needs user confirmation.";
}

function createHypothesis(request, index) {
  const locale = request.locale === "ar" ? "ar" : "en";
  const options = request.allowedTaxonomyOptions || [];
  const option = options[index % Math.max(1, options.length)] || {
    id: "service",
    label: locale === "ar" ? "أقدم خدمة للعميل" : "I provide a service to the customer",
  };
  return {
    id: `hypothesis_${index + 1}`,
    intentId: option.id,
    label: option.label,
    rationale: locale === "ar"
      ? "هذا احتمال يحتاج إلى تأكيد من المستخدم بناءً على وصفه الأولي."
      : "This is a candidate that needs user confirmation based on the initial description.",
    confidence: index === 0 ? "medium" : "low",
    groundingRefs: request.originalIdea ? [{ sourceField: "originalIdea", sourceText: request.originalIdea }] : [],
    requiresConfirmation: true,
  };
}
