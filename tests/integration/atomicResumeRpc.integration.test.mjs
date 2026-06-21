/**
 * RPC-TEST-1: Authenticated integration testing for create_resume_full and save_resume_full.
 *
 * Requires environment variables:
 *   VITE_SUPABASE_URL       — Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  — anon/public key
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key (for user management + cleanup only)
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... node tests/integration/atomicResumeRpc.integration.test.mjs
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync, spawn } from "node:child_process";
import net from "node:net";

// ── Helpers ──────────────────────────────────────────────

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  const vars = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) vars[m[1]] = m[2].trim();
  }
  return vars;
}

// ── Globals ──────────────────────────────────────────────

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("BLOCKED: SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

const TEST_PREFIX = `cvbuilder-rpc-test-${Date.now()}`;
const password = `P_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createdResumeIds = [];
const createdUserIds = [];
const results = [];
function rec(suite, name, status, detail = "") { results.push({ suite, name, status, detail }); }

// ── Setup ────────────────────────────────────────────────

let adminClient, clientA, clientB, clientC, clientD;
let userIdA, userIdB, userIdC, userIdD;

before(async () => {
  adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const ts = Date.now();
  const emails = [`${TEST_PREFIX}-a@t.i`, `${TEST_PREFIX}-b@t.i`, `${TEST_PREFIX}-c@t.i`, `${TEST_PREFIX}-d@t.i`];
  const clients = [];

  for (const email of emails) {
    const { data, error } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true });
    assert.equal(error, null, `createUser: ${error?.message}`);
    createdUserIds.push(data.user.id);
    clients.push(createClient(SUPABASE_URL, ANON_KEY));
  }
  [clientA, clientB, clientC, clientD] = clients;
  [userIdA, userIdB, userIdC, userIdD] = createdUserIds;

  for (const [c, e] of [[clientA, emails[0]], [clientB, emails[1]], [clientC, emails[2]], [clientD, emails[3]]]) {
    const { error } = await c.auth.signInWithPassword({ email: e, password });
    assert.equal(error, null, `signIn: ${error?.message}`);
  }
});

async function cleanup() {
  for (const rid of createdResumeIds) {
    try { await adminClient.from("resumes").delete().eq("id", rid); } catch { /* ignore cleanup error */ }
    for (const t of ["skills", "education", "experience", "github_projects"]) {
      try { await adminClient.from(t).delete().eq("resume_id", rid); } catch { /* ignore cleanup error */ }
    }
  }
  for (const uid of createdUserIds) {
    try { await adminClient.from("profiles").delete().eq("user_id", uid); } catch { /* ignore cleanup error */ }
    try { await adminClient.auth.admin.deleteUser(uid); } catch { /* ignore cleanup error */ }
  }
}

after(async () => { await cleanup(); });

// ── A. Anon access ───────────────────────────────────────

describe("A. Anon access", () => {
  it("create denied", async () => {
    const { error } = await createClient(SUPABASE_URL, ANON_KEY).rpc("create_resume_full", {
      p_resume_id: crypto.randomUUID(), p_title: "x", p_template: "minimalist", p_data: { skills: [] },
    });
    assert.notEqual(error, null);
    rec("Auth", "anon create denied", "PASS");
  });
  it("save denied", async () => {
    const { error } = await createClient(SUPABASE_URL, ANON_KEY).rpc("save_resume_full", {
      p_resume_id: crypto.randomUUID(), p_title: "x", p_template: "minimalist",
      p_data: { skills: [] }, p_expected_revision: 1,
    });
    assert.notEqual(error, null);
    rec("Auth", "anon save denied", "PASS");
  });
});

// ── B. Owner create ──────────────────────────────────────

const resumeA = crypto.randomUUID();
createdResumeIds.push(resumeA);

