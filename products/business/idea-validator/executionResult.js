import productConfig from "./config.js";
import { buildBusinessIdeaReport } from "./report.js";
import { buildIndustrialPreliminaryAnalysis } from "./industrialAnalysis.js";
import { buildBusinessIdeaRecommendation, refineBusinessIdeaCriteria } from "./recommendations.js";
import { buildImprovedIdeaStatement, scoreBusinessIdea } from "./scoring.js";
import { orchestrateBusinessIdeaValidation } from "./validatorOrchestrator.js";

export const BIV_JOURNEY_STATES = {
  PROFILE_INPUT: "profile_input",
  IDEA_INPUT: "idea_input",
  VALIDATION_ERROR: "validation_error",
  INELIGIBLE: "ineligible",
  ELIGIBILITY_CLARIFICATION: "eligibility_clarification",
  FINANCING_CLARIFICATION: "financing_clarification",
  CLASSIFICATION_REVIEW: "classification_review",
  CLASSIFICATION_CORRECTION: "classification_correction",
  GUIDED_FOLLOWUP: "guided_followup",
  SPECIALIST_CLARIFICATION: "specialist_clarification",
  SPECIALIST_ANALYSIS: "specialist_analysis",
  NORMAL_EVALUATION: "normal_evaluation",
};

export const BIV_VALID_JOURNEY_STATES = new Set(Object.values(BIV_JOURNEY_STATES));

export function resolveBusinessIdeaJourneyState(decision = {}) {
  if (decision.route === "validation_error") {
    return BIV_JOURNEY_STATES.VALIDATION_ERROR;
  }

  if (decision.route === "ineligible") {
    return BIV_JOURNEY_STATES.INELIGIBLE;
  }

  if (decision.route === "needs_clarification") {
    if (decision.requestAssessment) {
      return BIV_JOURNEY_STATES.SPECIALIST_CLARIFICATION;
    }

    const clarificationType = decision.eligibility?.clarificationType;
    if (clarificationType === "eligibility") {
      return BIV_JOURNEY_STATES.ELIGIBILITY_CLARIFICATION;
    }
    if (clarificationType === "financing") {
      return BIV_JOURNEY_STATES.FINANCING_CLARIFICATION;
    }

    throw new Error(`Missing or unsupported eligibility clarificationType: ${clarificationType || "missing"}`);
  }

  if (decision.route === "specialist_analysis") {
    return BIV_JOURNEY_STATES.SPECIALIST_ANALYSIS;
  }

  if (decision.route === "normal_evaluation") {
    return BIV_JOURNEY_STATES.NORMAL_EVALUATION;
  }

  if (decision.route === "guided_follow_up") {
    if (hasPendingProfileFields(decision)) {
      return BIV_JOURNEY_STATES.PROFILE_INPUT;
    }

    if (hasPendingIdeaFields(decision)) {
      return BIV_JOURNEY_STATES.IDEA_INPUT;
    }

    if (decision.reasonCode === "classification_confirmation_required") {
      return hasClassificationCorrectionFields(decision)
        ? BIV_JOURNEY_STATES.CLASSIFICATION_CORRECTION
        : BIV_JOURNEY_STATES.CLASSIFICATION_REVIEW;
    }

    return BIV_JOURNEY_STATES.GUIDED_FOLLOWUP;
  }

  return BIV_JOURNEY_STATES.NORMAL_EVALUATION;
}

function hasPendingProfileFields(decision) {
  const fields = collectClarificationFields(decision);
  return fields.some((field) =>
    ["userExperienceLevel", "firstProject", "projectStageIntent", "country", "city", "decisionObjective"].includes(field.id)
  );
}

function hasPendingIdeaFields(decision) {
  const fields = collectClarificationFields(decision);
  return fields.some((field) =>
    [
      "ideaDescription",
      "businessIdea",
      "targetCustomer",
      "problemSolved",
      "problem",
      "currentSolution",
      "competitiveAdvantage",
      "revenueModel",
      "monetization",
    ].includes(field.id)
  );
}

function hasClassificationCorrectionFields(decision) {
  const fields = collectClarificationFields(decision);
  return fields.some((field) => ["projectTypeCorrection", "operatingModelCorrection", "classificationCorrectionReason"].includes(field.id));
}

function collectClarificationFields(decision) {
  const renderedFields = (decision.guidedFeasibility?.clarificationFlow?.steps || decision.requestAssessment?.clarificationFlow?.steps || [])
    .flatMap((step) => step.fields || []);
  const missingFields = (decision.guidedFeasibility?.clarificationFlow?.missingFieldIds || decision.guidedFeasibility?.missingFieldIds || []).map((id) => ({ id }));

  return [...renderedFields, ...missingFields];
}

function withJourneyState(result, decision) {
  const journeyState = resolveBusinessIdeaJourneyState(decision);
  return {
    ...result,
    route: decision.route,
    journeyState,
  };
}

