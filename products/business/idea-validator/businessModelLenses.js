import {
  collectClassificationEvidence,
  evidenceToFieldSignals,
  matchSpecialistEvidence,
} from "./classificationEvidence.js";

export const BIV_BUSINESS_MODEL_LENS_VERSION = "biv_business_model_lens_v1";

export const BUSINESS_MODEL_LENSES = {
  SERVICE: "service",
  MARKETPLACE_PLATFORM: "marketplace_platform",
  RETAIL_TRADING: "retail_trading",
  WHOLESALE_IMPORT_DISTRIBUTION: "wholesale_import_distribution",
  MANUFACTURING_INDUSTRIAL: "manufacturing_industrial",
  FOOD_BEVERAGE: "food_beverage",
  SAAS_SOFTWARE: "saas_software",
  PROFESSIONAL_SERVICES: "professional_services",
  REAL_ESTATE: "real_estate",
  EXISTING_BUSINESS_EXPANSION: "existing_business_expansion",
  GENERIC: "generic",
};

export const LENS_CONFIDENCE = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const lensDefinitions = Object.freeze({
  service: defineLens("service", [
    "service delivery",
    "capacity",
    "labor quality",
    "scheduling",
    "repeatability",
  ]),
  marketplace_platform: defineLens("marketplace_platform", [
    "supply side",
    "demand side",
    "liquidity",
    "trust",
    "acquisition",
    "take rate",
    "disintermediation",
  ]),
  retail_trading: defineLens("retail_trading", [
    "product assortment",
    "inventory",
    "gross margin",
    "customer access",
    "reorder cycle",
  ]),
  wholesale_import_distribution: defineLens("wholesale_import_distribution", [
    "supplier reliability",
    "minimum order quantity",
    "lead time",
    "logistics",
    "working capital",
    "channel concentration",
  ]),
  manufacturing_industrial: defineLens("manufacturing_industrial", [
    "equipment",
    "capacity",
    "raw materials",
    "quality",
    "labor",
    "downtime",
    "lead time",
  ]),
  food_beverage: defineLens("food_beverage", [
    "menu or product mix",
    "location or delivery",
    "food cost",
    "labor",
    "permits",
    "repeat demand",
  ]),
  saas_software: defineLens("saas_software", [
    "user workflow",
    "activation",
    "retention",
    "support burden",
    "pricing model",
    "technical delivery",
  ]),
  professional_services: defineLens("professional_services", [
    "expertise",
    "trust",
    "scope control",
    "utilization",
    "delivery quality",
    "referrals",
  ]),
  real_estate: defineLens("real_estate", [
    "occupancy",
    "location",
    "yield",
    "utilization",
    "capex",
    "tenant or customer demand",
  ]),
  existing_business_expansion: defineLens("existing_business_expansion", [
    "current baseline",
    "capacity bottleneck",
    "incremental investment",
    "expansion risk",
    "performance comparison",
  ]),
  generic: defineLens("generic", [
    "basic customer",
    "problem",
    "revenue",
    "execution readiness",
    "missing information",
  ]),
});

const confirmedIntentToLens = {
  service: BUSINESS_MODEL_LENSES.SERVICE,
  retail: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
  manufacturing: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
  digital: BUSINESS_MODEL_LENSES.SAAS_SOFTWARE,
  marketplace: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
};

const classificationToLens = {
  service: BUSINESS_MODEL_LENSES.SERVICE,
  field_service: BUSINESS_MODEL_LENSES.SERVICE,
  professional_service: BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES,
  retail: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
  retail_trading: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
  wholesale_import_distribution: BUSINESS_MODEL_LENSES.WHOLESALE_IMPORT_DISTRIBUTION,
  industrial_manufacturing: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
  manufacturing_industrial: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
  food_and_beverage: BUSINESS_MODEL_LENSES.FOOD_BEVERAGE,
  food_beverage: BUSINESS_MODEL_LENSES.FOOD_BEVERAGE,
  food: BUSINESS_MODEL_LENSES.FOOD_BEVERAGE,
  digital_software: BUSINESS_MODEL_LENSES.SAAS_SOFTWARE,
  marketplace_platform: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
  real_estate: BUSINESS_MODEL_LENSES.REAL_ESTATE,
};

