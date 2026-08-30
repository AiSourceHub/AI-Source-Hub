import { validateForExecution } from "./analyzer.js";
import { evaluateIdeaEligibility } from "../../../core/eligibilityPolicy.js";
import { buildFeasibilityFoundation, buildGuidedFeasibilityFlow } from "./feasibilityFoundation.js";
import {
  assessBusinessIdeaRequest,
  industrialClarificationFields,
  industrialClarificationSteps,
} from "./requestUnderstanding.js";
import {
  collectClassificationEvidence,
  evidenceToFieldSignals,
  matchSpecialistEvidence,
} from "./classificationEvidence.js";

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

const classificationChoices = {
  retail: {
    engineType: "retail_trading",
    primaryType: "retail",
    label: { en: "Retail", ar: "بيع بالتجزئة" },
    reason: {
      en: "the idea sells products directly to customers.",
      ar: "لأن الفكرة تبيع منتجات مباشرة للعملاء.",
    },
  },
  wholesale_import_distribution: {
    engineType: "retail_trading",
    primaryType: "wholesale_import_distribution",
    label: { en: "Wholesale, import, or distribution", ar: "جملة أو استيراد أو توزيع" },
    reason: {
      en: "the idea depends on sourcing, stock movement, or selling to other sellers.",
      ar: "لأن الفكرة تعتمد على التوريد أو حركة المخزون أو البيع لتجار آخرين.",
    },
  },
  field_service: {
    engineType: "service",
    primaryType: "service",
    label: { en: "Service", ar: "خدمة" },
    reason: {
      en: "the idea mainly provides a service rather than selling goods or manufacturing products.",
      ar: "لأن الفكرة تقدم خدمة في الأساس، وليست بيع منتجات أو تصنيعها.",
    },
  },
  professional_service: {
    engineType: "service",
    primaryType: "professional_service",
    label: { en: "Professional service", ar: "خدمات مهنية" },
    reason: {
      en: "the value depends mainly on expertise, service delivery, or specialist labor.",
      ar: "لأن القيمة تعتمد أساساً على الخبرة أو تقديم الخدمة أو العمالة المتخصصة.",
    },
  },
  manufacturing_industrial: {
    engineType: "industrial_manufacturing",
    primaryType: "manufacturing_industrial",
    label: { en: "Manufacturing or industrial", ar: "تصنيع أو مشروع صناعي" },
    reason: {
      en: "the idea appears to involve production, a facility, machinery, or operating capacity.",
      ar: "لأن الفكرة تبدو مرتبطة بالإنتاج أو المقر أو المعدات أو الطاقة التشغيلية.",
    },
  },
  food_beverage: {
    engineType: "service",
    primaryType: "food_and_beverage",
    label: { en: "Food and beverage", ar: "الأغذية والمشروبات" },
    reason: {
      en: "the idea appears to sell or prepare food, drinks, meals, or catering services.",
      ar: "لأن الفكرة تبدو مرتبطة ببيع أو إعداد الطعام أو المشروبات أو الوجبات.",
    },
  },
  digital_software: {
    engineType: "digital_software",
    primaryType: "digital_software",
    label: { en: "Digital or software", ar: "رقمي أو برمجي" },
    reason: {
      en: "the idea is delivered mainly through software, an app, website, automation, or digital workflow.",
      ar: "لأن الفكرة تُقدَّم أساساً عبر برنامج أو تطبيق أو موقع أو أتمتة رقمية.",
    },
  },
  marketplace_platform: {
    engineType: "marketplace_platform",
    primaryType: "marketplace_platform",
    label: { en: "Marketplace or platform", ar: "منصة أو سوق يربط بين طرفين" },
    reason: {
      en: "the idea connects two or more sides such as buyers, sellers, users, or providers.",
      ar: "لأن الفكرة تربط بين طرفين أو أكثر مثل العملاء أو البائعين أو المستخدمين أو مقدمي الخدمة.",
    },
  },
  healthcare: {
    engineType: "service",
    primaryType: "healthcare",
    label: { en: "Healthcare", ar: "رعاية صحية" },
    reason: {
      en: "the idea involves patients, clinics, care delivery, or health-related services.",
      ar: "لأن الفكرة مرتبطة بالمرضى أو العيادات أو تقديم الرعاية أو الخدمات الصحية.",
    },
  },
  real_estate: {
    engineType: "service",
    primaryType: "real_estate",
    label: { en: "Real estate", ar: "عقار" },
    reason: {
      en: "the idea appears connected to property, sites, rentals, facilities, or real-estate decisions.",
      ar: "لأن الفكرة تبدو مرتبطة بالعقار أو المواقع أو الإيجارات أو المرافق.",
    },
  },
  generic: {
    engineType: "generic",
    primaryType: "generic",
    label: { en: "General or not sure", ar: "عام أو غير متأكد" },
    reason: {
      en: "the current description is broad, so a general path is safer until you clarify it.",
      ar: "لأن الوصف الحالي واسع، لذلك يكون المسار العام أكثر أماناً إلى أن توضحه.",
    },
  },
};

