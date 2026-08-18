import { useEffect, useMemo, useState } from 'react';
import { renderHeader } from '../../components/Header/index.js';
import { renderFooter } from '../../components/Footer/index.js';
import productConfig from '../../products/business/idea-validator/config.js';
import contentEn from '../../products/business/idea-validator/content.en.js';
import contentAr from '../../products/business/idea-validator/content.ar.js';
import { buildBusinessIdeaReport, buildBusinessIdeaReportText } from '../../products/business/idea-validator/report.js';
import { buildIndustrialPreliminaryAnalysis, buildIndustrialReportText } from '../../products/business/idea-validator/industrialAnalysis.js';
import { buildBusinessIdeaRecommendation, refineBusinessIdeaCriteria } from '../../products/business/idea-validator/recommendations.js';
import { buildImprovedIdeaStatement, scoreBusinessIdea } from '../../products/business/idea-validator/scoring.js';
import { inputSchema } from '../../products/business/idea-validator/questions.js';
import { applyDocumentLocale, bindLanguageSwitcher } from '../../core/localization.js';
import { orchestrateBusinessIdeaValidation } from '../../products/business/idea-validator/validatorOrchestrator.js';

const contentMap = { en: contentEn, ar: contentAr };

const defaultPageContent = {
  formTitle: 'Business Idea Validator',
  description: 'Describe your idea and receive a structured report.',
  processing: 'Analyzing the idea...',
  states: {
    idle: 'Enter your idea details to begin.',
    input: 'Keep your answers short and specific.',
    invalid: 'Some required inputs need attention.',
    ready: 'Ready to analyze.',
    success: 'Validation complete.',
    partial: 'Validation complete with limited confidence.',
    error: 'The validation could not be completed. Please review the inputs.',
    reset: 'Start again.',
  },
  fields: {
    businessName: 'Business name',
    industry: 'Industry',
    targetCustomer: 'Target customer',
    problemSolved: 'Problem solved',
    currentSolution: 'Current customer workaround',
    competitiveAdvantage: 'Competitive advantage',
    revenueModel: 'Revenue model',
    stage: 'Stage',
  },
  helpText: {
    problemSolved: 'Briefly describe the problem the customer has.',
    currentSolution: 'Describe the customer’s current workaround or alternative.',
  },
  stageOptions: {
    idea: 'Idea',
    mvp: 'MVP',
    launched: 'Launched',
  },
  actions: {
    previous: 'Previous',
    next: 'Next',
    submit: 'Validate idea',
    validating: 'Validating...',
  },
  labels: {
    status: 'Status',
    summary: 'Your answers will be reviewed by the existing validator engine.',
    guidance: 'Complete the form and review the report once analysis is available.',
    report: 'Report',
    reportTitle: 'Assessment report',
    overallScore: 'Overall score',
    marketPotential: 'Market potential',
    executionDifficulty: 'Execution difficulty',
    competitionLevel: 'Competition level',
    mainRisks: 'Main risks',
    keyStrengths: 'Key strengths',
    recommendedNextAction: 'Recommended next action',
    copyReport: 'Copy report',
    downloadReport: 'Download report',
    startAgain: 'Start again',
    noStrengths: 'No strengths yet',
  },
  steps: ['Context', 'Problem & solution', 'Positioning & economics'],
  signalValues: {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    moderate: 'Moderate',
  },
  categories: {},
  verdicts: {},
  confidence: {},
  report: {},
};

const initialFormData = {
  businessName: '',
  industry: '',
  targetCustomer: '',
  problemSolved: '',
  currentSolution: '',
  competitiveAdvantage: '',
  revenueModel: '',
  stage: 'idea',
};

const initialIndustrialDetails = {
  plasticWasteType: '',
  intendedOutput: '',
  targetProductionCapacity: '',
  availableBudgetSar: '',
  preferredCityRegion: '',
  existingPremises: '',
  wasteSourceQuantity: '',
  industrialExperienceTeam: '',
  expectedBuyers: '',
  salesScope: '',
};

const initialFeasibilityAnswers = {};