const keywordRules = [
  {
    lens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
    strength: "medium",
    patterns: [
      /\b(marketplace|platform connects|connects .* with|two-sided|providers and buyers|sellers and buyers)\b/i,
      /(منصة تربط|طرفين|مقدمي الخدمة والعملاء|البائعين والمشترين)/u,
    ],
  },
  {
    lens: BUSINESS_MODEL_LENSES.SAAS_SOFTWARE,
    strength: "medium",
    patterns: [
      /\b(saas|software|mobile app|web app|dashboard|automation|workflow tool)\b/i,
      /(برنامج|برمجيات|تطبيق|لوحة تحكم|أتمتة|اتمتة|أداة رقمية)/u,
    ],
  },
  {
    lens: BUSINESS_MODEL_LENSES.FOOD_BEVERAGE,
    strength: "medium",
    patterns: [
      /\b(restaurant|cafe|coffee shop|food truck|catering|meal|kitchen)\b/i,
      /(مطعم|مقهى|قهوة|وجبات|تموين|مطبخ)/u,
    ],
  },
  {
    lens: BUSINESS_MODEL_LENSES.REAL_ESTATE,
    strength: "medium",
    patterns: [
      /\b(warehouse rental|rental warehouse|storage units|real estate|property rental|tenant|landlord|occupancy)\b/i,
      /(تأجير مستودعات|مستودعات للايجار|مستودعات للإيجار|عقار|عقاري|مستأجر|إشغال)/u,
    ],
  },
  {
    lens: BUSINESS_MODEL_LENSES.WHOLESALE_IMPORT_DISTRIBUTION,
    strength: "medium",
    patterns: [
      /\b(wholesale|import|importer|importers|distribution|distributor|supply to retailers)\b/i,
      /(جملة|استيراد|توزيع|موزع)/u,
    ],
  },
  {
    lens: BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
    strength: "medium",
    patterns: [
      /\b(factory|manufacture|manufactures|manufactured|manufacturing|industrial|fabrication|fabricates|fabricated|production line|stainless workshop|equipment workshop|restaurant equipment workshop)\b/i,
      /(مصنع|تصنيع|صناعي|خط إنتاج|خط انتاج|ورشة تصنيع)/u,
    ],
  },
  {
    lens: BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES,
    strength: "medium",
    patterns: [
      /\b(consulting|consultancy|legal service|accounting service|accounting advisory|tax advisory|tax consultancy|engineering service|engineering consulting|management consulting|advisory|professional service)\b/i,
      /(استشارة|استشارات|خدمات مهنية|مسك الدفاتر|استشارات محاسبية|استشارات ضريبية|استشارات هندسية|محاسبة|هندسية|قانونية|تدقيق)/u,
    ],
  },
  {
    lens: BUSINESS_MODEL_LENSES.RETAIL_TRADING,
    patterns: [
      /\b(retail|shop|store|ecommerce|e-commerce|packaging store|sell products)\b/i,
      /(متجر|تجزئة|بيع منتجات|محل تغليف|متجر تغليف)/u,
    ],
  },
  {
    lens: BUSINESS_MODEL_LENSES.SERVICE,
    patterns: [
      /\b(service|maintenance|repair|cleaning|car wash|field service|customer site)\b/i,
      /(خدمة|صيانة|إصلاح|اصلاح|تنظيف|غسيل|موقع العميل)/u,
    ],
  },
];

const lensTiePriority = {
  marketplace_platform: 1,
  wholesale_import_distribution: 2,
  professional_services: 3,
  manufacturing_industrial: 4,
  saas_software: 4,
  food_beverage: 5,
  real_estate: 6,
  service: 7,
  retail_trading: 8,
  generic: 10,
};

export function getBusinessModelLensDefinitionsV1() {
  return lensDefinitions;
}

export function getBusinessModelLensDefinition(lens = "") {
  return lensDefinitions[lens] || null;
}

