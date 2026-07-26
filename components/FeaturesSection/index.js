import { renderCard } from "../Card/index.js";

export function renderFeaturesSection(content) {
  return `
    <section class="section section--compact" id="features" aria-labelledby="features-title">
      <div class="container">
        <p class="eyebrow">${content.eyebrow}</p>
        <h2 class="section-title" id="features-title">${content.title}</h2>
        <div class="grid grid--two section-grid">
          ${content.features
            .map((feature) =>
              renderCard(`
                <div class="feature-item">
                  <span class="feature-icon" aria-hidden="true">${feature.icon}</span>
                  <div>
                    <h3>${feature.title}</h3>
                    <p>${feature.copy}</p>
                  </div>
                </div>
              `)
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
