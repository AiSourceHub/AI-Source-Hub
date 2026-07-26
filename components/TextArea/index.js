export const TextArea = {
  name: "TextArea",
  type: "multi-line",
  states: ["default", "focus", "invalid", "disabled"],
  supports: ["rtl", "darkMode", "validation", "resize"],
};

export function renderTextArea(field, content, value = "") {
  return `
    <label class="field" for="${field.id}">
      <span class="field__label">${content.label}</span>
      <textarea
        class="field__control field__control--textarea"
        id="${field.id}"
        name="${field.id}"
        placeholder="${content.placeholder || ""}"
        ${field.required ? "required" : ""}
        ${field.minLength ? `minlength="${field.minLength}"` : ""}
        ${field.maxLength ? `maxlength="${field.maxLength}"` : ""}
        dir="${field.direction || "auto"}"
      >${value}</textarea>
      <span class="field__help">${content.helpText || ""}</span>
      <span class="field__error" data-error-for="${field.id}"></span>
    </label>
  `;
}