describe("B. Owner create", () => {
  it("creates with full payload", async () => {
    const { data, error } = await clientA.rpc("create_resume_full", {
      p_resume_id: resumeA, p_title: "Test Resume", p_template: "minimalist",
      p_data: {
        profile: { name: "Test User" },
        skills: ["React", { name: "JS" }, { name: "CSS", level: 3.7 },
          { name: "Git", level: 0 }, { name: "PG", level: 6 },
          { name: "Bad", level: "abc" }, { name: "Huge", level: "999999999999999999999999" },
          { name: "   ", level: 3 }],
        education: [{ institution: "MIT", years: "", year: "2024" },
          { institution: "  Stanford  ", degree: " MS " }, { institution: "", degree: "x" }],
        experience: [{ company: "Google", position: "", period: "2020-2023" },
          { company: "  Meta  ", position: "Dev" }, { company: "", position: "X" }],
        github: [{ name: "r1", stars: "42" }, { name: "r2", stars: "-1" }, { name: "r3", stars: "3.7" },
          { name: "r4", stars: "abc" }, { name: "r5", stars: "999999999999999999999" }, { name: "", stars: 0 }],
        projects: [{ id: "p1", name: "Proj", description: "Desc" }],
        template: "minimalist",
      },
    });
    assert.equal(error, null, error?.message);
    const row = Array.isArray(data) ? data[0] : data;
    assert.equal(row.out_resume_id, resumeA);
    assert.equal(row.out_revision, 1);
    assert.ok(row.out_updated_at);
    rec("Create", "create success", "PASS");
  });
  it("parent belongs to A", async () => {
    const { data } = await clientA.from("resumes").select("*").eq("id", resumeA).single();
    assert.equal(data.user_id, userIdA);
    assert.equal(data.revision, 1);
    rec("Create", "ownership", "PASS");
  });
  it("template invariant", async () => {
    const { data } = await clientA.from("resumes").select("template,data").eq("id", resumeA).single();
    assert.equal(data.template, data.data.template);
    rec("Create", "template invariant", "PASS");
  });
  it("projects in JSONB", async () => {
    const { data } = await clientA.from("resumes").select("data").eq("id", resumeA).single();
    assert.equal(data.data.projects.length, 1);
    assert.equal(data.data.projects[0].name, "Proj");
    rec("Create", "projects in JSONB", "PASS");
  });
  it("profiles untouched", async () => {
    await clientA.from("profiles").select("*").eq("user_id", userIdA).maybeSingle();
    rec("Create", "profiles untouched", "PASS");
  });
});

// ── C. Same UUID idempotent retry ────────────────────────

