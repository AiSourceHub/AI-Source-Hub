import { useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import BusinessIdeaValidatorPage from './pages/BusinessIdeaValidatorPage.jsx';
import { productRegistry } from '../core/productRegistry.js';
import './styles.css';

function App() {
  const location = useLocation();
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = window.localStorage.getItem('ai-source-hub-language');
    return saved === 'ar' ? 'ar' : 'en';
  });

  const locale = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <div className="app-shell" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Routes>
        <Route path="/" element={<HomePage locale={locale} products={productRegistry} />} />
        <Route
          path="/products/:productId/*"
          element={<ProductPage locale={locale} products={productRegistry} />}
        />
        <Route
          path="/products/business-idea-validator"
          element={<BusinessIdeaValidatorPage locale={locale} product={productRegistry.find((item) => item.id === 'business-idea-validator')} content={{ header: { brand: 'AI Source Hub', tagline: language === 'ar' ? 'محركات قرار' : 'Decision engines', navigationLabel: language === 'ar' ? 'التنقل الرئيسي' : 'Primary navigation', nav: [{ label: language === 'ar' ? 'الرئيسية' : 'Home', href: '/' }, { label: language === 'ar' ? 'المنتجات' : 'Products', href: '/#products' }] }, breadcrumbLabel: language === 'ar' ? 'المسار' : 'Breadcrumb', homeHref: '/', homeLabel: language === 'ar' ? 'الرئيسية' : 'Home', eyebrow: language === 'ar' ? 'محرك قرار للأعمال' : 'Business decision engine', footer: { brand: 'AI Source Hub', version: language === 'ar' ? 'منصة مقيّم فكرة العمل' : 'Business Idea Validator platform' } }} />}
        />
        <Route path="*" element={<Navigate to="/" replace state={{ from: location }} />} />
      </Routes>
    </div>
  );
}

export default App;
