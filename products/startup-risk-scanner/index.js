import { renderProductLayout } from "../../pages/ProductLayout/index.js";
import productConfig from "./config.js";
import { content } from "./metadata.js";
import { inputSchema } from "./questions.js";
import { validateForExecution } from "./analyzer.js";
import { scoreStartupRisk } from "./scoring.js";
import { buildStartupRiskRecommendations } from "./recommendations.js";
import { buildStartupRiskReport, buildStartupRiskReportText } from "./report.js";
import { renderStartupRiskProductPage } from "./ProductPage.js";
import { renderStartupRiskResultPage } from "./ResultPage.js";
import {
  applyDocumentLocale,
  bindLanguageSwitcher,
  getInitialLanguage,
} from "../../core/localization.js";

const app = typeof document !== "undefined" ? document.querySelector("#app") : null;
let activeLanguage = getInitialLanguage();
let currentState = {
  status: "idle",
  alertVariant: "info",
  input: {},
  result: null,
  reportText: "",
};

function getContent(language = activeLanguage) {
  return content[language] || content.en;
}

export function executeValidation(rawInput, language = "en") {
  const { analysis, validation } = validateForExecution(rawInput);

  if (!validation.ok) {
    return {
      ok: false,
      state: "invalid",
      analysis,
      validation,
    };
  }

  return executePreparedAssessment({ analysis, validation, language });
}

function executePreparedAssessment({ analysis, validation, language = "en" }) {
  const riskResult = scoreStartupRisk(analysis, language);
  const recommendationResult = buildStartupRiskRecommendations(riskResult, language);
  const pageContent = getContent(language);
  const report = buildStartupRiskReport({
    content: pageContent,
    language,
    analysis,
    riskResult,
    recommendationResult,
  });

  return {
    ok: true,
    state: riskResult.overallRiskLevel === "critical" ? "partial" : "success",
    analysis,
    validation,
    riskResult,
    recommendationResult,
    report,
  };
}

function renderShell() {
  if (!app) return;

  const pageContent = getContent();
  applyDocumentLocale(activeLanguage);
  document.title = `${productConfig.title[activeLanguage]} | AI Source Hub`;

  app.innerHTML = renderProductLayout({
    content: pageContent,
    language: activeLanguage,
    main: renderStartupRiskProductPage({
      content: pageContent,
      language: activeLanguage,
      state: currentState,
    }),
  });

  bindPageEvents();

  if (currentState.result) {
    renderResult(currentState.result);
  }
}

function collectInputs() {
  return inputSchema.reduce((values, field) => {
    const control = document.querySelector(`[name="${field.id}"]:checked`) || document.querySelector(`#${field.id}`);
    values[field.id] = control?.value?.trim?.() ?? control?.value ?? "";
    return values;
  }, {});
}

function clearErrors() {
  document.querySelectorAll(".field__error").forEach((node) => {
    node.textContent = "";
  });
  document.querySelectorAll("[aria-invalid='true']").forEach((node) => {
    node.removeAttribute("aria-invalid");
  });
}

function showValidationErrors(validation) {
  validation.errors.forEach((error) => {
    const field = inputSchema.find((item) => item.id === error.field);
    const node = document.querySelector(`[data-error-for="${error.field}"]`);
    if (node && field) {
      node.textContent = field.validationMessage[activeLanguage];
    }
    markInvalidField(error.field);
  });
}

function setAlert(status, variant = "info") {
  currentState.status = status;
  currentState.alertVariant = variant;
  const alert = document.querySelector(".alert-box");
  if (alert) {
    alert.textContent = getContent().states[status] || "";
    alert.className = `alert-box alert-box--${variant}`;
  }
}

function renderResult(result) {
  const resultCard = document.querySelector(".result-card");
  if (!resultCard) return;

  resultCard.innerHTML = renderStartupRiskResultPage({
    content: getContent(),
    language: activeLanguage,
    result,
  });
  resultCard.hidden = false;
  currentState.reportText = buildStartupRiskReportText({
    content: getContent(),
    language: activeLanguage,
    analysis: result.analysis,
    riskResult: result.riskResult,
    recommendationResult: result.recommendationResult,
  });
  bindReportActions();
}

function bindPageEvents() {
  bindLanguageSwitcher({
    language: activeLanguage,
    setLanguage: (nextLanguage) => {
      currentState.input = collectInputs();
      activeLanguage = nextLanguage;
      if (currentState.result) {
        currentState.result = executePreparedAssessment({
          analysis: currentState.result.analysis,
          validation: currentState.result.validation,
          language: activeLanguage,
        });
      }
      renderShell();
    },
  });

  document.querySelectorAll(".field__control, input[type='radio']").forEach((field) => {
    field.addEventListener("input", () => {
      if (currentState.status !== "processing") {
        currentState.input = collectInputs();
        setAlert("input", "info");
      }
    });
  });

  document.querySelector("#startup-risk-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    currentState.input = collectInputs();
    const prepared = validateForExecution(currentState.input);

    if (!prepared.validation.ok) {
      currentState.result = null;
      document.querySelector(".result-card").hidden = true;
      showValidationErrors(prepared.validation);
      setAlert("invalid", "error");
      return;
    }

    setAlert("processing", "info");
    document.querySelector("#processing-region").hidden = false;
    const result = executePreparedAssessment({
      analysis: prepared.analysis,
      validation: prepared.validation,
      language: activeLanguage,
    });
    document.querySelector("#processing-region").hidden = true;

    currentState.result = result;
    renderResult(result);
    setAlert(result.state, result.state === "partial" ? "warning" : "success");
  });
}

function bindReportActions() {
  document.querySelector("#copy-report")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(currentState.reportText);
      setAlert("success", "success");
      document.querySelector(".alert-box").textContent = getContent().report.copied;
    } catch {
      setAlert("error", "error");
      document.querySelector(".alert-box").textContent = getContent().report.copyFailed;
    }
  });

  document.querySelector("#download-report")?.addEventListener("click", () => {
    const blob = new Blob([currentState.reportText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "startup-risk-scanner-report.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.querySelector("#start-again")?.addEventListener("click", () => {
    currentState = {
      status: "reset",
      alertVariant: "info",
      input: {},
      result: null,
      reportText: "",
    };
    renderShell();
  });
}

function markInvalidField(fieldId) {
  const directControl = document.querySelector(`#${fieldId}`);
  const radioControls = document.querySelectorAll(`input[type="radio"][name="${fieldId}"]`);

  if (directControl) {
    directControl.setAttribute("aria-invalid", "true");
  }

  radioControls.forEach((control) => {
    control.setAttribute("aria-invalid", "true");
  });
}

if (app) {
  renderShell();
}
