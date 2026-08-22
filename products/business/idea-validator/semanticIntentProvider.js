import { createSemanticIntentFallback } from "./semanticIntentContract.js";
import { filterSemanticIntentOutput } from "./semanticIntentFilter.js";
import { validateSemanticIntentRequest } from "./semanticIntentValidator.js";

export function createSemanticIntentProvider({ interpret } = {}) {
  return { interpret };
}

export function assertSemanticIntentProvider(provider) {
  if (!provider || typeof provider.interpret !== "function") {
    throw new Error("Semantic intent provider must expose an async interpret(request) function.");
  }
  return provider;
}

export async function interpretWithSemanticProvider(provider, request, { timeoutMs = 1500 } = {}) {
  const requestValidation = validateSemanticIntentRequest(request);
  if (!requestValidation.ok) {
    return createSemanticIntentFallback({
      request,
      reasonCodes: requestValidation.reasonCodes,
      errors: requestValidation.errors,
    });
  }

  try {
    const checkedProvider = assertSemanticIntentProvider(provider);
    const output = await withTimeout(checkedProvider.interpret(request), timeoutMs);
    return filterSemanticIntentOutput({ request, output });
  } catch (error) {
    return createSemanticIntentFallback({
      request,
      reasonCodes: ["provider_failure"],
      errors: [error instanceof Error ? error.message : "Semantic provider failed."],
    });
  }
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Semantic provider timed out.")), timeoutMs);
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

