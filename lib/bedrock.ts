import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

const textEncoder = new TextEncoder();

let cachedClient: BedrockRuntimeClient | null = null;

export class BedrockConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BedrockConfigurationError";
  }
}

function resolveRegion(): string {
  const region =
    process.env.AWS_BEDROCK_REGION ||
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION;

  if (!region) {
    throw new BedrockConfigurationError(
      "Missing AWS region configuration for Bedrock. Set AWS_BEDROCK_REGION or AWS_REGION."
    );
  }

  return region;
}

export function getBedrockClient(): BedrockRuntimeClient {
  if (!cachedClient) {
    cachedClient = new BedrockRuntimeClient({
      region: resolveRegion(),
    });
  }

  return cachedClient;
}

export function resetBedrockClient() {
  cachedClient = null;
}

type InvokeOptions = {
  modelId: string;
  body: string | Uint8Array;
  contentType?: string;
  accept?: string;
};

export async function invokeBedrockModel(
  options: InvokeOptions
): Promise<InvokeModelCommandOutput> {
  const client = getBedrockClient();

  const command = new InvokeModelCommand({
    modelId: options.modelId,
    body:
      typeof options.body === "string"
        ? textEncoder.encode(options.body)
        : options.body,
    contentType: options.contentType ?? "application/json",
    accept: options.accept ?? "application/json",
  });

  return client.send(command);
}
