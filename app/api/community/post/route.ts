import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase_admin";

const COMMUNITY_POSTS_TABLE = "community_posts";

type CreateCommunityPostRequest = {
  communityId?: unknown;
  authorId?: unknown;
  text?: unknown;
  linkUrl?: unknown;
  imageUrl?: unknown;
  contentType?: unknown;
};

type CommunityPostRecord = {
  id: string;
};

function sanitise(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function resolveContentType(
  providedType: unknown,
  hasText: boolean,
  hasLink: boolean,
  hasImage: boolean
): string {
  if (typeof providedType === "string" && providedType.trim()) {
    return providedType.trim();
  }

  if (hasText) {
    return "text";
  }

  if (hasLink) {
    return "link";
  }

  if (hasImage) {
    return "image";
  }

  return "unknown";
}

export async function POST(request: Request) {
  let payload: CreateCommunityPostRequest;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: String(error) },
      { status: 400 }
    );
  }

  const communityId = sanitise(payload.communityId);
  const authorId = sanitise(payload.authorId);
  const text = sanitise(payload.text);
  const linkUrl = sanitise(payload.linkUrl);
  const imageUrl = sanitise(payload.imageUrl);

  if (!communityId) {
    return NextResponse.json(
      {
        error: "`communityId` is required and must be a non-empty string.",
      },
      { status: 400 }
    );
  }

  if (!authorId) {
    return NextResponse.json(
      { error: "`authorId` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (!text && !linkUrl && !imageUrl) {
    return NextResponse.json(
      {
        error:
          "Provide at least one of `text`, `linkUrl`, or `imageUrl` for the community post.",
      },
      { status: 400 }
    );
  }

  const contentType = resolveContentType(
    payload.contentType,
    Boolean(text),
    Boolean(linkUrl),
    Boolean(imageUrl)
  );

  const insertPayload: Record<string, unknown> = {
    community_id: communityId,
    author_id: authorId,
    content_type: contentType,
  };

  if (text) {
    insertPayload.text_content = text;
  }

  if (linkUrl) {
    insertPayload.link_url = linkUrl;
  }

  if (imageUrl) {
    insertPayload.image_url = imageUrl;
  }

  const {
    data: post,
    error,
  } = await supabaseAdmin
    .from<CommunityPostRecord>(COMMUNITY_POSTS_TABLE)
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !post) {
    return NextResponse.json(
      {
        error: "Failed to create community post",
        details: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ post }, { status: 201 });
}
