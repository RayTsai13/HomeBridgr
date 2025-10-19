import { beforeEach, describe, expect, it, vi } from "vitest";

const { analyzeMock } = vi.hoisted(() => ({
  analyzeMock: vi.fn(),
}));

vi.mock("@/lib/analysis", () => ({
  analyzeCaptionWithBedrock: analyzeMock,
}));

import { POST } from "@/app/api/analysis/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("app/api/analysis/route", () => {
  beforeEach(() => {
    analyzeMock.mockReset();
  });

  it("returns analysis from Bedrock helper", async () => {
    const analysisResult = {
      terms: [
        { term: "field trip", explanation: "Indicates an upcoming excursion." },
      ],
      rawModelText: JSON.stringify({
        terms: [
          {
            term: "field trip",
            explanation: "Indicates an upcoming excursion.",
          },
        ],
      }),
    };

    analyzeMock.mockResolvedValueOnce(analysisResult);

    const response = await POST(
      jsonRequest({ message: "Excited for the field trip tomorrow!" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis).toEqual(analysisResult);
    expect(analyzeMock).toHaveBeenCalledWith(
      "Excited for the field trip tomorrow!"
    );
  });

  it("validates message presence", async () => {
    const response = await POST(jsonRequest({ message: "   " }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("`message`");
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("handles invalid JSON bodies", async () => {
    const request = new Request("http://localhost/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "this is not valid json",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid JSON body");
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("propagates Bedrock failures", async () => {
    analyzeMock.mockRejectedValueOnce(new Error("Bedrock offline"));

    const response = await POST(
      jsonRequest({ message: "Caption for analysis" })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: "Failed to analyze caption",
      details: "Bedrock offline",
    });
  });
});
