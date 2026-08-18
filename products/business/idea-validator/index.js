import { renderTextArea } from "../../../components/TextArea/index.js";
import { renderProgressBar } from "../../../components/ProgressBar/index.js";
import { renderScoreCircle } from "../../../components/ScoreCircle/index.js";
import { renderScoreBar } from "../../../components/ScoreBar/index.js";
import { renderAlertBox } from "../../../components/AlertBox/index.js";
import { renderResultCard } from "../../../components/ResultCard/index.js";
import { renderProductLayout } from "../../../pages/ProductLayout/index.js";
import productConfig from "./config.js";
import { inputSchema } from "./questions.js";
import contentEn from "./content.en.js";
import contentAr from "./content.ar.js";
import { validateForExecution } from "./analyzer.js";
import { buildBusinessIdeaReportText } from "./report.js";
import { buildIndustrialReportText } from "./industrialAnalysis.js";
import {
  applyDocumentLocale,
  bindLanguageSwitcher,
  getInitialLanguage,
} from "../../../core/localization.js";
import { executeBusinessIdeaValidation } from "./executionResult.js";

const contents = { en: contentEn, ar: contentAr };
const app = typeof document !== "undefined" ? document.querySelector("#app") : null;
let activeLanguage = getInitialLanguage();
let currentReportText = "";
let currentState = "idle";
let currentInput = {};
let currentResult = null;

function getContent(language = activeLanguage) {
  return contents[language] || contents.en;
}

function getFieldContent(field, language) {
  return {
    label: field.label[language],
    placeholder: field.placeholder[language],
    helpText: field.helpText[language],
  };
}

function renderForm(content, language) {
  return `
    <section class="card" aria-labelledby="form-title">
      <div class="card__body">
        <h2 id="form-title">${content.formTitle}</h2>
        <form class="product-form" id="idea-validator-form" novalidate>
          ${inputSchema
            .map((field) => renderTextArea(field, getFieldContent(field, language), currentInput[field.id] || ""))
            .join("")}
          <button class="button button--primary" type="submit">${content.buttonLabel}</button>
        </form>
      </div>
    </section>
  `;
}

function renderShell() {
  const content = getContent();
  applyDocumentLocale(activeLanguage);
  document.title = `${content.title} | AI Source Hub`;

  const main = `
    <div class="product-workspace">
      ${renderForm(content, activeLanguage)}
      <div class="grid">
        ${renderAlertBox({ message: content.states.idle, variant: "info" })}
        <div id="processing-region" hidden>
          ${renderProgressBar({ label: content.processing, value: 70 })}
        </div>
        ${renderResultCard(`<p>${content.emptyState}</p>`)}
        <section class="card related-products">
          <div class="card__body">
            <h2>${content.labels.relatedProducts}</h2>
            <p>${content.relatedProductsPlaceholder}</p>
          </div>
        </section>
      </div>
    </div>
  `;

  app.innerHTML = renderProductLayout({ content, language: activeLanguage, main });
  bindPageEvents();
  setState("idle");

  if (currentResult) {
    renderResult(currentResult);
    setState(currentResult.state, currentResult.message);
  }
}

function setState(state, message) {
  currentState = state;
  const content = getContent();
  const alert = document.querySelector(".alert-box");
  if (alert) {
    alert.hidden = false;
    alert.textContent = message || content.states[state] || "";
    alert.className = `alert-box alert-box--${state === "invalid" || state === "error" || state === "ineligible" ? "error" : "info"}`;
  }
}

function clearErrors() {
  document.querySelectorAll(".field__error").forEach((node) => {
    node.textContent = "";
  });
}

function collectInputs() {
  return inputSchema.reduce((values, field) => {
    values[field.id] = document.querySelector(`#${field.id}`)?.value.trim() || "";
    return values;
  }, {});
}

function validateInputs(rawInput, language) {
  const { analysis, validation } = validateForExecution(rawInput, language);

  if (!validation.ok) {
    validation.errors.forEach((error) => {
      const field = inputSchema.find((item) => item.id === error.field);
      const node = document.querySelector(`[data-error-for="${error.field}"]`);
      if (node && field) {
        node.textContent = field.validationMessage[language];
      }
    });
  }

  return { analysis, validation };
}

