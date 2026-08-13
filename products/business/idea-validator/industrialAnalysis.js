import { industrialClarificationFields } from "./requestUnderstanding.js";

const labels = {
  en: {
    reportTitle: "Industrial preliminary decision report",
    decision: "Executive decision",
    confidence: "Confidence",
    provided: "Information you provided",
    assumption: "Assumption requiring verification",
    conclusion: "Preliminary conclusion",
    unavailable: "Data not provided",
    customerQuestions: "Customer questions answered",
    configuration: "Project configuration",
    viability: "Viability conditions",
    location: "Location analysis",
    equipment: "Equipment pathway",
    skills: "Skills and operations",
    marketing: "Marketing route",
    economics: "Preliminary economics framework",
    scenarios: "Scenarios",
    risks: "Risks and decision gates",
    actions: "Next action plan",
    disclaimer:
      "This is a preliminary decision-support assessment. It is not a certified feasibility study, supplier quotation, regulatory review, or guarantee of profitability.",
    notCalculated: "Not yet calculated",
  },
  ar: {
    reportTitle: "تقرير القرار الصناعي الأولي",
    decision: "القرار التنفيذي",
    confidence: "مستوى الثقة",
    provided: "معلومات قدمتها",
    assumption: "افتراض يحتاج إلى تحقق",
    conclusion: "استنتاج أولي",
    unavailable: "بيانات غير متوفرة",
    customerQuestions: "الإجابة على أسئلة العميل",
    configuration: "تكوين المشروع",
    viability: "شروط الجدوى",
    location: "تحليل الموقع",
    equipment: "مسار المعدات",
    skills: "المهارات والتشغيل",
    marketing: "مسار التسويق",
    economics: "إطار الاقتصاديات الأولية",
    scenarios: "السيناريوهات",
    risks: "المخاطر وبوابات القرار",
    actions: "خطة العمل التالية",
    disclaimer:
      "هذا تقييم أولي مساعد على اتخاذ القرار، وليس دراسة جدوى معتمدة أو عرض سعر من مورد أو مراجعة نظامية أو ضماناً للربحية.",
    notCalculated: "لم يُحسب بعد",
  },
};

const decisionLabels = {
  en: {
    promising: "Promising enough for detailed feasibility",
    conditional: "Potentially viable with defined conditions",
    notReady: "Not ready for factory investment in its current configuration",
    notAdvisable: "Not advisable in the current configuration",
  },
  ar: {
    promising: "واعد بما يكفي لدراسة جدوى تفصيلية",
    conditional: "قد يكون مجدياً بشروط محددة",
    notReady: "غير جاهز للاستثمار كمصنع بصورته الحالية",
    notAdvisable: "غير مناسب بناءً على أدلة مؤكدة",
  },
};

const confidenceLabels = {
  en: {
    medium: "Medium",
    low: "Low",
  },
  ar: {
    medium: "متوسط",
    low: "منخفض",
  },
};

const outputCopy = {
  sorted_baled: {
    en: "sorted and baled plastic",
    ar: "بلاستيك مفروز ومكبس",
  },
  washed_flakes: {
    en: "washed flakes",
    ar: "رقائق مغسولة",
  },
  pellets: {
    en: "pellets or granules",
    ar: "حبيبات أو جرانول",
  },
  finished_products: {
    en: "finished products",
    ar: "منتجات نهائية",
  },
  unknown: {
    en: "an undefined output",
    ar: "مخرج غير محدد",
  },
};

const optionLabels = industrialClarificationFields.reduce((map, field) => {
  if (field.options) {
    map[field.id] = field.options.reduce((options, option) => {
      options[option.value] = option.label;
      return options;
    }, {});
  }
  return map;
}, {});

export function buildIndustrialPreliminaryAnalysis({ rawInput = {}, requestAssessment = {}, industrialDetails = {}, language = "en" }) {
  const lang = language === "ar" ? "ar" : "en";
  const text = labels[lang];
  const details = normalizeIndustrialDetails(industrialDetails, lang);
  const subtype = identifyIndustrialSubtype(rawInput, details);
  const profile = buildProjectProfile(rawInput, details, lang);
  const requiresWashing = ["washed_flakes", "pellets"].includes(details.intendedOutput.raw);
  const readiness = analyzeIndustrialReadiness(details, lang);
  const configurationRisks = scoreIndustrialConfiguration(details, readiness);
  const decisionKey = chooseDecision(configurationRisks);
  const confidence = buildConfidence(details, configurationRisks, readiness, lang);
  const equipment = buildEquipmentPathway(details.intendedOutput.raw, lang);
  const location = buildLocationAnalysis(details, readiness, requiresWashing, lang);
  const economics = buildEconomicsFramework(details, readiness, lang);
  const report = {
    type: "industrial_preliminary_analysis",
    subtype,
    language: lang,
    direction: lang === "ar" ? "rtl" : "ltr",
    title: text.reportTitle,
    generatedAt: new Date().toISOString(),
    decision: {
      key: decisionKey,
      label: decisionLabels[lang][decisionKey],
      explanation: buildDecisionExplanation(profile, details, readiness, decisionKey, lang),
      confidence,
    },
    evidence: buildEvidenceDiscipline(profile, details, readiness, lang),
    sections: [
      { key: "customerQuestions", title: text.customerQuestions, items: buildCustomerQuestionAnswers(details, profile, readiness, location, equipment, lang) },
      { key: "configuration", title: text.configuration, items: buildConfigurationItems(details, readiness, lang) },
      { key: "viability", title: text.viability, items: buildViabilityConditions(details, profile, readiness, requiresWashing, lang) },
      { key: "location", title: text.location, items: location.items, status: location.status },
      { key: "equipment", title: text.equipment, items: equipment },
      { key: "skills", title: text.skills, groups: buildSkills(details.intendedOutput.raw, lang) },
      { key: "marketing", title: text.marketing, items: buildMarketingRoute(details, readiness, lang) },
      { key: "economics", title: text.economics, status: economics.status, items: economics.items, missing: economics.missing },
      { key: "scenarios", title: text.scenarios, items: buildScenarios(details, economics, readiness, lang) },
      { key: "risks", title: text.risks, groups: buildRisksAndGates(details, readiness, requiresWashing, lang) },
      { key: "actions", title: text.actions, items: buildNextActionPlan(details, readiness, requiresWashing, lang) },
    ],
    disclaimer: text.disclaimer,
    requestedQuestions: requestAssessment.requestedQuestions || [],
  };

  return report;
}

export function buildIndustrialReportText({ report, language = "en" }) {
  const lang = language === "ar" ? "ar" : "en";
  const text = labels[lang];
  const lines = [];

  lines.push(report.title);
  lines.push("");
  lines.push(`${text.decision}: ${report.decision.label}`);
  lines.push(report.decision.explanation);
  lines.push(`${text.confidence}: ${report.decision.confidence.label} - ${report.decision.confidence.reason}`);
  lines.push("");

  report.evidence.forEach((group) => {
    lines.push(`${group.title}:`);
    group.items.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  });

  report.sections.forEach((section) => {
    lines.push(`${section.title}${section.status ? `: ${section.status}` : ""}`);
    if (section.items) {
      section.items.forEach((item) => lines.push(formatTextItem(item)));
    }
    if (section.groups) {
      section.groups.forEach((group) => {
        lines.push(`- ${group.title}`);
        group.items.forEach((item) => lines.push(`  - ${item}`));
      });
    }
    if (section.missing?.length) {
      section.missing.forEach((item) => lines.push(`- ${item}`));
    }
    lines.push("");
  });

  lines.push(report.disclaimer);
  return lines.join("\n");
}