export function selectBusinessModelLensV1(input = {}) {
  const normalized = normalizeSelectionInput(input);
  const sourceFields = buildSourceFields(normalized);
  const classificationEvidence = collectClassificationEvidence(sourceFields);
  const fieldSignals = evidenceToFieldSignals(classificationEvidence);
  const specialistCandidate = filterContextualSpecialistCandidate(matchSpecialistEvidence(sourceFields, normalized.locale));
  const candidateSignals = collectCandidateSignals({
    normalized,
    sourceFields,
    fieldSignals,
    classificationEvidence,
  });
  const selected = chooseLens(candidateSignals);
  const expansionLens = detectExistingBusinessExpansion(normalized);
  const primaryLens = expansionLens ? BUSINESS_MODEL_LENSES.EXISTING_BUSINESS_EXPANSION : selected.lens;
  const secondaryLens = expansionLens
    ? selected.lens === BUSINESS_MODEL_LENSES.EXISTING_BUSINESS_EXPANSION ? "" : selected.lens
    : selected.secondaryLens;
  const contradiction = detectContradiction(candidateSignals, selected.lens);
  const confidence = deriveConfidence({ selected, contradiction, expansionLens });
  const requiresConfirmation = confidence !== LENS_CONFIDENCE.HIGH || contradiction.hasContradiction;

  return {
    version: BIV_BUSINESS_MODEL_LENS_VERSION,
    primaryLens,
    ...(secondaryLens ? { secondaryLens } : {}),
    confidence,
    sourceSignals: buildSourceSignals(candidateSignals, selected.lens, expansionLens),
    requiresConfirmation,
    rationale: buildRationale({ primaryLens, secondaryLens, selected, contradiction, expansionLens }),
    ...(specialistCandidate ? {
      specialistCandidate: {
        id: specialistCandidate.id,
        confidence: specialistCandidate.confidence,
        runtimeInvoked: false,
        notes: "Specialist candidate metadata only; lens selection does not execute specialist runtime.",
      },
    } : {}),
  };
}

export function validateBusinessModelLensSelectionV1(selection = {}) {
  const errors = [];
  if (!selection || typeof selection !== "object" || Array.isArray(selection)) {
    return { ok: false, errors: ["selection must be an object"] };
  }
  if (selection.version !== BIV_BUSINESS_MODEL_LENS_VERSION) errors.push("invalid version");
  if (!lensDefinitions[selection.primaryLens]) errors.push("invalid primaryLens");
  if (selection.secondaryLens && !lensDefinitions[selection.secondaryLens]) errors.push("invalid secondaryLens");
  if (selection.secondaryLens && selection.secondaryLens === selection.primaryLens) errors.push("secondaryLens must differ from primaryLens");
  if (!Object.values(LENS_CONFIDENCE).includes(selection.confidence)) errors.push("invalid confidence");
  if (!Array.isArray(selection.sourceSignals)) errors.push("sourceSignals must be an array");
  if (typeof selection.requiresConfirmation !== "boolean") errors.push("requiresConfirmation must be boolean");
  if (typeof selection.rationale !== "string" || !selection.rationale.trim()) errors.push("rationale is required");
  return { ok: errors.length === 0, errors };
}

function defineLens(id, futureAnalyticalFocus) {
  return Object.freeze({
    id,
    futureAnalyticalFocus: Object.freeze([...futureAnalyticalFocus]),
    authority: {
      determinesWhatToAnalyzeLater: true,
      determinesVerdict: false,
      changesRuntimeBehavior: false,
    },
  });
}

function normalizeSelectionInput(input = {}) {
  const canonical = input.canonicalInput || input;
  const classification = input.classification || input.orchestrationDecision?.classification || {};
  return {
    locale: canonical.locale === "ar" || input.language === "ar" ? "ar" : "en",
    rawInput: canonical.rawInput || input.rawInput || {},
    originalIdea: canonical.originalIdea || input.originalIdea || "",
    confirmedUnderstanding: canonical.confirmedUnderstanding || input.confirmedUnderstanding || {},
    optionalContext: canonical.optionalContext || input.optionalContext || {},
    classification,
    feasibilityAnswers: input.feasibilityAnswers || {},
  };
}

