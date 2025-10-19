import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase_admin", () => ({
  supabaseAdmin: {
    from: fromMock,
  },
}));

import { GET, PATCH } from "@/app/api/profiles/route";

type SupabaseResponse<T> = {
  data: T;
  error: { message: string } | null;
};

type SupabaseQueryMock = {
  upsert?: ReturnType<typeof vi.fn>;
  select?: ReturnType<typeof vi.fn>;
  maybeSingle?: ReturnType<typeof vi.fn>;
  eq?: ReturnType<typeof vi.fn>;
};

function mockSelect<T>(response: SupabaseResponse<T>): SupabaseQueryMock {
  const maybeSingle = vi.fn().mockResolvedValue(response);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  fromMock.mockImplementationOnce(() => ({ select }));
  return { select, eq, maybeSingle };
}

function mockUpsert<T>(
  response: SupabaseResponse<T>,
  capture?: (payload: unknown) => void
): SupabaseQueryMock {
  const maybeSingle = vi.fn().mockResolvedValue(response);
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const upsert = vi.fn().mockImplementation((payload: unknown) => {
    capture?.(payload);
    return { select };
  });

  fromMock.mockImplementationOnce(() => ({ upsert }));
  return { upsert, select, maybeSingle };
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/profiles", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function requestWithQuery(query: string) {
  return new Request(`http://localhost/api/profiles${query}`, {
    method: "GET",
  });
}

describe("app/api/profiles/route", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("retrieves an existing user type", async () => {
    const responsePayload = {
      id: "user-1",
      user_type: "community",
    };

    mockSelect({
      data: responsePayload,
      error: null,
    });

    const response = await GET(requestWithQuery("?userId=user-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile).toEqual(responsePayload);
  });

  it("returns null when profile is missing", async () => {
    mockSelect({
      data: null,
      error: null,
    });

    const response = await GET(requestWithQuery("?userId=user-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile).toBeNull();
  });

  it("propagates errors when fetch fails", async () => {
    mockSelect({
      data: null,
      error: { message: "select failed" },
    });

    const response = await GET(requestWithQuery("?userId=user-1"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: "Failed to retrieve profile",
      details: "select failed",
    });
  });

  it("persists the user type with trimmed, normalised values", async () => {
    const capturedPayloads: unknown[] = [];
    const profile = {
      id: "user-1",
      user_type: "student",
    };

    mockUpsert(
      { data: profile, error: null },
      (payload) => capturedPayloads.push(payload)
    );

    const response = await PATCH(
      jsonRequest({
        userId: " user-1 ",
        userType: " Student ",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile).toEqual(profile);
    expect(capturedPayloads[0]).toEqual({
      id: "user-1",
      user_type: "student",
    });
  });

  it("rejects unsupported user types", async () => {
    const response = await PATCH(
      jsonRequest({
        userId: "user-1",
        userType: "alumni",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("`userType`");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propagates Supabase failures", async () => {
    mockUpsert({
      data: null,
      error: { message: "insert failed" },
    });

    const response = await PATCH(
      jsonRequest({
        userId: "user-2",
        userType: "community",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: "Failed to persist user type",
      details: "insert failed",
    });
  });
});
