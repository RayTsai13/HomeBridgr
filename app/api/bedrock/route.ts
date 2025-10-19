import { NextRequest, NextResponse } from "next/server";
import { invokeBedrock } from "@/lib/bedrock";

export async function POST(request: NextRequest) {
  try {
    const { prompt, modelId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await invokeBedrock(prompt, modelId);
    
    return NextResponse.json({
      success: true,
      content: result.content,
      usage: result.usage
    });

  } catch (error) {
    console.error("Bedrock API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to invoke Bedrock",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
