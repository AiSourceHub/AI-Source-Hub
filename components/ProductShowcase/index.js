import { renderCard } from "../Card/index.js";

export function renderProductShowcase(content) {
  const products = content.products || [];
  const selectedProduct = products.find((product) => product.id === content.selectedProductId) || products[0];
  const selectedIndex = Math.max(0, products.findIndex((product) => product.id === selectedProduct?.id));

  return `
    <section class="section" id="products" aria-labelledby="products-title">
      <div class="container">
        <p class="eyebrow">${content.eyebrow}</p>
        <h2 class="section-title" id="products-title">${content.title}</h2>
        <p class="section-copy">${content.copy}</p>
        <div class="product-selector" role="tablist" aria-label="${content.selectorLabel || content.title}">
          ${products
            .map((product) =>
              `
                <button
                  class="product-selector__tab ${product.id === selectedProduct?.id ? "is-active" : ""}"
                  type="button"
                  role="tab"
                  id="product-tab-${product.id}"
                  aria-selected="${product.id === selectedProduct?.id ? "true" : "false"}"
                  aria-controls="product-preview-panel"
                  tabindex="${product.id === selectedProduct?.id ? "0" : "-1"}"
                  data-product-id="${product.id}"
                >
                  ${product.name}
                </button>
              `
            )
            .join("")}
        </div>
        ${
          selectedProduct
            ? renderCard(
                `
                  <div
                    class="product-card product-preview ${selectedProduct.featured ? "product-card--featured" : ""}"
                    role="tabpanel"
                    id="product-preview-panel"
                    aria-labelledby="product-tab-${selectedProduct.id}"
                    data-selected-index="${selectedIndex}"
                  >
                    <div class="product-card__top">
                      <div>
                        ${selectedProduct.featured ? `<span class="badge badge--featured">${selectedProduct.featuredLabel || content.featuredLabel || "Featured"}</span>` : ""}
                        <h3>${selectedProduct.name}</h3>
                      </div>
                      <span class="badge">${selectedProduct.status}</span>
                    </div>
                    <p>${selectedProduct.description}</p>
                    <div class="feature-list">
                      ${(selectedProduct.points || [])
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
                    <div class="product-actions">
                      ${
                        selectedProduct.route && selectedProduct.route !== "#"
                          ? `<a class="button button--secondary" href="${selectedProduct.route.startsWith("#") || selectedProduct.route.startsWith("/") ? selectedProduct.route : `../../${selectedProduct.route}`}">${content.openToolLabel || content.openLabel || "Open"}</a>`
                          : `<span class="badge">${content.unavailableLabel || selectedProduct.status}</span>`
                      }
                    </div>
                  </div>
                `,
                selectedProduct.featured ? "featured-product-card" : ""
              )
            : ""
        }
      </div>
    </section>
  `;
}