function formatTextItem(item) {
  if (typeof item === "string") return `- ${item}`;
  const detail = item.detail ? `: ${item.detail}` : "";
  const status = item.status ? ` (${item.status})` : "";
  return `- ${item.title}${status}${detail}`;
}

function normalizeIndustrialDetails(details, language) {
  return Object.fromEntries(
    industrialClarificationFields.map((field) => {
      const rawValue = String(details[field.id] || "").trim();
      const label = optionLabels[field.id]?.[rawValue]?.[language] || rawValue;
      return [field.id, { raw: rawValue, label: label || missingLabel(language) }];
    })
  );
}

function identifyIndustrialSubtype(rawInput, details) {
  const combined = `${rawInput.businessIdea || ""} ${rawInput.industry || ""} ${rawInput.problem || ""} ${details.plasticWasteType.raw} ${details.intendedOutput.raw}`;
  return /plastic|بلاستيك|PET|HDPE|LDPE|PP/i.test(combined) ? "plastic_recycling" : "industrial_project";
}

function buildProjectProfile(rawInput, details, language) {
  const idea = String(rawInput.businessIdea || "").split("•")[0].trim();
  const customer = String(rawInput.targetCustomer || "").trim();
  const problem = String(rawInput.problem || "").trim();
  const output = outputCopy[details.intendedOutput.raw]?.[language] || details.intendedOutput.label;
  return {
    idea: clean(idea) || (language === "ar" ? "مشروع إعادة تدوير البلاستيك" : "plastic recycling project"),
    customer: clean(customer) || missingLabel(language),
    problem: clean(problem) || missingLabel(language),
    output,
  };
}

function analyzeIndustrialReadiness(details, language) {
  const budgetAmount = parseMoney(details.availableBudgetSar.raw);
  const lowBudget = budgetAmount !== null && budgetAmount <= 20000;
  const noPremises = ["no", "unknown"].includes(details.existingPremises.raw);
  const noTeam = isNegativeOrUndefined(details.industrialExperienceTeam.raw);
  const informalSupply = isInformalCollection(details.wasteSourceQuantity.raw);
  const verifiedSupply = !informalSupply && hasVerifiedSupplySignal(details.wasteSourceQuantity.raw);
  const buyerMismatch = hasBuyerMaterialMismatch(details);
  const buyerNeedsSpecs = buyerMismatch || !hasBuyerSpecificationSignal(details.expectedBuyers.raw);
  const exportUnvalidated = ["export", "both"].includes(details.salesScope.raw);
  const hasVerifiedQuotations = hasQuotationSignal(`${details.availableBudgetSar.raw} ${details.wasteSourceQuantity.raw} ${details.expectedBuyers.raw}`);
  const budgetNotReady = lowBudget && (noPremises || noTeam || !hasVerifiedQuotations);

  return {
    budgetAmount,
    lowBudget,
    noPremises,
    noTeam,
    informalSupply,
    verifiedSupply,
    buyerMismatch,
    buyerNeedsSpecs,
    exportUnvalidated,
    hasVerifiedQuotations,
    budgetNotReady,
    normalizedSupply: normalizeSupplyDescription(details.wasteSourceQuantity.raw, language),
    normalizedBuyers: normalizeBuyerDescription(details.expectedBuyers.raw, language),
  };
}

function scoreIndustrialConfiguration(details, readiness) {
  const unknowns = [
    details.plasticWasteType.raw === "unknown",
    details.intendedOutput.raw === "unknown",
    details.existingPremises.raw === "unknown",
    details.salesScope.raw === "unknown",
  ].filter(Boolean).length;
  const hasPremises = details.existingPremises.raw === "yes";
  const hasBudget = Boolean(details.availableBudgetSar.raw);
  const hasSupply = details.wasteSourceQuantity.raw.length > 12 && !readiness.informalSupply;
  const hasBuyers = details.expectedBuyers.raw.length > 8 && !readiness.buyerMismatch;
  const complexOutput = ["pellets", "finished_products"].includes(details.intendedOutput.raw);
  const foundationalGaps = [
    readiness.buyerMismatch,
    readiness.informalSupply,
    readiness.budgetNotReady,
    readiness.noPremises,
    readiness.noTeam,
  ].filter(Boolean).length;

  return { unknowns, hasPremises, hasBudget, hasSupply, hasBuyers, complexOutput, foundationalGaps };
}

function chooseDecision(risks) {
  if (risks.foundationalGaps >= 3 || !risks.hasSupply || !risks.hasBuyers || !risks.hasBudget) return "notReady";
  if (risks.complexOutput && !risks.hasPremises) return "conditional";
  return risks.hasPremises ? "promising" : "conditional";
}

function buildConfidence(details, risks, readiness, language) {
  const complete = Object.values(details).filter((item) => item.raw && item.raw !== "unknown").length;
  const level = complete >= 9 && risks.hasSupply && risks.hasBuyers && !readiness.budgetNotReady ? "medium" : "low";
  return {
    level,
    value: level === "medium" ? 68 : 48,
    label: confidenceLabels[language][level],
    reason:
      language === "ar"
        ? level === "medium"
          ? "المعلومات التشغيلية الأساسية متوفرة، لكن الأسعار والتكاليف والاشتراطات النظامية لم تُوثق بعد."
          : "بعض المعلومات الأساسية ما زالت غير محددة، ولا توجد أسعار بيع أو تكاليف تشغيل موثقة."
        : level === "medium"
          ? "Core operating information is available, but prices, costs, and regulatory requirements are not yet documented."
          : "Some key information remains undefined, and no verified selling prices or operating costs are documented.",
  };
}

function buildDecisionExplanation(profile, details, readiness, decisionKey, language) {
  if (language === "ar") {
    if (decisionKey === "promising") {
      return `المشروع يستحق الانتقال إلى دراسة جدوى تفصيلية إذا تم تثبيت توريد ${details.plasticWasteType.label} ووجود مشترين واضحين لمخرج ${profile.output}.`;
    }
    if (decisionKey === "conditional") {
      return `الفكرة قد تكون قابلة للاستثمار، لكن القرار مشروط بإثبات انتظام التوريد، قبول المشترين لجودة ${profile.output}، وملاءمة الموقع والميزانية قبل شراء المعدات.`;
    }
    if (decisionKey === "notReady") {
      const reasons = [
        readiness.buyerMismatch ? "توافق المشترين مع PET" : "",
        readiness.informalSupply ? "موثوقية التوريد" : "",
        readiness.budgetNotReady ? "جاهزية الميزانية" : "",
        readiness.noPremises ? "توفر المقر" : "",
        readiness.noTeam ? "جاهزية فريق التشغيل" : "",
      ].filter(Boolean).join("، ");
      return `المفهوم قد يبقى جديراً بالتحقق، لكنه غير جاهز للاستثمار كمصنع بصورته الحالية. السبب أن عدة شروط تأسيسية ما زالت غير محسومة: ${reasons}.`;
    }
    if (decisionKey === "notAdvisable") {
      return "لا يُنصح بالصيغة الحالية لأن المتطلبات التشغيلية أو المالية لا تبدو متوافقة مع البيانات المتاحة.";
    }
    return `لا يمكن تأكيد الجدوى بعد؛ فالقرار يعتمد على كميات التوريد القابلة للتوثيق، مواصفات المشترين، والأسعار والتكاليف الفعلية لمخرج ${profile.output}.`;
  }

  if (decisionKey === "promising") {
    return `The project is promising enough for detailed feasibility if ${details.plasticWasteType.label} supply is documented and buyers for ${profile.output} are confirmed.`;
  }
  if (decisionKey === "conditional") {
    return `The project may be viable, but the decision depends on reliable supply, buyer acceptance for ${profile.output}, site readiness, and budget fit before equipment is purchased.`;
  }
  if (decisionKey === "notReady") {
    const reasons = [
      readiness.buyerMismatch ? "PET buyer fit" : "",
      readiness.informalSupply ? "supply reliability" : "",
      readiness.budgetNotReady ? "budget readiness" : "",
      readiness.noPremises ? "premises" : "",
      readiness.noTeam ? "team readiness" : "",
    ].filter(Boolean).join(", ");
    return `The concept may still be worth investigating, but it is not ready for factory investment in its current configuration. Several foundation conditions remain unresolved: ${reasons}.`;
  }
  if (decisionKey === "notAdvisable") {
    return "The current configuration is not advisable because the operating or financial requirements do not fit the available evidence.";
  }
  return `Viability cannot be confirmed yet; the decision depends on documented feedstock volume, buyer specifications, and real prices and costs for ${profile.output}.`;
}

