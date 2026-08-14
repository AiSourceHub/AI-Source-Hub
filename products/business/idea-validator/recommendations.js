import { describeEvidenceGap } from "./evidenceSignals.js";
import { RecommendationEngine } from "../../../core/engines.js";
import { getBiggestRisk, getNextAction } from "./rules.js";
import { describeStakeholderAmbiguity } from "./stakeholderRoles.js";

export function buildBusinessIdeaRecommendation({
  score,
  criteria,
  lowestCriterion,
  verdictKey,
  confidence,
  language,
  input,
  stage = "idea",
}) {
  const context = buildRecommendationContext(input, language);
  const recommendationEngine = new RecommendationEngine({
    rules: [
      {
        key: "primary_next_action",
        title: "Primary next action",
        priority: 1,
        when: () => true,
        action: () => buildPersonalizedNextAction({ lowestCriterion, verdictKey, language, context, stage }),
        reason: () => buildPersonalizedBiggestRisk({ lowestCriterion, language, context, stage }),
      },
    ],
  });

  const recommendation = recommendationEngine.recommend({
    score,
    criteria,
    lowestCriterion,
    verdictKey,
    confidence,
    input,
    stage,
    stakeholderRoles: input.stakeholderRoles,
  });

  return {
    ...recommendation,
    executiveSummary: buildExecutiveSummary({ verdictKey, lowestCriterion, language, context }),
    hasMultipleProblems: context.hasMultipleProblems,
    hasMetaProblem: context.hasMetaProblem,
    focusWarning: context.focusWarning,
    interpretedContext: context,
  };
}

export function refineBusinessIdeaCriteria(criteria = [], recommendation = {}, language = "en") {
  const hasMultipleCustomerGroups = recommendation.interpretedContext?.hasMultipleCustomerGroups;
  if (!recommendation.hasMultipleProblems && !recommendation.hasMetaProblem && !hasMultipleCustomerGroups) return criteria;

  return criteria.map((criterion) => {
    if (criterion.key === "customerClarity" && hasMultipleCustomerGroups) {
      return {
        ...criterion,
        reason:
          language === "ar"
            ? "العميل المستهدف يضم أكثر من مجموعة، لذلك يجب اختيار شريحة أولى واحدة قبل الاختبار."
            : "The target customer includes multiple groups, so choose one first segment before testing.",
      };
    }

    if (criterion.key !== "problemClarity") return criterion;

    return {
      ...criterion,
      reason:
        recommendation.hasMetaProblem && language === "ar"
          ? "لم يتم إدخال مشكلة عميل واضحة. البنود الحالية تصف تحديات تنفيذ المشروع، لذلك يجب اختيار مشكلة واحدة يواجهها العميل أولاً."
          : recommendation.hasMetaProblem
            ? "The input describes founder execution challenges, not a specific customer problem. Choose one customer problem before evaluating the idea."
            : language === "ar"
          ? "تحتوي صياغة المشكلة على أكثر من مشكلة، لذلك يحتاج الاختبار الأول إلى اختيار مشكلة واحدة وحالة استخدام أولى."
          : "The problem input contains more than one problem, so the first test needs one primary problem and one first use case.",
    };
  });
}

