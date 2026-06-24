#!/usr/bin/env node
/**
 * Build-time environment validation.
 * Validates only VITE_* public browser variables.
 * Exits non-zero on missing/invalid config.
 * Never prints variable values.
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

const mode = process.argv.includes("--mode") 
  ? process.argv[process.argv.indexOf("--mode") + 1] 
  : "development";

const root = resolve(process.cwd());
const envFile = mode === "production" 
  ? resolve(root, ".env.production") 
  : resolve(root, ".env");

const envVars = loadEnvFile(envFile) || {};
const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const missing = required.filter((k) => !envVars[k] || envVars[k].trim() === "");

if (missing.length > 0) {
  console.error(`[env:check] Missing required variables for mode "${mode}": ${missing.join(", ")}`);
  process.exit(1);
}

if (envVars.VITE_SUPABASE_ANON_KEY && envVars.VITE_SUPABASE_ANON_KEY.startsWith("sb_secret_")) {
  console.error("[env:check] VITE_SUPABASE_ANON_KEY must not be a service-role key");
  process.exit(1);
}

console.log(`[env:check] mode="${mode}" — ${required.length} required variables present, validation passed`);