const correctionOptions = new Set(Object.keys(classificationChoices));
const operatingModelChoices = {
  fixed_location: {
    label: { en: "Fixed location", ar: "موقع ثابت" },
    reason: {
      en: "customers appear to visit a business location to receive the product or service.",
      ar: "لأن العملاء يذهبون إلى موقع المشروع للحصول على المنتج أو الخدمة.",
    },
  },
  mobile_or_customer_site: {
    label: { en: "Mobile or customer-site", ar: "متنقل أو في موقع العميل" },
    reason: {
      en: "the provider appears to travel to the customer or deliver at the customer's site.",
      ar: "لأن مقدم الخدمة ينتقل إلى العميل أو يقدم العمل في موقع العميل.",
    },
  },
  digital_remote: {
    label: { en: "Digital or remote", ar: "رقمي أو عن بُعد" },
    reason: {
      en: "delivery appears to happen mainly through software, an app, website, or remote workflow.",
      ar: "لأن تقديم القيمة يبدو عبر برنامج أو تطبيق أو موقع أو عمل عن بُعد.",
    },
  },
  home_based: {
    label: { en: "Home-based", ar: "من المنزل" },
    reason: {
      en: "the work appears to be operated from home.",
      ar: "لأن تشغيل المشروع يبدو من المنزل.",
    },
  },
  mixed: {
    label: { en: "Mixed", ar: "مختلط" },
    reason: {
      en: "the idea appears to combine more than one delivery model.",
      ar: "لأن الفكرة تبدو تجمع أكثر من طريقة تشغيل أو تقديم.",
    },
  },
  unknown: {
    label: { en: "Unknown", ar: "غير واضح" },
    reason: {
      en: "the current input does not clearly state where or how delivery happens.",
      ar: "لأن المدخل الحالي لا يوضح أين أو كيف يتم تقديم المنتج أو الخدمة.",
    },
  },
};
const operatingModelCorrectionOptions = new Set(Object.keys(operatingModelChoices));
const legacyCorrectionAliases = {
  retail_trading: "retail",
  service: "field_service",
  industrial_manufacturing: "manufacturing_industrial",
  location_based_service: "field_service",
};

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

