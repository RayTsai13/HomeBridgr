import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase_admin", () => ({
  supabaseAdmin: {
    from: fromMock,
  },
}));

import { GET, POST } from "@/app/api/posts/route";

type SupabaseResponse<T> = {
  data: T;
  error: { message: string } | null;
};

type SupabaseQueryMock = {
  select?: ReturnType<typeof vi.fn>;
  order?: ReturnType<typeof vi.fn>;
  in?: ReturnType<typeof vi.fn>;
  contains?: ReturnType<typeof vi.fn>;
  insert?: ReturnType<typeof vi.fn>;
  single?: ReturnType<typeof vi.fn>;
  maybeSingle?: ReturnType<typeof vi.fn>;
  eq?: ReturnType<typeof vi.fn>;
};

type CommunityTestRecord = {
  id: string;
  member_user_ids: string[] | null;
};

function mockViewerProfileQuery(
  response: SupabaseResponse<{ community_id: string | null } | null>
): SupabaseQueryMock {
  const maybeSingle = vi.fn().mockResolvedValue(response);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq, maybeSingle });
  fromMock.mockImplementationOnce(() => ({ select }));
  return { select, eq, maybeSingle };
}

function mockCommunitiesContains(
  response: SupabaseResponse<CommunityTestRecord[] | null>
): SupabaseQueryMock {
  const contains = vi.fn().mockResolvedValue(response);
  const select = vi.fn().mockReturnValue({ contains });
  fromMock.mockImplementationOnce(() => ({ select }));
  return { select, contains };
}

function mockCommunitiesByIds(
  response: SupabaseResponse<CommunityTestRecord[] | null>
): SupabaseQueryMock {
  const inFn = vi.fn().mockResolvedValue(response);
  const select = vi.fn().mockReturnValue({ in: inFn });
  fromMock.mockImplementationOnce(() => ({ select }));
  return { select, in: inFn };
}

function mockPostsQuery<T>(
  response: SupabaseResponse<T>
): SupabaseQueryMock {
  const order = vi.fn().mockResolvedValue(response);
  const select = vi.fn().mockReturnValue({ order });
  fromMock.mockImplementationOnce(() => ({ select }));
  return { select, order };
}

function mockAuthorsQuery<T>(
  response: SupabaseResponse<T>
): SupabaseQueryMock {
  const inFn = vi.fn().mockResolvedValue(response);
  const select = vi.fn().mockReturnValue({ in: inFn });
  fromMock.mockImplementationOnce(() => ({ select }));
  return { select, in: inFn };
}