function buildEvidenceDiscipline(profile, details, readiness, language) {
  const requiresWashing = ["washed_flakes", "pellets"].includes(details.intendedOutput.raw);
  if (language === "ar") {
    return [
      {
        title: labels.ar.provided,
        items: [
          `المخرج المستهدف: ${profile.output}.`,
          `الموقع المفضل: ${details.preferredCityRegion.label}.`,
          `مصدر المخلفات المتوقع: ${readiness.normalizedSupply}.`,
          `المشترون المتوقعون: ${readiness.normalizedBuyers}.`,
        ],
      },
      {
        title: labels.ar.assumption,
        items: [
          readiness.informalSupply
            ? "التوريد الحالي غير موثق لأنه يعتمد على جمع غير رسمي، لذلك لا يُعامل ككمية مضمونة."
            : "سيتم افتراض أن التوريد والمبيعات يمكن توثيقهما بعقود أو أوامر شراء قبل الاستثمار الكامل.",
        ],
      },
      {
        title: labels.ar.unavailable,
        items: [
          requiresWashing
            ? "أسعار البيع، تكلفة التوريد، تكلفة الكهرباء والمياه والصرف، الإيجار، الرواتب، عروض المعدات، والاشتراطات النظامية غير موثقة بعد."
            : "أسعار البيع، تكلفة التوريد، تكلفة الكهرباء، الإيجار، الرواتب، عروض المعدات، والاشتراطات النظامية غير موثقة بعد.",
        ],
      },
    ];
  }
  return [
    {
      title: labels.en.provided,
      items: [
        `Target output: ${profile.output}.`,
        `Preferred location: ${details.preferredCityRegion.label}.`,
        `Expected waste source: ${readiness.normalizedSupply}.`,
        `Expected buyers: ${readiness.normalizedBuyers}.`,
      ],
    },
    {
      title: labels.en.assumption,
      items: [
        readiness.informalSupply
          ? "The current supply route is not documented because it depends on informal collection, so it is not treated as guaranteed feedstock."
          : "The assessment assumes supply and buyer demand can be documented through contracts, letters, or trial orders before full investment.",
      ],
    },
    {
      title: labels.en.unavailable,
      items: [
        requiresWashing
          ? "Selling prices, feedstock cost, electricity, water, wastewater, rent, labor, equipment quotations, and regulatory requirements are not documented yet."
          : "Selling prices, feedstock cost, electricity, rent, labor, equipment quotations, and regulatory requirements are not documented yet.",
      ],
    },
  ];
}

function buildCustomerQuestionAnswers(details, profile, readiness, location, equipment, language) {
  if (language === "ar") {
    return [
      { title: "الجدوى الأولية", detail: readiness.budgetNotReady || readiness.buyerMismatch || readiness.informalSupply ? `غير جاهز للاستثمار كمصنع الآن. يجب أولاً توثيق التوريد، وتأكيد أن المشترين يقبلون ${details.plasticWasteType.label} بالمواصفة المطلوبة، ومطابقة الميزانية مع عروض حقيقية.` : `قد يكون مشروع ${profile.output} قابلاً للدراسة التفصيلية إذا ثبت توفر مخلفات مناسبة ومشترين يقبلون الجودة. لا توجد حالياً أرقام كافية لتأكيد الربحية.` },
      { title: "الموقع", detail: `${location.status}. تفضيل ${details.preferredCityRegion.label} لا يكفي وحده؛ يجب فحص موقع محدد من حيث الاستخدام الصناعي، حركة الشاحنات، التخزين، الكهرباء، والسلامة${location.requiresWashing ? " والمياه والصرف" : ""}.` },
      { title: "المعدات", detail: `لمخرج ${profile.output} تحتاج البداية إلى ${equipment.slice(0, 4).map((item) => item.title).join("، ")}.${details.intendedOutput.raw === "sorted_baled" ? " الغسيل أو التقطيع مرحلة توسع لاحقة وليست جزءاً من مسار الفرز والكبس الأساسي." : ""}` },
      { title: "مهارات التشغيل", detail: "يحتاج المشروع إلى فرز مواد، تشغيل خط، صيانة أساسية، رقابة جودة، إشراف إنتاج، وسلامة مهنية. المراحل الأعلى تتطلب خبرة أقوى." },
      { title: "التسويق", detail: `لا تُعامل قائمة المشترين كطلب مثبت حتى يوافق مشترٍ على مواصفة ${details.plasticWasteType.label}: اللون، الشوائب، الرطوبة، وزن/أبعاد البالة، الكمية، وشروط التسليم.` },
    ];
  }
  return [
    { title: "Preliminary viability", detail: readiness.budgetNotReady || readiness.buyerMismatch || readiness.informalSupply ? `Not ready for factory investment yet. First document supply, confirm buyers that accept ${details.plasticWasteType.label} specifications, and match the budget to real quotations.` : `${profile.output} may be worth detailed feasibility if suitable feedstock and buyers are documented. Current numbers are not enough to confirm profitability.` },
    { title: "Location", detail: `${location.status}. The preference for ${details.preferredCityRegion.label} is not enough by itself; a specific site must be checked for industrial use, truck access, storage, power, and safety${location.requiresWashing ? ", water, and wastewater" : ""}.` },
    { title: "Equipment", detail: `For ${profile.output}, the starting pathway needs ${equipment.slice(0, 4).map((item) => item.title).join(", ")}.${details.intendedOutput.raw === "sorted_baled" ? " Washing or shredding belongs to a later expansion stage for the sorted/baled workflow." : ""}` },
    { title: "Operating skills", detail: "The project needs material sorting, line operation, basic maintenance, quality control, production supervision, and safety oversight. Higher outputs need stronger technical experience." },
    { title: "Marketing", detail: `Do not treat the buyer list as proven demand until a buyer accepts ${details.plasticWasteType.label} specifications: color mix, contamination, moisture, bale weight/dimensions, quantity, and delivery terms.` },
  ];
}

function buildConfigurationItems(details, readiness, language) {
  const fields = [
    "plasticWasteType",
    "intendedOutput",
    "targetProductionCapacity",
    "availableBudgetSar",
    "preferredCityRegion",
    "existingPremises",
    "wasteSourceQuantity",
    "industrialExperienceTeam",
    "expectedBuyers",
    "salesScope",
  ];

  return fields.map((fieldId) => {
    const field = industrialClarificationFields.find((item) => item.id === fieldId);
    const normalized =
      fieldId === "wasteSourceQuantity"
        ? readiness.normalizedSupply
        : fieldId === "expectedBuyers"
          ? readiness.normalizedBuyers
          : fieldId === "industrialExperienceTeam" && readiness.noTeam
            ? language === "ar" ? "لا توجد خبرة صناعية أو فريق تشغيل محدد" : "No defined industrial experience or operating team"
            : details[fieldId].label;
    return {
      title: field.label[language] || field.label.en,
      detail: normalized,
    };
  });
}

