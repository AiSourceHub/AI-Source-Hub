function normalize(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function hasAny(value, terms = []) {
  const text = normalize(value).toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function firstMatchLabel(value, matchers = [], fallback = "") {
  const text = normalize(value);
  const lower = text.toLowerCase();
  const match = matchers.find((item) => item.terms.some((term) => lower.includes(term.toLowerCase())));
  return match?.label || fallback;
}

const terms = {
  organizationBuyer: [
    "company",
    "companies",
    "business",
    "businesses",
    "clinic",
    "clinics",
    "hospital",
    "school",
    "factory",
    "factories",
    "employer",
    "employers",
    "restaurant",
    "restaurants",
    "team",
    "teams",
    "procurement",
    "department",
    "شركات",
    "شركة",
    "عيادات",
    "عيادة",
    "مستشفى",
    "مدارس",
    "مدرسة",
    "مصانع",
    "مصنع",
    "جهة",
    "مؤسسة",
    "مطاعم",
    "مطعم",
    "فرق",
    "قسم",
    "إدارة",
  ],
  individualUser: [
    "patient",
    "patients",
    "employee",
    "employees",
    "worker",
    "workers",
    "student",
    "students",
    "parent",
    "parents",
    "resident",
    "residents",
    "consumer",
    "consumers",
    "shopper",
    "shoppers",
    "مريض",
    "مرضى",
    "موظف",
    "موظفين",
    "عامل",
    "عمال",
    "طالب",
    "طلاب",
    "ولي أمر",
    "أولياء الأمور",
    "مستهلك",
    "مستهلكين",
    "عميل نهائي",
  ],
  payer: [
    "pays",
    "pay",
    "paid by",
    "charged to",
    "payer",
    "buyer",
    "budget owner",
    "subscription per",
    "license",
    "invoice",
    "يدفع",
    "تدفع",
    "يدفعه",
    "تدفعه",
    "الدافع",
    "المشتري",
    "صاحب الميزانية",
    "اشتراك لكل",
    "ترخيص",
    "فاتورة",
  ],
  approver: [
    "approves",
    "approval",
    "decision maker",
    "decision-maker",
    "manager",
    "management",
    "admin",
    "procurement",
    "owner",
    "budget owner",
    "يعتمد",
    "موافقة",
    "صاحب القرار",
    "المدير",
    "الإدارة",
    "المسؤول",
    "المشتريات",
    "مالك",
    "صاحب الميزانية",
  ],
  provider: [
    "provider",
    "providers",
    "supplier",
    "suppliers",
    "technician",
    "technicians",
    "contractor",
    "contractors",
    "professional",
    "professionals",
    "seller",
    "sellers",
    "merchant",
    "merchants",
    "operator",
    "operators",
    "مقدم",
    "مقدمي",
    "مزود",
    "مزودي",
    "فني",
    "فنيين",
    "مورد",
    "موردين",
    "بائع",
    "بائعين",
    "تاجر",
    "تجار",
    "مشغل",
    "مشغلين",
    "صاحب مهنة",
    "أصحاب المهن",
  ],
  marketplace: [
    "marketplace",
    "connect",
    "connects",
    "connecting",
    "match",
    "matches",
    "matching",
    "between",
    "platform for buyers and sellers",
    "منصة تربط",
    "يربط",
    "تربط",
    "ربط",
    "وسيط",
    "سوق",
    "بين",
  ],
  vaguePayer: [
    "subscription",
    "fee",
    "commission",
    "percentage",
    "license",
    "اشتراك",
    "رسوم",
    "عمولة",
    "نسبة",
    "ترخيص",
  ],
};

const userLabels = {
  en: [
    { label: "patients", terms: ["patient", "patients"] },
    { label: "employees", terms: ["employee", "employees", "worker", "workers"] },
    { label: "students", terms: ["student", "students"] },
    { label: "consumers", terms: ["consumer", "consumers", "shopper", "shoppers"] },
  ],
  ar: [
    { label: "المرضى", terms: ["مريض", "مرضى"] },
    { label: "الموظفون", terms: ["موظف", "موظفين", "عامل", "عمال"] },
    { label: "الطلاب", terms: ["طالب", "طلاب"] },
    { label: "المستهلكون", terms: ["مستهلك", "مستهلكين", "عميل نهائي"] },
  ],
};

const buyerLabels = {
  en: [
    { label: "businesses", terms: ["company", "companies", "business", "businesses"] },
    { label: "clinics", terms: ["clinic", "clinics"] },
    { label: "factories", terms: ["factory", "factories"] },
  ],
  ar: [
    { label: "الشركات", terms: ["شركة", "شركات"] },
    { label: "العيادات", terms: ["عيادة", "عيادات"] },
    { label: "المصانع", terms: ["مصنع", "مصانع"] },
  ],
};

const providerLabels = {
  en: [
    { label: "service providers", terms: ["provider", "providers", "technician", "technicians", "contractor", "contractors"] },
    { label: "suppliers", terms: ["supplier", "suppliers"] },
    { label: "sellers", terms: ["seller", "sellers", "merchant", "merchants"] },
  ],
  ar: [
    { label: "مقدمو الخدمة", terms: ["مقدم", "مقدمي", "فني", "فنيين", "صاحب مهنة", "أصحاب المهن"] },
    { label: "الموردون", terms: ["مورد", "موردين"] },
    { label: "البائعون", terms: ["بائع", "بائعين", "تاجر", "تجار"] },
  ],
};

function hasExplicitDifferentActors(input) {
  const combined = `${input.businessIdea || ""} ${input.targetCustomer || ""} ${input.problem || ""}`;
  const target = input.targetCustomer || "";
  return (
    hasAny(combined, terms.marketplace) ||
    (hasAny(combined, terms.organizationBuyer) && hasAny(combined, terms.individualUser)) ||
    (hasAny(target, terms.provider) && /,|\band\b|\bwith\b|\sو\s/u.test(target))
  );
}

function inferPayerStatus(input, multiActor) {
  const monetization = input.monetization || "";
  const combined = `${input.targetCustomer || ""} ${monetization}`;

  if (!normalize(monetization)) return "missing";
  if (hasAny(combined, terms.payer)) return "explicit";
  if (!multiActor && hasAny(monetization, terms.vaguePayer)) return "direct";
  if (multiActor && hasAny(monetization, terms.vaguePayer)) return "ambiguous";
  return multiActor ? "ambiguous" : "implicit";
}

function inferApproverStatus(input, multiActor) {
  const combined = `${input.businessIdea || ""} ${input.targetCustomer || ""} ${input.problem || ""} ${input.monetization || ""}`;

  if (hasAny(combined, terms.approver)) return "explicit";
  if (!multiActor) return "not_required";
  if (hasAny(combined, terms.organizationBuyer)) return "ambiguous";
  return "unknown";
}

export function interpretStakeholderRoles(input = {}, language = "en") {
  const combined = `${input.businessIdea || ""} ${input.targetCustomer || ""} ${input.problem || ""} ${input.monetization || ""}`;
  const target = input.targetCustomer || "";
  const multiActor = hasExplicitDifferentActors(input);
  const marketplace = hasAny(combined, terms.marketplace) && hasAny(combined, terms.provider);
  const organizationBuyer = hasAny(`${target} ${input.monetization || ""}`, terms.organizationBuyer);
  const individualUser = hasAny(`${target} ${input.problem || ""}`, terms.individualUser);
  const providerOperator = hasAny(combined, terms.provider);
  const payerStatus = inferPayerStatus(input, multiActor);
  const approverStatus = inferApproverStatus(input, multiActor);

  const endUser = individualUser ? firstMatchLabel(`${target} ${input.problem || ""}`, userLabels[language], "") : "";
  const buyer = organizationBuyer ? firstMatchLabel(`${input.monetization || ""} ${target}`, buyerLabels[language], "") : "";
  const provider = providerOperator ? firstMatchLabel(combined, providerLabels[language], "") : "";

  const ambiguities = [];
  if (payerStatus === "ambiguous") ambiguities.push("payer");
  if (approverStatus === "ambiguous") ambiguities.push("approver");
  if (marketplace && !provider) ambiguities.push("provider");
  if (multiActor && !endUser && !buyer && !provider) ambiguities.push("stakeholders");

  const roleConflict =
    multiActor &&
    payerStatus === "ambiguous" &&
    hasAny(input.monetization || "", terms.vaguePayer) &&
    !hasAny(input.monetization || "", terms.payer);

  return {
    isMultiActor: multiActor,
    isMarketplace: marketplace,
    endUser,
    customerBuyer: buyer,
    payerStatus,
    approverStatus,
    providerOperator: provider,
    beneficiary: endUser || "",
    ambiguities: [...new Set(ambiguities)],
    hasRoleAmbiguity: ambiguities.length > 0,
    hasRoleConflict: roleConflict,
  };
}

export function describeStakeholderAmbiguity(stakeholderRoles = {}, language = "en") {
  const ambiguous = new Set(stakeholderRoles.ambiguities || []);

  if (!ambiguous.size) return "";

  if (language === "ar") {
    const parts = [];
    if (ambiguous.has("payer")) parts.push("من سيدفع");
    if (ambiguous.has("approver")) parts.push("من يوافق على الشراء");
    if (ambiguous.has("provider")) parts.push("دور مقدم الخدمة");
    if (ambiguous.has("stakeholders")) parts.push("الأطراف المشاركة");
    return parts.length ? parts.join("، ") : "الأدوار الأساسية";
  }

  const parts = [];
  if (ambiguous.has("payer")) parts.push("who pays");
  if (ambiguous.has("approver")) parts.push("who approves the purchase");
  if (ambiguous.has("provider")) parts.push("the provider role");
  if (ambiguous.has("stakeholders")) parts.push("the key stakeholders");
  return parts.length ? parts.join(", ") : "the key roles";
}
