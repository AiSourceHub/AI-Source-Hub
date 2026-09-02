const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu;
const TATWEEL = /\u0640/gu;
const TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;

const sourceStrength = {
  businessName: 1.1,
  businessIdea: 1,
  industry: 0.9,
  targetCustomer: 0.7,
  problem: 0.6,
  problemSolved: 0.6,
  currentSolution: 0.45,
  competitiveAdvantage: 0.55,
  monetization: 0.35,
  revenueModel: 0.35,
  stage: 0.2,
};

const weakOnlyFields = new Set(["monetization", "revenueModel", "currentSolution", "stage"]);

const conceptDefinitions = [
  {
    conceptId: "healthcare_clinic",
    dimension: "sector",
    proposedValue: "healthcare",
    evidenceStrength: "strong",
    weight: 2,
    reasonCode: "healthcare_clinic_evidence",
    tokens: ["clinic", "clinics", "healthcare", "patient", "patients", "doctor", "doctors", "nurse", "nurses", "therapy", "treatment"],
    arTokens: ["عيادة", "عيادات", "طبي", "طبية", "طبيب", "اطباء", "أطباء", "مرضى", "مريض", "ممرض", "ممرضة", "ممرضين", "تمريض", "علاج", "تأهيل"],
    phrases: [["medical", "clinic"], ["health", "care"], ["care", "delivery"]],
    arPhrases: [["عيادة", "طبية"], ["خدمة", "طبية"], ["خدمات", "طبية"], ["رعاية", "صحية"], ["تمريض", "منزلي"]],
  },
  {
    conceptId: "food_beverage",
    dimension: "sector",
    proposedValue: "food",
    evidenceStrength: "strong",
    weight: 2,
    reasonCode: "food_beverage_evidence",
    tokens: ["restaurant", "restaurants", "food", "meal", "meals", "kitchen", "cafe", "catering"],
    arTokens: ["مطعم", "مطاعم", "طعام", "وجبات", "وجبة", "مطبخ", "مقهى", "تموين", "إعاشة", "اعاشة"],
  },
  {
    conceptId: "automotive_service_context",
    dimension: "sector",
    proposedValue: "automotive",
    evidenceStrength: "medium",
    weight: 2,
    reasonCode: "automotive_context_evidence",
    tokens: ["vehicle", "vehicles", "car", "cars", "auto", "automotive", "garage", "workshop"],
    arTokens: ["سيارات", "سيارة", "مركبات", "مركبة", "كراج"],
    phrases: [["vehicle", "service"], ["car", "service"], ["repair", "workshop"]],
    arPhrases: [["ورشة", "سيارات"], ["خدمة", "سيارات"]],
  },
  {
    conceptId: "construction_service_context",
    dimension: "sector",
    proposedValue: "construction_services",
    evidenceStrength: "medium",
    weight: 2,
    reasonCode: "construction_service_evidence",
    tokens: ["construction", "contractor", "contractors", "renovation", "building", "maintenance"],
    arTokens: ["مقاول", "مقاولين", "مقاولات", "ترميم", "بناء", "صيانة"],
  },
  {
    conceptId: "real_estate_context",
    dimension: "sector",
    proposedValue: "real_estate",
    evidenceStrength: "strong",
    weight: 2,
    reasonCode: "real_estate_evidence",
    tokens: ["property", "rental", "landlord", "tenant"],
    phrases: [["real", "estate"]],
    arTokens: ["عقار", "عقاري", "إيجار", "ايجار", "مستأجر"],
    arPhrases: [["مالك", "عقار"]],
  },
  {
    conceptId: "recycling_context",
    dimension: "sector",
    proposedValue: "recycling",
    evidenceStrength: "strong",
    weight: 3,
    reasonCode: "recycling_evidence",
    tokens: ["recycling", "recycle", "recycled"],
    arTokens: ["تدوير", "تدويرها"],
    phrases: [["waste", "processing"]],
    arPhrases: [["إعادة", "تدوير"], ["اعادة", "تدوير"], ["إعادة", "التصنيع"], ["اعادة", "التصنيع"], ["المعاد", "تدويرها"]],
  },
  {
    conceptId: "marketplace_platform",
    dimension: "businessType",
    proposedValue: "marketplace_platform",
    evidenceStrength: "strong",
    weight: 4,
    reasonCode: "marketplace_platform_evidence",
    tokens: ["marketplace"],
    phrases: [["platform", "connects"], ["two", "sided"], ["providers", "and", "buyers"], ["sellers", "and", "buyers"]],
    arTokens: ["طرفين"],
    arPhrases: [["منصة", "تربط"], ["يربط"], ["تطبيق", "سوق"], ["مقدمي", "الخدمة", "والعملاء"], ["البائعين", "والمشترين"]],
  },
  {
    conceptId: "digital_software",
    dimension: "businessType",
    proposedValue: "digital_software",
    evidenceStrength: "strong",
    weight: 4,
    reasonCode: "digital_software_evidence",
    tokens: ["software", "saas", "application", "dashboard", "automation", "api"],
    phrases: [["digital", "tool"], ["mobile", "app"], ["web", "app"], ["workflow", "tool"]],
    arTokens: ["برمجي", "برنامج", "برمجيات", "أتمتة", "اتمتة"],
    arPhrases: [["لوحة", "تحكم"], ["أداة", "رقمية"], ["منصة", "رقمية"], ["واجهة", "برمجة"], ["تطبيق", "رقمي"], ["تطبيق", "محاسبة"]],
  },
  {
    conceptId: "arabic_digital_app_context",
    dimension: "businessType",
    proposedValue: "digital_software",
    evidenceStrength: "medium",
    weight: 2,
    reasonCode: "arabic_app_context_evidence",
    arPhrases: [["تطبيق", "يساعد"], ["تطبيق", "ل"], ["تطبيق", "إدارة"], ["تطبيق", "ادارة"]],
    disallowPhrases: [["تطبيق", "الخطة"], ["تطبيق", "الإجراءات"], ["تطبيق", "الاجراءات"]],
  },
  {
    conceptId: "manufacturing_industrial",
    dimension: "businessType",
    proposedValue: "industrial_manufacturing",
    evidenceStrength: "strong",
    weight: 3,
    reasonCode: "manufacturing_industrial_evidence",
    tokens: ["factory", "plant", "manufacture", "manufactures", "manufactured", "manufacturer", "manufacturers", "manufacturing", "industrial", "fabrication", "fabricates", "fabricated"],
    phrases: [["production", "line"], ["assembly", "line"], ["stainless", "workshop"], ["equipment", "workshop"], ["restaurant", "equipment", "workshop"]],
    arTokens: ["مصنع", "معمل", "تصنيع", "صناعي"],
    arPhrases: [["خط", "إنتاج"], ["خط", "انتاج"], ["إنتاج", "صناعي"], ["انتاج", "صناعي"], ["موقع", "صناعي"]],
  },
  {
    conceptId: "professional_service",
    dimension: "businessType",
    proposedValue: "professional_service",
    evidenceStrength: "strong",
    weight: 3,
    reasonCode: "professional_service_evidence",
    tokens: ["consulting", "consultancy", "advisory"],
    phrases: [["engineering", "consultancy"], ["engineering", "service"], ["professional", "service"]],
    arTokens: ["استشارة", "استشارات", "استشارية"],
    arPhrases: [["خدمات", "مهنية"], ["استشارات", "هندسية"], ["خدمة", "استشارية"]],
  },
  {
    conceptId: "retail_trading",
    dimension: "businessType",
    proposedValue: "retail_trading",
    evidenceStrength: "strong",
    weight: 3,
    reasonCode: "retail_trading_evidence",
    tokens: ["retail", "shop", "store", "ecommerce", "trading", "import", "export", "wholesale", "resell"],
    arTokens: ["متجر", "تجزئة", "تجارة", "استيراد", "تصدير", "جملة"],
    phrases: [["e", "commerce"]],
    arPhrases: [["بيع", "منتجات"], ["بيع", "بالتجزئة"]],
    sourceFields: ["businessName", "businessIdea", "industry", "targetCustomer", "problem", "problemSolved", "competitiveAdvantage"],
  },
  {
    conceptId: "wholesale_import_distribution",
    dimension: "businessType",
    proposedValue: "retail_trading",
    evidenceStrength: "strong",
    weight: 3,
    reasonCode: "wholesale_import_distribution_evidence",
    tokens: ["wholesale", "import", "importer", "importers", "distribution", "distributor"],
    arTokens: ["جملة", "استيراد", "توزيع", "موزع"],
    sourceFields: ["businessName", "businessIdea", "industry", "targetCustomer", "problem", "problemSolved", "competitiveAdvantage"],
  },
  {
    conceptId: "generic_sale_revenue",
    dimension: "businessType",
    proposedValue: "retail_trading",
    evidenceStrength: "weak",
    weight: 1,
    reasonCode: "revenue_sale_weak_evidence",
    tokens: ["sell", "sales"],
    arTokens: ["بيع"],
    sourceFields: ["monetization", "revenueModel"],
  },
  {
    conceptId: "service_delivery",
    dimension: "businessType",
    proposedValue: "service",
    evidenceStrength: "medium",
    weight: 3,
    reasonCode: "service_delivery_evidence",
    tokens: ["service", "services", "consulting", "agency", "maintenance", "repair", "delivery", "cleaning", "wash", "washing", "barber", "barbershop", "salon", "grooming", "coaching", "training"],
    arTokens: ["خدمة", "خدمات", "استشارة", "وكالة", "صيانة", "إصلاح", "اصلاح", "توصيل", "تنظيف", "غسيل", "حلاقة", "صالون", "تدريب"],
    phrases: [["professional", "service"], ["home", "service"]],
    arPhrases: [["خدمة", "منزلية"], ["خدمات", "مهنية"], ["لخدمة", "السيارات"]],
  },
  {
    conceptId: "fixed_location",
    dimension: "operatingModel",
    proposedValue: "fixed_location",
    evidenceStrength: "strong",
    weight: 3,
    reasonCode: "fixed_location_evidence",
    phrases: [["fixed", "location"], ["fixed", "site"], ["fixed", "shop"], ["fixed", "store"], ["fixed", "premises"], ["fixed", "industrial", "site"], ["customers", "visit"], ["customers", "come"], ["physical", "branch"], ["physical", "location"]],
    arPhrases: [["موقع", "ثابت"], ["موقع", "صناعي", "ثابت"], ["محل", "ثابت"], ["متجر", "ثابت"], ["مقر", "ثابت"], ["مقر", "صناعي", "ثابت"], ["يأتي", "العملاء"], ["يذهب", "العملاء"], ["يحضر", "العملاء"], ["يزور", "العملاء"], ["فرع", "ثابت"], ["داخل", "موقع", "ثابت"]],
  },
  {
    conceptId: "mobile_customer_site",
    dimension: "operatingModel",
    proposedValue: "mobile_or_customer_site",
    evidenceStrength: "strong",
    weight: 3,
    reasonCode: "mobile_customer_site_evidence",
    tokens: ["on-site"],
    phrases: [["mobile", "service"], ["provider", "travels"], ["provider", "goes", "to", "customer"], ["team", "travels", "to", "customer"], ["technicians", "travel", "to", "homes"], ["technician", "travels", "to", "homes"], ["travels", "to", "customer"], ["travel", "to", "homes"], ["customer", "site"], ["customer", "premises"], ["at", "customer", "premises"], ["delivered", "at", "customer", "site"], ["service", "delivered", "at", "customer", "site"], ["home", "visit"], ["delivery", "to", "customer"]],
    arTokens: ["متنقل", "ميداني"],
    arPhrases: [["في", "موقع", "العميل"], ["عند", "العميل"], ["في", "مقر", "العميل"], ["إلى", "منزل", "العميل"], ["الى", "منزل", "العميل"], ["زيارة", "منزلية"], ["ينتقل", "الفني"], ["ينتقل", "العامل"], ["ينتقل", "الفريق"], ["مقدم", "الخدمة", "ينتقل"], ["تصل", "الخدمة"]],
  },
  {
    conceptId: "digital_remote",
    dimension: "operatingModel",
    proposedValue: "digital_remote",
    evidenceStrength: "strong",
    weight: 3,
    reasonCode: "digital_remote_evidence",
    tokens: ["online", "web", "software", "saas", "digital", "remote"],
    phrases: [["mobile", "app"], ["web", "app"]],
    arTokens: ["أونلاين", "اونلاين", "رقمي", "إلكتروني", "الكتروني"],
    arPhrases: [["عن", "بعد"], ["عن", "بُعد"], ["عبر", "الانترنت"], ["منصة", "رقمية"], ["تطبيق", "رقمي"], ["حجز", "رقمي"]],
  },
  {
    conceptId: "home_based",
    dimension: "operatingModel",
    proposedValue: "home_based",
    evidenceStrength: "strong",
    weight: 3,
    reasonCode: "home_based_evidence",
    phrases: [["home", "based"], ["from", "home"], ["home", "kitchen"], ["home", "workshop"]],
    arPhrases: [["مشروع", "منزلي"], ["مطبخ", "منزلي"], ["ورشة", "منزلية"], ["تشغيله", "من", "المنزل"], ["تعمل", "من", "المنزل"], ["اعمل", "من", "المنزل"]],
  },
  {
    conceptId: "mixed_operating_model",
    dimension: "operatingModel",
    proposedValue: "mixed",
    evidenceStrength: "medium",
    weight: 2,
    reasonCode: "mixed_operating_model_evidence",
    tokens: ["hybrid", "mixed"],
    phrases: [["online", "and", "offline"], ["both", "online", "and", "physical"]],
    arTokens: ["مختلط", "هجين"],
    arPhrases: [["رقمي", "وميداني"], ["أونلاين", "وحضوري"], ["اونلاين", "وحضوري"]],
  },
  {
    conceptId: "asset_intensive",
    dimension: "assetIntensity",
    proposedValue: "high",
    evidenceStrength: "medium",
    weight: 2,
    reasonCode: "asset_intensive_evidence",
    tokens: ["factory", "plant", "machinery", "machine", "equipment", "laundry"],
    phrases: [["vehicle", "workshop"], ["production", "line"]],
    arTokens: ["مصنع", "معدات", "مكائن", "آلات", "ورشة"],
    arPhrases: [["خط", "إنتاج"], ["خط", "انتاج"]],
  },
  {
    conceptId: "two_sided_customer_model",
    dimension: "customerModel",
    proposedValue: "two_sided",
    evidenceStrength: "strong",
    weight: 3,
    reasonCode: "two_sided_customer_model_evidence",
    tokens: ["marketplace"],
    phrases: [["connects", "with"], ["two", "sided"], ["providers", "and", "buyers"], ["sellers", "and", "buyers"]],
    arTokens: ["طرفين"],
    arPhrases: [["يربط"], ["منصة", "تربط"], ["مقدمي", "الخدمة", "والعملاء"], ["البائعين", "والمشترين"]],
  },
  {
    conceptId: "b2b_customer_model",
    dimension: "customerModel",
    proposedValue: "b2b",
    evidenceStrength: "medium",
    weight: 2,
    reasonCode: "b2b_customer_model_evidence",
    tokens: ["businesses", "companies", "clinics", "restaurants", "factories", "contractors", "offices", "enterprise"],
    arTokens: ["شركات", "منشآت", "عيادات", "مطاعم", "مصانع", "مقاولين", "مكاتب", "أعمال"],
  },
  {
    conceptId: "b2c_customer_model",
    dimension: "customerModel",
    proposedValue: "b2c",
    evidenceStrength: "medium",
    weight: 2,
    reasonCode: "b2c_customer_model_evidence",
    tokens: ["consumers", "families", "parents", "drivers", "homeowners", "patients", "individuals"],
    arTokens: ["أفراد", "اسر", "أسر", "عوائل", "سائقين", "مرضى"],
    arPhrases: [["أصحاب", "المنازل"], ["عملاء", "أفراد"]],
  },
];

