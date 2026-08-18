import { validateForExecution } from "./analyzer.js";
import { evaluateIdeaEligibility } from "../../../core/eligibilityPolicy.js";
import { buildFeasibilityFoundation, buildGuidedFeasibilityFlow } from "./feasibilityFoundation.js";
import {
  assessBusinessIdeaRequest,
  industrialClarificationFields,
  industrialClarificationSteps,
} from "./requestUnderstanding.js";

const ROUTES = {
  VALIDATION_ERROR: "validation_error",
  INELIGIBLE: "ineligible",
  NEEDS_CLARIFICATION: "needs_clarification",
  GUIDED_FOLLOW_UP: "guided_follow_up",
  RESEARCH_REQUIRED: "research_required",
  SPECIALIST_ANALYSIS: "specialist_analysis",
  NORMAL_EVALUATION: "normal_evaluation",
  FREE_PREVIEW: "free_preview",
  PAID_REPORT_READY: "paid_report_ready",
  PAID_REPORT_BLOCKED: "paid_report_blocked",
};

export const BIV_ROUTE_PRECEDENCE = [
  ROUTES.VALIDATION_ERROR,
  ROUTES.INELIGIBLE,
  ROUTES.NEEDS_CLARIFICATION,
  ROUTES.GUIDED_FOLLOW_UP,
  ROUTES.RESEARCH_REQUIRED,
  ROUTES.SPECIALIST_ANALYSIS,
  ROUTES.NORMAL_EVALUATION,
];

export const BIV_FUTURE_ROUTES = [
  ROUTES.FREE_PREVIEW,
  ROUTES.PAID_REPORT_READY,
  ROUTES.PAID_REPORT_BLOCKED,
];

const routeText = {
  en: {
    validation_error: "Required input is missing before a reliable decision path can be chosen.",
    ineligible: "The idea cannot be evaluated because it conflicts with the eligibility policy.",
    policy_clarification: "The idea needs policy clarification before evaluation can continue.",
    guided_follow_up: "The idea needs short structured follow-up answers before scoring.",
    specialist_analysis: "The idea matches a confirmed specialist analysis path.",
    specialist_clarification: "The idea matches a specialist path, but required specialist details are missing.",
    normal_evaluation: "The idea has enough information for the standard validator.",
    classification_confirmation: "The project type is not certain enough for specialist questions yet.",
  },
  ar: {
    validation_error: "توجد مدخلات أساسية ناقصة قبل اختيار مسار تقييم موثوق.",
    ineligible: "لا يمكن تقييم الفكرة لأنها تتعارض مع سياسة الأهلية.",
    policy_clarification: "تحتاج الفكرة إلى توضيح متعلق بالسياسة قبل متابعة التقييم.",
    guided_follow_up: "تحتاج الفكرة إلى إجابات متابعة قصيرة ومنظمة قبل إصدار درجة.",
    specialist_analysis: "الفكرة تطابق مسار تحليل متخصص مؤكد.",
    specialist_clarification: "الفكرة تطابق مساراً متخصصاً، لكن تفاصيله المطلوبة ما زالت ناقصة.",
    normal_evaluation: "تحتوي الفكرة على معلومات كافية لمسار التقييم العام.",
    classification_confirmation: "نوع المشروع غير مؤكد بما يكفي لعرض أسئلة متخصصة بعد.",
  },
};

const correctionOptions = new Set([
  "industrial_manufacturing",
  "service",
  "retail_trading",
  "digital_software",
  "marketplace_platform",
  "generic",
]);

const validatorSourceFields = [
  "businessIdea",
  "businessName",
  "industry",
  "targetCustomer",
  "problem",
  "problemSolved",
  "currentSolution",
  "competitiveAdvantage",
  "monetization",
  "revenueModel",
  "stage",
];

