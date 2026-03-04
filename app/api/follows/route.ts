import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase_admin"

export async function POST(request: Request) {
  let followerId: string
  let followingId: string

  try {
    const body = await request.json()
    if (typeof body.followerId !== "string" || !body.followerId.trim()) {
      return NextResponse.json({ error: "`followerId` is required." }, { status: 400 })
    }
    if (typeof body.followingId !== "string" || !body.followingId.trim()) {
      return NextResponse.json({ error: "`followingId` is required." }, { status: 400 })
    }
    followerId = body.followerId.trim()
    followingId = body.followingId.trim()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (followerId === followingId) {
    return NextResponse.json({ error: "Cannot follow yourself." }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("follows")
    .upsert({ follower_id: followerId, following_id: followingId }, { onConflict: "follower_id,following_id" })

  if (error) {
    return NextResponse.json(
      { error: "Failed to follow user.", details: error.message },
      { status: 500 }
    )
  }

  // Notify the followed user
  await supabaseAdmin.from("notifications").insert({
    recipient_id: followingId,
    actor_id: followerId,
    type: "follow",
    post_id: null,
  })

  return NextResponse.json({ following: true }, { status: 200 })
}

export async function DELETE(request: Request) {
  let followerId: string
  let followingId: string

  try {
    const body = await request.json()
    if (typeof body.followerId !== "string" || !body.followerId.trim()) {
      return NextResponse.json({ error: "`followerId` is required." }, { status: 400 })
    }
    if (typeof body.followingId !== "string" || !body.followingId.trim()) {
      return NextResponse.json({ error: "`followingId` is required." }, { status: 400 })
    }
    followerId = body.followerId.trim()
    followingId = body.followingId.trim()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId)

  if (error) {
    return NextResponse.json(
      { error: "Failed to unfollow user.", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ following: false }, { status: 200 })
}