function buildViabilityConditions(details, profile, readiness, requiresWashing, language) {
  if (language === "ar") {
    return [
      { title: "موثوقية التوريد ونظافته", status: readiness.informalSupply ? "غير موثق" : "افتراض يحتاج إلى تحقق", detail: readiness.informalSupply ? "المصدر المقترح حالياً هو جمع العبوات المستعملة بواسطة عمالة من الحاويات والأماكن العامة، دون اتفاقيات توريد موثقة. هذا يخلق مخاطر في الكمية والاستمرارية والتلوث والسلامة والتخزين والنقل." : `يجب إثبات أن ${readiness.normalizedSupply} كافية ونظيفة بما يناسب ${profile.output}.` },
      { title: "ملاءمة الكمية للطاقة المستهدفة", status: "افتراض يحتاج إلى تحقق", detail: `قارِن الكمية المتاحة بالطاقة المستهدفة: ${details.targetProductionCapacity.label}.` },
      { title: "توافق المشترين مع المادة", status: readiness.buyerMismatch ? "تعارض يحتاج تحققاً" : "افتراض يحتاج إلى تحقق", detail: readiness.buyerMismatch ? "هناك احتمال عدم توافق بين PET المفروز/المكبس ومصانع أكياس النفايات أو التسوق؛ فهذه المنتجات تعتمد غالباً على درجات بوليمر أخرى. يلزم الحصول على مواصفات مادة واضحة من مشترٍ يقبل PET قبل اعتبار الطلب مثبتاً." : `لا يكفي وجود مشترين محتملين؛ يجب الحصول على مواصفة قبول أو طلب تجربة من ${readiness.normalizedBuyers}.` },
      { title: "ثبات الجودة", status: "شرط أساسي", detail: "أي تفاوت في النظافة أو الرطوبة أو اللون أو الخلط قد يؤدي إلى رفض المخرج أو خفض سعره." },
      { title: "تعقيد التشغيل", status: "يعتمد على المخرج", detail: buildComplexityText(details.intendedOutput.raw, language) },
      { title: "جاهزية الميزانية", status: readiness.budgetNotReady ? "غير جاهزة للاستثمار كمصنع" : "تحتاج تحققاً مالياً", detail: readiness.budgetNotReady ? `الميزانية الحالية ${details.availableBudgetSar.label} لم يثبت أنها تغطي مقر التشغيل، الجمع والنقل، الفرز، الكبس، الخدمات، العمالة، السلامة، ورأس المال العامل. قد تكون أقرب إلى تجربة جمع وفرز محدودة إذا دعمتها عروض موثقة.` : `الميزانية المتاحة هي ${details.availableBudgetSar.label}، لكنها لا تكفي وحدها دون عروض معدات وتكاليف تشغيل.` },
      { title: "الموقع واللوجستيات", status: "قابل للتقييم", detail: `الموقع المقترح ${details.preferredCityRegion.label} يحتاج تحققاً من النقل والتخزين والخدمات${requiresWashing ? " والمياه والصرف" : ""}.` },
      { title: "جاهزية الفريق", status: readiness.noTeam ? "غير جاهز" : "افتراض يحتاج إلى تحقق", detail: readiness.noTeam ? "لم تُذكر خبرة صناعية أو فريق تشغيل محدد، وهذا يجعل شراء المعدات خطوة مبكرة قبل بناء قدرة تشغيلية." : `الفريق/الخبرة: ${details.industrialExperienceTeam.label}.` },
    ];
  }
  return [
    { title: "Feedstock reliability and cleanliness", status: readiness.informalSupply ? "Not documented" : "Assumption requiring verification", detail: readiness.informalSupply ? "The proposed source is workers collecting used bottles from bins and public areas without documented supply agreements. This creates quantity, continuity, contamination, safety, storage, and transport risk." : `${readiness.normalizedSupply} must be enough and clean enough for ${profile.output}.` },
    { title: "Supply fit with capacity", status: "Assumption requiring verification", detail: `Compare available supply with the target capacity: ${details.targetProductionCapacity.label}.` },
    { title: "Buyer fit with material", status: readiness.buyerMismatch ? "Mismatch requiring verification" : "Assumption requiring verification", detail: readiness.buyerMismatch ? "There may be a mismatch between sorted/baled PET and garbage or shopping bag factories, which commonly use other polymer grades. Get material specifications from a PET-accepting buyer before treating demand as validated." : `Potential buyers are not enough; get acceptance specs or trial orders from ${readiness.normalizedBuyers}.` },
    { title: "Quality consistency", status: "Core condition", detail: "Variation in contamination, moisture, color, or material mix can cause rejection or lower prices." },
    { title: "Operating complexity", status: "Depends on output", detail: buildComplexityText(details.intendedOutput.raw, language) },
    { title: "Budget readiness", status: readiness.budgetNotReady ? "Not ready for factory investment" : "Financially unconfirmed", detail: readiness.budgetNotReady ? `The current budget, ${details.availableBudgetSar.label}, has not been shown to support premises, collection/logistics, sorting, baling equipment, utilities, labor, safety, and working capital. It may fit a limited validation or collection/sorting pilot if quotations support it.` : `The available budget is ${details.availableBudgetSar.label}, but equipment quotations and operating costs are still required.` },
    { title: "Location and logistics fit", status: "Assessable", detail: `The selected location, ${details.preferredCityRegion.label}, must be checked for logistics, storage, utilities${requiresWashing ? ", water, and wastewater" : ""}.` },
    { title: "Team readiness", status: readiness.noTeam ? "Not ready" : "Assumption requiring verification", detail: readiness.noTeam ? "No industrial experience or operating team is defined, so equipment purchase would be premature before operating capability is set." : `Team/experience: ${details.industrialExperienceTeam.label}.` },
  ];
}

function buildComplexityText(output, language) {
  const ar = {
    sorted_baled: "الفرز والكبس هو المسار الأبسط نسبياً، لكنه يعتمد بقوة على جودة الفرز والتخزين وحماية المواد من التلوث.",
    washed_flakes: "الرقائق المغسولة تحتاج ضبط غسيل وتجفيف وجودة مياه وصرف.",
    pellets: "التحبيب أكثر تعقيداً لأنه يضيف البثق والترشيح والتحكم في الجودة الحرارية.",
    finished_products: "المنتجات النهائية هي الأعلى تعقيداً لأنها تضيف تشكيل المنتج والقوالب ومواصفات الاستخدام النهائي.",
    unknown: "لا يمكن تقدير التعقيد بدقة قبل تحديد المخرج النهائي.",
  };
  const en = {
    sorted_baled: "Sorting and baling are the simpler pathway, but depend heavily on sorting quality, storage discipline, and contamination control.",
    washed_flakes: "Washed flakes require control of washing, drying, water quality, and wastewater handling.",
    pellets: "Pelletizing is more complex because it adds extrusion, filtration, thermal control, and tighter quality control.",
    finished_products: "Finished products are the most complex because they add forming, tooling, and end-use specifications.",
    unknown: "Complexity cannot be estimated well until the final output is selected.",
  };
  return (language === "ar" ? ar : en)[output] || (language === "ar" ? ar.unknown : en.unknown);
}

