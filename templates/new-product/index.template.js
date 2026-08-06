import { Analyzer } from "../../../core-engine/analyzer/Analyzer.js";
import { ValidationEngine } from "../../../core-engine/validation/ValidationEngine.js";
import { ScoreEngine } from "../../../core-engine/scoring/ScoreEngine.js";
import { RecommendationEngine } from "../../../core-engine/recommendation/RecommendationEngine.js";
import { ReportBuilder } from "../../../core-engine/reporting/ReportBuilder.js";
import { productConfig } from "./product.config.js";
import { inputSchema } from "./schema.js";
import { contentAr } from "./content.ar.js";
import { contentEn } from "./content.en.js";
import {
  buildRuleContext,
  calculateConfidence,
  detectRisks,
  generateImprovedOutput,
  generateRecommendation,
  getVerdict,
  scoreCategories,
  scoreCategory,
} from "./rules.js";
import { renderProductLayout } from "../../../pages/ProductLayout/index.js";
import {
  applyDocumentLocale,
  bindLanguageSwitcher,
  getInitialLanguage,
} from "../../../core/localization.js";

const contentByLanguage = {
  en: contentEn,
  ar: contentAr,
};

const state = {
  language: getInitialLanguage(),
  status: "idle",
  input: {},
  validation: null,
  result: null,
  error: null,
};

export function setLanguage(language) {
  state.language = productConfig.languages.includes(language) ? language : "en";
  render();
}

export function updateInput(fieldId, value) {
  state.input = {
    ...state.input,
    [fieldId]: value,
  };
}

export function resetProduct() {
  state.status = "idle";
  state.input = {};
  state.validation = null;
  state.result = null;
  state.error = null;
  render();
}

export function runProduct() {
  const content = contentByLanguage[state.language];

  try {
    state.status = "processing";
    state.error = null;
    render();

    const analyzer = new Analyzer({
      fields: inputSchema.map((field) => ({ key: field.id })),
      uncertaintyTerms: ["not sure", "unknown", "tbd", "غير متأكد", "لا أعرف"],
    });
    const analysis = analyzer.analyze(state.input);
    const validator = new ValidationEngine({
      requiredFields: inputSchema.filter((field) => field.required).map((field) => field.id),
      rules: buildValidationRules(),
    });
    const validation = validator.validate(analysis);

    if (!validation.ok) {
      state.status = "invalid";
      state.validation = validation;
      state.error = content.errors.invalidInput;
      render();
      return null;
    }

    const context = buildRuleContext({ input: state.input, analysis, language: state.language });
    const criteriaConfig = scoreCategories.map((category) => ({
      key: category.id,
      label: category.label[state.language],
      weight: category.weight,
      score: () => scoreCategory(category, context).score,
    }));
    const scoreEngine = new ScoreEngine({ criteria: criteriaConfig });
    const score = scoreEngine.score({ analysis, context });
    const categoryScores = score.criteria;
    const totalScore = score.percentage;
    const verdict = getVerdict(score.percentage);
    const risks = detectRisks(context, categoryScores);
    const confidence = calculateConfidence({ validation, analysis, scores: categoryScores });
    const recommendationEngine = new RecommendationEngine({
      rules: [
        {
          key: "primary_recommendation",
          title: content.results.recommendedNextAction,
          priority: 1,
          when: () => true,
          action: () => generateRecommendation({ verdict, risks, language: state.language }).nextAction,
          reason: () => risks[0]?.description[state.language] || "",
        },
      ],
    });
    const recommendation = recommendationEngine.recommend({ score, verdict, risks, confidence });
    const generatedOutput = generateImprovedOutput({
      input: state.input,
      recommendation,
      language: state.language,
    });

    const result = {
      productId: productConfig.id,
      language: state.language,
      verdict,
      totalScore,
      score,
      categoryScores,
      confidence,
      risks,
      recommendation,
      generatedOutput,
    };

    const reportBuilder = new ReportBuilder({
      productName: productConfig.title[state.language],
      sections: [
        {
          key: "scores",
          title: content.results.scoreBreakdown,
          content: () => categoryScores,
        },
        {
          key: "recommendation",
          title: content.results.recommendedNextAction,
          content: () => recommendation.action,
        },
      ],
    });
    result.report = reportBuilder.build({
      language: state.language,
      direction: content.direction,
      status: "success",
      score,
      recommendation,
      summary: verdict.label[state.language],
    });

    state.status = "success";
    state.validation = validation;
    state.result = result;
    render();
    return result;
  } catch (error) {
    state.status = "error";
    state.error = content.errors.generationFailed;
    render();
    return null;
  }
}

export function render() {
  const content = contentByLanguage[state.language];
  const app = document.querySelector("[data-product-root]");

  if (!app) return;

  app.dir = content.direction;
  app.lang = state.language;
  applyDocumentLocale(state.language);
  app.innerHTML = renderProductLayout({
    content: {
      ...content,
      product: productConfig,
      homeHref: "../../../pages/Home/index.html",
    },
    language: state.language,
    main: renderProductMain(content),
  });

  bindProductEvents(app);
}

