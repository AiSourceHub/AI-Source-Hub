import { useEffect, useMemo, useState } from 'react';
import { renderHeader } from '../../components/Header/index.js';
import { renderFooter } from '../../components/Footer/index.js';
import productConfig from '../../products/business/idea-validator/config.js';
import contentEn from '../../products/business/idea-validator/content.en.js';
import contentAr from '../../products/business/idea-validator/content.ar.js';
import { buildBusinessIdeaReportText } from '../../products/business/idea-validator/report.js';
import { buildIndustrialReportText } from '../../products/business/idea-validator/industrialAnalysis.js';
import { inputSchema } from '../../products/business/idea-validator/questions.js';
import { applyDocumentLocale, bindLanguageSwitcher } from '../../core/localization.js';
import { BIV_JOURNEY_STATES } from '../../products/business/idea-validator/executionResult.js';
import { executeBusinessIdeaValidationRuntime } from '../../products/business/idea-validator/runtimeExecutionBoundary.js';

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
    ideaDescription: 'Describe the business idea briefly',
    industry: 'Industry',
    targetCustomer: 'Target customer',
    problemSolved: 'Problem solved',
    currentSolution: 'Current customer workaround',
    competitiveAdvantage: 'Competitive advantage',
    revenueModel: 'Revenue model',
    stage: 'Stage',
  },
  helpText: {
    ideaDescription: 'What will the business provide, to whom, and does the service travel to the customer or does the customer visit the business location?',
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
    next: 'Continue',
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
  steps: ['About You', 'Your Idea', 'Classification'],
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
  ideaDescription: '',
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
    formData.ideaDescription,
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
    stage: mapJourneyStageToEngineStage(formData.stage),
    currentSolution: formData.currentSolution,
    competitiveAdvantage: formData.competitiveAdvantage,
  };
}