function buildLocationAnalysis(details, readiness, requiresWashing, language) {
  const hasLocation = details.preferredCityRegion.raw && details.preferredCityRegion.raw !== "unknown";
  const hasPremises = details.existingPremises.raw === "yes";
  const status = language === "ar"
    ? hasLocation
      ? hasPremises
        ? "مناسب من حيث المبدأ"
        : "مناسب بشروط بعد تحديد موقع فعلي"
      : "معلومات غير كافية"
    : hasLocation
      ? hasPremises
        ? "Suitable in principle"
        : "Suitable with conditions after a specific site is identified"
      : "Insufficient information";

  const items = language === "ar"
    ? [
        { title: "القرب من مصدر المخلفات", detail: readiness.informalSupply ? "لا يمكن تقييم اللوجستيات بدقة قبل تحويل الجمع من الحاويات والأماكن العامة إلى ترتيب توريد محدد ومصرح به حيث يلزم." : "كلما قصرت مسافة نقل المخلفات زادت فرصة التحكم في التكلفة والانتظام." },
        { title: "القرب من المشترين", detail: "القرب من المصانع المشترية يقلل وقت التسليم ويجعل أوامر التجربة أسهل." },
        { title: "الملاءمة الصناعية", detail: requiresWashing ? "يجب التأكد من أن الموقع يسمح بنشاط فرز وغسيل البلاستيك حسب المخرج المختار." : "يجب التأكد من أن الموقع يسمح بنشاط فرز وكبس وتخزين البلاستيك." },
        { title: "الكهرباء والخدمات", detail: "المشروع يحتاج قدرة كهربائية مستقرة، وتزداد الأهمية مع التحبيب أو المنتجات النهائية." },
        ...(requiresWashing ? [{ title: "المياه والصرف", detail: "الغسيل يتطلب توفر مياه ومعالجة أو تصريفاً مناسباً للمياه الناتجة." }] : []),
        { title: "دخول الشاحنات والتخزين", detail: "يجب توفير حركة شاحنات آمنة ومساحة لاستلام وفرز وتخزين المخلفات والمخرج النهائي." },
        { title: "السلامة والبيئة", detail: "يجب مراجعة متطلبات السلامة والحريق والبيئة محلياً قبل الالتزام بالموقع، دون افتراض أن المدينة وحدها تكفي للحكم." },
      ]
    : [
        { title: "Proximity to waste supply", detail: readiness.informalSupply ? "Logistics cannot be assessed reliably until street/bin collection is converted into a defined supply arrangement with authorization or access where needed." : "Shorter feedstock transport improves cost control and supply reliability." },
        { title: "Proximity to buyers", detail: "Being near buyer factories makes trial orders and repeat delivery easier." },
        { title: "Industrial zoning suitability", detail: requiresWashing ? "Confirm the site permits plastic sorting and washing for the selected output." : "Confirm the site permits plastic sorting, baling, and storage." },
        { title: "Power and utilities", detail: "Stable electricity matters, especially for pelletizing or finished-product conversion." },
        ...(requiresWashing ? [{ title: "Water and wastewater", detail: "Washing requires water availability and suitable wastewater handling." }] : []),
        { title: "Truck access and storage", detail: "The site needs safe truck movement and space for receiving, sorting, storage, and dispatch." },
        { title: "Environmental and safety requirements", detail: "Local safety, fire, and environmental requirements must be reviewed before committing to a site; the city name alone is not enough." },
      ];

  return { status, items, requiresWashing };
}

function buildEquipmentPathway(output, language) {
  const t = language === "ar" ? equipmentAr : equipmentEn;
  const common = [t.receiving, t.sorting, t.contamination, t.storage];
  if (output === "sorted_baled") return [t.collectionLogistics, t.receiving, t.sorting, t.contamination, t.baling, t.materialHandling, t.storage, t.safety, t.laterWashingShredding];
  if (output === "washed_flakes") return [t.receiving, t.sorting, t.shredding, t.washing, t.separation, t.drying, t.quality, t.packing];
  if (output === "pellets") return [t.receiving, t.sorting, t.shredding, t.washing, t.drying, t.extrusion, t.filtration, t.pelletizing, t.cooling, t.quality, t.packing];
  if (output === "finished_products") return [t.receiving, t.sorting, t.preparedMaterial, t.conversion, t.tooling, t.productQuality, t.packing];
  return common;
}

const equipmentEn = {
  collectionLogistics: { title: "Collection containers and logistics", status: "Core", detail: "Defines how bottles are collected, moved, and stored before sorting; requires route discipline and safe handling." },
  receiving: { title: "Collection and receiving", status: "Core", detail: "Receives, weighs, and records incoming plastic; needs basic logistics control." },
  sorting: { title: "Sorting", status: "Core", detail: "Separates plastic by type, color, and quality; requires trained material identification." },
  contamination: { title: "Contamination removal", status: "Core", detail: "Removes labels, dirt, metals, and unsuitable materials; affects buyer acceptance." },
  baling: { title: "Baling", status: "Core", detail: "Compresses sorted material for storage and transport; requires simple mechanical maintenance." },
  materialHandling: { title: "Material handling", status: "Core", detail: "Moves bags, bottles, and bales safely inside the site; affects labor needs and damage control." },
  safety: { title: "Basic safety and fire controls", status: "Core", detail: "Needed for storage, worker safety, housekeeping, and fire-risk reduction." },
  laterWashingShredding: { title: "Washing or shredding", status: "Later expansion", detail: "Not part of the basic sorted/baled workflow unless buyers require upgraded output." },
  storage: { title: "Storage and dispatch", status: "Core", detail: "Keeps input and output separated and dry; needs warehouse discipline." },
  shredding: { title: "Size reduction / shredding", status: "Core", detail: "Reduces material size before washing or processing; requires blade and motor maintenance." },
  washing: { title: "Washing", status: "Core", detail: "Removes contamination; adds water, wastewater, drying, and quality-control requirements." },
  separation: { title: "Material separation", status: "Conditional", detail: "Needed when density or material separation is required for buyer specs." },
  drying: { title: "Dewatering and drying", status: "Core", detail: "Controls moisture before packing or extrusion; poor drying can reduce saleability." },
  quality: { title: "Quality control", status: "Core", detail: "Checks contamination, moisture, color, and material consistency." },
  packing: { title: "Packing", status: "Core", detail: "Packages output according to buyer handling and storage requirements." },
  extrusion: { title: "Extrusion", status: "Expansion after preparation", detail: "Melts and processes material into strands or melt flow; needs experienced operation." },
  filtration: { title: "Melt filtration", status: "Core for pellets", detail: "Removes remaining contaminants during extrusion; affects pellet quality." },
  pelletizing: { title: "Pelletizing", status: "Core for pellets", detail: "Cuts processed plastic into granules; requires steady line control." },
  cooling: { title: "Cooling and drying", status: "Core for pellets", detail: "Stabilizes pellets before packing; needs process control." },
  preparedMaterial: { title: "Prepared recycled material", status: "Core", detail: "Use purchased pellets/flakes or prepare material in-house before conversion." },
  conversion: { title: "Forming or conversion process", status: "Core", detail: "Depends on the finished product, such as injection, extrusion, or molding." },
  tooling: { title: "Molds or tooling", status: "Conditional", detail: "Required when the finished product needs a mold, die, or custom tooling." },
  productQuality: { title: "Product-specific quality control", status: "Core", detail: "Checks dimensions, strength, finish, and buyer/end-user requirements." },
};

