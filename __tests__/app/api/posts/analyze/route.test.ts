import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

const { analyzeMock, ConfigError } = vi.hoisted(() => {
  class ConfigError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "CaptionAnalysisNotConfiguredError";
    }
  }

  return {
    analyzeMock: vi.fn(),
    ConfigError,
  };
});

vi.mock("@/lib/supabase_admin", () => ({
  supabaseAdmin: {
    from: fromMock,
  },
}));

vi.mock("@/lib/analysis", () => ({
  analyzeCaption: analyzeMock,
  CaptionAnalysisNotConfiguredError: ConfigError,
}));

import { POST } from "@/app/api/posts/analyze/route";

type SupabaseResponse<T> = {
  data: T;
  error: { message: string } | null;
};

function mockSelectQuery<T>(
  response: SupabaseResponse<T>
) {
  const maybeSingle = vi.fn().mockResolvedValue(response);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq, maybeSingle });

  fromMock.mockImplementationOnce(() => ({ select }));

  return { select, eq, maybeSingle };
}

function mockUpdateQuery<T>(
  response: SupabaseResponse<T>,
  capture?: (payload: unknown) => void
) {
  const single = vi.fn().mockResolvedValue(response);
  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi
    .fn()
    .mockImplementation((payload: unknown) => {
      capture?.(payload);
      return { eq };
    });

  fromMock.mockImplementationOnce(() => ({ update }));

  return { update, eq, select, single };
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/posts/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("app/api/posts/analyze/route", () => {
  beforeEach(() => {
    fromMock.mockReset();
    analyzeMock.mockReset();
  });

  it("runs analysis for a post and persists the result", async () => {
    mockSelectQuery({
      data: { id: "post-1", caption: "We totally slay, no cap!" },
      error: null,
    });

    analyzeMock.mockResolvedValue({
      terms: [
        { term: "slay", explanation: "Means to do exceptionally well." },
      ],
      rawModelText: JSON.stringify({ terms: [] }),
    });

    let persistedPayload: Record<string, unknown> | undefined;

    mockUpdateQuery(
      {
        data: {
          id: "post-1",
          analysis_terms: [{ term: "slay", explanation: "Means to do exceptionally well." }],
        },
        error: null,
      },
      (payload) => {
        persistedPayload = payload as Record<string, unknown>;
      }
    );

    const response = await POST(
      jsonRequest({ postId: " post-1 " })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis.terms).toHaveLength(1);
    expect(body.post.id).toBe("post-1");
    expect(persistedPayload).toMatchObject({
      analysis_terms: [
        { term: "slay", explanation: "Means to do exceptionally well." },
      ],
      analysis_raw_text: expect.any(String),
      analysis_generated_at: expect.any(String),
    });
    expect(analyzeMock).toHaveBeenCalledWith(
      "We totally slay, no cap!",
      undefined
    );
  });

  it("returns 404 when the post does not exist", async () => {
    mockSelectQuery({ data: null, error: null });

    const response = await POST(jsonRequest({ postId: "missing" }));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain("missing");
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the post caption is empty", async () => {
    mockSelectQuery({
      data: { id: "post-2", caption: null },
      error: null,
    });

    const response = await POST(jsonRequest({ postId: "post-2" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/caption/i);
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("maps configuration errors to 501", async () => {
    mockSelectQuery({
      data: { id: "post-3", caption: "Needs explainer" },
      error: null,
    });

    analyzeMock.mockRejectedValueOnce(
      new ConfigError("Bedrock missing")
    );

    const response = await POST(jsonRequest({ postId: "post-3" }));
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.error).toMatch(/not configured/i);
  });

  it("propagates persistence failures", async () => {
    mockSelectQuery({
      data: { id: "post-4", caption: "Caption ready" },
      error: null,
    });

    analyzeMock.mockResolvedValue({
      terms: [{ term: "cap", explanation: "Means lying." }],
      rawModelText: "{}",
    });

    mockUpdateQuery({
      data: null,
      error: { message: "update failed" },
    });

    const response = await POST(jsonRequest({ postId: "post-4" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/persist/i);
  });
});
