export const LanguageSwitcher = {
  name: "LanguageSwitcher",
  languages: ["en", "ar"],
  variants: ["segmented", "select"],
  supports: ["rtl", "keyboardFocus", "accessibleLabel"],
};

export function renderLanguageSwitcher(language, content = {}) {
  const label = content.label || (language === "ar" ? "اللغة" : "Language");
  const englishLabel = content.english || "EN";
  const arabicLabel = content.arabic || "AR";

  return `
    <div class="language-switcher" role="group" aria-label="${label}">
      <button class="language-switcher__button" type="button" data-language="en" aria-pressed="${language === "en"}">${englishLabel}</button>
      <button class="language-switcher__button" type="button" data-language="ar" aria-pressed="${language === "ar"}">${arabicLabel}</button>
    </div>
  `;
}
