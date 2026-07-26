/**
 * Shared utility helpers for AI Source Hub core-engine modules.
 *
 * These helpers are product-agnostic. They do not know about any specific
 * product, scoring framework, UI, backend, or external service.
 */

export function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

export function toLowerText(value = "") {
  return normalizeText(value).toLowerCase();
}

export function isEmpty(value) {
  return normalizeText(value).length === 0;
}

export function clampNumber(value, min = 0, max = 100) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return min;
  }

  return Math.max(min, Math.min(max, number));
}

export function roundNumber(value) {
  return Math.round(Number(value) || 0);
}

export function sumNumbers(values = []) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

export function detectTextDirection(value = "") {
  return /[\u0600-\u06FF]/.test(value) ? "rtl" : "ltr";
}

export function detectPrimaryLanguage(value = "") {
  const text = String(value);
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const englishCount = (text.match(/[A-Za-z]/g) || []).length;

  return arabicCount > englishCount ? "ar" : "en";
}

export function uniqueList(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function sortByPriority(items = [], priority = []) {
  return [...items].sort((a, b) => {
    const aPriority = priority.indexOf(a);
    const bPriority = priority.indexOf(b);
    const safeA = aPriority === -1 ? Number.MAX_SAFE_INTEGER : aPriority;
    const safeB = bPriority === -1 ? Number.MAX_SAFE_INTEGER : bPriority;

    return safeA - safeB;
  });
}

export function createResult(ok, payload = {}) {
  return {
    ok,
    ...payload,
  };
}

