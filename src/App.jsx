import { Suspense, lazy, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import BusinessIdeaValidatorRoute from './pages/BusinessIdeaValidatorRoute.jsx';
import StartupRiskScannerPage from './pages/StartupRiskScannerPage.jsx';
import { productRegistry } from '../core/productRegistry.js';
import { getInitialLanguage } from '../core/localization.js';
import './styles.css';

const INTENT_DISCOVERY_ROUTE = ['/dev', 'biv-guided-discovery'].join('/');
const enableDevelopmentRoutes = import.meta.env.DEV;
const enableGuidedDiscoveryCandidate = import.meta.env.VITE_BIV_GUIDED_DISCOVERY_CANDIDATE === 'true';
const BusinessIdeaDiscoveryCandidatePage = enableDevelopmentRoutes || enableGuidedDiscoveryCandidate
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
          element={(
            <BusinessIdeaValidatorRoute
              locale={locale}
              CandidatePage={BusinessIdeaDiscoveryCandidatePage}
              candidateEnabled={enableGuidedDiscoveryCandidate}
            />
          )}
        />
        {enableDevelopmentRoutes && BusinessIdeaDiscoveryCandidatePage ? (
          <Route
            path={INTENT_DISCOVERY_ROUTE}
            element={(
              <Suspense fallback={null}>
                <BusinessIdeaDiscoveryCandidatePage locale={locale} />
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