function buildPersonalizedBiggestRisk({ lowestCriterion, language = "en", context, stage = "idea" }) {
  if (!context || !lowestCriterion?.key) return getBiggestRisk(lowestCriterion, language);

  const stageLabel = getStageLabel(stage, language);
  if (context.hasMetaProblem) {
    return language === "ar"
      ? `الخطر الأكبر هو اختبار تنفيذ المشروع بدلاً من اختبار حاجة العميل. خانة المشكلة تشير إلى ${context.executionChallenges}، لكن الفكرة تحتاج أولاً إلى إثبات أن ${context.customerLabel} يواجهون فعلاً صعوبة في ${context.suggestedProblemExample}. بدون هذا الدليل، قد لا تصبح ${context.revenueDescription} أولوية.`
      : `The biggest risk is testing execution work instead of customer demand. Your problem input points to ${context.executionChallenges}, but the business still needs proof that ${context.customerLabel} strongly care about ${context.suggestedProblemExample}. Without that proof, ${context.revenueDescription} may not become a priority.`;
  }

  if (
    context.hasStakeholderAmbiguity &&
    !context.hasMetaProblem &&
    ["customerClarity", "monetizationClarity", "feasibility"].includes(lowestCriterion.key)
  ) {
    const ambiguity = describeStakeholderAmbiguity(context.stakeholderRoles, language);
    return language === "ar"
      ? `الخطر الأكبر هو غموض الأدوار: ${ambiguity}. إذا لم يتضح من يستخدم الحل ومن يدفع ومن يوافق على الشراء، فقد تبدو ${context.proposedSolution} مفيدة دون أن تتحول إلى طلب أو إيراد واضح.`
      : `The main risk is role ambiguity: ${ambiguity}. If it is not clear who uses the solution, who pays, and who approves the purchase, ${context.proposedSolution} may look useful without turning into demand or revenue.`;
  }

  if (context.hasMaterialEvidenceGap && ["marketNeed", "monetizationClarity", "feasibility"].includes(lowestCriterion.key)) {
    const gap = describeEvidenceGap(context.evidenceSignals, language);
    return language === "ar"
      ? `الخطر الأكبر هو أن ${context.primaryProblem} ما زالت معتمدة على افتراض مهم: ${gap}. بدون دليل عملي من ${context.customerLabel}، قد تبدو الفكرة منطقية لكنها لا تتحول إلى طلب أو إيراد.`
      : `The main risk is that ${context.primaryProblem} still depends on an important assumption: ${gap}. Without practical evidence from ${context.customerLabel}, the idea may sound logical but fail to turn into demand or revenue.`;
  }

  const messages = {
    problemClarity: {
      en: context.hasMultipleProblems
        ? `The main risk is focus: ${context.customerLabel} may face several issues, but the first test needs one problem. Start with ${context.primaryProblem} so you can prove a clear use case before expanding.`
        : `The main risk is that ${context.primaryProblem} is not described in a specific situation for ${context.customerLabel}. Without that focus, it will be hard to know what to build first at the ${stageLabel} stage.`,
      ar: context.hasMultipleProblems
        ? `الخطر الأكبر هو تشتّت التركيز: قد تواجه ${context.customerLabel} أكثر من مشكلة، لكن الاختبار الأول يحتاج إلى مشكلة واحدة. ابدأ بـ ${context.primaryProblem} حتى تثبت حالة استخدام واضحة قبل التوسع.`
        : `الخطر الأكبر هو أن ${context.primaryProblem} غير موضحة في موقف محدد لدى ${context.customerLabel}. بدون هذا التركيز، سيصعب تحديد ما يجب اختباره أولاً في مرحلة ${stageLabel}.`,
    },
    customerClarity: {
      en: `The buyer profile is still too broad to test cleanly. If ${context.customerLabel} is not narrowed, feedback about ${context.primaryProblem} may come from people who are curious but unlikely to pay for ${context.proposedSolution}.`,
      ar: `شريحة العميل ما زالت واسعة لاختبارها بوضوح. إذا لم تُضيّق ${context.customerLabel}، فقد تأتي الملاحظات حول ${context.primaryProblem} من مهتمين لا يتحولون إلى مشترين لـ ${context.proposedSolution}.`,
    },
    marketNeed: {
      en: context.hasMetaProblem
        ? `The biggest risk is testing execution work instead of customer demand. Your problem input points to ${context.executionChallenges}, but the business still needs proof that ${context.customerLabel} strongly care about ${context.suggestedProblemExample}. Without that proof, ${context.revenueDescription} may not become a priority.`
        : `For ${context.customerLabel}, the biggest risk is that ${context.primaryProblem} may not feel important or frequent enough to replace ${context.currentAlternative}. If that is true, it will be difficult to prove ${context.revenueDescription}.`,
      ar: context.hasMetaProblem
        ? `الخطر الأكبر هو اختبار تنفيذ المشروع بدلاً من اختبار حاجة العميل. خانة المشكلة تشير إلى ${context.executionChallenges}، لكن الفكرة تحتاج أولاً إلى إثبات أن ${context.customerLabel} يواجهون فعلاً صعوبة في ${context.suggestedProblemExample}. بدون هذا الدليل، قد لا تصبح ${context.revenueDescription} أولوية.`
        : `بالنسبة إلى ${context.customerLabel}، الخطر الأكبر هو أن ${context.primaryProblem} قد لا تبدو مهمة أو متكررة بما يكفي لترك ${context.currentAlternative}. إذا حدث ذلك، فسيصعب إثبات ${context.revenueDescription}.`,
    },
    monetizationClarity: {
      en: `The value may be clear, but payment is not proven. For ${context.customerLabel}, ${context.revenueDescription} needs evidence that the buyer will pay specifically to solve ${context.primaryProblem}, not only find ${context.proposedSolution} useful.`,
      ar: `قد تكون القيمة واضحة، لكن الدفع غير مثبت بعد. تحتاج ${context.revenueDescription} إلى دليل من ${context.customerLabel} بأنهم سيدفعون تحديداً لحل ${context.primaryProblem}، وليس فقط لأن ${context.proposedSolution} تبدو مفيدة.`,
    },
    feasibility: {
      en: `The first version may be too wide for the ${stageLabel} stage. If the test is not narrowed around ${context.primaryProblem}, it will be hard to know whether ${context.advantageSummary} makes ${context.proposedSolution} easier to choose than ${context.currentAlternative}.`,
      ar: `قد تكون النسخة الأولى أوسع من المناسب لمرحلة ${stageLabel}. إذا لم يُضيّق الاختبار حول ${context.primaryProblem}، فسيصعب معرفة ما إذا كانت ${context.advantageSummary} تجعل ${context.proposedSolution} أسهل للاختيار من ${context.currentAlternative}.`,
    },
  };

  return messages[lowestCriterion.key]?.[language] || getBiggestRisk(lowestCriterion, language);
}

function buildPersonalizedNextAction({ lowestCriterion, verdictKey, language = "en", context, stage = "idea" }) {
  if (!context || !lowestCriterion?.key) return getNextAction(lowestCriterion, verdictKey, language);

  if (stage === "mvp") {
    return buildMvpAction(lowestCriterion.key, { context, language });
  }

  if (stage === "launched") {
    return buildLaunchedAction(lowestCriterion.key, { context, language });
  }

  return buildIdeaAction(lowestCriterion.key, { context, language, verdictKey });
}

