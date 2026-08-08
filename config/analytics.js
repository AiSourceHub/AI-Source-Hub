export const analyticsConfig = {
  enabledForInitialLaunch: false,
  launchDecision: "disabled",
  note: "Analytics are intentionally disabled for the initial public launch. No provider IDs are configured.",
  googleAnalytics: {
    enabled: false,
    measurementId: null,
  },
  googleSearchConsole: {
    enabled: false,
    verificationToken: null,
  },
  microsoftClarity: {
    enabled: false,
    projectId: null,
  },
};

export default analyticsConfig;
