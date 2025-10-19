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

import { POST } from "@/app/api/community/create/route";

type SupabaseResponse<T> = {
  data: T;
  error: { message: string } | null;
};

function mockCommunityInsert<T>(
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

function mockMembershipInsert<T>(
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

function mockCommunityDelete() {
  const eq = vi.fn().mockResolvedValue({ data: null, error: null });
  const deleteFn = vi.fn().mockReturnValue({ eq });
  fromMock.mockImplementationOnce(() => ({ delete: deleteFn }));
  return { delete: deleteFn, eq };
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/community/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("app/api/community/create/route", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("creates a community and owner membership", async () => {
    let communityPayload: Record<string, unknown> | undefined;
    let membershipPayload: Record<string, unknown> | undefined;

    mockCommunityInsert(
      {
        data: { id: "community-1", name: "Test Squad" },
        error: null,
      },
      (payload) => {
        communityPayload = payload as Record<string, unknown>;
      }
    );

    mockMembershipInsert(
      {
        data: { id: "membership-1" },
        error: null,
      },
      (payload) => {
        membershipPayload = payload as Record<string, unknown>;
      }
    );

    const response = await POST(
      jsonRequest({
        name: "  Test Squad ",
        description: "  Private group ",
        creatorId: " user-1 ",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.community.id).toBe("community-1");
    expect(body.membership.id).toBe("membership-1");
    expect(communityPayload).toMatchObject({
      name: "Test Squad",
      created_by: "user-1",
      description: "Private group",
    });
    expect(membershipPayload).toMatchObject({
      community_id: "community-1",
      member_id: "user-1",
      role: "owner",
    });
  });

  it("validates required fields", async () => {
    const response = await POST(jsonRequest({ creatorId: "user-1" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/`name`/i);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns 500 when community creation fails", async () => {
    mockCommunityInsert({
      data: null,
      error: { message: "insert failed" },
    });

    const response = await POST(
      jsonRequest({ name: "New Group", creatorId: "user-1" })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/create community/i);
  });

  it("cleans up created community if membership insertion fails", async () => {
    mockCommunityInsert({
      data: { id: "community-2" },
      error: null,
    });

    mockMembershipInsert({
      data: null,
      error: { message: "membership failed" },
    });

    const { delete: deleteFn, eq } = mockCommunityDelete();

    const response = await POST(
      jsonRequest({ name: "Another Group", creatorId: "user-2" })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/community owner/i);
    expect(deleteFn).toHaveBeenCalledTimes(1);
    expect(eq).toHaveBeenCalledWith("id", "community-2");
  });
});
