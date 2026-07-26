import { analyticsConfig } from "../config/analytics.js";

export function getAnalyticsReadiness() {
  return {
    googleAnalyticsReady: isConfigured(analyticsConfig.googleAnalytics.measurementId),
    googleSearchConsoleReady: isConfigured(analyticsConfig.googleSearchConsole.verificationToken),
    microsoftClarityReady: isConfigured(analyticsConfig.microsoftClarity.projectId),
    trackingEnabled: false,
  };
}

function isConfigured(value) {
  return Boolean(value) && !String(value).includes("_ID") && !String(value).includes("_TOKEN");
}

export default analyticsConfig;
