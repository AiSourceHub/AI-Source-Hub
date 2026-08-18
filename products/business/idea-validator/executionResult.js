import productConfig from "./config.js";
import { buildBusinessIdeaReport } from "./report.js";
import { buildIndustrialPreliminaryAnalysis } from "./industrialAnalysis.js";
import { buildBusinessIdeaRecommendation, refineBusinessIdeaCriteria } from "./recommendations.js";
import { buildImprovedIdeaStatement, scoreBusinessIdea } from "./scoring.js";
import { orchestrateBusinessIdeaValidation } from "./validatorOrchestrator.js";

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
    return {
      ok: false,
      state: "invalid",
      analysis,
      validation,
      orchestrationDecision: decision,
    };
  }

  if (decision.route === "ineligible" && decision.eligibility) {
    return {
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
    };
  }

  if (decision.route === "needs_clarification") {
    if (decision.eligibility) {
      return {
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
      };
    }

    if (decision.requestAssessment) {
      return {
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
      };
    }
  }

  if (decision.route === "guided_follow_up") {
    const guidedFeasibility = decision.guidedFeasibility;
    return {
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
    };
  }

  if (decision.route === "specialist_analysis") {
    const requestAssessment = decision.requestAssessment;
    const industrialReport = buildIndustrialPreliminaryAnalysis({
      rawInput,
      requestAssessment,
      industrialDetails,
      language: lang,
    });
    return {
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
    };
  }

  return buildNormalEvaluationResult({
    decision,
    rawInput,
    language: lang,
    content,
    analysis,
    validation,
  });
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
