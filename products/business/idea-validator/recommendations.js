import { RecommendationEngine } from "../../../core/engines.js";
import { getBiggestRisk, getNextAction } from "./rules.js";

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
  const recommendationEngine = new RecommendationEngine({
    rules: [
      {
        key: "primary_next_action",
        title: "Primary next action",
        priority: 1,
        when: () => true,
        action: () => buildPersonalizedNextAction({ lowestCriterion, verdictKey, language, input, stage }),
        reason: () => buildPersonalizedBiggestRisk({ lowestCriterion, language, input, stage }),
      },
    ],
  });

  return recommendationEngine.recommend({
    score,
    criteria,
    lowestCriterion,
    verdictKey,
    confidence,
    input,
    stage,
  });
}

function buildPersonalizedBiggestRisk({ lowestCriterion, language = "en", input = {}, stage = "idea" }) {
  if (!input || !lowestCriterion?.key) return getBiggestRisk(lowestCriterion, language);

  const context = buildRecommendationContext(input, language);
  const stageLabel = getStageLabel(stage, language);

  const messages = {
    problemClarity: {
      en: `The main risk is an unclear problem for ${context.customer}. If ${context.problemTopic} is not described in a specific situation, it will be hard to know what to build first or why buyers should act at the ${stageLabel} stage.`,
      ar: `أكبر مخاطرة هي عدم وضوح المشكلة لدى ${context.customer}. إذا لم تُوصف ${context.problemTopic} في موقف محدد، فسيصعب تحديد ما يجب بناؤه أولاً ولماذا سيتحرك العميل في مرحلة ${stageLabel}.`,
    },
    customerClarity: {
      en: `The buyer profile is still too broad to test cleanly. If ${context.customer} is not narrowed, feedback about ${context.problemTopic} may come from people who are curious but unlikely to pay for ${context.offer}.`,
      ar: `ملف العميل ما زال واسعاً لاختباره بوضوح. إذا لم تُضيّق شريحة ${context.customer}، فقد تأتي ملاحظات حول ${context.problemTopic} من مهتمين لا يتحولون إلى مشترين لـ ${context.offer}.`,
    },
    marketNeed: {
      en: `The biggest risk is that ${context.customer} may not see ${context.problemTopic} as important enough to replace their current workaround: ${context.currentAlternative}. If that is true, they will not pay for ${context.offer} through ${context.monetization}.`,
      ar: `الخطر الأكبر أن تواصل شريحة ${context.customer} استخدام ${context.currentAlternative} إذا لم يكن ${context.problemTopic} مهماً أو متكرراً بما يكفي. عندها لن يكون الدفع عبر ${context.monetization} أولوية.`,
    },
    monetizationClarity: {
      en: `The value may be clear, but payment is not proven. For ${context.customer}, ${context.monetization} needs evidence that the buyer will pay specifically for solving ${context.problemTopic}, not just find ${context.offer} useful.`,
      ar: `قد تكون القيمة واضحة، لكن الدفع غير مثبت بعد. بالنسبة إلى ${context.customer}، يحتاج ${context.monetization} إلى دليل أن العميل سيدفع تحديداً لمعالجة ${context.problemTopic}، وليس فقط لأنه يرى ${context.offer} مفيداً.`,
    },
    feasibility: {
      en: `The first version may be too wide for the ${stageLabel} stage. If the test is not narrowed around ${context.problemTopic}, it will be hard to know whether ${context.advantage} truly makes ${context.offer} easier to choose than ${context.currentAlternative}.`,
      ar: `قد تكون النسخة الأولى أوسع من المناسب لمرحلة ${stageLabel}. إذا لم يُضيّق الاختبار حول ${context.problemTopic}، فسيصعب معرفة ما إذا كانت ${context.advantage} تجعل ${context.offer} أسهل للاختيار من ${context.currentAlternative}.`,
    },
  };

  return messages[lowestCriterion.key]?.[language] || getBiggestRisk(lowestCriterion, language);
}

function buildPersonalizedNextAction({ lowestCriterion, verdictKey, language = "en", input = {}, stage = "idea" }) {
  if (!input || !lowestCriterion?.key) return getNextAction(lowestCriterion, verdictKey, language);

  const context = buildRecommendationContext(input, language);

  if (stage === "mvp") {
    return buildMvpAction(lowestCriterion.key, { context, language });
  }

  if (stage === "launched") {
    return buildLaunchedAction(lowestCriterion.key, { context, language });
  }

  return buildIdeaAction(lowestCriterion.key, { context, language, verdictKey });
}

