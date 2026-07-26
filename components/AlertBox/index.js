export const AlertBox = {
  name: "AlertBox",
  variants: ["info", "success", "warning", "error"],
  supports: ["rtl", "darkMode", "liveRegion"],
};

export function renderAlertBox({ message = "", variant = "info", hidden = false }) {
  return `
    <div class="alert-box alert-box--${variant}" role="status" ${hidden ? "hidden" : ""}>
      ${message}
    </div>
  `;
}
