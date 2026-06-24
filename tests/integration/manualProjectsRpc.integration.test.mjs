/**
 * RPC-MANUAL-PROJECTS-TEST-1: Integration testing for manual_projects sync
 * via create_resume_full and save_resume_full.
 *
 * Requires environment variables:
 *   VITE_SUPABASE_URL       — Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  — anon/public key
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key (for user management + cleanup only)
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... node tests/integration/manualProjectsRpc.integration.test.mjs
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("BLOCKED: SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

const TEST_PREFIX = `cvbuilder-mp-test-${Date.now()}`;
const password = `P_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createdResumeIds = [];
const createdUserIds = [];
const results = [];
function rec(suite, name, status, detail = "") { results.push({ suite, name, status, detail }); }

async function countManualProjects(client, resumeId) {
  const { data, error } = await client.from("manual_projects")
    .select("id, source_id, name, role, description, tech_stack, link, period, position")
    .eq("resume_id", resumeId)
    .order("position");
  if (error) throw error;
  return data;
}

async function getResumeData(client, resumeId) {
  const { data, error } = await client.from("resumes").select("data,revision").eq("id", resumeId).single();
  if (error) throw error;
  return data;
}

// ── Setup ────────────────────────────────────────────────

let adminClient, clientA, clientB;

before(async () => {
  adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const emails = [`${TEST_PREFIX}-a@t.i`, `${TEST_PREFIX}-b@t.i`];
  const clients = [];

  for (const email of emails) {
    const { data, error } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true });
    assert.equal(error, null, `createUser: ${error?.message}`);
    createdUserIds.push(data.user.id);
    clients.push(createClient(SUPABASE_URL, ANON_KEY));
  }
  [clientA, clientB] = clients;

  for (const [c, e] of [[clientA, emails[0]], [clientB, emails[1]]]) {
    const { error } = await c.auth.signInWithPassword({ email: e, password });
    assert.equal(error, null, `signIn: ${error?.message}`);
  }
});

async function cleanup() {
  for (const rid of createdResumeIds) {
    try { await adminClient.from("manual_projects").delete().eq("resume_id", rid); } catch { /* ignore */ }
    try { await adminClient.from("resumes").delete().eq("id", rid); } catch { /* ignore */ }
    for (const t of ["skills", "education", "experience", "github_projects"]) {
      try { await adminClient.from(t).delete().eq("resume_id", rid); } catch { /* ignore */ }
    }
  }
  for (const uid of createdUserIds) {
    try { await adminClient.from("profiles").delete().eq("user_id", uid); } catch { /* ignore */ }
    try { await adminClient.auth.admin.deleteUser(uid); } catch { /* ignore */ }
  }
}

after(async () => { await cleanup(); });

// ── Fixtures ─────────────────────────────────────────────

const PROJECT_ALPHA = {
  id: "proj_test_alpha", name: "Alpha", role: "Developer",
  description: "Alpha description", techStack: "React, PostgreSQL",
  link: "https://example.invalid/alpha", period: "2025–2026",
};
const PROJECT_BETA = {
  id: "proj_test_beta", name: "Beta", role: "Designer",
  description: "Beta description", techStack: "Figma, CSS",
  link: "https://example.invalid/beta", period: "2024–2025",
};
const PROJECT_GAMMA = {
  id: "proj_test_gamma", name: "Gamma", role: "DevOps",
  description: "Gamma description", techStack: "Docker, K8s",
  link: "https://example.invalid/gamma", period: "2023–2024",
};

// ── A. Create with two projects ──────────────────────────

const resumeA1 = crypto.randomUUID();
createdResumeIds.push(resumeA1);

