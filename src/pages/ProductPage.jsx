import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { renderProductLayout } from '../../pages/ProductLayout/index.js';
import { productRegistry } from '../../core/productRegistry.js';

function ProductPage({ locale }) {
  const { language, setLanguage } = locale;
  const { productId } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const found = productRegistry.find((item) => item.id === productId);
    setProduct(found || null);
  }, [productId]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    const buttons = document.querySelectorAll('[data-language]');
    const handleClick = (event) => {
      const newLang = event.currentTarget.dataset.language;
      if (newLang && newLang !== language) {
        window.localStorage.setItem('ai-source-hub-language', newLang);
        setLanguage(newLang);
      }
    };

    buttons.forEach((button) => button.addEventListener('click', handleClick));
    return () => buttons.forEach((button) => button.removeEventListener('click', handleClick));
  }, [language, setLanguage]);

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const content = {
    header: {
      brand: 'AI Source Hub',
      tagline: language === 'ar' ? 'محركات قرار' : 'Decision engines',
      navigationLabel: language === 'ar' ? 'التنقل الرئيسي' : 'Primary navigation',
      nav: [{ label: language === 'ar' ? 'الصفحة الرئيسية' : 'Home', href: '/' }],
    },
    breadcrumbLabel: language === 'ar' ? 'المسار' : 'Breadcrumb',
    homeHref: '/',
    homeLabel: language === 'ar' ? 'الرئيسية' : 'Home',
    eyebrow: product.category === 'business' ? (language === 'ar' ? 'منتج أعمال' : 'Business product') : '',
    title: product.name[language] || product.name.en,
    description: product.shortDescription[language] || product.shortDescription.en,
    footer: {
      brand: 'AI Source Hub',
      version: 'Platform foundation v1.0',
      linksLabel: language === 'ar' ? 'روابط التذييل' : 'Footer links',
      links: [
        { label: language === 'ar' ? 'الخصوصية' : 'Privacy', href: '/privacy' },
        { label: language === 'ar' ? 'الشروط' : 'Terms', href: '/terms' },
        { label: language === 'ar' ? 'إخلاء المسؤولية' : 'Disclaimer', href: '/disclaimer' },
        { label: language === 'ar' ? 'اتصال' : 'Contact', href: '/contact' },
      ],
    },
  };

  const main = `
    <section class="product-hero" aria-labelledby="product-title">
      <p class="eyebrow">${content.eyebrow}</p>
      <h1 id="product-title">${content.title}</h1>
      <p>${content.description}</p>
      <div class="product-actions">
        ${product.route && product.route !== '#' ? `
          <a class="button button--primary" href="/${product.route.replace(/^\//, '')}">${language === 'ar' ? 'افتح المنتج' : 'Open product'}</a>
        ` : `
          <button class="button button--primary" type="button" disabled>${language === 'ar' ? 'قادم قريباً' : 'Coming soon'}</button>
        `}
      </div>
    </section>
  `;

  return (
    <div dangerouslySetInnerHTML={{ __html: renderProductLayout({ content, language, main }) }} />
  );
}

export default ProductPage;