const equipmentAr = {
  collectionLogistics: { title: "حاويات الجمع واللوجستيات", status: "أساسي", detail: "تحديد طريقة جمع العبوات ونقلها وتخزينها قبل الفرز؛ يحتاج مسار جمع منضبطاً وتعاملاً آمناً." },
  receiving: { title: "الجمع والاستلام", status: "أساسي", detail: "استلام ووزن وتسجيل المخلفات الداخلة؛ يحتاج ضبطاً بسيطاً للوجستيات." },
  sorting: { title: "الفرز", status: "أساسي", detail: "فصل البلاستيك حسب النوع واللون والجودة؛ يحتاج تدريباً على تمييز المواد." },
  contamination: { title: "إزالة الشوائب", status: "أساسي", detail: "إزالة الملصقات والأوساخ والمعادن والمواد غير المناسبة؛ وهذا يؤثر مباشرة في قبول المشترين." },
  baling: { title: "الكبس", status: "أساسي", detail: "ضغط المواد المفروزة للتخزين والنقل؛ يحتاج صيانة ميكانيكية بسيطة." },
  materialHandling: { title: "مناولة المواد", status: "أساسي", detail: "تحريك الأكياس والعبوات والبالات داخل الموقع بأمان؛ يؤثر في احتياج العمالة وتقليل التلف." },
  safety: { title: "السلامة الأساسية ومكافحة الحريق", status: "أساسي", detail: "مطلوبة للتخزين وسلامة العاملين والنظافة التشغيلية وتقليل مخاطر الحريق." },
  laterWashingShredding: { title: "الغسيل أو التقطيع", status: "توسع لاحق", detail: "ليست جزءاً من مسار الفرز والكبس الأساسي إلا إذا طلب المشترون مخرجاً أعلى." },
  storage: { title: "التخزين والشحن", status: "أساسي", detail: "فصل المدخلات والمخرجات وحمايتها من الرطوبة؛ يحتاج انضباطاً في المستودع." },
  shredding: { title: "التقطيع أو الطحن", status: "أساسي", detail: "تصغير حجم البلاستيك قبل الغسيل أو المعالجة؛ يحتاج صيانة للشفرات والأجزاء الميكانيكية." },
  washing: { title: "الغسيل", status: "أساسي", detail: "إزالة الشوائب؛ ويضيف متطلبات للمياه والصرف والتجفيف وضبط الجودة." },
  separation: { title: "الفصل حسب المادة", status: "مشروط", detail: "يلزم عندما تتطلب مواصفات المشتري فصلاً بالكثافة أو النوع." },
  drying: { title: "نزع الماء والتجفيف", status: "أساسي", detail: "ضبط الرطوبة قبل التعبئة أو التحبيب؛ التجفيف الضعيف قد يقلل قابلية البيع." },
  quality: { title: "رقابة الجودة", status: "أساسي", detail: "فحص الشوائب والرطوبة واللون وثبات نوع المادة." },
  packing: { title: "التعبئة", status: "أساسي", detail: "تعبئة المخرج بما يناسب طريقة تخزين ومناولة المشتري." },
  extrusion: { title: "البثق", status: "توسع بعد التحضير", detail: "صهر ومعالجة المادة قبل التحبيب؛ يحتاج مشغلاً لديه خبرة." },
  filtration: { title: "ترشيح المصهور", status: "أساسي للتحبيب", detail: "إزالة الشوائب المتبقية أثناء البثق؛ ويؤثر في جودة الحبيبات." },
  pelletizing: { title: "التحبيب", status: "أساسي للتحبيب", detail: "تقطيع البلاستيك المعالج إلى حبيبات؛ يحتاج ضبطاً ثابتاً للخط." },
  cooling: { title: "التبريد والتجفيف", status: "أساسي للتحبيب", detail: "تثبيت الحبيبات قبل التعبئة؛ يحتاج ضبطاً للعملية." },
  preparedMaterial: { title: "مادة معاد تدويرها مجهزة", status: "أساسي", detail: "إما شراء حبيبات/رقائق جاهزة أو تجهيز المادة داخلياً قبل التصنيع." },
  conversion: { title: "عملية التشكيل أو التصنيع", status: "أساسي", detail: "تختلف حسب المنتج النهائي، مثل الحقن أو البثق أو القولبة." },
  tooling: { title: "القوالب أو العدد", status: "مشروط", detail: "تلزم عندما يحتاج المنتج النهائي إلى قالب أو أداة تشكيل خاصة." },
  productQuality: { title: "رقابة جودة المنتج النهائي", status: "أساسي", detail: "فحص المقاسات والمتانة والتشطيب ومتطلبات المشتري أو المستخدم النهائي." },
};

function buildSkills(output, language) {
  const setupSkillAr =
    output === "sorted_baled"
      ? "إعداد منطقة الفرز والكبس والتخزين"
      : output === "finished_products"
        ? "إعداد عملية التصنيع ومتطلبات المنتج النهائي"
        : "إعداد خط الغسيل أو التحبيب";
  const setupSkillEn =
    output === "sorted_baled"
      ? "Sorting, baling, and storage setup"
      : output === "finished_products"
        ? "Conversion setup and end-product requirements"
        : "Washing or pelletizing line setup";
  if (language === "ar") {
    return [
      { title: "مهارات مطلوبة من البداية", items: ["فرز المواد وتمييز أنواع البلاستيك", "تشغيل الخط اليومي", "صيانة ميكانيكية وكهربائية أساسية", "رقابة جودة للمدخلات والمخرجات", "إشراف إنتاج وسلامة مهنية", "شراء وتوريد ولوجستيات", "بيع مباشر للمشترين الصناعيين"] },
      { title: "مهارات يمكن تدريبها", items: ["إجراءات الفرز", "التعبئة والتخزين", "تسجيل الكميات والجودة", "التعامل مع أوامر التجربة"] },
      { title: "مهارات قد تحتاج خبيراً", items: [setupSkillAr, "ضبط الجودة للمواصفات الصناعية", ...(output === "finished_products" ? ["تصميم القوالب ومتطلبات المنتج النهائي"] : [])] },
    ];
  }
  return [
    { title: "Required from launch", items: ["Material sorting and plastic identification", "Daily line operation", "Basic mechanical and electrical maintenance", "Input and output quality control", "Production and safety supervision", "Procurement and logistics", "Direct B2B sales"] },
    { title: "Trainable skills", items: ["Sorting procedures", "Packing and storage", "Quantity and quality recording", "Handling trial orders"] },
    { title: "May require an experienced hire", items: [setupSkillEn, "Industrial specification quality control", ...(output === "finished_products" ? ["Tooling design and end-product requirements"] : [])] },
  ];
}

function buildMarketingRoute(details, readiness, language) {
  if (language === "ar") {
    return [
      `حدد مواصفة بيع واضحة لـ ${outputCopy[details.intendedOutput.raw]?.ar || details.intendedOutput.label}: النوع، اللون، نسبة الشوائب، الرطوبة، وطريقة التعبئة حسب المخرج.`,
      readiness.buyerMismatch
        ? "لا تعتمد على مصانع أكياس النفايات أو التسوق كمشترين مثبتين قبل التأكد أنهم يقبلون PET كبالات أو لديهم مسار معالجة مناسب له."
        : `جهّز عينة صغيرة وبيانات جودة مختصرة قبل عرضها على ${readiness.normalizedBuyers}.`,
      "اطلب قبول عينة أو عملية بيع تجريبية قبل الالتزام بشراء معدات المصنع.",
      "اتفق مع المشتري على درجة ثابتة ومتطلبات تغليف وتسليم وجدول توريد.",
      readiness.exportUnvalidated
        ? "اعتبر التصدير مساراً لاحقاً حتى تثبت الكمية والجودة واللوجستيات ومتطلبات المشتري."
        : "ابدأ بمشترين محليين قريبين لتقليل مخاطر الجودة واللوجستيات في التجارب الأولى.",
    ];
  }
  return [
    `Define a clear selling specification for ${outputCopy[details.intendedOutput.raw]?.en || details.intendedOutput.label}: material type, color, contamination, moisture, and packaging.`,
    readiness.buyerMismatch
      ? "Do not rely on garbage or shopping bag factories as validated buyers until they confirm they accept PET bales or have a process that uses PET feedstock."
      : `Prepare a small sample and basic quality data before approaching ${readiness.normalizedBuyers}.`,
    "Seek sample acceptance or a trial transaction before committing to factory equipment.",
    "Agree on consistent grade, packaging, delivery, and supply schedule requirements.",
    readiness.exportUnvalidated
      ? "Treat export as a later route until volume, quality, logistics, and buyer requirements are established."
      : "Start with nearby local buyers to reduce quality and logistics risk during early trials.",
  ];
}

