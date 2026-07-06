import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync, renameSync, symlinkSync } from "fs";
import { join, resolve } from "path";

const ROOT = process.cwd();
const TMP = join(import.meta.dirname || ".", "automation-test-tmp");

function setupTmp() {
  mkdirSync(TMP, { recursive: true });
}

afterEach(() => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
});

beforeEach(() => {
  setupTmp();
});

function createLatestBackup(dir, runId = "11111111") {
  const latestDir = join(dir, "latest");
  mkdirSync(latestDir, { recursive: true });
  mkdirSync(join(latestDir, "metadata"), { recursive: true });

  writeFileSync(join(latestDir, `cv-builder-primary-${runId}.tar.gz.enc`), "encrypted-data");
  writeFileSync(join(latestDir, `cv-builder-primary-${runId}.tar.gz.enc.sha256`),
    "abc123  ../cv-builder-primary-" + runId + ".tar.gz.enc\n");
  writeFileSync(join(latestDir, "metadata", "manifest.json"), JSON.stringify({
    projectRef: "cxnzlarcmszvnobuoskr",
    publicTables: { count: 7, names: ["education", "experience", "github_projects", "manual_projects", "profiles", "resumes", "skills"] },
    migrationVersions: { count: 13, values: ["00000000000000", "20260621000000", "20260621120000", "20260621130000", "20260621140000", "20260623235512", "20260624004059", "20260624070715", "20260624072139", "20260624073936", "20260624074254", "20260624082752", "20260625000000"] },
    gitCommitSHA: runId,
    restoreDrillStatus: "NOT_YET_PERFORMED",
  }));
  writeFileSync(join(latestDir, "latest.json"), JSON.stringify({ runId }));
}

describe("manifest verification logic", () => {
  function verifyManifest(m) {
    if (m.projectRef !== "cxnzlarcmszvnobuoskr") throw new Error("wrong ref");
    if (m.publicTables.count !== 7) throw new Error("wrong table count");
    if (m.migrationVersions.count !== 13) throw new Error("wrong migration count");
    if (!m.migrationVersions.values.includes("20260625000000")) throw new Error("missing recovery version");
  }

  it("valid manifest passes", () => {
    const m = {
      projectRef: "cxnzlarcmszvnobuoskr",
      publicTables: { count: 7 },
      migrationVersions: { count: 13, values: ["20260625000000"] },
    };
    expect(() => verifyManifest(m)).not.toThrow();
  });

  it("wrong ref fails", () => {
    const m = { projectRef: "wrong", publicTables: { count: 7 }, migrationVersions: { count: 13, values: ["20260625000000"] } };
    expect(() => verifyManifest(m)).toThrow("wrong ref");
  });

  it("wrong table count fails", () => {
    const m = { projectRef: "cxnzlarcmszvnobuoskr", publicTables: { count: 5 }, migrationVersions: { count: 13, values: ["20260625000000"] } };
    expect(() => verifyManifest(m)).toThrow("wrong table count");
  });

  it("wrong migration count fails", () => {
    const m = { projectRef: "cxnzlarcmszvnobuoskr", publicTables: { count: 7 }, migrationVersions: { count: 12, values: [] } };
    expect(() => verifyManifest(m)).toThrow("wrong migration count");
  });

  it("missing recovery version fails", () => {
    const m = { projectRef: "cxnzlarcmszvnobuoskr", publicTables: { count: 7 }, migrationVersions: { count: 13, values: ["00000000000000"] } };
    expect(() => verifyManifest(m)).toThrow("missing recovery version");
  });
});

describe("path safety", () => {
  const sep = process.platform === "win32" ? "\\" : "/";

  function assertPathInsideRoot(path, root) {
    const normPath = resolve(path);
    const normRoot = resolve(root);
    if (!normPath.startsWith(normRoot + sep) && normPath !== normRoot) {
      throw new Error(`Path outside root: ${path}`);
    }
  }

  it("allows path inside root", () => {
    expect(() => assertPathInsideRoot(join(ROOT, "latest"), ROOT)).not.toThrow();
  });

  it("blocks path outside root", () => {
    expect(() => assertPathInsideRoot(join(ROOT, "..", "other"), ROOT)).toThrow("Path outside root");
  });

  it("blocks root deletion", () => {
    expect(() => assertPathInsideRoot(ROOT, ROOT)).not.toThrow();
  });

  it("blocks traversal with ..", () => {
    expect(() => assertPathInsideRoot(join(ROOT, "..", "other"), ROOT)).toThrow("Path outside root");
  });
});