export function executeBusinessIdeaValidation({
  rawInput = {},
  language = "en",
  industrialDetails = {},
  feasibilityAnswers = {},
  content,
} = {}) {
  const lang = language === "ar" ? "ar" : "en";
  const decision = orchestrateBusinessIdeaValidation({
    rawInput,
    language: lang,
    industrialDetails,
    feasibilityAnswers,
  });
  const { analysis, validation } = decision;

  if (decision.route === "validation_error") {
    return withJourneyState({
      ok: false,
      state: "invalid",
      analysis,
      validation,
      orchestrationDecision: decision,
    }, decision);
  }

  if (decision.route === "ineligible" && decision.eligibility) {
    return withJourneyState({
      ok: true,
      state: "ineligible",
      evaluationStatus: "ineligible",
      analysis,
      validation,
      eligibility: decision.eligibility,
      message: decision.eligibility.message,
      policyText: decision.eligibility.policyText,
      title: decision.eligibility.title,
      presentation: decision.eligibility.presentation,
      orchestrationDecision: decision,
    }, decision);
  }

  if (decision.route === "needs_clarification") {
    if (decision.eligibility) {
      return withJourneyState({
        ok: true,
        state: "clarification",
        evaluationStatus: "needs_clarification",
        analysis,
        validation,
        eligibility: decision.eligibility,
        message: decision.eligibility.message,
        policyText: decision.eligibility.policyText,
        title: decision.eligibility.title,
        presentation: decision.eligibility.presentation,
        orchestrationDecision: decision,
      }, decision);
    }

    if (decision.requestAssessment) {
      return withJourneyState({
        ok: true,
        state: "clarification",
        evaluationStatus: "needs_clarification",
        analysis,
        validation,
        requestAssessment: decision.requestAssessment,
        message: decision.requestAssessment.message,
        title: decision.requestAssessment.title,
        presentation: decision.requestAssessment.presentation,
        clarificationFlow: decision.requestAssessment.clarificationFlow,
        feasibilityFoundation: decision.feasibilityFoundation,
        orchestrationDecision: decision,
      }, decision);
    }
  }

  if (decision.route === "guided_follow_up") {
    const guidedFeasibility = decision.guidedFeasibility;
    return withJourneyState({
      ok: true,
      state: "clarification",
      evaluationStatus:
        guidedFeasibility.status === "ready_for_preliminary_feasibility"
          ? "feasibility_ready"
          : "feasibility_followup",
      analysis,
      validation,
      message: guidedFeasibility.message,
      title: guidedFeasibility.title,
      presentation: guidedFeasibility.presentation,
      clarificationFlow: guidedFeasibility.clarificationFlow,
      feasibilityFoundation: decision.feasibilityFoundation,
      feasibilityGuidance: guidedFeasibility,
      orchestrationDecision: decision,
    }, decision);
  }

  if (decision.route === "specialist_analysis") {
    const requestAssessment = decision.requestAssessment;
    const industrialReport = buildIndustrialPreliminaryAnalysis({
      rawInput,
      requestAssessment,
      industrialDetails,
      language: lang,
    });
    return withJourneyState({
      ok: true,
      state: "industrial_report",
      evaluationStatus: "industrial_assessment",
      analysis,
      validation,
      requestAssessment,
      message: industrialReport.decision.label,
      title: industrialReport.title,
      industrialReport,
      industrialDetails,
      feasibilityFoundation: decision.feasibilityFoundation,
      orchestrationDecision: decision,
    }, decision);
  }

  return withJourneyState(buildNormalEvaluationResult({
    decision,
    rawInput,
    language: lang,
    content,
    analysis,
    validation,
  }), decision);
}

function buildNormalEvaluationResult({ decision, rawInput, language, content, analysis, validation }) {
  const {
    ruleContext,
    score,
    criteria,
    lowestCriterion,
    verdictKey,
    confidence,
  } = scoreBusinessIdea(analysis, language, {
    currentSolution: rawInput.currentSolution,
    competitiveAdvantage: rawInput.competitiveAdvantage,
    stage: rawInput.stage,
  });

  const recommendation = buildBusinessIdeaRecommendation({
    score,
    criteria,
    lowestCriterion,
    verdictKey,
    confidence,
    language,
    input: {
      ...ruleContext.input,
      businessName: rawInput.businessName,
      currentSolution: rawInput.currentSolution,
      competitiveAdvantage: rawInput.competitiveAdvantage,
      stakeholderRoles: ruleContext.stakeholderRoles,
      evidenceSignals: ruleContext.evidenceSignals,
      regulatoryDependencies: ruleContext.regulatoryDependencies,
    },
    stage: rawInput.stage,
  });
  const reportCriteria = refineBusinessIdeaCriteria(criteria, recommendation, language);
  const improvedIdea = buildImprovedIdeaStatement(ruleContext.input, language);
  const status = confidence.level === "low" ? "partial" : "success";
  const report = buildBusinessIdeaReport({
    productConfig,
    content,
    language,
    score,
    criteria: reportCriteria,
    recommendation,
    verdictKey,
  });

  report.status = status;

  return {
    ok: true,
    state: status,
    evaluationStatus: "evaluated",
    analysis,
    validation,
    criteria: reportCriteria,
    score,
    verdictKey,
    confidence,
    recommendation,
    biggestRisk: recommendation.reason,
    nextAction: recommendation.action,
    improvedIdea,
    report,
    contradictions: ruleContext.contradictions,
    feasibilityFoundation: decision.feasibilityFoundation,
    orchestrationDecision: decision,
  };
}