const signalPatterns = {
  sector: {
    recycling: [
      { pattern: /\b(recycling|recycle|recycled|waste processing)\b/i, concept: "recycling", weight: 3 },
      { pattern: /(إعادة تدوير|اعادة تدوير|إعادة التصنيع|اعادة التصنيع|تدوير)/u, concept: "recycling", weight: 3 },
    ],
    healthcare: [
      { pattern: /\b(clinic|medical|healthcare|patient|doctor|nurse|therapy|treatment)\b/i, concept: "healthcare", weight: 2 },
      { pattern: /(عيادة|طبي|صحي|مرضى|مريض|طبيب|ممرض|علاج|تأهيل)/u, concept: "healthcare", weight: 2 },
    ],
    food: [
      { pattern: /\b(restaurant|food|meal|kitchen|cafe|catering)\b/i, concept: "food", weight: 2 },
      { pattern: /(مطعم|طعام|وجبات|مطبخ|مقهى|تموين|إعاشة)/u, concept: "food", weight: 2 },
    ],
    automotive: [
      { pattern: /\b(car wash|vehicle|car|auto|automotive|garage|workshop)\b/i, concept: "automotive", weight: 2 },
      { pattern: /(مغسلة سيارات|سيارات|مركبات|ورشة سيارات|كراج)/u, concept: "automotive", weight: 2 },
    ],
    construction: [
      { pattern: /\b(construction|contractor|renovation|building|maintenance)\b/i, concept: "construction_services", weight: 2 },
      { pattern: /(مقاول|مقاولات|ترميم|بناء|صيانة)/u, concept: "construction_services", weight: 2 },
    ],
  },
  businessType: {
    marketplace_platform: [
      { pattern: /\b(marketplace|platform connects|connects .* with|two-sided|providers and buyers|sellers and buyers|listing)\b/i, concept: "marketplace_platform", weight: 4 },
      { pattern: /(منصة تربط|يربط .* مع|سوق|طرفين|مقدمي الخدمة والعملاء|البائعين والمشترين)/u, concept: "marketplace_platform", weight: 4 },
    ],
    digital_software: [
      { pattern: /\b(software|saas|app|application|dashboard|automation|api|digital tool|mobile app|web app|workflow tool)\b/i, concept: "digital_software", weight: 4 },
      { pattern: /(برمج|تطبيق|لوحة تحكم|أتمتة|اتمتة|أداة رقمية|منصة رقمية|واجهة برمجة|برنامج)/u, concept: "digital_software", weight: 4 },
    ],
    industrial_manufacturing: [
      { pattern: /\b(factory|plant|manufacturing|industrial|production line|fabrication|assembly line)\b/i, concept: "industrial_manufacturing", weight: 3 },
      { pattern: /(مصنع|معمل|تصنيع|صناعي|خط إنتاج|خط انتاج|إنتاج صناعي|انتاج صناعي)/u, concept: "industrial_manufacturing", weight: 3 },
    ],
    retail_trading: [
      { pattern: /\b(retail|shop|store|ecommerce|e-commerce|trading|import|export|wholesale|resell)\b/i, concept: "retail_trading", weight: 3 },
      { pattern: /(متجر|تجزئة|تجارة|استيراد|تصدير|جملة|بيع منتجات|بيع بالتجزئة)/u, concept: "retail_trading", weight: 3 },
    ],
    service: [
      { pattern: /\b(service|consulting|agency|clinic|restaurant|maintenance|repair|delivery|cleaning|washing|coaching|training|professional service|car wash)\b/i, concept: "service", weight: 3 },
      { pattern: /(خدمة|استشارة|وكالة|عيادة|مطعم|صيانة|إصلاح|اصلاح|توصيل|تنظيف|غسيل|مغسلة|تدريب|خدمات مهنية)/u, concept: "service", weight: 3 },
    ],
  },
  operatingModel: {
    fixed_site: [
      { pattern: /\b(location|site|premises|shop|store|clinic|restaurant|factory|workshop|car wash|laundry)\b/i, concept: "fixed_site", weight: 2 },
      { pattern: /(موقع|مقر|محل|متجر|عيادة|مطعم|مصنع|ورشة|مغسلة|مستودع)/u, concept: "fixed_site", weight: 2 },
    ],
    mobile: [
      { pattern: /\b(mobile|on-site|at home|delivery)\b/i, concept: "mobile", weight: 2 },
      { pattern: /(متنقل|في المنزل|للمنازل|توصيل|ميداني)/u, concept: "mobile", weight: 2 },
    ],
    digital: [
      { pattern: /\b(online|web|app|software|saas|digital)\b/i, concept: "digital", weight: 2 },
      { pattern: /(أونلاين|اونلاين|تطبيق|برمج|رقمي|إلكتروني|الكتروني)/u, concept: "digital", weight: 2 },
    ],
  },
  assetIntensity: {
    high: [
      { pattern: /\b(factory|plant|machinery|machine|equipment|vehicle workshop|car wash|laundry|production line)\b/i, concept: "asset_intensive", weight: 2 },
      { pattern: /(مصنع|معدات|مكائن|آلات|ورشة|مغسلة|خط إنتاج|خط انتاج)/u, concept: "asset_intensive", weight: 2 },
    ],
  },
  customerModel: {
    two_sided: [
      { pattern: /\b(connects .* with|marketplace|two-sided|providers and buyers|sellers and buyers)\b/i, concept: "two_sided", weight: 3 },
      { pattern: /(يربط .* مع|منصة تربط|طرفين|مقدمي الخدمة والعملاء|البائعين والمشترين)/u, concept: "two_sided", weight: 3 },
    ],
    b2b: [
      { pattern: /\b(businesses|companies|clinics|restaurants|factories|contractors|offices|enterprise)\b/i, concept: "b2b", weight: 2 },
      { pattern: /(شركات|منشآت|عيادات|مطاعم|مصانع|مقاولين|مكاتب|أعمال)/u, concept: "b2b", weight: 2 },
    ],
    b2c: [
      { pattern: /\b(consumers|families|parents|drivers|homeowners|patients|individuals)\b/i, concept: "b2c", weight: 2 },
      { pattern: /(أفراد|أسر|عوائل|سائقين|أصحاب المنازل|مرضى|عملاء أفراد)/u, concept: "b2c", weight: 2 },
    ],
  },
};

