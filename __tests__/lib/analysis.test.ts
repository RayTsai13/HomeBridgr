import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { invokeMock, BedrockConfigError } = vi.hoisted(() => {
  class BedrockConfigError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "BedrockConfigurationError";
    }
  }

  return {
    invokeMock: vi.fn(),
    BedrockConfigError,
  };
});

vi.mock("@/lib/bedrock", () => ({
  invokeBedrockModel: invokeMock,
  BedrockConfigurationError: BedrockConfigError,
}));

const textEncoder = new TextEncoder();
const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  invokeMock.mockReset();
  process.env = { ...originalEnv, BEDROCK_MODEL_ID: "anthropic.test-model" };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("lib/analysis", () => {
  it("parses successful Bedrock responses into term explanations", async () => {
    const responseBody = {
      content: [
        {
          text: JSON.stringify({
            terms: [
              {
                term: "slay",
                explanation: "Modern slang meaning to do exceptionally well.",
              },
              {
                term: "cap",
                explanation: "Slang for lying; might confuse adults.",
              },
            ],
          }),
        },
      ],
    };

    invokeMock.mockResolvedValueOnce({
      body: textEncoder.encode(JSON.stringify(responseBody)),
    });

    const { analyzeCaption } = await import("@/lib/analysis");
    const result = await analyzeCaption("We totally slay, no cap!");

    expect(result.terms).toEqual([
      {
        term: "slay",
        explanation: "Modern slang meaning to do exceptionally well.",
      },
      {
        term: "cap",
        explanation: "Slang for lying; might confuse adults.",
      },
    ]);
    expect(result.rawModelText).toContain('"terms"');

    expect(invokeMock).toHaveBeenCalledTimes(1);
    const callArgs = invokeMock.mock.calls[0]?.[0];
    expect(callArgs).toMatchObject({
      modelId: "anthropic.test-model",
      contentType: "application/json",
      accept: "application/json",
    });

    const payload = JSON.parse(callArgs.body as string);
    expect(payload.messages[0].content[0].text).toContain(
      "We totally slay, no cap!"
    );
  });

  it("throws a configuration error when BEDROCK_MODEL_ID is missing", async () => {
    delete process.env.BEDROCK_MODEL_ID;
    const { analyzeCaption, CaptionAnalysisNotConfiguredError } = await import(
      "@/lib/analysis"
    );

    await expect(analyzeCaption("Caption needing help")).rejects.toThrow(
      CaptionAnalysisNotConfiguredError
    );
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("maps Bedrock configuration failures to CaptionAnalysisNotConfiguredError", async () => {
    invokeMock.mockRejectedValueOnce(
      new BedrockConfigError("Region not set correctly")
    );

    const { analyzeCaption, CaptionAnalysisNotConfiguredError } = await import(
      "@/lib/analysis"
    );

    await expect(analyzeCaption("Caption needing help")).rejects.toThrow(
      CaptionAnalysisNotConfiguredError
    );
  });

  it("throws when Bedrock returns invalid JSON text", async () => {
    invokeMock.mockResolvedValueOnce({
      body: textEncoder.encode(
        JSON.stringify({
          content: [{ text: "not-json" }],
        })
      ),
    });

    const { analyzeCaption } = await import("@/lib/analysis");

    await expect(analyzeCaption("Caption needing help")).rejects.toThrow(
      /not valid JSON/i
    );
  });
});