describe("A. Create syncs manual_projects", () => {
  it("create with two projects succeeds", async () => {
    const { data, error } = await clientA.rpc("create_resume_full", {
      p_resume_id: resumeA1, p_title: "MP Test A1", p_template: "minimalist",
      p_data: { projects: [PROJECT_ALPHA, PROJECT_BETA], template: "minimalist" },
    });
    assert.equal(error, null, error?.message);
    const row = Array.isArray(data) ? data[0] : data;
    assert.equal(row.out_resume_id, resumeA1);
    assert.equal(row.out_revision, 1);
    rec("Create", "create with projects", "PASS");
  });

  it("manual_projects rows = 2", async () => {
    const rows = await countManualProjects(clientA, resumeA1);
    assert.equal(rows.length, 2);
    rec("Create", "row count", "PASS");
  });

  it("positions are 0 and 1", async () => {
    const rows = await countManualProjects(clientA, resumeA1);
    assert.equal(rows[0].position, 0);
    assert.equal(rows[1].position, 1);
    rec("Create", "positions", "PASS");
  });

  it("source_id mapped correctly", async () => {
    const rows = await countManualProjects(clientA, resumeA1);
    assert.equal(rows[0].source_id, "proj_test_alpha");
    assert.equal(rows[1].source_id, "proj_test_beta");
    rec("Create", "source_id", "PASS");
  });

  it("fields mapped correctly", async () => {
    const rows = await countManualProjects(clientA, resumeA1);
    const a = rows[0];
    assert.equal(a.name, "Alpha");
    assert.equal(a.role, "Developer");
    assert.equal(a.description, "Alpha description");
    assert.equal(a.tech_stack, "React, PostgreSQL");
    assert.equal(a.link, "https://example.invalid/alpha");
    assert.equal(a.period, "2025–2026");
    rec("Create", "field mapping", "PASS");
  });

  it("UUID PK is valid and different from source_id", async () => {
    const rows = await countManualProjects(clientA, resumeA1);
    for (const r of rows) {
      assert.ok(r.id, "PK exists");
      assert.match(r.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, "PK is UUID");
      assert.notEqual(r.id, r.source_id, "PK != source_id");
    }
    rec("Create", "UUID PK", "PASS");
  });

  it("JSON/table parity", async () => {
    const resumeData = await getResumeData(clientA, resumeA1);
    const rows = await countManualProjects(clientA, resumeA1);
    assert.equal(resumeData.data.projects.length, rows.length);
    for (let i = 0; i < rows.length; i++) {
      assert.equal(rows[i].name, resumeData.data.projects[i].name);
      assert.equal(rows[i].source_id, resumeData.data.projects[i].id);
    }
    rec("Create", "JSON/table parity", "PASS");
  });
});

// ── B. Save replaces projection ──────────────────────────

describe("B. Save replaces manual_projects", () => {
  it("save with new projects array", async () => {
    const { data, error } = await clientA.rpc("save_resume_full", {
      p_resume_id: resumeA1, p_title: "MP Test A1", p_template: "minimalist",
      p_data: { projects: [PROJECT_GAMMA, { ...PROJECT_ALPHA, description: "Alpha updated" }], template: "minimalist" },
      p_expected_revision: 1,
    });
    assert.equal(error, null, error?.message);
    const row = Array.isArray(data) ? data[0] : data;
    assert.equal(row.out_revision, 2);
    rec("Save", "save success", "PASS");
  });

  it("rows = 2, old removed, new present", async () => {
    const rows = await countManualProjects(clientA, resumeA1);
    assert.equal(rows.length, 2);
    const names = rows.map((r) => r.name);
    assert.ok(names.includes("Gamma"), "Gamma present");
    assert.ok(names.includes("Alpha"), "Alpha present");
    assert.ok(!names.includes("Beta"), "Beta removed");
    rec("Save", "replacement", "PASS");
  });

  it("new order: Gamma=0, Alpha=1", async () => {
    const rows = await countManualProjects(clientA, resumeA1);
    assert.equal(rows[0].name, "Gamma");
    assert.equal(rows[0].position, 0);
    assert.equal(rows[1].name, "Alpha");
    assert.equal(rows[1].position, 1);
    rec("Save", "order", "PASS");
  });

  it("updated Alpha fields persisted", async () => {
    const rows = await countManualProjects(clientA, resumeA1);
    const alpha = rows.find((r) => r.name === "Alpha");
    assert.equal(alpha.description, "Alpha updated");
    rec("Save", "field update", "PASS");
  });
});