function buildSourceFields({ rawInput = {}, originalIdea = "", confirmedUnderstanding = {}, optionalContext = {}, feasibilityAnswers = {} }) {
  const fields = [
    ["originalIdea", originalIdea],
    ["businessIdea", rawInput.businessIdea],
    ["targetCustomer", rawInput.targetCustomer],
    ["problem", rawInput.problem],
    ["monetization", rawInput.monetization],
    ["currentSolution", rawInput.currentSolution],
    ["competitiveAdvantage", rawInput.competitiveAdvantage],
    ["stage", rawInput.stage || optionalContext.projectStageIntent || feasibilityAnswers.projectStageIntent],
    ["confirmedUnderstanding.selectedIntent", confirmedUnderstanding.selectedIntent],
    ["confirmedUnderstanding.coreOffering", confirmedUnderstanding.coreOffering],
    ["confirmedUnderstanding.selectedOperatingApproach", confirmedUnderstanding.selectedOperatingApproach],
    ["confirmedUnderstanding.selectedOperatingApproaches", Array.isArray(confirmedUnderstanding.selectedOperatingApproaches) ? confirmedUnderstanding.selectedOperatingApproaches.join(" ") : ""],
    ["guidedDiscoveryCoreOfferingEvidence", feasibilityAnswers.guidedDiscoveryCoreOfferingEvidence],
    ["guidedDiscoveryOperatingModelEvidence", feasibilityAnswers.guidedDiscoveryOperatingModelEvidence],
  ];
  return fields
    .map(([field, value]) => ({ field, value: cleanString(value) }))
    .filter((field) => field.value);
}

function collectCandidateSignals({ normalized, sourceFields, fieldSignals, classificationEvidence }) {
  const signals = [];
  const confirmedIntent = cleanString(normalized.confirmedUnderstanding.selectedIntent);
  const confirmedLens = confirmedIntentToLens[confirmedIntent];
  if (confirmedLens) {
    signals.push(signal({
      lens: confirmedLens,
      source: "confirmed_understanding",
      sourceField: "confirmedUnderstanding.selectedIntent",
      strength: "strong",
      priority: 1,
    }));
  }

  const confirmedClassification = normalized.classification.confirmedClassification || {};
  const confirmedType = cleanString(confirmedClassification.primaryType || confirmedClassification.engineType || confirmedClassification.type);
  const confirmedClassificationLens = classificationToLens[confirmedType];
  if (confirmedClassificationLens && hasBusinessModelSupportForClassificationLens(classificationEvidence, confirmedClassificationLens)) {
    signals.push(signal({
      lens: confirmedClassificationLens,
      source: "confirmed_classification",
      sourceField: "classification.confirmedClassification",
      strength: "strong",
      priority: 2,
    }));
  }

  const proposed = normalized.classification.proposedClassification || {};
  for (const type of [proposed.primaryType, proposed.engineType, proposed.type, normalized.classification.businessType]) {
    const lens = classificationToLens[cleanString(type)];
    if (lens && hasBusinessModelSupportForClassificationLens(classificationEvidence, lens)) {
      signals.push(signal({
        lens,
        source: "system_classification",
        sourceField: "classification.proposedClassification",
        strength: normalized.classification.classificationConfidence === "high" ? "medium" : "weak",
        priority: 5,
      }));
      break;
    }
  }

  for (const record of classificationEvidence) {
    if (record.semanticRole === "customer_industry_signal") continue;
    const lens = classificationToLens[record.conceptId] || classificationToLens[record.proposedValue];
    if (!lens) continue;
    const evidenceStrength = normalizeSignalStrength(record.evidenceStrength);
    signals.push(signal({
      lens,
      source: "classification_evidence",
      sourceField: record.sourceField,
      strength: evidenceStrength,
      priority: record.semanticRole === "business_model_signal" && evidenceStrength !== "weak" ? 4 : 6,
      semanticRole: record.semanticRole,
    }));
  }

  const text = sourceFields.map((field) => field.value).join(" ");
  for (const rule of keywordRules) {
    if (shouldSkipContextualKeywordRule({ rule, text })) continue;
    if (!rule.patterns.some((pattern) => pattern.test(text))) continue;
    signals.push(signal({
      lens: rule.lens,
      source: "keyword_fallback",
      sourceField: "owner_text",
      strength: rule.strength || "weak",
      priority: 6,
      semanticRole: "business_model_signal",
    }));
  }

  const marketplaceSignal = fieldSignals.some((record) => record.group === "customerModel" && record.concept === "two_sided");
  if (marketplaceSignal) {
    signals.push(signal({
      lens: BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM,
      source: "classification_evidence",
      sourceField: "customerModel.two_sided",
      strength: "medium",
      priority: 4,
      semanticRole: "business_model_signal",
    }));
  }

  return dedupeSignals(signals);
}

