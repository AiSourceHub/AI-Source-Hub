/**
 * Arabic localization defaults for shared core-engine states.
 *
 * Products can extend this dictionary with their own labels, report sections,
 * and recommendation copy.
 */
export const ar = {
  language: "ar",
  direction: "rtl",
  status: {
    ready: "جاهز",
    complete: "مكتمل",
    needsInput: "يتطلب إدخالاً",
    error: "خطأ",
  },
  labels: {
    score: "الدرجة",
    totalScore: "الدرجة الكلية",
    recommendation: "التوصية",
    nextAction: "الخطوة التالية",
    summary: "الملخص",
    confidence: "مستوى الثقة",
  },
  validation: {
    missingRequiredField: "أضف المعلومات المطلوبة قبل المتابعة.",
    incompleteInput: "بعض المعلومات غير مكتملة، لذلك قد تكون النتيجة إرشادية.",
  },
};

export default ar;

