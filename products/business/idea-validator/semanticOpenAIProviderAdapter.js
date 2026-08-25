import { createOpenAIResponsesTextFormat } from "./semanticIntentContract.js";
import { createSemanticIntentProvider } from "./semanticIntentProvider.js";

export const SEMANTIC_OPENAI_ADAPTER_STATUS = "disabled_until_server_boundary_exists";
export const OPENAI_RESPONSES_API_URL = "https://api.openai.com/v1/responses";

export const SEMANTIC_OPENAI_SERVER_BOUNDARY = {
  execution: "server_or_serverless_only",
  clientPolicy: "browser_code_must_never_hold_provider_credentials",
  providerApi: "responses",
  outputMode: "structured_json_schema",
  bivAuthority: [
    "eligibility",
    "clarification_state",
    "business_rules",
    "journey_state",
    "confidence_thresholds",
    "final_recommendation",
  ],
  providerMayAssistWith: [
    "arabic_english_normalization",
    "structured_field_extraction",
    "semantic_classification_suggestions",
    "ambiguity_detection",
    "contradiction_detection",
    "candidate_clarification_questions",
  ],
};

export function createDisabledOpenAIResponsesSemanticProvider({
  model,
  serverInvoker,
} = {}) {
  return createSemanticIntentProvider({
    async interpret(request) {
      if (typeof serverInvoker !== "function") {
        throw new Error("OpenAI semantic provider is disabled until a server-side boundary is implemented.");
      }
      const payload = buildOpenAIResponsesSemanticPayload({ request, model });
      return serverInvoker(payload);
    },
  });
}

export function createOpenAIResponsesServerInvoker({
  apiKey,
  fetcher = globalThis.fetch,
  timeoutMs = 1500,
} = {}) {
  return async function invokeOpenAIResponses(payload) {
    if (!apiKey || typeof apiKey !== "string") {
      throw new Error("OpenAI API key is not configured on the server.");
    }
    if (typeof fetcher !== "function") {
      throw new Error("OpenAI fetch implementation is not available in this runtime.");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetcher(OPENAI_RESPONSES_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response || !response.ok) {
        throw new Error("OpenAI semantic provider returned an unsuccessful response.");
      }

      const json = await response.json();
      return extractStructuredOutputFromResponsesApi(json);
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("OpenAI semantic provider timed out.");
      }
      throw new Error("OpenAI semantic provider failed.");
    } finally {
      clearTimeout(timer);
    }
  };
}

export function buildOpenAIResponsesSemanticPayload({ request, model } = {}) {
  if (!model || typeof model !== "string") {
    throw new Error("A model name must be supplied by the future server-side OpenAI integration.");
  }
  return {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: buildSemanticSystemInstruction(),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(request),
          },
        ],
      },
    ],
    text: {
      format: createOpenAIResponsesTextFormat(),
    },
  };
}

export function extractStructuredOutputFromResponsesApi(responseBody = {}) {
  if (!responseBody || typeof responseBody !== "object") {
    throw new Error("OpenAI response body is not an object.");
  }

  const outputText = typeof responseBody.output_text === "string"
    ? responseBody.output_text
    : findFirstOutputText(responseBody.output);
  if (!outputText) {
    throw new Error("OpenAI response did not include structured output text.");
  }

  try {
    return JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI structured output was not valid JSON.");
  }
}

function findFirstOutputText(output = []) {
  if (!Array.isArray(output)) return "";
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const contentItem of content) {
      if (typeof contentItem?.text === "string" && contentItem.text.trim()) {
        return contentItem.text;
      }
    }
  }
  return "";
}

function buildSemanticSystemInstruction() {
  return [
    "You assist AI Source Hub Business Idea Validator with semantic interpretation only.",
    "Return only JSON that matches the supplied schema.",
    "Do not make eligibility decisions, route decisions, scores, reports, prices, or final recommendations.",
    "Use only the supplied request. Mark uncertainty as requiring confirmation.",
    "BIV validates and filters all output before any user-facing presentation.",
  ].join(" ");
}