function buildIdeaAction(key, { context, language }) {
  if (context.hasMetaProblem) {
    return language === "ar"
      ? `الحل: أعد كتابة المشكلة هكذا: "يواجه ${context.customerLabel} صعوبة في ${context.suggestedProblemExample}". بعد ذلك قابل 10 أشخاص واسألهم متى حدثت آخر مرة، وكيف حلوها، وكم كلفتهم. واصل فقط إذا أكد 6 منهم على الأقل أنها متكررة أو مكلفة.`
      : `Rewrite the problem as: "${context.customerLabel} struggle with ${context.suggestedProblemExample}." Interview 10 people and ask when it last happened, how they solved it, and what it cost. Continue only if at least 6 confirm it is frequent or costly.`;
  }

  if (context.hasStakeholderAmbiguity && !context.hasMetaProblem && ["customerClarity", "monetizationClarity", "feasibility"].includes(key)) {
    return buildStakeholderClarificationAction(context, language);
  }

  if (context.hasMaterialEvidenceGap && ["marketNeed", "monetizationClarity", "feasibility"].includes(key)) {
    return buildEvidenceValidationAction(context, language);
  }

  const actions = {
    problemClarity: {
      en: context.hasMultipleProblems
        ? `Choose one first use case around ${context.primaryProblem}. Interview 10 people from ${context.customerLabel} and continue only if at least 6 describe the same costly or frequent situation.`
        : `Interview 5 people from ${context.customerLabel}. Ask them to describe the last real situation involving ${context.primaryProblem}, what they tried, and what it cost in time or money.`,
      ar: context.hasMultipleProblems
        ? `اختر حالة استخدام أولى حول ${context.primaryProblem}. قابل 10 أشخاص من ${context.customerLabel}، وواصل فقط إذا وصف 6 منهم على الأقل الموقف نفسه باعتباره مكلفاً أو متكرراً.`
        : `قابل 5 أشخاص من ${context.customerLabel}. اطلب منهم وصف آخر موقف حقيقي مرتبط بـ ${context.primaryProblem}، وما الذي جرّبوه، وما التكلفة بالوقت أو المال.`,
    },
    customerClarity: {
      en: `Choose one narrow segment inside ${context.customerLabel}. Contact 10 people and count how many personally deal with ${context.primaryProblem} and can try ${context.proposedSolution} this month.`,
      ar: `اختر شريحة أضيق داخل ${context.customerLabel}. تواصل مع 10 أشخاص واحسب من يواجه ${context.primaryProblem} بنفسه ويمكنه تجربة ${context.proposedSolution} هذا الشهر.`,
    },
    marketNeed: {
      en: context.hasMetaProblem
        ? `Rewrite the problem as: "${context.customerLabel} struggle with ${context.suggestedProblemExample}." Interview 10 people and ask when it last happened, how they solved it, and what it cost. Continue only if at least 6 confirm it is frequent or costly.`
        : `Speak with 10 people from ${context.customerLabel}. Ask how often they face ${context.primaryProblem} and how they handle it today; continue only if at least 6 say the current workaround costs enough to try or pay.`,
      ar: context.hasMetaProblem
        ? `الحل: أعد كتابة المشكلة هكذا: "يواجه ${context.customerLabel} صعوبة في ${context.suggestedProblemExample}". بعد ذلك قابل 10 أشخاص واسألهم متى حدثت آخر مرة، وكيف حلوها، وكم كلفتهم. واصل فقط إذا أكد 6 منهم على الأقل أنها متكررة أو مكلفة.`
        : `تحدث مع 10 أشخاص من ${context.customerLabel}. اسألهم كم مرة يواجهون ${context.primaryProblem} وكيف يتعاملون معها حالياً؛ واصل فقط إذا قال 6 منهم على الأقل إن الطريقة الحالية تكلفهم ما يكفي لتجربة حل أو الدفع مقابله.`,
    },
    monetizationClarity: {
      en: `Test ${context.revenueDescription} in 5 discovery calls with ${context.customerLabel}. Ask who pays for solving ${context.primaryProblem}, when payment happens, and what price would be too high.`,
      ar: `اختبر ${context.revenueDescription} في 5 محادثات مع ${context.customerLabel}. اسأل من سيدفع لحل ${context.primaryProblem}، ومتى يحدث الدفع، وما السعر الذي سيكون مرتفعاً.`,
    },
    feasibility: {
      en: `Run a one-week manual test for ${context.customerLabel}: use the smallest version of ${context.proposedSolution} to solve only ${context.primaryProblem}, then ask whether ${context.advantageSummary} changed their decision to continue.`,
      ar: `نفّذ اختباراً يدوياً لمدة أسبوع مع ${context.customerLabel}: استخدم أصغر نسخة من ${context.proposedSolution} لحل ${context.primaryProblem} فقط، ثم اسأل هل غيّرت ${context.advantageSummary} قرارهم بالاستمرار.`,
    },
  };

  return actions[key]?.[language] || getNextAction({ key }, "unclear", language);
}