const specialistRegistry = [
  {
    id: "pet_plastic_recycling",
    label: { en: "plastic recycling assessment", ar: "تقييم إعادة تدوير البلاستيك" },
    requires: {
      plastic: [
        /\b(PET|HDPE|LDPE|PP|plastic|plastic waste|bottle recycler)\b/i,
        /(PET|HDPE|LDPE|PP|بلاستيك|البلاستيك|مخلفات البلاستيك|عبوات بلاستيكية)/u,
      ],
      recycling: [
        /\b(recycling|recycle|recycled|waste processing|flakes|pellets|granules|baled)\b/i,
        /(إعادة تدوير|اعادة تدوير|تدوير|رقائق|حبيبات|جرانول|مفروز|مكبس)/u,
      ],
    },
  },
];

export function orchestrateBusinessIdeaValidation({
  rawInput = {},
  language = "en",
  industrialDetails = {},
  feasibilityAnswers = {},
} = {}) {
  const lang = language === "ar" ? "ar" : "en";
  const { analysis, validation } = validateForExecution(rawInput, lang);
  const classification = classifyValidatorRequest(rawInput, {
    language: lang,
    details: { ...industrialDetails, ...feasibilityAnswers },
  });
  const validationDecision = buildValidationDecision({ rawInput, analysis, validation, classification, language: lang });

  if (validationDecision) return validationDecision;

  const eligibility = evaluateIdeaEligibility(rawInput, lang);
  if (eligibility.status !== "eligible") {
    const route = eligibility.status === "ineligible" ? ROUTES.INELIGIBLE : ROUTES.NEEDS_CLARIFICATION;
    return buildDecision({
      route,
      reasonCode: eligibility.status === "ineligible" ? "ethical_policy_ineligible" : "policy_or_financing_clarification",
      reasonText: routeText[lang][eligibility.status === "ineligible" ? "ineligible" : "policy_clarification"],
      language: lang,
      classification,
      analysis,
      validation,
      eligibility,
      missingInformation: [],
      nextRequiredAction: eligibility.presentation?.closing || eligibility.message,
    });
  }

  const foundation = buildFeasibilityFoundation(rawInput, lang, {
    details: { ...industrialDetails, ...feasibilityAnswers },
    businessTypeOverride: classification.businessType,
  });
  const hasTruncatedInput = sourceHasTruncatedPhrase(rawInput);

  const specialist = matchSpecialist(classification);
  if (specialist?.confidence === "high" && !hasTruncatedInput) {
    const requestAssessment = assessBusinessIdeaRequest(rawInput, lang, industrialDetails);
    if (requestAssessment.status === "ready_for_industrial_analysis") {
      return buildDecision({
        route: ROUTES.SPECIALIST_ANALYSIS,
        reasonCode: "confirmed_specialist_ready",
        reasonText: routeText[lang].specialist_analysis,
        language: lang,
        classification,
        analysis,
        validation,
        feasibilityFoundation: foundation,
        requestAssessment,
        matchedSpecialist: specialist,
        missingInformation: [],
        nextRequiredAction: lang === "ar" ? "إعداد التحليل المتخصص." : "Prepare specialist analysis.",
      });
    }

    if (requestAssessment.status === "needs_clarification") {
      return buildDecision({
        route: ROUTES.NEEDS_CLARIFICATION,
        reasonCode: "confirmed_specialist_missing_information",
        reasonText: routeText[lang].specialist_clarification,
        language: lang,
        classification,
        analysis,
        validation,
        feasibilityFoundation: foundation,
        requestAssessment,
        matchedSpecialist: specialist,
        missingInformation: requestAssessment.missingFields || [],
        nextRequiredAction: requestAssessment.presentation?.closing || requestAssessment.message,
      });
    }

    const specialistAssessment = buildSpecialistClarificationAssessment({
      specialist,
      industrialDetails,
      language: lang,
    });
    if (specialistAssessment.status === "ready_for_industrial_analysis") {
      return buildDecision({
        route: ROUTES.SPECIALIST_ANALYSIS,
        reasonCode: "confirmed_specialist_ready",
        reasonText: routeText[lang].specialist_analysis,
        language: lang,
        classification,
        analysis,
        validation,
        feasibilityFoundation: foundation,
        requestAssessment: specialistAssessment,
        matchedSpecialist: specialist,
        missingInformation: [],
        nextRequiredAction: lang === "ar" ? "إعداد التحليل المتخصص." : "Prepare specialist analysis.",
      });
    }

    return buildDecision({
      route: ROUTES.NEEDS_CLARIFICATION,
      reasonCode: "confirmed_specialist_missing_information",
      reasonText: routeText[lang].specialist_clarification,
      language: lang,
      classification,
      analysis,
      validation,
      feasibilityFoundation: foundation,
      requestAssessment: specialistAssessment,
      matchedSpecialist: specialist,
      missingInformation: specialistAssessment.missingFields || [],
      nextRequiredAction: specialistAssessment.presentation?.closing || specialistAssessment.message,
    });
  }

  const classificationPrompt = shouldAskForClassificationConfirmation(classification, specialist, feasibilityAnswers, validation)
    ? buildClassificationPrompt(classification, specialist, lang)
    : null;

  const guidedFeasibility = buildGuidedFeasibilityFlow(rawInput, lang, {
    foundation,
    answers: feasibilityAnswers,
    validation,
    classificationPrompt,
    forceGuide: hasTruncatedInput,
  });

  if (guidedFeasibility.shouldGuide) {
    return buildDecision({
      route: ROUTES.GUIDED_FOLLOW_UP,
      reasonCode: hasTruncatedInput
        ? "incomplete_source_text"
        : classificationPrompt
          ? "classification_confirmation_required"
          : "guided_feasibility_required",
      reasonText: routeText[lang][classificationPrompt ? "classification_confirmation" : "guided_follow_up"],
      language: lang,
      classification,
      analysis,
      validation,
      feasibilityFoundation: foundation,
      guidedFeasibility,
      missingInformation: guidedFeasibility.missingFieldIds || [],
      nextRequiredAction: guidedFeasibility.presentation?.closing || guidedFeasibility.message,
    });
  }

  return buildDecision({
    route: ROUTES.NORMAL_EVALUATION,
    reasonCode: "standard_validator_ready",
    reasonText: routeText[lang].normal_evaluation,
    language: lang,
    classification,
    analysis,
    validation,
    feasibilityFoundation: foundation,
    missingInformation: [],
    nextRequiredAction: lang === "ar" ? "إصدار التقييم العام." : "Run the standard evaluation.",
  });
}

