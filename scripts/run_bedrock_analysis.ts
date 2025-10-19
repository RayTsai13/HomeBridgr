import { config as loadEnv } from "dotenv";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
loadEnv({ path: envPath });

async function main() {
  const caption = process.argv.slice(2).join(" ").trim();

  if (!caption) {
    console.error("Usage: npm run bedrock:analyze -- \"<caption text>\"");
    process.exitCode = 1;
    return;
  }

  const { analyzeCaption } = await import("../lib/analysis");

  try {
    const result = await analyzeCaption(caption);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Caption analysis failed.");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  }
}

main();
