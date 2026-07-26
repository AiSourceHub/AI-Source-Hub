import { renderCard } from "../Card/index.js";

export function renderWhyAISection(content) {
  return `
    <section class="section section--compact" id="why" aria-labelledby="why-title">
      <div class="container">
        <p class="eyebrow">${content.eyebrow}</p>
        <h2 class="section-title" id="why-title">${content.title}</h2>
        <div class="grid grid--three section-grid">
          ${content.reasons
            .map((reason) =>
              renderCard(`
                <h3>${reason.title}</h3>
                <p>${reason.copy}</p>
              `)
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
