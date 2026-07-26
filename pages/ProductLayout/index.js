export const ProductLayout = {
  name: "ProductLayout",
  purpose: "Reusable shell for focused AI decision-engine products.",
  sections: ["Header", "ProductIntro", "ToolSurface", "ResultArea", "Footer"],
  supports: ["rtl", "darkMode", "responsive", "accessibleLandmarks"],
};

import { renderHeader } from "../../components/Header/index.js";
import { renderFooter } from "../../components/Footer/index.js";

export function renderProductLayout({ content, language, main }) {
  return `
    ${renderHeader(content.header, language)}
    <main class="product-page">
      <div class="container">
        <nav class="breadcrumb" aria-label="${content.breadcrumbLabel}">
          <a href="${content.homeHref || "../../pages/Home/index.html"}">${content.homeLabel}</a>
          <span aria-hidden="true">/</span>
          <span>${content.title}</span>
        </nav>
        <section class="product-hero" aria-labelledby="product-title">
          <p class="eyebrow">${content.eyebrow}</p>
          <h1 id="product-title">${content.title}</h1>
          <p>${content.description}</p>
        </section>
        ${main}
      </div>
    </main>
    ${renderFooter(content.footer)}
  `;
}
