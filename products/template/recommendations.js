export function createRecommendationTemplate(recommendationEngine, context) {
  return recommendationEngine.recommend(context);
}

export function getNextActionTemplate() {
  return {
    en: "Choose one practical next action.",
    ar: "اختر خطوة عملية واحدة تالية.",
  };
}

