import { colors, semanticColors } from "./colors.js";
import { typography } from "./typography.js";
import { spacing, layout, radius, shadows } from "./spacing.js";
import { iconRules, recommendedIcons } from "./icons.js";

export const theme = {
  colors,
  semanticColors,
  typography,
  spacing,
  layout,
  radius,
  shadows,
  icons: {
    rules: iconRules,
    recommended: recommendedIcons,
  },
  modes: ["light", "dark"],
  languages: ["en", "ar"],
  direction: {
    en: "ltr",
    ar: "rtl",
  },
};

export default theme;

