import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { renderHeader } from '../../components/Header/index.js';
import { renderFooter } from '../../components/Footer/index.js';
import { applyDocumentLocale, bindLanguageSwitcher, getFooterContent, getHeaderContent } from '../../core/localization.js';
import productConfig from '../../products/business/idea-validator/config.js';
import bivContentEn from '../../products/business/idea-validator/content.en.js';
import bivContentAr from '../../products/business/idea-validator/content.ar.js';
import { buildIndustrialReportText } from '../../products/business/idea-validator/industrialAnalysis.js';
import { buildBusinessIdeaReportText } from '../../products/business/idea-validator/report.js';
import {
  buildDiscoveryState,
  buildConfirmationContract,
  buildUnderstandingSummary,
  confirmDiscoveryUnderstanding,
  createInitialDiscoveryState,
  discoveryJourneyStates,
  discoveryContent,
  getCoreOfferingQuestion,
  getDiscoverySteps,
  getIntentChoices,
  getNextJourneyState,
  getMixedOperatingChoices,
  getOperatingChoices,
  getPreviousJourneyState,
  getProgressText,
  reopenDiscoveryConfirmation,
  resolveDiscoveryTransition,
  startDiscoveryFieldEdit,
  applyDiscoveryFieldChange,
  updateMixedOperatingSelection,
  validateDiscoveryStep,
} from '../../products/business/idea-validator/intentDiscoveryPrototype.js';
import { buildGuidedDiscoveryBivHandoff } from '../../products/business/idea-validator/guidedDiscoveryHandoffMapper.js';
import {
  applyGuidedDiscoveryClarificationAnswer,
  evaluateGuidedDiscoverySufficiency,
  GUIDED_DISCOVERY_SUFFICIENCY_STATUS,
} from '../../products/business/idea-validator/guidedDiscoverySufficiencyBridge.js';
import { adaptGuidedDiscoveryHandoffToBiv } from '../../products/business/idea-validator/guidedDiscoveryBivAdapter.js';
import { executeBusinessIdeaValidation } from '../../products/business/idea-validator/executionResult.js';
import { createSemanticIntentRequest } from '../../products/business/idea-validator/semanticIntentContract.js';
import { createMockSemanticIntentProvider } from '../../products/business/idea-validator/semanticIntentMockProvider.js';
import { buildDeterministicIntentPresentation, buildSemanticIntentPresentation } from '../../products/business/idea-validator/semanticIntentPresentation.js';
import { interpretWithSemanticProvider } from '../../products/business/idea-validator/semanticIntentProvider.js';
import { BIV_SEMANTIC_WORKER_ENDPOINT, observeSemanticShadow } from '../../products/business/idea-validator/semanticShadowAdapter.js';

const bivContentMap = { en: bivContentEn, ar: bivContentAr };

