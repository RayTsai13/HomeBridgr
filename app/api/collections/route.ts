import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase_admin";

const COLLECTIONS_TABLE = "postcard_collections";

type CreateCollectionRequest = {
  name?: unknown;
  userId?: unknown;
  description?: unknown;
  visibility?: unknown;
  // Extended postcard fields (optional)
  items?: unknown;
  postIds?: unknown;
  fingerprint?: unknown;
  source?: unknown;
  metadata?: unknown;
};

type CollectionRecord = {
  id: string;
  name?: string | null;
  description?: string | null;
  visibility?: string | null;
  created_by?: string | null;
  created_at?: string;
  items?: unknown;
  post_ids?: string[] | null;
  fingerprint?: string | null;
  source?: string | null;
  metadata?: unknown;
  [key: string]: unknown;
};

function sanitise(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = sanitise(url.searchParams.get("userId"));

  if (!userId) {
    return NextResponse.json(
      { error: "`userId` query parameter is required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from(COLLECTIONS_TABLE)
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch collections",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { collections: Array.isArray(data) ? data : [] },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  let payload: CreateCollectionRequest;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: String(error) },
      { status: 400 }
    );
  }

  const name = sanitise(payload.name);
  const userId = sanitise(payload.userId);
  const description = sanitise(payload.description);
  const visibility = sanitise(payload.visibility);

  // Optional postcard fields
  const source = sanitise(payload.source);
  const fingerprint = sanitise(payload.fingerprint);

  // postIds: string[]
  const postIds = Array.isArray(payload.postIds)
    ? (payload.postIds
        .map((v) => sanitise(v))
        .filter((v): v is string => Boolean(v)) as string[])
    : undefined;

  // items: array of postcard item objects (light validation)
  const rawItems = Array.isArray(payload.items) ? payload.items : undefined;
  const items = rawItems
    ? rawItems
        .map((it) => {
          if (!it || typeof it !== "object") return null;
          const obj = it as Record<string, unknown>;
          const post_id = sanitise(obj.post_id);
          const image_url = sanitise(obj.image_url);
          const caption = sanitise(obj.caption);
          const author_id = sanitise(obj.author_id);
          const author_name = sanitise(obj.author_name);
          return {
            ...(post_id ? { post_id } : {}),
            ...(image_url ? { image_url } : {}),
            ...(caption ? { caption } : {}),
            ...(author_id ? { author_id } : {}),
            ...(author_name ? { author_name } : {}),
          };
        })
        .filter(Boolean)
    : undefined;

  const metadata =
    payload.metadata && typeof payload.metadata === "object"
      ? (payload.metadata as Record<string, unknown>)
      : undefined;

  if (!name) {
    return NextResponse.json(
      { error: "`name` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (!userId) {
    return NextResponse.json(
      { error: "`userId` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const insertPayload: Record<string, unknown> = {
    name,
    created_by: userId,
  };

  if (description) {
    insertPayload.description = description;
  }

  if (visibility) {
    insertPayload.visibility = visibility;
  }

  // Attach extended postcard fields when provided
  if (items && items.length) {
    insertPayload.items = items;
  }
  if (postIds && postIds.length) {
    insertPayload.post_ids = postIds;
  }
  if (fingerprint) {
    insertPayload.fingerprint = fingerprint;
  }
  if (source) {
    insertPayload.source = source;
  }
  if (metadata) {
    insertPayload.metadata = metadata;
  }

  const {
    data: collection,
    error,
  } = await supabaseAdmin
    .from(COLLECTIONS_TABLE)
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !collection) {
    // If this looks like a duplicate by (created_by, fingerprint), try to fetch existing
    if (userId && fingerprint) {
      const { data: existingList } = await supabaseAdmin
        .from(COLLECTIONS_TABLE)
        .select("*")
        .eq("created_by", userId)
        .eq("fingerprint", fingerprint)
        .limit(1);

      const existing = Array.isArray(existingList) && existingList.length > 0 ? existingList[0] : null;
      if (existing) {
        return NextResponse.json({ collection: existing }, { status: 200 });
      }
    }

    return NextResponse.json(
      {
        error: "Failed to create collection",
        details: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ collection }, { status: 201 });
}
