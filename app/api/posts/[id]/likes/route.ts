import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase_admin"

async function getLikesCount(postId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
  return count ?? 0
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id
  let userId: string

  try {
    const body = await request.json()
    if (typeof body.userId !== "string" || !body.userId.trim()) {
      return NextResponse.json({ error: "`userId` is required." }, { status: 400 })
    }
    userId = body.userId.trim()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { error: upsertError } = await supabaseAdmin
    .from("post_likes")
    .upsert({ post_id: postId, user_id: userId }, { onConflict: "post_id,user_id" })

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to like post.", details: upsertError.message },
      { status: 500 }
    )
  }

  // Insert notification for post author (skip if liker === author)
  const { data: postData } = await supabaseAdmin
    .from("student_posts")
    .select("author_id, caption")
    .eq("id", postId)
    .maybeSingle()

  if (postData?.author_id && postData.author_id !== userId) {
    await supabaseAdmin.from("notifications").insert({
      recipient_id: postData.author_id,
      actor_id: userId,
      type: "like",
      post_id: postId,
    })
  }

  const likesCount = await getLikesCount(postId)
  return NextResponse.json({ liked: true, likesCount }, { status: 200 })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id
  let userId: string

  try {
    const body = await request.json()
    if (typeof body.userId !== "string" || !body.userId.trim()) {
      return NextResponse.json({ error: "`userId` is required." }, { status: 400 })
    }
    userId = body.userId.trim()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { error: deleteError } = await supabaseAdmin
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId)

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to unlike post.", details: deleteError.message },
      { status: 500 }
    )
  }

  const likesCount = await getLikesCount(postId)
  return NextResponse.json({ liked: false, likesCount }, { status: 200 })
}
