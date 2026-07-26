export function renderFAQSection(content) {
  return `
    <section class="section section--compact" id="faq" aria-labelledby="faq-title">
      <div class="container">
        <p class="eyebrow">${content.eyebrow}</p>
        <h2 class="section-title" id="faq-title">${content.title}</h2>
        <div class="faq-list section-grid">
          ${content.items
            .map(
              (item) => `
                <details class="faq-item">
                  <summary>${item.question}</summary>
                  <p>${item.answer}</p>
                </details>
              `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
