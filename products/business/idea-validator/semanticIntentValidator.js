import {
  FORBIDDEN_SEMANTIC_AUTHORITY_FIELDS,
  FORBIDDEN_SEMANTIC_REQUEST_FIELDS,
  SEMANTIC_INTENT_SCHEMA_VERSION,
  SEMANTIC_REQUEST_FIELDS,
  SUPPORTED_SEMANTIC_LOCALES,
} from "./semanticIntentContract.js";

export function validateSemanticIntentRequest(request = {}) {
  const errors = [];
  const reasonCodes = [];

  if (!isPlainObject(request)) {
    return fail("request_not_object", "Semantic request must be an object.");
  }

  for (const key of Object.keys(request)) {
    if (!SEMANTIC_REQUEST_FIELDS.includes(key)) {
      errors.push(`Unknown request field: ${key}`);
      reasonCodes.push("unknown_request_field");
    }
  }

  collectForbiddenKeys(request, [...FORBIDDEN_SEMANTIC_REQUEST_FIELDS, ...FORBIDDEN_SEMANTIC_AUTHORITY_FIELDS])
    .forEach((keyPath) => {
      errors.push(`Forbidden request field: ${keyPath}`);
      reasonCodes.push("forbidden_request_field");
    });

  if (request.schemaVersion !== SEMANTIC_INTENT_SCHEMA_VERSION) {
    errors.push("Unsupported semantic request schema version.");
    reasonCodes.push("unsupported_request_schema_version");
  }

  if (!SUPPORTED_SEMANTIC_LOCALES.includes(request.locale)) {
    errors.push("Unsupported semantic request locale.");
    reasonCodes.push("unsupported_request_locale");
  }

  if (typeof request.originalIdea !== "string") {
    errors.push("originalIdea must be a string.");
    reasonCodes.push("invalid_original_idea");
  }

  if (!isPlainObject(request.confirmedAnswers)) {
    errors.push("confirmedAnswers must be an object.");
    reasonCodes.push("invalid_confirmed_answers");
  }

  if (!isPlainObject(request.currentDiscoveryState)) {
    errors.push("currentDiscoveryState must be an object.");
    reasonCodes.push("invalid_discovery_state");
  }

  if (!Array.isArray(request.allowedTaxonomyOptions) || request.allowedTaxonomyOptions.length === 0) {
    errors.push("allowedTaxonomyOptions must be a non-empty array.");
    reasonCodes.push("invalid_allowed_taxonomy");
  } else {
    const ids = new Set();
    for (const option of request.allowedTaxonomyOptions) {
      if (!isPlainObject(option) || typeof option.id !== "string" || !option.id.trim()) {
        errors.push("Each allowed taxonomy option requires a stable id.");
        reasonCodes.push("invalid_allowed_taxonomy");
        continue;
      }
      if (ids.has(option.id)) {
        errors.push(`Duplicate allowed taxonomy id: ${option.id}`);
        reasonCodes.push("duplicate_allowed_taxonomy_id");
      }
      ids.add(option.id);
      if (typeof option.label !== "string" || !option.label.trim()) {
        errors.push(`Allowed taxonomy option ${option.id} requires a localized label.`);
        reasonCodes.push("invalid_allowed_taxonomy_label");
      }
    }
  }

  if (!isPlainObject(request.policySafeContext)) {
    errors.push("policySafeContext must be an object.");
    reasonCodes.push("invalid_policy_safe_context");
  }

  return {
    ok: errors.length === 0,
    errors,
    reasonCodes: [...new Set(reasonCodes)],
  };

  function fail(reasonCode, message) {
    return { ok: false, errors: [message], reasonCodes: [reasonCode] };
  }
}

export function collectForbiddenKeys(value, forbiddenKeys, path = "") {
  const matches = [];
  if (!value || typeof value !== "object") return matches;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      matches.push(...collectForbiddenKeys(item, forbiddenKeys, `${path}[${index}]`));
    });
    return matches;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const keyPath = path ? `${path}.${key}` : key;
    if (forbiddenKeys.includes(key)) matches.push(keyPath);
    matches.push(...collectForbiddenKeys(nestedValue, forbiddenKeys, keyPath));
  }

  return matches;
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

