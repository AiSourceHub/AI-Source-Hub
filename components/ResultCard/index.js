export const ResultCard = {
  name: "ResultCard",
  slots: ["verdict", "score", "breakdown", "risk", "action", "summary"],
  supports: ["rtl", "darkMode", "liveRegion", "responsive"],
};

export function renderResultCard(content = "") {
  return `
    <section class="result-card" aria-live="polite" hidden>
      ${content}
    </section>
  `;
}