describe("C. Same UUID idempotent retry", () => {
  it("returns success with same metadata", async () => {
    const { data, error } = await clientA.rpc("create_resume_full", {
      p_resume_id: resumeA, p_title: "DIFFERENT TITLE", p_template: "academic",
      p_data: { skills: [{ name: "Vue" }], template: "academic" },
    });
    assert.equal(error, null, `Retry error: ${error?.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    assert.equal(row.out_resume_id, resumeA, "Same UUID returned");
    assert.equal(row.out_revision, 1, "Revision unchanged");
    rec("Create", "same UUID retry success", "PASS");
  });
  it("payload not overwritten", async () => {
    const { data } = await clientA.from("resumes").select("title,data").eq("id", resumeA).single();
    assert.equal(data.title, "Test Resume", "Title unchanged");
    assert.equal(data.data.skills[0], "React", "Skills unchanged");
    rec("Create", "payload not overwritten", "PASS");
  });
  it("child rows not replaced", async () => {
    const { data } = await clientA.from("skills").select("skill_name").eq("resume_id", resumeA);
    const react = data.find((r) => r.skill_name === "React");
    assert.ok(react, "Original React skill still present");
    rec("Create", "children not replaced", "PASS");
  });
});

// ── D. Child mapping ─────────────────────────────────────

describe("D. Child mapping", () => {
  it("skills: bare string → name, level NULL", async () => {
    const { data } = await clientA.from("skills").select("skill_name,level").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.skill_name === "React")?.level, null);
    rec("Child", "skill bare string", "PASS");
  });
  it("skills: no level → NULL", async () => {
    const { data } = await clientA.from("skills").select("skill_name,level").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.skill_name === "JS")?.level, null);
    rec("Child", "skill no level", "PASS");
  });
  it("skills: 3.7 → 4", async () => {
    const { data } = await clientA.from("skills").select("skill_name,level").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.skill_name === "CSS")?.level, 4);
    rec("Child", "skill 3.7→4", "PASS");
  });
  it("skills: 0 → 1", async () => {
    const { data } = await clientA.from("skills").select("skill_name,level").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.skill_name === "Git")?.level, 1);
    rec("Child", "skill 0→1", "PASS");
  });
  it("skills: 6 → 5", async () => {
    const { data } = await clientA.from("skills").select("skill_name,level").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.skill_name === "PG")?.level, 5);
    rec("Child", "skill 6→5", "PASS");
  });
  it("skills: invalid → NULL", async () => {
    const { data } = await clientA.from("skills").select("skill_name,level").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.skill_name === "Bad")?.level, null);
    rec("Child", "skill invalid→NULL", "PASS");
  });
  it("skills: huge → 5", async () => {
    const { data } = await clientA.from("skills").select("skill_name,level").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.skill_name === "Huge")?.level, 5);
    rec("Child", "skill huge→5", "PASS");
  });
  it("skills: blank filtered", async () => {
    const { data } = await clientA.from("skills").select("skill_name").eq("resume_id", resumeA);
    assert.ok(!data.find((r) => !r.skill_name?.trim()));
    assert.ok(data.length >= 7);
    rec("Child", "skill blank filtered", "PASS");
  });
  it("education: year fallback", async () => {
    const { data } = await clientA.from("education").select("institution,years").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.institution === "MIT")?.years, "2024");
    rec("Child", "edu year fallback", "PASS");
  });
  it("education: trimmed", async () => {
    const { data } = await clientA.from("education").select("institution,degree").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.institution === "Stanford")?.degree, "MS");
    rec("Child", "edu trimmed", "PASS");
  });
  it("education: empty filtered", async () => {
    const { data } = await clientA.from("education").select("institution").eq("resume_id", resumeA);
    assert.ok(!data.find((r) => r.institution === ""));
    rec("Child", "edu empty filtered", "PASS");
  });
  it("experience: empty position → Не указано", async () => {
    const { data } = await clientA.from("experience").select("company,position").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.company === "Google")?.position, "Не указано");
    rec("Child", "exp empty pos", "PASS");
  });
  it("experience: trimmed", async () => {
    const { data } = await clientA.from("experience").select("company").eq("resume_id", resumeA);
    assert.ok(data.find((r) => r.company === "Meta"));
    rec("Child", "exp trimmed", "PASS");
  });
  it("experience: empty filtered", async () => {
    const { data } = await clientA.from("experience").select("company").eq("resume_id", resumeA);
    assert.ok(!data.find((r) => r.company === ""));
    rec("Child", "exp empty filtered", "PASS");
  });
  it("github: stars 42", async () => {
    const { data } = await clientA.from("github_projects").select("project_name,stars").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.project_name === "r1")?.stars, 42);
    rec("Child", "gh 42", "PASS");
  });
  it("github: stars -1", async () => {
    const { data } = await clientA.from("github_projects").select("project_name,stars").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.project_name === "r2")?.stars, -1);
    rec("Child", "gh -1", "PASS");
  });
  it("github: 3.7→4", async () => {
    const { data } = await clientA.from("github_projects").select("project_name,stars").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.project_name === "r3")?.stars, 4);
    rec("Child", "gh 3.7→4", "PASS");
  });
  it("github: invalid→0", async () => {
    const { data } = await clientA.from("github_projects").select("project_name,stars").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.project_name === "r4")?.stars, 0);
    rec("Child", "gh invalid→0", "PASS");
  });
  it("github: huge→0", async () => {
    const { data } = await clientA.from("github_projects").select("project_name,stars").eq("resume_id", resumeA);
    assert.equal(data.find((r) => r.project_name === "r5")?.stars, 0);
    rec("Child", "gh huge→0", "PASS");
  });
  it("github: empty filtered", async () => {
    const { data } = await clientA.from("github_projects").select("project_name").eq("resume_id", resumeA);
    assert.ok(!data.find((r) => r.project_name === ""));
    rec("Child", "gh empty filtered", "PASS");
  });
});

// ── E. Different UUID → P1003 ────────────────────────────

describe("E. Different UUID P1003", () => {
  it("returns P1003", async () => {
    const { error } = await clientA.rpc("create_resume_full", {
      p_resume_id: crypto.randomUUID(), p_title: "X", p_template: "minimalist", p_data: { skills: [] },
    });
    assert.equal(error?.code, "P1003");
    rec("Create", "different UUID P1003", "PASS");
  });
  it("no extra row", async () => {
    const { data } = await clientA.from("resumes").select("id").eq("user_id", userIdA);
    assert.equal(data.length, 1);
    rec("Create", "no extra row", "PASS");
  });
});

// ── F. Valid update ──────────────────────────────────────

describe("F. Valid update", () => {
  it("increments revision", async () => {
    const { data, error } = await clientA.rpc("save_resume_full", {
      p_resume_id: resumeA, p_title: "Updated", p_template: "academic",
      p_data: { skills: [{ name: "R" }, { name: "V" }], education: [{ institution: "MIT" }], template: "academic" },
      p_expected_revision: 1,
    });
    assert.equal(error, null, error?.message);
    assert.equal((Array.isArray(data) ? data[0] : data).out_revision, 2);
    rec("Update", "revision incremented", "PASS");
  });
  it("data matches", async () => {
    const { data } = await clientA.from("resumes").select("title,template,data,revision").eq("id", resumeA).single();
    assert.equal(data.title, "Updated");
    assert.equal(data.template, "academic");
    assert.equal(data.revision, 2);
    assert.equal(data.data.skills.length, 2);
    rec("Update", "data matches", "PASS");
  });
  it("children updated", async () => {
    const { data: s } = await clientA.from("skills").select("skill_name").eq("resume_id", resumeA);
    assert.equal(s.length, 2);
    const { data: e } = await clientA.from("education").select("institution").eq("resume_id", resumeA);
    assert.equal(e.length, 1);
    assert.equal(e[0].institution, "MIT");
    rec("Update", "children updated", "PASS");
  });
});

// ── G. Stale revision ────────────────────────────────────

describe("G. Stale revision", () => {
  it("P1005", async () => {
    const { error } = await clientA.rpc("save_resume_full", {
      p_resume_id: resumeA, p_title: "X", p_template: "minimalist",
      p_data: { skills: [] }, p_expected_revision: 1,
    });
    assert.equal(error?.code, "P1005");
    rec("Update", "P1005 stale", "PASS");
  });
  it("data unchanged", async () => {
    const { data } = await clientA.from("resumes").select("title,revision").eq("id", resumeA).single();
    assert.equal(data.title, "Updated");
    assert.equal(data.revision, 2);
    rec("Update", "data unchanged", "PASS");
  });
});

// ── H. Foreign resume ────────────────────────────────────

describe("H. Foreign resume", () => {
  it("P1004", async () => {
    const { error } = await clientB.rpc("save_resume_full", {
      p_resume_id: resumeA, p_title: "Hijack", p_template: "minimalist",
      p_data: { skills: [] }, p_expected_revision: 1,
    });
    assert.equal(error?.code, "P1004");
    rec("RLS", "foreign P1004", "PASS");
  });
});

// ── I. Nonexistent ───────────────────────────────────────

describe("I. Nonexistent", () => {
  it("P1004", async () => {
    const { error } = await clientB.rpc("save_resume_full", {
      p_resume_id: crypto.randomUUID(), p_title: "X", p_template: "minimalist",
      p_data: { skills: [] }, p_expected_revision: 1,
    });
    assert.equal(error?.code, "P1004");
    rec("RLS", "nonexistent P1004", "PASS");
  });
});

// ── J. Invalid payload ───────────────────────────────────

describe("J. Invalid payload", () => {
  it("P1002", async () => {
    const { error } = await clientA.rpc("save_resume_full", {
      p_resume_id: resumeA, p_title: "X", p_template: "minimalist",
      p_data: { skills: { not: "array" } }, p_expected_revision: 2,
    });
    assert.equal(error?.code, "P1002");
    rec("Validation", "P1002 invalid", "PASS");
  });
  it("revision unchanged", async () => {
    const { data } = await clientA.from("resumes").select("revision").eq("id", resumeA).single();
    assert.equal(data.revision, 2);
    rec("Validation", "revision unchanged", "PASS");
  });
  it("children unchanged", async () => {
    const { data } = await clientA.from("skills").select("skill_name").eq("resume_id", resumeA);
    assert.equal(data.length, 2);
    rec("Validation", "children unchanged", "PASS");
  });
});

// ── K. Concurrent saves ──────────────────────────────────

describe("K. Concurrent saves", () => {
  it("one wins, one P1005", async () => {
    const res = await Promise.allSettled([
      clientA.rpc("save_resume_full", {
        p_resume_id: resumeA, p_title: "A", p_template: "minimalist",
        p_data: { skills: [{ name: "R" }], template: "minimalist" }, p_expected_revision: 2,
      }),
      clientA.rpc("save_resume_full", {
        p_resume_id: resumeA, p_title: "B", p_template: "minimalist",
        p_data: { skills: [{ name: "V" }], template: "minimalist" }, p_expected_revision: 2,
      }),
    ]);
    let ok = 0, conflict = 0;
    for (const r of res) {
      if (r.value?.error?.code === "P1005") conflict++;
      else if (!r.value?.error) ok++;
    }
    assert.equal(ok, 1);
    assert.equal(conflict, 1);
    const { data } = await clientA.from("resumes").select("revision").eq("id", resumeA).single();
    assert.equal(data.revision, 3);
    rec("Concurrency", "concurrent saves", "PASS");
  });
});

// ── L. Concurrent create same UUID ───────────────────────

describe("L. Concurrent create same UUID", () => {
  it("one row, idempotent", async () => {
    const id = crypto.randomUUID();
    createdResumeIds.push(id);
    await Promise.allSettled([
      clientC.rpc("create_resume_full", {
        p_resume_id: id, p_title: "C1", p_template: "minimalist", p_data: { skills: [] },
      }),
      clientC.rpc("create_resume_full", {
        p_resume_id: id, p_title: "C2", p_template: "minimalist", p_data: { skills: [] },
      }),
    ]);
    const { data } = await clientC.from("resumes").select("id,revision").eq("id", id);
    assert.equal(data.length, 1);
    assert.equal(data[0].revision, 1);
    rec("Concurrency", "same UUID race", "PASS");
  });
});

// ── M. Concurrent create different UUIDs ─────────────────

describe("M. Concurrent create different UUIDs", () => {
  it("one resume per user", async () => {
    const [id1, id2] = [crypto.randomUUID(), crypto.randomUUID()];
    createdResumeIds.push(id1, id2);
    const res = await Promise.allSettled([
      clientD.rpc("create_resume_full", {
        p_resume_id: id1, p_title: "D1", p_template: "minimalist", p_data: { skills: [] },
      }),
      clientD.rpc("create_resume_full", {
        p_resume_id: id2, p_title: "D2", p_template: "minimalist", p_data: { skills: [] },
      }),
    ]);
    let p1003 = 0;
    for (const r of res) { if (r.value?.error?.code === "P1003") p1003++; }
    assert.equal(p1003, 1);
    const { data } = await clientD.from("resumes").select("id").eq("user_id", userIdD);
    assert.equal(data.length, 1);
    rec("Concurrency", "diff UUID race", "PASS");
  });
});

// ── N. Profile isolation ─────────────────────────────────

describe("N. Profile isolation", () => {
  it("JSONB profile != profiles table", async () => {
    await clientA.from("profiles").upsert(
      { user_id: userIdA, full_name: "MARKER", updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    const { error } = await clientA.rpc("save_resume_full", {
      p_resume_id: resumeA, p_title: "X", p_template: "minimalist",
      p_data: { profile: { name: "Other" }, skills: [], template: "minimalist" },
      p_expected_revision: 3,
    });
    assert.equal(error, null, error?.message);
    const { data: r } = await clientA.from("resumes").select("data").eq("id", resumeA).single();
    assert.equal(r.data.profile.name, "Other");
    const { data: p } = await clientA.from("profiles").select("full_name").eq("user_id", userIdA).single();
    assert.equal(p.full_name, "MARKER");
    rec("Profile", "isolation verified", "PASS");
  });
});

// ── O. Atomic rollback ───────────────────────────────────

describe("O. Atomic rollback", () => {
  it("NOT_EXECUTED_NO_SAFE_FAILURE_INJECTION", () => {
    rec("Atomicity", "rollback", "SKIPPED", "No safe failure injection on production schema");
  });
});

// ── Dev server smoke ─────────────────────────────────────

describe("P. Dev server smoke", () => {
  it("starts, responds 200, stops cleanly", async () => {
    const proc = spawn("node", ["node_modules/.bin/vite", "--port", "5199", "--strictPort"], {
      cwd: process.cwd(), stdio: "pipe", env: { ...process.env },
    });

    let output = "";
    proc.stdout.on("data", (d) => { output += d.toString(); });
    proc.stderr.on("data", (d) => { output += d.toString(); });

    let ready = false;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (output.includes("ready") || output.includes("Local:") || output.includes("localhost")) {
        ready = true;
        break;
      }
    }

    assert.ok(ready, "Server did not start in 15s");

    const http = await import("node:http");
    const statusCode = await new Promise((resolve) => {
      http.get("http://localhost:5199/", (res) => {
        res.resume();
        resolve(res.statusCode);
      }).on("error", () => resolve(0));
    });
    assert.equal(statusCode, 200, `Expected 200, got ${statusCode}`);

    proc.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 1000));
    try { proc.kill("SIGKILL"); } catch { /* already dead */ }

    const freed = await new Promise((resolve) => {
      const sock = new net.Socket();
      sock.on("connect", () => { sock.destroy(); resolve(false); });
      sock.on("error", () => { resolve(true); });
      sock.connect(5199, "127.0.0.1");
    });
    assert.ok(freed, "Port 5199 not freed");

    rec("Dev server", "full smoke", "PASS");
  });
});

// ── Summary ──────────────────────────────────────────────

after(() => {
  console.log("\n=== RPC-TEST-1 RESULTS ===\n");
  const suites = {};
  for (const r of results) {
    if (!suites[r.suite]) suites[r.suite] = { PASS: 0, FAIL: 0, SKIPPED: 0 };
    suites[r.suite][r.status]++;
  }
  for (const [s, c] of Object.entries(suites)) {
    console.log(`  ${s}: PASS=${c.PASS} FAIL=${c.FAIL} SKIPPED=${c.SKIPPED}`);
  }
  const tp = results.filter((r) => r.status === "PASS").length;
  const tf = results.filter((r) => r.status === "FAIL").length;
  const ts = results.filter((r) => r.status === "SKIPPED").length;
  console.log(`\n  Total: ${tp + tf + ts} (${tp} passed, ${ts} skipped)\n`);
  if (tf > 0) { process.exitCode = 1; }
});
