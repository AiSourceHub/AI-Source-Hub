import { useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import BusinessIdeaValidatorPage from './pages/BusinessIdeaValidatorPage.jsx';
import { productRegistry } from '../core/productRegistry.js';
import { getBusinessValidatorShellContent, getInitialLanguage } from '../core/localization.js';
import './styles.css';

function App() {
  const location = useLocation();
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return getInitialLanguage(window.localStorage);
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
          element={<BusinessIdeaValidatorPage locale={locale} product={productRegistry.find((item) => item.id === 'business-idea-validator')} content={getBusinessValidatorShellContent(language)} />}
        />
        <Route path="*" element={<Navigate to="/" replace state={{ from: location }} />} />
      </Routes>
    </div>
  );
}

export default App;
