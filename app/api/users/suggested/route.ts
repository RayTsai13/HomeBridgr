import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase_admin"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const viewerId = searchParams.get("viewerId")?.trim() || null
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50)

  if (!viewerId) {
    // Guest: return up to 5 random profiles
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, bio")
      .limit(5)

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch suggested users.", details: error.message },
        { status: 500 }
      )
    }

    const users = (data ?? []).map((p) => ({
      id: p.id,
      displayName: (p.display_name as string | null) ?? "Anonymous",
      avatarUrl: (p.avatar_url as string | null) ?? null,
      bio: (p.bio as string | null) ?? null,
    }))

    return NextResponse.json({ users }, { status: 200 })
  }

  // Authenticated: exclude self and already-followed users
  const { data: followingRows } = await supabaseAdmin
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId)

  const excludeIds = new Set<string>([viewerId])
  for (const row of followingRows ?? []) {
    if (typeof row.following_id === "string") {
      excludeIds.add(row.following_id)
    }
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, avatar_url, bio")
    .not("id", "in", `(${Array.from(excludeIds).join(",")})`)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch suggested users.", details: error.message },
      { status: 500 }
    )
  }

  const users = (data ?? []).map((p) => ({
    id: p.id,
    displayName: (p.display_name as string | null) ?? "Anonymous",
    avatarUrl: (p.avatar_url as string | null) ?? null,
    bio: (p.bio as string | null) ?? null,
  }))

  return NextResponse.json({ users }, { status: 200 })
}
