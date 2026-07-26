export const questionTemplate = [
  {
    id: "primaryInput",
    type: "textarea",
    label: { en: "Primary Input", ar: "المدخل الأساسي" },
    placeholder: { en: "Describe the situation", ar: "صف الحالة" },
    helpText: { en: "Keep it clear and specific.", ar: "اجعله واضحا ومحددا." },
    required: true,
    minLength: 10,
    maxLength: 600,
    validationMessage: {
      en: "Add enough detail to generate a useful result.",
      ar: "أضف تفاصيل كافية لإنشاء نتيجة مفيدة.",
    },
    direction: "auto",
  },
];

export const outputTemplate = [
  { id: "verdict", type: "verdict", localized: true, required: true },
  { id: "score", type: "score", localized: false, required: false },
  { id: "recommendation", type: "recommendation", localized: true, required: true },
  { id: "report", type: "report", localized: true, required: true },
];

export default {
  questions: questionTemplate,
  outputs: outputTemplate,
};

