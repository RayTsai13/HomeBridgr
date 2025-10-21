import {
  BedrockConfigurationError,
  invokeBedrockModel,
} from "@/lib/bedrock";

export type TermExplanation = {
  term: string;
  explanation: string;
};

export type CaptionAnalysis = {
  terms: TermExplanation[];
  rawModelText: string;
};

export type AnalyzeCaptionOptions = {
  modelId?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
};

const textDecoder = new TextDecoder();

export class CaptionAnalysisNotConfiguredError extends Error {
  constructor(
    message = "Caption analysis is not yet configured. Follow the AWS Bedrock setup guide to enable this feature."
  ) {
    super(message);
    this.name = "CaptionAnalysisNotConfiguredError";
  }
}

type BedrockContentBlock = {
  type?: string;
  text?: string;
};

type BedrockResponseShape = {
  content?: BedrockContentBlock[];
  outputText?: string;
  completion?: string;
  results?: Array<{ text?: string }>;
};

function buildPrompt(caption: string): string {
  return [
    "You help by clarifying student social media captions.",
    "Identify slang, acronyms, cultural references, or locations that could confuse someone who is not of the culture or area.",
    "List each confusing term alongside a brief 1-2 sentence explanation that references the caption context.",
    "Respond with strict JSON matching this schema:",
    '{ "terms": [ { "term": string, "explanation": string } ] }',
    "Provide between 2 and 7 terms when possible. If no confusing terms exist, explain why in one entry.",
    "Caption:",
    caption.trim(),
  ].join("\n\n");
}

function decodeBody(body: unknown): string {
  if (!body) {
    return "";
  }

  if (typeof body === "string") {
    return body;
  }

  if (body instanceof Uint8Array) {
    return textDecoder.decode(body);
  }

  if (body instanceof ArrayBuffer) {
    return textDecoder.decode(new Uint8Array(body));
  }

  throw new Error("Unsupported Bedrock response format.");
}

function extractModelText(payload: BedrockResponseShape): string {
  if (payload.content?.length) {
    const firstText = payload.content.find((block) => block.text?.trim());
    if (firstText?.text) {
      return firstText.text;
    }
  }

  if (payload.outputText) {
    return payload.outputText;
  }

  if (payload.completion) {
    return payload.completion;
  }

  if (payload.results?.length) {
    const firstResult = payload.results.find((entry) => entry.text?.trim());
    if (firstResult?.text) {
      return firstResult.text;
    }
  }

  return "";
}

function normaliseTerms(value: unknown): TermExplanation[] {
  if (!Array.isArray(value)) {
    throw new Error("Bedrock response is missing the `terms` array.");
  }

  const terms = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const { term, explanation } = entry as {
        term?: unknown;
        explanation?: unknown;
      };

      if (typeof term !== "string" || typeof explanation !== "string") {
        return null;
      }

      const cleanTerm = term.trim();
      const cleanExplanation = explanation.trim();

      if (!cleanTerm || !cleanExplanation) {
        return null;
      }

      return {
        term: cleanTerm,
        explanation: cleanExplanation,
      };
    })
    .filter(
      (entry): entry is TermExplanation =>
        Boolean(entry?.term) && Boolean(entry?.explanation)
    );

  if (!terms.length) {
    throw new Error(
      "Bedrock returned an empty or invalid `terms` array. Update the caption or adjust the prompt."
    );
  }

  return terms;
}

export async function analyzeCaption(
  caption: string,
  options: AnalyzeCaptionOptions = {}
): Promise<CaptionAnalysis> {
  if (typeof caption !== "string" || !caption.trim()) {
    throw new Error("Caption must be a non-empty string.");
  }

  const modelId = options.modelId ?? process.env.BEDROCK_MODEL_ID;

  if (!modelId) {
    throw new CaptionAnalysisNotConfiguredError(
      "Missing BEDROCK_MODEL_ID environment variable. Set it to your chosen Bedrock model (for example, anthropic.claude-3-haiku-20240307-v1:0)."
    );
  }

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: options.maxTokens ?? 400,
    temperature: options.temperature ?? 0,
    top_p: options.topP ?? 0.999,
    messages: [
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: buildPrompt(caption),
          },
        ],
      },
    ],
  };

  let responseBody: string;

  try {
    const response = await invokeBedrockModel({
      modelId,
      body: JSON.stringify(payload),
      contentType: "application/json",
      accept: "application/json",
    });

    responseBody = decodeBody(response.body);
  } catch (error) {
    if (error instanceof BedrockConfigurationError) {
      throw new CaptionAnalysisNotConfiguredError(error.message);
    }

    throw error;
  }

  if (!responseBody) {
    throw new Error("Bedrock response body was empty.");
  }

  let parsed: BedrockResponseShape;

  try {
    parsed = JSON.parse(responseBody) as BedrockResponseShape;
  } catch (error) {
    throw new Error(
      `Bedrock response was not valid JSON. Received: ${responseBody.slice(
        0,
        200
      )}`
    );
  }

  const modelText = extractModelText(parsed);

  if (!modelText) {
    throw new Error("Bedrock response did not include any text output.");
  }

  let structured: { terms?: unknown };

  try {
    structured = JSON.parse(modelText) as { terms?: unknown };
  } catch (error) {
    throw new Error(
      "Bedrock text output was not valid JSON. Ensure the prompt enforces JSON output."
    );
  }

  const terms = normaliseTerms(structured.terms);

  return {
    terms,
    rawModelText: modelText,
  };
}
