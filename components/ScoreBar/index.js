export const ScoreBar = {
  name: "ScoreBar",
  range: { min: 0, max: 20 },
  states: ["strong", "moderate", "weak", "critical"],
  supports: ["rtl", "darkMode", "accessibleLabel"],
};

export function renderScoreBar({ label, score = 0, max = 20, reason = "" }) {
  return `
    <div class="score-bar-row">
      <div>
        <strong>${label}</strong>
        <p>${reason}</p>
      </div>
      <progress class="score-bar" value="${score}" max="${max}">${score}/${max}</progress>
      <span>${score}/${max}</span>
    </div>
  `;
}
