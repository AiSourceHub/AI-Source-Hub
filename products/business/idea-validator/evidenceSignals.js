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

const evidenceDisqualifierPattern =
  /(?:\b(?:no|not|never|without|none|zero|untested|unvalidated|unverified|expected|projected|planned|assumed|estimated|hypothetical|potential|forecast|anticipated)\b|(?:لا يوجد|لا|ليس|ليست|لم|لن|بدون|غير|متوقع|متوقعة|مفترض|مفترضة|افتراضي|افتراضية|تقديري|تقديرية|محتمل|محتملة|مستهدف|مستهدفة))/iu;

function hasWordBoundary(text, index, length) {
  const before = text[index - 1] || "";
  const after = text[index + length] || "";
  return !/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after);
}

function localEvidencePrefix(text, index) {
  const prefix = text.slice(0, index);
  const parts = prefix.split(/[.!?;,\n]|\b(?:and|or|but|however)\b|(?:\sو\s|\sلكن\s|\sولكن\s)/iu);
  return parts.at(-1) || "";
}

function isPlanningLabelUsage(text, index, term) {
  if (term !== "revenue") return false;
  const suffix = text.slice(index + term.length);
  return /^\s+(?:model|mechanism|stream|strategy)\b/iu.test(suffix);
}

function countAffirmedEvidence(value, terms = []) {
  const text = normalize(value).toLowerCase();

  return terms.reduce((total, term) => {
    const normalizedTerm = term.toLowerCase();
    let fromIndex = 0;

    while (fromIndex < text.length) {
      const index = text.indexOf(normalizedTerm, fromIndex);
      if (index === -1) break;

      if (
        hasWordBoundary(text, index, normalizedTerm.length) &&
        !evidenceDisqualifierPattern.test(localEvidencePrefix(text, index)) &&
        !isPlanningLabelUsage(text, index, normalizedTerm)
      ) {
        return total + 1;
      }

      fromIndex = index + normalizedTerm.length;
    }

    return total;
  }, 0);
}

const evidenceTerms = {
  customerValidation: [
    "interviewed",
    "interviews",
    "customer conversations",
    "talked to",
    "spoke with",
    "surveyed",
    "survey",
    "feedback from",
    "customers said",
    "confirmed by",
    "observed",
    "مقابلات",
    "قابلنا",
    "تحدثنا",
    "محادثات",
    "استبيان",
    "استطلعنا",
    "ملاحظات من",
    "قال العملاء",
    "أكد",
    "لاحظنا",
  ],
  payment: [
    "paying customers",
    "paid customers",
    "revenue",
    "sales",
    "sold",
    "orders",
    "pre-orders",
    "invoice",
    "invoices",
    "contract",
    "contracts",
    "loi",
    "letter of intent",
    "signed interest",
    "paid pilot",
    "pilot paid",
    "عملاء يدفعون",
    "عملاء دافعون",
    "إيرادات",
    "مبيعات",
    "بعنا",
    "طلبات",
    "طلبات مسبقة",
    "فاتورة",
    "فواتير",
    "عقد",
    "عقود",
    "خطاب نوايا",
    "اهتمام موقع",
    "تجربة مدفوعة",
  ],
  usage: [
    "pilot",
    "mvp",
    "usage",
    "active users",
    "retention",
    "conversion",
    "activation",
    "churn",
    "analytics",
    "measured",
    "tested",
    "beta users",
    "تجربة تجريبية",
    "نموذج أولي",
    "استخدام",
    "مستخدمون نشطون",
    "احتفاظ",
    "تحويل",
    "تفعيل",
    "فقدان العملاء",
    "قياس",
    "اختبرنا",
    "مستخدمو بيتا",
  ],
  operational: [
    "supplier quote",
    "supplier pricing",
    "quotation",
    "quoted",
    "vendor quote",
    "operations data",
    "delivery data",
    "cost data",
    "production data",
    "supply agreement",
    "عرض سعر",
    "تسعير المورد",
    "تسعير من مورد",
    "سعر من مورد",
    "بيانات تشغيل",
    "بيانات توصيل",
    "بيانات تكلفة",
    "بيانات إنتاج",
    "اتفاق توريد",
  ],
  institutional: [
    "institutional discussion",
    "procurement discussion",
    "management approved",
    "approved pilot",
    "budget approved",
    "مناقشة مؤسسية",
    "محادثة مع المشتريات",
    "وافقت الإدارة",
    "تجربة معتمدة",
    "ميزانية معتمدة",
  ],
};

