import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || "us-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export interface BedrockResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function invokeBedrock(
  prompt: string,
  modelId: string = "anthropic.claude-3-haiku-20240307-v1:0"
): Promise<BedrockResponse> {
  try {
    const input = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      body: JSON.stringify(input),
    });

    const response = await client.send(command);
    const text = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(text);
    
    return {
      content: parsed.content[0].text,
      usage: parsed.usage
    };
  } catch (error) {
    console.error("Bedrock invocation failed:", error);
    throw new Error(`Bedrock API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function testBedrock() {
  try {
    const result = await invokeBedrock("Hello, describe Pike Place Market in Seattle.");
    console.log("Bedrock:", result.content);
    return result;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
}