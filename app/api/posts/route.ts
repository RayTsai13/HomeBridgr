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

export async function GET() {
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

  let authors: Record<string, unknown>[] = [];

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

    authors = data ?? [];
  }

  const authorById = new Map(
    authors
      .map((author) => {
        const id = author && typeof author === "object" ? author["id"] : null;
        return typeof id === "string" ? ([id, author] as const) : null;
      })
      .filter((entry): entry is readonly [string, Record<string, unknown>] =>
        Array.isArray(entry)
      )
  );

  const postsWithAuthors = posts.map((post) => ({
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