function renderProductMain(content) {
  return `
    <section class="product-shell" data-state="${state.status}">
      ${renderLanguageControls(content)}
      ${renderInputForm(content)}
      ${renderFeedback(content)}
      ${state.result ? renderResult(content) : renderEmptyState(content)}
    </section>
  `;
}

function renderLanguageControls(content) {
  return `
    <div class="language-controls" aria-label="Language">
      <button type="button" data-language="en">${content.buttons.switchToEnglish}</button>
      <button type="button" data-language="ar">${content.buttons.switchToArabic}</button>
    </div>
  `;
}

function renderInputForm(content) {
  const fields = inputSchema.map((field) => {
    const label = field.label[state.language];
    const helpText = field.helpText?.[state.language] || "";

    return `
      <label class="field" for="${field.id}">
        <span>${label}</span>
        ${renderField(field)}
        ${helpText ? `<small>${helpText}</small>` : ""}
      </label>
    `;
  }).join("");

  return `
    <form data-product-form>
      <h2>${content.form.title}</h2>
      <p>${content.form.description}</p>
      ${fields}
      <button type="submit">${content.buttons.submit}</button>
    </form>
  `;
}

function renderField(field) {
  const value = state.input[field.id] || "";
  const placeholder = field.placeholder?.[state.language] || "";

  if (field.type === "textarea") {
    return `<textarea id="${field.id}" name="${field.id}" placeholder="${placeholder}" dir="${field.direction}">${value}</textarea>`;
  }

  if (["select", "radio", "checkbox"].includes(field.type)) {
    return renderChoiceField(field);
  }

  return `<input id="${field.id}" name="${field.id}" type="${field.type}" value="${value}" placeholder="${placeholder}" dir="${field.direction}" min="${field.minimum ?? ""}" max="${field.maximum ?? ""}" step="${field.step ?? ""}" />`;
}

function renderChoiceField(field) {
  if (field.type === "select") {
    const options = field.options.map((option) => {
      const selected = state.input[field.id] === option.value ? "selected" : "";
      return `<option value="${option.value}" ${selected}>${option.label[state.language]}</option>`;
    }).join("");

    return `<select id="${field.id}" name="${field.id}"><option value="">${field.placeholder?.[state.language] || ""}</option>${options}</select>`;
  }

  return field.options.map((option) => {
    const checked = field.type === "checkbox"
      ? Array.isArray(state.input[field.id]) && state.input[field.id].includes(option.value)
      : state.input[field.id] === option.value;

    return `
      <label class="choice">
        <input type="${field.type}" name="${field.id}" value="${option.value}" ${checked ? "checked" : ""} />
        <span>${option.label[state.language]}</span>
      </label>
    `;
  }).join("");
}

function renderFeedback(content) {
  if (!state.error) return "";
  return `<div role="alert" class="alert">${state.error}</div>`;
}

function renderEmptyState(content) {
  return `
    <section class="empty-state">
      <h2>${content.emptyState.title}</h2>
      <p>${content.emptyState.description}</p>
    </section>
  `;
}

function renderResult(content) {
  return `
    <section class="result">
      <h2>${content.results.title}</h2>
      <strong>${content.results.verdict}: ${state.result.verdict.label[state.language]}</strong>
      <p>${content.results.totalScore}: ${state.result.totalScore}</p>
      <p>${content.results.confidence}: ${state.result.confidence}</p>
      <p>${content.results.biggestRisk}: ${state.result.risks[0]?.description[state.language] || ""}</p>
      <p>${content.results.recommendedNextAction}: ${state.result.recommendation.action}</p>
      <p>${content.results.improvedOutput}: ${state.result.generatedOutput}</p>
      <button type="button" data-copy-report>${content.buttons.copyReport}</button>
      <button type="button" data-download-report>${content.buttons.downloadReport}</button>
      <button type="button" data-reset>${content.buttons.reset}</button>
    </section>
  `;
}

function bindProductEvents(app) {
  bindLanguageSwitcher({
    language: state.language,
    setLanguage,
    root: app,
  });

  app.querySelector("[data-product-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    inputSchema.forEach((field) => updateInput(field.id, formData.get(field.id)));
    runProduct();
  });

  app.querySelector("[data-reset]")?.addEventListener("click", resetProduct);
}

function buildValidationRules() {
  return inputSchema.map((field) => (analysis) => {
    const value = analysis.input[field.id] || "";

    if (field.minLength && value && value.length < field.minLength) {
      return { code: "below_minimum_length", field: field.id, severity: "error" };
    }

    if (field.maxLength && value.length > field.maxLength) {
      return { code: "above_maximum_length", field: field.id, severity: "error" };
    }

    return null;
  });
}

// Product registration happens in /platform/product-registry.js by importing productConfig.
render();
