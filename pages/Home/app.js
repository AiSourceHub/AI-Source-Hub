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

const app = document.querySelector("#app");
const savedLanguage = localStorage.getItem("ai-source-hub-language");
let activeLanguage = savedLanguage === "ar" ? "ar" : "en";

function renderHome(language) {
  const page = content[language];
  const productsContent = {
    ...page.products,
    products: getLocalizedProductCards(language),
  };

  document.documentElement.lang = language;
  document.body.dir = language === "ar" ? "rtl" : "ltr";
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

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => {
      activeLanguage = button.dataset.language;
      localStorage.setItem("ai-source-hub-language", activeLanguage);
      renderHome(activeLanguage);
    });
  });
}

renderHome(activeLanguage);
