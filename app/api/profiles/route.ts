import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase_admin";

const PROFILES_TABLE = "profiles";
const ALLOWED_USER_TYPES = new Set(["student", "community"]);

type UpdateUserTypeRequest = {
  userId?: unknown;
  userType?: unknown;
};

type ProfileRecord = {
  id: string;
  user_type?: string | null;
  [key: string]: unknown;
};

function sanitiseString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function sanitiseUserType(value: unknown): string | undefined {
  const raw = sanitiseString(value);

  if (!raw) {
    return undefined;
  }

  const normalised = raw.toLowerCase();
  return ALLOWED_USER_TYPES.has(normalised) ? normalised : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = sanitiseString(searchParams.get("userId"));

  if (!userId) {
    return NextResponse.json(
      { error: "`userId` query param is required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from<ProfileRecord>(PROFILES_TABLE)
    .select("id, user_type")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to retrieve profile",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      profile: data ?? null,
    },
    { status: 200 }
  );
}

export async function PATCH(request: Request) {
  let payload: UpdateUserTypeRequest;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: String(error) },
      { status: 400 }
    );
  }

  const userId = sanitiseString(payload.userId);
  const userType = sanitiseUserType(payload.userType);

  if (!userId) {
    return NextResponse.json(
      { error: "`userId` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (!userType) {
    return NextResponse.json(
      {
        error:
          "`userType` must be either `student` or `community` (case-insensitive).",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from<ProfileRecord>(PROFILES_TABLE)
    .upsert(
      { id: userId, user_type: userType },
      { onConflict: "id" }
    )
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to persist user type",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      profile: data ?? null,
    },
    { status: 200 }
  );
}
