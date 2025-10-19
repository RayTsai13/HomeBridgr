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

import { GET, POST } from "@/app/api/collections/route";

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

function mockSelect<T>(response: SupabaseResponse<T>) {
  const order = vi.fn().mockResolvedValue(response);
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });

  fromMock.mockImplementationOnce(() => ({ select }));

  return { select, eq, order };
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/collections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(query: string) {
  return new Request(`http://localhost/api/collections${query}`, {
    method: "GET",
  });
}

describe("app/api/collections/route", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("creates a collection with optional metadata", async () => {
    let inserted: Record<string, unknown> | undefined;

    mockInsert(
      {
        data: { id: "collection-1", name: "Family Memories" },
        error: null,
      },
      (payload) => {
        inserted = payload as Record<string, unknown>;
      }
    );

    const response = await POST(
      jsonRequest({
        name: "  Family Memories ",
        userId: " user-99 ",
        description: "  Annual postcards ",
        visibility: " private ",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.collection.id).toBe("collection-1");
    expect(inserted).toMatchObject({
      name: "Family Memories",
      created_by: "user-99",
      description: "Annual postcards",
      visibility: "private",
    });
  });

  it("validates required fields", async () => {
    const response = await POST(
      jsonRequest({
        userId: "user-1",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/`name`/i);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns 500 when Supabase insert fails", async () => {
    mockInsert({
      data: null,
      error: { message: "insert failed" },
    });

    const response = await POST(
      jsonRequest({
        name: "Friends Trip",
        userId: "user-2",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/Failed to create collection/i);
  });

  it("retrieves collections for a user", async () => {
    mockSelect({
      data: [
        {
          id: "collection-1",
          name: "Family Memories",
          created_by: "user-1",
        },
      ],
      error: null,
    });

    const response = await GET(getRequest("?userId=user-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.collections).toHaveLength(1);
    expect(body.collections[0]).toMatchObject({
      id: "collection-1",
      name: "Family Memories",
    });
  });

  it("validates userId is provided for GET", async () => {
    const response = await GET(getRequest(""));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/`userId`/i);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("handles Supabase errors when fetching collections", async () => {
    mockSelect({
      data: null,
      error: { message: "select failed" },
    });

    const response = await GET(getRequest("?userId=user-1"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/Failed to fetch collections/i);
  });
});