function buildMvpAction(key, { context, language }) {
  if (context.hasStakeholderAmbiguity && !context.hasMetaProblem && ["customerClarity", "monetizationClarity", "feasibility"].includes(key)) {
    return buildStakeholderClarificationAction(context, language);
  }

  if (context.hasMaterialEvidenceGap && ["marketNeed", "monetizationClarity", "feasibility"].includes(key)) {
    return buildEvidenceValidationAction(context, language, "mvp");
  }

  const actions = {
    problemClarity: {
      en: `Watch 5 MVP users from ${context.customerLabel}. Record where they hesitate while dealing with ${context.primaryProblem}, then fix only the most repeated blocker.`,
      ar: `راقب 5 مستخدمين للنموذج الأولي من ${context.customerLabel}. سجّل أين يترددون عند التعامل مع ${context.primaryProblem}، ثم أصلح العائق الأكثر تكراراً فقط.`,
    },
    customerClarity: {
      en: `Split MVP users into 2-3 segments and compare activation. Keep the segment closest to ${context.customerLabel} if it activates at least 20% better.`,
      ar: `قسّم مستخدمي النموذج الأولي إلى شريحتين أو ثلاث وقارن التفعيل. احتفظ بالشريحة الأقرب إلى ${context.customerLabel} إذا كان تفعيلها أعلى بنسبة 20% على الأقل.`,
    },
    marketNeed: {
      en: `Measure 14-day repeat usage: do users from ${context.customerLabel} return at least twice for ${context.primaryProblem}? If fewer than 40% return, interview inactive users before adding features.`,
      ar: `قِس الاستخدام المتكرر خلال 14 يوماً: هل يعود مستخدمو ${context.customerLabel} مرتين على الأقل بسبب ${context.primaryProblem}؟ إذا عاد أقل من 40%، قابل غير النشطين قبل إضافة مزايا.`,
    },
    monetizationClarity: {
      en: `Show ${context.revenueDescription} to 5 active MVP users and ask for one commitment: payment, pilot approval, or a scheduled buying conversation.`,
      ar: `اعرض ${context.revenueDescription} على 5 مستخدمين نشطين في النموذج الأولي، واطلب التزاماً واحداً: دفع، موافقة على تجربة، أو موعد نقاش شراء.`,
    },
    feasibility: {
      en: `For one week, keep only the MVP path where ${context.customerLabel} uses ${context.proposedSolution} for ${context.primaryProblem}. Track completion and activation before adding scope.`,
      ar: `لمدة أسبوع، أبقِ فقط على المسار الذي تستخدم فيه ${context.customerLabel} ${context.proposedSolution} لحل ${context.primaryProblem}. قِس الإكمال والتفعيل قبل توسيع النطاق.`,
    },
  };

  return actions[key]?.[language] || getNextAction({ key }, "unclear", language);
}

function buildLaunchedAction(key, { context, language }) {
  if (context.hasStakeholderAmbiguity && !context.hasMetaProblem && ["customerClarity", "monetizationClarity", "feasibility"].includes(key)) {
    return buildStakeholderClarificationAction(context, language);
  }

  if (context.hasMaterialEvidenceGap && ["marketNeed", "monetizationClarity", "feasibility"].includes(key)) {
    return buildEvidenceValidationAction(context, language, "launched");
  }

  const actions = {
    problemClarity: {
      en: `Review support, churn, and sales notes from real ${context.customerLabel}. Tag how they describe ${context.primaryProblem} and update positioning around the repeated wording.`,
      ar: `راجع ملاحظات الدعم وفقدان العملاء والمبيعات من ${context.customerLabel} الفعليين. استخرج كيف يصفون ${context.primaryProblem} وحدّث التموضع حول العبارات المتكررة.`,
    },
    customerClarity: {
      en: `Compare conversion and retention across customer types. Focus acquisition on the segment within ${context.customerLabel} with the strongest repeat usage.`,
      ar: `قارن التحويل والاحتفاظ بين أنواع العملاء. ركّز الاستحواذ على الشريحة داخل ${context.customerLabel} التي تملك أقوى استخدام متكرر.`,
    },
    marketNeed: {
      en: `Check retention evidence: how often do paying or active ${context.customerLabel} return because of ${context.primaryProblem}? Interview churned users and tag the top 3 reasons.`,
      ar: `افحص دليل الاحتفاظ: كم مرة تعود ${context.customerLabel} النشطة أو الدافعة بسبب ${context.primaryProblem}؟ قابل من توقفوا عن الاستخدام وحدد أهم 3 أسباب.`,
    },
    monetizationClarity: {
      en: `Audit ${context.revenueDescription} against conversion, expansion, and churn. Test one pricing change with the customer segment most likely to retain.`,
      ar: `راجع ${context.revenueDescription} مقابل التحويل والتوسع وفقدان العملاء. اختبر تغييراً واحداً في التسعير مع الشريحة الأكثر احتمالاً للاحتفاظ.`,
    },
    feasibility: {
      en: `Use real usage data to remove low-value workflows. Double down on the path where ${context.customerLabel} solves ${context.primaryProblem} fastest with ${context.proposedSolution}.`,
      ar: `استخدم بيانات الاستخدام الفعلية لإزالة المسارات قليلة القيمة. ركّز على المسار الذي تحل فيه ${context.customerLabel} ${context.primaryProblem} بأسرع شكل عبر ${context.proposedSolution}.`,
    },
  };

  return actions[key]?.[language] || getNextAction({ key }, "unclear", language);
}