export function classifyValidatorRequest(rawInput = {}, options = {}) {
  const language = options.language === "ar" ? "ar" : "en";
  const sourceFields = buildSourceFields(rawInput, options.details);
  const fieldSignals = collectFieldSignals(sourceFields);
  const originalSourceFields = buildSourceFields(rawInput, {}, { includeDetails: false });
  const specialistCandidate = matchSpecialistFromSourceFields(originalSourceFields, language);
  const correction = String(options.details?.projectTypeCorrection || "").trim();
  const scores = scoreConcepts(fieldSignals, "businessType");
  const correctedType = correctionOptions.has(correction) ? correction : "";
  const businessType = correctedType || chooseBusinessType(scores);
  const businessTypeScore = scores[businessType] || 0;
  const operatingModel = chooseConcept(scoreConcepts(fieldSignals, "operatingModel"), "unspecified");
  const assetIntensity = scoreConcepts(fieldSignals, "assetIntensity").high ? "high" : businessType === "industrial_manufacturing" ? "high" : "moderate";
  const customerModel = chooseConcept(scoreConcepts(fieldSignals, "customerModel"), "unspecified");
  const sectorScores = scoreConcepts(fieldSignals, "sector");
  const sectorSignals = Object.entries(sectorScores)
    .filter(([, score]) => score > 0)
    .map(([sector, score]) => ({ sector, score }));
  const confidence = correctedType
    ? "confirmed_by_user"
    : businessTypeScore >= 4
      ? "high"
      : businessTypeScore >= 2
        ? "medium"
        : "low";
  return {
    businessType,
    operatingModel,
    assetIntensity,
    customerModel,
    projectStage: rawInput.stage || options.details?.projectStageIntent || "idea",
    sectorSignals,
    classificationConfidence: confidence,
    matchedSpecialist: specialistCandidate?.confidence === "high" ? specialistCandidate : null,
    specialistCandidate,
    fieldSignals,
    correctionApplied: Boolean(correctedType),
  };
}

