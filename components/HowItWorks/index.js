import { renderCard } from "../Card/index.js";

export function renderHowItWorks(content) {
  return `
    <section class="section" id="how" aria-labelledby="how-title">
      <div class="container">
        <p class="eyebrow">${content.eyebrow}</p>
        <h2 class="section-title" id="how-title">${content.title}</h2>
        <div class="grid grid--three section-grid">
          ${content.steps
            .map((step, index) =>
              renderCard(`
                <span class="step-number">${index + 1}</span>
                <h3>${step.title}</h3>
                <p>${step.copy}</p>
              `)
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
