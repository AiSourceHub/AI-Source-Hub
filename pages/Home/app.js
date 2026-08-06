import { renderHeader } from "../../components/Header/index.js";
import { renderFooter } from "../../components/Footer/index.js";
import { renderHeroSection } from "../../components/HeroSection/index.js";
import { renderProductShowcase } from "../../components/ProductShowcase/index.js";
import { renderWhyAISection } from "../../components/WhyAISection/index.js";
import { renderHowItWorks } from "../../components/HowItWorks/index.js";
import { renderFeaturesSection } from "../../components/FeaturesSection/index.js";
import { renderTestimonials } from "../../components/Testimonials/index.js";
import { renderFAQSection } from "../../components/FAQSection/index.js";
import { content } from "./content.js";
import { getLocalizedProductCards } from "../../core/productRegistry.js";
import {
  applyDocumentLocale,
  bindLanguageSwitcher,
  getInitialLanguage,
} from "../../core/localization.js";

const app = document.querySelector("#app");
let activeLanguage = getInitialLanguage();

function renderHome(language) {
  const page = content[language];
  const productsContent = {
    ...page.products,
    products: getLocalizedProductCards(language),
  };

  applyDocumentLocale(language);
  document.title = page.meta.title;
  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", page.meta.description);

  app.innerHTML = `
    ${renderHeader(page.header, language)}
    <main>
      ${renderHeroSection(page.hero)}
      ${renderProductShowcase(productsContent)}
      ${renderWhyAISection(page.why)}
      ${renderHowItWorks(page.how)}
      ${renderFeaturesSection(page.features)}
      ${renderTestimonials(page.testimonials)}
      ${renderFAQSection(page.faq)}
    </main>
    ${renderFooter(page.footer)}
  `;

  bindLanguageSwitcher({
    language,
    setLanguage: (nextLanguage) => {
      activeLanguage = nextLanguage;
      renderHome(activeLanguage);
    },
  });
}

renderHome(activeLanguage);
