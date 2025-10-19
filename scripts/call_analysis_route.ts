import { config as loadEnv } from "dotenv";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
loadEnv({ path: envPath });

async function main() {
  const caption =
    process.argv.slice(2).join(" ").trim() ||
    "Late-night takoyaki under the Osaka castle lights!";

  const { POST } = await import("../app/api/analysis/route");

  const request = new Request("http://localhost/api/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: caption }),
  });

  const response = await POST(request);
  const json = await response.json();

  console.log("Status:", response.status);
  console.log("Body:", JSON.stringify(json, null, 2));
}

main().catch((error) => {
  console.error("Call failed:", error);
  process.exitCode = 1;
});
