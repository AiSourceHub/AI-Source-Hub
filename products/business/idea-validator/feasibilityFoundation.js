function normalize(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function textOf(input = {}, extraDetails = {}) {
  return [
    input.businessIdea,
    input.targetCustomer,
    input.problem,
    input.monetization,
    input.currentSolution,
    input.competitiveAdvantage,
    input.stage,
    ...Object.values(extraDetails || {}),
  ]
    .filter(Boolean)
    .join(" ");
}

function hasAny(value, patterns = []) {
  const text = normalize(value);
  return patterns.some((pattern) => pattern.test(text));
}

function localize(value, language = "en") {
  return value?.[language] || value?.en || "";
}

const categoryLabels = {
  startupCapital: { en: "Startup capital", ar: "رأس المال التأسيسي" },
  recurringCosts: { en: "Recurring operating costs", ar: "التكاليف التشغيلية المتكررة" },
  locationPremises: { en: "Location and premises", ar: "الموقع والمقر" },
  equipmentTools: { en: "Equipment and tools", ar: "المعدات والأدوات" },
  inventoryMaterials: { en: "Inventory or raw materials", ar: "المخزون أو المواد الخام" },
  laborRolesSkills: { en: "Labor roles and skills", ar: "الأدوار والمهارات التشغيلية" },
  licensesCompliance: { en: "Licenses and compliance", ar: "التراخيص والامتثال" },
  suppliersDependencies: { en: "Suppliers and dependencies", ar: "الموردون والاعتماديات" },
  operatingCapacity: { en: "Operating capacity", ar: "الطاقة التشغيلية" },
  implementationTimeline: { en: "Implementation timeline", ar: "الجدول الزمني للتنفيذ" },
};

const businessTypeLabels = {
  industrial_manufacturing: { en: "Industrial / manufacturing", ar: "صناعي / تصنيعي" },
  service: { en: "Service business", ar: "خدمة" },
  retail_trading: { en: "Retail / trading", ar: "تجارة / بيع" },
  digital_software: { en: "Digital / software", ar: "رقمي / برمجي" },
  marketplace_platform: { en: "Marketplace / platform", ar: "سوق / منصة" },
  generic: { en: "General business", ar: "عمل عام" },
};

const typePatterns = {
  industrial_manufacturing: [
    /\b(factory|plant|manufacturing|industrial|production line|machinery|machine|assembly|raw material|fabrication)\b/i,
    /(مصنع|معمل|تصنيع|صناعي|خط إنتاج|معدات|مكائن|ورشة|مواد خام|إنتاج)/u,
  ],
  marketplace_platform: [
    /\b(marketplace|platform connects|connects .* with|two-sided|providers and buyers|sellers and buyers|app store|listing)\b/i,
    /(سوق|منصة تربط|يربط .* مع|طرفين|مقدمي الخدمة والعملاء|البائعين والمشترين|قوائم)/u,
  ],
  digital_software: [
    /\b(software|saas|app|dashboard|automation|api|digital tool|mobile app|web app|analytics|workflow tool)\b/i,
    /(برمج|تطبيق|لوحة تحكم|أتمتة|أداة رقمية|منصة رقمية|واجهة برمجة|تحليلات)/u,
  ],
  retail_trading: [
    /\b(retail|shop|store|ecommerce|e-commerce|trading|import|export|inventory|products|wholesale|resell)\b/i,
    /(متجر|تجزئة|تجارة|استيراد|تصدير|مخزون|منتجات|جملة|بيع)/u,
  ],
  service: [
    /\b(service|consulting|agency|clinic|maintenance|repair|delivery|cleaning|wash|washing|coaching|training|home service|professional service)\b/i,
    /(خدمة|استشارة|وكالة|عيادة|صيانة|إصلاح|توصيل|تنظيف|غسيل|تدريب|خدمة منزلية|خدمات مهنية)/u,
  ],
};

const knownSignals = {
  startupCapital: [
    /\b(budget|capital|startup cost|investment|funding)\b.{0,40}\d/i,
    /\d[\d,\s]*(?:sar|usd|ريال|دولار)/iu,
    /(ميزانية|رأس مال|تمويل|تكلفة تأسيس).{0,40}\d/u,
  ],
  recurringCosts: [
    /\b(monthly cost|rent|salary|salaries|hosting|software cost|utilities|operating cost|opex)\b/i,
    /(تكلفة شهرية|إيجار|رواتب|استضافة|كهرباء|ماء|تكلفة تشغيلية|مصروفات تشغيل)/u,
  ],
  locationPremises: [
    /\b(location|city|region|premises|office|shop|warehouse|factory site|land|facility)\b/i,
    /(موقع|مدينة|منطقة|مقر|مكتب|محل|مستودع|أرض|منشأة)/u,
  ],
  equipmentTools: [
    /\b(equipment|machine|machinery|tools|devices|software stack|hosting|laptop|vehicle|fleet)\b/i,
    /(معدات|مكائن|آلات|أدوات|أجهزة|استضافة|سيارة|أسطول|تقنيات)/u,
  ],
  inventoryMaterials: [
    /\b(inventory|stock|raw material|materials|supplies|goods|products|parts|feedstock)\b/i,
    /(مخزون|مواد خام|مواد|توريدات|بضائع|منتجات|قطع|مدخلات)/u,
  ],
  laborRolesSkills: [
    /\b(team|staff|employee|operator|technician|developer|designer|sales|support|nurse|doctor|driver|trainer)\b/i,
    /(فريق|موظف|عمالة|مشغل|فني|مبرمج|مصمم|مبيعات|دعم|ممرض|طبيب|سائق|مدرب)/u,
  ],
  licensesCompliance: [
    /\b(license|permit|approval|certification|inspection|compliance|regulated|customs|vendor approval)\b/i,
    /(ترخيص|تصريح|موافقة|اعتماد|تفتيش|امتثال|تنظيمي|جمرك|اعتماد مورد)/u,
  ],
  suppliersDependencies: [
    /\b(supplier|vendor|partner|dependency|api|manufacturer|distributor|contract|supply)\b/i,
    /(مورد|شريك|اعتماد|واجهة برمجة|مصنع|موزع|عقد|توريد)/u,
  ],
  operatingCapacity: [
    /\b(capacity|per day|per week|per month|users per|orders per|clients per|tons|kg|sessions)\b/i,
    /(طاقة|يومياً|أسبوعياً|شهرياً|طلبات|عملاء|طن|كيلو|جلسات)/u,
  ],
  implementationTimeline: [
    /\b(timeline|launch in|start in|weeks|months|phase|milestone|implementation)\b/i,
    /(جدول زمني|الإطلاق خلال|البدء خلال|أسابيع|أشهر|مرحلة|تنفيذ)/u,
  ],
};

const verifiedEvidenceSignals = [
  /\b(quotation|quote received|supplier quote|contract|signed|invoice|paid|pilot|measured|verified|approved|inspection passed)\b/i,
  /(عرض سعر|عقد|موقّع|فاتورة|مدفوع|تجربة|قياس|تم التحقق|تمت الموافقة|اجتزنا التفتيش)/u,
];

const calculatedEstimateSignals = [
  /\b(calculated|formula|unit cost|per unit|break-even|quantity x price|times price|cost model)\b/i,
  /(محسوب|معادلة|تكلفة الوحدة|سعر الوحدة|نقطة التعادل|نموذج تكلفة|الكمية.*السعر|ضرب.*السعر)/u,
];

const assumptionSignals = [
  /\b(assume|estimate|expected|likely|maybe|around|roughly|we think|we believe)\b/i,
  /\bestimated\b/i,
  /(نفترض|تقدير|متوقع|غالباً|ربما|تقريباً|نعتقد)/u,
];

const questionBank = {
  startupCapital: {
    required: true,
    question: {
      en: "What startup capital is available, and what main setup costs must it cover?",
      ar: "ما رأس المال المتاح، وما أهم تكاليف التأسيس التي يجب أن يغطيها؟",
    },
  },
  recurringCosts: {
    required: true,
    question: {
      en: "What monthly operating costs are expected, such as rent, payroll, software, utilities, logistics, or support?",
      ar: "ما التكاليف التشغيلية الشهرية المتوقعة مثل الإيجار أو الرواتب أو البرمجيات أو الخدمات أو التوصيل أو الدعم؟",
    },
  },
  locationPremises: {
    required: true,
    question: {
      en: "What location, premises, office, shop, warehouse, or operating site is needed?",
      ar: "ما الموقع أو المقر أو المكتب أو المحل أو المستودع أو موقع التشغيل المطلوب؟",
    },
  },
  equipmentTools: {
    required: true,
    question: {
      en: "What equipment, tools, vehicles, devices, software stack, or operating systems are needed to deliver the first version?",
      ar: "ما المعدات أو الأدوات أو المركبات أو الأجهزة أو البرمجيات أو أنظمة التشغيل المطلوبة لتقديم النسخة الأولى؟",
    },
  },
  inventoryMaterials: {
    required: true,
    question: {
      en: "What inventory, raw materials, supplies, goods, or inputs are needed, and how will they be sourced?",
      ar: "ما المخزون أو المواد الخام أو التوريدات أو البضائع أو المدخلات المطلوبة، وكيف سيتم توفيرها؟",
    },
  },
  laborRolesSkills: {
    required: true,
    question: {
      en: "What roles and skills are required to operate the business from day one?",
      ar: "ما الأدوار والمهارات المطلوبة لتشغيل العمل من اليوم الأول؟",
    },
  },
  licensesCompliance: {
    required: true,
    question: {
      en: "What permits, licenses, certifications, inspections, approvals, or compliance checks must be clarified before launch?",
      ar: "ما التصاريح أو التراخيص أو الاعتمادات أو التفتيش أو الموافقات أو متطلبات الامتثال التي يجب توضيحها قبل الإطلاق؟",
    },
  },
  suppliersDependencies: {
    required: true,
    question: {
      en: "Which suppliers, partners, platforms, APIs, vendors, or external dependencies must be secured?",
      ar: "ما الموردون أو الشركاء أو المنصات أو واجهات البرمجة أو الجهات الخارجية التي يجب تأمينها؟",
    },
  },
  operatingCapacity: {
    required: true,
    question: {
      en: "What operating capacity is required for the first test, such as orders, clients, users, units, sessions, or output per day or month?",
      ar: "ما الطاقة التشغيلية المطلوبة للاختبار الأول مثل الطلبات أو العملاء أو المستخدمين أو الوحدات أو الجلسات أو المخرجات يومياً أو شهرياً؟",
    },
  },
  implementationTimeline: {
    required: true,
    question: {
      en: "What implementation timeline is realistic for setup, testing, launch, and the first measurable milestone?",
      ar: "ما الجدول الزمني الواقعي للتجهيز والاختبار والإطلاق وأول محطة قياس واضحة؟",
    },
  },
};

const requiredByType = {
  industrial_manufacturing: [
    "startupCapital",
    "recurringCosts",
    "locationPremises",
    "equipmentTools",
    "inventoryMaterials",
    "operatingCapacity",
    "laborRolesSkills",
    "licensesCompliance",
    "suppliersDependencies",
    "implementationTimeline",
  ],
  service: [
    "startupCapital",
    "recurringCosts",
    "equipmentTools",
    "laborRolesSkills",
    "licensesCompliance",
    "suppliersDependencies",
    "operatingCapacity",
    "implementationTimeline",
  ],
  retail_trading: [
    "startupCapital",
    "recurringCosts",
    "locationPremises",
    "equipmentTools",
    "inventoryMaterials",
    "licensesCompliance",
    "suppliersDependencies",
    "operatingCapacity",
    "implementationTimeline",
  ],
  digital_software: [
    "startupCapital",
    "recurringCosts",
    "equipmentTools",
    "laborRolesSkills",
    "licensesCompliance",
    "suppliersDependencies",
    "operatingCapacity",
    "implementationTimeline",
  ],
  marketplace_platform: [
    "startupCapital",
    "recurringCosts",
    "suppliersDependencies",
    "operatingCapacity",
    "equipmentTools",
    "laborRolesSkills",
    "licensesCompliance",
    "implementationTimeline",
  ],
  generic: [
    "startupCapital",
    "recurringCosts",
    "equipmentTools",
    "laborRolesSkills",
    "suppliersDependencies",
    "operatingCapacity",
    "implementationTimeline",
  ],
};

const optionalByType = {
  service: ["locationPremises"],
  digital_software: [],
  marketplace_platform: ["locationPremises"],
  generic: ["locationPremises", "inventoryMaterials", "licensesCompliance"],
};

const typeSpecificQuestions = {
  industrial_manufacturing: {
    equipmentTools: {
      en: "Which equipment categories, installation needs, utilities, maintenance, and supplier quotations are known?",
      ar: "ما فئات المعدات واحتياجات التركيب والخدمات والصيانة وعروض الموردين المعروفة؟",
    },
    inventoryMaterials: {
      en: "What raw materials or production inputs are required, in what quantity, and from which suppliers?",
      ar: "ما المواد الخام أو مدخلات الإنتاج المطلوبة، وبأي كمية، ومن أي موردين؟",
    },
    operatingCapacity: {
      en: "What target production capacity is required per day or month, and what bottleneck controls it?",
      ar: "ما الطاقة الإنتاجية المستهدفة يومياً أو شهرياً، وما نقطة الاختناق التي تتحكم بها؟",
    },
  },
  service: {
    laborRolesSkills: {
      en: "Who will deliver the service, what skills are required, and how many clients can one operator handle?",
      ar: "من سيقدم الخدمة، وما المهارات المطلوبة، وكم عميلاً يستطيع كل مشغل خدمته؟",
    },
    operatingCapacity: {
      en: "How many clients, visits, sessions, or jobs can the team deliver per day or week?",
      ar: "كم عميلاً أو زيارة أو جلسة أو مهمة يستطيع الفريق تقديمها يومياً أو أسبوعياً؟",
    },
  },
  retail_trading: {
    inventoryMaterials: {
      en: "What first inventory is needed, what reorder cycle is expected, and what minimum supplier quantity applies?",
      ar: "ما المخزون الأولي المطلوب، وما دورة إعادة الطلب، وما الحد الأدنى للشراء من المورد؟",
    },
    suppliersDependencies: {
      en: "Which suppliers, importers, distributors, or logistics partners are needed for reliable stock?",
      ar: "ما الموردون أو المستوردون أو الموزعون أو شركاء التوصيل المطلوبون لضمان توفر المخزون؟",
    },
  },
  digital_software: {
    equipmentTools: {
      en: "What software stack, hosting, integrations, data tools, and support tools are needed for the first version?",
      ar: "ما حزمة البرمجيات والاستضافة والتكاملات وأدوات البيانات والدعم المطلوبة للنسخة الأولى؟",
    },
    operatingCapacity: {
      en: "What user, transaction, support, or uptime capacity must the first version handle?",
      ar: "ما عدد المستخدمين أو العمليات أو طلبات الدعم أو مستوى التوفر الذي يجب أن تتحمله النسخة الأولى؟",
    },
  },
  marketplace_platform: {
    suppliersDependencies: {
      en: "How will both sides be onboarded, and what provider, buyer, payment, trust, or platform dependencies must work first?",
      ar: "كيف سيتم ضم الطرفين، وما اعتماديات مقدم الخدمة والمشتري والدفع والثقة والمنصة التي يجب أن تعمل أولاً؟",
    },
    operatingCapacity: {
      en: "What first liquidity target is needed, such as active providers, active buyers, listings, bookings, or completed transactions?",
      ar: "ما هدف السيولة الأول مثل مقدمي الخدمة النشطين أو المشترين النشطين أو القوائم أو الحجوزات أو العمليات المكتملة؟",
    },
  },
};

const refinementQuestions = {
  startupCapital: {
    en: "What portion of the budget is based on quotes rather than rough assumptions?",
    ar: "ما الجزء من الميزانية المبني على عروض أسعار بدلاً من افتراضات تقريبية؟",
  },
  recurringCosts: {
    en: "Which monthly cost is most likely to exceed the current estimate?",
    ar: "ما التكلفة الشهرية الأكثر احتمالاً لتجاوز التقدير الحالي؟",
  },
  implementationTimeline: {
    en: "What milestone proves the setup is ready for a real customer test?",
    ar: "ما المرحلة التي تثبت أن التجهيز جاهز لاختبار حقيقي مع عميل؟",
  },
};

const guidedCopy = {
  en: {
    heading: "Let’s understand your idea more clearly",
    body:
      "We’ll ask short questions that fit your project type, then use your answers to prepare a clearer view of feasibility, cost, operations, and next steps.",
    policy:
      "AI Source Hub separates what is already known, what is assumed, what is missing, what you can answer now, and what needs research or supplier input.",
    closing: "Answer the short questions below. You can move back and forward without losing your answers.",
    detailsTitle: "Guided follow-up",
    readyHeading: "Ready for preliminary feasibility analysis",
    readyBody:
      "Your original idea and structured follow-up answers are now separated. The next stage can prepare a preliminary feasibility view without mixing founder questions into customer problems.",
    readyPolicy:
      "No precise capital estimate is shown yet. Cost and operating conclusions must still be marked as facts, external evidence, assumptions, calculated estimates, or unresolved unknowns.",
    readyClosing: "The next build should turn this structured foundation into the full preliminary feasibility output.",
    missingMessage: "Some required follow-up answers are still missing.",
  },
  ar: {
    heading: "دعنا نفهم فكرتك بشكل أدق",
    body:
      "سنطرح عليك أسئلة قصيرة تناسب نوع مشروعك، ثم نستخدم إجاباتك لإعداد تقييم أوضح للجدوى والتكلفة والتشغيل والخطوات التالية.",
    policy:
      "يفصل AI Source Hub بين ما هو معروف، وما هو افتراض، وما هو ناقص، وما يمكنك الإجابة عنه الآن، وما يحتاج إلى بحث أو عرض مورد.",
    closing: "أجب عن الأسئلة القصيرة أدناه. يمكنك الرجوع والتقدم دون فقدان إجاباتك.",
    detailsTitle: "أسئلة متابعة موجّهة",
    readyHeading: "جاهز للتحليل الأولي للجدوى",
    readyBody:
      "تم فصل الفكرة الأصلية عن إجابات المتابعة المنظمة. يمكن للمرحلة التالية إعداد تقييم أولي للجدوى دون خلط أسئلة المؤسس بمشكلة العميل.",
    readyPolicy:
      "لن يظهر تقدير دقيق لرأس المال الآن. يجب أن تبقى استنتاجات التكلفة والتشغيل مصنفة كحقائق، أو أدلة خارجية، أو افتراضات، أو تقديرات محسوبة، أو نقاط غير محسومة.",
    readyClosing: "البناء التالي يجب أن يحول هذه القاعدة المنظمة إلى مخرج جدوى أولي كامل.",
    missingMessage: "ما زالت بعض إجابات المتابعة المطلوبة ناقصة.",
  },
};

const userExperienceOptions = [
  {
    value: "first_time_beginner",
    label: {
      en: "This is my first business",
      ar: "هذه أول تجربة لي في إنشاء مشروع",
    },
  },
  {
    value: "limited_experience",
    label: {
      en: "I have limited experience and I’m evaluating a new idea",
      ar: "لدي خبرة محدودة وأقيّم فكرة جديدة",
    },
  },
];

const projectStageOptions = [
  { value: "initial_idea", label: { en: "initial idea", ar: "فكرة أولية" } },
  { value: "researching", label: { en: "researching", ar: "مرحلة البحث" } },
  { value: "preparing_to_launch", label: { en: "preparing to launch", ar: "الاستعداد للإطلاق" } },
  { value: "operating", label: { en: "operating", ar: "مشروع يعمل حاليًا" } },
  { value: "improving", label: { en: "improving", ar: "تطوير مشروع قائم" } },
  { value: "expanding", label: { en: "expanding", ar: "التوسع" } },
];

const guidedSteps = [
  {
    id: "profileStage",
    title: { en: "Your context", ar: "سياقك" },
    fields: [
      "userExperienceLevel",
      "firstProject",
      "projectStageIntent",
      "country",
      "city",
      "decisionObjective",
      "classificationConfirmation",
      "projectTypeCorrection",
      "operatingModelCorrection",
      "classificationCorrectionReason",
    ],
  },
  {
    id: "currentBusiness",
    title: { en: "Current business", ar: "المشروع الحالي" },
    fields: [
      "improvementObjective",
      "currentRevenue",
      "currentCostsMargins",
      "currentCustomerVolume",
      "repeatBusiness",
      "currentCapacityStaffing",
      "currentBottlenecks",
    ],
  },
  {
    id: "ideaSetup",
    title: { en: "Idea setup", ar: "إعداد الفكرة" },
    fields: ["country",
    "city", "operatingFormat", "deliveryModel", "targetCustomerPromise"],
  },
  {
    id: "scaleLocation",
    title: { en: "Scale and location", ar: "الحجم والموقع" },
    fields: ["targetCapacity", "premisesStatus", "spaceRequirement", "locationCostIncluded"],
  },
  {
    id: "capitalEquipment",
    title: { en: "Capital and equipment", ar: "رأس المال والمعدات" },
    fields: ["budgetRange", "quotationStatus", "equipmentLevel", "installationMaintenance"],
  },
  {
    id: "operations",
    title: { en: "Operations", ar: "التشغيل" },
    fields: ["utilitiesNeeds", "operatingHours", "staffingPlan", "licensesDependencies", "suppliersDependencies"],
  },
  {
    id: "evidenceResearch",
    title: { en: "Evidence and research", ar: "الأدلة والبحث" },
    fields: ["knownFacts", "researchNeeded", "professionalInputs", "assumptionsToValidate"],
  },
];

const guidedFieldBank = {
  userExperienceLevel: {
    category: "implementationTimeline",
    source: "user_answerable",
    required: true,
    type: "select",
    label: { en: "Which description fits you best?", ar: "أي وصف يناسبك أكثر؟" },
    help: {
      en: "Choose the closest answer. You can change it later.",
      ar: "اختر الوصف الأقرب. يمكنك تغييره لاحقاً.",
    },
    placeholder: { en: "Select your experience level", ar: "اختر مستوى الخبرة" },
    options: userExperienceOptions,
  },
  projectStageIntent: {
    category: "implementationTimeline",
    source: "user_answerable",
    required: true,
    type: "select",
    label: { en: "What stage is this project in?", ar: "في أي مرحلة يوجد المشروع؟" },
    help: {
      en: "Stage and experience are separate. A beginner may already operate a business, and an experienced founder may still be at idea stage.",
      ar: "المرحلة والخبرة أمران منفصلان. قد يكون المبتدئ لديه مشروع قائم، وقد يكون صاحب الخبرة في مرحلة فكرة أولية.",
    },
    placeholder: { en: "Select project stage", ar: "اختر مرحلة المشروع" },
    options: projectStageOptions,
  },
  firstProject: {
    category: "implementationTimeline",
    source: "user_answerable",
    required: true,
    type: "select",
    label: { en: "Is this your first project?", ar: "هل هذا أول مشروع لك؟" },
    help: {
      en: "This helps us keep the guidance at the right level.",
      ar: "يساعدنا ذلك على جعل الإرشاد مناسباً لمستوى خبرتك.",
    },
    placeholder: { en: "Select answer", ar: "اختر الإجابة" },
    options: [
      { value: "yes", label: { en: "Yes", ar: "نعم" } },
      { value: "no", label: { en: "No", ar: "لا" } },
      { value: "not_sure", label: { en: "Not sure", ar: "غير متأكد" } },
    ],
  },
  country: {
    category: "locationPremises",
    source: "user_answerable",
    required: true,
    label: { en: "Country", ar: "الدولة" },
    help: {
      en: "A country is enough for now. It affects later research, permits, and cost ranges.",
      ar: "يكفي اسم الدولة الآن. سيؤثر ذلك لاحقاً في البحث والتراخيص ونطاقات التكلفة.",
    },
    placeholder: { en: "Example: Saudi Arabia", ar: "مثال: السعودية" },
  },
  city: {
    category: "locationPremises",
    source: "user_answerable",
    required: false,
    label: { en: "City or region", ar: "المدينة أو المنطقة" },
    help: {
      en: "Add it if relevant. You can write 'not selected yet'.",
      ar: "أضفها إذا كانت مهمة. يمكنك كتابة «لم أحدد بعد».",
    },
    placeholder: { en: "Example: Riyadh, or not selected yet", ar: "مثال: الرياض، أو لم أحدد بعد" },
  },
  decisionObjective: {
    category: "implementationTimeline",
    source: "user_answerable",
    required: true,
    label: { en: "What decision do you want help with?", ar: "ما القرار الذي تريد المساعدة فيه؟" },
    help: {
      en: "Use simple words: start, pause, estimate cost, choose location, understand risks, or prepare next steps.",
      ar: "استخدم كلمات بسيطة: أبدأ، أتوقف، أقدّر التكلفة، أختار الموقع، أفهم المخاطر، أو أجهّز الخطوات التالية.",
    },
    placeholder: { en: "Example: know whether to continue before spending money", ar: "مثال: أعرف هل أستمر قبل أن أصرف مالاً" },
  },
  countryCity: {
    category: "locationPremises",
    source: "user_answerable",
    required: true,
    label: { en: "Country and city", ar: "الدولة والمدينة" },
    help: {
      en: "A city is enough for now. Location affects permits, suppliers, rent, and demand.",
      ar: "يكفي اسم المدينة الآن. الموقع يؤثر في التراخيص والموردين والإيجار والطلب.",
    },
    placeholder: { en: "Example: Riyadh, Saudi Arabia", ar: "مثال: الرياض، السعودية" },
  },
  operatingFormat: {
    category: "locationPremises",
    source: "user_answerable",
    required: true,
    label: { en: "Operating format", ar: "طريقة التشغيل" },
    help: {
      en: "Choose the closest model so the follow-up questions stay practical.",
      ar: "اختر النموذج الأقرب حتى تكون الأسئلة التالية عملية.",
    },
    type: "select",
    placeholder: { en: "Select format", ar: "اختر طريقة التشغيل" },
    options: [
      { value: "fixed_site", label: { en: "Fixed site", ar: "موقع ثابت" } },
      { value: "mobile", label: { en: "Mobile", ar: "متنقل" } },
      { value: "online", label: { en: "Online / digital", ar: "رقمي / عبر الإنترنت" } },
      { value: "hybrid", label: { en: "Hybrid", ar: "مختلط" } },
      { value: "not_sure", label: { en: "Not sure yet", ar: "غير متأكد بعد" } },
    ],
  },
  deliveryModel: {
    category: "equipmentTools",
    source: "user_answerable",
    required: true,
    label: { en: "Delivery or automation level", ar: "مستوى التنفيذ أو الأتمتة" },
    help: {
      en: "Describe whether the work is manual, semi-automated, automated, software-led, or partner-led.",
      ar: "وضح هل التنفيذ يدوي، شبه آلي، آلي، برمجي، أو يعتمد على شركاء.",
    },
    placeholder: { en: "Example: semi-automated with two operators", ar: "مثال: شبه آلي مع مشغلين اثنين" },
  },
  targetCustomerPromise: {
    category: "operatingCapacity",
    source: "user_answerable",
    required: true,
    label: { en: "Intended customer and promise", ar: "العميل المقصود والوعد الأساسي" },
    help: {
      en: "Say who receives value and what clear promise the service or product makes.",
      ar: "اذكر من سيستفيد وما الوعد الواضح الذي تقدمه الخدمة أو المنتج.",
    },
    placeholder: { en: "Example: busy drivers get a faster, cleaner wash", ar: "مثال: أصحاب السيارات المشغولون يحصلون على غسيل أسرع وأنظف" },
  },
  targetCapacity: {
    category: "operatingCapacity",
    source: "user_answerable",
    required: true,
    label: { en: "Target operating capacity", ar: "الطاقة التشغيلية المستهدفة" },
    help: {
      en: "Use the practical unit for your idea: customers, orders, cars, users, sessions, units, or visits.",
      ar: "استخدم الوحدة المناسبة لفكرتك: عملاء، طلبات، سيارات، مستخدمون، جلسات، وحدات، أو زيارات.",
    },
    placeholder: { en: "Example: 40 cars per day or 200 orders per month", ar: "مثال: 40 سيارة يومياً أو 200 طلب شهرياً" },
  },
  premisesStatus: {
    category: "locationPremises",
    source: "user_answerable",
    required: true,
    label: { en: "Site or premises status", ar: "حالة الموقع أو المقر" },
    help: {
      en: "This keeps owned, rented, and undecided locations separate from the customer problem.",
      ar: "هذا يفصل بين الموقع المملوك أو المستأجر أو غير المحدد وبين مشكلة العميل.",
    },
    type: "select",
    placeholder: { en: "Select status", ar: "اختر الحالة" },
    options: [
      { value: "owned", label: { en: "Owned", ar: "مملوك" } },
      { value: "rented", label: { en: "Rented", ar: "مستأجر" } },
      { value: "not_selected", label: { en: "Not selected yet", ar: "لم يتم اختياره بعد" } },
      { value: "not_needed", label: { en: "Not needed", ar: "غير مطلوب" } },
    ],
  },
  spaceRequirement: {
    category: "locationPremises",
    source: "external_research",
    required: false,
    label: { en: "Approximate space needed", ar: "المساحة التقريبية المطلوبة" },
    help: {
      en: "If you do not know, write 'unknown'. This may require local research or a professional estimate.",
      ar: "إذا لم تكن تعرف، اكتب «غير معروف». قد يحتاج ذلك إلى بحث محلي أو تقدير متخصص.",
    },
    placeholder: { en: "Example: unknown, or around 250 square meters", ar: "مثال: غير معروف، أو نحو 250 متر مربع" },
  },
  locationCostIncluded: {
    category: "startupCapital",
    source: "assumption_to_confirm",
    required: false,
    label: { en: "Are land, rent, or fit-out costs included in the budget?", ar: "هل تشمل الميزانية الأرض أو الإيجار أو التجهيز؟" },
    help: {
      en: "This prevents a budget from looking complete when location costs are excluded.",
      ar: "هذا يمنع ظهور الميزانية وكأنها مكتملة بينما تكاليف الموقع غير محسوبة.",
    },
    type: "select",
    placeholder: { en: "Select answer", ar: "اختر الإجابة" },
    options: [
      { value: "included", label: { en: "Included", ar: "مشمولة" } },
      { value: "excluded", label: { en: "Not included", ar: "غير مشمولة" } },
      { value: "unknown", label: { en: "Not sure", ar: "غير متأكد" } },
    ],
  },
  budgetRange: {
    category: "startupCapital",
    source: "user_answerable",
    required: true,
    label: { en: "Available budget range", ar: "نطاق الميزانية المتاحة" },
    help: {
      en: "A range is better than a precise guess. AI Source Hub will not invent a capital number.",
      ar: "النطاق أفضل من رقم دقيق غير مؤكد. لن يخترع AI Source Hub رقماً لرأس المال.",
    },
    placeholder: { en: "Example: 150,000-250,000 SAR", ar: "مثال: 150,000 إلى 250,000 ريال" },
  },
  quotationStatus: {
    category: "equipmentTools",
    source: "supplier_quote",
    required: true,
    label: { en: "Existing equipment or supplier quotations", ar: "عروض المعدات أو الموردين المتوفرة" },
    help: {
      en: "Say whether you already have quotes, rough online prices, or no pricing evidence yet.",
      ar: "اذكر هل لديك عروض أسعار، أسعار تقريبية من الإنترنت، أو لا يوجد دليل سعري بعد.",
    },
    placeholder: { en: "Example: no quotes yet, or two supplier quotes received", ar: "مثال: لا توجد عروض بعد، أو تم استلام عرضين من موردين" },
  },
  equipmentLevel: {
    category: "equipmentTools",
    source: "user_answerable",
    required: true,
    label: { en: "Equipment or tool level required", ar: "مستوى المعدات أو الأدوات المطلوبة" },
    help: {
      en: "Use plain words: basic, mid-level, automated, premium, custom-built, or unknown.",
      ar: "استخدم وصفاً بسيطاً: أساسي، متوسط، آلي، عالي، مخصص، أو غير معروف.",
    },
    placeholder: { en: "Example: automatic entry-level equipment", ar: "مثال: معدات آلية بمستوى ابتدائي" },
  },
  installationMaintenance: {
    category: "equipmentTools",
    source: "supplier_quote",
    required: false,
    label: { en: "Installation and maintenance expectations", ar: "توقعات التركيب والصيانة" },
    help: {
      en: "This often needs supplier input, not a founder guess.",
      ar: "غالباً يحتاج هذا إلى إفادة مورد، وليس مجرد تخمين من المؤسس.",
    },
    placeholder: { en: "Example: supplier installs and maintains quarterly", ar: "مثال: المورد يركب المعدات ويصونها كل ثلاثة أشهر" },
  },
  utilitiesNeeds: {
    category: "recurringCosts",
    source: "external_research",
    required: true,
    label: { en: "Utilities, infrastructure, or technical requirements", ar: "متطلبات الخدمات أو البنية أو التقنية" },
    help: {
      en: "Mention water, electricity, drainage, internet, hosting, storage, vehicles, or other operating needs.",
      ar: "اذكر الماء، الكهرباء، التصريف، الإنترنت، الاستضافة، التخزين، المركبات، أو أي احتياجات تشغيلية.",
    },
    placeholder: { en: "Example: water, electricity, drainage, and recycling system", ar: "مثال: ماء، كهرباء، تصريف، ونظام إعادة استخدام" },
  },
  operatingHours: {
    category: "operatingCapacity",
    source: "user_answerable",
    required: false,
    label: { en: "Operating hours or service window", ar: "ساعات التشغيل أو وقت تقديم الخدمة" },
    help: {
      en: "This helps estimate labor and capacity later.",
      ar: "يساعد هذا لاحقاً في تقدير العمالة والطاقة التشغيلية.",
    },
    placeholder: { en: "Example: 8 AM to 10 PM", ar: "مثال: من 8 صباحاً إلى 10 مساءً" },
  },
  staffingPlan: {
    category: "laborRolesSkills",
    source: "user_answerable",
    required: true,
    label: { en: "Staffing and required skills", ar: "العمالة والمهارات المطلوبة" },
    help: {
      en: "List the roles needed to operate the first version, even roughly.",
      ar: "اذكر الأدوار المطلوبة لتشغيل النسخة الأولى ولو بشكل تقريبي.",
    },
    placeholder: { en: "Example: two operators, one cashier, one maintenance technician", ar: "مثال: مشغلان، محاسب، وفني صيانة" },
  },
  licensesDependencies: {
    category: "licensesCompliance",
    source: "external_research",
    required: true,
    label: { en: "Licenses, approvals, or compliance checks", ar: "التراخيص أو الموافقات أو متطلبات الامتثال" },
    help: {
      en: "If unknown, say so. AI Source Hub should treat this as a research item, not a ruling.",
      ar: "إذا كانت غير معروفة، اذكر ذلك. سيتعامل معها AI Source Hub كبند بحث، وليس كحكم نهائي.",
    },
    placeholder: { en: "Example: municipality permit unknown", ar: "مثال: ترخيص البلدية غير معروف" },
  },
  suppliersDependencies: {
    category: "suppliersDependencies",
    source: "supplier_quote",
    required: true,
    label: { en: "Suppliers and dependencies", ar: "الموردون والاعتماديات" },
    help: {
      en: "Mention suppliers, platforms, contractors, APIs, logistics, or partners required to operate.",
      ar: "اذكر الموردين أو المنصات أو المقاولين أو واجهات البرمجة أو النقل أو الشركاء المطلوبين للتشغيل.",
    },
    placeholder: { en: "Example: equipment supplier, consumables supplier, maintenance contractor", ar: "مثال: مورد معدات، مورد مواد تشغيل، مقاول صيانة" },
  },
  knownFacts: {
    category: "implementationTimeline",
    source: "user_answerable",
    required: true,
    label: { en: "What do you already know?", ar: "ما الذي تعرفه حالياً؟" },
    help: {
      en: "Separate real information from wishes. Examples: visited sites, talked to buyers, got quotes, ran a pilot.",
      ar: "افصل المعلومات الفعلية عن التوقعات. أمثلة: زرت مواقع، تحدثت مع عملاء، حصلت على عروض، أجريت تجربة.",
    },
    placeholder: { en: "Example: visited two locations and spoke to three potential customers", ar: "مثال: زرت موقعين وتحدثت مع ثلاثة عملاء محتملين" },
  },
  researchNeeded: {
    category: "implementationTimeline",
    source: "external_research",
    required: true,
    label: { en: "What should AI Source Hub research or estimate later?", ar: "ما الذي يجب أن يبحثه أو يقدّره AI Source Hub لاحقاً؟" },
    help: {
      en: "Name the unknowns you want help with, such as market demand, permits, equipment ranges, or operating costs.",
      ar: "اذكر النقاط المجهولة التي تريد المساعدة فيها، مثل الطلب، التراخيص، نطاقات المعدات، أو تكاليف التشغيل.",
    },
    placeholder: { en: "Example: equipment cost range and permit path", ar: "مثال: نطاق تكلفة المعدات ومسار الترخيص" },
  },
  professionalInputs: {
    category: "suppliersDependencies",
    source: "supplier_quote",
    required: false,
    label: { en: "Inputs that need a supplier, authority, or professional", ar: "مدخلات تحتاج مورداً أو جهة مختصة أو متخصصاً" },
    help: {
      en: "This keeps local quotations and approvals separate from internal assumptions.",
      ar: "هذا يفصل عروض الأسعار والموافقات المحلية عن الافتراضات الداخلية.",
    },
    placeholder: { en: "Example: supplier quote, engineer review, authority requirement", ar: "مثال: عرض مورد، مراجعة مهندس، متطلب جهة مختصة" },
  },
  assumptionsToValidate: {
    category: "implementationTimeline",
    source: "assumption_to_confirm",
    required: true,
    label: { en: "Assumptions to confirm later", ar: "الافتراضات التي يجب تأكيدها لاحقاً" },
    help: {
      en: "Write the assumptions that must be checked before relying on the decision.",
      ar: "اكتب الافتراضات التي يجب اختبارها قبل الاعتماد على القرار.",
    },
    placeholder: { en: "Example: customers will pay enough to cover rent and staff", ar: "مثال: العملاء سيدفعون بما يكفي لتغطية الإيجار والعمالة" },
  },
  improvementObjective: {
    category: "implementationTimeline",
    source: "user_answerable",
    required: true,
    label: { en: "Improvement or expansion objective", ar: "هدف التطوير أو التوسع" },
    help: {
      en: "State the decision you want to support: improve sales, reduce cost, add capacity, open a branch, launch a new line, or fix a bottleneck.",
      ar: "اذكر القرار الذي تريد دعمه: زيادة المبيعات، خفض التكلفة، رفع الطاقة، فتح فرع، إطلاق خدمة جديدة، أو حل نقطة اختناق.",
    },
    placeholder: { en: "Example: add a second location or reduce waiting time", ar: "مثال: فتح فرع ثانٍ أو تقليل وقت الانتظار" },
  },
  currentRevenue: {
    category: "recurringCosts",
    source: "user_answerable",
    required: true,
    label: { en: "Current revenue", ar: "الإيرادات الحالية" },
    help: {
      en: "Use a monthly range if exact numbers are not ready.",
      ar: "استخدم نطاقاً شهرياً إذا لم تكن الأرقام الدقيقة جاهزة.",
    },
    placeholder: { en: "Example: about 80,000 SAR monthly", ar: "مثال: نحو 80,000 ريال شهرياً" },
  },
  currentCostsMargins: {
    category: "recurringCosts",
    source: "user_answerable",
    required: true,
    label: { en: "Current costs and margins", ar: "التكاليف والهوامش الحالية" },
    help: {
      en: "Mention main monthly costs, gross margin, or what is unknown.",
      ar: "اذكر أهم التكاليف الشهرية، والهامش الإجمالي، أو ما لا تعرفه بعد.",
    },
    placeholder: { en: "Example: rent, payroll, supplies, and estimated 35% margin", ar: "مثال: إيجار ورواتب ومواد تشغيل وهامش تقريبي 35%" },
  },
  currentCustomerVolume: {
    category: "operatingCapacity",
    source: "user_answerable",
    required: true,
    label: { en: "Current customer volume", ar: "حجم العملاء الحالي" },
    help: {
      en: "Use the natural unit: customers, visits, orders, bookings, users, or transactions.",
      ar: "استخدم الوحدة المناسبة: عملاء، زيارات، طلبات، حجوزات، مستخدمون، أو عمليات.",
    },
    placeholder: { en: "Example: 25 bookings per day", ar: "مثال: 25 حجزاً يومياً" },
  },
  repeatBusiness: {
    category: "operatingCapacity",
    source: "user_answerable",
    required: false,
    label: { en: "Repeat business or retention", ar: "تكرار الشراء أو الاحتفاظ بالعملاء" },
    help: {
      en: "If unknown, say unknown. This helps compare current performance with the proposed improvement.",
      ar: "إذا لم تكن تعرف، اكتب غير معروف. يساعد هذا في مقارنة الأداء الحالي بالتحسين المقترح.",
    },
    placeholder: { en: "Example: around 40% of customers repeat monthly", ar: "مثال: نحو 40% من العملاء يعودون شهرياً" },
  },
  currentCapacityStaffing: {
    category: "laborRolesSkills",
    source: "user_answerable",
    required: true,
    label: { en: "Current capacity and staffing", ar: "الطاقة والعمالة الحالية" },
    help: {
      en: "Mention current team, shifts, equipment, and maximum output if known.",
      ar: "اذكر الفريق الحالي، الورديات، المعدات، والحد الأقصى للطاقة إذا كان معروفاً.",
    },
    placeholder: { en: "Example: 4 staff, one shift, 60 orders per day capacity", ar: "مثال: 4 موظفين، وردية واحدة، طاقة 60 طلباً يومياً" },
  },
  currentBottlenecks: {
    category: "suppliersDependencies",
    source: "user_answerable",
    required: true,
    label: { en: "Current bottlenecks", ar: "نقاط الاختناق الحالية" },
    help: {
      en: "Name what currently limits growth: demand, staff, equipment, location, suppliers, cash, approvals, or process.",
      ar: "اذكر ما يحد النمو حالياً: الطلب، العمالة، المعدات، الموقع، الموردون، السيولة، الموافقات، أو طريقة التشغيل.",
    },
    placeholder: { en: "Example: not enough staff during peak hours", ar: "مثال: نقص العمالة في أوقات الذروة" },
  },
};

const guidedFieldsByType = {
  industrial_manufacturing: [
    "country",
    "city",
    "operatingFormat",
    "deliveryModel",
    "targetCustomerPromise",
    "targetCapacity",
    "premisesStatus",
    "spaceRequirement",
    "locationCostIncluded",
    "budgetRange",
    "quotationStatus",
    "equipmentLevel",
    "installationMaintenance",
    "utilitiesNeeds",
    "operatingHours",
    "staffingPlan",
    "licensesDependencies",
    "suppliersDependencies",
    "knownFacts",
    "researchNeeded",
    "professionalInputs",
    "assumptionsToValidate",
  ],
  service: [
    "country",
    "city",
    "operatingFormat",
    "deliveryModel",
    "targetCustomerPromise",
    "targetCapacity",
    "premisesStatus",
    "spaceRequirement",
    "locationCostIncluded",
    "budgetRange",
    "quotationStatus",
    "equipmentLevel",
    "installationMaintenance",
    "utilitiesNeeds",
    "operatingHours",
    "staffingPlan",
    "licensesDependencies",
    "suppliersDependencies",
    "knownFacts",
    "researchNeeded",
    "professionalInputs",
    "assumptionsToValidate",
  ],
  retail_trading: [
    "country",
    "city",
    "operatingFormat",
    "targetCustomerPromise",
    "targetCapacity",
    "premisesStatus",
    "spaceRequirement",
    "locationCostIncluded",
    "budgetRange",
    "quotationStatus",
    "equipmentLevel",
    "utilitiesNeeds",
    "operatingHours",
    "staffingPlan",
    "licensesDependencies",
    "suppliersDependencies",
    "knownFacts",
    "researchNeeded",
    "professionalInputs",
    "assumptionsToValidate",
  ],
  digital_software: [
    "country",
    "city",
    "operatingFormat",
    "deliveryModel",
    "targetCustomerPromise",
    "targetCapacity",
    "budgetRange",
    "quotationStatus",
    "equipmentLevel",
    "operatingHours",
    "staffingPlan",
    "licensesDependencies",
    "suppliersDependencies",
    "knownFacts",
    "researchNeeded",
    "professionalInputs",
    "assumptionsToValidate",
  ],
  marketplace_platform: [
    "country",
    "city",
    "operatingFormat",
    "deliveryModel",
    "targetCustomerPromise",
    "targetCapacity",
    "premisesStatus",
    "budgetRange",
    "quotationStatus",
    "equipmentLevel",
    "operatingHours",
    "staffingPlan",
    "licensesDependencies",
    "suppliersDependencies",
    "knownFacts",
    "researchNeeded",
    "professionalInputs",
    "assumptionsToValidate",
  ],
  generic: [
    "country",
    "city",
    "operatingFormat",
    "targetCustomerPromise",
    "targetCapacity",
    "budgetRange",
    "quotationStatus",
    "equipmentLevel",
    "staffingPlan",
    "licensesDependencies",
    "suppliersDependencies",
    "knownFacts",
    "researchNeeded",
    "assumptionsToValidate",
  ],
};

const existingBusinessFields = [
  "improvementObjective",
  "currentRevenue",
  "currentCostsMargins",
  "currentCustomerVolume",
  "repeatBusiness",
  "currentCapacityStaffing",
  "currentBottlenecks",
];

const sourceLabels = {
  user_answerable: {
    en: "You can answer",
    ar: "يمكنك الإجابة",
  },
  supplier_quote: {
    en: "May need supplier input",
    ar: "قد يحتاج إلى مورد",
  },
  external_research: {
    en: "Needs local/external research",
    ar: "يحتاج إلى بحث محلي أو خارجي",
  },
  assumption_to_confirm: {
    en: "Assumption to confirm",
    ar: "افتراض يحتاج تأكيداً",
  },
};

const guidedIntentPatterns = [
  /\b(?:how much (?:does it cost|will it cost|capital|budget|equipment|license|permit|staff|rent|setup)|what (?:does it )?cost|what [^.?؛؟]{0,60}(?:equipment|license|permit|capital|budget|staff|location|supplier|feasibility)|need (?:a |an |the |to know )?(?:equipment|license|permit|capital|budget|staff|location|supplier|feasibility))\b/i,
  /(?:كم.*(?:تكلف الفكرة|تكلف المشروع|تكلفة المشروع|يكلف المشروع|رأس مال|ميزانية)|ما.*(?:المعدات|التراخيص|التصاريح|العمالة|الموقع|التكلفة|رأس المال|الموردين|الجدوى)|ماذا.*(?:أحتاج|نحتاج|تحتاج).*(?:معدات|ترخيص|تصريح|عمالة|موقع|رأس مال)|أحتاج.*(?:معدات|ترخيص|تصريح|رأس مال)|احتاج.*(?:معدات|ترخيص|تصريح|رأس مال))/u,
];

export const feasibilityCategories = Object.keys(categoryLabels);

export function buildFeasibilityFoundation(input = {}, language = "en", options = {}) {
  const lang = language === "ar" ? "ar" : "en";
  const combined = textOf(input, options.details);
  const businessType = options.businessTypeOverride || classifyBusinessType(combined);
  const requiredCategories = requiredByType[businessType] || requiredByType.generic;
  const optionalCategories = optionalByType[businessType] || [];
  const categoryStatus = buildCategoryStatus({ combined, requiredCategories, optionalCategories, language: lang });
  const requiredQuestions = buildQuestions({
    categoryStatus,
    businessType,
    type: "required",
    language: lang,
  });
  const optionalQuestions = buildQuestions({
    categoryStatus,
    businessType,
    type: "optional",
    language: lang,
  });
  const missingRequired = categoryStatus.filter((item) => item.required && item.evidenceType === "unresolved_unknown");

  return {
    type: "capital_operational_feasibility_foundation",
    language: lang,
    direction: lang === "ar" ? "rtl" : "ltr",
    businessType,
    businessTypeLabel: localize(businessTypeLabels[businessType], lang),
    categories: categoryStatus,
    missingRequired: missingRequired.map((item) => item.category),
    requiredQuestions,
    optionalQuestions,
    estimateReadiness: buildEstimateReadiness(missingRequired, lang),
    downstreamUse: [
      "capital_estimation",
      "location_analysis",
      "labor_planning",
      "operational_planning",
      "implementation_planning",
    ],
  };
}

export function buildGuidedFeasibilityFlow(input = {}, language = "en", options = {}) {
  const lang = language === "ar" ? "ar" : "en";
  const foundation = options.foundation || buildFeasibilityFoundation(input, lang, { details: options.answers });
  const answers = options.answers || {};
  const validation = options.validation;
  const classificationPrompt = options.classificationPrompt || null;
  const phase3Only = Boolean(options.phase3Only);
  const userProfile = buildUserJourneyProfile(answers, lang);
  const requestedByUser = hasAny(textOf(input), guidedIntentPatterns);
  const hasIdeaSeed = normalize(input.businessIdea || input.businessName || "").length >= 5;
  const hasMinimumIdeaForClassification =
    hasIdeaSeed &&
    normalize(input.targetCustomer).length >= 5 &&
    normalize(input.problem || input.problemSolved).length >= 8 &&
    normalize(input.monetization || input.revenueModel).length >= 4;
  const activeClassificationPrompt = hasMinimumIdeaForClassification ? classificationPrompt : null;
  const hasMissingPrimaryFields = Boolean(validation && !validation.ok);
  const hasMissingJourneyProfile = ["userExperienceLevel", "firstProject", "projectStageIntent", "country", "decisionObjective"].some(
    (fieldId) => !normalize(answers[fieldId])
  );
  const shouldGuide =
    hasIdeaSeed &&
    (hasMissingJourneyProfile ||
      hasMissingPrimaryFields ||
      Boolean(activeClassificationPrompt) ||
      Boolean(options.forceGuide) ||
      (!phase3Only && requestedByUser));

  if (!shouldGuide) {
    return {
      shouldGuide: false,
      status: "not_needed",
      foundation,
    };
  }

  const fields = buildGuidedFields({ foundation, input, answers, userProfile, language: lang, classificationPrompt: activeClassificationPrompt, phase3Only });
  const requiredFields = fields.filter((field) => field.required);
  const missingRequired = requiredFields.filter((field) => !normalize(answers[field.id]));
  const availableSteps = phase3Only ? guidedSteps.filter((step) => step.id === "profileStage") : guidedSteps;
  const steps = availableSteps
    .map((step) => ({
      id: step.id,
      title: localize(step.title, lang),
      fields: fields.filter((field) => step.fields.includes(field.id)),
    }))
    .filter((step) => step.fields.length > 0);
  const copy = guidedCopy[lang] || guidedCopy.en;

  if (phase3Only && (hasMissingPrimaryFields || options.forceGuide) && fields.length === 0) {
    return {
      shouldGuide: true,
      status: "needs_guided_followup",
      foundation,
      userProfile,
      answers,
      missingFieldIds: validation.errors?.map((error) => error.field) || [],
      title: copy.heading,
      message: copy.body,
      presentation: {
        heading: copy.heading,
        body: copy.body,
        policy: copy.policy,
        closing: copy.closing,
        detailsTitle: copy.detailsTitle,
      },
      clarificationFlow: {
        type: "feasibility_guided",
        businessType: foundation.businessType,
        businessTypeLabel: foundation.businessTypeLabel,
        userProfile,
        details: answers,
        missingFieldIds: validation.errors?.map((error) => error.field) || [],
        steps: [],
        labels: {
          previous: lang === "ar" ? "السابق" : "Previous",
          next: lang === "ar" ? "التالي" : "Next",
          continue: lang === "ar" ? "متابعة" : "Continue",
          missing: lang === "ar" ? "أسئلة ناقصة" : "Missing answers",
          step: lang === "ar" ? "خطوة" : "Step",
        },
      },
    };
  }

  if (missingRequired.length === 0) {
    return {
      shouldGuide: true,
      status: "ready_for_preliminary_feasibility",
      foundation,
      userProfile,
      answers,
      missingFieldIds: [],
      title: copy.readyHeading,
      message: copy.readyBody,
      presentation: {
        heading: copy.readyHeading,
        body: copy.readyBody,
        policy: copy.readyPolicy,
        closing: copy.readyClosing,
      },
      structuredReadiness: {
        originalInput: input,
        userProfile,
        feasibilityAnswers: answers,
        downstreamUse: foundation.downstreamUse,
      },
    };
  }

  return {
    shouldGuide: true,
    status: "needs_guided_followup",
    foundation,
    userProfile,
    answers,
    missingFieldIds: missingRequired.map((field) => field.id),
    title: copy.heading,
    message: copy.body,
    presentation: {
      heading: copy.heading,
      body: copy.body,
      policy: copy.policy,
      closing: copy.closing,
      detailsTitle: copy.detailsTitle,
    },
    clarificationFlow: {
      type: "feasibility_guided",
      businessType: foundation.businessType,
      businessTypeLabel: foundation.businessTypeLabel,
      userProfile,
      details: answers,
      missingFieldIds: missingRequired.map((field) => field.id),
      steps,
      labels: {
        previous: lang === "ar" ? "السابق" : "Previous",
        next: lang === "ar" ? "التالي" : "Next",
        continue: phase3Only ? (lang === "ar" ? "متابعة" : "Continue") : (lang === "ar" ? "متابعة التقييم" : "Continue evaluation"),
        missing: lang === "ar" ? "أسئلة ناقصة" : "Missing answers",
        step: lang === "ar" ? "خطوة" : "Step",
      },
    },
  };
}

export function classifyBusinessType(text = "") {
  if (hasAny(text, typePatterns.retail_trading)) return "retail_trading";
  if (hasAny(text, typePatterns.industrial_manufacturing)) return "industrial_manufacturing";
  if (hasAny(text, typePatterns.marketplace_platform)) return "marketplace_platform";
  if (hasAny(text, typePatterns.digital_software)) return "digital_software";
  if (hasAny(text, typePatterns.service)) return "service";
  return "generic";
}

function buildCategoryStatus({ combined, requiredCategories, optionalCategories, language }) {
  return feasibilityCategories.map((category) => {
    const known = hasAny(combined, knownSignals[category] || []);
    const verified = known && hasSentenceWith(combined, knownSignals[category] || [], verifiedEvidenceSignals);
    const calculated = known && !verified && hasSentenceWith(combined, knownSignals[category] || [], calculatedEstimateSignals);
    const assumption = known && !verified && hasSentenceWith(combined, knownSignals[category] || [], assumptionSignals);
    const required = requiredCategories.includes(category);
    const optional = optionalCategories.includes(category);
    const relevant = required || optional;
    const evidenceType = !relevant
      ? "not_relevant"
      : !known
        ? "unresolved_unknown"
        : verified
          ? "externally_verified_evidence"
          : calculated
            ? "calculated_estimate"
            : assumption
            ? "assumption"
            : "user_provided_fact";

    return {
      category,
      label: localize(categoryLabels[category], language),
      relevant,
      required,
      optional,
      evidenceType,
      canSupportEstimate: ["user_provided_fact", "externally_verified_evidence", "calculated_estimate"].includes(evidenceType),
    };
  });
}

function hasSentenceWith(text = "", firstPatterns = [], secondPatterns = []) {
  return normalize(text)
    .split(/[.!؟?؛;]+/u)
    .some((sentence) => hasAny(sentence, firstPatterns) && hasAny(sentence, secondPatterns));
}

function buildQuestions({ categoryStatus, businessType, type, language }) {
  const priorityOrder = new Map([...(requiredByType[businessType] || []), ...(optionalByType[businessType] || [])].map((category, index) => [category, index]));
  const items = categoryStatus
    .filter((item) => item.evidenceType === "unresolved_unknown")
    .filter((item) => (type === "required" ? item.required : item.optional))
    .sort((a, b) => (priorityOrder.get(a.category) ?? 99) - (priorityOrder.get(b.category) ?? 99))
    .map((item) => ({
      id: item.category,
      category: item.category,
      label: item.label,
      priority: item.required ? "blocking" : "refinement",
      required: item.required,
      question: resolveQuestion(item.category, businessType, language),
      evidenceRequired: language === "ar"
        ? "اذكر هل المعلومة حقيقة مؤكدة، عرضاً أو دليلاً خارجياً، افتراضاً، تقديراً محسوباً، أم غير معروفة."
        : "State whether the answer is a known fact, external evidence, assumption, calculated estimate, or unresolved unknown.",
    }));

  const optionalRefinements = type === "optional"
    ? categoryStatus
        .filter((item) => item.relevant && item.evidenceType !== "unresolved_unknown" && refinementQuestions[item.category])
        .slice(0, 2)
        .map((item) => ({
          id: `${item.category}_evidence_quality`,
          category: item.category,
          label: item.label,
          priority: "refinement",
          required: false,
          question: localize(refinementQuestions[item.category], language),
          evidenceRequired: language === "ar"
            ? "وضّح جودة الدليل خلف التقدير."
            : "Clarify the evidence quality behind the estimate.",
        }))
    : [];

  return [...items, ...optionalRefinements].slice(0, type === "required" ? 8 : 4);
}

function resolveQuestion(category, businessType, language) {
  const specific = typeSpecificQuestions[businessType]?.[category];
  return specific?.[language] || localize(questionBank[category]?.question, language);
}

function buildEstimateReadiness(missingRequired, language) {
  if (missingRequired.length > 0) {
    return {
      canEstimate: false,
      precision: "not_trustworthy",
      reason:
        language === "ar"
          ? "لا يمكن إنتاج تقدير موثوق لرأس المال أو التشغيل لأن معلومات أساسية ما زالت ناقصة."
          : "A trustworthy capital or operating estimate cannot be produced yet because essential feasibility inputs are missing.",
    };
  }

  return {
    canEstimate: true,
    precision: "preliminary_only",
    reason:
      language === "ar"
        ? "المعلومات كافية لبناء تقدير أولي فقط، ويجب تمييز الحقائق عن الافتراضات والأدلة الخارجية قبل الاعتماد عليه."
        : "The information is enough for a preliminary estimate only; facts, assumptions, and external evidence must remain separated before relying on it.",
  };
}

function buildGuidedFields({ foundation, input, answers, userProfile, language, classificationPrompt, phase3Only = false }) {
  const baseIds = guidedFieldsByType[foundation.businessType] || guidedFieldsByType.generic;
  const classificationFields = Array.isArray(classificationPrompt)
    ? classificationPrompt.filter((field) => !normalize(answers[field.id]) || field.id === "classificationCorrectionReason")
    : classificationPrompt && !normalize(answers[classificationPrompt.id])
      ? [{ ...classificationPrompt, value: answers[classificationPrompt.id] || "" }]
      : [];
  const allowedIds = [
    "userExperienceLevel",
    "firstProject",
    "projectStageIntent",
    "country",
    "city",
    "decisionObjective",
    ...(phase3Only ? [] : userProfile.isExistingBusinessPath ? existingBusinessFields : []),
    ...(phase3Only ? [] : baseIds),
  ];
  const knownCategoryStatus = Object.fromEntries(foundation.categories.map((item) => [item.category, item.evidenceType]));
  const hasOriginalTargetCustomer = normalize(input.targetCustomer).length >= 5;
  const hasOriginalProblem = normalize(input.problem || input.problemSolved).length >= 8;
  const hasOriginalMonetization = normalize(input.monetization || input.revenueModel).length >= 4;

  const adaptiveFields = [...new Set(allowedIds)]
    .map((fieldId) => ({ id: fieldId, ...guidedFieldBank[fieldId] }))
    .filter(Boolean)
    .filter((field) => {
      if (normalize(answers[field.id])) return false;
      if (["userExperienceLevel", "firstProject", "projectStageIntent", "country", "city", "decisionObjective"].includes(field.id)) return true;
      if (phase3Only) return false;
      if (existingBusinessFields.includes(field.id)) return true;
      if (userProfile.isExistingBusinessPath && ["targetCustomerPromise", "budgetRange"].includes(field.id)) return false;
      if (field.id === "targetCustomerPromise" && hasOriginalTargetCustomer && hasOriginalProblem) return false;
      if (field.id === "budgetRange" && knownCategoryStatus.startupCapital !== "unresolved_unknown") return false;
      if (field.id === "quotationStatus" && knownCategoryStatus.equipmentTools === "externally_verified_evidence") return false;
      if (field.id === "operatingFormat" && knownCategoryStatus.locationPremises !== "unresolved_unknown") return false;
      if (field.id === "licensesDependencies" && knownCategoryStatus.licensesCompliance !== "unresolved_unknown") return false;
      if (field.id === "suppliersDependencies" && knownCategoryStatus.suppliersDependencies !== "unresolved_unknown") return false;
      if (field.id === "knownFacts" && hasOriginalMonetization && knownCategoryStatus.startupCapital !== "unresolved_unknown") return false;
      return true;
    })
    .map((field) =>
      localizeGuidedField(
        {
          ...field,
          typeSpecificHelp: typeSpecificQuestions[foundation.businessType]?.[field.category],
        },
        language,
        answers,
        userProfile
      )
    );

  return [...adaptiveFields, ...classificationFields];
}

function localizeGuidedField(field, language, answers, userProfile) {
  const adapted = adaptFieldForProfile(field, language, userProfile);
  const contextualHelp = localize(field.typeSpecificHelp, language);
  const baseHelp = localize(adapted.help || field.help, language);
  return {
    id: field.id,
    type: adapted.type || field.type || "textarea",
    category: field.category,
    source: field.source,
    sourceLabel: localize(sourceLabels[field.source], language),
    required: field.required,
    labelText: localize(adapted.label || field.label, language),
    helpText: [contextualHelp, baseHelp].filter(Boolean).join(" "),
    placeholderText: localize(adapted.placeholder || field.placeholder, language),
    value: answers[field.id] || "",
    options: (adapted.options || field.options)?.map((option) => ({
      value: option.value,
      labelText: localize(option.label, language),
    })),
  };
}

function buildUserJourneyProfile(answers = {}, language = "en") {
  const experienceLevel = answers.userExperienceLevel || "";
  const projectStageIntent = answers.projectStageIntent || "";
  const existingStages = new Set(["operating", "improving", "expanding"]);
  const isExistingBusinessPath =
    experienceLevel === "existing_business_owner" || existingStages.has(projectStageIntent);
  const isBeginner = ["first_time_beginner", "beginner_first_business"].includes(experienceLevel);
  const isLimitedExperience = experienceLevel === "limited_experience";
  const isExperienced = ["experienced_new_idea"].includes(experienceLevel);

  return {
    experienceLevel,
    experienceLabel: localize(userExperienceOptions.find((option) => option.value === experienceLevel)?.label, language),
    firstProject: answers.firstProject || "",
    projectStageIntent,
    stageLabel: localize(projectStageOptions.find((option) => option.value === projectStageIntent)?.label, language),
    country: answers.country || "",
    city: answers.city || "",
    decisionObjective: answers.decisionObjective || "",
    isBeginner,
    isLimitedExperience,
    isExperienced,
    isExistingBusinessPath,
    adaptationStyle: isExistingBusinessPath ? "existing_business" : isExperienced ? "experienced" : isBeginner ? "beginner" : isLimitedExperience ? "limited_experience" : "neutral",
  };
}

function adaptFieldForProfile(field, language, userProfile) {
  if (["userExperienceLevel", "projectStageIntent"].includes(field.id)) return field;

  if (userProfile.isBeginner) {
    return {
      ...field,
      help: {
        en: `${localize(field.help, "en")} Simple answer is fine. Write “I don’t know” if you are unsure.`,
        ar: `${localize(field.help, "ar")} تكفي إجابة بسيطة. اكتب «لا أعرف» إذا لم تكن متأكداً.`,
      },
    };
  }

  if (userProfile.isExperienced) {
    return {
      ...field,
      help: {
        en: `${localize(field.help, "en")} Include evidence, assumptions, unit economics, capacity, or risk where relevant.`,
        ar: `${localize(field.help, "ar")} أضف الدليل، الافتراضات، اقتصاديات الوحدة، الطاقة، أو المخاطر عند الحاجة.`,
      },
    };
  }

  if (userProfile.isLimitedExperience) {
    return {
      ...field,
      help: {
        en: `${localize(field.help, "en")} Add the practical detail you know; rough ranges and clear unknowns are acceptable.`,
        ar: `${localize(field.help, "ar")} أضف التفاصيل العملية التي تعرفها؛ النطاقات التقريبية والنقاط غير المعروفة مقبولة.`,
      },
    };
  }

  if (userProfile.isExistingBusinessPath) {
    return {
      ...field,
      help: {
        en: `${localize(field.help, "en")} Use current operating data when available so the improvement can be compared with actual performance.`,
        ar: `${localize(field.help, "ar")} استخدم بيانات التشغيل الحالية عند توفرها حتى يمكن مقارنة التحسين بالأداء الفعلي.`,
      },
    };
  }

  return field;
}