function buildValidationDecision({ rawInput, analysis, validation, classification, language }) {
  const ideaSeed = String(rawInput.businessIdea || rawInput.businessName || "").trim();
  if (!validation.ok && ideaSeed.length < 5) {
    return buildDecision({
      route: ROUTES.VALIDATION_ERROR,
      reasonCode: "required_input_missing",
      reasonText: routeText[language].validation_error,
      language,
      classification,
      analysis,
      validation,
      missingInformation: validation.errors?.map((error) => error.field) || [],
      nextRequiredAction: language === "ar" ? "أضف وصفاً مختصراً للفكرة." : "Add a short description of the idea.",
    });
  }

  return null;
}

function buildDecision({
  route,
  reasonCode,
  reasonText,
  language,
  classification,
  analysis,
  validation,
  eligibility,
  feasibilityFoundation,
  guidedFeasibility,
  requestAssessment,
  matchedSpecialist,
  missingInformation = [],
  nextRequiredAction = "",
}) {
  const normalizedRoute = Object.values(ROUTES).includes(route) ? route : ROUTES.NORMAL_EVALUATION;
  const eligibilityStatus = eligibility?.status || "eligible";
  const specialistCandidate = classification.specialistCandidate || null;
  const confirmedSpecialist = matchedSpecialist || classification.matchedSpecialist || null;
  const actions = buildActionPolicy({ route: normalizedRoute, guidedFeasibility, requestAssessment });
  const diagnosticReasonCodes = [
    reasonCode,
    eligibilityStatus !== "eligible" ? eligibilityStatus : "",
    classification.classificationConfidence ? `classification_${classification.classificationConfidence}` : "",
    confirmedSpecialist ? "specialist_confirmed" : "",
    specialistCandidate && !confirmedSpecialist ? "specialist_candidate_unconfirmed" : "",
  ].filter(Boolean);

  return {
    route: normalizedRoute,
    routePrecedence: BIV_ROUTE_PRECEDENCE,
    reasonCode,
    reasonText,
    diagnosticReasonCodes,
    locale: language,
    language,
    direction: language === "ar" ? "rtl" : "ltr",
    eligibilityStatus,
    businessType: classification.businessType,
    operatingModel: classification.operatingModel,
    sectorSignals: classification.sectorSignals,
    classificationConfidence: classification.classificationConfidence,
    specialistCandidate,
    matchedSpecialist: confirmedSpecialist,
    specialistEligible: Boolean(confirmedSpecialist),
    userContext: buildUserContext({ analysis, classification, feasibilityFoundation, guidedFeasibility, requestAssessment }),
    missingInformation,
    requiredMissingInformation: missingInformation,
    optionalRefinementInformation: feasibilityFoundation?.optionalQuestions?.map((question) => question.category) || [],
    evidenceState: buildEvidenceState(feasibilityFoundation, guidedFeasibility),
    nextRequiredAction,
    allowedActions: actions.allowedActions,
    blockedActions: actions.blockedActions,
    messageKey: reasonCode,
    userFacingMessage: reasonText,
    analysisPayload: [ROUTES.SPECIALIST_ANALYSIS, ROUTES.NORMAL_EVALUATION].includes(normalizedRoute)
      ? { permitted: true, route: normalizedRoute }
      : null,
    futureRoutes: BIV_FUTURE_ROUTES.map((futureRoute) => ({
      route: futureRoute,
      implemented: false,
    })),
    classification,
    analysis,
    validation,
    eligibility,
    feasibilityFoundation,
    guidedFeasibility,
    requestAssessment,
  };
}

