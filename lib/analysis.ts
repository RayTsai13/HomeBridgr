import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

export type TermExplanation = {
  term: string;
  explanation: string;
};

export type CaptionAnalysis = {
  terms: TermExplanation[];
  rawModelText: string;
};

type BedrockOptions = {
  modelId?: string;
  maxTokens?: number;
};

type BedrockTextContent = {
  type?: string;
  text?: string;
};

type BedrockResponse = {
  outputText?: string;
  completion?: string;
  results?: Array<{ text?: string }>;
  content?: BedrockTextContent[];
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

let cachedClient: BedrockRuntimeClient | null = null;

function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const region =
    process.env.AWS_BEDROCK_REGION ||
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION;

  if (!region) {
    throw new Error(
      "Missing AWS region configuration. Set AWS_BEDROCK_REGION or AWS_REGION."
    );
  }

  cachedClient = new BedrockRuntimeClient({ region });
  return cachedClient;
}

function buildPrompt(caption: string) {
  return [
    "You are helping teachers analyze student social media captions.",
    "Extract 3 to 7 key terms or phrases from the caption and explain their significance for a teacher.",
    "Respond with strict JSON matching this schema:",
    '{ "terms": [ { "term": string, "explanation": string } ] }',
    "The explanations should be one or two sentences long, informative, and reference the original caption when relevant.",
    "Caption:",
    caption,
  ].join("\n\n");
}

function extractContentText(response: BedrockResponse): string {
  if (response.content?.length) {
    const item = response.content.find((entry) => entry.text);
    if (item?.text) {
      return item.text;
    }
  }

  if (response.outputText) {
    return response.outputText;
  }

  if (response.completion) {
    return response.completion;
  }

  if (response.results?.length) {
    const item = response.results.find((entry) => entry?.text);
    if (item?.text) {
      return item.text;
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
      "Bedrock returned an empty or invalid `terms` array. Try adjusting the caption or prompt."
    );
  }

  return terms;
}

export async function analyzeCaptionWithBedrock(
  caption: string,
  options: BedrockOptions = {}
): Promise<CaptionAnalysis> {
  const modelId = options.modelId || process.env.BEDROCK_MODEL_ID;

  if (!modelId) {
    throw new Error(
      "Missing Bedrock model identifier. Set BEDROCK_MODEL_ID or provide `modelId`."
    );
  }

  const client = getClient();
  const prompt = buildPrompt(caption);

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: options.maxTokens ?? 400,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  };

  const command = new InvokeModelCommand({
    modelId,
    body: textEncoder.encode(JSON.stringify(payload)),
    contentType: "application/json",
    accept: "application/json",
  });

  const response = await client.send(command);
  const body = textDecoder.decode(response.body);

  let parsedResponse: BedrockResponse;

  try {
    parsedResponse = JSON.parse(body) as BedrockResponse;
  } catch (error) {
    throw new Error(
      `Bedrock response is not valid JSON. Received: ${body.slice(0, 200)}`
    );
  }

  const modelText = extractContentText(parsedResponse);

  if (!modelText) {
    throw new Error("Bedrock response did not include any text output.");
  }

  let structuredOutput: { terms?: unknown };

  try {
    structuredOutput = JSON.parse(modelText);
  } catch (error) {
    throw new Error(
      "Bedrock response is not valid JSON. Ensure the model prompt enforces JSON output."
    );
  }

  const terms = normaliseTerms(structuredOutput.terms);

  return {
    terms,
    rawModelText: modelText,
  };
}