function buildEvidenceValidationAction(context, language, stage = "idea") {
  if (stage === "mvp") {
    return language === "ar"
      ? `حوّل الافتراض حول ${context.primaryProblem} إلى قياس داخل النموذج الأولي: راقب 10 مستخدمين أو 20 جلسة استخدام، وسجّل التكرار أو التفعيل أو الاستعداد للدفع قبل إضافة مزايا جديدة.`
      : `Turn the assumption around ${context.primaryProblem} into an MVP metric: observe 10 users or 20 usage sessions, then record repeat use, activation, or willingness to pay before adding features.`;
  }

  if (stage === "launched") {
    return language === "ar"
      ? `راجع بيانات العملاء الحاليين حول ${context.primaryProblem}: التحويل، الاحتفاظ، أو الدفع. اتخذ القرار التالي فقط إذا ظهر دليل واضح من العملاء الفعليين.`
      : `Review existing customer data around ${context.primaryProblem}: conversion, retention, or payment. Make the next decision only if real customer evidence supports it.`;
  }

  if (context.evidenceSignals?.hasUnsupportedProfitClaim) {
    return language === "ar"
      ? `اختبر افتراض الربحية قبل البناء: احصل على 3 أسعار أو عروض تكلفة حقيقية، ثم قابل 5 عملاء من ${context.customerLabel} لمعرفة السعر المقبول لحل ${context.primaryProblem}.`
      : `Test the profitability assumption before building: collect 3 real cost quotes or price references, then interview 5 ${context.customerLabel} about an acceptable price for solving ${context.primaryProblem}.`;
  }

  return language === "ar"
    ? `اختبر افتراض الطلب مباشرة: قابل 10 أشخاص من ${context.customerLabel} واسألهم عن آخر مرة واجهوا ${context.primaryProblem}. واصل فقط إذا أكد 6 منهم على الأقل أنها مشكلة متكررة أو مكلفة.`
    : `Test the demand assumption directly: interview 10 people from ${context.customerLabel} and ask about the last time they faced ${context.primaryProblem}. Continue only if at least 6 confirm it is frequent or costly.`;
}

function buildStakeholderClarificationAction(context, language) {
  const questions = [];
  const ambiguous = new Set(context.stakeholderRoles?.ambiguities || []);

  if (!context.stakeholderRoles?.endUser) {
    questions.push(language === "ar" ? "من يستخدم الحل فعلياً؟" : "Who uses it?");
  }

  if (ambiguous.has("payer") || context.stakeholderRoles?.payerStatus === "ambiguous") {
    questions.push(language === "ar" ? "من سيدفع؟" : "Who pays?");
  }

  if (ambiguous.has("approver") || context.stakeholderRoles?.approverStatus === "ambiguous") {
    questions.push(language === "ar" ? "من يوافق على الشراء؟" : "Who approves or chooses the purchase?");
  }

  if (ambiguous.has("provider")) {
    questions.push(language === "ar" ? "ما دور مقدم الخدمة؟" : "What is the provider's role?");
  }

  const selectedQuestions = questions.length ? questions.slice(0, 3) : [language === "ar" ? "من يستخدم الحل ومن يدفع؟" : "Who uses it and who pays?"];

  if (language === "ar") {
    return `قبل اختبار ${context.primaryProblem}، قابل 5 أشخاص من الأطراف المذكورة وحدد: ${selectedQuestions.join(" ")} واصل فقط إذا كان مسار الاستخدام والدفع والقرار واضحاً في 3 مقابلات على الأقل.`;
  }

  return `Before testing ${context.primaryProblem}, interview 5 people across the mentioned roles and answer: ${selectedQuestions.join(" ")} Continue only if the usage, payment, and purchase path is clear in at least 3 interviews.`;
}

function getStageLabel(stage, language) {
  const labels = {
    idea: { en: "idea", ar: "الفكرة" },
    mvp: { en: "MVP", ar: "النموذج الأولي" },
    launched: { en: "launched", ar: "الإطلاق" },
  };

  return labels[stage]?.[language] || labels.idea[language];
}

function buildRecommendationContext(input, language) {
  const problemParts = splitProblemInput(input.problem, language);
  const offerFallback = language === "ar" ? "الفكرة المقترحة" : "the proposed idea";
  const alternativeFallback = language === "ar" ? "الطريقة الحالية" : "the current workaround";
  const hasMultipleProblems = problemParts.length > 1;
  const problemSelection = selectPrimaryProblem(problemParts, language);
  const rawPrimaryProblem = summarizeProblem(problemSelection.problem || "", language);
  const hasMetaProblem = problemSelection.hasMetaProblem || isMetaProblem(rawPrimaryProblem, language);
  const primaryProblem = hasMetaProblem ? inferCustomerProblem(input, language) : rawPrimaryProblem;
  const executionChallenges = summarizeExecutionChallenges(problemSelection.executionChallenges || [], language);
  const suggestedProblemExample = suggestCustomerProblemExample(input, language);

  return {
    customerLabel: summarizeCustomer(input.targetCustomer, language),
    primaryProblem,
    executionChallenges,
    suggestedProblemExample,
    hasMultipleCustomerGroups: hasMultipleCustomerGroups(input.targetCustomer, language),
    proposedSolution: summarizeSolution(input.businessName || input.businessIdea, language, offerFallback),
    currentAlternative: summarizeSolution(input.currentSolution, language, alternativeFallback),
    advantageSummary: summarizeSolution(
      input.competitiveAdvantage,
      language,
      language === "ar" ? "الميزة المقترحة" : "the proposed advantage"
    ),
    revenueDescription: summarizeRevenue(input.monetization, language),
    stakeholderRoles: input.stakeholderRoles || {},
    hasStakeholderAmbiguity: Boolean(input.stakeholderRoles?.hasRoleAmbiguity),
    evidenceSignals: input.evidenceSignals || {},
    hasMaterialEvidenceGap: Boolean(input.evidenceSignals?.hasUnsupportedClaims),
    hasMultipleProblems,
    hasMetaProblem,
    focusWarning:
      hasMetaProblem && language === "ar"
        ? "تحتاج الفكرة إلى صياغة مشكلة عميل محددة بدلاً من وصف تحدي تحويل الفكرة إلى مشروع."
        : hasMetaProblem
          ? "The idea needs a specific customer problem instead of a founder execution challenge."
          : language === "ar"
        ? "تحتاج الفكرة إلى اختيار مشكلة رئيسية واحدة وحالة استخدام أولى قبل التوسع."
        : "The idea needs one primary problem and one first use case before expanding.",
  };
}