function buildEconomicsFramework(details, readiness, language) {
  const requiresWashing = ["washed_flakes", "pellets"].includes(details.intendedOutput.raw);
  const missing = language === "ar"
    ? [
        "سعر بيع الوحدة حسب المخرج والمواصفة",
        "تكلفة شراء أو جمع المخلفات لكل وحدة",
        requiresWashing ? "نسبة الفاقد بعد الفرز أو الغسيل" : "نسبة الفاقد بعد الفرز والكبس",
        requiresWashing ? "تكلفة الكهرباء والمياه والصرف" : "تكلفة الكهرباء والتشغيل",
        "العمالة والصيانة والمواد الاستهلاكية",
        "الإيجار أو تكلفة المقر",
        "تكلفة النقل والتخلص من المخلفات غير الصالحة",
        "عروض معدات مطابقة للطاقة والمخرج",
      ]
    : [
        "Selling price per unit by output and specification",
        "Feedstock purchase or collection cost per unit",
        requiresWashing ? "Yield loss after sorting or washing" : "Yield loss after sorting and baling",
        requiresWashing ? "Electricity, water, and wastewater costs" : "Electricity and operating costs",
        "Labor, maintenance, and consumables",
        "Rent or premises cost",
        "Logistics and unusable-waste disposal cost",
        "Equipment quotations matched to output and capacity",
      ];
  const items = language === "ar"
    ? [
        `الطاقة المستهدفة: ${details.targetProductionCapacity.label}.`,
        `الميزانية المتاحة: ${details.availableBudgetSar.label}.`,
        readiness.budgetNotReady
          ? "هذه الميزانية لم يثبت أنها تغطي تكوين مصنع يشمل المقر واللوجستيات والمعدات والعمالة والسلامة ورأس المال العامل؛ تعامل معها كميزانية تحقق أو تجربة محدودة إلى أن تظهر عروض موثقة."
          : "يجب مطابقة الميزانية مع عروض معدات وموقع وتشغيل موثقة قبل قرار الاستثمار.",
        "المعادلة المطلوبة: الكمية المتاحة × نسبة العائد الصالح = المخرج القابل للبيع.",
        requiresWashing
          ? "ثم تُطرح تكلفة المخلفات والطاقة والمياه والعمالة والنقل والصيانة والإيجار والتخلص من الفاقد للوصول إلى نتيجة التشغيل."
          : "ثم تُطرح تكلفة المخلفات والطاقة والعمالة والنقل والصيانة والإيجار والتخلص من الفاقد للوصول إلى نتيجة التشغيل.",
        "نقطة التعادل = التكاليف الثابتة ÷ هامش المساهمة لكل وحدة.",
      ]
    : [
        `Target capacity: ${details.targetProductionCapacity.label}.`,
        `Available budget: ${details.availableBudgetSar.label}.`,
        readiness.budgetNotReady
          ? "This budget has not been shown to support a factory setup covering premises, logistics, equipment, labor, safety, and working capital; treat it as a validation or limited pilot budget until quotations prove otherwise."
          : "Match the budget to documented equipment, site, and operating quotations before making the investment decision.",
        "Required formula: available feedstock x usable yield = saleable output.",
        requiresWashing
          ? "Then subtract feedstock, power, water, labor, logistics, maintenance, rent, and waste-disposal costs to estimate operating result."
          : "Then subtract feedstock, power, labor, logistics, maintenance, rent, and waste-disposal costs to estimate operating result.",
        "Break-even volume = fixed costs divided by contribution margin per unit.",
      ];

  return { status: labels[language].notCalculated, items, missing };
}

function buildScenarios(details, economics, readiness, language) {
  if (language === "ar") {
    return [
      { title: "متحفظ", detail: readiness.informalSupply || readiness.buyerMismatch ? "يبقى المشروع عند تجربة جمع وفرز محدودة، لأن التوريد أو قبول المشتري غير مثبت. القرار: لا تشترِ معدات مصنع قبل معالجة السبب." : "توريد أقل من المتوقع، فاقد أعلى، قبول محدود من المشترين، وسعر بيع منخفض. القرار: لا تتوسع قبل معالجة السبب." },
      { title: "أساسي", detail: "توريد منتظم، جودة مقبولة، ومشترون يقبلون عملية تجربة بسعر يغطي التكلفة المتغيرة. القرار: انتقل لدراسة جدوى تفصيلية." },
      { title: "متفائل", detail: "توريد موثق، جودة ثابتة، ومشترون متكررون. القرار: ادرس التوسع أو رفع المخرج إلى مرحلة أعلى بعد إثبات التشغيل." },
      { title: "الحساب الرقمي", detail: `${economics.status}: لا توجد أسعار وتكاليف موثقة كافية لبناء سيناريوهات مالية رقمية.` },
    ];
  }
  return [
    { title: "Conservative", detail: readiness.informalSupply || readiness.buyerMismatch ? "Keep the project at a limited collection/sorting pilot because supply or buyer acceptance is not proven. Decision: do not buy factory equipment until the cause is addressed." : "Lower supply, higher losses, limited buyer acceptance, and lower selling price. Decision: do not expand until the cause is addressed." },
    { title: "Base", detail: "Reliable supply, acceptable quality, and buyers accepting a trial transaction at prices covering variable cost. Decision: move to detailed feasibility." },
    { title: "Upside", detail: "Documented supply, consistent quality, and repeat buyers. Decision: consider expansion or a higher-output stage after operations are proven." },
    { title: "Numeric calculation", detail: `${economics.status}: verified prices and costs are not available, so numeric financial scenarios are not produced.` },
  ];
}

function buildRisksAndGates(details, readiness, requiresWashing, language) {
  if (language === "ar") {
    return [
      { title: "مخاطر المشروع", items: [readiness.informalSupply ? "التوريد غير موثق ويعتمد على جمع غير رسمي قد يتذبذب في الكمية والجودة" : "نقص أو تلوث المخلفات الداخلة", readiness.buyerMismatch ? "احتمال عدم توافق PET مع المشترين المذكورين إذا كانوا ينتجون أكياساً من درجات أخرى" : "رفض المخرج بسبب عدم ثبات الجودة", "تشغيل النشاط بطاقة أقل من المخطط", ...(requiresWashing ? ["قيود المياه أو الصرف"] : []), "اختيار معدات لا تناسب المخرج أو الطاقة", "ضغط رأس المال العامل", "الاعتماد على عدد قليل من المشترين"] },
      { title: "بوابات قرار قبل الاستثمار الكامل", items: ["تحديد الطاقة بفترة زمنية واضحة", "توثيق حد أدنى من توفر المخلفات بترتيب توريد محدد", "قبول عينة أو مواصفة PET من مشترٍ مناسب واحد على الأقل", "عروض معدات مطابقة للمخرج والطاقة والميزانية", "تأكيد ملاءمة موقع محدد للخدمات والسلامة والتخزين والبيئة", "إكمال حساب اقتصاديات الوحدة ونقطة التعادل"] },
    ];
  }
  return [
    { title: "Project-specific risks", items: [readiness.informalSupply ? "Supply is undocumented and depends on informal collection that may vary in quantity and quality" : "Feedstock shortage or contamination", readiness.buyerMismatch ? "PET may not fit the listed bag manufacturers if their products use other polymer grades" : "Output rejected because of inconsistent quality", "Underused operating capacity", ...(requiresWashing ? ["Water or wastewater constraints"] : []), "Equipment mismatch with output or capacity", "Working-capital pressure", "Dependence on too few buyers"] },
    { title: "Go/no-go gates before full investment", items: ["Capacity stated with a clear time period", "Minimum documented feedstock availability through a defined supply arrangement", "PET sample/specification acceptance from at least one suitable buyer", "Equipment quotations matched to output, capacity, and budget", "Specific site suitability for utilities, safety, storage, and environment", "Completed unit-economics and break-even calculation"] },
  ];
}