function buildUserContext({ analysis, classification, feasibilityFoundation, guidedFeasibility, requestAssessment }) {
  const input = analysis?.input || {};
  return {
    projectStage: classification.projectStage || input.stage || "idea",
    userProfile: guidedFeasibility?.userProfile || null,
    requestType: requestAssessment?.requestType || "business_idea",
    originalInputKeys: Object.keys(input).filter((key) => String(input[key] || "").trim()),
    feasibilityBusinessType: feasibilityFoundation?.businessType || classification.businessType,
  };
}

function buildEvidenceState(feasibilityFoundation, guidedFeasibility) {
  if (!feasibilityFoundation) {
    return {
      available: false,
      categories: [],
      missingRequired: [],
      estimateReadiness: null,
      guidedStatus: "not_requested",
    };
  }

  return {
    available: true,
    categories: feasibilityFoundation.categories?.map((item) => ({
      category: item.category,
      evidenceType: item.evidenceType,
      required: Boolean(item.required),
    })) || [],
    missingRequired: feasibilityFoundation.missingRequired || [],
    estimateReadiness: feasibilityFoundation.estimateReadiness || null,
    guidedStatus: guidedFeasibility?.status || "not_requested",
  };
}

function buildActionPolicy({ route, guidedFeasibility, requestAssessment }) {
  const canClarify = Boolean(guidedFeasibility?.clarificationFlow || requestAssessment?.clarificationFlow);
  const allowedByRoute = {
    [ROUTES.VALIDATION_ERROR]: ["edit_input"],
    [ROUTES.INELIGIBLE]: ["reset"],
    [ROUTES.NEEDS_CLARIFICATION]: canClarify ? ["answer_clarification", "reset"] : ["reset"],
    [ROUTES.GUIDED_FOLLOW_UP]: ["answer_followup", "reset"],
    [ROUTES.RESEARCH_REQUIRED]: ["edit_input", "reset"],
    [ROUTES.SPECIALIST_ANALYSIS]: ["copy_report", "download_report", "reset"],
    [ROUTES.NORMAL_EVALUATION]: ["copy_report", "download_report", "reset"],
  };
  const allowedActions = allowedByRoute[route] || ["reset"];
  const blockedActions = ["score", "report", "copy_report", "download_report"].filter((action) => {
    if (action === "score" || action === "report") {
      return ![ROUTES.SPECIALIST_ANALYSIS, ROUTES.NORMAL_EVALUATION].includes(route);
    }
    return !allowedActions.includes(action);
  });

  return { allowedActions, blockedActions };
}

function buildSourceFields(rawInput = {}, details = {}, options = {}) {
  const includeDetails = options.includeDetails !== false;
  return validatorSourceFields
    .map((field) => ({ field, value: String(rawInput[field] || "").trim() }))
    .filter((item) => item.value)
    .concat(includeDetails ? (
      Object.entries(details || {})
        .filter(([, value]) => typeof value === "string" && value.trim())
        .map(([field, value]) => ({ field, value: String(value).trim(), detail: true }))
    ) : []);
}

function sourceHasTruncatedPhrase(rawInput = {}) {
  return validatorSourceFields.some((field) => /\.{3}|…/.test(String(rawInput[field] || "")));
}

function collectFieldSignals(sourceFields = []) {
  const signals = [];
  for (const source of sourceFields) {
    for (const [group, concepts] of Object.entries(signalPatterns)) {
      for (const [concept, patterns] of Object.entries(concepts)) {
        for (const item of patterns) {
          if (item.pattern.test(source.value)) {
            signals.push({
              sourceField: source.field,
              matchedConcept: item.concept || concept,
              group,
              concept,
              weight: item.weight,
              reason: `${source.field} matched ${item.concept || concept}`,
              rawValue: source.value,
              isDetail: Boolean(source.detail),
            });
          }
        }
      }
    }
  }
  return signals;
}