function summarizeProblem(value, language) {
  const safeValue = completeFragment(value, language, language === "ar" ? "المشكلة الرئيسية" : "the primary problem", 72);

  if (language === "ar") {
    const transformed = safeValue
      .replace(/^كيف\s+يمكن\s+/u, "")
      .replace(/^كيف\s+يمكنهم\s+/u, "")
      .replace(/^كيف\s+يستطيعون\s+/u, "")
      .replace(/^كيف\s+يقللون\s+/u, "")
      .replace(/^كيف\s+يقللوا\s+/u, "تقليل ")
      .replace(/^كيف\s+يتجنبون\s+/u, "تجنب ")
      .replace(/^كيف\s+يحسنون\s+/u, "تحسين ")
      .replace(/^كيف\s+/u, "");
    return completeFragment(transformed, language, "المشكلة الرئيسية", 72);
  }

  return completeFragment(
    safeValue
    .replace(/^they\s+sometimes\s+need\s+help\s+/i, "")
    .replace(/^they\s+need\s+help\s+/i, "")
    .replace(/^customers\s+need\s+help\s+/i, "")
    .replace(/^users\s+need\s+help\s+/i, "")
    .replace(/^patients\s+sometimes\s+miss\s+appointments/i, "missed appointments")
    .replace(/^patients\s+miss\s+appointments/i, "missed appointments")
    .replace(/^patients\s+sometimes\s+/i, "patients ")
    .trim(),
    language,
    "the primary problem",
    72
  );
}

function isMetaProblem(value, language) {
  if (language === "ar") {
    return (
      /(تحويل|تحويلها|تحويله)\s+الفكرة\s+(?:إلى|الى)\s+(?:عمل|مشروع)|بناء\s+المشروع|تأسيس\s+المشروع|تطوير\s+الفكرة|تنفيذ\s+الفكرة/u.test(
        value
      ) || isFounderExecutionProblem(value, language)
    );
  }

  return (
    /\b(turn|turning|convert|converting)\s+(?:the\s+)?idea\s+into\s+(?:a\s+)?(?:business|company|startup)|build(?:ing)?\s+the\s+business\b/i.test(
      value
    ) || isFounderExecutionProblem(value, language)
  );
}

function selectPrimaryProblem(problemParts, language) {
  const parts = Array.isArray(problemParts) ? problemParts : [];
  const executionChallenges = parts.filter((part) => isFounderExecutionProblem(part, language));
  const usablePart = parts.find((part) => !isFounderExecutionProblem(part, language));

  if (usablePart) {
    return {
      problem: usablePart,
      hasMetaProblem: false,
      executionChallenges,
    };
  }

  return {
    problem: parts[0] || "",
    hasMetaProblem: true,
    executionChallenges,
  };
}

function summarizeExecutionChallenges(parts, language) {
  const labels = parts.map((part) => classifyExecutionChallenge(part, language)).filter(Boolean);
  const unique = [...new Set(labels)].slice(0, 3);

  if (!unique.length) {
    return language === "ar" ? "تحديات تنفيذ المشروع" : "project execution challenges";
  }

  if (language === "ar") {
    return unique.join("، ");
  }

  return unique.join(", ");
}

function classifyExecutionChallenge(value, language) {
  const text = cleanSameLanguageText(value, language);

  if (language === "ar") {
    if (/تنفيذ\s+الفكرة|تحويل\s+الفكرة|بناء\s+المشروع|تأسيس\s+المشروع/u.test(text)) return "تنفيذ المشروع";
    if (/إقناع|اقناع|اشتراك\s+(?:الفنيين|الفنين|مقدمي|مزودي)/u.test(text)) return "جذب مقدمي الخدمة";
    if (/ربط\s+العملاء|عملية\s+ربط|توصيل(?:ه|هم)?\s+مع\s+عميل/u.test(text)) return "ربط العميل بمقدم الخدمة";
    if (/حساب\s+العمول|طريقة\s+الدفع|معرفة\s+طريقة\s+الدفع/u.test(text)) return "اختيار نموذج الدفع";
    if (/تحديد\s+أول\s+خدمة|تحديد\s+اول\s+خدمة/u.test(text)) return "اختيار أول خدمة";
    return "تحدي تنفيذي";
  }

  if (/\b(execut(?:e|ing|ion)\s+(?:the\s+)?idea|build(?:ing)?\s+the\s+business)\b/i.test(text)) return "executing the idea";
  if (/\b(recruit(?:ing)?|convinc(?:e|ing))\s+(?:providers|technicians|suppliers)\b/i.test(text)) return "recruiting providers";
  if (/\bconnect(?:ing)?\s+customers\s+(?:with|to)\b/i.test(text)) return "matching customers with providers";
  if (/\b(payment\s+model|commission\s+split)\b/i.test(text)) return "choosing the payment model";
  return "an execution challenge";
}

function suggestCustomerProblemExample(input, language) {
  const combined = `${input.businessIdea || ""} ${input.targetCustomer || ""} ${input.competitiveAdvantage || ""}`;

  if (language === "ar") {
    if (/(صيانة|إصلاح|اصلاح|منازل|المنازل|فني|فنيين|ورش|مهن)/u.test(combined)) {
      return "العثور على فني موثوق بسرعة وبسعر واضح";
    }

    return "مشكلة محددة تجعل العميل يبحث عن حل";
  }

  if (/\b(home|maintenance|repair|technician|contractor)\b/i.test(combined)) {
    return "finding a trusted technician quickly at a clear price";
  }

  return "one specific problem the customer actively tries to solve";
}

