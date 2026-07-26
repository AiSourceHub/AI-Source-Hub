export const ScoreCircle = {
  name: "ScoreCircle",
  range: { min: 0, max: 100 },
  states: ["strong", "moderate", "weak", "critical"],
  supports: ["rtl", "darkMode", "accessibleLabel"],
};

export function renderScoreCircle({ label, score = 0, max = 100 }) {
  return `
    <div class="score-circle" aria-label="${label}: ${score} out of ${max}">
      <span class="score-circle__label">${label}</span>
      <strong>${score}</strong>
      <span>${max}</span>
    </div>
  `;
}
