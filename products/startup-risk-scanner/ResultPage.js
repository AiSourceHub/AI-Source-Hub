import { renderScoreCircle } from "../../components/ScoreCircle/index.js";
import { renderScoreBar } from "../../components/ScoreBar/index.js";
import { buildExecutiveSummary } from "./report.js";

export function renderStartupRiskResultPage({ content, language, result }) {
  return `
    <section class="result-summary" aria-labelledby="startup-risk-result-title">
      <div>
        <p class="eyebrow">${content.labels.riskLevel}</p>
        <h2 id="startup-risk-result-title">${content.levels[result.riskResult.overallRiskLevel]}</h2>
        <p>${buildExecutiveSummary(result.riskResult, content, language)}</p>
      </div>
      ${renderScoreCircle({
        label: content.labels.overallRiskScore,
        score: result.riskResult.overallRiskScore,
        max: 100,
      })}
    </section>
    <div class="result-highlight-grid">
      <div class="result-highlight">
        <h3>${content.labels.mostDangerousRisk}</h3>
        <p>${result.riskResult.mostDangerousRisk.label[language]} (${result.riskResult.mostDangerousRisk.score}/100)</p>
      </div>
      <div class="result-highlight">
        <h3>${content.labels.strongestArea}</h3>
        <p>${result.riskResult.strongestArea.label[language]} (${result.riskResult.strongestArea.score}/100)</p>
      </div>
    </div>
    <section aria-labelledby="startup-risk-breakdown-title">
      <h3 id="startup-risk-breakdown-title">${content.labels.riskBreakdown}</h3>
      <div class="score-breakdown">
        ${result.riskResult.dimensions
          .map((dimension) =>
            renderScoreBar({
              label: `${dimension.label[language]} - ${content.levels[dimension.level]}`,
              score: dimension.score,
              max: 100,
              reason: dimension.reason,
            })
          )
          .join("")}
      </div>
    </section>
    <section class="result-highlight" aria-labelledby="startup-risk-top-risks-title">
      <h3 id="startup-risk-top-risks-title">${content.labels.topRisks}</h3>
      <ol>
        ${result.riskResult.topPriorityRisks
          .map((risk) => `<li>${risk.label[language]} (${risk.score}/100)</li>`)
          .join("")}
      </ol>
    </section>
    <section class="result-highlight" aria-labelledby="startup-risk-next-action-title">
      <h3 id="startup-risk-next-action-title">${content.labels.immediateNextAction}</h3>
      <p>${result.recommendationResult.immediateNextAction}</p>
    </section>
    <section aria-labelledby="startup-risk-recommendations-title">
      <h3 id="startup-risk-recommendations-title">${content.labels.recommendations}</h3>
      <div class="grid">
        ${result.recommendationResult.recommendations
          .map(
            (item) => `
              <article class="card">
                <div class="card__body">
                  <p class="eyebrow">${content.priorities[item.priority]}</p>
                  <h4>${item.riskTitle}</h4>
                  <p><strong>${item.whyItMatters}</strong></p>
                  <p>${item.recommendedAction}</p>
                  <p>${item.firstValidationStep}</p>
                  <p>${item.expectedOutcome}</p>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
    <section class="result-highlight" aria-labelledby="startup-risk-validation-plan-title">
      <h3 id="startup-risk-validation-plan-title">${content.labels.validationPlan}</h3>
      <ol>
        ${result.recommendationResult.validationPlan.map((step) => `<li>${step}</li>`).join("")}
      </ol>
    </section>
    <section class="result-highlight" aria-labelledby="startup-risk-disclaimer-title">
      <h3 id="startup-risk-disclaimer-title">${content.labels.disclaimer}</h3>
      <p>${content.disclaimer}</p>
    </section>
    <div class="report-actions">
      <button class="button button--secondary" type="button" id="copy-report">${content.labels.copyReport}</button>
      <button class="button button--secondary" type="button" id="download-report">${content.labels.downloadReport}</button>
      <button class="button button--secondary" type="button" id="start-again">${content.labels.restart}</button>
    </div>
  `;
}

export default renderStartupRiskResultPage;

