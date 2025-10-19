import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase_admin";

const COMMUNITIES_TABLE = "communities";
const COMMUNITY_MEMBERS_TABLE = "community_members";

type CreateCommunityRequest = {
  name?: unknown;
  description?: unknown;
  creatorId?: unknown;
  slug?: unknown;
};

type CommunityRecord = {
  id: string;
};

type CommunityMemberRecord = {
  id: string;
};

function sanitiseString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export async function POST(request: Request) {
  let payload: CreateCommunityRequest;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: String(error) },
      { status: 400 }
    );
  }

  const name = sanitiseString(payload.name);
  const creatorId = sanitiseString(payload.creatorId);
  const description = sanitiseString(payload.description);
  const slug = sanitiseString(payload.slug);

  if (!name) {
    return NextResponse.json(
      { error: "`name` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (!creatorId) {
    return NextResponse.json(
      { error: "`creatorId` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const communityInsertPayload: Record<string, unknown> = {
    name,
    created_by: creatorId,
  };

  if (description) {
    communityInsertPayload.description = description;
  }

  if (slug) {
    communityInsertPayload.slug = slug;
  }

  const {
    data: community,
    error: communityError,
  } = await supabaseAdmin
    .from(COMMUNITIES_TABLE)
    .insert(communityInsertPayload)
    .select("*")
    .single();

  if (communityError || !community) {
    return NextResponse.json(
      {
        error: "Failed to create community",
        details: communityError?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }

  const membershipPayload: Record<string, unknown> = {
    community_id: community.id,
    member_id: creatorId,
    role: "owner",
  };

  const {
    data: membership,
    error: membershipError,
  } = await supabaseAdmin
    .from(COMMUNITY_MEMBERS_TABLE)
    .insert(membershipPayload)
    .select("*")
    .single();

  if (membershipError || !membership) {
    await supabaseAdmin
      .from(COMMUNITIES_TABLE)
      .delete()
      .eq("id", community.id);

    return NextResponse.json(
      {
        error: "Failed to add community owner",
        details: membershipError?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      community,
      membership,
    },
    { status: 201 }
  );
}
