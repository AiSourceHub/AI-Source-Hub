import { Suspense } from 'react';
import { productRegistry } from '../../core/productRegistry.js';
import { getBusinessValidatorShellContent } from '../../core/localization.js';
import BusinessIdeaValidatorPage from './BusinessIdeaValidatorPage.jsx';

function BusinessIdeaValidatorRoute({ locale, CandidatePage = null, candidateEnabled = false }) {
  const product = productRegistry.find((item) => item.id === 'business-idea-validator');
  const content = getBusinessValidatorShellContent(locale.language);

  if (candidateEnabled && CandidatePage) {
    return (
      <Suspense fallback={null}>
        <CandidatePage locale={locale} allowUrlSemanticControls={false} />
      </Suspense>
    );
  }

  return <BusinessIdeaValidatorPage locale={locale} product={product} content={content} />;
}

export default BusinessIdeaValidatorRoute;