function scoreConcepts(signals = [], group) {
  return signals
    .filter((signal) => signal.group === group)
    .reduce((scores, signal) => {
      scores[signal.concept] = (scores[signal.concept] || 0) + signal.weight;
      return scores;
    }, {});
}

function chooseBusinessType(scores = {}) {
  if ((scores.marketplace_platform || 0) >= 4) return "marketplace_platform";
  if ((scores.digital_software || 0) >= 4) return "digital_software";
  if ((scores.industrial_manufacturing || 0) >= 3) return "industrial_manufacturing";
  if ((scores.service || 0) >= 3) return "service";
  if ((scores.retail_trading || 0) >= 3) return "retail_trading";
  return "generic";
}

function chooseConcept(scores = {}, fallback) {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || fallback;
}

function matchSpecialist(classification) {
  return classification.matchedSpecialist || (classification.specialistCandidate?.confidence === "high" ? classification.specialistCandidate : null);
}

function matchSpecialistFromSourceFields(sourceFields = [], language = "en") {
  const sourceText = sourceFields.map((source) => source.value).join(" ");
  if (!normalize(sourceText)) return null;

  for (const specialist of specialistRegistry) {
    const confidence = evaluateSpecialistRequirements(specialist, sourceText);
    if (confidence === "high") {
      return { id: specialist.id, label: specialist.label[language] || specialist.label.en, confidence };
    }
    if (confidence === "medium") {
      return { id: specialist.id, label: specialist.label[language] || specialist.label.en, confidence };
    }
  }
  return null;
}

function evaluateSpecialistRequirements(specialist, sourceText = "") {
  const matches = Object.values(specialist.requires).map((patterns) => patterns.some((pattern) => pattern.test(sourceText)));
  if (matches.every(Boolean)) return "high";
  if (matches.some(Boolean)) return "medium";
  return "none";
}

function shouldAskForClassificationConfirmation(classification, specialist, answers = {}, validation) {
  if (answers.projectTypeCorrection) return false;
  if (specialist?.confidence === "high") return false;
  if (classification.specialistCandidate?.confidence === "medium") return true;
  return classification.classificationConfidence === "low" && validation && !validation.ok;
}

function buildClassificationPrompt(classification, specialist, language) {
  const labels = {
    en: {
      labelText: "Which project type best describes this idea?",
      helpText: "Choose the plain description that fits best. This keeps follow-up questions relevant.",
      placeholderText: "Select project type",
      options: [
        ["service", "Service or local operation"],
        ["digital_software", "Software or digital product"],
        ["marketplace_platform", "Marketplace or platform"],
        ["retail_trading", "Retail, trading, or commerce"],
        ["industrial_manufacturing", "Manufacturing or production"],
        ["generic", "Not sure / general business"],
      ],
    },
    ar: {
      labelText: "أي وصف يناسب نوع المشروع؟",
      helpText: "اختر الوصف الأقرب بلغة بسيطة حتى تكون أسئلة المتابعة مناسبة.",
      placeholderText: "اختر نوع المشروع",
      options: [
        ["service", "خدمة أو تشغيل محلي"],
        ["digital_software", "منتج رقمي أو برمجي"],
        ["marketplace_platform", "منصة أو سوق يربط بين طرفين"],
        ["retail_trading", "تجارة أو بيع منتجات"],
        ["industrial_manufacturing", "تصنيع أو إنتاج"],
        ["generic", "غير متأكد / عمل عام"],
      ],
    },
  };
  const copy = labels[language] || labels.en;
  return {
    id: "projectTypeCorrection",
    type: "select",
    category: "implementationTimeline",
    source: "user_answerable",
    sourceLabel: language === "ar" ? "يمكنك الإجابة" : "You can answer",
    required: true,
    labelText: copy.labelText,
    helpText: copy.helpText,
    placeholderText: copy.placeholderText,
    value: "",
    options: copy.options.map(([value, labelText]) => ({ value, labelText })),
    detectedBusinessType: classification.businessType,
    candidateSpecialist: specialist?.id || classification.specialistCandidate?.id || "",
  };
}

