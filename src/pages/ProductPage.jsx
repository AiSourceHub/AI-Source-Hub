import { useEffect, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { renderProductLayout } from '../../pages/ProductLayout/index.js';
import { productRegistry } from '../../core/productRegistry.js';
import {
  applyDocumentLocale,
  bindLanguageSwitcher,
  getProductLayoutContent,
} from '../../core/localization.js';

function ProductPage({ locale }) {
  const { language, setLanguage } = locale;
  const { productId } = useParams();
  const product = useMemo(() => productRegistry.find((item) => item.id === productId), [productId]);

  useEffect(() => {
    applyDocumentLocale(language);
  }, [language]);

  useEffect(() => {
    return bindLanguageSwitcher({ language, setLanguage });
  }, [language, setLanguage]);

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const content = getProductLayoutContent({ language, product });

  const main = `
    <section class="product-hero" aria-labelledby="product-title">
      <p class="eyebrow">${content.eyebrow}</p>
      <h1 id="product-title">${content.title}</h1>
      <p>${content.description}</p>
      <div class="product-actions">
        ${product.route && product.route !== '#' ? `
          <a class="button button--primary" href="#/products/${product.id}">${content.actions.openProduct}</a>
        ` : `
          <button class="button button--primary" type="button" disabled>${content.actions.comingSoon}</button>
        `}
      </div>
    </section>
  `;

  return (
    <div dangerouslySetInnerHTML={{ __html: renderProductLayout({ content, language, main }) }} />
  );
}

export default ProductPage;
