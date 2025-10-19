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

type ApiTermRecord = {
  term?: unknown
  explanation?: unknown
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

function normaliseAnalysisTerms(value: unknown): { term: string; explanation: string }[] | undefined {
  if (!value) {
    return undefined
  }

  let parsed: unknown

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value)
    } catch {
      return undefined
    }
  } else {
    parsed = value
  }

  if (!Array.isArray(parsed)) {
    return undefined
  }

  const terms = parsed
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }
      const { term, explanation } = entry as ApiTermRecord
      const cleanTerm = toOptionalString(term)
      const cleanExplanation = toOptionalString(explanation)
      if (!cleanTerm || !cleanExplanation) {
        return null
      }
      return { term: cleanTerm, explanation: cleanExplanation }
    })
    .filter(
      (entry): entry is { term: string; explanation: string } =>
        Boolean(entry)
    )

  return terms.length ? terms : undefined
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

  const analysisTerms = normaliseAnalysisTerms(
    (record as Record<string, unknown>).analysis_terms
  )
  const analysisRawText = toOptionalString(
    (record as Record<string, unknown>).analysis_raw_text
  )
  const analysisGeneratedRaw = (record as Record<string, unknown>)
    .analysis_generated_at
  const analysisGeneratedAt =
    analysisGeneratedRaw !== undefined && analysisGeneratedRaw !== null
      ? normaliseDate(analysisGeneratedRaw)
      : undefined

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
    analysisTerms,
    analysisRawText: analysisRawText ?? undefined,
    analysisGeneratedAt,
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

type CreatePostInput = {
  caption: string
  authorId: string
  imageUrl?: string | null
}

export async function createPost({
  caption,
  authorId,
  imageUrl,
}: CreatePostInput): Promise<Post> {
  let response: Response

  try {
    response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caption,
        author_id: authorId,
        image_url: imageUrl ?? null,
      }),
    })
  } catch (error) {
    throw new Error("Network error while creating the post.")
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch (error) {
    throw new Error("Failed to parse create post response.")
  }

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : null) ?? "Unable to create post."

    throw new Error(message)
  }

  const record =
    payload &&
    typeof payload === "object" &&
    "post" in payload
      ? ((payload as { post: ApiPostRecord }).post as ApiPostRecord)
      : null

  const mapped = record ? mapApiPost(record) : null

  if (!mapped) {
    throw new Error("Unexpected response while creating post.")
  }

  return mapped
}

export type PostAnalysisResult = {
  terms: { term: string; explanation: string }[]
  rawModelText: string
  generatedAt?: Date
}

export async function analyzePost(postId: string): Promise<PostAnalysisResult> {
  let response: Response

  try {
    response = await fetch("/api/posts/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postId }),
    })
  } catch (error) {
    throw new Error("Network error while running caption analysis.")
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch (error) {
    throw new Error("Failed to parse caption analysis response.")
  }

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : null) ?? "Unable to analyze caption."

    throw new Error(message)
  }

  const analysisPayload =
    payload && typeof payload === "object" && "analysis" in payload
      ? ((payload as { analysis: unknown }).analysis as Record<string, unknown>)
      : {}

  const postRecord =
    payload && typeof payload === "object" && "post" in payload
      ? ((payload as { post: ApiPostRecord }).post as ApiPostRecord)
      : {}

  const rawTerms =
    analysisPayload?.terms ?? (postRecord as Record<string, unknown>).analysis_terms
  const rawText =
    toOptionalString(analysisPayload?.rawModelText) ??
    toOptionalString((postRecord as Record<string, unknown>).analysis_raw_text) ??
    ""
  const generatedAtRaw = (postRecord as Record<string, unknown>)
    .analysis_generated_at

  const terms =
    normaliseAnalysisTerms(rawTerms) ??
    []

  return {
    terms,
    rawModelText: rawText,
    generatedAt:
      generatedAtRaw !== undefined && generatedAtRaw !== null
        ? normaliseDate(generatedAtRaw)
        : undefined,
  }
}