function hasBusinessModelSupportForClassificationLens(classificationEvidence = [], lens = "") {
  if (!classificationEvidence.length) return true;
  const ownerModelFields = new Set(["businessName", "businessIdea", "industry", "competitiveAdvantage"]);
  return classificationEvidence.some((record) =>
    (record.semanticRole === "business_model_signal" || ownerModelFields.has(record.sourceField)) &&
    (classificationToLens[record.conceptId] === lens || classificationToLens[record.proposedValue] === lens)
  );
}

function chooseLens(signals = []) {
  if (!signals.length) {
    return { lens: BUSINESS_MODEL_LENSES.GENERIC, secondaryLens: "", signalCount: 0, winningPriority: 9 };
  }
  const ranked = [...signals].sort(compareSignals);
  const primary = ranked[0];
  const secondary = ranked.find((record) =>
    record.lens !== primary.lens &&
    record.priority <= 5 &&
    record.semanticRole !== "customer_industry_signal"
  );
  return {
    lens: primary.lens,
    secondaryLens: shouldUseSecondary(primary.lens, secondary?.lens) ? secondary.lens : "",
    signalCount: signals.filter((record) => record.lens === primary.lens).length,
    winningPriority: primary.priority,
    winningStrength: primary.strength,
  };
}

function compareSignals(a, b) {
  if (a.priority !== b.priority) return a.priority - b.priority;
  const strengthRank = { strong: 0, medium: 1, weak: 2 };
  if (strengthRank[a.strength] !== strengthRank[b.strength]) return strengthRank[a.strength] - strengthRank[b.strength];
  if ((lensTiePriority[a.lens] || 99) !== (lensTiePriority[b.lens] || 99)) {
    return (lensTiePriority[a.lens] || 99) - (lensTiePriority[b.lens] || 99);
  }
  return a.lens.localeCompare(b.lens);
}

function shouldUseSecondary(primaryLens, secondaryLens = "") {
  if (!secondaryLens || secondaryLens === primaryLens) return false;
  if (primaryLens === BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM && [
    BUSINESS_MODEL_LENSES.SERVICE,
    BUSINESS_MODEL_LENSES.SAAS_SOFTWARE,
    BUSINESS_MODEL_LENSES.RETAIL_TRADING,
    BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
  ].includes(secondaryLens)) return true;
  if (primaryLens === BUSINESS_MODEL_LENSES.SAAS_SOFTWARE && secondaryLens === BUSINESS_MODEL_LENSES.MARKETPLACE_PLATFORM) return true;
  if (primaryLens === BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL && secondaryLens === BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES) return true;
  return false;
}

function detectExistingBusinessExpansion({ rawInput = {}, optionalContext = {}, feasibilityAnswers = {} }) {
  const stage = cleanString(rawInput.stage || optionalContext.projectStageIntent || feasibilityAnswers.projectStageIntent);
  return ["launched", "operating", "improving", "expanding"].includes(stage);
}

function detectContradiction(signals = [], selectedLens) {
  const strongOther = signals.filter((record) =>
    record.lens !== selectedLens &&
    !isContextualNonContradiction({ selectedLens, otherLens: record.lens }) &&
    ["strong", "medium"].includes(record.strength) &&
    record.priority <= 6 &&
    record.semanticRole !== "customer_industry_signal"
  );
  return {
    hasContradiction: strongOther.length > 0,
    competingLenses: strongOther.map((record) => record.lens),
  };
}

