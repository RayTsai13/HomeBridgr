import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase_admin";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id;

  const { data, error } = await supabaseAdmin
    .from("post_comments")
    .select(
      "id, content, created_at, author_id, profiles(display_name, avatar_url)"
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id;

  let body: { author_id: unknown; content: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { author_id, content } = body;

  if (typeof author_id !== "string" || !author_id.trim()) {
    return NextResponse.json(
      { error: "`author_id` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json(
      { error: "`content` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("post_comments")
    .insert({
      post_id: postId,
      author_id: author_id.trim(),
      content: content.trim(),
    })
    .select(
      "id, content, created_at, author_id, profiles(display_name, avatar_url)"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}