function buildIdeaAction(key, { context, language }) {
  const actions = {
    problemClarity: {
      en: `Interview 5 people from ${context.customer}. Ask them to describe the last real situation involving ${context.problemTopic}, what they tried, and what it cost in time or money.`,
      ar: `قابل 5 أشخاص من ${context.customer}. اطلب منهم وصف آخر موقف حقيقي مرتبط بـ ${context.problemTopic}، وما الذي جرّبوه، وما التكلفة بالوقت أو المال.`,
    },
    customerClarity: {
      en: `Choose one narrow segment inside ${context.customer}. Contact 10 people and count how many personally deal with ${context.problemTopic} and can try ${context.offer} this month.`,
      ar: `اختر شريحة أضيق داخل ${context.customer}. تواصل مع 10 أشخاص واحسب من يواجه ${context.problemTopic} بنفسه ويمكنه تجربة ${context.offer} هذا الشهر.`,
    },
    marketNeed: {
      en: `Speak with 10 people from ${context.customer}. Ask how they handle ${context.problemTopic} today and compare it with ${context.offer}; continue only if at least 6 say the current workaround costs them enough to try or pay.`,
      ar: `تحدث مع 10 أشخاص من ${context.customer}. اسألهم كيف يتعاملون حالياً مع ${context.problemTopic} وما الذي لا يناسبهم في ${context.currentAlternative}. واصل فقط إذا قال 6 منهم على الأقل إن الطريقة الحالية تكلفهم وقتاً أو مالاً بما يكفي لتجربة حل جديد أو الدفع مقابله.`,
    },
    monetizationClarity: {
      en: `Test ${context.monetization} in 5 discovery calls with ${context.customer}. Ask who pays for solving ${context.problemTopic}, when payment happens, and what price would be too high.`,
      ar: `اختبر ${context.monetization} في 5 محادثات مع ${context.customer}. اسأل من سيدفع لمعالجة ${context.problemTopic}، ومتى يحدث الدفع، وما السعر الذي سيكون مرتفعاً.`,
    },
    feasibility: {
      en: `Run a one-week manual test for ${context.customer}: use the smallest version of ${context.offer} to solve only ${context.problemTopic}, then ask whether ${context.advantage} changed their decision to continue.`,
      ar: `نفّذ اختباراً يدوياً لمدة أسبوع مع ${context.customer}: استخدم أصغر نسخة من ${context.offer} لمعالجة ${context.problemTopic} فقط، ثم اسأل هل غيّرت ${context.advantage} قرارهم بالاستمرار.`,
    },
  };

  return actions[key]?.[language] || getNextAction({ key }, "unclear", language);
}

function buildMvpAction(key, { context, language }) {
  const actions = {
    problemClarity: {
      en: `Watch 5 MVP users from ${context.customer}. Record where they hesitate while dealing with ${context.problemTopic}, then fix only the most repeated blocker.`,
      ar: `راقب 5 مستخدمين للنموذج الأولي من ${context.customer}. سجّل أين يترددون عند التعامل مع ${context.problemTopic}، ثم أصلح العائق الأكثر تكراراً فقط.`,
    },
    customerClarity: {
      en: `Split MVP users into 2-3 segments and compare activation. Keep the segment closest to ${context.customer} if it activates at least 20% better.`,
      ar: `قسّم مستخدمي النموذج الأولي إلى شريحتين أو ثلاث وقارن التفعيل. احتفظ بالشريحة الأقرب إلى ${context.customer} إذا كان تفعيلها أعلى بنسبة 20% على الأقل.`,
    },
    marketNeed: {
      en: `Measure 14-day repeat usage: do users from ${context.customer} return at least twice for ${context.problemTopic}? If fewer than 40% return, interview inactive users before adding features.`,
      ar: `قِس الاستخدام المتكرر خلال 14 يوماً: هل يعود مستخدمو ${context.customer} مرتين على الأقل بسبب ${context.problemTopic}؟ إذا عاد أقل من 40%، قابل غير النشطين قبل إضافة مزايا.`,
    },
    monetizationClarity: {
      en: `Show ${context.monetization} to 5 active MVP users and ask for one commitment: payment, pilot approval, or a scheduled buying conversation.`,
      ar: `اعرض ${context.monetization} على 5 مستخدمين نشطين في النموذج الأولي، واطلب التزاماً واحداً: دفع، موافقة على تجربة، أو موعد نقاش شراء.`,
    },
    feasibility: {
      en: `For one week, keep only the MVP path where ${context.customer} uses ${context.offer} for ${context.problemTopic}. Track completion and activation before adding scope.`,
      ar: `لمدة أسبوع، أبقِ فقط على المسار الذي يستخدم فيه ${context.customer} ${context.offer} لمعالجة ${context.problemTopic}. قِس الإكمال والتفعيل قبل توسيع النطاق.`,
    },
  };

  return actions[key]?.[language] || getNextAction({ key }, "unclear", language);
}

