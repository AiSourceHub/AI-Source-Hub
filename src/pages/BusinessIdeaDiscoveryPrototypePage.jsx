import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { renderHeader } from '../../components/Header/index.js';
import { renderFooter } from '../../components/Footer/index.js';
import { applyDocumentLocale, bindLanguageSwitcher, getFooterContent, getHeaderContent } from '../../core/localization.js';
import {
  buildDiscoveryState,
  buildConfirmationContract,
  buildUnderstandingSummary,
  confirmDiscoveryUnderstanding,
  createInitialDiscoveryState,
  discoveryContent,
  getCoreOfferingQuestion,
  getDiscoverySteps,
  getIntentChoices,
  getMixedOperatingChoices,
  getNextStep,
  getOperatingChoices,
  getPreviousStep,
  getProgressText,
  reopenDiscoveryConfirmation,
  startDiscoveryFieldEdit,
  applyDiscoveryFieldChange,
  updateMixedOperatingSelection,
  validateDiscoveryStep,
} from '../../products/business/idea-validator/intentDiscoveryPrototype.js';
import { createSemanticIntentRequest } from '../../products/business/idea-validator/semanticIntentContract.js';
import { createMockSemanticIntentProvider } from '../../products/business/idea-validator/semanticIntentMockProvider.js';
import { buildDeterministicIntentPresentation, buildSemanticIntentPresentation } from '../../products/business/idea-validator/semanticIntentPresentation.js';
import { interpretWithSemanticProvider } from '../../products/business/idea-validator/semanticIntentProvider.js';
import { BIV_SEMANTIC_WORKER_ENDPOINT, observeSemanticShadow } from '../../products/business/idea-validator/semanticShadowAdapter.js';

function BusinessIdeaDiscoveryPrototypePage({ locale }) {
  const location = useLocation();
  const { language } = locale;
  const content = discoveryContent[language] || discoveryContent.en;
  const [step, setStep] = useState('idea');
  const [state, setState] = useState(createInitialDiscoveryState);
  const [error, setError] = useState('');
  const [semanticStatus, setSemanticStatus] = useState('idle');
  const [semanticPresentation, setSemanticPresentation] = useState(null);
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
  const confirmationContract = useMemo(() => buildConfirmationContract(state), [state]);
  const progressText = useMemo(() => getProgressText(state, step, language), [state, step, language]);
  const progressSteps = useMemo(() => getDiscoverySteps(state), [state]);

  const setOriginalIdea = (value) => {
    setState(buildDiscoveryState({
      ...state,
      originalIdea: value,
      confirmationStatus: 'not_confirmed',
    }));
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
    setState(nextState);
    setError('');
    if (fieldId === 'selectedOperatingApproaches' && nextState.selectedOperatingApproach !== 'mixed') {
      setStep('operating');
      return;
    }
    setStep({
      selectedIntent: 'intent',
      coreOffering: 'coreOffering',
      selectedOperatingApproach: 'operating',
      selectedOperatingApproaches: 'mixedOperating',
    }[fieldId] || 'summary');
  };

  const goToIntent = () => {
    const validation = validateDiscoveryStep(state, 'idea', language);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    const nextState = buildDiscoveryState({ ...state, confirmationStatus: 'not_confirmed' });
    setState(nextState);
    setError('');
    setStep('intent');
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
    setStep(state.editingField === 'selectedIntent' && buildConfirmationContract(state).isComplete ? 'summary' : getNextStep(state, 'intent'));
  };

  const goToCoreOffering = () => {
    const validation = validateDiscoveryStep(state, 'coreOffering', language);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError('');
    setStep(state.editingField === 'coreOffering' && buildConfirmationContract(state).isComplete ? 'summary' : getNextStep(state, 'coreOffering'));
  };

  const goFromOperating = () => {
    const validation = validateDiscoveryStep(state, 'operating', language);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError('');
    setStep(state.editingField === 'selectedOperatingApproach' && buildConfirmationContract(state).isComplete ? 'summary' : getNextStep(state, 'operating'));
  };

  const goToSummary = () => {
    const validation = validateDiscoveryStep(state, 'mixedOperating', language);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError('');
    setStep('summary');
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
    setError('');
  };

  const reset = () => {
    setState(createInitialDiscoveryState());
    setStep('idea');
    setSemanticStatus('idle');
    setSemanticPresentation(null);
    setError('');
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
                    style={{ inlineSize: `${((progressSteps.indexOf(step) + 1) / progressSteps.length) * 100}%` }}
                  />
                </span>
              </div>

              {step === 'idea' ? (
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

              {step === 'intent' ? (
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
                        <button className="button button--secondary" type="button" onClick={() => setStep('idea')}>
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

              {step === 'coreOffering' ? (
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
                    <button className="button button--secondary" type="button" onClick={() => setStep(getPreviousStep(state, 'coreOffering'))}>
                      {content.actions.back}
                    </button>
                    <button className="button button--primary" type="button" onClick={goToCoreOffering}>
                      {content.actions.continue}
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 'operating' ? (
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
                    <button className="button button--secondary" type="button" onClick={() => setStep(getPreviousStep(state, 'operating'))}>
                      {content.actions.back}
                    </button>
                    <button className="button button--primary" type="button" onClick={goFromOperating}>
                      {content.actions.continue}
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 'mixedOperating' ? (
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
                    <button className="button button--secondary" type="button" onClick={() => setStep(getPreviousStep(state, 'mixedOperating'))}>
                      {content.actions.back}
                    </button>
                    <button className="button button--primary" type="button" onClick={goToSummary}>
                      {content.actions.continue}
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 'summary' ? (
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
