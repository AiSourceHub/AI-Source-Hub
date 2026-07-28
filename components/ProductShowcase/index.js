import { renderCard } from "../Card/index.js";

export function renderProductShowcase(content) {
  return `
    <section class="section" id="products" aria-labelledby="products-title">
      <div class="container">
        <p class="eyebrow">${content.eyebrow}</p>
        <h2 class="section-title" id="products-title">${content.title}</h2>
        <p class="section-copy">${content.copy}</p>
        <div class="grid grid--three section-grid">
          ${content.products
            .map((product) =>
              renderCard(
                `
                  <div class="product-card ${product.featured ? "product-card--featured" : ""}">
                    <div class="product-card__top">
                      <div>
                        ${product.featured ? `<span class="badge badge--featured">${product.featuredLabel || content.featuredLabel || "Featured"}</span>` : ""}
                        <h3>${product.name}</h3>
                      </div>
                      <span class="badge">${product.status}</span>
                    </div>
                    <p>${product.description}</p>
                    <div class="feature-list">
                      ${product.points
                        .map(
                          (point) => `
                            <div class="feature-item">
                              <span class="feature-icon" aria-hidden="true">✓</span>
                              <span>${point}</span>
                            </div>
                          `
                        )
                        .join("")}
                    </div>
                    ${
                      product.route && product.route !== "#"
                        ? `<a class="button button--secondary" href="${product.route.startsWith('/') ? product.route : `../../${product.route}`}">${content.openLabel || "Open"}</a>`
                        : ""
                    }
                  </div>
                `,
                product.featured ? "featured-product-card" : ""
              )
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