const specialistDefinitions = [
  {
    id: "pet_plastic_recycling",
    label: { en: "plastic recycling assessment", ar: "تقييم إعادة تدوير البلاستيك" },
    requirements: [
      {
        key: "plastic",
        tokens: ["pet", "hdpe", "ldpe", "pp", "plastic"],
        phrases: [["plastic", "waste"], ["bottle", "recycler"]],
        arTokens: ["بلاستيك", "البلاستيك"],
        arPhrases: [["مخلفات", "البلاستيك"], ["عبوات", "بلاستيكية"]],
      },
      {
        key: "recycling",
        tokens: ["recycling", "recycle", "recycled", "flakes", "pellets", "granules", "baled"],
        phrases: [["waste", "processing"]],
        arTokens: ["تدوير", "تدويرها", "رقائق", "حبيبات", "جرانول", "مفروز", "مكبس"],
        arPhrases: [["إعادة", "تدوير"], ["اعادة", "تدوير"], ["المعاد", "تدويرها"]],
      },
    ],
  },
];

export function collectClassificationEvidence(sourceFields = []) {
  const evidence = [];

  for (const source of sourceFields) {
    const field = source.field;
    const sourceWeight = sourceStrength[field] ?? 0.5;
    const tokenized = tokenizeForClassification(source.value);
    const suppressOperatingModel = hasOperatingModelUncertainty(source.value);

    for (const definition of conceptDefinitions) {
      if (definition.sourceFields && !definition.sourceFields.includes(field)) continue;
      if (definition.dimension === "operatingModel" && suppressOperatingModel) continue;

      const matches = matchDefinition(definition, tokenized);
      for (const match of matches) {
        const semanticRole = semanticRoleForMatch({ definition, field });
        const fieldScopedStrength = weakOnlyFields.has(field) && definition.evidenceStrength !== "strong"
          ? "weak"
          : semanticRole === "customer_industry_signal" && definition.dimension === "businessType"
            ? "weak"
            : definition.evidenceStrength;
        const fieldScopedWeight = Math.max(1, Math.round(definition.weight * sourceWeight));
        evidence.push({
          conceptId: definition.conceptId,
          dimension: definition.dimension,
          proposedValue: definition.proposedValue,
          matchedPhrase: match.matchedPhrase,
          normalizedTokens: match.normalizedTokens,
          sourceField: field,
          evidenceStrength: fieldScopedStrength,
          weight: fieldScopedWeight,
          reasonCode: definition.reasonCode,
          semanticRole,
          isAffirmative: true,
          requiresConfirmation: fieldScopedStrength !== "strong",
          isDetail: Boolean(source.detail),
        });
      }
    }
  }

  return dedupeEvidence(evidence);
}

