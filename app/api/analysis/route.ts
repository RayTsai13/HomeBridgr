import { NextResponse } from "next/server";

import { analyzeCaptionWithBedrock } from "@/lib/analysis";

type AnalysisRequestPayload = {
  message?: unknown;
};

export async function POST(request: Request) {
  let payload: AnalysisRequestPayload;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: String(error) },
      { status: 400 }
    );
  }

  const { message } = payload;

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "`message` is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeCaptionWithBedrock(message.trim());

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to analyze caption",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
