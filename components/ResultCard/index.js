export const ResultCard = {
  name: "ResultCard",
  slots: ["verdict", "score", "breakdown", "risk", "action", "summary"],
  supports: ["rtl", "darkMode", "liveRegion", "responsive"],
};

export function renderResultCard(content = "", options = {}) {
  const hidden = options.hidden ?? true;

  return `
    <section class="result-card" aria-live="polite" ${hidden ? "hidden" : ""}>
      ${content}
    </section>
  `;
}
