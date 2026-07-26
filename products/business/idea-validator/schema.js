export const inputSchema = [
  {
    id: "businessIdea",
    type: "textarea",
    label: {
      en: "Business Idea",
      ar: "فكرة العمل",
    },
    placeholder: {
      en: "Example: A subscription tool that helps small restaurants reduce food waste.",
      ar: "مثال: أداة اشتراك تساعد المطاعم الصغيرة على تقليل هدر الطعام.",
    },
    helpText: {
      en: "Write one or two sentences. A rough idea is enough.",
      ar: "اكتب جملة أو جملتين. يكفي وصف أولي للفكرة.",
    },
    required: true,
    minLength: 10,
    maxLength: 600,
    validationMessage: {
      en: "Add a short description of the business idea.",
      ar: "أضف وصفاً مختصراً لفكرة العمل.",
    },
    direction: "auto",
  },
  {
    id: "targetCustomer",
    type: "textarea",
    label: {
      en: "Target Customer",
      ar: "العميل المستهدف",
    },
    placeholder: {
      en: "Example: Independent restaurant owners with one to three locations.",
      ar: "مثال: أصحاب المطاعم المستقلة التي لديها فرع إلى ثلاثة فروع.",
    },
    helpText: {
      en: "Name the specific group that has the problem.",
      ar: "اذكر الشريحة المحددة التي تعاني من المشكلة.",
    },
    required: true,
    minLength: 5,
    maxLength: 400,
    validationMessage: {
      en: "Add the target customer.",
      ar: "أضف العميل المستهدف.",
    },
    direction: "auto",
  },
  {
    id: "problem",
    type: "textarea",
    label: {
      en: "Problem Being Solved",
      ar: "المشكلة التي يتم حلها",
    },
    placeholder: {
      en: "Example: They waste money every week because inventory is overordered.",
      ar: "مثال: يهدرون المال أسبوعياً بسبب طلب كميات زائدة من المخزون.",
    },
    helpText: {
      en: "Describe the painful, costly, or repeated problem.",
      ar: "صف المشكلة المؤلمة أو المكلفة أو المتكررة.",
    },
    required: true,
    minLength: 8,
    maxLength: 500,
    validationMessage: {
      en: "Add the problem being solved.",
      ar: "أضف المشكلة التي يتم حلها.",
    },
    direction: "auto",
  },
  {
    id: "monetization",
    type: "textarea",
    label: {
      en: "Monetization Method",
      ar: "طريقة تحقيق الإيرادات",
    },
    placeholder: {
      en: "Example: Monthly subscription per location.",
      ar: "مثال: اشتراك شهري لكل فرع.",
    },
    helpText: {
      en: "Explain who pays and how the business makes money.",
      ar: "وضح من سيدفع وكيف ستحقق الفكرة الإيرادات.",
    },
    required: true,
    minLength: 4,
    maxLength: 300,
    validationMessage: {
      en: "Add the monetization method.",
      ar: "أضف طريقة تحقيق الإيرادات.",
    },
    direction: "auto",
  },
];

export const outputSchema = [
  { id: "verdict", type: "verdict", localized: true, required: true },
  { id: "totalScore", type: "score", localized: false, required: true },
  { id: "scoreBreakdown", type: "score breakdown", localized: true, required: true },
  { id: "confidence", type: "score", localized: true, required: true },
  { id: "biggestRisk", type: "risks", localized: true, required: true },
  { id: "nextAction", type: "next action", localized: true, required: true },
  { id: "improvedIdea", type: "generated text", localized: true, required: true },
];

export default {
  inputSchema,
  outputSchema,
};

