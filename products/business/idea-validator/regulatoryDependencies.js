function normalize(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function textOf(input = {}) {
  return [
    input.businessIdea,
    input.targetCustomer,
    input.problem,
    input.monetization,
    input.currentSolution,
    input.competitiveAdvantage,
    input.stage,
  ]
    .filter(Boolean)
    .join(" ");
}

function hasAny(value, terms = []) {
  const text = normalize(value).toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function countAny(value, terms = []) {
  const text = normalize(value).toLowerCase();
  return terms.reduce((total, term) => total + (text.includes(term.toLowerCase()) ? 1 : 0), 0);
}

const approvalTerms = {
  obtained: [
    "approval obtained",
    "permit obtained",
    "license obtained",
    "license granted",
    "licensed by",
    "certification obtained",
    "inspection passed",
    "vendor approved",
    "approved vendor",
    "app approved",
    "approved by app store",
    "حصلنا على الموافقة",
    "تمت الموافقة",
    "حصلنا على تصريح",
    "حصلنا على ترخيص",
    "الترخيص موجود",
    "اجتزنا التفتيش",
    "مورد معتمد",
    "تم اعتمادنا",
  ],
  required: [
    "requires approval",
    "requires permit",
    "requires license",
    "requires certification",
    "requires inspection",
    "need approval",
    "need a permit",
    "need permit",
    "need a license",
    "need license",
    "must get approval",
    "must obtain approval",
    "must obtain a permit",
    "must obtain permit",
    "must obtain a license",
    "must obtain license",
    "pending approval",
    "pending permit",
    "pending license",
    "permit pending",
    "license pending",
    "inspection pending",
    "approval pending",
    "are pending",
    "awaiting approval",
    "not yet approved",
    "requires licensed",
    "requires a licensed",
    "requires qualified",
    "licensed practitioner required",
    "licensed doctor required",
    "licensed nurse required",
    "نحتاج موافقة",
    "يحتاج موافقة",
    "تحتاج موافقة",
    "يتطلب موافقة",
    "يتطلب تصريح",
    "يتطلب ترخيص",
    "تحتاج تصريح",
    "نحتاج تصريح",
    "تحتاج ترخيص",
    "نحتاج ترخيص",
    "مطلوب ترخيص",
    "مطلوب تصريح",
    "بانتظار الموافقة",
    "لم تتم الموافقة",
    "يتطلب ممارس مرخص",
    "يتطلب طبيب مرخص",
    "يتطلب ممرض مرخص",
    "تتطلب ممارس مرخص",
    "تتطلب طبيب مرخص",
    "تتطلب ممرض مرخص",
  ],
};

const dependencyTerms = {
  professional: [
    "licensed practitioner",
    "licensed doctor",
    "licensed nurse",
    "qualified clinician",
    "certified professional",
    "registered professional",
    "ممارس مرخص",
    "طبيب مرخص",
    "ممرض مرخص",
    "مختص مرخص",
    "مهني معتمد",
  ],
  medicalClinical: [
    "clinical approval",
    "medical approval",
    "medical treatment",
    "regulated treatment",
    "patient treatment",
    "prescription",
    "diagnosis",
    "therapy",
    "اعتماد طبي",
    "موافقة طبية",
    "علاج طبي",
    "تشخيص",
    "وصفة طبية",
    "رعاية مرضى",
  ],
  government: [
    "government approval",
    "municipal approval",
    "municipality permit",
    "city permit",
    "public authority",
    "regulator",
    "regulatory approval",
    "موافقة حكومية",
    "موافقة بلدية",
    "تصريح بلدي",
    "جهة تنظيمية",
    "اعتماد حكومي",
  ],
  certificationInspection: [
    "certification",
    "inspection",
    "compliance certificate",
    "quality certificate",
    "safety certificate",
    "اعتماد",
    "شهادة مطابقة",
    "تفتيش",
    "فحص",
    "شهادة جودة",
    "شهادة سلامة",
  ],
  importExport: [
    "import approval",
    "export approval",
    "customs clearance",
    "customs permit",
    "import license",
    "export license",
    "تصريح استيراد",
    "تصريح تصدير",
    "اعتماد استيراد",
    "اعتماد تصدير",
    "تخليص جمركي",
    "رخصة استيراد",
    "رخصة تصدير",
  ],
  institutional: [
    "procurement approval",
    "vendor approval",
    "approved vendor",
    "institutional approval",
    "enterprise approval",
    "security review",
    "it approval",
    "legal review",
    "اعتماد مورد",
    "موافقة المشتريات",
    "موافقة المؤسسة",
    "مراجعة أمنية",
    "موافقة تقنية المعلومات",
    "مراجعة قانونية",
  ],
  platform: [
    "app store approval",
    "platform approval",
    "marketplace approval",
    "seller approval",
    "api approval",
    "متجر التطبيقات",
    "موافقة المنصة",
    "اعتماد المنصة",
    "اعتماد البائع",
    "موافقة السوق",
  ],
  facility: [
    "facility approval",
    "premises approval",
    "warehouse permit",
    "factory permit",
    "industrial license",
    "site inspection",
    "موافقة الموقع",
    "اعتماد المقر",
    "تصريح مستودع",
    "تصريح مصنع",
    "ترخيص صناعي",
    "تفتيش الموقع",
  ],
  foodRetail: [
    "food permit",
    "kitchen permit",
    "food safety inspection",
    "health inspection",
    "تصريح غذائي",
    "تصريح مطبخ",
    "تفتيش صحي",
    "فحص سلامة الغذاء",
  ],
};

const negativeContexts = [
  "no license required",
  "no permit required",
  "does not require approval",
  "does not need approval",
  "educational content about",
  "awareness about",
  "guide about",
  "لا يحتاج ترخيص",
  "لا يتطلب ترخيص",
  "لا يحتاج تصريح",
  "لا يتطلب تصريح",
  "لا يحتاج موافقة",
  "توعية حول",
  "محتوى تعليمي عن",
];

function summarizeDependencyType(counts = {}, language = "en") {
  const priority = [
    "professional",
    "medicalClinical",
    "foodRetail",
    "facility",
    "importExport",
    "government",
    "institutional",
    "platform",
    "certificationInspection",
  ];
  const key = priority.find((item) => counts[item] > 0) || "";
  const labels = {
    professional: ["licensed professional involvement", "مشاركة مختص مرخص"],
    medicalClinical: ["medical or clinical approval path", "مسار موافقة طبية أو سريرية"],
    foodRetail: ["food-safety or retail permit path", "مسار تصريح أو فحص غذائي"],
    facility: ["facility, site, or premises approval path", "مسار اعتماد الموقع أو المقر"],
    importExport: ["import, export, or customs approval path", "مسار الاستيراد أو التصدير أو التخليص"],
    government: ["government or municipal authorization path", "مسار موافقة حكومية أو بلدية"],
    institutional: ["institutional procurement or vendor approval path", "مسار اعتماد مشتريات أو مورد لدى جهة"],
    platform: ["platform, app-store, or marketplace approval path", "مسار اعتماد منصة أو متجر تطبيقات أو سوق"],
    certificationInspection: ["certification or inspection path", "مسار اعتماد أو تفتيش"],
  };

  if (!key) return language === "ar" ? "مسار موافقة خارجي" : "external approval path";
  const [en, ar] = labels[key];
  return language === "ar" ? ar : en;
}

export function interpretRegulatoryDependencies(input = {}, language = "en") {
  const combined = textOf(input);
  const normalized = normalize(combined).toLowerCase();
  const negative = hasAny(combined, negativeContexts);
  const obtained = hasAny(combined, approvalTerms.obtained);
  const required = hasAny(combined, approvalTerms.required);
  const counts = Object.fromEntries(
    Object.entries(dependencyTerms).map(([key, terms]) => [key, countAny(combined, terms)])
  );
  const dependencyCount = Object.values(counts).reduce((total, count) => total + count, 0);

  if (negative && !required && !obtained) {
    return {
      status: "none",
      dependencyType: "",
      dependencyLabel: "",
      hasApprovalObtained: false,
      hasUnresolvedApproval: false,
      needsClarification: false,
      isMaterial: false,
      signals: counts,
      language,
    };
  }

  const mentionsApprovalConcept =
    /\b(approval|permit|certification|inspection|procurement|vendor approval|customs|regulated)\b/i.test(normalized) ||
    /(موافقة|تصريح|اعتماد|تفتيش|مشتريات|اعتماد مورد|جمرك|تنظيمي)/u.test(normalized);
  const isMaterial = dependencyCount > 0 || required || obtained || mentionsApprovalConcept;
  const status = obtained
    ? "obtained"
    : required
      ? "required"
      : isMaterial
        ? "needs_clarification"
        : "none";
  const dependencyLabel = summarizeDependencyType(counts, language);

  return {
    status,
    dependencyType: status === "none" ? "" : dependencyLabel,
    dependencyLabel: status === "none" ? "" : dependencyLabel,
    hasApprovalObtained: status === "obtained",
    hasUnresolvedApproval: status === "required",
    needsClarification: status === "needs_clarification",
    isMaterial: status !== "none",
    signals: counts,
    language,
  };
}

export function describeRegulatoryDependency(dependency = {}, language = "en") {
  const label = dependency.dependencyLabel || (language === "ar" ? "مسار موافقة خارجي" : "external approval path");

  if (dependency.status === "obtained") {
    return language === "ar"
      ? `تذكر المدخلات أن ${label} تم التعامل معه أو الحصول عليه.`
      : `The input states that the ${label} has been handled or obtained.`;
  }

  if (dependency.status === "required") {
    return language === "ar"
      ? `التنفيذ يعتمد على ${label} لم يتضح أنه مكتمل بعد.`
      : `Execution depends on an external permission path (${label}) that is not yet shown as resolved.`;
  }

  if (dependency.status === "needs_clarification") {
    return language === "ar"
      ? `قد تعتمد الفكرة على ${label} ويجب توضيح المسار قبل التوسع.`
      : `The idea may depend on an external permission path (${label}), so the approval path should be clarified before scaling.`;
  }

  return "";
}