function buildLaunchedAction(key, { context, language }) {
  const actions = {
    problemClarity: {
      en: `Review support, churn, and sales notes from real ${context.customer}. Tag how they describe ${context.problemTopic} and update positioning around the repeated wording.`,
      ar: `راجع ملاحظات الدعم وفقدان العملاء والمبيعات من ${context.customer} الفعليين. استخرج كيف يصفون ${context.problemTopic} وحدّث التموضع حول العبارات المتكررة.`,
    },
    customerClarity: {
      en: `Compare conversion and retention across customer types. Focus acquisition on the segment within ${context.customer} with the strongest repeat usage.`,
      ar: `قارن التحويل والاحتفاظ بين أنواع العملاء. ركّز الاستحواذ على الشريحة داخل ${context.customer} التي تملك أقوى استخدام متكرر.`,
    },
    marketNeed: {
      en: `Check retention evidence: how often do paying or active ${context.customer} return because of ${context.problemTopic}? Interview churned users and tag the top 3 reasons.`,
      ar: `افحص دليل الاحتفاظ: كم مرة يعود ${context.customer} النشط أو الدافع بسبب ${context.problemTopic}؟ قابل من توقفوا عن الاستخدام وحدد أهم 3 أسباب.`,
    },
    monetizationClarity: {
      en: `Audit ${context.monetization} against conversion, expansion, and churn. Test one pricing change with the customer segment most likely to retain.`,
      ar: `راجع ${context.monetization} مقابل التحويل والتوسع وفقدان العملاء. اختبر تغييراً واحداً في التسعير مع الشريحة الأكثر احتمالاً للاحتفاظ.`,
    },
    feasibility: {
      en: `Use real usage data to remove low-value workflows. Double down on the path where ${context.customer} solves ${context.problemTopic} fastest with ${context.offer}.`,
      ar: `استخدم بيانات الاستخدام الفعلية لإزالة المسارات قليلة القيمة. ركّز على المسار الذي يعالج فيه ${context.customer} ${context.problemTopic} بأسرع شكل عبر ${context.offer}.`,
    },
  };

  return actions[key]?.[language] || getNextAction({ key }, "unclear", language);
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
  const problem = fragment(input.problem, language, language === "ar" ? "هذه المشكلة" : "this problem");
  const offerFallback = language === "ar" ? "الفكرة المقترحة" : "the proposed idea";
  const alternativeFallback = language === "ar" ? "الطريقة الحالية" : "the current workaround";
  return {
    customer: fragment(input.targetCustomer, language, language === "ar" ? "العميل المستهدف" : "the target customer"),
    problem,
    problemTopic: summarizeProblem(problem, language),
    offer: fragment(input.businessName || input.businessIdea, language, offerFallback),
    currentAlternative: fragment(input.currentSolution, language, alternativeFallback),
    advantage: fragment(input.competitiveAdvantage, language, language === "ar" ? "الميزة المقترحة" : "the proposed advantage"),
    monetization: fragment(input.monetization, language, language === "ar" ? "نموذج الإيرادات" : "the revenue model"),
  };
}

function summarizeProblem(value, language) {
  if (language === "ar") {
    const transformed = value
      .replace(/^كيف\s+يمكن\s+/u, "")
      .replace(/^كيف\s+يمكنهم\s+/u, "")
      .replace(/^كيف\s+يستطيعون\s+/u, "")
      .replace(/^كيف\s+يقللون\s+/u, "")
      .replace(/^كيف\s+يقللوا\s+/u, "تقليل ")
      .replace(/^كيف\s+يتجنبون\s+/u, "تجنب ")
      .replace(/^كيف\s+يحسنون\s+/u, "تحسين ")
      .replace(/^كيف\s+/u, "");
    return transformed || value;
  }

  return value
    .replace(/^they\s+sometimes\s+need\s+help\s+/i, "")
    .replace(/^they\s+need\s+help\s+/i, "")
    .replace(/^customers\s+need\s+help\s+/i, "")
    .replace(/^users\s+need\s+help\s+/i, "")
    .replace(/^patients\s+sometimes\s+miss\s+appointments/i, "missed appointments")
    .replace(/^patients\s+miss\s+appointments/i, "missed appointments")
    .replace(/^patients\s+sometimes\s+/i, "patients ")
    .trim() || value;
}

function fragment(value, language, fallback) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;

  const cleaned =
    language === "ar"
      ? text.replace(/[A-Za-z]+/g, "").replace(/\s+/g, " ").trim()
      : text.replace(/[\u0600-\u06FF]+/g, "").replace(/\s+/g, " ").trim();

  const finalText = cleaned || fallback;
  const normalized = finalText.replace(/^["'“”‘’]+|["'“”‘’.,،؛:!?؟]+$/g, "").trim();
  return normalized.length > 90 ? `${normalized.slice(0, 87).trim()}...` : normalized;
}
