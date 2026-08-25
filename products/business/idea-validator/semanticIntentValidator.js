import {
  FORBIDDEN_SEMANTIC_AUTHORITY_FIELDS,
  FORBIDDEN_SEMANTIC_REQUEST_FIELDS,
  SEMANTIC_INTENT_SCHEMA_VERSION,
  SEMANTIC_INTENT_RESPONSE_JSON_SCHEMA,
  SEMANTIC_REQUIRED_REQUEST_FIELDS,
  SEMANTIC_REQUEST_FIELDS,
  SUPPORTED_SEMANTIC_LOCALES,
} from "./semanticIntentContract.js";

export function validateSemanticIntentRequest(request = {}) {
  const errors = [];
  const reasonCodes = [];
  const missingRequiredFields = [];

  if (!isPlainObject(request)) {
    return fail("request_not_object", "Semantic request must be an object.");
  }

  for (const key of Object.keys(request)) {
    if (!SEMANTIC_REQUEST_FIELDS.includes(key)) {
      errors.push(`Unknown request field: ${key}`);
      reasonCodes.push("unknown_request_field");
    }
  }

  for (const field of SEMANTIC_REQUIRED_REQUEST_FIELDS) {
    if (!(field in request)) {
      errors.push(`Missing required request field: ${field}`);
      reasonCodes.push("missing_required_fields");
      missingRequiredFields.push(field);
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
    missingRequiredFields,
  };

  function fail(reasonCode, message) {
    return { ok: false, errors: [message], reasonCodes: [reasonCode], missingRequiredFields: [] };
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

export function validateSemanticIntentStructuredOutput(output = {}) {
  const errors = [];
  validateAgainstSchema(output, SEMANTIC_INTENT_RESPONSE_JSON_SCHEMA, "output", errors);
  return {
    ok: errors.length === 0,
    errors,
    reasonCodes: errors.length ? ["structured_output_schema_invalid"] : [],
  };
}

function validateAgainstSchema(value, schema, path, errors) {
  if (schema.anyOf) {
    const branchErrors = schema.anyOf.map((branch) => {
      const nestedErrors = [];
      validateAgainstSchema(value, branch, path, nestedErrors);
      return nestedErrors;
    });
    if (branchErrors.some((nestedErrors) => nestedErrors.length === 0)) return;
    errors.push(`${path} does not match any allowed schema branch.`);
    return;
  }

  if (schema.type === "null") {
    if (value !== null) errors.push(`${path} must be null.`);
    return;
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array.`);
      return;
    }
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      errors.push(`${path} must contain at least ${schema.minItems} items.`);
    }
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
      errors.push(`${path} must contain at most ${schema.maxItems} items.`);
    }
    value.forEach((item, index) => validateAgainstSchema(item, schema.items || {}, `${path}[${index}]`, errors));
    return;
  }

  if (schema.type === "object") {
    if (!isPlainObject(value)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    const required = schema.required || [];
    for (const key of required) {
      if (!(key in value)) errors.push(`${path}.${key} is required.`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!schema.properties || !(key in schema.properties)) {
          errors.push(`${path}.${key} is not allowed.`);
        }
      }
    }
    for (const [key, nestedSchema] of Object.entries(schema.properties || {})) {
      if (key in value) validateAgainstSchema(value[key], nestedSchema, `${path}.${key}`, errors);
    }
    return;
  }

  if (schema.type && typeof value !== schema.type) {
    errors.push(`${path} must be ${schema.type}.`);
    return;
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path} must be one of: ${schema.enum.join(", ")}.`);
  }
}
