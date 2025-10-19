import type { Collection } from "@/lib/types"

type ApiCollectionRecord = {
  id?: unknown
  name?: unknown
  description?: unknown
  visibility?: unknown
  created_at?: unknown
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

  return {
    id,
    name,
    description,
    visibility,
    createdAt,
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