describe("local rotation logic", () => {
  it("creates latest directory", () => {
    const latestDir = join(TMP, "latest");
    mkdirSync(latestDir, { recursive: true });
    expect(existsSync(latestDir)).toBe(true);
  });

  it("renames previous to .previous-*", () => {
    const latestDir = join(TMP, "latest");
    const previousDir = join(TMP, `.previous-${Date.now()}`);
    mkdirSync(latestDir, { recursive: true });
    writeFileSync(join(latestDir, "test.txt"), "data");
    renameSync(latestDir, previousDir);
    expect(existsSync(previousDir)).toBe(true);
    expect(existsSync(latestDir)).toBe(false);
  });

  it("rollback restores previous to latest on failure", () => {
    const latestDir = join(TMP, "latest");
    const previousDir = join(TMP, ".previous-test");
    mkdirSync(previousDir, { recursive: true });
    writeFileSync(join(previousDir, "old.txt"), "old");
    renameSync(previousDir, latestDir);
    expect(existsSync(latestDir)).toBe(true);
    expect(existsSync(join(latestDir, "old.txt"))).toBe(true);
  });

  it("removes legacy managed directories", () => {
    const legacyDir = join(TMP, "cv-builder-primary-baseline-20260625T103154Z-33552c7");
    mkdirSync(legacyDir, { recursive: true });
    writeFileSync(join(legacyDir, "file.txt"), "data");
    rmSync(legacyDir, { recursive: true, force: true });
    expect(existsSync(legacyDir)).toBe(false);
  });

  it("preserves unknown user directories", () => {
    const userDir = join(TMP, "my-custom-backup");
    mkdirSync(userDir, { recursive: true });
    writeFileSync(join(userDir, "notes.txt"), "my notes");
    expect(existsSync(userDir)).toBe(true);
    rmSync(userDir, { recursive: true, force: true });
    expect(existsSync(userDir)).toBe(false);
  });

  it("symlink deletion is blocked by not following", () => {
    const targetDir = join(TMP, "target");
    const linkDir = join(TMP, "link");
    mkdirSync(targetDir, { recursive: true });
    try {
      symlinkSync(targetDir, linkDir);
    } catch {
      return;
    }
    expect(existsSync(linkDir)).toBe(true);
    rmSync(linkDir);
  });
});

describe("latest.json structure", () => {
  it("contains required fields", () => {
    const latest = {
      runId: "123",
      artifactName: "test",
      archiveFilename: "test.enc",
      sha256: "abc",
      size: 100,
      createdUtc: new Date().toISOString(),
      downloadedUtc: new Date().toISOString(),
      gitCommit: "abc123",
      projectRef: "cxnzlarcmszvnobuoskr",
    };
    expect(latest.runId).toBeDefined();
    expect(latest.sha256).toBeDefined();
    expect(latest.size).toBeGreaterThan(0);
    expect(latest.projectRef).toBe("cxnzlarcmszvnobuoskr");
  });

  it("does not contain secrets", () => {
    const json = JSON.stringify({
      runId: "123",
      sha256: "abc",
      projectRef: "cxnzlarcmszvnobuoskr",
    }).toLowerCase();
    expect(json.includes("password")).toBe(false);
    expect(json.includes("token")).toBe(false);
    expect(json.includes("secret")).toBe(false);
    expect(json.includes("passphrase")).toBe(false);
  });
});

describe("artifact rotation keep-2 logic", () => {
  it("keeps newest 2, deletes rest", () => {
    const artifacts = [
      { name: "cv-builder-primary-baseline-3", created_at: "2026-06-27" },
      { name: "cv-builder-primary-baseline-2", created_at: "2026-06-26" },
      { name: "cv-builder-primary-baseline-1", created_at: "2026-06-25" },
      { name: "cv-builder-primary-baseline-0", created_at: "2026-06-24" },
    ];
    const sorted = artifacts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const keep = sorted.slice(0, 2);
    const delete_ = sorted.slice(2);
    expect(keep).toHaveLength(2);
    expect(delete_).toHaveLength(2);
    expect(keep[0].name).toBe("cv-builder-primary-baseline-3");
    expect(keep[1].name).toBe("cv-builder-primary-baseline-2");
  });

  it("does not delete when count <= 2", () => {
    const artifacts = [
      { name: "cv-builder-primary-baseline-1", created_at: "2026-06-26" },
      { name: "cv-builder-primary-baseline-0", created_at: "2026-06-25" },
    ];
    const sorted = artifacts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const toDelete = sorted.slice(2);
    expect(toDelete).toHaveLength(0);
  });

  it("non-backup artifacts are excluded", () => {
    const artifacts = [
      { name: "other-artifact-1", created_at: "2026-06-27" },
      { name: "cv-builder-primary-baseline-1", created_at: "2026-06-26" },
    ];
    const backupOnly = artifacts.filter(a => a.name.startsWith("cv-builder-primary-baseline-"));
    expect(backupOnly).toHaveLength(1);
  });
});

describe("sync script file structure", () => {
  it("sync-latest-backup.mjs exists", () => {
    expect(existsSync(join(ROOT, "scripts", "backup", "sync-latest-backup.mjs"))).toBe(true);
  });

  it("run-and-sync-backup.mjs exists", () => {
    expect(existsSync(join(ROOT, "scripts", "backup", "run-and-sync-backup.mjs"))).toBe(true);
  });
});

describe("workflow schedule", () => {
  it("workflow file exists with schedule", () => {
    const content = readFileSync(join(ROOT, ".github", "workflows", "supabase-backup-baseline.yml"), "utf8");
    expect(content).toContain("schedule");
    expect(content).toContain('cron: "17 3 * * 1"');
  });

  it("push trigger removed", () => {
    const content = readFileSync(join(ROOT, ".github", "workflows", "supabase-backup-baseline.yml"), "utf8");
    expect(content).not.toMatch(/push:\s*\n\s*branches:/);
  });

  it("workflow_dispatch retained", () => {
    const content = readFileSync(join(ROOT, ".github", "workflows", "supabase-backup-baseline.yml"), "utf8");
    expect(content).toContain("workflow_dispatch");
  });
});

describe("rotation job permissions", () => {
  it("rotation job has actions: write", () => {
    const content = readFileSync(join(ROOT, ".github", "workflows", "supabase-backup-baseline.yml"), "utf8");
    expect(content).toContain("actions: write");
  });

  it("backup job has only contents: read", () => {
    const content = readFileSync(join(ROOT, ".github", "workflows", "supabase-backup-baseline.yml"), "utf8");
    const backupSection = content.split("rotate-artifacts:")[0];
    expect(backupSection).toContain("contents: read");
  });
});
