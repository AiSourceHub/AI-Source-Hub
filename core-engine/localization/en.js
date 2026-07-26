/**
 * English localization defaults for shared core-engine states.
 *
 * Products can extend this dictionary with their own labels, report sections,
 * and recommendation copy.
 */
export const en = {
  language: "en",
  direction: "ltr",
  status: {
    ready: "Ready",
    complete: "Complete",
    needsInput: "Needs input",
    error: "Error",
  },
  labels: {
    score: "Score",
    totalScore: "Total Score",
    recommendation: "Recommendation",
    nextAction: "Next Action",
    summary: "Summary",
    confidence: "Confidence",
  },
  validation: {
    missingRequiredField: "Add the required information before continuing.",
    incompleteInput: "Some information is missing, so the result may be directional.",
  },
};

export default en;

