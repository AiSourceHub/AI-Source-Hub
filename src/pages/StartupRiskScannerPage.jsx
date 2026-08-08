import { useEffect, useMemo, useState } from 'react';
import { renderProductLayout } from '../../pages/ProductLayout/index.js';
import { content as scannerContent } from '../../products/startup-risk-scanner/metadata.js';
import { inputSchema } from '../../products/startup-risk-scanner/questions.js';
import { validateForExecution } from '../../products/startup-risk-scanner/analyzer.js';
import { scoreStartupRisk } from '../../products/startup-risk-scanner/scoring.js';
import { buildStartupRiskRecommendations } from '../../products/startup-risk-scanner/recommendations.js';
import { buildStartupRiskReport, buildStartupRiskReportText } from '../../products/startup-risk-scanner/report.js';
import { renderStartupRiskProductPage } from '../../products/startup-risk-scanner/ProductPage.js';
import { renderStartupRiskResultPage } from '../../products/startup-risk-scanner/ResultPage.js';
import {
  applyDocumentLocale,
  bindLanguageSwitcher,
} from '../../core/localization.js';

const initialState = {
  status: 'idle',
  alertVariant: 'info',
  input: {},
  result: null,
};

function executeStartupRiskAssessment(rawInput, language) {
  const { analysis, validation } = validateForExecution(rawInput);

  if (!validation.ok) {
    return {
      ok: false,
      state: 'invalid',
      analysis,
      validation,
    };
  }

  const riskResult = scoreStartupRisk(analysis, language);
  const recommendationResult = buildStartupRiskRecommendations(riskResult, language);
  const pageContent = scannerContent[language] || scannerContent.en;
  const report = buildStartupRiskReport({
    content: pageContent,
    language,
    analysis,
    riskResult,
    recommendationResult,
  });

  return {
    ok: true,
    state: riskResult.overallRiskLevel === 'critical' ? 'partial' : 'success',
    analysis,
    validation,
        riskResult,
        recommendationResult,
        report,
  };
}

function collectScannerInputs(form) {
  return inputSchema.reduce((values, field) => {
    const control = form.querySelector(`[name="${field.id}"]:checked`) || form.querySelector(`#${field.id}`);
    values[field.id] = control?.value?.trim?.() ?? control?.value ?? '';
    return values;
  }, {});
}

function getValidationErrors(validation, language) {
  return validation.errors.reduce((errors, error) => {
    const field = inputSchema.find((item) => item.id === error.field);
    errors[error.field] = field?.validationMessage?.[language] || error.field;
    return errors;
  }, {});
}

function StartupRiskScannerPage({ locale }) {
  const { language, setLanguage } = locale;
  const content = scannerContent[language] || scannerContent.en;
  const [state, setState] = useState(initialState);
  const [errors, setErrors] = useState({});

  const reportText = useMemo(() => {
    if (!state.result) return '';

    return buildStartupRiskReportText({
      content,
      language,
      analysis: state.result.analysis,
      riskResult: state.result.riskResult,
      recommendationResult: state.result.recommendationResult,
    });
  }, [content, language, state.result]);

  useEffect(() => {
    applyDocumentLocale(language);
    document.title = `${content.title} | AI Source Hub`;
  }, [content.title, language]);

  useEffect(() => {
    return bindLanguageSwitcher({ language, setLanguage });
  });

  useEffect(() => {
    if (!state.result) return;

    const localizedResult = executeStartupRiskAssessment(state.input, language);
    if (!localizedResult.ok) return;

    setState((current) => ({
      ...current,
        status: localizedResult.state,
        alertVariant: localizedResult.state === 'partial' ? 'warning' : 'success',
        statusMessage: '',
        result: localizedResult,
      }));
  }, [language]);

  useEffect(() => {
    document.querySelectorAll('.field__error').forEach((node) => {
      node.textContent = '';
    });
    document.querySelectorAll("[aria-invalid='true']").forEach((node) => {
      node.removeAttribute('aria-invalid');
    });

    Object.entries(errors).forEach(([fieldId, message]) => {
      const errorNode = document.querySelector(`[data-error-for="${fieldId}"]`);
      const directControl = document.querySelector(`#${fieldId}`);
      const radioControls = document.querySelectorAll(`input[type="radio"][name="${fieldId}"]`);

      if (errorNode) {
        errorNode.textContent = message;
      }

      if (directControl) {
        directControl.setAttribute('aria-invalid', 'true');
      }

      radioControls.forEach((control) => {
        control.setAttribute('aria-invalid', 'true');
      });
    });
  }, [errors, state]);

  useEffect(() => {
    const form = document.querySelector('#startup-risk-form');
    if (!form) return undefined;

    const handleInput = () => {
      const input = collectScannerInputs(form);
      setState((current) => ({
        ...current,
        input,
        status: current.status === 'processing' ? current.status : 'input',
        alertVariant: current.status === 'processing' ? current.alertVariant : 'info',
        statusMessage: '',
      }));
    };

    const handleSubmit = (event) => {
      event.preventDefault();
      const input = collectScannerInputs(form);
      const prepared = executeStartupRiskAssessment(input, language);

      if (!prepared.ok) {
        setErrors(getValidationErrors(prepared.validation, language));
        setState((current) => ({
          ...current,
          input,
          result: null,
          status: 'invalid',
          alertVariant: 'error',
          statusMessage: '',
        }));
        return;
      }

      setErrors({});
      setState({
        input,
        result: prepared,
        status: prepared.state,
        alertVariant: prepared.state === 'partial' ? 'warning' : 'success',
        statusMessage: '',
      });
    };

    form.addEventListener('input', handleInput);
    form.addEventListener('change', handleInput);
    form.addEventListener('submit', handleSubmit);

    return () => {
      form.removeEventListener('input', handleInput);
      form.removeEventListener('change', handleInput);
      form.removeEventListener('submit', handleSubmit);
    };
  });

  useEffect(() => {
    const copyButton = document.querySelector('#copy-report');
    const downloadButton = document.querySelector('#download-report');
    const restartButton = document.querySelector('#start-again');

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(reportText);
        setState((current) => ({
          ...current,
          status: 'success',
          alertVariant: 'success',
          statusMessage: content.report.copied,
        }));
      } catch {
        setState((current) => ({
          ...current,
          status: 'error',
          alertVariant: 'error',
          statusMessage: content.report.copyFailed,
        }));
      }
    };

    const handleDownload = () => {
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'startup-risk-scanner-report.txt';
      link.click();
      URL.revokeObjectURL(link.href);
    };

    const handleRestart = () => {
      setErrors({});
      setState({
        ...initialState,
        status: 'reset',
      });
    };

    copyButton?.addEventListener('click', handleCopy);
    downloadButton?.addEventListener('click', handleDownload);
    restartButton?.addEventListener('click', handleRestart);

    return () => {
      copyButton?.removeEventListener('click', handleCopy);
      downloadButton?.removeEventListener('click', handleDownload);
      restartButton?.removeEventListener('click', handleRestart);
    };
  });

  const resultHtml = state.result
    ? renderStartupRiskResultPage({ content, language, result: state.result })
    : null;

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: renderProductLayout({
          content,
          language,
          main: renderStartupRiskProductPage({
            content,
            language,
            state,
            resultHtml,
          }),
        }),
      }}
    />
  );
}

export default StartupRiskScannerPage;