function isFounderExecutionProblem(value, language) {
  const text = cleanSameLanguageText(value, language);

  if (language === "ar") {
    return /تنفيذ\s+الفكرة|تحديد\s+أول\s+خدمة|تحديد\s+اول\s+خدمة|إقناع|اقناع|اشتراك\s+(?:الفنيين|الفنين|مقدمي|مزودي)|ربط\s+العملاء|عملية\s+ربط|حساب\s+العمول|طريقة\s+الدفع|معرفة\s+طريقة\s+الدفع|توصيل(?:ه|هم)?\s+مع\s+عميل/u.test(
      text
    );
  }

  return /\b(execut(?:e|ing|ion)\s+(?:the\s+)?idea|recruit(?:ing)?\s+(?:providers|technicians|suppliers)|convinc(?:e|ing)\s+(?:providers|technicians|suppliers)|connect(?:ing)?\s+customers\s+(?:with|to)|payment\s+model|commission\s+split)\b/i.test(
    text
  );
}

function inferCustomerProblem(input, language) {
  const combined = `${input.businessIdea || ""} ${input.targetCustomer || ""}`;

  if (language === "ar") {
    if (/(صيانة|إصلاح|اصلاح|منازل|المنازل|فني|فنيين|مهن)/u.test(combined)) {
      return "مشكلة صيانة أو إصلاح واحدة يواجهها العميل";
    }

    return "مشكلة عميل محددة";
  }

  if (/\b(home|maintenance|repair|technician|contractor)\b/i.test(combined)) {
    return "one specific home maintenance or repair problem";
  }

  return "a specific customer problem";
}

function summarizeCustomer(value, language) {
  const text = cleanSameLanguageText(value, language);
  if (language === "ar" && text.includes(" مثل ")) {
    return normalizeArabicCustomerLabel(completeFragment(text.split(" مثل ")[0], language, "العملاء المستهدفون", 64));
  }

  if (language === "ar" && /\sو\s+كل\s+/u.test(text)) {
    return normalizeArabicCustomerLabel(completeFragment(text.split(/\sو\s+كل\s+/u)[0], language, "العملاء المستهدفون", 64));
  }

  if (language === "ar" && /\sو\s+جميع\s+/u.test(text)) {
    return normalizeArabicCustomerLabel(completeFragment(text.split(/\sو\s+جميع\s+/u)[0], language, "العملاء المستهدفون", 64));
  }

  if (language !== "ar" && /\bsuch as\b/i.test(text)) {
    return completeFragment(text.split(/\bsuch as\b/i)[0], language, "the target customers", 64);
  }

  const label = completeFragment(text, language, language === "ar" ? "العملاء المستهدفون" : "the target customers", 64);
  return language === "ar" ? normalizeArabicCustomerLabel(label) : label;
}

function hasMultipleCustomerGroups(value, language) {
  const text = cleanSameLanguageText(value, language);
  if (!text) return false;

  if (language === "ar") {
    return /\sو\s+(?:المنازل|أصحاب|اصحاب|كل|جميع|طالبي|ورش|مصانع)/u.test(text);
  }

  return /\b(and|plus|as well as)\b/i.test(text) || /,/.test(text);
}

function normalizeArabicCustomerLabel(value) {
  return value
    .replace(/اصحاب المنازل\s+و\s+اصحاب الورش/gu, "أصحاب المنازل وطالبي الخدمات الفنية")
    .replace(/أصحاب المنازل\s+و\s+اصحاب الورش/gu, "أصحاب المنازل وطالبي الخدمات الفنية")
    .replace(/أصحاب المنازل\s+و\s+أصحاب الورش/gu, "أصحاب المنازل وطالبي الخدمات الفنية")
    .replace("والحرفيون", "والحرفيين")
    .replace(/اصحاب/gu, "أصحاب")
    .replace(/الى/gu, "إلى")
    .replace(/الاصلاح/gu, "الإصلاح");
}

function summarizeSolution(value, language, fallback) {
  const text = cleanSameLanguageText(value, language);
  const firstClause = text.split(/[،,]/u).map((part) => part.trim()).find(Boolean) || text;
  const normalized =
    language === "ar"
      ? firstClause.replace(/^(?:يعتمدون|يعتمد|تستخدم|يستخدمون|يستخدم)\s+(?:حالياً\s+)?(?:على\s+)?/u, "")
      : firstClause.replace(/^(?:they|customers|users)\s+(?:currently\s+)?(?:use|rely on|depend on)\s+/i, "");

  return completeFragment(normalized, language, fallback, 74);
}

function summarizeRevenue(value, language) {
  const text = cleanSameLanguageText(value, language);

  if (!text) {
    return language === "ar" ? "نموذج الإيرادات" : "the revenue model";
  }

  const lower = text.toLowerCase();
  const percentageBased = /%|٪|نسبة|نسب|النسبة|عمولة|commission|percentage/.test(lower);
  const subscription = /اشتراك|شهري|سنوي|subscription|monthly|annual/.test(lower);
  const fee = /رسوم|رسم|fee|paid|payment/.test(lower);

  if (language === "ar") {
    if (percentageBased) return "جدوى العمولة أو النسبة من كل عملية ناجحة";
    if (subscription) return "جدوى الاشتراك الذي يدفعه العميل";
    if (fee) return "جدوى الرسوم المباشرة التي يدفعها العميل";
    return completeFragment(text, language, "نموذج إيرادات واضح", 64);
  }

  if (percentageBased) return "a percentage-based commission on successful transactions";
  if (subscription) return "a customer-paid subscription model";
  if (fee) return "a direct customer-paid fee";
  return completeFragment(text, language, "a clear revenue model", 64);
}

