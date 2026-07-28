import { useEffect, useMemo } from 'react';
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

function HomePage({ locale, products }) {
  const { language } = locale;

  useEffect(() => {
    document.documentElement.lang = language;
    document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem('ai-source-hub-language', language);
  }, [language]);

  useEffect(() => {
    const buttons = document.querySelectorAll('[data-language]');
    const handleClick = (event) => {
      const newLang = event.target.dataset.language;
      if (newLang && newLang !== language) {
        window.localStorage.setItem('ai-source-hub-language', newLang);
        window.location.reload();
      }
    };

    buttons.forEach((button) => button.addEventListener('click', handleClick));
    return () => buttons.forEach((button) => button.removeEventListener('click', handleClick));
  }, [language]);

  const page = content[language];

  const productsContent = useMemo(() => {
    const rankedProducts = [...products].sort((first, second) => {
      if (first.id === 'business-idea-validator') return -1;
      if (second.id === 'business-idea-validator') return 1;
      return 0;
    });

    const cards = rankedProducts.map((product) => ({
      id: product.id,
      name: product.name[language] || product.name.en,
      status: PRODUCT_STATUS_LABELS[product.status]?.[language] || product.status,
      description: product.shortDescription[language] || product.shortDescription.en,
      points:
        language === 'ar'
          ? ['مبني على المنصة المشتركة', 'ثنائي اللغة', 'تقرير موحّد']
          : ['Built on the shared platform', 'Bilingual', 'Standard report'],
      route: product.route && product.route !== '#' ? `/products/${product.id}` : undefined,
      featured: product.id === 'business-idea-validator',
      featuredLabel: language === 'ar' ? 'منتج مميز' : 'Featured product',
    }));

    return {
      ...page.products,
      products: cards,
    };
  }, [language, page.products, products]);

  const headerHtml = renderHeader(page.header, language);
  const heroHtml = renderHeroSection(page.hero);
  const aboutHtml = `
    <section class="section" aria-labelledby="about-title">
      <div class="container">
        <div class="card">
          <div class="card__body">
            <p class="eyebrow">${language === 'ar' ? 'عن AI Source Hub' : 'About AI Source Hub'}</p>
            <h2 id="about-title" class="section-title">${language === 'ar' ? 'ما هو مركز مصادر الذكاء الاصطناعي؟' : 'What is AI Source Hub?'}</h2>
            <p class="section-copy">
              ${language === 'ar'
                ? 'مركز مصادر الذكاء الاصطناعي (AI Source Hub) منصة تقدم أدوات عملية مدعومة بالذكاء الاصطناعي، تساعد الأفراد ورواد الأعمال وأصحاب المشاريع على تحليل الأفكار، وفهم الفرص والمخاطر، واتخاذ قرارات أفضل.'
                : 'AI Source Hub provides practical AI-powered tools that help individuals, entrepreneurs, and business owners analyze ideas, understand opportunities and risks, and make better decisions.'}
            </p>
            <div class="grid grid--two section-grid">
              <article class="card__body">
                <p class="about-card__text">${language === 'ar' ? 'تحليل واضح' : 'Clear Analysis'}</p>
              </article>
              <article class="card__body">
                <p class="about-card__text">${language === 'ar' ? 'فهم الفرص والمخاطر' : 'Opportunity and Risk Insights'}</p>
              </article>
              <article class="card__body">
                <p class="about-card__text">${language === 'ar' ? 'توصيات عملية' : 'Practical Recommendations'}</p>
              </article>
              <article class="card__body">
                <p class="about-card__text">${language === 'ar' ? 'قرارات أفضل' : 'Better Decisions'}</p>
              </article>
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
              <p class="eyebrow">${language === 'ar' ? 'منتج مميز' : 'Featured Product'}</p>
              <h2 id="featured-product-title" class="section-title">${language === 'ar' ? 'Business Idea Validator' : 'Business Idea Validator'}</h2>
            </div>
            <span class="badge badge--featured">${language === 'ar' ? 'مُتاح' : 'Available'}</span>
          </div>
          <p class="section-copy">
            ${language === 'ar'
              ? 'تحقق من فكرة عملك قبل استثمار الوقت أو المال.'
              : 'Validate your business idea before investing time or money.'}
          </p>
          <p class="section-copy">
            ${language === 'ar'
              ? 'افهم النقاط القوية والضعف والفرص والمخاطر، واحصل على توصيات عملية.'
              : 'Understand strengths, weaknesses, opportunities, risks, and receive practical recommendations.'}
          </p>
          <div class="product-actions">
            <a href="/products/business-idea-validator" class="button button--primary">${language === 'ar' ? 'ابدأ التحقق' : 'Start Validation'}</a>
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
