import * as fs from "fs";
import { join } from "path";

const TARGETS = {
  primary: { ref: "cxnzlarcmszvnobuoskr", url: "https://cxnzlarcmszvnobuoskr.supabase.co" },
  staging: { ref: "jerwfvhpoanoukxiyvwq", url: "https://jerwfvhpoanoukxiyvwq.supabase.co" },
};

function loadEnvFile(dir, filename) {
  const path = join(dir, filename);
  if (!fs.existsSync(path)) return null;
  const content = fs.readFileSync(path, "utf8");
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.substring(0, eq)] = trimmed.substring(eq + 1);
  }
  return vars;
}

function extractUrlRef(url) {
  const match = url?.match(/https:\/\/([a-z]{20})\.supabase/);
  return match ? match[1] : null;
}

function extractJwtRef(key) {
  if (!key || !key.startsWith("eyJ")) return null;
  try {
    const parts = key.split(".");
    if (parts.length < 2) return null;
    const pad = parts[1].padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(pad, "base64").toString("utf8"));
    return payload.ref || null;
  } catch {
    return null;
  }
}

function getKeyType(key) {
  if (!key) return "missing";
  if (key.startsWith("__")) return "placeholder";
  if (key.startsWith("eyJ")) return "legacy-jwt";
  if (key.startsWith("sb_publishable_")) return "publishable";
  return "unknown";
}

function isServiceRole(key) {
  if (!key) return false;
  if (key.startsWith("eyJ")) {
    try {
      const parts = key.split(".");
      const pad = parts[1].padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
      const payload = JSON.parse(Buffer.from(pad, "base64").toString("utf8"));
      return payload.role === "service_role";
    } catch {
      return false;
    }
  }
  return false;
}

function assertTarget(targetName, envDir) {
  const target = TARGETS[targetName];
  if (!target) {
    console.error(`FAIL: Unknown target "${targetName}". Valid: primary, staging`);
    process.exit(1);
  }

  const rootDir = envDir || process.cwd();
  console.log(`=== Env Target Assert: ${targetName} ===`);

  const mode = targetName === "primary" ? "development" : "staging";
  const modeFile = `.env.${mode === "staging" ? "staging" : "development"}.local`;
  const baseEnv = loadEnvFile(rootDir, ".env");
  const modeEnv = loadEnvFile(rootDir, modeFile);

  const url = modeEnv?.VITE_SUPABASE_URL || baseEnv?.VITE_SUPABASE_URL;
  const key = modeEnv?.VITE_SUPABASE_ANON_KEY || baseEnv?.VITE_SUPABASE_ANON_KEY;

  const urlRef = extractUrlRef(url);
  const keyType = getKeyType(key);
  const keyRef = extractJwtRef(key);

  console.log(`  mode: ${mode}`);
  console.log(`  expected ref: ${target.ref}`);
  console.log(`  URL ref: ${urlRef || "MISSING"}`);
  console.log(`  key type: ${keyType}`);
  if (keyRef) console.log(`  key ref: ${keyRef}`);

  if (!url) {
    console.error("FAIL: No URL found");
    process.exit(1);
  }

  if (keyType === "missing" || keyType === "placeholder") {
    console.error(`FAIL: Browser key is ${keyType}`);
    process.exit(1);
  }

  if (isServiceRole(key)) {
    console.error("FAIL: Service-role key detected in browser env");
    process.exit(1);
  }

  if (urlRef !== target.ref) {
    console.error(`FAIL: URL ref "${urlRef}" does not match expected "${target.ref}"`);
    process.exit(1);
  }

  if (keyRef && keyRef !== target.ref) {
    console.error(`FAIL: Key ref "${keyRef}" does not match expected "${target.ref}"`);
    process.exit(1);
  }

  const otherTarget = targetName === "primary" ? "staging" : "primary";
  const otherRef = TARGETS[otherTarget].ref;
  if (keyRef === otherRef) {
    console.error(`FAIL: Key ref matches ${otherTarget} instead of ${targetName}`);
    process.exit(1);
  }

  console.log("PASS");
}

let target = null;
let envDir = null;

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--dir" && i + 1 < process.argv.length) {
    envDir = process.argv[++i];
  } else if (!process.argv[i].startsWith("--")) {
    target = process.argv[i];
  }
}

if (!target) {
  console.error("Usage: node assert-vite-target.mjs <primary|staging> [--dir <path>]");
  process.exit(1);
}

assertTarget(target, envDir);
