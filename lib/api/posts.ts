import type { Post, User } from "@/lib/types"

type ApiPostRecord = {
  id?: unknown
  caption?: unknown
  image_url?: unknown
  author_id?: unknown
  created_at?: unknown
  author?: Record<string, unknown> | null
  [key: string]: unknown
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }

  if (typeof value === "number") {
    return String(value)
  }

  return undefined
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value
  }

  return undefined
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return undefined
}

function normaliseDate(value: unknown): Date {
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  return new Date()
}

function normaliseAuthor(
  raw: Record<string, unknown> | null | undefined,
  fallbackId: string | undefined
): User {
  const data = raw ?? {}

  const id =
    toOptionalString(data.id) ??
    fallbackId ??
    `unknown-${Math.random().toString(36).slice(2, 8)}`

  const displayName =
    toOptionalString(data.display_name) ??
    toOptionalString(data.full_name) ??
    toOptionalString(data.name) ??
    toOptionalString(data.username) ??
    "HomeBridgr Friend"

  const username =
    toOptionalString(data.username) ??
    displayName.toLowerCase().replace(/\s+/g, "_")

  const avatar =
    toOptionalString(data.avatar_url) ??
    toOptionalString(data.avatar) ??
    "/placeholder-user.jpg"

  const bio = toOptionalString(data.bio) ?? ""
  const hometown = toOptionalString(data.hometown) ?? "Unknown hometown"
  const location =
    toOptionalString(data.location) ??
    toOptionalString(data.city) ??
    "Unknown location"

  const isInHomeCircle =
    toBoolean((data as Record<string, unknown>).is_in_home_circle) ??
    toBoolean((data as Record<string, unknown>).isInHomeCircle)

  return {
    id,
    username,
    displayName,
    avatar,
    bio,
    hometown,
    location,
    isInHomeCircle,
  }
}

function mapApiPost(record: ApiPostRecord): Post | null {
  const id = toOptionalString(record.id)

  if (!id) {
    return null
  }

  const caption = toOptionalString(record.caption) ?? ""
  const image = toOptionalString(record.image_url)
  const createdAt = normaliseDate(record.created_at)

  const author = normaliseAuthor(
    record.author ?? undefined,
    toOptionalString(record.author_id)
  )

  const likes = toNumber((record as Record<string, unknown>).likes) ?? 0
  const comments =
    toNumber((record as Record<string, unknown>).comments) ?? 0

  const location =
    toOptionalString((record as Record<string, unknown>).location) ??
    author.location ??
    "Unknown location"

  const content =
    caption || (image ? "Shared a photo." : "Shared an update.")

  return {
    id,
    type: "user",
    author,
    content,
    image: image ?? undefined,
    location,
    timestamp: createdAt,
    likes,
    comments,
    isLiked: false,
  }
}

export async function fetchPosts(): Promise<Post[]> {
  let response: Response

  try {
    response = await fetch("/api/posts", {
      method: "GET",
      cache: "no-store",
    })
  } catch (error) {
    throw new Error("Network error while fetching posts.")
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch (error) {
    throw new Error("Failed to parse posts response.")
  }

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : null) ?? "Unable to fetch posts."

    throw new Error(message)
  }

  const postsArray =
    payload &&
    typeof payload === "object" &&
    "posts" in payload &&
    Array.isArray((payload as { posts: unknown }).posts)
      ? ((payload as { posts: unknown[] }).posts as ApiPostRecord[])
      : []

  return postsArray
    .map(mapApiPost)
    .filter((post): post is Post => Boolean(post))
}
