import { renderCard } from "../Card/index.js";

export function renderTestimonials(content) {
  return `
    <section class="section" id="testimonials" aria-labelledby="testimonials-title">
      <div class="container">
        <p class="eyebrow">${content.eyebrow}</p>
        <h2 class="section-title" id="testimonials-title">${content.title}</h2>
        <div class="grid grid--three section-grid">
          ${content.items
            .map((item) =>
              renderCard(`
                <p class="testimonial">${item.quote}</p>
                <strong>${item.name}</strong>
              `)
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
