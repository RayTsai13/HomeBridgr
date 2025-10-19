import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase_admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const delegate = fromMock(table);
      return delegate ?? {};
    },
  },
}));

import { POST } from "@/app/api/community/post/route";

type SupabaseResponse<T> = {
  data: T;
  error: { message: string } | null;
};

function mockInsert<T>(
  response: SupabaseResponse<T>,
  capture?: (payload: unknown) => void
) {
  const single = vi.fn().mockResolvedValue(response);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi
    .fn()
    .mockImplementation((payload: unknown) => {
      capture?.(payload);
      return { select };
    });

  fromMock.mockImplementationOnce(() => ({ insert }));

  return { insert, select, single };
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/community/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("app/api/community/post/route", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("creates a community post with inferred content type", async () => {
    let insertPayload: Record<string, unknown> | undefined;

    mockInsert(
      {
        data: {
          id: "post-123",
          community_id: "community-1",
        },
        error: null,
      },
      (payload) => {
        insertPayload = payload as Record<string, unknown>;
      }
    );

    const response = await POST(
      jsonRequest({
        communityId: " community-1 ",
        authorId: " user-7 ",
        text: "  Hello neighbors! ",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.post.id).toBe("post-123");
    expect(insertPayload).toMatchObject({
      community_id: "community-1",
      author_id: "user-7",
      text_content: "Hello neighbors!",
      content_type: "text",
    });
  });

  it("validates required fields", async () => {
    const response = await POST(
      jsonRequest({
        authorId: "user-1",
        text: "Missing community id",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/`communityId`/i);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("requires at least one content property", async () => {
    const response = await POST(
      jsonRequest({
        communityId: "community-2",
        authorId: "user-2",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/Provide at least one/i);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propagates Supabase errors", async () => {
    mockInsert({
      data: null,
      error: { message: "insert failed" },
    });

    const response = await POST(
      jsonRequest({
        communityId: "community-3",
        authorId: "user-3",
        linkUrl: "https://example.com",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/Failed to create community post/i);
  });
});
