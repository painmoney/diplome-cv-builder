import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { validatePublicEnv } from "../../src/config/publicEnvSchema.js";

// Match Vite precedence, including hosting variables and .env.local.
// Never print values: a misconfigured value may itself be a secret.
export function assertViteTarget(targetName, envDir = process.cwd()) {
  const root = resolve(envDir);
  const targets = JSON.parse(readFileSync(resolve(root, "config/supabase-targets.json"), "utf8"));
  if (!["primary", "staging"].includes(targetName)) throw new Error("Unknown environment target");
  const mode = targetName === "primary" ? "development" : "staging";
  const raw = { ...loadEnv(mode, root, "VITE_"), ...Object.fromEntries(
    Object.entries(process.env).filter(([name]) => name.startsWith("VITE_")),
  ) };
  const config = validatePublicEnv({ ...raw, MODE: mode });
  const url = new URL(config.supabaseUrl);
  const expectedHost = `${targets[targetName].projectRef}.supabase.co`;
  if (url.protocol !== "https:" || url.host !== expectedHost ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Supabase URL does not match the registered target");
  }
  const key = config.supabaseClientKey;
  if (!key.startsWith("sb_publishable_")) {
    let payload;
    try {
      const parts = key.split(".");
      if (parts.length !== 3) throw new Error();
      payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    } catch {
      throw new Error("Expected a publishable key or a legacy anon JWT");
    }
    if (payload.role !== "anon" || payload.ref !== targets[targetName].projectRef) {
      throw new Error("Browser JWT must be anon and belong to the registered target");
    }
  }
  // Extra hosting variables are not exposed: vite.config.js disables automatic
  // env-prefix exposure and defines only the three approved public fields.
  return config;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const dirIndex = process.argv.indexOf("--dir");
    assertViteTarget(process.argv[2], dirIndex === -1 ? undefined : process.argv[dirIndex + 1]);
    console.log("[env:check] PASS: public configuration matches registered target");
  } catch (error) {
    console.error(`[env:check] FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
