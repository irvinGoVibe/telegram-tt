import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
for (const name of [".env.local", ".env"]) {
  const file = path.join(root, name);
  if (existsSync(file) && typeof process.loadEnvFile === "function") process.loadEnvFile(file);
}

const url = String(process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || process.env.VITE_CONVEX_URL || "").trim();
if (url && !/^https:\/\/[a-z0-9-]+\.convex\.cloud$/i.test(url)) throw new Error("CONVEX_URL is not a valid Convex deployment URL.");
await writeFile(path.join(root, ".convex-runtime-url"), url, { encoding: "utf8", mode: 0o600 });
console.log(url ? "Captured the Convex runtime URL for server packaging." : "No Convex runtime URL was available; archive fallback remains enabled.");