// ── C. Empty array clears ────────────────────────────────

describe("C. Empty array", () => {
  it("save with empty projects clears derived rows", async () => {
    const { error } = await clientA.rpc("save_resume_full", {
      p_resume_id: resumeA1, p_title: "MP Test A1", p_template: "minimalist",
      p_data: { projects: [], template: "minimalist" },
      p_expected_revision: 2,
    });
    assert.equal(error, null, error?.message);
    const rows = await countManualProjects(clientA, resumeA1);
    assert.equal(rows.length, 0);
    const resumeData = await getResumeData(clientA, resumeA1);
    assert.equal(resumeData.data.projects.length, 0);
    rec("Save", "empty array clears", "PASS");
  });
});

// ── D. Projects absent / null ────────────────────────────

const resumeA2 = crypto.randomUUID();
createdResumeIds.push(resumeA2);

describe("D. Missing/null projects", () => {
  it("create with projects key absent", async () => {
    const { error } = await clientA.rpc("create_resume_full", {
      p_resume_id: resumeA2, p_title: "MP Test A2", p_template: "minimalist",
      p_data: { template: "minimalist" },
    });
    assert.equal(error, null, error?.message);
    const rows = await countManualProjects(clientA, resumeA2);
    assert.equal(rows.length, 0);
    rec("Create", "projects absent", "PASS");
  });

  it("save with projects = null", async () => {
    const { error } = await clientA.rpc("save_resume_full", {
      p_resume_id: resumeA2, p_title: "MP Test A2", p_template: "minimalist",
      p_data: { projects: null, template: "minimalist" },
      p_expected_revision: 1,
    });
    assert.equal(error, null, error?.message);
    const rows = await countManualProjects(clientA, resumeA2);
    assert.equal(rows.length, 0);
    rec("Save", "projects null", "PASS");
  });
});

// ── E. Nullable source_id ────────────────────────────────

const resumeA3 = crypto.randomUUID();
createdResumeIds.push(resumeA3);

describe("E. Nullable source_id", () => {
  it("projects without id → source_id = NULL", async () => {
    const { error } = await clientA.rpc("create_resume_full", {
      p_resume_id: resumeA3, p_title: "MP Test A3", p_template: "minimalist",
      p_data: {
        projects: [
          { name: "NoId1", description: "first" },
          { name: "NoId2", description: "second" },
        ],
        template: "minimalist",
      },
    });
    assert.equal(error, null, error?.message);
    const rows = await countManualProjects(clientA, resumeA3);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].source_id, null);
    assert.equal(rows[1].source_id, null);
    assert.equal(rows[0].position, 0);
    assert.equal(rows[1].position, 1);
    rec("Create", "nullable source_id", "PASS");
  });
});

// ── F. Malformed container ───────────────────────────────

const resumeA4 = crypto.randomUUID();
createdResumeIds.push(resumeA4);

describe("F. Malformed projects container", () => {
  it("projects = {} → P1002", async () => {
    const { error } = await clientA.rpc("create_resume_full", {
      p_resume_id: resumeA4, p_title: "X", p_template: "minimalist",
      p_data: { projects: {}, template: "minimalist" },
    });
    assert.notEqual(error, null);
    assert.equal(error.code, "P1002");
    rec("Create", "object projects rejected", "PASS");
  });

  it("projects = 'string' → P1002", async () => {
    const rid = crypto.randomUUID();
    createdResumeIds.push(rid);
    const { error } = await clientA.rpc("create_resume_full", {
      p_resume_id: rid, p_title: "X", p_template: "minimalist",
      p_data: { projects: "string", template: "minimalist" },
    });
    assert.notEqual(error, null);
    assert.equal(error.code, "P1002");
    rec("Create", "string projects rejected", "PASS");
  });

  it("projects = 123 → P1002", async () => {
    const rid = crypto.randomUUID();
    createdResumeIds.push(rid);
    const { error } = await clientA.rpc("create_resume_full", {
      p_resume_id: rid, p_title: "X", p_template: "minimalist",
      p_data: { projects: 123, template: "minimalist" },
    });
    assert.notEqual(error, null);
    assert.equal(error.code, "P1002");
    rec("Create", "number projects rejected", "PASS");
  });
});

