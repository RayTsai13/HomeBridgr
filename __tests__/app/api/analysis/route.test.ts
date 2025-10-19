import { beforeEach, describe, expect, it, vi } from "vitest";

const { analyzeMock, NotConfiguredError } = vi.hoisted(() => {
  class NotConfiguredError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "CaptionAnalysisNotConfiguredError";
    }
  }

  return {
    analyzeMock: vi.fn(),
    NotConfiguredError,
  };
});

vi.mock("@/lib/analysis", () => ({
  analyzeCaption: analyzeMock,
  CaptionAnalysisNotConfiguredError: NotConfiguredError,
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

  it("returns analysis from helper", async () => {
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

  it("returns 501 when caption analysis is not configured", async () => {
    analyzeMock.mockRejectedValueOnce(
      new NotConfiguredError("Caption analysis missing.")
    );

    const response = await POST(
      jsonRequest({ message: "Caption for analysis" })
    );
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body).toMatchObject({
      error: "Caption analysis is not yet configured.",
      details: "Caption analysis missing.",
    });
  });

  it("propagates unexpected failures", async () => {
    analyzeMock.mockRejectedValueOnce(new Error("Upstream service offline"));

    const response = await POST(
      jsonRequest({ message: "Caption for analysis" })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: "Failed to analyze caption",
      details: "Upstream service offline",
    });
  });
});
