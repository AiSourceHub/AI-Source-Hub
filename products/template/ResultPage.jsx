export function ResultPage({ content, result, renderScoreCircle, renderScoreBar }) {
  return `
    <div class="result-summary">
      <div>
        <p class="eyebrow">${content.labels.verdict}</p>
        <h2>${content.verdicts[result.verdictKey]}</h2>
      </div>
      ${renderScoreCircle({ label: content.labels.totalScore, score: result.score.total, max: 100 })}
    </div>
    <div class="score-breakdown">
      ${result.criteria
        .map((criterion) =>
          renderScoreBar({
            label: content.categories[criterion.key],
            score: criterion.score,
            max: criterion.max,
            reason: criterion.reason,
          })
        )
        .join("")}
    </div>
  `;
}

export default ResultPage;