function BusinessIdeaDiscoveryPrototypePage({ locale }) {
  const location = useLocation();
  const { language } = locale;
  const content = discoveryContent[language] || discoveryContent.en;
  const [state, setState] = useState(createInitialDiscoveryState);
  const [error, setError] = useState('');
  const [semanticStatus, setSemanticStatus] = useState('idle');
  const [semanticPresentation, setSemanticPresentation] = useState(null);
  const [downstreamAnswers, setDownstreamAnswers] = useState({});
  const [activeClarificationAnswer, setActiveClarificationAnswer] = useState('');
  const [bivExecutionAnswers, setBivExecutionAnswers] = useState({});
  const [engineClarificationAnswers, setEngineClarificationAnswers] = useState({});
  const [engineClarificationErrors, setEngineClarificationErrors] = useState({});
  const [bivExecutionResult, setBivExecutionResult] = useState(null);
  const [bivExecutionNotice, setBivExecutionNotice] = useState('');
  const semanticParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const semanticScenario = semanticParams.get('semanticScenario') || 'valid';
  const semanticLocale = semanticParams.get('lang') || semanticParams.get('locale');

  useEffect(() => {
    applyDocumentLocale(language);
  }, [language]);

  useEffect(() => bindLanguageSwitcher({ language, setLanguage: locale.setLanguage }), [language, locale.setLanguage]);

  useEffect(() => {
    if ((semanticLocale === 'ar' || semanticLocale === 'en') && semanticLocale !== language) {
      locale.setLanguage(semanticLocale);
    }
  }, [language, locale, semanticLocale]);

  const headerHtml = useMemo(
    () => renderHeader(getHeaderContent(language, []), language),
    [language]
  );
  const footerHtml = useMemo(
    () => renderFooter(getFooterContent(language, content.title)),
    [language, content.title]
  );
  const deterministicIntentChoices = useMemo(() => getIntentChoices(state), [state]);
  const intentChoices = semanticPresentation?.choices || deterministicIntentChoices;
  const operatingChoices = useMemo(() => getOperatingChoices(state.selectedIntent), [state.selectedIntent]);
  const mixedOperatingChoices = useMemo(() => getMixedOperatingChoices(), []);
  const summary = useMemo(() => buildUnderstandingSummary(state, language), [state, language]);
  const confirmationContract = useMemo(() => summary.confirmationContract, [summary]);
  const journeyState = state.journeyState;
  const progressText = useMemo(() => getProgressText(state, journeyState, language), [state, journeyState, language]);
  const progressSteps = useMemo(() => getDiscoverySteps(state), [state]);
  const progressJourneyState = journeyState === discoveryJourneyStates.understandingConfirmed
    ? discoveryJourneyStates.understandingReview
    : journeyState;
  const progressIndex = progressSteps.indexOf(progressJourneyState);
  const handoff = useMemo(() => buildGuidedDiscoveryBivHandoff(state, {
    locale: language,
    downstreamInput: downstreamAnswers,
  }), [state, language, downstreamAnswers]);
  const sufficiency = useMemo(() => evaluateGuidedDiscoverySufficiency(handoff, { locale: language }), [handoff, language]);
  const bivClassificationFields = useMemo(() => getBivClassificationFields(bivExecutionResult), [bivExecutionResult]);
  const bivClassificationAnswers = bivExecutionAnswers;
  const bivContent = bivContentMap[language] || bivContentMap.en;
  const localBivReportText = useMemo(
    () => buildLocalBivReportText(bivExecutionResult, bivContent, language),
    [bivExecutionResult, bivContent, language]
  );

  const resetDownstreamSufficiency = () => {
    setDownstreamAnswers({});
    setActiveClarificationAnswer('');
    resetBivExecution();
  };

  const resetBivExecution = () => {
    setBivExecutionAnswers({});
    setEngineClarificationAnswers({});
    setEngineClarificationErrors({});
    setBivExecutionResult(null);
    setBivExecutionNotice('');
  };

  const invalidateBivExecutionForAnswerChange = () => {
    setActiveClarificationAnswer('');
    resetBivExecution();
  };

  const transitionToJourneyState = (nextJourneyState) => {
    setState((currentState) => resolveDiscoveryTransition(currentState, nextJourneyState).nextState);
  };

  const setOriginalIdea = (value) => {
    setState(buildDiscoveryState({
      ...state,
      originalIdea: value,
      confirmationStatus: 'not_confirmed',
    }));
    resetDownstreamSufficiency();
    setSemanticStatus('idle');
    setSemanticPresentation(null);
    setError('');
  };

  const selectIntent = (intentId) => {
    setState(applyDiscoveryFieldChange(state, 'selectedIntent', intentId));
    setError('');
  };

  const setCoreOffering = (value) => {
    setState(applyDiscoveryFieldChange(state, 'coreOffering', value));
    setError('');
  };

  const setCoreOfferingUndecided = () => {
    setState(applyDiscoveryFieldChange(state, 'coreOfferingStatus', 'undecided'));
    setError('');
  };

  const selectOperatingApproach = (approachId) => {
    setState(applyDiscoveryFieldChange(state, 'selectedOperatingApproach', approachId));
    setError('');
  };

  const toggleMixedOperatingApproach = (approachId) => {
    setState(applyDiscoveryFieldChange(
      state,
      'selectedOperatingApproaches',
      updateMixedOperatingSelection(state.selectedOperatingApproaches, approachId)
    ));
    setError('');
  };

  const editSummaryField = (fieldId) => {
    const nextState = startDiscoveryFieldEdit(state, fieldId);
    const targetJourneyState = fieldId === 'selectedOperatingApproaches' && nextState.selectedOperatingApproach !== 'mixed'
      ? discoveryJourneyStates.operatingApproach
      : nextState.journeyState;
    setState(buildDiscoveryState({
      ...nextState,
      journeyState: targetJourneyState,
    }));
    invalidateBivExecutionForAnswerChange();
    setError('');
  };

  const goToIntent = () => {
    const validation = validateDiscoveryStep(state, 'idea', language);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    const preparedState = buildDiscoveryState({
      ...state,
      confirmationStatus: 'not_confirmed',
      journeyState: discoveryJourneyStates.intentSelection,
    });
    const transition = resolveDiscoveryTransition(preparedState, discoveryJourneyStates.intentSelection);
    const nextState = transition.nextState;
    setState(nextState);
    setError('');
    runSemanticIntentInterpretation(nextState);
  };

  const runSemanticIntentInterpretation = async (nextState) => {
    if (semanticScenario === 'deterministic') {
      setSemanticPresentation(buildDeterministicIntentPresentation({
        choices: getIntentChoices(nextState),
        locale: language,
      }));
      setSemanticStatus('ready');
      return;
    }

    setSemanticStatus('loading');
    setSemanticPresentation(null);
    const request = createSemanticIntentRequest({
      locale: language,
      originalIdea: nextState.originalIdea,
      confirmedAnswers: {
        selectedIntent: nextState.selectedIntent,
        coreOffering: nextState.coreOffering,
        coreOfferingStatus: nextState.coreOfferingStatus,
        selectedOperatingApproach: nextState.selectedOperatingApproach,
        selectedOperatingApproaches: nextState.selectedOperatingApproaches,
      },
      currentDiscoveryState: nextState,
      policySafeContext: {
        prototypeOnly: true,
        providerCannotControlRoute: true,
      },
    });
    const provider = createMockSemanticIntentProvider({ scenario: resolveSemanticScenario(semanticScenario, language) });
    const filteredResult = await interpretWithSemanticProvider(provider, request);
    void observeSemanticShadow({
      request,
      authoritativeResult: filteredResult,
      endpoint: BIV_SEMANTIC_WORKER_ENDPOINT,
      enabled: import.meta.env?.VITE_BIV_SEMANTIC_SHADOW_ENABLED === 'true',
    });
    setSemanticPresentation(buildSemanticIntentPresentation({
      filteredResult,
      request,
      locale: language,
    }));
    setSemanticStatus('ready');
  };

  const goToOperating = () => {
    const validation = validateDiscoveryStep(state, 'intent', language);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError('');
    transitionToJourneyState(state.editingField === 'selectedIntent' && buildConfirmationContract(state).isComplete
      ? discoveryJourneyStates.understandingReview
      : getNextJourneyState(state, journeyState));
  };

  const goToCoreOffering = () => {
    const validation = validateDiscoveryStep(state, 'coreOffering', language);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError('');
    transitionToJourneyState(state.editingField === 'coreOffering' && buildConfirmationContract(state).isComplete
      ? discoveryJourneyStates.understandingReview
      : getNextJourneyState(state, journeyState));
  };

  const goFromOperating = () => {
    const validation = validateDiscoveryStep(state, 'operating', language);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError('');
    transitionToJourneyState(state.editingField === 'selectedOperatingApproach' && buildConfirmationContract(state).isComplete
      ? discoveryJourneyStates.understandingReview
      : getNextJourneyState(state, journeyState));
  };

  const goToSummary = () => {
    const validation = validateDiscoveryStep(state, 'mixedOperating', language);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError('');
    transitionToJourneyState(discoveryJourneyStates.understandingReview);
  };

  const confirmSummary = () => {
    if (state.confirmationStatus === 'confirmed') return;
    const confirmedState = confirmDiscoveryUnderstanding(state);
    setState(confirmedState);
    if (!buildConfirmationContract(confirmedState).isComplete) {
      setError(language === 'ar' ? 'أكمل البنود غير المحددة قبل التأكيد.' : 'Complete the unresolved items before confirming.');
      return;
    }
    setError('');
  };

  const reviewConfirmedAnswers = () => {
    setState(reopenDiscoveryConfirmation(state));
    invalidateBivExecutionForAnswerChange();
    setError('');
  };

  const reset = () => {
    setState(createInitialDiscoveryState());
    resetDownstreamSufficiency();
    setSemanticStatus('idle');
    setSemanticPresentation(null);
    setError('');
  };

  const continueAfterConfirmation = () => {
    const nextState = sufficiency.status === GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT
      ? discoveryJourneyStates.bivDraftReady
      : discoveryJourneyStates.sufficiencyClarification;
    transitionToJourneyState(nextState);
    resetBivExecution();
    setError('');
  };

  const applySufficiencyAnswer = () => {
    const activeId = sufficiency.activeClarification?.id || '';
    const result = applyGuidedDiscoveryClarificationAnswer(handoff, activeId, activeClarificationAnswer, { locale: language });
    if (!result.ok) {
      setError(language === 'ar' ? 'أضف إجابة قصيرة قبل المتابعة.' : 'Add a short answer before continuing.');
      return;
    }
    setDownstreamAnswers(result.handoff.downstreamClarifications || {});
    setActiveClarificationAnswer('');
    resetBivExecution();
    setError('');
    const nextState = result.sufficiency.status === GUIDED_DISCOVERY_SUFFICIENCY_STATUS.READY_FOR_BIV_DRAFT
      ? discoveryJourneyStates.bivDraftReady
      : discoveryJourneyStates.sufficiencyClarification;
    transitionToJourneyState(nextState);
  };

  const runLocalBivExecution = (answers = bivExecutionAnswers, clarificationAnswers = engineClarificationAnswers) => {
    const adapted = adaptGuidedDiscoveryHandoffToBiv(handoff, sufficiency);
    if (!adapted.ok || !adapted.currentEngineInput) {
      setError(language === 'ar' ? 'لم تكتمل بيانات المسودة المحلية بعد.' : 'The local draft is not ready yet.');
      return null;
    }
    const clarificationFlowType = bivExecutionResult?.clarificationFlow?.type || '';
    const projectedIndustrialDetails = clarificationFlowType && clarificationFlowType !== 'feasibility_guided'
      ? clarificationAnswers
      : {};
    const projectedFeasibilityClarifications = clarificationFlowType === 'feasibility_guided'
      ? clarificationAnswers
      : {};
    const result = executeBusinessIdeaValidation({
      ...adapted.currentEngineInput,
      industrialDetails: {
        ...(adapted.currentEngineInput.industrialDetails || {}),
        ...projectedIndustrialDetails,
      },
      feasibilityAnswers: {
        ...(adapted.currentEngineInput.feasibilityAnswers || {}),
        ...answers,
        ...projectedFeasibilityClarifications,
      },
      content: bivContent,
    });
    setBivExecutionResult(result);
    setBivExecutionNotice('');
    setError('');
    return result;
  };

  const copyLocalBivReport = async () => {
    if (!localBivReportText) return;
    try {
      await navigator.clipboard.writeText(localBivReportText);
      setBivExecutionNotice(bivContent.report?.copied || (language === 'ar' ? 'تم نسخ التقرير.' : 'Report copied.'));
    } catch {
      setBivExecutionNotice(bivContent.report?.copyFailed || (language === 'ar' ? 'تعذر نسخ التقرير.' : 'Unable to copy the report.'));
    }
  };

  const downloadLocalBivReport = () => {
    if (!localBivReportText) return;
    const blob = new Blob([localBivReportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = language === 'ar' ? 'تقرير-مدقق-فكرة-العمل.txt' : 'business-idea-validator-report.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBivExecutionNotice(bivContent.report?.downloaded || (language === 'ar' ? 'تم تجهيز ملف التقرير.' : 'Report file prepared.'));
  };

  const startClassificationReview = () => {
    runLocalBivExecution({});
  };

  const confirmBivClassification = () => {
    const answers = { classificationConfirmation: 'confirm' };
    setBivExecutionAnswers(answers);
    runLocalBivExecution(answers);
  };

  const startBivClassificationCorrection = () => {
    const answers = { classificationConfirmation: 'correct' };
    setBivExecutionAnswers(answers);
    runLocalBivExecution(answers);
  };

  const updateBivClassificationAnswer = (fieldId, value) => {
    setBivExecutionAnswers((currentAnswers) => ({
      ...currentAnswers,
      classificationConfirmation: 'correct',
      [fieldId]: value,
    }));
    setError('');
  };

  const submitBivClassificationCorrection = () => {
    const nextAnswers = {
      ...bivExecutionAnswers,
      classificationConfirmation: 'correct',
    };
    if (!nextAnswers.projectTypeCorrection || !nextAnswers.operatingModelCorrection) {
      setError(language === 'ar' ? 'اختر نوع المشروع ونموذج التشغيل قبل المتابعة.' : 'Choose the project type and operating model before continuing.');
      return;
    }
    setBivExecutionAnswers(nextAnswers);
    runLocalBivExecution(nextAnswers);
  };

  const updateEngineClarificationAnswer = (fieldId, value) => {
    setEngineClarificationAnswers((currentAnswers) => ({
      ...currentAnswers,
      [fieldId]: value,
    }));
    setEngineClarificationErrors((currentErrors) => ({
      ...currentErrors,
      [fieldId]: '',
    }));
    setError('');
  };

  const submitEngineClarificationAnswers = () => {
    const fields = getEngineClarificationFields(bivExecutionResult);
    const copy = getLocalBivCopy(language);
    const nextErrors = fields.reduce((messages, field) => {
      if (field.required && !String(engineClarificationAnswers[field.id] || '').trim()) {
        messages[field.id] = copy.requiredField;
      }
      return messages;
    }, {});
    if (Object.keys(nextErrors).length > 0) {
      setEngineClarificationErrors(nextErrors);
      setError(language === 'ar' ? 'أكمل الحقول المطلوبة قبل المتابعة.' : 'Complete the required fields before continuing.');
      return;
    }
    setEngineClarificationErrors({});
    runLocalBivExecution(bivExecutionAnswers, engineClarificationAnswers);
  };

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />
      <main className="section" id="top">
        <div className="container">
          <section className="product-hero">
            <p className="eyebrow">{content.eyebrow}</p>
            <h1>{content.title}</h1>
          </section>

          <section className="discovery-prototype card" aria-labelledby="discovery-title">
            <div className="card__body">
              <div className="discovery-progress" aria-label={language === 'ar' ? 'تقدم النموذج الأولي' : 'Prototype progress'}>
                <span className="discovery-progress__text">{progressText}</span>
                <span className="discovery-progress__bar" aria-hidden="true">
                  <span
                    className="discovery-progress__fill"
                    style={{ inlineSize: `${((Math.max(0, progressIndex) + 1) / progressSteps.length) * 100}%` }}
                  />
                </span>
              </div>

              {journeyState === discoveryJourneyStates.ideaCapture ? (
                <div className="discovery-step">
                  <h2 id="discovery-title">{content.states.idea.heading}</h2>
                  <p className="validator-intro">{content.states.idea.body}</p>
                  <label className="field">
                    <span className="field__label">{content.states.idea.label}</span>
                    <textarea
                      className="field__control field__control--textarea discovery-idea-input"
                      value={state.originalIdea}
                      onChange={(event) => setOriginalIdea(event.target.value)}
                      placeholder={content.states.idea.placeholder}
                    />
                    <span className="field__error">{error}</span>
                  </label>
                  <div className="validator-actions">
                    <button className="button button--primary" type="button" onClick={goToIntent}>
                      {content.states.idea.button}
                    </button>
                  </div>
                </div>
              ) : null}

              {journeyState === discoveryJourneyStates.intentSelection ? (
                <div className="discovery-step">
                  {semanticStatus === 'loading' ? (
                    <div className="semantic-intent-panel" role="status" aria-live="polite">
                      <h2 id="discovery-title">{content.states.intent.heading}</h2>
                      <p className="validator-intro">{content.semanticIntent.loading}</p>
                    </div>
                  ) : (
                    <>
                      <div className="semantic-intent-panel">
                        <h2 id="discovery-title">{semanticPresentation?.heading || content.states.intent.heading}</h2>
                        {semanticPresentation?.body ? <p className="validator-intro">{semanticPresentation.body}</p> : null}
                        {semanticPresentation?.reflection ? <p className="semantic-intent-panel__reflection">{semanticPresentation.reflection}</p> : null}
                        <p className="validator-intro">{semanticPresentation?.question || content.states.intent.body}</p>
                      </div>
                      <ChoiceList
                        choices={intentChoices}
                        labels={content.intentOptions}
                        selectedId={state.selectedIntent}
                        suggestedLabel={content.states.intent.suggested}
                        onSelect={selectIntent}
                      />
                      <span className="field__error">{error}</span>
                      <div className="validator-actions">
                        <button className="button button--secondary" type="button" onClick={() => transitionToJourneyState(discoveryJourneyStates.ideaCapture)}>
                          {content.actions.back}
                        </button>
                        <button className="button button--primary" type="button" onClick={goToOperating}>
                          {content.actions.continue}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {journeyState === discoveryJourneyStates.coreOffering ? (
                <div className="discovery-step">
                  <h2 id="discovery-title">{getCoreOfferingQuestion(state.selectedIntent, language)}</h2>
                  <label className="field">
                    <span className="field__label">{content.states.coreOffering.label}</span>
                    <input
                      className="field__control"
                      type="text"
                      value={state.coreOffering}
                      onChange={(event) => setCoreOffering(event.target.value)}
                      placeholder={content.states.coreOffering.placeholder}
                    />
                    <span className="field__error">{error}</span>
                  </label>
                  <div className="validator-actions">
                    <button className="button button--secondary" type="button" onClick={setCoreOfferingUndecided}>
                      {content.states.coreOffering.undecided}
                    </button>
                    <button className="button button--secondary" type="button" onClick={() => transitionToJourneyState(getPreviousJourneyState(state, journeyState))}>
                      {content.actions.back}
                    </button>
                    <button className="button button--primary" type="button" onClick={goToCoreOffering}>
                      {content.actions.continue}
                    </button>
                  </div>
                </div>
              ) : null}

              {journeyState === discoveryJourneyStates.operatingApproach ? (
                <div className="discovery-step">
                  <h2 id="discovery-title">{content.states.operating.heading}</h2>
                  <ChoiceList
                    choices={operatingChoices}
                    labels={content.operatingOptions}
                    selectedId={state.selectedOperatingApproach}
                    onSelect={selectOperatingApproach}
                  />
                  <span className="field__error">{error}</span>
                  <div className="validator-actions">
                    <button className="button button--secondary" type="button" onClick={() => transitionToJourneyState(getPreviousJourneyState(state, journeyState))}>
                      {content.actions.back}
                    </button>
                    <button className="button button--primary" type="button" onClick={goFromOperating}>
                      {content.actions.continue}
                    </button>
                  </div>
                </div>
              ) : null}

              {journeyState === discoveryJourneyStates.mixedOperatingDetail ? (
                <div className="discovery-step">
                  <h2 id="discovery-title">{content.states.mixedOperating.heading}</h2>
                  <p className="validator-intro">{content.states.mixedOperating.body}</p>
                  <MultiChoiceList
                    choices={mixedOperatingChoices}
                    labels={content.mixedOperatingOptions}
                    selectedIds={state.selectedOperatingApproaches}
                    onToggle={toggleMixedOperatingApproach}
                  />
                  <span className="field__error">{error}</span>
                  <div className="validator-actions">
                    <button className="button button--secondary" type="button" onClick={() => transitionToJourneyState(getPreviousJourneyState(state, journeyState))}>
                      {content.actions.back}
                    </button>
                    <button className="button button--primary" type="button" onClick={goToSummary}>
                      {content.actions.continue}
                    </button>
                  </div>
                </div>
              ) : null}

              {[discoveryJourneyStates.understandingReview, discoveryJourneyStates.understandingConfirmed].includes(journeyState) ? (
                <div className="discovery-step">
                  {state.confirmationStatus === 'confirmed' ? (
                    <div className="discovery-confirmed-state" role="status" aria-live="polite">
                      <div className="discovery-confirmed-state__mark" aria-hidden="true">✓</div>
                      <div>
                        <h2 id="discovery-title">{content.states.confirmed.heading}</h2>
                        <p className="validator-intro">{content.states.confirmed.body}</p>
                        <p className="discovery-confirmed-state__notice">{content.states.confirmed.notice}</p>
                      </div>
                    </div>
                  ) : (
                    <h2 id="discovery-title">{content.states.summary.heading}</h2>
                  )}
                  <div className="discovery-summary">
                    <div>
                      <p className="eyebrow">{content.states.summary.originalIdea}</p>
                      <p>{summary.originalIdea}</p>
                      <DisplayTranslationBlock translation={summary.displayTranslations.originalIdea} labels={content.states.displayTranslation} />
                    </div>
                    <div>
                      <p className="eyebrow">{content.states.summary.intent}</p>
                      <p>{summary.intentLabel}</p>
                      <button className="button button--secondary button--compact" type="button" onClick={() => editSummaryField('selectedIntent')}>
                        {content.actions.edit}
                      </button>
                    </div>
                    <div>
                      <p className="eyebrow">{content.states.summary.coreOffering}</p>
                      <p>{summary.coreOfferingLabel}</p>
                      <DisplayTranslationBlock translation={summary.displayTranslations.coreOffering} labels={content.states.displayTranslation} />
                      <button className="button button--secondary button--compact" type="button" onClick={() => editSummaryField('coreOffering')}>
                        {content.actions.edit}
                      </button>
                    </div>
                    <div>
                      <p className="eyebrow">{content.states.summary.operating}</p>
                      <p>{summary.operatingLabel}</p>
                      <button className="button button--secondary button--compact" type="button" onClick={() => editSummaryField(confirmationContract.fieldValues.selectedOperatingApproach === 'mixed' ? 'selectedOperatingApproaches' : 'selectedOperatingApproach')}>
                        {content.actions.edit}
                      </button>
                    </div>
                    {summary.unresolvedItems.length ? (
                      <div className="discovery-summary__unresolved">
                        <p className="eyebrow">{content.states.summary.unresolved}</p>
                        <ul>
                          {summary.unresolvedItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="alert-box alert-box--success">{content.states.summary.complete}</div>
                    )}
                  </div>
                  <div className="validator-actions">
                    {state.confirmationStatus === 'confirmed' ? null : (
                      <button className="button button--primary" type="button" onClick={confirmSummary}>
                        {content.actions.confirm}
                      </button>
                    )}
                    {state.confirmationStatus === 'confirmed' ? (
                      <button className="button button--secondary" type="button" onClick={reviewConfirmedAnswers}>
                        {content.actions.editAnswers}
                      </button>
                    ) : null}
                    {state.confirmationStatus === 'confirmed' ? (
                      <button className="button button--primary" type="button" onClick={continueAfterConfirmation}>
                        {content.actions.continue}
                      </button>
                    ) : null}
                    <button className="button button--secondary" type="button" onClick={reset}>
                      {content.actions.reset}
                    </button>
                  </div>
                </div>
              ) : null}

              {journeyState === discoveryJourneyStates.sufficiencyClarification ? (
                <div className="discovery-step">
                  <h2 id="discovery-title">{content.states.sufficiency.heading}</h2>
                  <p className="validator-intro">{content.states.sufficiency.body}</p>
                  {sufficiency.activeClarification ? (
                    <label className="field">
                      <span className="field__label">{sufficiency.activeClarification.label}</span>
                      <span className="field__help">{sufficiency.activeClarification.prompt}</span>
                      <textarea
                        className="field__control field__control--textarea"
                        value={activeClarificationAnswer}
                        onChange={(event) => {
                          setActiveClarificationAnswer(event.target.value);
                          setError('');
                        }}
                      />
                      <span className="field__error">{error}</span>
                    </label>
                  ) : (
                    <div className="alert-box alert-box--success">{content.states.ready.body}</div>
                  )}
                  <div className="validator-actions">
                    <button className="button button--secondary" type="button" onClick={() => transitionToJourneyState(discoveryJourneyStates.understandingConfirmed)}>
                      {content.actions.back}
                    </button>
                    <button className="button button--primary" type="button" onClick={applySufficiencyAnswer}>
                      {content.actions.continue}
                    </button>
                  </div>
                </div>
              ) : null}

              {journeyState === discoveryJourneyStates.bivDraftReady ? (
                <div className="discovery-step">
                  {!bivExecutionResult ? (
                    <div className="discovery-confirmed-state" role="status" aria-live="polite">
                    <div className="discovery-confirmed-state__mark" aria-hidden="true">✓</div>
                    <div>
                      <h2 id="discovery-title">{content.states.ready.heading}</h2>
                      <p className="validator-intro">{content.states.ready.body}</p>
                      <p className="discovery-confirmed-state__notice">{content.states.ready.notice}</p>
                    </div>
                    </div>
                  ) : null}
                  <div className="discovery-summary">
                    <div>
                      <p className="eyebrow">{content.states.summary.originalIdea}</p>
                      <p>{summary.originalIdea}</p>
                    </div>
                    <div>
                      <p className="eyebrow">{content.states.ready.confirmedInformation}</p>
                      <p>{summary.intentLabel}</p>
                      <p>{summary.coreOfferingLabel}</p>
                      <p>{summary.operatingLabel}</p>
                    </div>
                    <div>
                      <p className="eyebrow">{content.states.ready.clarifiedInformation}</p>
                      <ClarifiedAnswerList answers={downstreamAnswers} language={language} />
                    </div>
                  </div>
                  {bivExecutionResult ? (
                    <LocalBivExecutionPanel
                      result={bivExecutionResult}
                      fields={bivClassificationFields}
                      answers={bivClassificationAnswers}
                      content={content}
                      bivContent={bivContent}
                      language={language}
                      reportText={localBivReportText}
                      reportNotice={bivExecutionNotice}
                      onCopyReport={copyLocalBivReport}
                      onDownloadReport={downloadLocalBivReport}
                      onConfirm={confirmBivClassification}
                      onCorrect={startBivClassificationCorrection}
                      onCorrectionChange={updateBivClassificationAnswer}
                      onCorrectionSubmit={submitBivClassificationCorrection}
                      engineClarificationAnswers={engineClarificationAnswers}
                      engineClarificationErrors={engineClarificationErrors}
                      onEngineClarificationChange={updateEngineClarificationAnswer}
                      onEngineClarificationSubmit={submitEngineClarificationAnswers}
                      error={error}
                    />
                  ) : null}
                  <div className="validator-actions">
                    {!bivExecutionResult ? (
                      <button className="button button--primary" type="button" onClick={startClassificationReview}>
                        {content.actions.continue}
                      </button>
                    ) : null}
                    <button className="button button--secondary" type="button" onClick={reviewConfirmedAnswers}>
                      {content.actions.editAnswers}
                    </button>
                    <button className="button button--secondary" type="button" onClick={reset}>
                      {content.actions.reset}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </>
  );
}

function ClarifiedAnswerList({ answers, language }) {
  const labels = language === 'ar'
    ? {
      targetCustomer: 'العميل المستهدف',
      problem: 'مشكلة العميل',
      monetization: 'طريقة الإيرادات',
      additionalIdeaContext: 'توضيح إضافي للفكرة',
    }
    : {
      targetCustomer: 'Target customer',
      problem: 'Customer problem',
      monetization: 'Revenue model',
      additionalIdeaContext: 'Additional idea context',
    };
  const items = Object.entries(answers || {}).filter(([, value]) => String(value || '').trim());
  if (!items.length) return <p>{language === 'ar' ? 'لا توجد معلومات إضافية بعد.' : 'No additional information yet.'}</p>;
  return (
    <dl className="discovery-clarified-list">
      {items.map(([key, value]) => (
        <div key={key}>
          <dt>{labels[key] || key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function LocalBivExecutionPanel({
  result,
  fields,
  answers,
  content,
  bivContent,
  language,
  reportText,
  reportNotice,
  onCopyReport,
  onDownloadReport,
  onConfirm,
  onCorrect,
  onCorrectionChange,
  onCorrectionSubmit,
  engineClarificationAnswers,
  engineClarificationErrors,
  onEngineClarificationChange,
  onEngineClarificationSubmit,
  error,
}) {
  const copy = getLocalBivCopy(language);
  const isClassificationReview = result?.journeyState === 'classification_review';
  const isClassificationCorrection = result?.journeyState === 'classification_correction';
  const isNormalEvaluation = result?.journeyState === 'normal_evaluation';
  const isIndustrialReport = result?.evaluationStatus === 'industrial_assessment' && result?.industrialReport;
  const isBlockingState = result?.evaluationStatus && result.evaluationStatus !== 'evaluated' && !isIndustrialReport;
  const proposedClassification = result?.orchestrationDecision?.classification?.proposedClassification
    || result?.orchestrationDecision?.proposedClassification
    || {};
  const classificationField = fields.find((field) => field.id === 'classificationConfirmation');
  const correctionFields = fields.filter((field) => ['projectTypeCorrection', 'operatingModelCorrection', 'classificationCorrectionReason'].includes(field.id));

  if (isClassificationCorrection) {
    return (
      <div className="local-biv-panel">
        <h2>{copy.correctionHeading}</h2>
        <p className="validator-intro">{copy.correctionBody}</p>
        <div className="local-biv-form">
          {correctionFields.map((field) => (
            <label className="field" key={field.id}>
              <span className="field__label">{field.labelText}</span>
              {field.helpText ? <span className="field__help">{field.helpText}</span> : null}
              {field.type === 'textarea' ? (
                <textarea
                  className="field__control field__control--textarea"
                  value={answers[field.id] || ''}
                  onChange={(event) => onCorrectionChange(field.id, event.target.value)}
                  placeholder={field.placeholderText}
                />
              ) : (
                <select
                  className="field__control"
                  value={answers[field.id] || ''}
                  onChange={(event) => onCorrectionChange(field.id, event.target.value)}
                >
                  <option value="">{field.placeholderText}</option>
                  {(field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>{option.labelText}</option>
                  ))}
                </select>
              )}
            </label>
          ))}
          <span className="field__error">{error}</span>
        </div>
        <div className="validator-actions">
          <button className="button button--primary" type="button" onClick={onCorrectionSubmit}>
            {content.actions.continue}
          </button>
          <button className="button button--secondary" type="button" onClick={onConfirm}>
            {copy.confirmInstead}
          </button>
        </div>
      </div>
    );
  }

  if (isClassificationReview) {
    return (
      <div className="local-biv-panel">
        <h2>{copy.reviewHeading}</h2>
        <p className="validator-intro">{classificationField?.labelText || copy.reviewBody}</p>
        <div className="local-biv-classification">
          <div>
            <p className="eyebrow">{copy.projectType}</p>
            <p>{proposedClassification.label || copy.unknown}</p>
          </div>
          <div>
            <p className="eyebrow">{copy.operatingModel}</p>
            <p>{proposedClassification.operatingModelLabel || copy.unknown}</p>
          </div>
          {proposedClassification.reason ? (
            <div>
              <p className="eyebrow">{copy.evidence}</p>
              <p>{proposedClassification.reason}</p>
            </div>
          ) : null}
        </div>
        <div className="validator-actions">
          <button className="button button--primary" type="button" onClick={onConfirm}>
            {copy.confirmClassification}
          </button>
          <button className="button button--secondary" type="button" onClick={onCorrect}>
            {copy.correctClassification}
          </button>
        </div>
      </div>
    );
  }

  if (isNormalEvaluation) {
    return (
      <GuidedNormalEvaluationReport
        result={result}
        bivContent={bivContent}
        language={language}
        reportText={reportText}
        reportNotice={reportNotice}
        onCopyReport={onCopyReport}
        onDownloadReport={onDownloadReport}
      />
    );
  }

  if (isIndustrialReport) {
    return (
      <GuidedIndustrialReport
        result={result}
        bivContent={bivContent}
        language={language}
        reportText={reportText}
        reportNotice={reportNotice}
        onCopyReport={onCopyReport}
        onDownloadReport={onDownloadReport}
      />
    );
  }

  if (isBlockingState) {
    return (
      <GuidedBivBlockingStatePanel
        result={result}
        copy={copy}
        language={language}
        answers={engineClarificationAnswers}
        errors={engineClarificationErrors}
        onAnswerChange={onEngineClarificationChange}
        onSubmit={onEngineClarificationSubmit}
      />
    );
  }

  return (
    <div className="local-biv-panel">
      <h2>{copy.resultHeading}</h2>
      <p className="validator-intro">{copy.resultBody}</p>
      <div className="local-biv-classification">
        <div>
          <p className="eyebrow">{copy.nextState}</p>
          <p>{localizeBivJourneyState(result?.journeyState, language)}</p>
        </div>
        <div>
          <p className="eyebrow">{copy.route}</p>
          <p>{localizeBivRoute(result?.route, language)}</p>
        </div>
        {typeof result?.score === 'number' ? (
          <div>
            <p className="eyebrow">{copy.score}</p>
            <p>{result.score}</p>
          </div>
        ) : null}
        {result?.report?.executiveSummary ? (
          <div>
            <p className="eyebrow">{copy.summary}</p>
            <p>{result.report.executiveSummary}</p>
          </div>
        ) : null}
        {result?.nextRequiredAction ? (
          <div>
            <p className="eyebrow">{copy.nextAction}</p>
            <p>{result.nextRequiredAction}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GuidedNormalEvaluationReport({
  result,
  bivContent,
  language,
  reportText,
  reportNotice,
  onCopyReport,
  onDownloadReport,
}) {
  const reportSignals = deriveLocalReportSignals(result, bivContent);
  const labels = bivContent.labels || {};
  const verdict = bivContent.verdicts?.[result?.verdictKey] || result?.verdictKey || '';
  const confidence = bivContent.confidence?.[result?.confidence?.level] || result?.confidence?.level || '';

  return (
    <div className="local-biv-panel local-biv-report">
      <p className="eyebrow">{labels.report}</p>
      <h2>{labels.reportTitle}</h2>
      {verdict ? <p className="validator-intro">{verdict}</p> : null}
      {confidence ? (
        <p className="muted-text">
          {labels.confidence}: {confidence} ({result.confidence?.value}/100)
        </p>
      ) : null}

      <div className="report-grid">
        <div className="report-card">
          <span>{labels.overallScore}</span>
          <strong>{result.score?.total}/100</strong>
        </div>
        <div className="report-card">
          <span>{labels.marketPotential}</span>
          <strong>{reportSignals.marketPotential}</strong>
        </div>
        <div className="report-card">
          <span>{labels.executionDifficulty}</span>
          <strong>{reportSignals.executionDifficulty}</strong>
        </div>
        <div className="report-card">
          <span>{labels.competitionLevel}</span>
          <strong>{reportSignals.competitionLevel}</strong>
        </div>
      </div>

      <div className="report-section">
        <h3>{labels.scoreBreakdown}</h3>
        <div className="score-breakdown">
          {(result.criteria || []).map((criterion) => (
            <div className="score-item" key={criterion.key}>
              <span>{bivContent.categories?.[criterion.key] || criterion.key}</span>
              <strong>{criterion.score}/{criterion.max}</strong>
              <p>{criterion.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="report-section">
        <h3>{labels.mainRisks}</h3>
        {reportSignals.mainRisks.length ? (
          <ul>
            {reportSignals.mainRisks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        ) : (
          <p>{labels.noStrengths}</p>
        )}
      </div>

      <div className="report-section">
        <h3>{labels.keyStrengths}</h3>
        <div className="tag-list">
          {reportSignals.strengths.length ? (
            reportSignals.strengths.map((strength) => <span className="tag" key={strength}>{strength}</span>)
          ) : (
            <span className="tag">{labels.noStrengths}</span>
          )}
        </div>
      </div>

      {result.improvedIdea ? (
        <div className="report-section">
          <h3>{labels.improvedIdea}</h3>
          <p>{result.improvedIdea}</p>
        </div>
      ) : null}

      <div className="report-section">
        <h3>{labels.recommendedNextAction}</h3>
        <p>{result.nextAction}</p>
      </div>

      <ReportActions
        labels={labels}
        reportText={reportText}
        reportNotice={reportNotice}
        onCopyReport={onCopyReport}
        onDownloadReport={onDownloadReport}
      />
      {bivContent.report?.disclaimer ? <p className="muted-text">{bivContent.report.disclaimer}</p> : null}
    </div>
  );
}

function GuidedIndustrialReport({
  result,
  bivContent,
  language,
  reportText,
  reportNotice,
  onCopyReport,
  onDownloadReport,
}) {
  const report = result.industrialReport;
  const labels = bivContent.labels || {};
  return (
    <div className="local-biv-panel industrial-report">
      <p className="eyebrow">{labels.report}</p>
      <h2>{report.title}</h2>
      <p className="validator-intro">{report.decision?.label}</p>
      <div className="report-section">
        <h3>{language === 'ar' ? 'القرار التنفيذي' : 'Executive decision'}</h3>
        <p>{report.decision?.explanation}</p>
        <p>
          {language === 'ar' ? 'مستوى الثقة' : 'Confidence'}: {report.decision?.confidence?.label} ({report.decision?.confidence?.value}/100)
        </p>
      </div>
      {(report.sections || []).map((section) => (
        <div className="report-section" key={section.key || section.title}>
          <h3>{section.status ? `${section.title}: ${section.status}` : section.title}</h3>
          {section.items ? (
            <ul>
              {section.items.map((item) => (
                <li key={typeof item === 'string' ? item : `${item.title}-${item.detail}`}>
                  {typeof item === 'string' ? item : (
                    <>
                      <strong>{item.title}</strong>{item.status ? ` (${item.status})` : ''}: {item.detail || ''}
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          {section.groups ? (
            <div className="industrial-report__groups">
              {section.groups.map((group) => (
                <div key={group.title}>
                  <h4>{group.title}</h4>
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
      <ReportActions
        labels={labels}
        reportText={reportText}
        reportNotice={reportNotice}
        onCopyReport={onCopyReport}
        onDownloadReport={onDownloadReport}
      />
      {report.disclaimer ? <p className="muted-text">{report.disclaimer}</p> : null}
    </div>
  );
}

function GuidedBivBlockingStatePanel({ result, copy, language, answers = {}, errors = {}, onAnswerChange, onSubmit }) {
  const presentation = result.presentation || {};
  const questions = getBlockingQuestions(result);
  const actionableFields = getEngineClarificationFields(result);
  const hasActionableFlow = actionableFields.length > 0;
  return (
    <div className="local-biv-panel local-biv-blocked">
      <p className="eyebrow">{localizeBivJourneyState(result?.journeyState, language)}</p>
      <h2>{presentation.heading || copy.blockedHeading}</h2>
      {presentation.body ? <p className="validator-intro">{presentation.body}</p> : null}
      {presentation.policy ? <p>{presentation.policy}</p> : null}
      {hasActionableFlow ? (
        <div className="local-biv-form">
          {(result.clarificationFlow?.steps || []).map((step) => (
            <div className="local-biv-clarification-step" key={step.id || step.title}>
              {step.title ? <h3>{step.title}</h3> : null}
              {step.promptText ? <p className="muted-text">{step.promptText}</p> : null}
              {(step.fields || []).map((field) => (
                <EngineClarificationField
                  field={field}
                  key={field.id}
                  value={answers[field.id] || ''}
                  error={errors[field.id] || ''}
                  onChange={(value) => onAnswerChange?.(field.id, value)}
                />
              ))}
            </div>
          ))}
          <div className="validator-actions">
            <button className="button button--primary" type="button" onClick={onSubmit}>
              {result.clarificationFlow?.labels?.continue || copy.continueClarification}
            </button>
          </div>
        </div>
      ) : questions.length ? (
        <div className="report-section">
          <h3>{copy.requiredClarification}</h3>
          <ul>
            {questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {presentation.closing ? <p className="muted-text">{presentation.closing}</p> : null}
    </div>
  );
}

function EngineClarificationField({ field, value, error, onChange }) {
  return (
    <label className="field">
      <span className="field__label">{field.labelText}</span>
      {field.helpText ? <span className="field__help">{field.helpText}</span> : null}
      {field.type === 'select' ? (
        <select className="field__control" value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">{field.placeholderText}</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>{option.labelText}</option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          className="field__control field__control--textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholderText}
        />
      ) : (
        <input
          className="field__control"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholderText}
        />
      )}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

function ReportActions({ labels, reportText, reportNotice, onCopyReport, onDownloadReport }) {
  if (!reportText) return null;
  return (
    <>
      <div className="report-actions">
        <button className="button button--secondary" type="button" onClick={onCopyReport}>
          {labels.copyReport}
        </button>
        <button className="button button--secondary" type="button" onClick={onDownloadReport}>
          {labels.downloadReport}
        </button>
      </div>
      {reportNotice ? <p className="muted-text" role="status">{reportNotice}</p> : null}
    </>
  );
}

function getBivClassificationFields(result) {
  return result?.clarificationFlow?.steps
    ?.flatMap((step) => step.fields || [])
    ?.filter((field) => ['classificationConfirmation', 'projectTypeCorrection', 'operatingModelCorrection', 'classificationCorrectionReason'].includes(field.id)) || [];
}

function getEngineClarificationFields(result) {
  if (['classification_review', 'classification_correction'].includes(result?.journeyState)) return [];
  return result?.clarificationFlow?.steps
    ?.flatMap((step) => step.fields || [])
    ?.filter((field) => !['classificationConfirmation', 'projectTypeCorrection', 'operatingModelCorrection', 'classificationCorrectionReason'].includes(field.id)) || [];
}

function buildLocalBivReportText(result, bivContent, language) {
  if (!result) return '';
  if (result?.evaluationStatus === 'industrial_assessment' && result.industrialReport) {
    return buildIndustrialReportText({ report: result.industrialReport, language });
  }
  if (result?.evaluationStatus && result.evaluationStatus !== 'evaluated') {
    const presentation = result.presentation || {};
    const questions = presentation.questions?.length ? presentation.questions.map((question) => `- ${question}`).join('\n') : '';
    return [presentation.heading, presentation.body, presentation.policy, questions, presentation.closing].filter(Boolean).join('\n\n');
  }
  if (!result.criteria || !result.score) return '';
  return buildBusinessIdeaReportText({
    productConfig,
    content: bivContent,
    language,
    result,
  });
}

function deriveLocalReportSignals(result, bivContent) {
  const criteria = result.criteria || [];
  const feasibility = criteria.find((item) => item.key === 'feasibility');
  const scoreTotal = result.score?.total || 0;
  const signalValues = bivContent.signalValues || {};
  const input = result?.orchestrationDecision?.analysis?.input || result?.analysis?.input || {};
  const strengths = criteria
    .filter((item) => item.score >= 12)
    .map((item) => bivContent.categories?.[item.key] || item.key)
    .slice(0, 3);

  return {
    marketPotential: scoreTotal >= 75 ? signalValues.high : scoreTotal >= 55 ? signalValues.medium : signalValues.low,
    executionDifficulty: feasibility?.score >= 14 ? signalValues.low : feasibility?.score >= 10 ? signalValues.medium : signalValues.high,
    competitionLevel: input.competitiveAdvantage && input.competitiveAdvantage.length > 16 ? signalValues.moderate : signalValues.high,
    strengths,
    mainRisks: [result.biggestRisk].filter(Boolean),
  };
}

function getBlockingQuestions(result) {
  const presentationQuestions = result?.presentation?.questions || [];
  const flowQuestions = result?.clarificationFlow?.steps?.flatMap((step) => {
    const stepText = [step.title, step.promptText].filter(Boolean);
    const fieldText = (step.fields || []).flatMap((field) => [field.labelText, field.helpText].filter(Boolean));
    return [...stepText, ...fieldText];
  }) || [];
  return [...presentationQuestions, ...flowQuestions].filter(Boolean);
}

function getLocalBivCopy(language) {
  if (language === 'ar') {
    return {
      reviewHeading: 'مراجعة تصنيف BIV',
      reviewBody: 'راجع التصنيف الذي اقترحه محرك BIV قبل بدء التقييم.',
      correctionHeading: 'تصحيح التصنيف',
      correctionBody: 'اختر التصنيف الأقرب لفكرتك. سيعاد تشغيل محرك BIV باستخدام إجابتك.',
      projectType: 'نوع المشروع المقترح',
      operatingModel: 'نموذج التشغيل المقترح',
      evidence: 'سبب الاقتراح',
      confirmClassification: 'تأكيد التصنيف',
      correctClassification: 'تصحيح التصنيف',
      confirmInstead: 'تأكيد التصنيف المقترح بدلاً من ذلك',
      resultHeading: 'نتيجة محرك BIV المحلي',
      resultBody: 'هذه نتيجة محلية من محرك BIV الحالي بعد تأكيد التصنيف. لا يتم نشرها ولا تغيّر صفحة BIV العامة.',
      nextState: 'الحالة التالية',
      route: 'مسار المحرك',
      score: 'الدرجة',
      summary: 'ملخص أولي',
      nextAction: 'الإجراء التالي',
      unknown: 'غير واضح',
      blockedHeading: 'يحتاج محرك BIV إلى توضيح',
      requiredClarification: 'التوضيح المطلوب',
      requiredField: 'أكمل هذا الحقل قبل المتابعة.',
      continueClarification: 'متابعة التقييم',
    };
  }
  return {
    reviewHeading: 'Review BIV classification',
    reviewBody: 'Review the classification proposed by the BIV engine before evaluation starts.',
    correctionHeading: 'Correct classification',
    correctionBody: 'Choose the classification closest to your idea. The BIV engine will run again using your answer.',
    projectType: 'Proposed project type',
    operatingModel: 'Proposed operating model',
    evidence: 'Reason for proposal',
    confirmClassification: 'Confirm classification',
    correctClassification: 'Correct classification',
    confirmInstead: 'Confirm the proposed classification instead',
    resultHeading: 'Local BIV engine result',
    resultBody: 'This is a local result from the current BIV engine after classification confirmation. It is not published and does not change the public BIV page.',
    nextState: 'Next state',
    route: 'Engine route',
    score: 'Score',
    summary: 'Initial summary',
    nextAction: 'Next action',
    unknown: 'Unknown',
    blockedHeading: 'The BIV engine needs clarification',
    requiredClarification: 'Required clarification',
    requiredField: 'Complete this field before continuing.',
    continueClarification: 'Continue evaluation',
  };
}

function localizeBivJourneyState(value = '', language = 'en') {
  const labels = {
    en: {
      normal_evaluation: 'Normal evaluation',
      guided_followup: 'Further clarification',
      specialist_clarification: 'Specialist clarification',
      specialist_analysis: 'Specialist preliminary result',
      eligibility_clarification: 'Policy clarification',
      financing_clarification: 'Financing clarification',
      ineligible: 'Unable to evaluate',
      validation_error: 'Input needs correction',
    },
    ar: {
      normal_evaluation: 'تقييم عادي',
      guided_followup: 'توضيح إضافي',
      specialist_clarification: 'توضيح متخصص',
      specialist_analysis: 'نتيجة متخصصة أولية',
      eligibility_clarification: 'توضيح سياسة الأهلية',
      financing_clarification: 'توضيح التمويل',
      ineligible: 'لا يمكن التقييم',
      validation_error: 'المدخلات تحتاج إلى تصحيح',
    },
  };
  return labels[language]?.[value] || value || labels[language]?.guided_followup || value;
}

function localizeBivRoute(value = '', language = 'en') {
  const labels = {
    en: {
      normal_evaluation: 'Normal evaluation',
      guided_follow_up: 'Guided follow-up',
      specialist_analysis: 'Specialist analysis',
      needs_clarification: 'Needs clarification',
      ineligible: 'Ineligible',
      validation_error: 'Validation error',
    },
    ar: {
      normal_evaluation: 'تقييم عادي',
      guided_follow_up: 'متابعة موجهة',
      specialist_analysis: 'تحليل متخصص',
      needs_clarification: 'يحتاج إلى توضيح',
      ineligible: 'غير مؤهل',
      validation_error: 'خطأ في التحقق',
    },
  };
  return labels[language]?.[value] || value || labels[language]?.guided_follow_up || value;
}

function DisplayTranslationBlock({ translation, labels }) {
  if (!translation?.shouldDisplay) return null;
  return (
    <div className="display-translation" data-translation-status={translation.status}>
      <p className="eyebrow">{labels.label}</p>
      {translation.status === 'available' ? (
        <p>{translation.text}</p>
      ) : (
        <p>{labels.unavailable}</p>
      )}
    </div>
  );
}

function ChoiceList({ choices, labels, selectedId, suggestedLabel = '', onSelect }) {
  return (
    <div className="discovery-choice-list" role="radiogroup">
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          className={`discovery-choice ${selectedId === choice.id ? 'is-selected' : ''}`}
          role="radio"
          aria-checked={selectedId === choice.id}
          onClick={() => onSelect(choice.id)}
        >
          <span className="discovery-choice__copy">
            <span>{choice.label || labels[choice.id]}</span>
            {choice.rationale ? <span className="discovery-choice__rationale">{choice.rationale}</span> : null}
          </span>
          {choice.suggested ? <span className="discovery-choice__badge">{suggestedLabel}</span> : null}
        </button>
      ))}
    </div>
  );
}

function MultiChoiceList({ choices, labels, selectedIds, onToggle }) {
  return (
    <div className="discovery-choice-list">
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          className={`discovery-choice ${selectedIds.includes(choice.id) ? 'is-selected' : ''}`}
          aria-pressed={selectedIds.includes(choice.id)}
          onClick={() => onToggle(choice.id)}
        >
          <span>{labels[choice.id]}</span>
        </button>
      ))}
    </div>
  );
}

function resolveSemanticScenario(scenario, language) {
  if (scenario === 'valid_ar') return 'valid_ar';
  if (scenario === 'valid_en') return 'valid_en';
  if (scenario === 'low_confidence') return 'low_confidence';
  if (scenario === 'forbidden') return 'forbidden_authority_fields';
  if (scenario === 'timeout') return 'timeout';
  if (scenario === 'error') return 'error';
  return language === 'ar' ? 'valid_ar' : 'valid_en';
}

export default BusinessIdeaDiscoveryPrototypePage;
