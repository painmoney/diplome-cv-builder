#!/usr/bin/env node
/**
 * Staging target guard.
 * Verifies that the staging URL differs from the current primary URL.
 * Exits non-zero if staging equals primary or is misconfigured.
 * Never prints full URLs or keys.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  try {
    const raw = readFileSync(filePath, "utf8");
    const vars = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) vars[m[1]] = m[2].trim();
    }
    return vars;
  } catch {
    return null;
  }
}

function maskHost(url) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    return host.slice(-4);
  } catch {
    return "????";
  }
}

const root = resolve(process.cwd());
const primaryEnv = loadEnvFile(resolve(root, ".env")) || {};
const stagingEnv = loadEnvFile(resolve(root, ".env.staging.local")) || {};

const primaryUrl = primaryEnv.VITE_SUPABASE_URL || "";
const stagingUrl = stagingEnv.VITE_SUPABASE_URL || "";

if (!stagingUrl) {
  console.error("[staging:guard] VITE_SUPABASE_URL not found in .env.staging.local");
  process.exit(1);
}

if (primaryUrl && stagingUrl === primaryUrl) {
  console.error("[staging:guard] FAIL: staging URL equals current primary URL (****" + maskHost(stagingUrl) + ")");
  process.exit(1);
}

try {
  const p = new URL(primaryUrl);
  const s = new URL(stagingUrl);
  if (p.hostname === s.hostname) {
    console.error("[staging:guard] FAIL: staging hostname matches primary (****" + maskHost(stagingUrl) + ")");
    process.exit(1);
  }
} catch {
  console.error("[staging:guard] FAIL: malformed staging URL");
  process.exit(1);
}

console.log("[staging:guard] PASS: staging (****" + maskHost(stagingUrl) + ") differs from primary (****" + maskHost(primaryUrl) + ")");
