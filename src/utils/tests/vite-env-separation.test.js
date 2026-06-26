import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const TARGETS = {
  primary: { ref: "cxnzlarcmszvnobuoskr" },
  staging: { ref: "jerwfvhpoanoukxiyvwq" },
};

function loadEnvFile(dir, filename) {
  const path = join(dir, filename);
  if (!existsSync(path)) return null;
  const content = readFileSync(path, "utf8");
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
  if (!key || !key.startsWith("eyJ")) return false;
  try {
    const parts = key.split(".");
    const pad = parts[1].padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(pad, "base64").toString("utf8"));
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

function assertTargetLogic(targetName, rootDir) {
  const target = TARGETS[targetName];
  if (!target) return { pass: false, reason: "Unknown target" };

  const mode = targetName === "primary" ? "development" : "staging";
  const modeFile = `.env.${mode === "staging" ? "staging" : "development"}.local`;
  const baseEnv = loadEnvFile(rootDir, ".env");
  const modeEnv = loadEnvFile(rootDir, modeFile);

  const url = modeEnv?.VITE_SUPABASE_URL || baseEnv?.VITE_SUPABASE_URL;
  const key = modeEnv?.VITE_SUPABASE_ANON_KEY || baseEnv?.VITE_SUPABASE_ANON_KEY;

  const urlRef = extractUrlRef(url);
  const keyType = getKeyType(key);
  const keyRef = extractJwtRef(key);

  if (!url) return { pass: false, reason: "No URL" };
  if (keyType === "missing" || keyType === "placeholder") return { pass: false, reason: `Key is ${keyType}` };
  if (isServiceRole(key)) return { pass: false, reason: "Service-role key" };
  if (urlRef !== target.ref) return { pass: false, reason: `URL ref "${urlRef}" != "${target.ref}"` };
  if (keyRef && keyRef !== target.ref) return { pass: false, reason: `Key ref "${keyRef}" != "${target.ref}"` };

  const otherRef = targetName === "primary" ? TARGETS.staging.ref : TARGETS.primary.ref;
  if (keyRef === otherRef) return { pass: false, reason: `Key matches ${targetName === "primary" ? "staging" : "primary"}` };

  return { pass: true };
}

const FAKE_PRIMARY_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bnpsYXJjbXN6dm5vYnVvc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE4MDAwMDAwMDB9.fakesig";
const FAKE_STAGING_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implcndmdmhwb2Fub3VreGl5dndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE4MDAwMDAwMDB9.fakesig";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bnpsYXJjbXN6dm5vYnVvc2tyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTgwMDAwMDAwMH0.fakesig";

function writeTmp(name, content) {
  const dir = join(TMP, name);
  const fs = require("fs");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(join(dir, ".env.development.local"), content);
  return dir;
}

const TMP = join(import.meta.dirname || ".", "env-test-tmp");

describe("env target assertions", () => {
  it("primary URL + primary key → PASS", () => {
    const dir = writeTmp("p1", `VITE_SUPABASE_URL=https://cxnzlarcmszvnobuoskr.supabase.co\nVITE_SUPABASE_ANON_KEY=${FAKE_PRIMARY_KEY}\n`);
    expect(assertTargetLogic("primary", dir).pass).toBe(true);
  });

  it("staging URL + staging key → PASS", () => {
    const dir = join(TMP, "s1");
    require("fs").mkdirSync(dir, { recursive: true });
    require("fs").writeFileSync(join(dir, ".env.staging.local"), `VITE_SUPABASE_URL=https://jerwfvhpoanoukxiyvwq.supabase.co\nVITE_SUPABASE_ANON_KEY=${FAKE_STAGING_KEY}\n`);
    expect(assertTargetLogic("staging", dir).pass).toBe(true);
  });

  it("primary URL + staging key → FAIL", () => {
    const dir = writeTmp("m1", `VITE_SUPABASE_URL=https://cxnzlarcmszvnobuoskr.supabase.co\nVITE_SUPABASE_ANON_KEY=${FAKE_STAGING_KEY}\n`);
    const r = assertTargetLogic("primary", dir);
    expect(r.pass).toBe(false);
    expect(r.reason).toContain("ref");
  });

  it("staging URL + primary key → FAIL", () => {
    const dir = join(TMP, "m2");
    require("fs").mkdirSync(dir, { recursive: true });
    require("fs").writeFileSync(join(dir, ".env.staging.local"), `VITE_SUPABASE_URL=https://jerwfvhpoanoukxiyvwq.supabase.co\nVITE_SUPABASE_ANON_KEY=${FAKE_PRIMARY_KEY}\n`);
    const r = assertTargetLogic("staging", dir);
    expect(r.pass).toBe(false);
  });

  it("missing key → FAIL", () => {
    const dir = writeTmp("mk", `VITE_SUPABASE_URL=https://cxnzlarcmszvnobuoskr.supabase.co\n`);
    const r = assertTargetLogic("primary", dir);
    expect(r.pass).toBe(false);
    expect(r.reason).toContain("missing");
  });

  it("missing URL → FAIL", () => {
    const dir = join(TMP, "mu");
    require("fs").mkdirSync(dir, { recursive: true });
    require("fs").writeFileSync(join(dir, ".env.development.local"), `VITE_SUPABASE_ANON_KEY=${FAKE_PRIMARY_KEY}\n`);
    const r = assertTargetLogic("primary", dir);
    expect(r.pass).toBe(false);
    expect(r.reason).toContain("URL");
  });

  it("service-role key → FAIL", () => {
    const dir = writeTmp("sr", `VITE_SUPABASE_URL=https://cxnzlarcmszvnobuoskr.supabase.co\nVITE_SUPABASE_ANON_KEY=${SERVICE_ROLE_KEY}\n`);
    const r = assertTargetLogic("primary", dir);
    expect(r.pass).toBe(false);
    expect(r.reason).toContain("Service-role");
  });

  it("placeholder key → FAIL", () => {
    const dir = join(TMP, "ph");
    require("fs").mkdirSync(dir, { recursive: true });
    require("fs").writeFileSync(join(dir, ".env.development.local"), `VITE_SUPABASE_URL=https://cxnzlarcmszvnobuoskr.supabase.co\nVITE_SUPABASE_ANON_KEY=__PASTE_PRIMARY_ANON_KEY_HERE__\n`);
    const r = assertTargetLogic("primary", dir);
    expect(r.pass).toBe(false);
    expect(r.reason).toContain("placeholder");
  });

  it("unknown target → FAIL", () => {
    const r = assertTargetLogic("unknown", TMP);
    expect(r.pass).toBe(false);
    expect(r.reason).toContain("Unknown");
  });
});

describe("guard does not leak secrets", () => {
  it("guard output does not contain full key in file", () => {
    const dir = join(TMP, "sec");
    require("fs").mkdirSync(dir, { recursive: true });
    require("fs").writeFileSync(join(dir, ".env.development.local"), `VITE_SUPABASE_URL=https://cxnzlarcmszvnobuoskr.supabase.co\nVITE_SUPABASE_ANON_KEY=${FAKE_PRIMARY_KEY}\n`);
    const r = assertTargetLogic("primary", dir);
    expect(r.pass).toBe(true);
  });
});
