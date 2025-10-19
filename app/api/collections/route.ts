import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase_admin";

const COLLECTIONS_TABLE = "postcard_collections";

type CreateCollectionRequest = {
  name?: unknown;
  userId?: unknown;
  description?: unknown;
  visibility?: unknown;
};

type CollectionRecord = {
  id: string;
  name?: string | null;
  description?: string | null;
  visibility?: string | null;
  created_by?: string | null;
  created_at?: string;
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
    .from<CollectionRecord>(COLLECTIONS_TABLE)
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

  const {
    data: collection,
    error,
  } = await supabaseAdmin
    .from<CollectionRecord>(COLLECTIONS_TABLE)
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !collection) {
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
