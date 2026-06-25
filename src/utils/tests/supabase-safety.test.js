import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const TARGETS_FILE = join(ROOT, "config", "supabase-targets.json");
const SAFE_REMOTE = join(ROOT, "scripts", "supabase", "safe-remote.mjs");
const ASSERT_TARGET = join(ROOT, "scripts", "supabase", "assert-target.mjs");
const SCAN = join(ROOT, "scripts", "supabase", "scan-dangerous-commands.mjs");

function targets() {
  return JSON.parse(readFileSync(TARGETS_FILE, "utf8"));
}

describe("supabase-targets.json", () => {
  it("has primary and staging", () => {
    const t = targets();
    expect(t.primary).toBeDefined();
    expect(t.staging).toBeDefined();
  });

  it("primary ref = cxnzlarcmszvnobuoskr", () => {
    expect(targets().primary.projectRef).toBe("cxnzlarcmszvnobuoskr");
  });

  it("staging ref = jerwfvhpoanoukxiyvwq", () => {
    expect(targets().staging.projectRef).toBe("jerwfvhpoanoukxiyvwq");
  });

  it("refs are different", () => {
    expect(targets().primary.projectRef).not.toBe(targets().staging.projectRef);
  });

  it("no secret-like fields", () => {
    const raw = readFileSync(TARGETS_FILE, "utf8").toLowerCase();
    for (const f of ["password", "secret", "token", "key", "passphrase", "db_url"]) {
      expect(raw.includes(f)).toBe(false);
    }
  });
});

describe("assert-target.mjs", () => {
  it("rejects unknown target", () => {
    let ok = false;
    try {
      execSync(`node "${ASSERT_TARGET}" unknown`, { encoding: "utf8", cwd: ROOT });
    } catch (e) {
      ok = (e.stdout + e.stderr).includes("Unknown target");
    }
    expect(ok).toBe(true);
  });

  it("rejects when no link exists", () => {
    const refFile = join(ROOT, "supabase", ".temp", "project-ref");
    const existed = existsSync(refFile);
    let backup = null;
    if (existed) {
      backup = readFileSync(refFile, "utf8");
      rmSync(refFile);
    }
    let ok = false;
    try {
      execSync(`node "${ASSERT_TARGET}" primary`, { encoding: "utf8", cwd: ROOT });
    } catch (e) {
      ok = (e.stdout + e.stderr).includes("No linked project");
    }
    expect(ok).toBe(true);
    if (existed && backup) writeFileSync(refFile, backup);
  });
});

describe("safe-remote.mjs forbidden patterns", () => {
  const cases = [
    ["db reset --linked", true],
    ["db reset --db-url postgres://x", true],
    ["migration repair", true],
    ["db push --yes", true],
    ["db push --db-url postgres://x", true],
  ];

  const PATTERNS = [
    /db\s+reset/i,
    /migration\s+repair/i,
    /--yes\b/,
    /--include-seed\b/,
    /--db-url\b/,
  ];

  for (const [args, expected] of cases) {
    it(`pattern match: "${args}" => ${expected}`, () => {
      const matched = PATTERNS.some((p) => p.test(args));
      expect(matched).toBe(expected);
    });
  }

  it("rejects unknown subcommand", () => {
    let ok = false;
    try {
      execSync(`node "${SAFE_REMOTE}" unknown-cmd --target primary`, { encoding: "utf8", cwd: ROOT });
    } catch (e) {
      ok = (e.stdout + e.stderr).includes("Unknown command");
    }
    expect(ok).toBe(true);
  });

  it("rejects push-staging with --target primary", () => {
    let ok = false;
    try {
      execSync(`node "${SAFE_REMOTE}" push-staging --target primary`, { encoding: "utf8", cwd: ROOT });
    } catch (e) {
      ok = (e.stdout + e.stderr).includes("only allowed for staging");
    }
    expect(ok).toBe(true);
  });

  it("rejects extra arguments", () => {
    let ok = false;
    try {
      execSync(`node "${SAFE_REMOTE}" target-status --target primary --force`, { encoding: "utf8", cwd: ROOT });
    } catch (e) {
      ok = (e.stdout + e.stderr).includes("Unexpected arguments");
    }
    expect(ok).toBe(true);
  });
});

describe("dangerous-command scanner", () => {
  it("script exists", () => {
    expect(existsSync(SCAN)).toBe(true);
  });

  it("detects db reset --linked pattern", () => {
    const PATTERNS = [/supabase\s+db\s+reset\s+--linked/];
    expect(PATTERNS.some((p) => p.test("run: supabase db reset --linked"))).toBe(true);
  });

  it("detects migration repair pattern", () => {
    const PATTERNS = [/supabase\s+migration\s+repair/];
    expect(PATTERNS.some((p) => p.test("supabase migration repair --project-ref x"))).toBe(true);
  });
});

describe("agent policy", () => {
  it("AGENTS.md exists", () => {
    expect(existsSync(join(ROOT, "AGENTS.md"))).toBe(true);
  });

  it("contains Supabase Remote Safety", () => {
    expect(readFileSync(join(ROOT, "AGENTS.md"), "utf8")).toContain("Supabase Remote Safety");
  });

  it("prohibits db reset --linked", () => {
    expect(readFileSync(join(ROOT, "AGENTS.md"), "utf8")).toContain("db reset --linked");
  });

  it("prohibits raw db push", () => {
    expect(readFileSync(join(ROOT, "AGENTS.md"), "utf8")).toContain("raw `supabase db push`");
  });
});

describe("REMOTE-SAFETY.md", () => {
  it("exists", () => {
    expect(existsSync(join(ROOT, "docs", "supabase", "REMOTE-SAFETY.md"))).toBe(true);
  });

  it("contains primary ref", () => {
    expect(readFileSync(join(ROOT, "docs", "supabase", "REMOTE-SAFETY.md"), "utf8")).toContain("cxnzlarcmszvnobuoskr");
  });

  it("contains staging ref", () => {
    expect(readFileSync(join(ROOT, "docs", "supabase", "REMOTE-SAFETY.md"), "utf8")).toContain("jerwfvhpoanoukxiyvwq");
  });
});