export function evidenceToFieldSignals(evidenceRecords = []) {
  const groupMap = {
    businessType: "businessType",
    operatingModel: "operatingModel",
    sector: "sector",
    assetIntensity: "assetIntensity",
    customerModel: "customerModel",
  };

  return evidenceRecords.map((record) => ({
    sourceField: record.sourceField,
    matchedConcept: record.proposedValue,
    group: groupMap[record.dimension] || record.dimension,
    concept: record.proposedValue,
    weight: record.weight,
    reason: record.reasonCode,
    matchedPhrase: record.matchedPhrase,
    evidenceStrength: record.evidenceStrength,
    reasonCode: record.reasonCode,
    semanticRole: record.semanticRole,
    isAffirmative: record.isAffirmative,
    requiresConfirmation: record.requiresConfirmation,
    isDetail: record.isDetail,
  }));
}

function semanticRoleForMatch({ definition, field }) {
  if (definition.conceptId === "real_estate_context") return "business_model_signal";
  if (definition.dimension === "sector") return "customer_industry_signal";
  if (definition.dimension === "operatingModel") return "operating_model_signal";
  if (definition.dimension === "assetIntensity") return "product_object_signal";
  if (definition.dimension === "customerModel") return "customer_industry_signal";
  if (definition.dimension === "businessType" && ["targetCustomer", "problem", "problemSolved"].includes(field)) {
    return "customer_industry_signal";
  }
  return "business_model_signal";
}

