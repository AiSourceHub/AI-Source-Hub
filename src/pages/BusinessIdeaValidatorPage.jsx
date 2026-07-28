import { useMemo, useState } from 'react';
import { renderHeader } from '../../components/Header/index.js';
import { renderFooter } from '../../components/Footer/index.js';
import { validateForExecution } from '../../products/business/idea-validator/analyzer.js';
import productConfig from '../../products/business/idea-validator/config.js';
import contentEn from '../../products/business/idea-validator/content.en.js';
import contentAr from '../../products/business/idea-validator/content.ar.js';
import { buildBusinessIdeaReport, buildBusinessIdeaReportText } from '../../products/business/idea-validator/report.js';
import { buildBusinessIdeaRecommendation } from '../../products/business/idea-validator/recommendations.js';
import { buildImprovedIdeaStatement, scoreBusinessIdea } from '../../products/business/idea-validator/scoring.js';
import { inputSchema } from '../../products/business/idea-validator/questions.js';

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
    currentSolution: 'Current solution',
    competitiveAdvantage: 'Competitive advantage',
    revenueModel: 'Revenue model',
    stage: 'Stage',
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

function buildEngineInput(formData) {
  const businessIdea = [
    formData.businessName,
    formData.industry ? `Industry: ${formData.industry}` : '',
    formData.currentSolution ? `Current solution: ${formData.currentSolution}` : '',
    formData.competitiveAdvantage ? `Competitive advantage: ${formData.competitiveAdvantage}` : '',
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    businessIdea,
    targetCustomer: formData.targetCustomer,
    problem: formData.problemSolved,
    monetization: formData.revenueModel,
    stage: formData.stage,
  };
}

function deriveReportSignals(result, formData, content) {
  const criteria = result.criteria || [];
  const marketNeed = criteria.find((item) => item.key === 'marketNeed');
  const feasibility = criteria.find((item) => item.key === 'feasibility');
  const scoreTotal = result.score?.total || 0;

  const marketPotential = scoreTotal >= 75 ? 'High' : scoreTotal >= 55 ? 'Medium' : 'Low';
  const executionDifficulty = feasibility?.score >= 14 ? 'Low' : feasibility?.score >= 10 ? 'Medium' : 'High';
  const competitionLevel = formData.competitiveAdvantage && formData.competitiveAdvantage.length > 16 ? 'Moderate' : 'High';
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

function executeBusinessValidation(rawInput, language) {
  const { analysis, validation } = validateForExecution(rawInput, language);

  if (!validation.ok) {
    return {
      ok: false,
      state: 'invalid',
      analysis,
      validation,
    };
  }

  const {
    ruleContext,
    score,
    criteria,
    lowestCriterion,
    verdictKey,
    confidence,
  } = scoreBusinessIdea(analysis, language);

  const recommendation = buildBusinessIdeaRecommendation({
    score,
    criteria,
    lowestCriterion,
    verdictKey,
    confidence,
    language,
  });

  const improvedIdea = buildImprovedIdeaStatement(ruleContext.input, language);
  const status = confidence.level === 'low' ? 'partial' : 'success';
  const report = buildBusinessIdeaReport({
    productConfig,
    content: contentMap[language],
    language,
    score,
    criteria,
    recommendation,
    verdictKey,
  });

  report.status = status;

  return {
    ok: true,
    state: status,
    analysis,
    validation,
    criteria,
    score,
    verdictKey,
    confidence,
    recommendation,
    biggestRisk: recommendation.reason,
    nextAction: recommendation.action,
    improvedIdea,
    report,
    contradictions: ruleContext.contradictions,
  };
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
      stageOptions: { ...defaultPageContent.stageOptions, ...(baseContent?.stageOptions || {}) },
      actions: { ...defaultPageContent.actions, ...(baseContent?.actions || {}) },
      labels: { ...defaultPageContent.labels, ...(baseContent?.labels || {}) },
      steps: baseContent?.steps || defaultPageContent.steps,
      categories: { ...defaultPageContent.categories, ...(baseContent?.categories || {}) },
      verdicts: { ...defaultPageContent.verdicts, ...(baseContent?.verdicts || {}) },
      confidence: { ...defaultPageContent.confidence, ...(baseContent?.confidence || {}) },
      report: { ...defaultPageContent.report, ...(baseContent?.report || {}) },
    };
  }, [language]);
  const [formData, setFormData] = useState(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({
    tone: 'info',
    message: pageContent?.states?.idle || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [reportText, setReportText] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    if (status.tone !== 'info' || status.message !== pageContent.states.idle) {
      setStatus({ tone: 'info', message: pageContent.states.input });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    setStatus({ tone: 'info', message: pageContent.processing });

    try {
      const engineInput = buildEngineInput(formData);
      const validationResult = executeBusinessValidation(engineInput, language);

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
        setStatus({ tone: 'error', message: pageContent.states.invalid });
        setIsSubmitting(false);
        return;
      }

      const nextReportText = buildBusinessIdeaReportText({
        productConfig,
        content: pageContent,
        language,
        result: validationResult,
      });
      setReportText(nextReportText);
      setResult(validationResult);
      setStatus({ tone: 'success', message: pageContent.states.success });
    } catch (error) {
      setResult(null);
      setStatus({ tone: 'error', message: pageContent.states.error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setStatus({ tone: 'success', message: pageContent.report.copied });
    } catch {
      setStatus({ tone: 'error', message: pageContent.report.copyFailed });
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
    setCurrentStep(1);
    setErrors({});
    setResult(null);
    setReportText('');
    setStatus({ tone: 'info', message: pageContent.states.reset });
  };

  const reportSignals = result ? deriveReportSignals(result, formData, pageContent) : null;

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