// ── G. Revision conflict ─────────────────────────────────

describe("G. Revision conflict", () => {
  it("save with stale revision → P1005", async () => {
    const { data: revData } = await clientA.from("resumes").select("revision").eq("id", resumeA3).single();
    const staleRev = revData.revision;
    const { error } = await clientA.rpc("save_resume_full", {
      p_resume_id: resumeA3, p_title: "X", p_template: "minimalist",
      p_data: { projects: [PROJECT_ALPHA], template: "minimalist" },
      p_expected_revision: staleRev - 1 || 999999,
    });
    assert.notEqual(error, null);
    assert.equal(error.code, "P1005");
    const rows = await countManualProjects(clientA, resumeA3);
    assert.equal(rows.length, 2, "manual_projects unchanged");
    rec("Save", "revision conflict preserves rows", "PASS");
  });
});

// ── H. Cross-user RPC isolation ──────────────────────────

describe("H. Cross-user RPC isolation", () => {
  it("User B cannot save User A resume → P1004", async () => {
    const { error } = await clientB.rpc("save_resume_full", {
      p_resume_id: resumeA1, p_title: "X", p_template: "minimalist",
      p_data: { projects: [], template: "minimalist" },
      p_expected_revision: 2,
    });
    assert.notEqual(error, null);
    assert.equal(error.code, "P1004");
    rec("Isolation", "cross-user save denied", "PASS");
  });

  it("User B cannot create with User A UUID", async () => {
    const { error } = await clientB.rpc("create_resume_full", {
      p_resume_id: resumeA1, p_title: "X", p_template: "minimalist",
      p_data: { projects: [], template: "minimalist" },
    });
    assert.notEqual(error, null);
    rec("Isolation", "cross-user create denied", "PASS");
  });
});

// ── I. Multi-resume isolation ────────────────────────────

describe("I. Multi-resume isolation", () => {
  it("save A1 does not affect A3", async () => {
    const rowsA3Before = await countManualProjects(clientA, resumeA3);
    const { data: revData } = await clientA.from("resumes").select("revision").eq("id", resumeA1).single();
    const { error } = await clientA.rpc("save_resume_full", {
      p_resume_id: resumeA1, p_title: "MP Test A1", p_template: "minimalist",
      p_data: { projects: [PROJECT_ALPHA], template: "minimalist" },
      p_expected_revision: revData.revision,
    });
    assert.equal(error, null, error?.message);
    const rowsA3After = await countManualProjects(clientA, resumeA3);
    assert.deepEqual(rowsA3Before, rowsA3After, "A3 unchanged");
    rec("Isolation", "multi-resume", "PASS");
  });
});

// ── J. Create idempotency ────────────────────────────────

describe("J. Create idempotency", () => {
  it("same UUID returns existing, no duplicate rows", async () => {
    const countBefore = (await countManualProjects(clientA, resumeA1)).length;
    const { data: revData } = await clientA.from("resumes").select("revision").eq("id", resumeA1).single();
    const currentRev = revData.revision;
    const { data, error } = await clientA.rpc("create_resume_full", {
      p_resume_id: resumeA1, p_title: "X", p_template: "minimalist",
      p_data: { projects: [PROJECT_GAMMA], template: "minimalist" },
    });
    assert.equal(error, null, error?.message);
    const row = Array.isArray(data) ? data[0] : data;
    assert.equal(row.out_revision, currentRev, "revision unchanged");
    const countAfter = (await countManualProjects(clientA, resumeA1)).length;
    assert.equal(countAfter, countBefore, "no duplicate rows");
    rec("Idempotency", "same UUID safe", "PASS");
  });
});

