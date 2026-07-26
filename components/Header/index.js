export const Header = {
  name: "Header",
  element: "header",
  slots: ["brand", "productName", "actions"],
  supports: ["rtl", "darkMode", "responsive"],
};

import { renderLanguageSwitcher } from "../LanguageSwitcher/index.js";

export function renderHeader(content, language) {
  const navItems = content.nav
    .map((item) => `<a href="${item.href}">${item.label}</a>`)
    .join("");

  return `
    <header class="site-header">
      <div class="container site-header__inner">
        <a class="brand-lockup" href="#top" aria-label="${content.brand}">
          <span class="brand-mark" aria-hidden="true">AI</span>
          <span class="brand-text">
            <strong>${content.brand}</strong>
            <span>${content.tagline}</span>
          </span>
        </a>
        <nav class="site-nav" aria-label="${content.navigationLabel}">
          ${navItems}
        </nav>
        <div class="header-actions">
          ${renderLanguageSwitcher(language)}
        </div>
      </div>
    </header>
  `;
}
