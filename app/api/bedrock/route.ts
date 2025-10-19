import { NextRequest, NextResponse } from "next/server";

import {
  BedrockConfigurationError,
  invokeBedrockModel,
} from "@/lib/bedrock";

const textDecoder = new TextDecoder();

type BedrockPromptPayload = {
  prompt?: unknown;
  modelId?: unknown;
  maxTokens?: unknown;
  temperature?: unknown;
  topP?: unknown;
};

function resolveModelId(modelId: unknown): string | null {
  if (typeof modelId === "string" && modelId.trim()) {
    return modelId.trim();
  }

  return process.env.BEDROCK_MODEL_ID ?? null;
}

export async function POST(request: NextRequest) {
  let payload: BedrockPromptPayload;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: String(error) },
      { status: 400 }
    );
  }

  const { prompt, modelId, maxTokens, temperature, topP } = payload;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json(
      { error: "`prompt` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const resolvedModelId = resolveModelId(modelId);

  if (!resolvedModelId) {
    return NextResponse.json(
      {
        error:
          "No Bedrock model configured. Provide `modelId` in the request or set BEDROCK_MODEL_ID.",
      },
      { status: 400 }
    );
  }

  const maxTokensNumber =
    typeof maxTokens === "number" && maxTokens > 0 ? maxTokens : 400;
  const safeTemperature =
    typeof temperature === "number" && temperature >= 0
      ? Math.min(1, temperature)
      : 0;
  const safeTopP =
    typeof topP === "number" && topP > 0 ? Math.min(1, topP) : 0.999;

  const anthropicPayload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokensNumber,
    temperature: safeTemperature,
    top_p: safeTopP,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt.trim(),
          },
        ],
      },
    ],
  };

  try {
    const response = await invokeBedrockModel({
      modelId: resolvedModelId,
      body: JSON.stringify(anthropicPayload),
      contentType: "application/json",
      accept: "application/json",
    });

    const rawBody = response.body ? textDecoder.decode(response.body) : "";

    return NextResponse.json(
      {
        success: true,
        modelId: resolvedModelId,
        body: rawBody,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof BedrockConfigurationError) {
      return NextResponse.json(
        {
          error: "Bedrock configuration error",
          details: error.message,
        },
        { status: 501 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to invoke Bedrock",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
