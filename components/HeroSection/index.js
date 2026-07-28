import { renderButton } from "../Button/index.js";

export function renderHeroSection(content) {
  return `
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="container hero__grid">
        <div>
          <p class="eyebrow">${content.eyebrow}</p>
          <h1 id="hero-title">${content.title}</h1>
          <p class="hero__copy">${content.copy}</p>
          <div class="hero__actions">
            ${renderButton({ label: content.primaryAction, href: content.primaryHref || "#products" })}
            ${renderButton({ label: content.secondaryAction, href: content.secondaryHref || "#how", variant: "secondary" })}
          </div>
        </div>
        <aside class="hero-panel" aria-label="${content.panelLabel}">
          ${content.panelRows
            .map(
              (row) => `
                <div class="hero-panel__row">
                  <strong>${row.label}</strong>
                  <progress class="hero-panel__meter" value="${row.value}" max="100">${row.value}%</progress>
                </div>
              `
            )
            .join("")}
          <div class="stat-strip">
            ${content.stats
              .map(
                (stat) => `
                  <div class="stat">
                    <strong>${stat.value}</strong>
                    <span>${stat.label}</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </aside>
      </div>
    </section>
  `;
}