export function orchestrateBusinessIdeaValidation({
  rawInput = {},
  language = "en",
  industrialDetails = {},
  feasibilityAnswers = {},
  source = "",
} = {}) {
  const lang = language === "ar" ? "ar" : "en";
  const { analysis, validation } = validateForExecution(rawInput, lang);
  const unclassifiedContext = buildUnclassifiedContext(lang);
  const validationDecision = buildValidationDecision({ rawInput, analysis, validation, classification: unclassifiedContext, language: lang });

  if (validationDecision) return validationDecision;

  const eligibility = evaluateIdeaEligibility(rawInput, lang);
  if (eligibility.status !== "eligible") {
    const route = eligibility.status === "ineligible" ? ROUTES.INELIGIBLE : ROUTES.NEEDS_CLARIFICATION;
    return buildDecision({
      route,
      reasonCode: eligibility.status === "ineligible" ? "ethical_policy_ineligible" : "policy_or_financing_clarification",
      reasonText: routeText[lang][eligibility.status === "ineligible" ? "ineligible" : "policy_clarification"],
      language: lang,
      classification: unclassifiedContext,
      analysis,
      validation,
      eligibility,
      missingInformation: [],
      nextRequiredAction: eligibility.presentation?.closing || eligibility.message,
    });
  }

  const classification = classifyValidatorRequest(rawInput, {
    language: lang,
    details: { ...industrialDetails, ...feasibilityAnswers },
  });

  const foundation = buildFeasibilityFoundation(rawInput, lang, {
    details: { ...industrialDetails, ...feasibilityAnswers },
    businessTypeOverride: classification.businessType,
  });
  const hasTruncatedInput = sourceHasTruncatedPhrase(rawInput);
  const specialist = matchSpecialist(classification);
  const classificationPrompt = shouldAskForClassificationConfirmation(classification, specialist, feasibilityAnswers, validation)
    ? buildClassificationPrompt(classification, specialist, lang, feasibilityAnswers)
    : null;

  if (!classificationPrompt && specialist?.confidence === "high" && !hasTruncatedInput) {
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

  const guidedFeasibility = buildGuidedFeasibilityFlow(rawInput, lang, {
    foundation,
    answers: feasibilityAnswers,
    validation,
    classificationPrompt,
    forceGuide: hasTruncatedInput,
    phase3Only: true,
    source,
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
      source,
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
  const classificationEvidence = collectClassificationEvidence(sourceFields);
  const fieldSignals = evidenceToFieldSignals(classificationEvidence);
  const originalSourceFields = buildSourceFields(rawInput, {}, { includeDetails: false });
  const specialistCandidate = matchSpecialistFromSourceFields(originalSourceFields, language);
  const rawCorrection = String(options.details?.projectTypeCorrection || "").trim();
  const correction = normalizeClassificationChoice(rawCorrection);
  const legacyOperatingModel = rawCorrection === "location_based_service" ? "fixed_location" : "";
  const operatingModelCorrection = normalizeOperatingModelCorrection(options.details?.operatingModelCorrection || legacyOperatingModel);
  const classificationDecision = String(options.details?.classificationConfirmation || "").trim();
  const scores = scoreConcepts(fieldSignals, "businessType");
  const operatingModelScores = scoreConcepts(fieldSignals, "operatingModel");
  const inferredOperatingModel = chooseOperatingModel(operatingModelScores);
  const proposedClassification = buildProposedClassification({
    scores,
    fieldSignals,
    classificationEvidence,
    rawInput,
    language,
    specialistCandidate,
    operatingModel: inferredOperatingModel,
  });
  const correctedType = correctionOptions.has(correction) ? correction : "";
  const correctedOperatingModel = operatingModelCorrectionOptions.has(operatingModelCorrection) ? operatingModelCorrection : "";
  const classificationConfirmed = classificationDecision === "confirm" || Boolean(correctedType && correctedOperatingModel);
  const classificationCorrected = Boolean(correctedType || correctedOperatingModel);
  const confirmedClassification = classificationConfirmed
    ? buildConfirmedClassification({
        choice: correctedType || proposedClassification.type,
        language,
        corrected: classificationCorrected,
        reason: options.details?.classificationCorrectionReason,
        operatingModel: correctedOperatingModel || proposedClassification.operatingModel,
      })
    : null;
  const businessType = confirmedClassification?.engineType || proposedClassification.engineType;
  const businessTypeScore = scores[businessType] || 0;
  const operatingModel = confirmedClassification?.operatingModel || proposedClassification.operatingModel;
  const assetIntensity = scoreConcepts(fieldSignals, "assetIntensity").high ? "high" : businessType === "industrial_manufacturing" ? "high" : "moderate";
  const customerModel = chooseConcept(scoreConcepts(fieldSignals, "customerModel"), "unspecified");
  const sectorScores = scoreConcepts(fieldSignals, "sector");
  const sectorSignals = Object.entries(sectorScores)
    .filter(([, score]) => score > 0)
    .map(([sector, score]) => ({ sector, score }));
  const confidence = correctedType
    ? "confirmed_by_user"
    : classificationConfirmed
      ? "confirmed_by_user"
      : businessTypeScore >= 4
      ? "high"
      : businessTypeScore >= 2
        ? "medium"
        : "low";
  return {
    businessType,
    proposedClassification,
    confirmedClassification,
    classificationConfirmed,
    classificationCorrected,
    classificationCorrectionReason: String(options.details?.classificationCorrectionReason || "").trim(),
    operatingModelCorrected: Boolean(correctedOperatingModel),
    experienceLevel: String(options.details?.userExperienceLevel || "").trim(),
    firstProject: String(options.details?.firstProject || "").trim(),
    country: String(options.details?.country || "").trim(),
    city: String(options.details?.city || "").trim(),
    decisionObjective: String(options.details?.decisionObjective || "").trim(),
    operatingModel,
    assetIntensity,
    customerModel,
    projectStage: rawInput.stage || options.details?.projectStageIntent || "idea",
    sectorSignals,
    classificationConfidence: confidence,
    matchedSpecialist: specialistCandidate?.confidence === "high" ? specialistCandidate : null,
    specialistCandidate,
    fieldSignals,
    classificationEvidence,
    correctionApplied: classificationCorrected,
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

function buildUnclassifiedContext(language = "en") {
  const generic = classificationChoices.generic;
  const unknownOperatingModel = operatingModelChoices.unknown;
  return {
    businessType: "generic",
    proposedClassification: {
      type: "generic",
      businessType: "generic",
      primaryType: "generic",
      engineType: "generic",
      label: generic.label[language] || generic.label.en,
      sector: "generic",
      operatingModel: "unknown",
      operatingModelLabel: unknownOperatingModel.label[language] || unknownOperatingModel.label.en,
      customerModel: "unspecified",
      projectStage: "idea",
      confidence: "not_evaluated",
      reason: "",
    },
    confirmedClassification: null,
    classificationConfirmed: false,
    classificationCorrected: false,
    classificationCorrectionReason: "",
    operatingModelCorrected: false,
    operatingModel: "unknown",
    assetIntensity: "unknown",
    customerModel: "unspecified",
    projectStage: "idea",
    sectorSignals: [],
    classificationConfidence: "not_evaluated",
    matchedSpecialist: null,
    specialistCandidate: null,
    fieldSignals: [],
    correctionApplied: false,
  };
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
  source = "",
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
    source,
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
    userProfile: guidedFeasibility?.userProfile || null,
    experienceLevel: guidedFeasibility?.userProfile?.experienceLevel || classification.experienceLevel || "",
    firstProject: guidedFeasibility?.userProfile?.firstProject || classification.firstProject || "",
    projectStage: classification.projectStage,
    country: guidedFeasibility?.userProfile?.country || classification.country || "",
    city: guidedFeasibility?.userProfile?.city || classification.city || "",
    decisionObjective: guidedFeasibility?.userProfile?.decisionObjective || classification.decisionObjective || "",
    proposedClassification: classification.proposedClassification,
    confirmedClassification: classification.confirmedClassification,
    classificationConfirmed: classification.classificationConfirmed,
    classificationCorrected: classification.classificationCorrected,
    classificationCorrectionReason: classification.classificationCorrectionReason,
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
    experienceLevel: guidedFeasibility?.userProfile?.experienceLevel || classification.experienceLevel || "",
    firstProject: guidedFeasibility?.userProfile?.firstProject || classification.firstProject || "",
    country: guidedFeasibility?.userProfile?.country || classification.country || "",
    city: guidedFeasibility?.userProfile?.city || classification.city || "",
    decisionObjective: guidedFeasibility?.userProfile?.decisionObjective || classification.decisionObjective || "",
    proposedClassification: classification.proposedClassification,
    confirmedClassification: classification.confirmedClassification,
    classificationConfirmed: classification.classificationConfirmed,
    classificationCorrected: classification.classificationCorrected,
    classificationCorrectionReason: classification.classificationCorrectionReason,
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

function buildProposedClassification({ scores = {}, fieldSignals = [], classificationEvidence = [], rawInput = {}, language = "en", specialistCandidate, operatingModel = "unknown" }) {
  const engineType = chooseBusinessType(scores);
  const type = chooseDisplayClassification({ engineType, fieldSignals, classificationEvidence, rawInput, specialistCandidate });
  const definition = classificationChoices[type] || classificationChoices.generic;
  const sector = chooseSector(fieldSignals);
  const operatingDefinition = operatingModelChoices[operatingModel] || operatingModelChoices.unknown;

  return {
    type,
    businessType: type,
    primaryType: definition.primaryType || definition.engineType,
    engineType: definition.engineType,
    label: definition.label[language] || definition.label.en,
    sector,
    operatingModel,
    operatingModelLabel: operatingDefinition.label[language] || operatingDefinition.label.en,
    customerModel: chooseConcept(scoreConcepts(fieldSignals, "customerModel"), "unspecified"),
    projectStage: rawInput.stage || "idea",
    confidence: scores[engineType] >= 4 ? "high" : scores[engineType] >= 2 ? "medium" : "low",
    reason: buildClassificationReason(definition, language, { operatingModel }),
  };
}

function chooseDisplayClassification({ engineType, fieldSignals = [], classificationEvidence = [], rawInput = {}, specialistCandidate }) {
  const sectors = scoreConcepts(fieldSignals, "sector");
  const hasStrongSectorEvidence = (sector) =>
    classificationEvidence.some((record) =>
      record.dimension === "sector" &&
      record.proposedValue === sector &&
      ["strong", "medium"].includes(record.evidenceStrength) &&
      record.isAffirmative
    );
  const hasConceptEvidence = (conceptId) =>
    classificationEvidence.some((record) => record.conceptId === conceptId && record.isAffirmative);

  if (engineType === "marketplace_platform") return "marketplace_platform";
  if (engineType === "digital_software") return "digital_software";
  if (engineType === "industrial_manufacturing") return "manufacturing_industrial";
  if ((sectors.food || 0) >= 2 && hasStrongSectorEvidence("food")) return "food_beverage";
  if ((sectors.healthcare || 0) >= 2 && hasStrongSectorEvidence("healthcare")) return "healthcare";
  if ((sectors.real_estate || 0) >= 2 && hasStrongSectorEvidence("real_estate")) return "real_estate";
  if (hasConceptEvidence("wholesale_import_distribution")) return "wholesale_import_distribution";
  if (engineType === "retail_trading") return "retail";
  if (hasProfessionalServiceEvidence(classificationEvidence)) return "professional_service";
  if (engineType === "service") return "field_service";
  return "generic";
}

function hasProfessionalServiceEvidence(classificationEvidence = []) {
  const professionalConcepts = new Set([
    "service_delivery",
    "healthcare_clinic",
  ]);
  return classificationEvidence.some((record) =>
    professionalConcepts.has(record.conceptId) &&
    ["consulting", "agency", "clinic", "coaching", "training", "استشارة", "وكالة", "عيادة", "تدريب", "خدمات مهنية"].includes(record.matchedPhrase)
  );
}

function chooseSector(fieldSignals = []) {
  const sectorScores = scoreConcepts(fieldSignals, "sector");
  return Object.entries(sectorScores).sort((a, b) => b[1] - a[1])[0]?.[0] || "generic";
}

function buildClassificationReason(definition, language, context = {}) {
  const operatingDefinition = operatingModelChoices[context.operatingModel] || operatingModelChoices.unknown;
  return language === "ar"
    ? `يبدو أن النوع الأساسي هو ${definition.label.ar}، ${definition.reason.ar} ونموذج التشغيل: ${operatingDefinition.label.ar}، ${operatingDefinition.reason.ar}`
    : `The primary type looks like ${definition.label.en.toLowerCase()} because ${definition.reason.en} Operating model: ${operatingDefinition.label.en.toLowerCase()}, because ${operatingDefinition.reason.en}`;
}

function buildConfirmedClassification({ choice, language = "en", corrected = false, reason = "", operatingModel = "unknown" }) {
  const normalizedChoice = normalizeClassificationChoice(choice);
  const definition = classificationChoices[normalizedChoice] || classificationChoices.generic;
  const normalizedOperatingModel = normalizeOperatingModelCorrection(operatingModel) || "unknown";
  const operatingDefinition = operatingModelChoices[normalizedOperatingModel] || operatingModelChoices.unknown;
  return {
    type: normalizedChoice,
    businessType: normalizedChoice,
    primaryType: definition.primaryType || definition.engineType,
    engineType: definition.engineType,
    label: definition.label[language] || definition.label.en,
    operatingModel: normalizedOperatingModel,
    operatingModelLabel: operatingDefinition.label[language] || operatingDefinition.label.en,
    corrected,
    reason: String(reason || "").trim(),
  };
}

function normalizeClassificationChoice(value = "") {
  const normalized = String(value || "").trim();
  return legacyCorrectionAliases[normalized] || normalized;
}

function normalizeOperatingModelCorrection(value = "") {
  const normalized = String(value || "").trim();
  const aliases = {
    fixed_site: "fixed_location",
    mobile: "mobile_or_customer_site",
    digital: "digital_remote",
    online: "digital_remote",
    not_sure: "unknown",
  };
  return aliases[normalized] || normalized;
}

function chooseOperatingModel(scores = {}) {
  const normalizedScores = { ...scores };
  const fixed = normalizedScores.fixed_location || 0;
  const mobile = normalizedScores.mobile_or_customer_site || 0;
  const digital = normalizedScores.digital_remote || 0;
  const home = normalizedScores.home_based || 0;
  const mixed = normalizedScores.mixed || 0;
  const active = Object.entries({ fixed_location: fixed, mobile_or_customer_site: mobile, digital_remote: digital, home_based: home, mixed })
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (active.length === 0) return "unknown";
  if (active.length > 1 && active[0][1] === active[1][1]) return "mixed";
  if (mixed > 0 && active.length > 1) return "mixed";
  return active[0][0];
}

function chooseConcept(scores = {}, fallback) {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || fallback;
}

function matchSpecialist(classification) {
  return classification.matchedSpecialist || (classification.specialistCandidate?.confidence === "high" ? classification.specialistCandidate : null);
}

function matchSpecialistFromSourceFields(sourceFields = [], language = "en") {
  return matchSpecialistEvidence(sourceFields, language);
}

function shouldAskForClassificationConfirmation(classification, specialist, answers = {}, validation) {
  if (classification.classificationConfirmed) return false;
  if (answers.classificationConfirmation === "correct" && (!answers.projectTypeCorrection || !answers.operatingModelCorrection)) return true;
  if (answers.classificationConfirmation === "confirm") return false;
  return true;
}

function buildClassificationPrompt(classification, specialist, language, answers = {}) {
  const labels = {
    en: {
      confirmationLabel: "Does this classification describe your business correctly?",
      confirmationHelp: `Proposed classification: ${classification.proposedClassification?.label || "General business"}; operating model: ${classification.proposedClassification?.operatingModelLabel || "Unknown"}. ${classification.proposedClassification?.reason || "This keeps follow-up questions relevant."}`,
      confirmationPlaceholder: "Confirm or correct the classification",
      confirmOption: "Confirm classification",
      correctOption: "Correct classification",
      correctionLabel: "Which business type fits better?",
      correctionHelp: "Choose the plain description that fits best. This changes the follow-up questions without changing your original idea.",
      placeholderText: "Select project type",
      operatingModelLabel: "Which operating model fits better?",
      operatingModelHelp: "Choose where or how the business delivers value. This is separate from the business type.",
      operatingModelPlaceholder: "Select operating model",
      reasonLabel: "Correction note",
      reasonHelp: "Optional: briefly say why this classification fits better.",
      reasonPlaceholder: "Example: this is a mobile service, not a factory",
      options: [
        ["field_service", "Service"],
        ["professional_service", "Professional service"],
        ["retail", "Retail"],
        ["wholesale_import_distribution", "Wholesale, import, or distribution"],
        ["manufacturing_industrial", "Manufacturing or industrial"],
        ["food_beverage", "Food and beverage"],
        ["digital_software", "Digital or software"],
        ["marketplace_platform", "Marketplace or platform"],
        ["healthcare", "Healthcare"],
        ["real_estate", "Real estate"],
        ["generic", "Not sure / general business"],
      ],
      operatingOptions: [
        ["fixed_location", "Fixed location"],
        ["mobile_or_customer_site", "Mobile or customer-site"],
        ["digital_remote", "Digital or remote"],
        ["home_based", "Home-based"],
        ["mixed", "Mixed"],
        ["unknown", "Not sure"],
      ],
    },
    ar: {
      confirmationLabel: "هل هذا التصنيف يصف مشروعك بشكل صحيح؟",
      confirmationHelp: `التصنيف المقترح: ${classification.proposedClassification?.label || "عمل عام"}؛ نموذج التشغيل: ${classification.proposedClassification?.operatingModelLabel || "غير واضح"}. ${classification.proposedClassification?.reason || "هذا يساعد على جعل أسئلة المتابعة مناسبة."}`,
      confirmationPlaceholder: "أكد التصنيف أو صححه",
      confirmOption: "تأكيد التصنيف",
      correctOption: "تصحيح التصنيف",
      correctionLabel: "أي نوع مشروع يناسب فكرتك أكثر؟",
      correctionHelp: "اختر الوصف الأقرب بلغة بسيطة. سيغيّر ذلك أسئلة المتابعة دون تغيير فكرتك الأصلية.",
      placeholderText: "اختر نوع المشروع",
      operatingModelLabel: "أي نموذج تشغيل يناسب فكرتك أكثر؟",
      operatingModelHelp: "اختر أين أو كيف سيتم تقديم المنتج أو الخدمة. هذا منفصل عن نوع المشروع.",
      operatingModelPlaceholder: "اختر نموذج التشغيل",
      reasonLabel: "ملاحظة التصحيح",
      reasonHelp: "اختياري: اكتب باختصار لماذا هذا التصنيف أنسب.",
      reasonPlaceholder: "مثال: هذه خدمة متنقلة وليست مصنعاً",
      options: [
        ["field_service", "خدمة"],
        ["professional_service", "خدمات مهنية"],
        ["retail", "بيع بالتجزئة"],
        ["wholesale_import_distribution", "جملة أو استيراد أو توزيع"],
        ["manufacturing_industrial", "تصنيع أو مشروع صناعي"],
        ["food_beverage", "الأغذية والمشروبات"],
        ["digital_software", "رقمي أو برمجي"],
        ["marketplace_platform", "منصة أو سوق يربط بين طرفين"],
        ["healthcare", "رعاية صحية"],
        ["real_estate", "عقار"],
        ["generic", "غير متأكد / عمل عام"],
      ],
      operatingOptions: [
        ["fixed_location", "موقع ثابت"],
        ["mobile_or_customer_site", "متنقل أو في موقع العميل"],
        ["digital_remote", "رقمي أو عن بُعد"],
        ["home_based", "من المنزل"],
        ["mixed", "مختلط"],
        ["unknown", "غير متأكد"],
      ],
    },
  };
  const copy = labels[language] || labels.en;
  const fields = [
    {
      id: "classificationConfirmation",
      type: "select",
      category: "implementationTimeline",
      source: "user_answerable",
      sourceLabel: language === "ar" ? "يمكنك الإجابة" : "You can answer",
      required: true,
      labelText: copy.confirmationLabel,
      helpText: copy.confirmationHelp,
      placeholderText: copy.confirmationPlaceholder,
      value: answers.classificationConfirmation || "",
      options: [
        { value: "confirm", labelText: copy.confirmOption },
        { value: "correct", labelText: copy.correctOption },
      ],
      detectedBusinessType: classification.businessType,
      proposedClassification: classification.proposedClassification,
      candidateSpecialist: specialist?.id || classification.specialistCandidate?.id || "",
    },
  ];

  if (answers.classificationConfirmation === "correct") {
    fields.push({
      id: "projectTypeCorrection",
      type: "select",
      category: "implementationTimeline",
      source: "user_answerable",
      sourceLabel: language === "ar" ? "يمكنك الإجابة" : "You can answer",
      required: true,
      labelText: copy.correctionLabel,
      helpText: copy.correctionHelp,
      placeholderText: copy.placeholderText,
      value: answers.projectTypeCorrection || "",
      options: copy.options.map(([value, labelText]) => ({ value, labelText })),
      detectedBusinessType: classification.businessType,
      proposedClassification: classification.proposedClassification,
      candidateSpecialist: specialist?.id || classification.specialistCandidate?.id || "",
    });
    fields.push({
      id: "operatingModelCorrection",
      type: "select",
      category: "implementationTimeline",
      source: "user_answerable",
      sourceLabel: language === "ar" ? "يمكنك الإجابة" : "You can answer",
      required: true,
      labelText: copy.operatingModelLabel,
      helpText: copy.operatingModelHelp,
      placeholderText: copy.operatingModelPlaceholder,
      value: answers.operatingModelCorrection || "",
      options: copy.operatingOptions.map(([value, labelText]) => ({ value, labelText })),
      detectedOperatingModel: classification.operatingModel,
      proposedClassification: classification.proposedClassification,
      candidateSpecialist: specialist?.id || classification.specialistCandidate?.id || "",
    });
    fields.push({
      id: "classificationCorrectionReason",
      type: "textarea",
      category: "implementationTimeline",
      source: "user_answerable",
      sourceLabel: language === "ar" ? "يمكنك الإجابة" : "You can answer",
      required: false,
      labelText: copy.reasonLabel,
      helpText: copy.reasonHelp,
      placeholderText: copy.reasonPlaceholder,
      value: answers.classificationCorrectionReason || "",
    });
  }

  return fields;
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