function deriveConfidence({ selected, contradiction, expansionLens }) {
  if (contradiction.hasContradiction) return LENS_CONFIDENCE.LOW;
  if (selected.lens === BUSINESS_MODEL_LENSES.GENERIC) return LENS_CONFIDENCE.LOW;
  if (selected.winningStrength === "weak") return LENS_CONFIDENCE.LOW;
  if (selected.winningPriority <= 4) return LENS_CONFIDENCE.HIGH;
  if (expansionLens && selected.signalCount > 0) return LENS_CONFIDENCE.HIGH;
  if (selected.winningPriority <= 5) return LENS_CONFIDENCE.MEDIUM;
  return LENS_CONFIDENCE.LOW;
}

function buildSourceSignals(signals, selectedLens, expansionLens) {
  const selectedSignals = signals
    .filter((record) => record.lens === selectedLens || record.priority <= 4)
    .map(({ lens, source, sourceField, strength, semanticRole }) => ({ lens, source, sourceField, strength, semanticRole }));
  if (expansionLens) {
    selectedSignals.unshift({
      lens: BUSINESS_MODEL_LENSES.EXISTING_BUSINESS_EXPANSION,
      source: "owner_context",
      sourceField: "stage",
      strength: "strong",
    });
  }
  return selectedSignals.slice(0, 8);
}

function buildRationale({ primaryLens, secondaryLens, selected, contradiction, expansionLens }) {
  const parts = [];
  if (expansionLens) {
    parts.push("Existing-business stage selected as primary so expansion context is preserved.");
  } else {
    parts.push(`${primaryLens} selected from the strongest available confirmed or owner-provided signals.`);
  }
  if (secondaryLens) parts.push(`${secondaryLens} preserved as the underlying or adjacent business model lens.`);
  if (selected.lens === BUSINESS_MODEL_LENSES.GENERIC) parts.push("Signals were too weak for a specific lens.");
  if (contradiction.hasContradiction) parts.push(`Competing strong signals found: ${contradiction.competingLenses.join(", ")}.`);
  parts.push("Lens selection is non-authoritative and does not determine verdict.");
  return parts.join(" ");
}

function signal({ lens, source, sourceField, strength, priority, semanticRole = "business_model_signal" }) {
  return { lens, source, sourceField, strength, priority, semanticRole };
}

function dedupeSignals(signals) {
  const seen = new Set();
  return signals.filter((record) => {
    const key = `${record.lens}:${record.source}:${record.sourceField}:${record.strength}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cleanString(value = "") {
  return typeof value === "string" ? value.trim() : "";
}

function shouldSkipContextualKeywordRule({ rule, text }) {
  if (rule.lens !== BUSINESS_MODEL_LENSES.FOOD_BEVERAGE) return false;
  return hasDominantNonFoodBusinessMechanic(text);
}

function hasDominantNonFoodBusinessMechanic(text = "") {
  return /\b(saas|software|mobile app|web app|marketplace|platform connects|connects .* with|wholesale|distribution|distributor|retail|shop|store|supplier|factory|manufacturing|industrial|fabrication|fabricates|fabricated|workshop|service|maintenance|repair|cleaning|consulting|consultancy|advisory|rental warehouse|warehouse rental|storage units)\b/i.test(text);
}

function isContextualNonContradiction({ selectedLens, otherLens }) {
  if (selectedLens === BUSINESS_MODEL_LENSES.PROFESSIONAL_SERVICES) {
    return [
      BUSINESS_MODEL_LENSES.SERVICE,
      BUSINESS_MODEL_LENSES.MANUFACTURING_INDUSTRIAL,
    ].includes(otherLens);
  }
  if (selectedLens === BUSINESS_MODEL_LENSES.SAAS_SOFTWARE) {
    return [
      BUSINESS_MODEL_LENSES.RETAIL_TRADING,
      BUSINESS_MODEL_LENSES.FOOD_BEVERAGE,
      BUSINESS_MODEL_LENSES.REAL_ESTATE,
    ].includes(otherLens);
  }
  return false;
}

function filterContextualSpecialistCandidate(candidate) {
  if (candidate?.id !== "pet_plastic_recycling") return candidate || null;
  const requirements = new Set((candidate.evidence || []).map((record) => record.requirement));
  return requirements.has("plastic") ? candidate : null;
}

function normalizeSignalStrength(value = "") {
  if (value === "strong" || value === "medium") return value;
  return "weak";
}