function buildEngineInput(formData, language = 'en') {
  const fieldPrefixes =
    language === 'ar'
      ? {
          industry: 'القطاع',
          currentSolution: 'طريقة العميل الحالية',
          competitiveAdvantage: 'الميزة التنافسية',
        }
      : {
          industry: 'Industry',
          currentSolution: 'Current customer workaround',
          competitiveAdvantage: 'Competitive advantage',
        };
  const businessIdea = [
    formData.businessName,
    formData.industry ? `${fieldPrefixes.industry}: ${formData.industry}` : '',
    formData.currentSolution ? `${fieldPrefixes.currentSolution}: ${formData.currentSolution}` : '',
    formData.competitiveAdvantage ? `${fieldPrefixes.competitiveAdvantage}: ${formData.competitiveAdvantage}` : '',
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    businessIdea,
    targetCustomer: formData.targetCustomer,
    problem: formData.problemSolved,
    monetization: formData.revenueModel,
    stage: formData.stage,
    currentSolution: formData.currentSolution,
    competitiveAdvantage: formData.competitiveAdvantage,
  };
}

function deriveReportSignals(result, formData, content) {
  const criteria = result.criteria || [];
  const marketNeed = criteria.find((item) => item.key === 'marketNeed');
  const feasibility = criteria.find((item) => item.key === 'feasibility');
  const scoreTotal = result.score?.total || 0;
  const signalValues = content.signalValues || defaultPageContent.signalValues;

  const marketPotential = scoreTotal >= 75 ? signalValues.high : scoreTotal >= 55 ? signalValues.medium : signalValues.low;
  const executionDifficulty = feasibility?.score >= 14 ? signalValues.low : feasibility?.score >= 10 ? signalValues.medium : signalValues.high;
  const competitionLevel = formData.competitiveAdvantage && formData.competitiveAdvantage.length > 16 ? signalValues.moderate : signalValues.high;
  const strengths = criteria
    .filter((item) => item.score >= 12)
    .map((item) => content.categories[item.key] || item.key)
    .slice(0, 3);
  const mainRisks = [result.biggestRisk].filter(Boolean);

  return {
    marketPotential,
    executionDifficulty,
    competitionLevel,
    strengths,
    mainRisks,
    marketNeedScore: marketNeed?.score ?? 0,
  };
}

