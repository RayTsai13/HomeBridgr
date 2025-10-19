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

import { POST } from "@/app/api/community/post/analyze/route";

type SupabaseResponse<T> = {
  data: T;
  error: { message: string } | null;
};

function mockSelectQuery<T>(response: SupabaseResponse<T>) {
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
  return new Request("http://localhost/api/community/post/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("app/api/community/post/analyze/route", () => {
  beforeEach(() => {
    fromMock.mockReset();
    analyzeMock.mockReset();
  });

  it("runs analysis and persists for community text post", async () => {
    mockSelectQuery({
      data: { id: "cpost-1", text_content: "Campus potluck this Friday!" },
      error: null,
    });

    analyzeMock.mockResolvedValue({
      terms: [{ term: "potluck", explanation: "A shared meal event." }],
      rawModelText: JSON.stringify({ terms: [] }),
    });

    let persisted: Record<string, unknown> | undefined;
    mockUpdateQuery(
      {
        data: {
          id: "cpost-1",
          analysis_terms: [{ term: "potluck", explanation: "A shared meal event." }],
        },
        error: null,
      },
      (payload) => (persisted = payload as Record<string, unknown>)
    );

    const response = await POST(jsonRequest({ postId: " cpost-1 " }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis.terms).toHaveLength(1);
    expect(body.post.id).toBe("cpost-1");
    expect(persisted).toMatchObject({
      analysis_terms: expect.any(Array),
      analysis_raw_text: expect.any(String),
      analysis_generated_at: expect.any(String),
    });
  });

  it("returns 404 when community post missing", async () => {
    mockSelectQuery({ data: null, error: null });
    const response = await POST(jsonRequest({ postId: "missing" }));
    expect(response.status).toBe(404);
  });

  it("returns 400 when text_content is empty", async () => {
    mockSelectQuery({ data: { id: "p2", text_content: null }, error: null });
    const response = await POST(jsonRequest({ postId: "p2" }));
    expect(response.status).toBe(400);
  });

  it("maps config errors to 501", async () => {
    mockSelectQuery({ data: { id: "p3", text_content: "Hi" }, error: null });
    analyzeMock.mockRejectedValueOnce(new ConfigError("missing bedrock"));
    const response = await POST(jsonRequest({ postId: "p3" }));
    const body = await response.json();
    expect(response.status).toBe(501);
    expect(body.error).toMatch(/not configured/i);
  });

  it("propagates update failures", async () => {
    mockSelectQuery({ data: { id: "p4", text_content: "ok" }, error: null });
    analyzeMock.mockResolvedValue({ terms: [], rawModelText: "{}" });
    mockUpdateQuery({ data: null, error: { message: "update failed" } });
    const response = await POST(jsonRequest({ postId: "p4" }));
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toMatch(/persist/i);
  });
});

