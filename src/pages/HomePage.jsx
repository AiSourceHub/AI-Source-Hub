import { useEffect, useMemo, useState } from 'react';
import { renderHeader } from '../../components/Header/index.js';
import { renderFooter } from '../../components/Footer/index.js';
import { renderHeroSection } from '../../components/HeroSection/index.js';
import { renderProductShowcase } from '../../components/ProductShowcase/index.js';
import { renderWhyAISection } from '../../components/WhyAISection/index.js';
import { renderHowItWorks } from '../../components/HowItWorks/index.js';
import { renderFeaturesSection } from '../../components/FeaturesSection/index.js';
import { renderTestimonials } from '../../components/Testimonials/index.js';
import { renderFAQSection } from '../../components/FAQSection/index.js';
import { content } from '../../pages/Home/content.js';
import { PRODUCT_STATUS_LABELS } from '../../core/constants/productStatus.js';
import {
  applyDocumentLocale,
  bindLanguageSwitcher,
  getProductCardCopy,
} from '../../core/localization.js';

function HomePage({ locale, products }) {
  const { language, setLanguage } = locale;
  const [selectedProductId, setSelectedProductId] = useState('business-idea-validator');

  useEffect(() => {
    applyDocumentLocale(language);
  }, [language]);

  useEffect(() => {
    return bindLanguageSwitcher({ language, setLanguage });
  }, [language, setLanguage]);

  useEffect(() => {
    const handleSectionLinkClick = (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#/')) return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    document.addEventListener('click', handleSectionLinkClick);

    return () => {
      document.removeEventListener('click', handleSectionLinkClick);
    };
  }, []);

  useEffect(() => {
    const getProductSection = () => document.querySelector('#products');
    const getTabs = () => Array.from(getProductSection()?.querySelectorAll('[data-product-id]') || []);
    const focusTab = (index) => {
      const productSection = getProductSection();
      if (!productSection) return;

      const tabs = getTabs();
      const nextTab = tabs[index];
      if (!nextTab) return;
      const nextProductId = nextTab.getAttribute('data-product-id');
      setSelectedProductId(nextProductId);
      window.requestAnimationFrame(() => {
        getProductSection()?.querySelector(`[data-product-id="${nextProductId}"]`)?.focus();
      });
    };

    const handleClick = (event) => {
      const tab = event.target.closest('[data-product-id]');
      const productSection = tab?.closest('#products');
      if (!tab || !productSection || !productSection.contains(tab)) return;
      setSelectedProductId(tab.getAttribute('data-product-id'));
    };

    const handleKeyDown = (event) => {
      const tab = event.target.closest('[data-product-id]');
      const productSection = tab?.closest('#products');
      if (!tab || !productSection || !productSection.contains(tab)) return;

      const tabs = getTabs();
      const currentIndex = tabs.indexOf(tab);
      if (currentIndex < 0) return;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        focusTab((currentIndex + 1) % tabs.length);
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        focusTab((currentIndex - 1 + tabs.length) % tabs.length);
      }

      if (event.key === 'Home') {
        event.preventDefault();
        focusTab(0);
      }

      if (event.key === 'End') {
        event.preventDefault();
        focusTab(tabs.length - 1);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const page = content[language];

  const productsContent = useMemo(() => {
    const rankedProducts = [...products].sort((first, second) => {
      if (first.id === 'business-idea-validator') return -1;
      if (second.id === 'business-idea-validator') return 1;
      return 0;
    });

    const cards = rankedProducts.map((product) => ({
      ...getProductCardCopy(product, language),
      id: product.id,
      name: product.name[language] || product.name.en,
      status: PRODUCT_STATUS_LABELS[product.status]?.[language] || product.status,
      description: product.shortDescription[language] || product.shortDescription.en,
      route: product.route && product.route !== '#' ? `#/products/${product.id}` : undefined,
      featured: product.id === 'business-idea-validator',
    }));

    return {
      ...page.products,
      products: cards,
      selectedProductId,
    };
  }, [language, page.products, products, selectedProductId]);

  const headerHtml = renderHeader(page.header, language);
  const heroHtml = renderHeroSection(page.hero);
  const aboutHtml = `
    <section class="section" aria-labelledby="about-title">
      <div class="container">
        <div class="card">
          <div class="card__body">
            <p class="eyebrow">${page.about.eyebrow}</p>
            <h2 id="about-title" class="section-title">${page.about.title}</h2>
            <p class="section-copy">
              ${page.about.copy}
            </p>
            <div class="grid grid--two section-grid">
              ${page.about.cards
                .map((item) => `
                  <article class="card__body">
                    <p class="about-card__text">${item}</p>
                  </article>
                `)
                .join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  const featuredProductHtml = `
    <section class="section section--compact" aria-labelledby="featured-product-title">
      <div class="container">
        <div class="card product-card product-card--featured">
          <div class="product-card__top">
            <div>
              <p class="eyebrow">${page.featuredBusinessIdea.eyebrow}</p>
              <h2 id="featured-product-title" class="section-title">${page.featuredBusinessIdea.title}</h2>
            </div>
            <span class="badge badge--featured">${page.featuredBusinessIdea.badge}</span>
          </div>
          <p class="section-copy">
            ${page.featuredBusinessIdea.copy[0]}
          </p>
          <p class="section-copy">
            ${page.featuredBusinessIdea.copy[1]}
          </p>
          <div class="product-actions">
            <a href="#/products/business-idea-validator" class="button button--primary">${page.featuredBusinessIdea.action}</a>
          </div>
        </div>
      </div>
    </section>
  `;
  const showcaseHtml = renderProductShowcase(productsContent);
  const whyHtml = renderWhyAISection(page.why);
  const howHtml = renderHowItWorks(page.how);
  const featuresHtml = renderFeaturesSection(page.features);
  const testimonialsHtml = renderTestimonials(page.testimonials);
  const faqHtml = renderFAQSection(page.faq);
  const footerHtml = renderFooter(page.footer);

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />
      <main>
        <div dangerouslySetInnerHTML={{ __html: heroHtml }} />
        <div dangerouslySetInnerHTML={{ __html: aboutHtml }} />
        <div dangerouslySetInnerHTML={{ __html: featuredProductHtml }} />
        <div dangerouslySetInnerHTML={{ __html: showcaseHtml }} />
        <div dangerouslySetInnerHTML={{ __html: whyHtml }} />
        <div dangerouslySetInnerHTML={{ __html: howHtml }} />
        <div dangerouslySetInnerHTML={{ __html: featuresHtml }} />
        <div dangerouslySetInnerHTML={{ __html: testimonialsHtml }} />
        <div dangerouslySetInnerHTML={{ __html: faqHtml }} />
      </main>
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
}

export default HomePage;
