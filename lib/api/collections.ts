import type { Collection, Post } from "@/lib/types"

type ApiCollectionRecord = {
  id?: unknown
  name?: unknown
  description?: unknown
  visibility?: unknown
  created_at?: unknown
  items?: unknown
  post_ids?: unknown
  fingerprint?: unknown
  source?: unknown
  metadata?: unknown
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
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

function mapCollection(record: ApiCollectionRecord): Collection | null {
  const id = toOptionalString(record.id)
  if (!id) {
    return null
  }

  const name = toOptionalString(record.name) ?? "Untitled Collection"
  const description = toOptionalString(record.description) ?? null
  const visibility = toOptionalString(record.visibility) ?? null
  const createdAt = normaliseDate(record.created_at)

  // Optional postcard fields
  const fingerprint = toOptionalString(record.fingerprint) ?? null
  const source = toOptionalString(record.source) ?? null
  const postIds = Array.isArray(record.post_ids)
    ? (record.post_ids as unknown[]).map(toOptionalString).filter(Boolean) as string[]
    : undefined
  const items = Array.isArray(record.items)
    ? (record.items as unknown[]).map((it) => {
        if (!it || typeof it !== 'object') return null
        const obj = it as Record<string, unknown>
        return {
          postId: toOptionalString(obj.post_id) ?? '',
          imageUrl: toOptionalString(obj.image_url) ?? null,
          caption: toOptionalString(obj.caption) ?? null,
          authorId: toOptionalString(obj.author_id) ?? null,
          authorName: toOptionalString(obj.author_name) ?? null,
        }
      }).filter(Boolean) as Collection['items']
    : undefined

  return {
    id,
    name,
    description,
    visibility,
    createdAt,
    fingerprint,
    source,
    postIds,
    items,
  }
}

export async function fetchCollections(userId: string): Promise<Collection[]> {
  let response: Response

  try {
    response = await fetch(`/api/collections?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
      cache: "no-store",
    })
  } catch (error) {
    throw new Error("Network error while loading collections.")
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch (error) {
    throw new Error("Failed to parse collections response.")
  }

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : null) ?? "Unable to load collections."
    throw new Error(message)
  }

  const records =
    payload &&
    typeof payload === "object" &&
    "collections" in payload &&
    Array.isArray((payload as { collections: unknown }).collections)
      ? ((payload as { collections: unknown[] }).collections as ApiCollectionRecord[])
      : []

  return records
    .map(mapCollection)
    .filter((collection): collection is Collection => Boolean(collection))
}

type CreateCollectionInput = {
  name: string
  userId: string
  description?: string
  visibility?: string
}

export async function createCollection(input: CreateCollectionInput): Promise<Collection> {
  let response: Response

  try {
    response = await fetch("/api/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: input.name,
        userId: input.userId,
        description: input.description ?? null,
        visibility: input.visibility ?? null,
      }),
    })
  } catch (error) {
    throw new Error("Network error while creating collection.")
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch (error) {
    throw new Error("Failed to parse create collection response.")
  }

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : null) ?? "Unable to create collection."
    throw new Error(message)
  }

  const record =
    payload &&
    typeof payload === "object" &&
    "collection" in payload
      ? ((payload as { collection: ApiCollectionRecord }).collection as ApiCollectionRecord)
      : null

  const mapped = record ? mapCollection(record) : null

  if (!mapped) {
    throw new Error("Unexpected response while creating collection.")
  }

  return mapped
}

// Creates a postcard collection from the first 4 image posts
export async function createPostcardCollectionFromPosts(
  userId: string,
  posts: Post[],
  options?: { name?: string; description?: string; visibility?: string; source?: string }
): Promise<Collection> {
  const items = posts.slice(0, 4).map((p) => ({
    post_id: p.id,
    image_url: p.image ?? null,
    caption: p.content ?? null,
    author_id: p.author.id ?? null,
    author_name: p.author.displayName ?? null,
  }))

  const postIds = items.map((i) => i.post_id).filter(Boolean) as string[]
  const fingerprint = [...postIds].sort().join('|')

  let response: Response

  try {
    response = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: options?.name ?? "Auto Postcard",
        userId,
        description: options?.description ?? null,
        visibility: options?.visibility ?? "private",
        source: options?.source ?? "auto",
        items,
        postIds,
        fingerprint,
        metadata: { generated_from: "top-of-feed", post_count: posts.length },
      }),
    })
  } catch (error) {
    throw new Error("Network error while creating postcard collection.")
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch (error) {
    throw new Error("Failed to parse create postcard response.")
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload && typeof (payload as any).error === 'string'
        ? (payload as any).error
        : null) ?? 'Unable to create postcard collection.'
    throw new Error(message)
  }

  const record = payload && typeof payload === 'object' && 'collection' in payload
    ? (payload as any).collection as ApiCollectionRecord
    : null

  const mapped = record ? mapCollection(record) : null
  if (!mapped) {
    throw new Error("Unexpected response while creating postcard collection.")
  }

  return mapped
}