function normalize(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function buildSpecialistClarificationAssessment({ specialist, industrialDetails = {}, language }) {
  const missingFields = industrialClarificationFields.filter((field) => field.required && !normalize(industrialDetails[field.id]));
  const labels = {
    en: {
      heading: "We need project details before evaluation",
      body: "This idea matches the plastic recycling specialist path, but the project details are not complete enough for a preliminary specialist decision.",
      policy: "AI Source Hub asks for structured details before specialist analysis so plastic material, output, capacity, budget, location, supply, operations, buyers, and sales scope are not mixed into the customer problem.",
      closing: "Answer the missing fields below, then continue the evaluation.",
      continueAction: "Continue evaluation",
      detailsTitle: "Missing specialist details",
      missing: "Missing fields",
      step: "Step",
      previous: "Previous",
      next: "Next",
    },
    ar: {
      heading: "نحتاج إلى تفاصيل المشروع قبل التقييم",
      body: "تطابق هذه الفكرة مسار تحليل إعادة تدوير البلاستيك، لكن تفاصيل المشروع غير مكتملة بما يكفي لإعداد قرار متخصص أولي.",
      policy: "يطلب AI Source Hub التفاصيل بشكل منظم حتى لا تختلط المادة البلاستيكية والمخرج والطاقة والميزانية والموقع والتوريد والتشغيل والمشترون ونطاق البيع بمشكلة العميل.",
      closing: "أجب عن الحقول الناقصة أدناه، ثم تابع التقييم.",
      continueAction: "متابعة التقييم",
      detailsTitle: "التفاصيل المتخصصة الناقصة",
      missing: "حقول ناقصة",
      step: "خطوة",
      previous: "السابق",
      next: "التالي",
    },
  };
  const copy = labels[language] || labels.en;

  if (missingFields.length === 0) {
    return {
      status: "ready_for_industrial_analysis",
      ok: true,
      reason: "specialist_details_complete",
      requestType: "investment_assessment",
      projectType: "industrial_manufacturing",
      specialistId: specialist.id,
      missingFields: [],
      industrialDetails,
      title: language === "ar" ? "التقييم المتخصص جاهز" : "Specialist assessment ready",
      message: language === "ar" ? "اكتملت التفاصيل المطلوبة للتحليل المتخصص." : "The required specialist details are complete.",
      presentation: {
        heading: language === "ar" ? "التقييم المتخصص جاهز" : "Specialist assessment ready",
        body: language === "ar" ? "يمكن إعداد التقرير المتخصص الآن." : "The specialist report can now be prepared.",
        policy: "",
        closing: "",
      },
    };
  }

  const missingIds = new Set(missingFields.map((field) => field.id));
  const steps = industrialClarificationSteps
    .map((step) => ({
      id: step.id,
      title: step.title[language] || step.title.en,
      fields: step.fields
        .filter((fieldId) => missingIds.has(fieldId))
        .map((fieldId) => localizeSpecialistField(industrialClarificationFields.find((field) => field.id === fieldId), language)),
    }))
    .filter((step) => step.fields.length > 0);

  return {
    status: "needs_clarification",
    ok: false,
    reason: "confirmed_specialist_details_required",
    requestType: "investment_assessment",
    projectType: "industrial_manufacturing",
    specialistId: specialist.id,
    missingFields: missingFields.map((field) => field.id),
    industrialDetails,
    title: copy.heading,
    message: copy.body,
    presentation: {
      heading: copy.heading,
      body: copy.body,
      policy: copy.policy,
      closing: copy.closing,
      detailsTitle: copy.detailsTitle,
      questions: missingFields.map((field) => field.label[language] || field.label.en),
    },
    clarificationFlow: {
      type: "industrial",
      details: industrialDetails,
      missingFieldIds: missingFields.map((field) => field.id),
      steps,
      labels: {
        previous: copy.previous,
        next: copy.next,
        continue: copy.continueAction,
        missing: copy.missing,
        step: copy.step,
      },
    },
  };
}

function localizeSpecialistField(field, language) {
  return {
    ...field,
    labelText: field.label[language] || field.label.en,
    placeholderText: field.placeholder[language] || field.placeholder.en,
    options: field.options?.map((option) => ({
      value: option.value,
      labelText: option.label[language] || option.label.en,
    })),
  };
}
