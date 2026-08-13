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
    conditional: "Potentially viable, but conditional",
    insufficient: "Insufficient supply, market, or financial evidence",
    notAdvisable: "Not advisable in the current configuration",
  },
  ar: {
    promising: "واعد بما يكفي لدراسة جدوى تفصيلية",
    conditional: "قد يكون مجدياً، لكن بشروط",
    insufficient: "الأدلة غير كافية بشأن التوريد أو السوق أو الماليات",
    notAdvisable: "لا يُنصح به بصيغته الحالية",
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
  const requiresWashing = ["washed_flakes", "pellets"].includes(details.intendedOutput);
  const configurationRisks = scoreIndustrialConfiguration(details);
  const decisionKey = chooseDecision(configurationRisks);
  const confidence = buildConfidence(details, configurationRisks, lang);
  const equipment = buildEquipmentPathway(details.intendedOutput.raw, lang);
  const location = buildLocationAnalysis(details, requiresWashing, lang);
  const economics = buildEconomicsFramework(details, lang);
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
      explanation: buildDecisionExplanation(profile, details, decisionKey, lang),
      confidence,
    },
    evidence: buildEvidenceDiscipline(profile, details, lang),
    sections: [
      { key: "customerQuestions", title: text.customerQuestions, items: buildCustomerQuestionAnswers(details, profile, location, equipment, lang) },
      { key: "configuration", title: text.configuration, items: buildConfigurationItems(details, lang) },
      { key: "viability", title: text.viability, items: buildViabilityConditions(details, profile, requiresWashing, lang) },
      { key: "location", title: text.location, items: location.items, status: location.status },
      { key: "equipment", title: text.equipment, items: equipment },
      { key: "skills", title: text.skills, groups: buildSkills(details.intendedOutput.raw, lang) },
      { key: "marketing", title: text.marketing, items: buildMarketingRoute(details, lang) },
      { key: "economics", title: text.economics, status: economics.status, items: economics.items, missing: economics.missing },
      { key: "scenarios", title: text.scenarios, items: buildScenarios(details, economics, lang) },
      { key: "risks", title: text.risks, groups: buildRisksAndGates(details, requiresWashing, lang) },
      { key: "actions", title: text.actions, items: buildNextActionPlan(details, requiresWashing, lang) },
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

function scoreIndustrialConfiguration(details) {
  const unknowns = [
    details.plasticWasteType.raw === "unknown",
    details.intendedOutput.raw === "unknown",
    details.existingPremises.raw === "unknown",
    details.salesScope.raw === "unknown",
  ].filter(Boolean).length;
  const hasPremises = details.existingPremises.raw === "yes";
  const hasBudget = Boolean(details.availableBudgetSar.raw);
  const hasSupply = details.wasteSourceQuantity.raw.length > 12;
  const hasBuyers = details.expectedBuyers.raw.length > 8;
  const complexOutput = ["pellets", "finished_products"].includes(details.intendedOutput.raw);

  return { unknowns, hasPremises, hasBudget, hasSupply, hasBuyers, complexOutput };
}

function chooseDecision(risks) {
  if (risks.unknowns >= 2 || !risks.hasSupply || !risks.hasBuyers || !risks.hasBudget) return "insufficient";
  if (risks.complexOutput && !risks.hasPremises) return "conditional";
  return risks.hasPremises ? "promising" : "conditional";
}

function buildConfidence(details, risks, language) {
  const complete = Object.values(details).filter((item) => item.raw && item.raw !== "unknown").length;
  const level = complete >= 9 && risks.hasSupply && risks.hasBuyers ? "medium" : "low";
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

function buildDecisionExplanation(profile, details, decisionKey, language) {
  if (language === "ar") {
    if (decisionKey === "promising") {
      return `المشروع يستحق الانتقال إلى دراسة جدوى تفصيلية إذا تم تثبيت توريد ${details.plasticWasteType.label} ووجود مشترين واضحين لمخرج ${profile.output}.`;
    }
    if (decisionKey === "conditional") {
      return `الفكرة قد تكون قابلة للاستثمار، لكن القرار مشروط بإثبات انتظام التوريد، قبول المشترين لجودة ${profile.output}، وملاءمة الموقع والميزانية قبل شراء المعدات.`;
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
  if (decisionKey === "notAdvisable") {
    return "The current configuration is not advisable because the operating or financial requirements do not fit the available evidence.";
  }
  return `Viability cannot be confirmed yet; the decision depends on documented feedstock volume, buyer specifications, and real prices and costs for ${profile.output}.`;
}

function buildEvidenceDiscipline(profile, details, language) {
  const requiresWashing = ["washed_flakes", "pellets"].includes(details.intendedOutput.raw);
  if (language === "ar") {
    return [
      {
        title: labels.ar.provided,
        items: [
          `المخرج المستهدف: ${profile.output}.`,
          `الموقع المفضل: ${details.preferredCityRegion.label}.`,
          `مصدر المخلفات المتوقع: ${details.wasteSourceQuantity.label}.`,
          `المشترون المتوقعون: ${details.expectedBuyers.label}.`,
        ],
      },
      {
        title: labels.ar.assumption,
        items: ["سيتم افتراض أن التوريد والمبيعات يمكن توثيقهما بعقود أو أوامر شراء قبل الاستثمار الكامل."],
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
        `Expected waste source: ${details.wasteSourceQuantity.label}.`,
        `Expected buyers: ${details.expectedBuyers.label}.`,
      ],
    },
    {
      title: labels.en.assumption,
      items: ["The assessment assumes supply and buyer demand can be documented through contracts, letters, or trial orders before full investment."],
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

function buildCustomerQuestionAnswers(details, profile, location, equipment, language) {
  if (language === "ar") {
    return [
      { title: "الجدوى الأولية", detail: `قد يكون مشروع ${profile.output} قابلاً للدراسة التفصيلية إذا ثبت توفر مخلفات مناسبة ومشترين يقبلون الجودة. لا توجد حالياً أرقام كافية لتأكيد الربحية.` },
      { title: "الموقع", detail: `${location.status}. يجب اختيار موقع قريب من مصدر المخلفات والمشترين، مع دخول شاحنات ومساحة تخزين وخدمات كهرباء${location.requiresWashing ? " ومياه وتصريف مناسب" : ""}.` },
      { title: "المعدات", detail: `المسار يبدأ بـ ${equipment.slice(0, 3).map((item) => item.title).join("، ")}، ثم يتوسع حسب المخرج المطلوب.` },
      { title: "مهارات التشغيل", detail: "يحتاج المشروع إلى فرز مواد، تشغيل خط، صيانة أساسية، رقابة جودة، إشراف إنتاج، وسلامة مهنية. المراحل الأعلى تتطلب خبرة أقوى." },
      { title: "التسويق", detail: `ابدأ بمواصفة واضحة لـ ${profile.output}، ثم اعرض عينات وبيانات جودة على ${details.expectedBuyers.label} قبل الالتزام بطاقة كاملة.` },
    ];
  }
  return [
    { title: "Preliminary viability", detail: `${profile.output} may be worth detailed feasibility if suitable feedstock and buyers are documented. Current numbers are not enough to confirm profitability.` },
    { title: "Location", detail: `${location.status}. The site should be close to supply and buyers, with truck access, storage, power${location.requiresWashing ? ", water, and wastewater handling" : ""}.` },
    { title: "Equipment", detail: `The path starts with ${equipment.slice(0, 3).map((item) => item.title).join(", ")} and expands according to the selected output.` },
    { title: "Operating skills", detail: "The project needs material sorting, line operation, basic maintenance, quality control, production supervision, and safety oversight. Higher outputs need stronger technical experience." },
    { title: "Marketing", detail: `Define the specification for ${profile.output}, then test samples and quality data with ${details.expectedBuyers.label} before committing to full capacity.` },
  ];
}

function buildConfigurationItems(details, language) {
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
    return {
      title: field.label[language] || field.label.en,
      detail: details[fieldId].label,
    };
  });
}

function buildViabilityConditions(details, profile, requiresWashing, language) {
  if (language === "ar") {
    return [
      { title: "موثوقية التوريد ونظافته", status: "افتراض يحتاج إلى تحقق", detail: `يجب إثبات أن ${details.wasteSourceQuantity.label} كافية ونظيفة بما يناسب ${profile.output}.` },
      { title: "ملاءمة الكمية للطاقة المستهدفة", status: "افتراض يحتاج إلى تحقق", detail: `قارِن الكمية المتاحة بالطاقة المستهدفة: ${details.targetProductionCapacity.label}.` },
      { title: "طلب المشترين على المخرج", status: "افتراض يحتاج إلى تحقق", detail: `لا يكفي وجود مشترين محتملين؛ يجب الحصول على مواصفة قبول أو طلب تجربة من ${details.expectedBuyers.label}.` },
      { title: "ثبات الجودة", status: "شرط أساسي", detail: "أي تفاوت في النظافة أو الرطوبة أو اللون أو الخلط قد يؤدي إلى رفض المخرج أو خفض سعره." },
      { title: "تعقيد التشغيل", status: "يعتمد على المخرج", detail: buildComplexityText(details.intendedOutput.raw, language) },
      { title: "جاهزية الميزانية", status: "غير مؤكدة مالياً", detail: `الميزانية المتاحة هي ${details.availableBudgetSar.label}، لكنها لا تكفي وحدها دون عروض معدات وتكاليف تشغيل.` },
      { title: "الموقع واللوجستيات", status: "قابل للتقييم", detail: `الموقع المقترح ${details.preferredCityRegion.label} يحتاج تحققاً من النقل والتخزين والخدمات${requiresWashing ? " والمياه والصرف" : ""}.` },
      { title: "جاهزية الفريق", status: "افتراض يحتاج إلى تحقق", detail: `الفريق/الخبرة: ${details.industrialExperienceTeam.label}.` },
    ];
  }
  return [
    { title: "Feedstock reliability and cleanliness", status: "Assumption requiring verification", detail: `${details.wasteSourceQuantity.label} must be enough and clean enough for ${profile.output}.` },
    { title: "Supply fit with capacity", status: "Assumption requiring verification", detail: `Compare available supply with the target capacity: ${details.targetProductionCapacity.label}.` },
    { title: "Demand for selected output", status: "Assumption requiring verification", detail: `Potential buyers are not enough; get acceptance specs or trial orders from ${details.expectedBuyers.label}.` },
    { title: "Quality consistency", status: "Core condition", detail: "Variation in contamination, moisture, color, or material mix can cause rejection or lower prices." },
    { title: "Operating complexity", status: "Depends on output", detail: buildComplexityText(details.intendedOutput.raw, language) },
    { title: "Budget readiness", status: "Financially unconfirmed", detail: `The available budget is ${details.availableBudgetSar.label}, but equipment quotations and operating costs are still required.` },
    { title: "Location and logistics fit", status: "Assessable", detail: `The selected location, ${details.preferredCityRegion.label}, must be checked for logistics, storage, utilities${requiresWashing ? ", water, and wastewater" : ""}.` },
    { title: "Team readiness", status: "Assumption requiring verification", detail: `Team/experience: ${details.industrialExperienceTeam.label}.` },
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

function buildLocationAnalysis(details, requiresWashing, language) {
  const hasLocation = details.preferredCityRegion.raw && details.preferredCityRegion.raw !== "unknown";
  const hasPremises = details.existingPremises.raw === "yes";
  const status = language === "ar"
    ? hasLocation
      ? hasPremises
        ? "مناسب من حيث المبدأ"
        : "مناسب بشروط"
      : "معلومات غير كافية"
    : hasLocation
      ? hasPremises
        ? "Suitable in principle"
        : "Suitable with conditions"
      : "Insufficient information";

  const items = language === "ar"
    ? [
        { title: "القرب من مصدر المخلفات", detail: "كلما قصرت مسافة نقل المخلفات زادت فرصة التحكم في التكلفة والانتظام." },
        { title: "القرب من المشترين", detail: "القرب من المصانع المشترية يقلل وقت التسليم ويجعل أوامر التجربة أسهل." },
        { title: "الملاءمة الصناعية", detail: requiresWashing ? "يجب التأكد من أن الموقع يسمح بنشاط فرز وغسيل البلاستيك حسب المخرج المختار." : "يجب التأكد من أن الموقع يسمح بنشاط فرز وكبس وتخزين البلاستيك." },
        { title: "الكهرباء والخدمات", detail: "المشروع يحتاج قدرة كهربائية مستقرة، وتزداد الأهمية مع التحبيب أو المنتجات النهائية." },
        ...(requiresWashing ? [{ title: "المياه والصرف", detail: "الغسيل يتطلب توفر مياه ومعالجة أو تصريفاً مناسباً للمياه الناتجة." }] : []),
        { title: "دخول الشاحنات والتخزين", detail: "يجب توفير حركة شاحنات آمنة ومساحة لاستلام وفرز وتخزين المخلفات والمخرج النهائي." },
        { title: "السلامة والبيئة", detail: "يجب مراجعة متطلبات السلامة والبيئة محلياً قبل الالتزام بالموقع." },
      ]
    : [
        { title: "Proximity to waste supply", detail: "Shorter feedstock transport improves cost control and supply reliability." },
        { title: "Proximity to buyers", detail: "Being near buyer factories makes trial orders and repeat delivery easier." },
        { title: "Industrial zoning suitability", detail: requiresWashing ? "Confirm the site permits plastic sorting and washing for the selected output." : "Confirm the site permits plastic sorting, baling, and storage." },
        { title: "Power and utilities", detail: "Stable electricity matters, especially for pelletizing or finished-product conversion." },
        ...(requiresWashing ? [{ title: "Water and wastewater", detail: "Washing requires water availability and suitable wastewater handling." }] : []),
        { title: "Truck access and storage", detail: "The site needs safe truck movement and space for receiving, sorting, storage, and dispatch." },
        { title: "Environmental and safety requirements", detail: "Local safety and environmental requirements must be reviewed before committing to the site." },
      ];

  return { status, items, requiresWashing };
}

function buildEquipmentPathway(output, language) {
  const t = language === "ar" ? equipmentAr : equipmentEn;
  const common = [t.receiving, t.sorting, t.contamination, t.storage];
  if (output === "sorted_baled") return [t.receiving, t.sorting, t.contamination, t.baling, t.storage];
  if (output === "washed_flakes") return [t.receiving, t.sorting, t.shredding, t.washing, t.separation, t.drying, t.quality, t.packing];
  if (output === "pellets") return [t.receiving, t.sorting, t.shredding, t.washing, t.drying, t.extrusion, t.filtration, t.pelletizing, t.cooling, t.quality, t.packing];
  if (output === "finished_products") return [t.receiving, t.sorting, t.preparedMaterial, t.conversion, t.tooling, t.productQuality, t.packing];
  return common;
}

const equipmentEn = {
  receiving: { title: "Collection and receiving", status: "Core", detail: "Receives, weighs, and records incoming plastic; needs basic logistics control." },
  sorting: { title: "Sorting", status: "Core", detail: "Separates plastic by type, color, and quality; requires trained material identification." },
  contamination: { title: "Contamination removal", status: "Core", detail: "Removes labels, dirt, metals, and unsuitable materials; affects buyer acceptance." },
  baling: { title: "Baling", status: "Core", detail: "Compresses sorted material for storage and transport; requires simple mechanical maintenance." },
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
  receiving: { title: "الجمع والاستلام", status: "أساسي", detail: "استلام ووزن وتسجيل المخلفات الداخلة؛ يحتاج ضبطاً بسيطاً للوجستيات." },
  sorting: { title: "الفرز", status: "أساسي", detail: "فصل البلاستيك حسب النوع واللون والجودة؛ يحتاج تدريباً على تمييز المواد." },
  contamination: { title: "إزالة الشوائب", status: "أساسي", detail: "إزالة الملصقات والأوساخ والمعادن والمواد غير المناسبة؛ وهذا يؤثر مباشرة في قبول المشترين." },
  baling: { title: "الكبس", status: "أساسي", detail: "ضغط المواد المفروزة للتخزين والنقل؛ يحتاج صيانة ميكانيكية بسيطة." },
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

function buildMarketingRoute(details, language) {
  if (language === "ar") {
    return [
      `حدد مواصفة بيع واضحة لـ ${outputCopy[details.intendedOutput.raw]?.ar || details.intendedOutput.label}: النوع، اللون، نسبة الشوائب، الرطوبة، وطريقة التعبئة حسب المخرج.`,
      `جهّز عينة صغيرة وبيانات جودة مختصرة قبل عرضها على ${details.expectedBuyers.label}.`,
      "اطلب قبول عينة أو أمر تجربة قبل الالتزام بشراء خط كامل أو تشغيله بطاقة عالية.",
      "اتفق مع المشتري على درجة ثابتة ومتطلبات تغليف وتسليم وجدول توريد.",
      details.salesScope.raw === "export"
        ? "في مسار التصدير، لا تبدأ إلا بعد توثيق مواصفات المشتري ومتطلبات الشحن والتعبئة والاعتماد."
        : "ابدأ بمشترين محليين قريبين لتقليل مخاطر الجودة واللوجستيات في التجارب الأولى.",
    ];
  }
  return [
    `Define a clear selling specification for ${outputCopy[details.intendedOutput.raw]?.en || details.intendedOutput.label}: material type, color, contamination, moisture, and packaging.`,
    `Prepare a small sample and basic quality data before approaching ${details.expectedBuyers.label}.`,
    "Seek sample acceptance or trial orders before buying or running a full-capacity line.",
    "Agree on consistent grade, packaging, delivery, and supply schedule requirements.",
    details.salesScope.raw === "export"
      ? "For export, proceed only after buyer specifications, shipping, packaging, and acceptance requirements are documented."
      : "Start with nearby local buyers to reduce quality and logistics risk during early trials.",
  ];
}

function buildEconomicsFramework(details, language) {
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
        "المعادلة المطلوبة: الكمية المتاحة × نسبة العائد الصالح = المخرج القابل للبيع.",
        requiresWashing
          ? "ثم تُطرح تكلفة المخلفات والطاقة والمياه والعمالة والنقل والصيانة والإيجار والتخلص من الفاقد للوصول إلى نتيجة التشغيل."
          : "ثم تُطرح تكلفة المخلفات والطاقة والعمالة والنقل والصيانة والإيجار والتخلص من الفاقد للوصول إلى نتيجة التشغيل.",
        "نقطة التعادل = التكاليف الثابتة ÷ هامش المساهمة لكل وحدة.",
      ]
    : [
        `Target capacity: ${details.targetProductionCapacity.label}.`,
        `Available budget: ${details.availableBudgetSar.label}.`,
        "Required formula: available feedstock x usable yield = saleable output.",
        requiresWashing
          ? "Then subtract feedstock, power, water, labor, logistics, maintenance, rent, and waste-disposal costs to estimate operating result."
          : "Then subtract feedstock, power, labor, logistics, maintenance, rent, and waste-disposal costs to estimate operating result.",
        "Break-even volume = fixed costs divided by contribution margin per unit.",
      ];

  return { status: labels[language].notCalculated, items, missing };
}

function buildScenarios(details, economics, language) {
  if (language === "ar") {
    return [
      { title: "متحفظ", detail: "توريد أقل من المتوقع، فاقد أعلى، قبول محدود من المشترين، وسعر بيع منخفض. القرار: لا تتوسع قبل معالجة السبب." },
      { title: "أساسي", detail: "توريد منتظم، جودة مقبولة، ومشترون يقبلون أوامر تجربة بسعر يغطي التكلفة المتغيرة. القرار: انتقل لدراسة جدوى تفصيلية." },
      { title: "متفائل", detail: "توريد موثق، جودة ثابتة، ومشترون متكررون. القرار: ادرس التوسع أو رفع المخرج إلى مرحلة أعلى بعد إثبات التشغيل." },
      { title: "الحساب الرقمي", detail: `${economics.status}: لا توجد أسعار وتكاليف موثقة كافية لبناء سيناريوهات مالية رقمية.` },
    ];
  }
  return [
    { title: "Conservative", detail: "Lower supply, higher losses, limited buyer acceptance, and lower selling price. Decision: do not expand until the cause is addressed." },
    { title: "Base", detail: "Reliable supply, acceptable quality, and buyers accepting trial orders at prices covering variable cost. Decision: move to detailed feasibility." },
    { title: "Upside", detail: "Documented supply, consistent quality, and repeat buyers. Decision: consider expansion or a higher-output stage after operations are proven." },
    { title: "Numeric calculation", detail: `${economics.status}: verified prices and costs are not available, so numeric financial scenarios are not produced.` },
  ];
}

function buildRisksAndGates(details, requiresWashing, language) {
  if (language === "ar") {
    return [
      { title: "مخاطر المشروع", items: ["نقص أو تلوث المخلفات الداخلة", "رفض المخرج بسبب عدم ثبات الجودة", "تشغيل الخط بطاقة أقل من المخطط", ...(requiresWashing ? ["قيود المياه أو الصرف"] : []), "اختيار معدات لا تناسب المخرج أو الطاقة", "ضغط رأس المال العامل", "الاعتماد على عدد قليل من المشترين"] },
      { title: "بوابات قرار قبل الاستثمار الكامل", items: ["توثيق حد أدنى من توفر المخلفات", "قبول عينة أو مواصفة من مشترٍ واحد على الأقل", "عروض معدات مطابقة للمخرج والطاقة", "تأكيد ملاءمة الموقع والخدمات والبيئة والسلامة", "إكمال حساب اقتصاديات الوحدة ونقطة التعادل"] },
    ];
  }
  return [
    { title: "Project-specific risks", items: ["Feedstock shortage or contamination", "Output rejected because of inconsistent quality", "Underused line capacity", ...(requiresWashing ? ["Water or wastewater constraints"] : []), "Equipment mismatch with output or capacity", "Working-capital pressure", "Dependence on too few buyers"] },
    { title: "Go/no-go gates before full investment", items: ["Minimum documented feedstock availability", "Buyer specification or trial acceptance", "Equipment quotations matched to output and capacity", "Site utility, environmental, and safety suitability", "Completed unit-economics and break-even calculation"] },
  ];
}

function buildNextActionPlan(details, requiresWashing, language) {
  if (language === "ar") {
    return [
      { title: "وثّق التوريد", detail: `احصل على عرض أو خطاب نية يوضح كمية ونوع ${details.plasticWasteType.label}. هذا يفتح قرار الطاقة الإنتاجية المناسبة.` },
      { title: "اختبر قبول السوق", detail: `اعرض عينة أو مواصفة لـ ${outputCopy[details.intendedOutput.raw]?.ar || details.intendedOutput.label} على ${details.expectedBuyers.label}. هذا يفتح قرار المخرج والسعر.` },
      { title: "طابق المعدات مع المخرج", detail: "اطلب عروض معدات مبنية على المخرج والطاقة وليس على اسم المشروع فقط. هذا يفتح قرار الميزانية." },
      { title: "افحص الموقع", detail: `راجع الكهرباء ودخول الشاحنات والتخزين${requiresWashing ? " والمياه والصرف" : ""}. هذا يفتح قرار صلاحية الموقع.` },
      { title: "أكمل اقتصاديات الوحدة", detail: "اجمع سعر البيع وتكلفة التوريد والفواقد والتشغيل. هذا يفتح قرار المتابعة أو التوقف." },
    ];
  }
  return [
    { title: "Document supply", detail: `Obtain a quotation or letter of intent showing quantity and type of ${details.plasticWasteType.label}. This unlocks the capacity decision.` },
    { title: "Test buyer acceptance", detail: `Present a sample or specification for ${outputCopy[details.intendedOutput.raw]?.en || details.intendedOutput.label} to ${details.expectedBuyers.label}. This unlocks the output and pricing decision.` },
    { title: "Match equipment to output", detail: "Request equipment quotations based on output and capacity, not the project name alone. This unlocks the budget decision." },
    { title: "Check the site", detail: `Review power, truck access, storage${requiresWashing ? ", water, and wastewater" : ""}. This unlocks the site decision.` },
    { title: "Complete unit economics", detail: "Collect selling price, feedstock cost, losses, and operating costs. This unlocks the continue-or-stop decision." },
  ];
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