export function matchSpecialistEvidence(sourceFields = [], language = "en") {
  const sourceEvidence = [];
  for (const source of sourceFields) {
    const tokenized = tokenizeForClassification(source.value);
    for (const specialist of specialistDefinitions) {
      for (const requirement of specialist.requirements) {
        const matches = matchDefinition(requirement, tokenized);
        for (const match of matches) {
          sourceEvidence.push({
            specialistId: specialist.id,
            label: specialist.label[language] || specialist.label.en,
            requirement: requirement.key,
            matchedPhrase: match.matchedPhrase,
            normalizedTokens: match.normalizedTokens,
            sourceField: source.field,
            evidenceStrength: "strong",
            weight: 3,
            reasonCode: `specialist_${specialist.id}_${requirement.key}`,
            isAffirmative: true,
            requiresConfirmation: false,
          });
        }
      }
    }
  }

  for (const specialist of specialistDefinitions) {
    const evidence = sourceEvidence.filter((record) => record.specialistId === specialist.id);
    const matchedRequirements = new Set(evidence.map((record) => record.requirement));
    if (matchedRequirements.size === specialist.requirements.length) {
      return {
        id: specialist.id,
        label: specialist.label[language] || specialist.label.en,
        confidence: "high",
        evidence,
      };
    }
    if (matchedRequirements.size > 0) {
      return {
        id: specialist.id,
        label: specialist.label[language] || specialist.label.en,
        confidence: "medium",
        evidence,
      };
    }
  }

  return null;
}

