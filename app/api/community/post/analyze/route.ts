import { NextResponse } from "next/server";

import {
  analyzeCaption,
  CaptionAnalysisNotConfiguredError,
  type AnalyzeCaptionOptions,
} from "@/lib/analysis";
import { supabaseAdmin } from "@/lib/supabase_admin";

const COMMUNITY_POSTS_TABLE = "community_posts";
const ANALYSIS_TERMS_COLUMN = "analysis_terms";
const ANALYSIS_RAW_COLUMN = "analysis_raw_text";
const ANALYSIS_GENERATED_AT_COLUMN = "analysis_generated_at";

type AnalyzeCommunityPostRequestBody = {
  postId?: unknown;
  options?: unknown;
};

type CommunityPostRecord = {
  id: string;
  text_content: string | null;
};

function sanitiseOptions(
  raw: unknown
): AnalyzeCaptionOptions | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const input = raw as Record<string, unknown>;
  const result: AnalyzeCaptionOptions = {};

  const modelId = input.modelId;
  if (typeof modelId === "string" && modelId.trim()) {
    result.modelId = modelId.trim();
  }

  const maxTokens = input.maxTokens;
  if (
    typeof maxTokens === "number" &&
    Number.isFinite(maxTokens) &&
    maxTokens > 0
  ) {
    result.maxTokens = Math.floor(maxTokens);
  }

  const temperature = input.temperature;
  if (
    typeof temperature === "number" &&
    Number.isFinite(temperature) &&
    temperature >= 0
  ) {
    result.temperature = Math.min(1, Math.max(0, temperature));
  }

  const topP = input.topP;
  if (
    typeof topP === "number" &&
    Number.isFinite(topP) &&
    topP > 0
  ) {
    result.topP = Math.min(1, topP);
  }

  return Object.keys(result).length ? result : undefined;
}

export async function POST(request: Request) {
  let payload: AnalyzeCommunityPostRequestBody;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: String(error) },
      { status: 400 }
    );
  }

  const { postId, options } = payload;

  if (typeof postId !== "string" || !postId.trim()) {
    return NextResponse.json(
      { error: "`postId` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const trimmedPostId = postId.trim();

  const { data: post, error: fetchError } = await supabaseAdmin
    .from<CommunityPostRecord>(COMMUNITY_POSTS_TABLE)
    .select("id, text_content")
    .eq("id", trimmedPostId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to retrieve post", details: fetchError.message },
      { status: 500 }
    );
  }

  if (!post) {
    return NextResponse.json(
      { error: `Post ${trimmedPostId} was not found.` },
      { status: 404 }
    );
  }

  if (typeof post.text_content !== "string" || !post.text_content.trim()) {
    return NextResponse.json(
      { error: "Post text is empty. Provide text content before analysing." },
      { status: 400 }
    );
  }

  let analysis;

  try {
    analysis = await analyzeCaption(
      post.text_content,
      sanitiseOptions(options)
    );
  } catch (error) {
    if (error instanceof CaptionAnalysisNotConfiguredError) {
      return NextResponse.json(
        {
          error: "Caption analysis is not configured.",
          details: error.message,
        },
        { status: 501 }
      );
    }

    return NextResponse.json(
      {
        error: "Caption analysis failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }

  const updatedFields: Record<string, unknown> = {
    [ANALYSIS_TERMS_COLUMN]: analysis.terms,
    [ANALYSIS_RAW_COLUMN]: analysis.rawModelText,
    [ANALYSIS_GENERATED_AT_COLUMN]: new Date().toISOString(),
  };

  const { data: updatedPost, error: updateError } = await supabaseAdmin
    .from(COMMUNITY_POSTS_TABLE)
    .update(updatedFields)
    .eq("id", trimmedPostId)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      {
        error: "Failed to persist caption analysis",
        details: updateError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      post: updatedPost,
      analysis,
    },
    { status: 200 }
  );
}

