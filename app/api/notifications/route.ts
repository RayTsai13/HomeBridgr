import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase_admin"
import type { Notification } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")?.trim()

  if (!userId) {
    return NextResponse.json({ error: "`userId` is required." }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("id, type, actor_id, post_id, read, created_at")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications.", details: error.message },
      { status: 500 }
    )
  }

  const rows = data ?? []

  // Fetch actor profiles
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean)))
  let actorMap = new Map<string, { display_name: string | null; avatar_url: string | null }>()

  if (actorIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", actorIds)
    for (const p of profiles ?? []) {
      actorMap.set(p.id as string, {
        display_name: p.display_name as string | null,
        avatar_url: p.avatar_url as string | null,
      })
    }
  }

  // Fetch post captions
  const postIds = Array.from(new Set(rows.map((r) => r.post_id).filter(Boolean))) as string[]
  let postMap = new Map<string, string | null>()

  if (postIds.length > 0) {
    const { data: posts } = await supabaseAdmin
      .from("student_posts")
      .select("id, caption")
      .in("id", postIds)
    for (const p of posts ?? []) {
      postMap.set(p.id as string, p.caption as string | null)
    }
  }

  const notifications: Notification[] = rows.map((r) => {
    const actor = actorMap.get(r.actor_id) ?? { display_name: null, avatar_url: null }
    return {
      id: r.id as string,
      type: r.type as "like" | "follow" | "comment",
      actorId: r.actor_id as string,
      actorName: actor.display_name ?? "Someone",
      actorAvatar: actor.avatar_url,
      postId: (r.post_id as string | null) ?? null,
      postCaption: r.post_id ? (postMap.get(r.post_id as string) ?? null) : null,
      read: r.read as boolean,
      createdAt: new Date(r.created_at as string),
    }
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return NextResponse.json({ notifications, unreadCount }, { status: 200 })
}

export async function PATCH(request: Request) {
  let userId: string
  let notificationId: string | undefined

  try {
    const body = await request.json()
    if (typeof body.userId !== "string" || !body.userId.trim()) {
      return NextResponse.json({ error: "`userId` is required." }, { status: 400 })
    }
    userId = body.userId.trim()
    notificationId = typeof body.notificationId === "string" ? body.notificationId.trim() : undefined
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  let query = supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", userId)

  if (notificationId) {
    query = query.eq("id", notificationId)
  }

  const { error } = await query

  if (error) {
    return NextResponse.json(
      { error: "Failed to mark notifications as read.", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