export function tokenizeForClassification(value = "") {
  const originalText = String(value || "");
  const normalizedText = normalizeForClassification(originalText);
  const tokens = [];
  let match;
  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(normalizedText)) !== null) {
    tokens.push({
      value: match[0],
      index: match.index,
    });
  }
  return { originalText, normalizedText, tokens };
}

export function normalizeForClassification(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .replace(TATWEEL, "")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/[ى]/gu, "ي")
    .replace(/[ؤ]/gu, "و")
    .replace(/[ئ]/gu, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function hasOperatingModelUncertainty(value = "") {
  const text = normalizeForClassification(value);
  if (!text) return false;

  return (
    hasPhrase(text, [["not", "decided"], ["not", "determined"], ["not", "sure"], ["could", "be"], ["may", "be"], ["might", "be"]]) ||
    hasPhrase(text, [["لم", "احدد"], ["غير", "محدد"], ["لم", "اقرر"], ["لا", "اعرف"], ["قد", "يكون"]]) ||
    (hasAnyToken(text, ["either", "or", "ام", "او", "إما", "اما", "هل", "ربما"]) && hasOperatingAlternativeTokens(text))
  );
}

function hasOperatingAlternativeTokens(text) {
  const tokenValues = tokenizeForClassification(text).tokens.map((token) => token.value);
  const hasFixed = ["fixed", "location", "site", "premises", "موقع", "ثابت", "مقر"].some((token) => tokenValues.includes(token));
  const hasMobile = ["mobile", "customer", "متنقل", "العميل", "لديه", "عنده"].some((token) => tokenValues.includes(token));
  return hasFixed && hasMobile;
}

function hasAnyToken(text, tokens) {
  const tokenValues = tokenizeForClassification(text).tokens.map((token) => token.value);
  const normalizedTokens = tokens.map((token) => normalizeForClassification(token));
  return normalizedTokens.some((token) => tokenValues.includes(token));
}

function hasPhrase(text, phrases) {
  const tokenValues = tokenizeForClassification(text).tokens.map((token) => token.value);
  return phrases.some((phrase) => includesTokenSequence(tokenValues, phrase.map((token) => normalizeForClassification(token))));
}

function matchDefinition(definition, tokenized) {
  const tokenValues = tokenized.tokens.map((token) => token.value);
  const matches = [];
  const disallowed = [...(definition.disallowPhrases || []), ...(definition.arDisallowPhrases || [])]
    .map((phrase) => phrase.map((token) => normalizeForClassification(token)));
  if (disallowed.some((phrase) => includesTokenSequence(tokenValues, phrase))) {
    return [];
  }

  for (const token of [...(definition.tokens || []), ...(definition.arTokens || [])]) {
    const normalizedToken = normalizeForClassification(token);
    if (!normalizedToken) continue;
    tokenValues.forEach((value, index) => {
      if (value === normalizedToken) {
        matches.push(buildMatch(tokenized, index, [normalizedToken]));
      }
    });
  }

  for (const phrase of [...(definition.phrases || []), ...(definition.arPhrases || [])]) {
    const normalizedPhrase = phrase.map((token) => normalizeForClassification(token)).filter(Boolean);
    if (normalizedPhrase.length === 0) continue;
    const index = findTokenSequence(tokenValues, normalizedPhrase);
    if (index >= 0) {
      matches.push(buildMatch(tokenized, index, normalizedPhrase));
    }
  }

  return dedupeMatches(matches);
}

function buildMatch(tokenized, startIndex, normalizedTokens) {
  const matchedPhrase = tokenized.tokens
    .slice(startIndex, startIndex + normalizedTokens.length)
    .map((token) => token.value)
    .join(" ");
  return {
    matchedPhrase,
    normalizedTokens,
  };
}

function findTokenSequence(tokens, phrase) {
  for (let index = 0; index <= tokens.length - phrase.length; index += 1) {
    if (phrase.every((token, offset) => tokens[index + offset] === token)) {
      return index;
    }
  }
  return -1;
}

function includesTokenSequence(tokens, phrase) {
  return findTokenSequence(tokens, phrase) >= 0;
}

function dedupeMatches(matches) {
  const seen = new Set();
  return matches.filter((match) => {
    const key = `${match.matchedPhrase}:${match.normalizedTokens.join("|")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeEvidence(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = [
      record.conceptId,
      record.dimension,
      record.proposedValue,
      record.matchedPhrase,
      record.sourceField,
    ].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
