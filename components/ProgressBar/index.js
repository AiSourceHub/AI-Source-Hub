export const ProgressBar = {
  name: "ProgressBar",
  variants: ["determinate", "indeterminate"],
  states: ["default", "success", "warning", "danger"],
  supports: ["rtl", "darkMode", "reducedMotion"],
};

export function renderProgressBar({ label, value = 0, max = 100 }) {
  return `
    <div class="progress-block" role="status">
      <span>${label}</span>
      <progress class="progress-bar" value="${value}" max="${max}">${value}%</progress>
    </div>
  `;
}
