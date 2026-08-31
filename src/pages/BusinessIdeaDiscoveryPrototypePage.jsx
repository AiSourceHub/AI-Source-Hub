import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { renderHeader } from '../../components/Header/index.js';
import { renderFooter } from '../../components/Footer/index.js';
import { applyDocumentLocale, bindLanguageSwitcher, getFooterContent, getHeaderContent } from '../../core/localization.js';
import bivContentEn from '../../products/business/idea-validator/content.en.js';
import bivContentAr from '../../products/business/idea-validator/content.ar.js';
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
  const [bivExecutionResult, setBivExecutionResult] = useState(null);
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

  const resetDownstreamSufficiency = () => {
    setDownstreamAnswers({});
    setActiveClarificationAnswer('');
    resetBivExecution();
  };

  const resetBivExecution = () => {
    setBivExecutionAnswers({});
    setBivExecutionResult(null);
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

  const runLocalBivExecution = (answers = bivExecutionAnswers) => {
    const adapted = adaptGuidedDiscoveryHandoffToBiv(handoff, sufficiency);
    if (!adapted.ok || !adapted.currentEngineInput) {
      setError(language === 'ar' ? 'لم تكتمل بيانات المسودة المحلية بعد.' : 'The local draft is not ready yet.');
      return null;
    }
    const result = executeBusinessIdeaValidation({
      ...adapted.currentEngineInput,
      feasibilityAnswers: {
        ...(adapted.currentEngineInput.feasibilityAnswers || {}),
        ...answers,
      },
      content: bivContentMap[language] || bivContentMap.en,
    });
    setBivExecutionResult(result);
    setError('');
    return result;
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
                      language={language}
                      onConfirm={confirmBivClassification}
                      onCorrect={startBivClassificationCorrection}
                      onCorrectionChange={updateBivClassificationAnswer}
                      onCorrectionSubmit={submitBivClassificationCorrection}
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
  language,
  onConfirm,
  onCorrect,
  onCorrectionChange,
  onCorrectionSubmit,
  error,
}) {
  const copy = getLocalBivCopy(language);
  const isClassificationReview = result?.journeyState === 'classification_review';
  const isClassificationCorrection = result?.journeyState === 'classification_correction';
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

function getBivClassificationFields(result) {
  return result?.clarificationFlow?.steps
    ?.flatMap((step) => step.fields || [])
    ?.filter((field) => ['classificationConfirmation', 'projectTypeCorrection', 'operatingModelCorrection', 'classificationCorrectionReason'].includes(field.id)) || [];
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