function buildExecutiveSummary({ verdictKey, lowestCriterion, language, context }) {
  const verdict = verdictKey || "unclear";
  const criterion = lowestCriterion?.key || "problemClarity";

  if (language === "ar") {
    const verdictText = {
      strong: "الفكرة واعدة، لكن التحقق العملي ما زال ضرورياً.",
      good: "الفكرة قابلة للاختبار، مع حاجة إلى تقليل أكبر نقطة غموض.",
      unclear: "الفكرة تحتاج إلى تضييق قبل اتخاذ قرار واضح.",
      weak: "الفكرة غير جاهزة للتوسع قبل إعادة ضبط الافتراض الأساسي.",
    }[verdict] || "الفكرة تحتاج إلى مزيد من التوضيح.";

    if (context.hasMetaProblem) {
      return `تعليقي على خانة المشكلة: المدخل الحالي يصف ${context.executionChallenges}، وهذه تحديات لبناء المشروع وليست مشكلة عميل مباشرة. الحل هو تحويلها إلى مشكلة واحدة يواجهها ${context.customerLabel}، مثل صعوبة ${context.suggestedProblemExample}، ثم اختبارها قبل الحكم على الفكرة.`;
    }

    if (context.hasMultipleProblems) {
      return `${verdictText} الأولوية الآن هي اختيار مشكلة رئيسية واحدة لدى ${context.customerLabel}: ${context.primaryProblem}.`;
    }

    return `${verdictText} أضعف نقطة حالياً هي ${arabicCriterionName(criterion)} المرتبطة بـ ${context.primaryProblem}.`;
  }

  const verdictText = {
    strong: "The idea is promising, but practical validation is still needed.",
    good: "The idea is testable, with one uncertainty to reduce first.",
    unclear: "The idea needs sharper focus before a confident decision.",
    weak: "The idea is not ready to scale until the main assumption is reset.",
  }[verdict] || "The idea needs more clarity.";

  if (context.hasMetaProblem) {
    return `Problem interpretation: the current input describes ${context.executionChallenges}, which are execution challenges rather than a direct customer problem. Turn it into one problem faced by ${context.customerLabel}, such as ${context.suggestedProblemExample}, then validate that before judging the idea.`;
  }

  if (context.hasMultipleProblems) {
    return `${verdictText} The priority is to choose one primary problem for ${context.customerLabel}: ${context.primaryProblem}.`;
  }

  return `${verdictText} The weakest area is ${englishCriterionName(criterion)} around ${context.primaryProblem}.`;
}

function arabicCriterionName(key) {
  return {
    problemClarity: "وضوح المشكلة",
    customerClarity: "وضوح العميل المستهدف",
    marketNeed: "قوة الحاجة",
    monetizationClarity: "نموذج الإيرادات",
    feasibility: "قابلية التنفيذ",
  }[key] || "النقطة الأضعف";
}

function englishCriterionName(key) {
  return {
    problemClarity: "problem clarity",
    customerClarity: "customer clarity",
    marketNeed: "market need",
    monetizationClarity: "monetization",
    feasibility: "feasibility",
  }[key] || "the weakest area";
}

function splitProblemInput(value, language) {
  const text = cleanSameLanguageText(value, language);
  if (!text) return [language === "ar" ? "المشكلة الرئيسية" : "the primary problem"];

  const protectedText = text
    .replace(/(?:^|\s)(?:\d+|[١-٩])\s*[\).\-:：]\s*/gu, "\n")
    .replace(/[؛;]\s*/g, "\n")
    .replace(/\s+-\s+/g, "\n");

  const parts = protectedText
    .split(/\n+/)
    .map((part) => normalizeFragment(part))
    .filter((part) => part.length > 3);

  return parts.length ? parts : [completeFragment(text, language, language === "ar" ? "المشكلة الرئيسية" : "the primary problem", 72)];
}

function completeFragment(value, language, fallback, maxLength = 72) {
  const text = cleanSameLanguageText(value, language);
  if (!text) return fallback;

  const firstSentence = text.split(/[.!?؟]/u).map((part) => part.trim()).find(Boolean) || text;
  const firstLine = firstSentence.split(/\n+/).map((part) => part.trim()).find(Boolean) || firstSentence;
  const normalized = normalizeFragment(firstLine);

  if (normalized.length <= maxLength) return normalized;

  const words = normalized.split(" ");
  let output = "";
  for (const word of words) {
    const next = output ? `${output} ${word}` : word;
    if (next.length > maxLength) break;
    output = next;
  }

  return output || fallback;
}

function cleanSameLanguageText(value, language) {
  const text = String(value || "")
    .replace(/\r/g, "\n")
    .replace(/[•*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";

  const cleaned =
    language === "ar"
      ? text.replace(/[A-Za-z]+/g, "").replace(/\s+/g, " ").trim()
      : text.replace(/[\u0600-\u06FF]+/g, "").replace(/\s+/g, " ").trim();

  return normalizeFragment(cleaned);
}

function normalizeFragment(value) {
  return String(value || "")
    .replace(/^["'“”‘’\s]+|["'“”‘’.,،؛:!?؟\s]+$/g, "")
    .replace(/^(?:\d+|[١-٩])\s*[\).\-:：]\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}