function mockInsertQuery<T>(
  response: SupabaseResponse<T>,
  capture?: (payload: unknown) => void
): SupabaseQueryMock {
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
  return new Request("http://localhost/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(query = "") {
  const suffix =
    !query || query.startsWith("?") ? query : `?${query}`;

  return new Request(`http://localhost/api/posts${suffix}`, {
    method: "GET",
  });
}

describe("app/api/posts/route", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  describe("GET", () => {
    it("returns posts with author details", async () => {
      const posts = [
        {
          id: "1",
          caption: "Hello",
          author_id: "author-1",
          image_url: null,
          created_at: "2024-01-01T00:00:00.000Z",
        },
      ];

      const authors = [
        {
          id: "author-1",
          display_name: "Author One",
          user_type: "community",
          community_id: "community-1",
        },
      ];

      mockViewerProfileQuery({
        data: { community_id: "community-1" },
        error: null,
      });
      mockCommunitiesContains({
        data: [
          {
            id: "community-1",
            member_user_ids: ["viewer-1", "author-1"],
          },
        ],
        error: null,
      });
      mockPostsQuery({ data: posts, error: null });
      mockAuthorsQuery({ data: authors, error: null });

      const response = await GET(getRequest("?viewerId=viewer-1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.posts).toHaveLength(1);
      expect(body.posts[0]).toMatchObject({
        id: "1",
        author: authors[0],
      });
    });

    it("returns empty list when no posts found", async () => {
      mockViewerProfileQuery({
        data: { community_id: "community-1" },
        error: null,
      });
      mockCommunitiesContains({
        data: [
          { id: "community-1", member_user_ids: ["viewer-1"] },
        ],
        error: null,
      });
      mockPostsQuery({ data: [], error: null });

      const response = await GET(getRequest("?viewerId=viewer-1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.posts).toEqual([]);
    });

    it("propagates Supabase failures", async () => {
      mockViewerProfileQuery({
        data: { community_id: null },
        error: null,
      });
      mockCommunitiesContains({
        data: [],
        error: null,
      });
      mockPostsQuery({ data: null, error: { message: "database down" } });

      const response = await GET(getRequest("?viewerId=viewer-1"));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toMatchObject({
        error: "Failed to fetch posts",
        details: "database down",
      });
    });

    it("filters out posts from non-student authors when requesting student feed", async () => {
      const posts = [
        {
          id: "1",
          caption: "Student update",
          author_id: "student-1",
          image_url: null,
          created_at: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          caption: "Community update",
          author_id: "community-1",
          image_url: null,
          created_at: "2024-01-02T00:00:00.000Z",
        },
      ];

      const authors = [
        {
          id: "student-1",
          display_name: "Student One",
          user_type: "student",
          community_id: "community-1",
        },
        {
          id: "community-1",
          display_name: "Community One",
          user_type: "community",
          community_id: "community-2",
        },
      ];

      mockViewerProfileQuery({
        data: { community_id: "community-1" },
        error: null,
      });
      mockCommunitiesContains({
        data: [
          {
            id: "community-1",
            member_user_ids: ["viewer-1", "student-1"],
          },
        ],
        error: null,
      });
      mockPostsQuery({ data: posts, error: null });
      mockAuthorsQuery({ data: authors, error: null });

      const response = await GET(
        getRequest("?userType=student&viewerId=viewer-1")
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.posts).toHaveLength(1);
      expect(body.posts[0]).toMatchObject({
        id: "1",
        author: expect.objectContaining({ user_type: "student" }),
      });
    });

    it("defaults to community posts when userType is not provided", async () => {
      const posts = [
        {
          id: "1",
          caption: "Student update",
          author_id: "student-1",
          image_url: null,
          created_at: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          caption: "Community update",
          author_id: "community-1",
          image_url: null,
          created_at: "2024-01-02T00:00:00.000Z",
        },
      ];

      const authors = [
        {
          id: "student-1",
          display_name: "Student One",
          user_type: "student",
          community_id: "community-1",
        },
        {
          id: "community-1",
          display_name: "Community One",
          user_type: "community",
          community_id: "community-2",
        },
      ];

      mockViewerProfileQuery({
        data: { community_id: "community-2" },
        error: null,
      });
      mockCommunitiesContains({
        data: [
          {
            id: "community-2",
            member_user_ids: ["viewer-1", "community-1"],
          },
        ],
        error: null,
      });
      mockPostsQuery({ data: posts, error: null });
      mockAuthorsQuery({ data: authors, error: null });

      const response = await GET(getRequest("?viewerId=viewer-1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.posts).toHaveLength(1);
      expect(body.posts[0]).toMatchObject({
        id: "2",
        author: expect.objectContaining({ user_type: "community" }),
      });
    });

    it("excludes posts when authors are outside the viewer community", async () => {
      const posts = [
        {
          id: "1",
          caption: "Community update elsewhere",
          author_id: "community-2",
          image_url: null,
          created_at: "2024-01-01T00:00:00.000Z",
        },
      ];

      const authors = [
        {
          id: "community-2",
          display_name: "Other Community",
          user_type: "community",
          community_id: "community-99",
        },
      ];

      mockViewerProfileQuery({
        data: { community_id: "community-1" },
        error: null,
      });
      mockCommunitiesContains({
        data: [],
        error: null,
      });
      mockCommunitiesByIds({
        data: [
          {
            id: "community-1",
            member_user_ids: ["viewer-1"],
          },
        ],
        error: null,
      });
      mockPostsQuery({ data: posts, error: null });
      mockAuthorsQuery({ data: authors, error: null });

      const response = await GET(getRequest("?viewerId=viewer-1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.posts).toEqual([]);
    });

    it("returns 400 when viewerId is missing", async () => {
      const response = await GET(getRequest());
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("`viewerId`");
    });
  });

  describe("POST", () => {
    it("creates a post and returns the inserted row", async () => {
      const insertedPayloads: unknown[] = [];
      const createdPost = {
        id: "post-1",
        caption: "Hello world",
        image_url: "https://example.com/image.png",
        author_id: "author-1",
      };

      mockInsertQuery(
        { data: createdPost, error: null },
        (payload) => insertedPayloads.push(payload)
      );

      const response = await POST(
        jsonRequest({
          caption: "  Hello world ",
          image_url: " https://example.com/image.png ",
          author_id: " author-1 ",
        })
      );

      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.post).toEqual(createdPost);
      expect(insertedPayloads[0]).toEqual({
        caption: "Hello world",
        image_url: "https://example.com/image.png",
        author_id: "author-1",
      });
    });

    it("validates required fields", async () => {
      const response = await POST(
        jsonRequest({
          caption: " ",
          author_id: "some-author",
        })
      );

      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("`caption`");
      expect(fromMock).not.toHaveBeenCalled();
    });

    it("handles Supabase insertion errors", async () => {
      mockInsertQuery({ data: null, error: { message: "insert failed" } });

      const response = await POST(
        jsonRequest({
          caption: "Valid caption",
          author_id: "author-2",
        })
      );

      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toMatchObject({
        error: "Failed to create post",
        details: "insert failed",
      });
    });

    it("returns 400 for invalid JSON payloads", async () => {
      const response = await POST(
        new Request("http://localhost/api/posts", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: "not-json",
        })
      );

      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid JSON body");
    });
  });
    });
