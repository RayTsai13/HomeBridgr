import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase_admin";

type PostPayload = {
  caption: unknown;
  image_url?: unknown;
  author_id: unknown;
};

type StudentPostRecord = {
  id: string;
  caption: string | null;
  image_url: string | null;
  author_id: string | null;
  created_at?: string;
  [key: string]: unknown;
};

const POSTS_TABLE = "student_posts";
const PROFILES_TABLE = "profiles";
const COMMUNITIES_TABLE = "communities";

type ProfileLookup = {
  community_id?: string | null;
};

type CommunityRecord = {
  id: string | null;
  member_user_ids: string[] | null;
};

function sanitiseUserType(value: string | null): "student" | "community" {
  const normalised = value?.toLowerCase();
  return normalised === "student" ? "student" : "community";
}

function sanitiseString(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function extractAuthorId(author: Record<string, unknown>): string | null {
  const raw = author["id"];
  return typeof raw === "string" ? raw : null;
}

function extractAuthorUserType(author: Record<string, unknown>): string | null {
  const raw = author["user_type"];

  if (typeof raw !== "string") {
    return null;
  }

  return raw.toLowerCase();
}

function extractAuthorCommunityId(
  author: Record<string, unknown>
): string | null {
  const raw = author["community_id"];
  return typeof raw === "string" ? raw : null;
}

function appendMemberIds(target: Set<string>, members: unknown): void {
  if (!Array.isArray(members)) {
    return;
  }

  for (const value of members) {
    if (typeof value === "string" && value.trim()) {
      target.add(value);
    }
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedUserType = sanitiseUserType(url.searchParams.get("userType"));
  const viewerId = sanitiseString(url.searchParams.get("viewerId"));

  if (!viewerId) {
    return NextResponse.json(
      { error: "`viewerId` query parameter is required." },
      { status: 400 }
    );
  }

  const viewerCommunityIds = new Set<string>();
  const allowedMemberIds = new Set<string>([viewerId]);

  const {
    data: viewerProfile,
    error: profileError,
  } = await supabaseAdmin
    .from<ProfileLookup>(PROFILES_TABLE)
    .select("community_id")
    .eq("id", viewerId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      {
        error: "Failed to retrieve viewer profile",
        details: profileError.message,
      },
      { status: 500 }
    );
  }

  if (viewerProfile?.community_id) {
    viewerCommunityIds.add(viewerProfile.community_id);
  }

  const {
    data: membershipCommunities,
    error: membershipError,
  } = await supabaseAdmin
    .from<CommunityRecord>(COMMUNITIES_TABLE)
    .select("id, member_user_ids")
    .contains("member_user_ids", [viewerId]);

  if (membershipError) {
    return NextResponse.json(
      {
        error: "Failed to retrieve viewer communities",
        details: membershipError.message,
      },
      { status: 500 }
    );
  }

  const membershipIds = new Set<string>();

  for (const community of membershipCommunities ?? []) {
    if (!community) {
      continue;
    }

    if (typeof community.id === "string" && community.id) {
      viewerCommunityIds.add(community.id);
      membershipIds.add(community.id);
    }

    appendMemberIds(allowedMemberIds, community.member_user_ids ?? []);
  }

  const missingCommunityIds = Array.from(viewerCommunityIds).filter(
    (id) => !membershipIds.has(id)
  );

  if (missingCommunityIds.length > 0) {
    const {
      data: directCommunities,
      error: directError,
    } = await supabaseAdmin
      .from<CommunityRecord>(COMMUNITIES_TABLE)
      .select("id, member_user_ids")
      .in("id", missingCommunityIds);

    if (directError) {
      return NextResponse.json(
        {
          error: "Failed to retrieve viewer community members",
          details: directError.message,
        },
        { status: 500 }
      );
    }

    for (const community of directCommunities ?? []) {
      if (!community) {
        continue;
      }

      if (typeof community.id === "string" && community.id) {
        viewerCommunityIds.add(community.id);
      }

      appendMemberIds(allowedMemberIds, community.member_user_ids ?? []);
    }
  }

  const { data: posts, error } = await supabaseAdmin
    .from<StudentPostRecord>(POSTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch posts", details: error.message },
      { status: 500 }
    );
  }

  if (!posts?.length) {
    return NextResponse.json({ posts: [] }, { status: 200 });
  }

  const authorIds = Array.from(
    new Set(
      posts
        .map((post) => post.author_id)
        .filter((authorId): authorId is string => Boolean(authorId))
    )
  );

  let rawAuthors: Record<string, unknown>[] = [];

  if (authorIds.length > 0) {
    const { data, error: authorError } = await supabaseAdmin
      .from(PROFILES_TABLE)
      .select("*")
      .in("id", authorIds);

    if (authorError) {
      return NextResponse.json(
        {
          error: "Failed to fetch post authors",
          details: authorError.message,
        },
        { status: 500 }
      );
    }

    rawAuthors = data ?? [];
  }

  const matchingAuthors = rawAuthors.filter((author) => {
    if (!author || typeof author !== "object") {
      return false;
    }

    const authorId = extractAuthorId(author as Record<string, unknown>);
    const authorCommunityId = extractAuthorCommunityId(
      author as Record<string, unknown>
    );
    const belongsToCommunity =
      (authorCommunityId && viewerCommunityIds.has(authorCommunityId)) ||
      (authorId && allowedMemberIds.has(authorId));

    if (!belongsToCommunity) {
      return false;
    }

    const userType = extractAuthorUserType(author as Record<string, unknown>);

    if (requestedUserType === "student") {
      return userType === "student";
    }

    return userType !== "student";
  });

  const authorById = new Map(
    matchingAuthors
      .map((author) => {
        const id = author && typeof author === "object" ? author["id"] : null;
        return typeof id === "string" ? ([id, author] as const) : null;
      })
      .filter((entry): entry is readonly [string, Record<string, unknown>] =>
        Array.isArray(entry)
      )
  );

  const postsWithAuthors = posts
    .filter((post) => {
      if (typeof post.author_id !== "string") {
        return false;
      }

      const author = authorById.get(post.author_id);

      if (!author) {
        return false;
      }

      const authorCommunityId = extractAuthorCommunityId(author);
      const belongsToCommunity =
        (authorCommunityId && viewerCommunityIds.has(authorCommunityId)) ||
        allowedMemberIds.has(post.author_id);

      if (!belongsToCommunity) {
        return false;
      }

      const userType = extractAuthorUserType(author);

      if (requestedUserType === "student") {
        return userType === "student";
      }

      return userType !== "student";
    })
    .map((post) => ({
      ...post,
      author: post.author_id ? authorById.get(post.author_id) ?? null : null,
    }));

  return NextResponse.json({ posts: postsWithAuthors }, { status: 200 });
}

export async function POST(request: Request) {
  let payload: PostPayload;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: String(error) },
      { status: 400 }
    );
  }

  const { caption, image_url, author_id } = payload;

  if (typeof caption !== "string" || !caption.trim()) {
    return NextResponse.json(
      { error: "`caption` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (typeof author_id !== "string" || !author_id.trim()) {
    return NextResponse.json(
      { error: "`author_id` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (
    image_url !== undefined &&
    image_url !== null &&
    typeof image_url !== "string"
  ) {
    return NextResponse.json(
      { error: "`image_url` must be a string when provided." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from(POSTS_TABLE)
    .insert({
      caption: caption.trim(),
      image_url:
        typeof image_url === "string" ? image_url.trim() || null : null,
      author_id: author_id.trim(),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create post", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ post: data }, { status: 201 });
}