function mapJourneyStageToEngineStage(stage = 'idea') {
  if (['operating', 'improving', 'expanding', 'launched'].includes(stage)) return 'launched';
  if (['preparing_to_launch', 'mvp'].includes(stage)) return 'mvp';
  return 'idea';
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
  return executeBusinessIdeaValidationRuntime({
    rawInput,
    language,
    industrialDetails,
    feasibilityAnswers,
    content: contentMap[language],
    env: import.meta.env,
  });
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
      journey: baseContent?.journey || contentMap.en.journey,
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
  const journeyCopy = pageContent.journey;

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
    setResult(localizedResult);
    setReportText(localizedResult.ok ? buildResultText(localizedResult, pageContent, language) : '');
  }, [language]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    if (['businessName', 'ideaDescription', 'industry', 'targetCustomer', 'problemSolved', 'currentSolution', 'competitiveAdvantage', 'revenueModel'].includes(name)) {
      setIndustrialDetails(initialIndustrialDetails);
      setFeasibilityAnswers((current) => ({
        userExperienceLevel: current.userExperienceLevel || '',
        firstProject: current.firstProject || '',
        projectStageIntent: current.projectStageIntent || '',
        country: current.country || '',
        city: current.city || '',
        decisionObjective: current.decisionObjective || '',
      }));
      setIndustrialClarificationStep(1);
      setClarificationErrors({});
    }
    if (status.tone !== 'info' || status.message !== pageContent.states.idle) {
      setStatus({ tone: 'info', stateKey: 'input', message: pageContent.states.input });
    }
  };

  const handleJourneyAnswerChange = (event) => {
    const { name, value } = event.target;
    setFeasibilityAnswers((current) => ({ ...current, [name]: value }));
    if (name === 'projectStageIntent') {
      setFormData((current) => ({ ...current, stage: mapJourneyStageToEngineStage(value) }));
    }
    setErrors((current) => ({ ...current, [name]: '' }));
    setClarificationErrors((current) => ({ ...current, [name]: '' }));
    if (
      (name === 'classificationConfirmation' && value === 'correct') ||
      ['projectTypeCorrection', 'operatingModelCorrection', 'classificationCorrectionReason'].includes(name)
    ) {
      const nextAnswers = { ...feasibilityAnswers, [name]: value };
      const validationResult = executeBusinessValidation(buildEngineInput(formData, language), language, industrialDetails, nextAnswers);
      if (validationResult.ok) {
        setResult(validationResult);
        setReportText(buildResultText(validationResult, pageContent, language));
      }
    } else if (name === 'classificationConfirmation' && value !== 'correct') {
      setFeasibilityAnswers((current) => ({
        ...current,
        classificationConfirmation: value,
        projectTypeCorrection: '',
        operatingModelCorrection: '',
        classificationCorrectionReason: '',
      }));
    }
    if (status.tone !== 'info' || status.message !== pageContent.states.idle) {
      setStatus({ tone: 'info', stateKey: 'input', message: pageContent.states.input });
    }
  };

  const validateCurrentJourneyStep = () => {
    const nextErrors = {};
    if (currentStep === 1) {
      ['userExperienceLevel', 'firstProject', 'projectStageIntent', 'country', 'decisionObjective'].forEach((fieldId) => {
        if (!String(feasibilityAnswers[fieldId] || '').trim()) {
          nextErrors[fieldId] = journeyCopy.required;
        }
      });
    }

    if (currentStep === 2) {
      [
        ['ideaDescription', 10],
        ['targetCustomer', 5],
        ['problemSolved', 8],
        ['currentSolution', 3],
        ['competitiveAdvantage', 3],
        ['revenueModel', 4],
      ].forEach(([fieldId, minLength]) => {
        if (String(formData[fieldId] || '').trim().length < minLength) {
          nextErrors[fieldId] = journeyCopy.required;
        }
      });
    }

    if (currentStep === 3) {
      if (!String(feasibilityAnswers.classificationConfirmation || '').trim()) {
        nextErrors.classificationConfirmation = journeyCopy.required;
      }
      if (feasibilityAnswers.classificationConfirmation === 'correct' && !String(feasibilityAnswers.projectTypeCorrection || '').trim()) {
        nextErrors.projectTypeCorrection = journeyCopy.required;
      }
      if (feasibilityAnswers.classificationConfirmation === 'correct' && !String(feasibilityAnswers.operatingModelCorrection || '').trim()) {
        nextErrors.operatingModelCorrection = journeyCopy.required;
      }
    }

    setErrors((current) => ({ ...current, ...nextErrors }));
    setClarificationErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const prepareClassificationStep = () => {
    const validationResult = executeBusinessValidation(buildEngineInput(formData, language), language, industrialDetails, feasibilityAnswers);
    if (!validationResult.ok) {
      const fieldErrors = {};
      validationResult.validation.errors.forEach((error) => {
        const mappedField = error.field === 'businessIdea' ? 'ideaDescription' : error.field === 'problem' ? 'problemSolved' : error.field;
        fieldErrors[mappedField] = journeyCopy.required;
      });
      setErrors((current) => ({ ...current, ...fieldErrors }));
      setResult(validationResult);
      setReportText('');
      setStatus({ tone: 'error', stateKey: 'invalid', message: pageContent.states.invalid });
      return false;
    }

    setResult(validationResult);
    setReportText(buildResultText(validationResult, pageContent, language));
    if (['ineligible', 'needs_clarification'].includes(validationResult.evaluationStatus)) {
      setStatus({ tone: validationResult.evaluationStatus === 'ineligible' ? 'error' : 'info', message: validationResult.message || pageContent.states.input });
      return false;
    }
    return true;
  };

  const handleJourneyContinue = () => {
    if (!validateCurrentJourneyStep()) {
      setStatus({ tone: 'error', stateKey: 'invalid', message: pageContent.states.invalid });
      return;
    }

    if (currentStep === 1) {
      setCurrentStep(2);
      setStatus({ tone: 'info', stateKey: 'input', message: pageContent.states.input });
      return;
    }

    if (currentStep === 2) {
      if (prepareClassificationStep()) {
        setCurrentStep(3);
        setStatus({ tone: 'info', stateKey: 'input', message: pageContent.states.input });
      }
      return;
    }

    handleSubmit({ preventDefault() {} });
  };

  const handleClarificationDetailChange = (event) => {
    const { name, value } = event.target;
    const nextFeasibilityAnswers =
      result?.clarificationFlow?.type === 'feasibility_guided'
        ? { ...feasibilityAnswers, [name]: value }
        : feasibilityAnswers;

    if (result?.clarificationFlow?.type === 'feasibility_guided') {
      setFeasibilityAnswers(nextFeasibilityAnswers);
    } else {
      setIndustrialDetails((current) => ({ ...current, [name]: value }));
    }
    setClarificationErrors((current) => ({ ...current, [name]: '' }));

    if (name === 'classificationConfirmation') {
      const engineInput = buildEngineInput(formData, language);
      const validationResult = executeBusinessValidation(engineInput, language, industrialDetails, nextFeasibilityAnswers);
      if (validationResult.ok) {
        setResult(validationResult);
        setReportText(buildResultText(validationResult, pageContent, language));
      }
    }
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
        setResult(validationResult);
        setReportText('');
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
          messages[field.id] = pageContent.journey.required;
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

  const journeyState =
    result?.journeyState ||
    (currentStep === 1
      ? BIV_JOURNEY_STATES.PROFILE_INPUT
      : currentStep === 2
        ? BIV_JOURNEY_STATES.IDEA_INPUT
        : BIV_JOURNEY_STATES.CLASSIFICATION_REVIEW);
  const inputJourneyStates = new Set([
    BIV_JOURNEY_STATES.PROFILE_INPUT,
    BIV_JOURNEY_STATES.IDEA_INPUT,
    BIV_JOURNEY_STATES.VALIDATION_ERROR,
    BIV_JOURNEY_STATES.CLASSIFICATION_REVIEW,
    BIV_JOURNEY_STATES.CLASSIFICATION_CORRECTION,
  ]);
  const clarificationJourneyStates = new Set([
    BIV_JOURNEY_STATES.INELIGIBLE,
    BIV_JOURNEY_STATES.ELIGIBILITY_CLARIFICATION,
    BIV_JOURNEY_STATES.FINANCING_CLARIFICATION,
    BIV_JOURNEY_STATES.GUIDED_FOLLOWUP,
    BIV_JOURNEY_STATES.SPECIALIST_CLARIFICATION,
  ]);
  const reportJourneyStates = new Set([
    BIV_JOURNEY_STATES.NORMAL_EVALUATION,
    BIV_JOURNEY_STATES.SPECIALIST_ANALYSIS,
  ]);
  const showFormRegion = inputJourneyStates.has(journeyState);
  const showClarificationCard = clarificationJourneyStates.has(journeyState);
  const showGenericStatusPanel = false;
  const isReportState = reportJourneyStates.has(journeyState);
  const allowedActions = result?.orchestrationDecision?.allowedActions || [];
  const canCopyReport = isReportState && allowedActions.includes('copy_report');
  const canDownloadReport = isReportState && allowedActions.includes('download_report');
  const eligibilityPresentation = result?.presentation || {
    heading: result?.title,
    body: result?.message,
    policy: result?.policyText,
    closing: '',
  };
  const reportSignals = journeyState === BIV_JOURNEY_STATES.NORMAL_EVALUATION ? deriveReportSignals(result, formData, pageContent) : null;
  const industrialReport = journeyState === BIV_JOURNEY_STATES.SPECIALIST_ANALYSIS ? result.industrialReport : null;
  const clarificationFlow = result?.clarificationFlow;
  const clarificationSteps = clarificationFlow?.steps || [];
  const currentClarificationStep = clarificationSteps[Math.min(industrialClarificationStep, clarificationSteps.length) - 1];
  const activeClarificationDetails = clarificationFlow?.type === 'feasibility_guided' ? feasibilityAnswers : industrialDetails;
  const classificationFields =
    [BIV_JOURNEY_STATES.CLASSIFICATION_REVIEW, BIV_JOURNEY_STATES.CLASSIFICATION_CORRECTION].includes(journeyState)
      ? (clarificationFlow?.steps || [])
          .flatMap((step) => step.fields || [])
          .filter((field) => ['classificationConfirmation', 'projectTypeCorrection', 'operatingModelCorrection', 'classificationCorrectionReason'].includes(field.id))
      : [];
  const proposedClassification = result?.orchestrationDecision?.proposedClassification;
  const journeyStepLabels = journeyCopy.steps;
  const profileFields = ['userExperienceLevel', 'firstProject', 'projectStageIntent', 'country', 'city', 'decisionObjective'];

  const renderJourneyField = (fieldId) => {
    const field = journeyCopy.fields[fieldId];
    if (!field) return null;
    const value = feasibilityAnswers[fieldId] || '';
    const common = {
      className: 'field__control',
      name: fieldId,
      value,
      onChange: handleJourneyAnswerChange,
      required: fieldId !== 'city',
    };

    return (
      <label className="field" key={fieldId}>
        <span className="field__label">{field.label}</span>
        {field.help ? <span className="field__help">{field.help}</span> : null}
        {field.options ? (
          <select {...common}>
            <option value="">{field.placeholder}</option>
            {field.options.map(([optionValue, optionLabel]) => (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            ))}
          </select>
        ) : (
          <input {...common} placeholder={field.placeholder} />
        )}
        <span className="field__error">{errors[fieldId] || clarificationErrors[fieldId] || ''}</span>
      </label>
    );
  };

  const renderClassificationField = (field) => (
    <label className="field" key={field.id}>
      <span className="field__label">{field.labelText}</span>
      {field.helpText ? <span className="field__help">{field.helpText}</span> : null}
      {field.type === 'select' ? (
        <select
          className="field__control"
          name={field.id}
          value={feasibilityAnswers[field.id] || ''}
          onChange={handleJourneyAnswerChange}
          required={field.required}
        >
          <option value="">{field.placeholderText}</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.labelText}
            </option>
          ))}
        </select>
      ) : (
        <textarea
          className="field__control field__control--textarea"
          name={field.id}
          value={feasibilityAnswers[field.id] || ''}
          onChange={handleJourneyAnswerChange}
          placeholder={field.placeholderText}
          required={field.required}
        />
      )}
      <span className="field__error">{errors[field.id] || clarificationErrors[field.id] || ''}</span>
    </label>
  );

  const main = (
    <div className="validator-shell">
      <div className="validator-panel">
        {showFormRegion ? (
        <section className="card" aria-labelledby="validator-form-title">
          <div className="card__body">
            <div className="validator-stepper" aria-label={pageContent.labels.stepperLabel || 'Form steps'}>
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  type="button"
                  className={`step-pill ${currentStep === step ? 'is-active' : ''}`}
                  onClick={() => setCurrentStep(step)}
                  disabled={step > currentStep}
                  aria-current={currentStep === step ? 'step' : undefined}
                >
                  <span>{step}</span>
                  <span>{journeyStepLabels[step - 1] || `Step ${step}`}</span>
                </button>
              ))}
            </div>

            <h2 id="validator-form-title">{pageContent.formTitle}</h2>
            <p className="validator-intro">{pageContent.description}</p>

            <form className="validator-form" onSubmit={handleSubmit} noValidate>
              {currentStep === 1 && (
                <div className="validator-step-grid">
                  {profileFields.map(renderJourneyField)}
                </div>
              )}

              {currentStep === 2 && (
                <div className="validator-step-grid">
                  <label className="field">
                    <span className="field__label">{pageContent?.fields?.businessName || 'Business name'}</span>
                    <input
                      className="field__control"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                    />
                    <span className="field__error">{errors.businessName || ''}</span>
                  </label>
                  <label className="field">
                    <span className="field__label">{pageContent?.fields?.ideaDescription || 'Describe the business idea briefly'}</span>
                    <span className="field__help">{pageContent?.helpText?.ideaDescription || ''}</span>
                    <textarea
                      className="field__control field__control--textarea"
                      name="ideaDescription"
                      value={formData.ideaDescription}
                      onChange={handleChange}
                      required
                    />
                    <span className="field__error">{errors.ideaDescription || ''}</span>
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
                </div>
              )}

              {currentStep === 3 && (
                <div className="validator-step-grid">
                  <div className="report-section">
                    <h3>{journeyCopy.classificationTitle}</h3>
                    {proposedClassification ? (
                      <>
                        <p><strong>{proposedClassification.label}</strong></p>
                        <p>{proposedClassification.reason}</p>
                      </>
                    ) : (
                      <p>{journeyCopy.classificationWaiting}</p>
                    )}
                  </div>
                  {classificationFields.map(renderClassificationField)}
                </div>
              )}

              <div className="validator-actions">
                <button className="button button--secondary" type="button" onClick={() => setCurrentStep((step) => Math.max(step - 1, 1))} disabled={currentStep === 1}>
                  {pageContent?.actions?.previous || 'Previous'}
                </button>
                {currentStep < 3 || [BIV_JOURNEY_STATES.CLASSIFICATION_REVIEW, BIV_JOURNEY_STATES.CLASSIFICATION_CORRECTION].includes(journeyState) ? (
                  <button className="button button--primary" type="button" onClick={handleJourneyContinue} disabled={isSubmitting}>
                    {journeyCopy.continue}
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
        ) : null}

        <aside className="validator-status-panel">
          {showGenericStatusPanel ? (
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

          {showClarificationCard ? (
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
                  {canCopyReport ? (
                  <button className="button button--secondary" type="button" onClick={handleCopy}>
                    {pageContent.labels.copyReport}
                  </button>
                  ) : null}
                  {canDownloadReport ? (
                  <button className="button button--secondary" type="button" onClick={handleDownload}>
                    {pageContent.labels.downloadReport}
                  </button>
                  ) : null}
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
                  {canCopyReport ? (
                  <button className="button button--secondary" type="button" onClick={handleCopy}>
                    {pageContent.labels.copyReport}
                  </button>
                  ) : null}
                  {canDownloadReport ? (
                  <button className="button button--secondary" type="button" onClick={handleDownload}>
                    {pageContent.labels.downloadReport}
                  </button>
                  ) : null}
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
