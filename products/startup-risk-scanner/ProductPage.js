import { renderInput } from "../../components/Input/index.js";
import { renderLanguageSwitcher } from "../../components/LanguageSwitcher/index.js";
import { renderProgressBar } from "../../components/ProgressBar/index.js";
import { renderAlertBox } from "../../components/AlertBox/index.js";
import { renderResultCard } from "../../components/ResultCard/index.js";
import { inputSchema } from "./questions.js";

export function renderStartupRiskProductPage({ content, language, state, resultHtml = null }) {
  const progress = calculateProgress(state.input);

  return `
    <div class="product-workspace">
      <section class="card" aria-labelledby="startup-risk-form-title">
        <div class="card__body">
          ${renderLanguageSwitcher(language)}
          <h2 id="startup-risk-form-title">${content.formTitle}</h2>
          <p id="startup-risk-form-description">${content.formDescription}</p>
          <p><strong>${content.promise}</strong></p>
          ${renderProgressBar({ label: content.progressLabel, value: progress })}
          <form class="product-form" id="startup-risk-form" aria-describedby="startup-risk-form-description" novalidate>
            ${inputSchema.map((field) => renderField(field, language, state.input[field.id] || "")).join("")}
            <button class="button button--primary" type="submit">${content.buttonLabel}</button>
          </form>
        </div>
      </section>
      <div class="grid">
        ${renderAlertBox({ message: state.statusMessage || content.states[state.status] || content.states.idle, variant: state.alertVariant || "info" })}
        <div id="processing-region" hidden>
          ${renderProgressBar({ label: content.processing, value: 70 })}
        </div>
        ${renderResultCard(resultHtml || `<p>${content.emptyState}</p>`, { hidden: !resultHtml })}
      </div>
    </div>
  `;
}

function renderField(field, language, value) {
  const fieldContent = {
    label: field.label[language],
    placeholder: field.placeholder?.[language],
    helpText: field.helpText?.[language],
  };

  if (field.type === "select") {
    return renderSelect(field, fieldContent, language, value);
  }

  if (field.type === "radio") {
    return renderRadioGroup(field, fieldContent, language, value);
  }

  return renderInput(field, fieldContent, value);
}

function renderSelect(field, content, language, value) {
  const helpId = `${field.id}-help`;
  const errorId = `${field.id}-error`;

  return `
    <label class="field" for="${field.id}">
      <span class="field__label">${content.label}</span>
      <select
        class="field__control"
        id="${field.id}"
        name="${field.id}"
        ${field.required ? "required" : ""}
        aria-describedby="${helpId} ${errorId}"
        dir="${field.direction || "auto"}"
      >
        <option value="">${content.placeholder || ""}</option>
        ${field.options
          .map((option) => `<option value="${option.value}" ${value === option.value ? "selected" : ""}>${option.label[language]}</option>`)
          .join("")}
      </select>
      <span class="field__help" id="${helpId}">${content.helpText || ""}</span>
      <span class="field__error" id="${errorId}" data-error-for="${field.id}"></span>
    </label>
  `;
}

function renderRadioGroup(field, content, language, value) {
  const helpId = `${field.id}-help`;
  const errorId = `${field.id}-error`;

  return `
    <fieldset class="field" aria-describedby="${helpId} ${errorId}">
      <legend class="field__label">${content.label}</legend>
      <div class="grid">
        ${field.options
          .map(
            (option) => `
              <label class="feature-item">
                <input type="radio" name="${field.id}" value="${option.value}" ${value === option.value ? "checked" : ""} ${field.required ? "required" : ""} />
                <span>${option.label[language]}</span>
              </label>
            `
          )
          .join("")}
      </div>
      <span class="field__help" id="${helpId}">${content.helpText || ""}</span>
      <span class="field__error" id="${errorId}" data-error-for="${field.id}"></span>
    </fieldset>
  `;
}

function calculateProgress(input = {}) {
  const completed = inputSchema.filter((field) => input[field.id] !== undefined && input[field.id] !== "").length;
  return Math.round((completed / inputSchema.length) * 100);
}

export default renderStartupRiskProductPage;