function executeBusinessValidation(rawInput, language, industrialDetails = {}, feasibilityAnswers = {}) {
  const decision = orchestrateBusinessIdeaValidation({
    rawInput,
    language,
    industrialDetails,
    feasibilityAnswers,
  });
  const { analysis, validation } = decision;

  if (decision.route === 'validation_error') {
    return {
      ok: false,
      state: 'invalid',
      analysis,
      validation,
      orchestrationDecision: decision,
    };
  }

  if (['ineligible', 'needs_clarification'].includes(decision.route) && decision.eligibility) {
    const eligibility = decision.eligibility;
    return {
      ok: true,
      state: eligibility.status === 'ineligible' ? 'ineligible' : 'clarification',
      evaluationStatus: eligibility.status,
      analysis,
      validation,
      eligibility,
      message: eligibility.message,
      policyText: eligibility.policyText,
      title: eligibility.title,
      presentation: eligibility.presentation,
      orchestrationDecision: decision,
    };
  }

  if (decision.route === 'needs_clarification' && decision.requestAssessment) {
    const requestAssessment = decision.requestAssessment;
    return {
      ok: true,
      state: 'clarification',
      evaluationStatus: 'needs_clarification',
      analysis,
      validation,
      requestAssessment,
      message: requestAssessment.message,
      title: requestAssessment.title,
      presentation: requestAssessment.presentation,
      clarificationFlow: requestAssessment.clarificationFlow,
      feasibilityFoundation: decision.feasibilityFoundation,
      orchestrationDecision: decision,
    };
  }

  if (decision.route === 'specialist_analysis') {
    const requestAssessment = decision.requestAssessment;
    const industrialReport = buildIndustrialPreliminaryAnalysis({
      rawInput,
      requestAssessment,
      industrialDetails,
      language,
    });
    return {
      ok: true,
      state: 'industrial_report',
      evaluationStatus: 'industrial_assessment',
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

  if (decision.route === 'guided_follow_up') {
    const guidedFeasibility = decision.guidedFeasibility;
    return {
      ok: true,
      state: 'clarification',
      evaluationStatus:
        guidedFeasibility.status === 'ready_for_preliminary_feasibility'
          ? 'feasibility_ready'
          : 'feasibility_followup',
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
  const status = confidence.level === 'low' ? 'partial' : 'success';
  const report = buildBusinessIdeaReport({
    productConfig,
    content: contentMap[language],
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
    evaluationStatus: 'evaluated',
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

function buildResultText(result, pageContent, language) {
  if (result?.evaluationStatus === 'industrial_assessment' && result.industrialReport) {
    return buildIndustrialReportText({ report: result.industrialReport, language });
  }

  if (result?.evaluationStatus && result.evaluationStatus !== 'evaluated') {
    const presentation = result.presentation || {};
    const questions = presentation.questions?.length ? presentation.questions.map((question) => `- ${question}`).join('\n') : '';
    return [presentation.heading, presentation.body, presentation.policy, questions, presentation.closing].filter(Boolean).join('\n\n');
  }

  return buildBusinessIdeaReportText({
    productConfig,
    content: pageContent,
    language,
    result,
  });
}

function BusinessIdeaValidatorPage({ locale, product, content }) {
  const { language } = locale;
  const pageContent = useMemo(() => {
    const baseContent = contentMap[language] || contentMap.en;
    return {
      ...defaultPageContent,
      ...baseContent,
      states: { ...defaultPageContent.states, ...(baseContent?.states || {}) },
      fields: { ...defaultPageContent.fields, ...(baseContent?.fields || {}) },
      helpText: { ...defaultPageContent.helpText, ...(baseContent?.helpText || {}) },
      stageOptions: { ...defaultPageContent.stageOptions, ...(baseContent?.stageOptions || {}) },
      actions: { ...defaultPageContent.actions, ...(baseContent?.actions || {}) },
      labels: { ...defaultPageContent.labels, ...(baseContent?.labels || {}) },
      steps: baseContent?.steps || defaultPageContent.steps,
      signalValues: { ...defaultPageContent.signalValues, ...(baseContent?.signalValues || {}) },
      categories: { ...defaultPageContent.categories, ...(baseContent?.categories || {}) },
      verdicts: { ...defaultPageContent.verdicts, ...(baseContent?.verdicts || {}) },
      confidence: { ...defaultPageContent.confidence, ...(baseContent?.confidence || {}) },
      report: { ...defaultPageContent.report, ...(baseContent?.report || {}) },
    };
  }, [language]);
  const [formData, setFormData] = useState(initialFormData);
  const [industrialDetails, setIndustrialDetails] = useState(initialIndustrialDetails);
  const [feasibilityAnswers, setFeasibilityAnswers] = useState(initialFeasibilityAnswers);
  const [industrialClarificationStep, setIndustrialClarificationStep] = useState(1);
  const [clarificationErrors, setClarificationErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({
    tone: 'info',
    stateKey: 'idle',
    message: pageContent?.states?.idle || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [reportText, setReportText] = useState('');

  useEffect(() => {
    applyDocumentLocale(language);
  }, [language]);

  useEffect(() => {
    return bindLanguageSwitcher({ language, setLanguage: locale.setLanguage });
  }, [language, locale.setLanguage]);

  useEffect(() => {
    setStatus((current) => {
      if (current.stateKey && pageContent.states[current.stateKey]) {
        return { ...current, message: pageContent.states[current.stateKey] };
      }

      if (current.reportKey && pageContent.report[current.reportKey]) {
        return { ...current, message: pageContent.report[current.reportKey] };
      }

      return current;
    });
  }, [pageContent]);

  useEffect(() => {
    if (!result) return;

    const localizedResult = executeBusinessValidation(buildEngineInput(formData, language), language, industrialDetails, feasibilityAnswers);
    if (!localizedResult.ok) return;

    setResult(localizedResult);
    setReportText(buildResultText(localizedResult, pageContent, language));
  }, [language]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    if (['businessName', 'industry', 'problemSolved'].includes(name)) {
      setIndustrialDetails(initialIndustrialDetails);
      setFeasibilityAnswers(initialFeasibilityAnswers);
      setIndustrialClarificationStep(1);
      setClarificationErrors({});
    }
    if (status.tone !== 'info' || status.message !== pageContent.states.idle) {
      setStatus({ tone: 'info', stateKey: 'input', message: pageContent.states.input });
    }
  };

  const handleClarificationDetailChange = (event) => {
    const { name, value } = event.target;
    if (result?.clarificationFlow?.type === 'feasibility_guided') {
      setFeasibilityAnswers((current) => ({ ...current, [name]: value }));
    } else {
      setIndustrialDetails((current) => ({ ...current, [name]: value }));
    }
    setClarificationErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    setStatus({ tone: 'info', message: pageContent.processing });

    try {
      const engineInput = buildEngineInput(formData, language);
      const validationResult = executeBusinessValidation(engineInput, language, industrialDetails, feasibilityAnswers);

      if (!validationResult.ok) {
        const fieldErrors = {};
        validationResult.validation.errors.forEach((error) => {
          const fieldDef = inputSchema.find((f) => f.id === error.field);
          // Prefer specific validation message from schema, fall back to a helpful prompt
          fieldErrors[error.field] =
            (fieldDef && fieldDef.validationMessage && fieldDef.validationMessage[language]) ||
            `${fieldDef ? fieldDef.label[language] : error.field}: ${pageContent.states.invalid}`;
        });
        setErrors(fieldErrors);
        setResult(null);
        setStatus({ tone: 'error', stateKey: 'invalid', message: pageContent.states.invalid });
        setIsSubmitting(false);
        return;
      }

      setReportText(buildResultText(validationResult, pageContent, language));
      setResult(validationResult);
      setStatus({
        tone: validationResult.evaluationStatus === 'ineligible' ? 'error' : 'success',
        stateKey: validationResult.evaluationStatus === 'evaluated' ? 'success' : undefined,
        message: validationResult.message || pageContent.states.success,
      });
    } catch (error) {
      setResult(null);
      setStatus({ tone: 'error', stateKey: 'error', message: pageContent.states.error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueIndustrialClarification = () => {
    const engineInput = buildEngineInput(formData, language);
    const validationResult = executeBusinessValidation(engineInput, language, industrialDetails, feasibilityAnswers);

    if (['needs_clarification', 'feasibility_followup'].includes(validationResult.evaluationStatus)) {
      const missingFields = validationResult.clarificationFlow?.steps?.flatMap((step) => step.fields) || [];
      const nextErrors = missingFields.reduce((messages, field) => {
        const source = validationResult.clarificationFlow?.type === 'feasibility_guided' ? feasibilityAnswers : industrialDetails;
        if (field.required && !source[field.id]) {
          messages[field.id] = language === 'ar' ? 'هذا الحقل مطلوب للمتابعة.' : 'This field is required to continue.';
        }
        return messages;
      }, {});
      setClarificationErrors(nextErrors);
      setResult(validationResult);
      setReportText(buildResultText(validationResult, pageContent, language));
      setStatus({ tone: 'info', message: validationResult.message || pageContent.states.input });
      setIndustrialClarificationStep(1);
      return;
    }

    setClarificationErrors({});
    setResult(validationResult);
    setReportText(buildResultText(validationResult, pageContent, language));
    setStatus({ tone: 'success', message: validationResult.message || pageContent.states.success });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setStatus({ tone: 'success', reportKey: 'copied', message: pageContent.report.copied });
    } catch {
      setStatus({ tone: 'error', reportKey: 'copyFailed', message: pageContent.report.copyFailed });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'business-idea-validator-report.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setIndustrialDetails(initialIndustrialDetails);
    setFeasibilityAnswers(initialFeasibilityAnswers);
    setIndustrialClarificationStep(1);
    setClarificationErrors({});
    setCurrentStep(1);
    setErrors({});
    setResult(null);
    setReportText('');
    setStatus({ tone: 'info', stateKey: 'reset', message: pageContent.states.reset });
  };

  const isEligibilityResult = result?.evaluationStatus && !['evaluated', 'industrial_assessment'].includes(result.evaluationStatus);
  const eligibilityPresentation = result?.presentation || {
    heading: result?.title,
    body: result?.message,
    policy: result?.policyText,
    closing: '',
  };
  const reportSignals = result?.evaluationStatus === 'evaluated' ? deriveReportSignals(result, formData, pageContent) : null;
  const industrialReport = result?.evaluationStatus === 'industrial_assessment' ? result.industrialReport : null;
  const clarificationFlow = result?.clarificationFlow;
  const clarificationSteps = clarificationFlow?.steps || [];
  const currentClarificationStep = clarificationSteps[Math.min(industrialClarificationStep, clarificationSteps.length) - 1];
  const activeClarificationDetails = clarificationFlow?.type === 'feasibility_guided' ? feasibilityAnswers : industrialDetails;

  const main = (
    <div className="validator-shell">
      <div className="validator-panel">
        <section className="card" aria-labelledby="validator-form-title">
          <div className="card__body">
            <div className="validator-stepper" aria-label={pageContent.labels.stepperLabel || 'Form steps'}>
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  type="button"
                  className={`step-pill ${currentStep === step ? 'is-active' : ''}`}
                  onClick={() => setCurrentStep(step)}
                  aria-current={currentStep === step ? 'step' : undefined}
                >
                  <span>{step}</span>
                  <span>{pageContent?.steps?.[step - 1] || `Step ${step}`}</span>
                </button>
              ))}
            </div>

            <h2 id="validator-form-title">{pageContent.formTitle}</h2>
            <p className="validator-intro">{pageContent.description}</p>

            <form className="validator-form" onSubmit={handleSubmit} noValidate>
              {currentStep === 1 && (
                <div className="validator-step-grid">
                  <label className="field">
                    <span className="field__label">{pageContent?.fields?.businessName || 'Business name'}</span>
                    <input
                      className="field__control"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                    />
                    <span className="field__error">{errors.businessName || ''}</span>
                  </label>
                  <label className="field">
                    <span className="field__label">{pageContent?.fields?.industry || 'Industry'}</span>
                    <input
                      className="field__control"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      required
                    />
                    <span className="field__error">{errors.industry || ''}</span>
                  </label>
                  <label className="field">
                    <span className="field__label">{pageContent?.fields?.targetCustomer || 'Target customer'}</span>
                    <textarea
                      className="field__control field__control--textarea"
                      name="targetCustomer"
                      value={formData.targetCustomer}
                      onChange={handleChange}
                      required
                    />
                    <span className="field__error">{errors.targetCustomer || ''}</span>
                  </label>
                </div>
              )}

              {currentStep === 2 && (
                <div className="validator-step-grid">
                  <label className="field">
                    <span className="field__label">{pageContent?.fields?.problemSolved || 'Problem solved'}</span>
                    <span className="field__help">{pageContent?.helpText?.problemSolved || ''}</span>
                    <textarea
                      className="field__control field__control--textarea"
                      name="problemSolved"
                      value={formData.problemSolved}
                      onChange={handleChange}
                      required
                    />
                    <span className="field__error">{errors.problemSolved || ''}</span>
                  </label>
                  <label className="field">
                    <span className="field__label">{pageContent?.fields?.currentSolution || 'Current solution'}</span>
                    <span className="field__help">{pageContent?.helpText?.currentSolution || ''}</span>
                    <textarea
                      className="field__control field__control--textarea"
                      name="currentSolution"
                      value={formData.currentSolution}
                      onChange={handleChange}
                      required
                    />
                    <span className="field__error">{errors.currentSolution || ''}</span>
                  </label>
                </div>
              )}

              {currentStep === 3 && (
                <div className="validator-step-grid">
                  <label className="field">
                    <span className="field__label">{pageContent?.fields?.competitiveAdvantage || 'Competitive advantage'}</span>
                    <textarea
                      className="field__control field__control--textarea"
                      name="competitiveAdvantage"
                      value={formData.competitiveAdvantage}
                      onChange={handleChange}
                      required
                    />
                    <span className="field__error">{errors.competitiveAdvantage || ''}</span>
                  </label>
                  <label className="field">
                    <span className="field__label">{pageContent?.fields?.revenueModel || 'Revenue model'}</span>
                    <textarea
                      className="field__control field__control--textarea"
                      name="revenueModel"
                      value={formData.revenueModel}
                      onChange={handleChange}
                      required
                    />
                    <span className="field__error">{errors.revenueModel || ''}</span>
                  </label>
                  <label className="field">
                    <span className="field__label">{pageContent?.fields?.stage || 'Stage'}</span>
                    <select
                      className="field__control"
                      name="stage"
                      value={formData.stage}
                      onChange={handleChange}
                    >
                      <option value="idea">{pageContent?.stageOptions?.idea || 'Idea'}</option>
                      <option value="mvp">{pageContent?.stageOptions?.mvp || 'MVP'}</option>
                      <option value="launched">{pageContent?.stageOptions?.launched || 'Launched'}</option>
                    </select>
                    <span className="field__error">{errors.stage || ''}</span>
                  </label>
                </div>
              )}

              <div className="validator-actions">
                <button className="button button--secondary" type="button" onClick={() => setCurrentStep((step) => Math.max(step - 1, 1))} disabled={currentStep === 1}>
                  {pageContent?.actions?.previous || 'Previous'}
                </button>
                {currentStep < 3 ? (
                  <button className="button button--primary" type="button" onClick={() => setCurrentStep((step) => Math.min(step + 1, 3))}>
                    {pageContent?.actions?.next || 'Next'}
                  </button>
                ) : (
                  <button className="button button--primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (pageContent?.actions?.validating || 'Validating...') : (pageContent?.actions?.submit || 'Validate idea')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        <aside className="validator-status-panel">
          {!isEligibilityResult && !industrialReport ? (
            <section className="card" aria-live="polite">
              <div className="card__body">
                <p className="eyebrow">{pageContent.labels.status}</p>
                <div className={`status-pill status-pill--${status.tone}`}>{status.message}</div>
                <div className="validator-brief">
                  <p>{pageContent.labels.summary}</p>
                  <p>{pageContent.labels.guidance}</p>
                </div>
              </div>
            </section>
          ) : null}

          {isEligibilityResult ? (
            <section className="card" aria-labelledby="validator-policy-title">
              <div className="card__body">
                <p className="eyebrow">{pageContent.labels.status}</p>
                <h3 id="validator-policy-title">{eligibilityPresentation.heading}</h3>
                <div className="report-section">
                  <p>{eligibilityPresentation.body}</p>
                  <p>{eligibilityPresentation.policy}</p>
                  {clarificationFlow?.steps?.length ? (
                    <div className="clarification-questions">
                      <p className="clarification-questions__title">
                        {eligibilityPresentation.detailsTitle || (language === 'ar' ? 'التفاصيل المطلوبة' : 'Details needed')}
                      </p>
                      <div className="clarification-stepper" aria-label={language === 'ar' ? 'خطوات التوضيح' : 'Clarification steps'}>
                        {clarificationSteps.map((step, index) => (
                          <button
                            key={step.id}
                            type="button"
                            className={`clarification-step ${industrialClarificationStep === index + 1 ? 'is-active' : ''}`}
                            onClick={() => setIndustrialClarificationStep(index + 1)}
                            aria-current={industrialClarificationStep === index + 1 ? 'step' : undefined}
                          >
                            <span>{index + 1}</span>
                            <span>{step.title}</span>
                          </button>
                        ))}
                      </div>
                      {currentClarificationStep ? (
                        <div className="clarification-fields">
                          {currentClarificationStep.fields.map((field) => (
                            <label className="field" key={field.id}>
                              <span className="field__label">{field.labelText}</span>
                              {field.type === 'select' ? (
                                <select
                                  className="field__control"
                                  name={field.id}
                                  value={activeClarificationDetails[field.id] || ''}
                                  onChange={handleClarificationDetailChange}
                                  required
                                >
                                  <option value="">{field.placeholderText}</option>
                                  {field.options.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.labelText}
                                    </option>
                                  ))}
                                </select>
                              ) : field.type === 'textarea' ? (
                                <textarea
                                  className="field__control field__control--textarea"
                                  name={field.id}
                                  value={activeClarificationDetails[field.id] || ''}
                                  onChange={handleClarificationDetailChange}
                                  placeholder={field.placeholderText}
                                  required
                                />
                              ) : (
                                <input
                                  className="field__control"
                                  name={field.id}
                                  value={activeClarificationDetails[field.id] || ''}
                                  onChange={handleClarificationDetailChange}
                                  placeholder={field.placeholderText}
                                  required
                                />
                              )}
                              {field.sourceLabel ? <span className="field__help">{field.sourceLabel}</span> : null}
                              {field.helpText ? <span className="field__help">{field.helpText}</span> : null}
                              <span className="field__error">{clarificationErrors[field.id] || ''}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                      <div className="clarification-actions">
                        <button
                          className="button button--secondary"
                          type="button"
                          onClick={() => setIndustrialClarificationStep((step) => Math.max(step - 1, 1))}
                          disabled={industrialClarificationStep === 1}
                        >
                          {clarificationFlow.labels.previous}
                        </button>
                        {industrialClarificationStep < clarificationSteps.length ? (
                          <button
                            className="button button--primary"
                            type="button"
                            onClick={() => setIndustrialClarificationStep((step) => Math.min(step + 1, clarificationSteps.length))}
                          >
                            {clarificationFlow.labels.next}
                          </button>
                        ) : (
                          <button className="button button--primary" type="button" onClick={handleContinueIndustrialClarification}>
                            {clarificationFlow.labels.continue}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : eligibilityPresentation.questions?.length ? (
                    <div className="clarification-questions">
                      <p className="clarification-questions__title">
                        {language === 'ar' ? 'التفاصيل المطلوبة' : 'Details needed'}
                      </p>
                      <ol>
                        {eligibilityPresentation.questions.map((question) => (
                          <li key={question}>{question}</li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  {eligibilityPresentation.closing ? <p>{eligibilityPresentation.closing}</p> : null}
                </div>
                <div className="report-actions">
                  <button className="button button--secondary" type="button" onClick={handleReset}>
                    {pageContent.labels.startAgain}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {result && reportSignals ? (
            <section className="card" aria-labelledby="validator-report-title">
              <div className="card__body">
                <p className="eyebrow">{pageContent.labels.report}</p>
                <h3 id="validator-report-title">{pageContent.labels.reportTitle}</h3>
                <div className="report-grid">
                  <div className="report-card">
                    <span>{pageContent.labels.overallScore}</span>
                    <strong>{result.score.total}/100</strong>
                  </div>
                  <div className="report-card">
                    <span>{pageContent.labels.marketPotential}</span>
                    <strong>{reportSignals.marketPotential}</strong>
                  </div>
                  <div className="report-card">
                    <span>{pageContent.labels.executionDifficulty}</span>
                    <strong>{reportSignals.executionDifficulty}</strong>
                  </div>
                  <div className="report-card">
                    <span>{pageContent.labels.competitionLevel}</span>
                    <strong>{reportSignals.competitionLevel}</strong>
                  </div>
                </div>

                <div className="report-section">
                  <h4>{pageContent.labels.mainRisks}</h4>
                  <ul>
                    {reportSignals.mainRisks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                </div>

                <div className="report-section">
                  <h4>{pageContent.labels.keyStrengths}</h4>
                  <div className="tag-list">
                    {reportSignals.strengths.length > 0 ? (
                      reportSignals.strengths.map((strength) => <span className="tag" key={strength}>{strength}</span>)
                    ) : (
                      <span className="tag">{pageContent.labels.noStrengths}</span>
                    )}
                  </div>
                </div>

                <div className="report-section">
                  <h4>{pageContent.labels.recommendedNextAction}</h4>
                  <p>{result.nextAction}</p>
                </div>

                <div className="report-actions">
                  <button className="button button--secondary" type="button" onClick={handleCopy}>
                    {pageContent.labels.copyReport}
                  </button>
                  <button className="button button--secondary" type="button" onClick={handleDownload}>
                    {pageContent.labels.downloadReport}
                  </button>
                  <button className="button button--secondary" type="button" onClick={handleReset}>
                    {pageContent.labels.startAgain}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {industrialReport ? (
            <section className="card" aria-labelledby="validator-industrial-report-title">
              <div className="card__body">
                <p className="eyebrow">{pageContent.labels.report}</p>
                <h3 id="validator-industrial-report-title">{industrialReport.title}</h3>
                <div className="report-grid">
                  <div className="report-card">
                    <span>{industrialReport.language === 'ar' ? 'القرار التنفيذي' : 'Executive decision'}</span>
                    <strong>{industrialReport.decision.label}</strong>
                  </div>
                  <div className="report-card">
                    <span>{industrialReport.language === 'ar' ? 'مستوى الثقة' : 'Confidence'}</span>
                    <strong>{industrialReport.decision.confidence.label} ({industrialReport.decision.confidence.value}/100)</strong>
                  </div>
                </div>

                <div className="report-section">
                  <p>{industrialReport.decision.explanation}</p>
                  <p className="muted-text">{industrialReport.decision.confidence.reason}</p>
                </div>

                <div className="industrial-report">
                  {industrialReport.evidence.map((group) => (
                    <div className="report-section" key={group.title}>
                      <h4>{group.title}</h4>
                      <ul>
                        {group.items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  ))}

                  {industrialReport.sections.map((section) => (
                    <div className="report-section" key={section.key}>
                      <h4>{section.status ? `${section.title}: ${section.status}` : section.title}</h4>
                      {section.items?.length ? (
                        <ul>
                          {section.items.map((item) => (
                            <li key={`${item.title || item}-${item.detail || ''}`}>
                              {typeof item === 'string' ? item : (
                                <>
                                  <strong>{item.title}</strong>
                                  {item.status ? <span className="tag tag--inline">{item.status}</span> : null}
                                  {item.detail ? <span>{item.detail}</span> : null}
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {section.groups?.length ? (
                        <div className="industrial-report__groups">
                          {section.groups.map((group) => (
                            <div className="report-card" key={group.title}>
                              <strong>{group.title}</strong>
                              <ul>
                                {group.items.map((item) => <li key={item}>{item}</li>)}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {section.missing?.length ? (
                        <ul>
                          {section.missing.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="report-section">
                  <p className="muted-text">{industrialReport.disclaimer}</p>
                </div>

                <div className="report-actions">
                  <button className="button button--secondary" type="button" onClick={handleCopy}>
                    {pageContent.labels.copyReport}
                  </button>
                  <button className="button button--secondary" type="button" onClick={handleDownload}>
                    {pageContent.labels.downloadReport}
                  </button>
                  <button className="button button--secondary" type="button" onClick={handleReset}>
                    {pageContent.labels.startAgain}
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: renderHeader(content.header, language) }} />
      <main className="product-page">
        <div className="container">
          <nav className="breadcrumb" aria-label={content.breadcrumbLabel}>
            <a href={content.homeHref || '/'}>{content.homeLabel}</a>
            <span aria-hidden="true">/</span>
            <span>{product.name[language] || product.name.en}</span>
          </nav>
          <section className="product-hero" aria-labelledby="product-title">
            <p className="eyebrow">{content.eyebrow}</p>
            <h1 id="product-title">{product.name[language] || product.name.en}</h1>
            <p>{product.shortDescription[language] || product.shortDescription.en}</p>
          </section>
          {main}
        </div>
      </main>
      <div dangerouslySetInnerHTML={{ __html: renderFooter(content.footer) }} />
    </div>
  );
}

export default BusinessIdeaValidatorPage;
