export const Button = {
  name: "Button",
  variants: ["primary", "secondary", "ghost", "icon"],
  sizes: ["sm", "md", "lg"],
  minTouchHeight: "44px",
  supports: ["rtl", "darkMode", "keyboardFocus"],
};

export function renderButton({ label, href = "#", variant = "primary" }) {
  return `<a class="button button--${variant}" href="${href}">${label}</a>`;
}