// ── K. Delete cascade ────────────────────────────────────

describe("K. Delete cascade", () => {
  it("deleting resume cascades to manual_projects", async () => {
    const rid = crypto.randomUUID();
    createdResumeIds.push(rid);
    await clientA.rpc("create_resume_full", {
      p_resume_id: rid, p_title: "Cascade test", p_template: "minimalist",
      p_data: { projects: [PROJECT_ALPHA, PROJECT_BETA], template: "minimalist" },
    });
    const before = (await countManualProjects(clientA, rid)).length;
    assert.equal(before, 2);
    const { error } = await adminClient.from("resumes").delete().eq("id", rid);
    assert.equal(error, null);
    const after = (await countManualProjects(adminClient, rid)).length;
    assert.equal(after, 0, "manual_projects cascaded");
    const idx = createdResumeIds.indexOf(rid);
    if (idx !== -1) createdResumeIds.splice(idx, 1);
    rec("Cascade", "delete cascades", "PASS");
  });
});

// ── L. Anon direct access ────────────────────────────────

describe("L. Anon direct access denied", () => {
  it("anon cannot SELECT manual_projects", async () => {
    const anonClient = createClient(SUPABASE_URL, ANON_KEY);
    const { error } = await anonClient.from("manual_projects").select("*").limit(1);
    assert.notEqual(error, null);
    rec("RLS", "anon SELECT denied", "PASS");
  });

  it("anon cannot INSERT manual_projects", async () => {
    const anonClient = createClient(SUPABASE_URL, ANON_KEY);
    const { error } = await anonClient.from("manual_projects").insert({
      resume_id: resumeA1, name: "x", position: 0,
    });
    assert.notEqual(error, null);
    rec("RLS", "anon INSERT denied", "PASS");
  });
});

// ── M. Owner direct access ───────────────────────────────

describe("M. Owner direct write via Data API", () => {
  it("owner can INSERT manual_projects directly", async () => {
    const { error } = await clientA.from("manual_projects").insert({
      resume_id: resumeA3, name: "DirectInsert", position: 99,
    });
    if (error) {
      rec("RLS", "owner direct INSERT", "PASS", "DENIED (expected for derived mirror)");
    } else {
      const rows = await countManualProjects(clientA, resumeA3);
      const direct = rows.find((r) => r.name === "DirectInsert");
      assert.ok(direct, "direct insert row exists");
      await adminClient.from("manual_projects").delete().eq("id", direct.id);
      rec("RLS", "owner direct INSERT", "PASS", "ALLOWED (owner_direct_write_exposure)");
    }
  });

  it("owner can DELETE own manual_projects directly", async () => {
    await clientA.from("manual_projects").insert({
      resume_id: resumeA3, name: "DirectDel", position: 98,
    });
    const rows = await countManualProjects(clientA, resumeA3);
    const target = rows.find((r) => r.name === "DirectDel");
    if (target) {
      const { error } = await clientA.from("manual_projects").delete().eq("id", target.id);
      if (error) {
        rec("RLS", "owner direct DELETE", "PASS", "DENIED");
      } else {
        rec("RLS", "owner direct DELETE", "PASS", "ALLOWED (owner_direct_write_exposure)");
      }
    } else {
      rec("RLS", "owner direct DELETE", "PASS", "insert failed first");
    }
  });

  it("User B cannot INSERT into User A manual_projects", async () => {
    const { error } = await clientB.from("manual_projects").insert({
      resume_id: resumeA1, name: "Evil", position: 0,
    });
    assert.notEqual(error, null);
    rec("RLS", "cross-user direct INSERT denied", "PASS");
  });
});

// ── Summary ──────────────────────────────────────────────

after(() => {
  console.log("\n=== MANUAL-PROJECTS-RPC-TEST-1 RESULTS ===\n");
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
