export const Input = {
  name: "Input",
  type: "single-line",
  states: ["default", "focus", "invalid", "disabled"],
  supports: ["rtl", "darkMode", "validation"],
};

export function renderInput(field, content, value = "") {
  const helpId = `${field.id}-help`;
  const errorId = `${field.id}-error`;
  const minimum = field.minimum ?? field.min;
  const maximum = field.maximum ?? field.max;

  return `
    <label class="field" for="${field.id}">
      <span class="field__label">${content.label}</span>
      <input
        class="field__control"
        id="${field.id}"
        name="${field.id}"
        type="${field.type || "text"}"
        value="${value}"
        placeholder="${content.placeholder || ""}"
        ${field.required ? "required" : ""}
        ${field.minLength ? `minlength="${field.minLength}"` : ""}
        ${field.maxLength ? `maxlength="${field.maxLength}"` : ""}
        ${minimum !== undefined ? `min="${minimum}"` : ""}
        ${maximum !== undefined ? `max="${maximum}"` : ""}
        ${field.step ? `step="${field.step}"` : ""}
        ${field.type === "number" ? "inputmode=\"numeric\"" : ""}
        aria-describedby="${helpId} ${errorId}"
        dir="${field.direction || "auto"}"
      />
      <span class="field__help" id="${helpId}">${content.helpText || ""}</span>
      <span class="field__error" id="${errorId}" data-error-for="${field.id}"></span>
    </label>
  `;
}