export function executeValidation(rawInput, language = "en", industrialDetails = {}, feasibilityAnswers = {}) {
  return executeBusinessIdeaValidation({
    rawInput,
    language,
    industrialDetails,
    feasibilityAnswers,
    content: contents[language],
  });
}

function renderResult(result) {
  const content = getContent();
  const resultCard = document.querySelector(".result-card");
  if (result.evaluationStatus === "industrial_assessment" && result.industrialReport) {
    resultCard.innerHTML = `
      <div class="result-summary">
        <div>
          <p class="eyebrow">${content.labels.report}</p>
          <h2>${result.industrialReport.title}</h2>
          <p>${result.industrialReport.decision.label}</p>
        </div>
      </div>
      <div class="result-highlight">
        <h3>${activeLanguage === "ar" ? "القرار التنفيذي" : "Executive decision"}</h3>
        <p>${result.industrialReport.decision.explanation}</p>
        <p>${activeLanguage === "ar" ? "مستوى الثقة" : "Confidence"}: ${result.industrialReport.decision.confidence.label} (${result.industrialReport.decision.confidence.value}/100)</p>
      </div>
      ${result.industrialReport.sections
        .map((section) => `
          <div class="result-highlight">
            <h3>${section.status ? `${section.title}: ${section.status}` : section.title}</h3>
            ${section.items ? `<ul>${section.items.map((item) => `<li>${typeof item === "string" ? item : `<strong>${item.title}</strong>${item.status ? ` (${item.status})` : ""}: ${item.detail || ""}`}</li>`).join("")}</ul>` : ""}
            ${section.groups ? section.groups.map((group) => `<h4>${group.title}</h4><ul>${group.items.map((item) => `<li>${item}</li>`).join("")}</ul>`).join("") : ""}
            ${section.missing ? `<ul>${section.missing.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
          </div>
        `)
        .join("")}
      <p>${result.industrialReport.disclaimer}</p>
      <div class="report-actions">
        <button class="button button--secondary" type="button" id="copy-report">${content.labels.copyReport}</button>
        <button class="button button--secondary" type="button" id="download-report">${content.labels.downloadReport}</button>
        <button class="button button--secondary" type="button" id="start-again">${content.labels.startAgain}</button>
      </div>
    `;
    resultCard.hidden = false;
    currentReportText = buildReportText(result);
    bindReportActions();
    return;
  }

  if (result.evaluationStatus && result.evaluationStatus !== "evaluated") {
    const presentation = result.presentation || {
      heading: result.title,
      body: result.message,
      policy: result.policyText,
      closing: "",
    };
    resultCard.innerHTML = `
      <div class="result-highlight">
        <h3>${presentation.heading}</h3>
        <p>${presentation.body}</p>
        <p>${presentation.policy}</p>
        ${
          presentation.questions?.length
            ? `<div class="clarification-questions">
                <p class="clarification-questions__title">${activeLanguage === "ar" ? "التفاصيل المطلوبة" : "Details needed"}</p>
                <ol>${presentation.questions.map((question) => `<li>${question}</li>`).join("")}</ol>
              </div>`
            : ""
        }
        ${presentation.closing ? `<p>${presentation.closing}</p>` : ""}
      </div>
      <div class="report-actions">
        <button class="button button--secondary" type="button" id="start-again">${content.labels.startAgain}</button>
      </div>
    `;
    resultCard.hidden = false;
    const questions = presentation.questions?.length ? presentation.questions.map((question) => `- ${question}`).join("\n") : "";
    currentReportText = [presentation.heading, presentation.body, presentation.policy, questions, presentation.closing].filter(Boolean).join("\n\n");
    bindReportActions();
    return;
  }

  const verdict = content.verdicts[result.verdictKey];
  const confidence = content.confidence[result.confidence.level];

  resultCard.innerHTML = `
    <div class="result-summary">
      <div>
        <p class="eyebrow">${content.labels.verdict}</p>
        <h2>${verdict}</h2>
        <p>${content.labels.confidence}: ${confidence} (${result.confidence.value}/100)</p>
      </div>
      ${renderScoreCircle({ label: content.labels.totalScore, score: result.score.total, max: 100 })}
    </div>
    <div>
      <h3>${content.labels.scoreBreakdown}</h3>
      <div class="score-breakdown">
        ${result.criteria
          .map((criterion) =>
            renderScoreBar({
              label: content.categories[criterion.key],
              score: criterion.score,
              max: criterion.max,
              reason: criterion.reason,
            })
          )
          .join("")}
      </div>
    </div>
    <div class="result-highlight-grid">
      <div class="result-highlight">
        <h3>${content.labels.biggestRisk}</h3>
        <p>${result.biggestRisk}</p>
      </div>
      <div class="result-highlight">
        <h3>${content.labels.nextAction}</h3>
        <p>${result.nextAction}</p>
      </div>
    </div>
    <div class="result-highlight">
      <h3>${content.labels.improvedIdea}</h3>
      <p>${result.improvedIdea}</p>
    </div>
    <div class="report-actions">
      <button class="button button--secondary" type="button" id="copy-report">${content.labels.copyReport}</button>
      <button class="button button--secondary" type="button" id="download-report">${content.labels.downloadReport}</button>
      <button class="button button--secondary" type="button" id="start-again">${content.labels.startAgain}</button>
    </div>
  `;
  resultCard.hidden = false;
  currentReportText = buildReportText(result);
  bindReportActions();
}

function buildReportText(result) {
  if (result.evaluationStatus === "industrial_assessment" && result.industrialReport) {
    return buildIndustrialReportText({
      report: result.industrialReport,
      language: activeLanguage,
    });
  }

  return buildBusinessIdeaReportText({
    productConfig,
    content: getContent(),
    language: activeLanguage,
    result,
  });
}

function bindReportActions() {
  document.querySelector("#copy-report")?.addEventListener("click", async () => {
    const content = getContent();
    try {
      await navigator.clipboard.writeText(currentReportText);
      setState("success", content.report.copied);
    } catch {
      setState("error", content.report.copyFailed);
    }
  });

  document.querySelector("#download-report")?.addEventListener("click", () => {
    const blob = new Blob([currentReportText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "business-idea-validator-report.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.querySelector("#start-again")?.addEventListener("click", () => {
    document.querySelector("#idea-validator-form")?.reset();
    document.querySelector(".result-card").hidden = true;
    currentInput = {};
    currentResult = null;
    currentReportText = "";
    clearErrors();
    setState("reset", getContent().states.reset);
  });
}

function bindPageEvents() {
  bindLanguageSwitcher({
    language: activeLanguage,
    setLanguage: (nextLanguage) => {
      currentInput = collectInputs();
      activeLanguage = nextLanguage;
      if (currentResult) {
        const nextResult = executeValidation(currentInput, activeLanguage);
        currentResult = nextResult.ok ? nextResult : null;
      }
      renderShell();
    },
  });

  document.querySelectorAll(".field__control").forEach((field) => {
    field.addEventListener("input", () => {
      currentInput = collectInputs();
      if (currentState !== "processing") {
        setState("input");
      }
    });
  });

  document.querySelector("#idea-validator-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    const rawInput = collectInputs();
    currentInput = rawInput;
    const { validation } = validateInputs(rawInput, activeLanguage);

    if (!validation.ok) {
      currentResult = null;
      document.querySelector(".result-card").hidden = true;
      setState("invalid");
      return;
    }

    setState("processing");
    document.querySelector("#processing-region").hidden = false;
    const result = executeValidation(rawInput, activeLanguage);
    document.querySelector("#processing-region").hidden = true;

    if (!result.ok) {
      setState("invalid");
      return;
    }

    renderResult(result);
    currentResult = result;
    setState(result.state, result.message);
  });
}

if (app) {
  renderShell();
}
