export const LanguageSwitcher = {
  name: "LanguageSwitcher",
  languages: ["en", "ar"],
  variants: ["segmented", "select"],
  supports: ["rtl", "keyboardFocus", "accessibleLabel"],
};

export function renderLanguageSwitcher(language) {
  return `
    <div class="language-switcher" role="group" aria-label="${language === "ar" ? "اللغة" : "Language"}">
      <button class="language-switcher__button" type="button" data-language="en" aria-pressed="${language === "en"}">EN</button>
      <button class="language-switcher__button" type="button" data-language="ar" aria-pressed="${language === "ar"}">AR</button>
    </div>
  `;
}