function buildNextActionPlan(details, readiness, requiresWashing, language) {
  if (language === "ar") {
    return [
      { title: "حوّل التوريد إلى ترتيب محدد", detail: readiness.informalSupply ? "استبدل الاعتماد على الجمع من الحاويات والأماكن العامة باتفاق أو إذن أو مصدر منتظم يوضح الكمية والنوع. هذا يفتح قرار هل توجد مادة كافية قبل شراء المعدات." : `احصل على عرض أو خطاب نية يوضح كمية ونوع ${details.plasticWasteType.label}. هذا يفتح قرار الطاقة الإنتاجية المناسبة.` },
      { title: "اختبر قبول المشتري المناسب", detail: readiness.buyerMismatch ? "اسأل مشتري PET مباشر عن قبول بالات PET: اللون، الشوائب، الرطوبة، وزن/أبعاد البالة، الكمية، وسعر التجربة. هذا يفتح قرار هل المشترون المذكورون مناسبون فعلاً." : `اعرض عينة أو مواصفة لـ ${outputCopy[details.intendedOutput.raw]?.ar || details.intendedOutput.label} على ${readiness.normalizedBuyers}. هذا يفتح قرار المخرج والسعر.` },
      { title: "طابق الميزانية مع تجربة محدودة أولاً", detail: readiness.budgetNotReady ? "استخدم الميزانية الحالية لاختبار جمع وفرز وبيع كمية صغيرة فقط، ثم اطلب عروضاً للمقر والكبس والنقل والعمالة والسلامة. هذا يفتح قرار الانتقال من تجربة إلى مصنع." : "اطلب عروض معدات مبنية على المخرج والطاقة وليس على اسم المشروع فقط. هذا يفتح قرار الميزانية." },
      { title: "افحص الموقع", detail: `راجع الكهرباء ودخول الشاحنات والتخزين${requiresWashing ? " والمياه والصرف" : ""}. هذا يفتح قرار صلاحية الموقع.` },
      { title: "أكمل اقتصاديات الوحدة", detail: "اجمع سعر البيع وتكلفة التوريد والفواقد والتشغيل. هذا يفتح قرار المتابعة أو التوقف." },
    ];
  }
  return [
    { title: "Convert supply into a defined arrangement", detail: readiness.informalSupply ? "Replace reliance on street/bin collection with an agreement, authorization, or regular source that states quantity and material type. This unlocks whether enough feedstock exists before equipment purchase." : `Obtain a quotation or letter of intent showing quantity and type of ${details.plasticWasteType.label}. This unlocks the capacity decision.` },
    { title: "Test the right buyer acceptance", detail: readiness.buyerMismatch ? "Ask a direct PET buyer about accepting PET bales: color mix, contamination, moisture, bale weight/dimensions, quantity, and trial price. This unlocks whether the listed buyers fit the material." : `Present a sample or specification for ${outputCopy[details.intendedOutput.raw]?.en || details.intendedOutput.label} to ${readiness.normalizedBuyers}. This unlocks the output and pricing decision.` },
    { title: "Match the budget to a limited pilot first", detail: readiness.budgetNotReady ? "Use the current budget to test collection, sorting, and one small sale, then obtain quotations for premises, baling, transport, labor, and safety. This unlocks the pilot-to-factory decision." : "Request equipment quotations based on output and capacity, not the project name alone. This unlocks the budget decision." },
    { title: "Check the site", detail: `Review power, truck access, storage${requiresWashing ? ", water, and wastewater" : ""}. This unlocks the site decision.` },
    { title: "Complete unit economics", detail: "Collect selling price, feedstock cost, losses, and operating costs. This unlocks the continue-or-stop decision." },
  ];
}

function parseMoney(value = "") {
  const normalized = String(value).replace(/[٬,]/g, "").replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
  const match = normalized.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function isNegativeOrUndefined(value = "") {
  return /^(?:no|none|not defined|unknown|غير معروف|لا|لا يوجد|بدون|غير محدد)$/iu.test(String(value).trim());
}

function isInformalCollection(value = "") {
  const text = String(value);
  return /(?:street|streets|bin|bins|public areas|discarded bottles|workers collect|informal collection|حاويات|الحاويات|شارع|الشوارع|أماكن عامة|الاماكن العامة|عمالة|عاملة|عمال|جمع العبوات|العلب الفارغة|مرمية)/iu.test(text) &&
    !/(?:contract|agreement|supplier|municipal|authorized|letter of intent|عقد|اتفاق|مورد|مصدر منتظم|تصريح|إذن|اذن|خطاب نية)/iu.test(text);
}

function hasVerifiedSupplySignal(value = "") {
  return /(?:contract|agreement|supplier|letter of intent|monthly supply|weekly supply|documented|عقد|اتفاق|مورد|خطاب نية|توريد موثق|كمية شهرية|كمية أسبوعية|مصدر منتظم)/iu.test(String(value));
}

function hasQuotationSignal(value = "") {
  return /(?:quotation|quote|supplier offer|priced offer|عرض سعر|عروض أسعار|عرض مورد|تسعيرة موثقة)/iu.test(String(value));
}

function hasBuyerMaterialMismatch(details) {
  const plasticType = details.plasticWasteType.raw;
  const output = details.intendedOutput.raw;
  const buyers = String(details.expectedBuyers.raw || "");
  const bagBuyer = /(?:garbage bags?|trash bags?|shopping bags?|carrier bags?|أكياس|اكياس|أكياس نفايات|اكياس نفايات|أكياس تسوق|اكياس تسوق)/iu.test(buyers);
  const explicitlyPetCompatible = /(?:PET|pet bottle|bottle recycler|PET flake|polyester fiber|accepts PET|PET bales|عبوات PET|زجاجات PET|بالات PET|رقائق PET|مصنع يقبل PET|ألياف بوليستر)/iu.test(buyers);
  return plasticType === "pet" && output === "sorted_baled" && bagBuyer && !explicitlyPetCompatible;
}

function hasBuyerSpecificationSignal(value = "") {
  return /(?:spec|grade|accepted|accepts|trial order|moisture|contamination|color|bale|مواصفة|درجة|قبول|يقبل|تجربة|رطوبة|شوائب|لون|بالة|بالات)/iu.test(String(value));
}

function normalizeSupplyDescription(value = "", language) {
  if (isInformalCollection(value)) {
    return language === "ar"
      ? "المصدر المقترح حالياً هو جمع العبوات المستعملة بواسطة عمالة من الحاويات والأماكن العامة، دون اتفاقيات توريد موثقة"
      : "the current proposed source is workers collecting used bottles from bins and public areas, without documented supply agreements";
  }
  return clean(value) || missingLabel(language);
}

function normalizeBuyerDescription(value = "", language) {
  const text = clean(value);
  if (!text) return missingLabel(language);
  if (language === "ar" && /(?:أكياس|اكياس|garbage bags?|shopping bags?)/iu.test(text)) {
    return "مصانع منتجات بلاستيكية مثل أكياس النفايات أو التسوق، ولم تُثبت بعد مواصفات قبول PET";
  }
  if (language === "en" && /(?:garbage bags?|trash bags?|shopping bags?|carrier bags?|أكياس|اكياس)/iu.test(text)) {
    return "plastic-product factories such as garbage or shopping bag producers, with PET acceptance specifications not yet proven";
  }
  return text;
}

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/(?:^|\s)(?:[0-9]+|[٠-٩١-٩]+)[\).\-:ـ]\s*/gu, " ")
    .trim();
}

function missingLabel(language) {
  return language === "ar" ? "غير محدد" : "Not specified";
}