const claimTerms = {
  demand: [
    "customers will buy",
    "users will buy",
    "huge demand",
    "strong demand",
    "everyone needs",
    "users need this",
    "customers need this",
    "market needs",
    "will be popular",
    "العملاء سيشترون",
    "المستخدمون سيشترون",
    "طلب كبير",
    "طلب ضخم",
    "الجميع يحتاج",
    "المستخدمون يحتاجون",
    "العملاء يحتاجون",
    "السوق يحتاج",
    "سينتشر",
  ],
  profitability: [
    "will be profitable",
    "highly profitable",
    "guaranteed profit",
    "large profit",
    "weak competition",
    "no competitors",
    "مربح",
    "ربح كبير",
    "أرباح عالية",
    "ربح مضمون",
    "المنافسة ضعيفة",
    "لا يوجد منافسون",
  ],
};

function stageEvidenceConflict(input = {}, paymentSignals = 0, usageSignals = 0) {
  const stage = normalize(input.stage).toLowerCase();
  if (stage !== "idea") return false;

  return paymentSignals > 0 || usageSignals > 0;
}

export function interpretEvidenceSignals(input = {}, language = "en") {
  const combined = textOf(input);
  const paymentSource = [input.businessIdea, input.monetization, input.currentSolution, input.competitiveAdvantage]
    .filter(Boolean)
    .join(" ");
  const signals = {
    customerValidation: countAffirmedEvidence(combined, evidenceTerms.customerValidation),
    payment: countAffirmedEvidence(paymentSource, evidenceTerms.payment),
    usage: countAffirmedEvidence(combined, evidenceTerms.usage),
    operational: countAffirmedEvidence(combined, evidenceTerms.operational),
    institutional: countAffirmedEvidence(combined, evidenceTerms.institutional),
  };
  const unsupportedClaims = {
    demand: hasAny(combined, claimTerms.demand) && signals.customerValidation === 0 && signals.payment === 0 && signals.usage === 0,
    profitability: hasAny(combined, claimTerms.profitability) && signals.payment === 0 && signals.operational === 0,
  };
  const evidenceCount = Object.values(signals).reduce((total, count) => total + count, 0);
  const supportLevel = signals.payment || signals.usage >= 2 || evidenceCount >= 3 ? "strong" : evidenceCount > 0 ? "some" : "none";

  return {
    signals,
    supportLevel,
    hasAnyEvidence: evidenceCount > 0,
    hasCustomerEvidence: signals.customerValidation > 0 || signals.usage > 0 || signals.payment > 0,
    hasPaymentEvidence: signals.payment > 0,
    hasOperationalEvidence: signals.operational > 0,
    hasUnsupportedDemandClaim: unsupportedClaims.demand,
    hasUnsupportedProfitClaim: unsupportedClaims.profitability,
    hasUnsupportedClaims: unsupportedClaims.demand || unsupportedClaims.profitability,
    hasStageEvidenceConflict: stageEvidenceConflict(input, signals.payment, signals.usage),
    strongestEvidence:
      signals.payment > 0
        ? "payment"
        : signals.usage > 0
          ? "usage"
          : signals.customerValidation > 0
            ? "customer"
            : signals.operational > 0
              ? "operational"
              : signals.institutional > 0
                ? "institutional"
                : "",
    language,
  };
}

export function describeEvidenceGap(evidence = {}, language = "en") {
  if (evidence.hasUnsupportedDemandClaim) {
    return language === "ar" ? "ادعاء الطلب يحتاج إلى دليل من العملاء" : "the demand claim needs customer evidence";
  }

  if (evidence.hasUnsupportedProfitClaim) {
    return language === "ar" ? "ادعاء الربحية يحتاج إلى دليل سعري أو تشغيلي" : "the profitability claim needs pricing or operating evidence";
  }

  if (!evidence.hasCustomerEvidence) {
    return language === "ar" ? "الحاجة لم تُختبر بعد مع العملاء" : "the need has not been tested with customers yet";
  }

  if (!evidence.hasPaymentEvidence) {
    return language === "ar" ? "الاستعداد للدفع لم يثبت بعد" : "willingness to pay has not been shown yet";
  }

  return "";
}
