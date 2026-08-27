import { Suspense, lazy, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import BusinessIdeaValidatorPage from './pages/BusinessIdeaValidatorPage.jsx';
import StartupRiskScannerPage from './pages/StartupRiskScannerPage.jsx';
import { productRegistry } from '../core/productRegistry.js';
import { getBusinessValidatorShellContent, getInitialLanguage } from '../core/localization.js';
import './styles.css';

const INTENT_DISCOVERY_ROUTE = ['/dev', 'biv-guided-discovery'].join('/');
const enableDevelopmentRoutes = import.meta.env.DEV;
const BusinessIdeaDiscoveryPrototypePage = enableDevelopmentRoutes
  ? lazy(() => import('./pages/BusinessIdeaDiscoveryPrototypePage.jsx'))
  : null;

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
          path="/products/business-idea-validator"
          element={<BusinessIdeaValidatorPage locale={locale} product={productRegistry.find((item) => item.id === 'business-idea-validator')} content={getBusinessValidatorShellContent(language)} />}
        />
        {enableDevelopmentRoutes && BusinessIdeaDiscoveryPrototypePage ? (
          <Route
            path={INTENT_DISCOVERY_ROUTE}
            element={(
              <Suspense fallback={null}>
                <BusinessIdeaDiscoveryPrototypePage locale={locale} />
              </Suspense>
            )}
          />
        ) : null}
        <Route
          path="/products/startup-risk-scanner"
          element={<StartupRiskScannerPage locale={locale} />}
        />
        <Route
          path="/products/:productId/*"
          element={<ProductPage locale={locale} products={productRegistry} />}
        />
        <Route path="*" element={<Navigate to="/" replace state={{ from: location }} />} />
      </Routes>
    </div>
  );
}

export default App;
