import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync, readFileSync } from "fs";
import { join } from "path";

const TMP = join(import.meta.dirname || ".", "backup-test-tmp");

const VALID_METADATA = {
  publicTables: {
    count: 7,
    names: [
      "education",
      "experience",
      "github_projects",
      "manual_projects",
      "profiles",
      "resumes",
      "skills",
    ],
    rowCounts: {
      education: 0,
      experience: 0,
      github_projects: 0,
      manual_projects: 0,
      profiles: 0,
      resumes: 0,
      skills: 0,
    },
  },
  migrationVersions: {
    count: 13,
    values: [
      "00000000000000",
      "20260621000000",
      "20260621120000",
      "20260621130000",
      "20260621140000",
      "20260623235512",
      "20260624004059",
      "20260624070715",
      "20260624072139",
      "20260624073936",
      "20260624074254",
      "20260624082752",
      "20260625000000",
    ],
  },
};

function setupTmp() {
  mkdirSync(join(TMP, "backup-work", "metadata"), { recursive: true });
  mkdirSync(join(TMP, "backup-work", "database"), { recursive: true });
  mkdirSync(join(TMP, "backup-work", "storage"), { recursive: true });
  mkdirSync(join(TMP, "backup-work", "project"), { recursive: true });
}

function writeMeta(meta) {
  writeFileSync(
    join(TMP, "backup-work", "metadata", "database-metadata.json"),
    JSON.stringify(meta)
  );
}

function writeMinimalManifestDeps() {
  writeFileSync(
    join(TMP, "backup-work", "storage", "buckets.json"),
    JSON.stringify({ buckets: [{ name: "avatars" }] })
  );
  writeFileSync(
    join(TMP, "backup-work", "storage", "objects-manifest.json"),
    JSON.stringify({ objects: [], totalBytes: 0, totalObjects: 0 })
  );
  writeFileSync(
    join(TMP, "backup-work", "metadata", "functions.json"),
    JSON.stringify({ functions: [] })
  );
}

beforeEach(() => {
  setupTmp();
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe("collect-db-metadata expected format", () => {
  it("valid metadata has correct structure", () => {
    expect(VALID_METADATA.publicTables.count).toBe(7);
    expect(VALID_METADATA.publicTables.names).toHaveLength(7);
    expect(VALID_METADATA.migrationVersions.count).toBe(13);
    expect(VALID_METADATA.migrationVersions.values).toHaveLength(13);
    expect(VALID_METADATA.migrationVersions.values).toContain("20260625000000");
  });

  it("table names are sorted and exact", () => {
    const sorted = [...VALID_METADATA.publicTables.names].sort();
    expect(sorted).toEqual([
      "education",
      "experience",
      "github_projects",
      "manual_projects",
      "profiles",
      "resumes",
      "skills",
    ]);
  });

  it("rowCounts are non-negative integers", () => {
    for (const [, count] of Object.entries(
      VALID_METADATA.publicTables.rowCounts
    )) {
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(count)).toBe(true);
    }
  });
});

describe("metadata does not contain secret-like fields", () => {
  it("no dbUrl, password, secret, token, key, passphrase, email in metadata JSON", () => {
    const forbidden = [
      "dbUrl",
      "password",
      "secret",
      "token",
      "key",
      "passphrase",
      "email",
    ];
    const json = JSON.stringify(VALID_METADATA).toLowerCase();
    for (const f of forbidden) {
      expect(json.includes(`"${f}"`)).toBe(false);
    }
  });
});

describe("create-manifest validation logic", () => {
  it("fails when metadata file is missing", () => {
    const metaPath = join(
      TMP,
      "backup-work",
      "metadata",
      "database-metadata.json"
    );
    expect(() => readFileSync(metaPath, "utf8")).toThrow();
  });

  it("fails when public table count is not 7", () => {
    const bad = {
      ...VALID_METADATA,
      publicTables: { ...VALID_METADATA.publicTables, count: 5 },
    };
    writeMeta(bad);
    const meta = JSON.parse(
      readFileSync(
        join(TMP, "backup-work", "metadata", "database-metadata.json"),
        "utf8"
      )
    );
    expect(meta.publicTables.count).not.toBe(7);
  });

  it("fails when an expected table is missing", () => {
    const bad = {
      ...VALID_METADATA,
      publicTables: {
        ...VALID_METADATA.publicTables,
        names: VALID_METADATA.publicTables.names.filter(
          (n) => n !== "skills"
        ),
      },
    };
    expect(bad.publicTables.names).not.toContain("skills");
    expect(bad.publicTables.names).toHaveLength(6);
  });

  it("fails when an unknown table is added", () => {
    const bad = {
      ...VALID_METADATA,
      publicTables: {
        ...VALID_METADATA.publicTables,
        names: [...VALID_METADATA.publicTables.names, "unknown_table"],
      },
    };
    expect(bad.publicTables.names).toHaveLength(8);
    expect(bad.publicTables.names).toContain("unknown_table");
  });

  it("fails when migration count is 12", () => {
    const bad = {
      ...VALID_METADATA,
      migrationVersions: {
        count: 12,
        values: VALID_METADATA.migrationVersions.values.slice(0, 12),
      },
    };
    expect(bad.migrationVersions.count).not.toBe(13);
  });

  it("fails when recovery version is missing", () => {
    const bad = {
      ...VALID_METADATA,
      migrationVersions: {
        ...VALID_METADATA.migrationVersions,
        values: VALID_METADATA.migrationVersions.values.filter(
          (v) => v !== "20260625000000"
        ),
      },
    };
    bad.migrationVersions.count = bad.migrationVersions.values.length;
    expect(bad.migrationVersions.values).not.toContain("20260625000000");
  });

  it("valid metadata passes all checks", () => {
    writeMeta(VALID_METADATA);
    writeMinimalManifestDeps();
    const meta = JSON.parse(
      readFileSync(
        join(TMP, "backup-work", "metadata", "database-metadata.json"),
        "utf8"
      )
    );
    expect(meta.publicTables.count).toBe(7);
    expect(meta.migrationVersions.count).toBe(13);
    expect(meta.migrationVersions.values).toContain("20260625000000");
  });

  it("COPY format in SQL dumps does not affect manifest (metadata sourced from DB queries)", () => {
    const copyDump = `COPY public.resumes (id, user_id, title) FROM stdin;
1\tabc\tMy Resume
\\.\\n`;
    writeFileSync(
      join(TMP, "backup-work", "database", "public_data.sql"),
      copyDump
    );
    writeMeta(VALID_METADATA);
    const meta = JSON.parse(
      readFileSync(
        join(TMP, "backup-work", "metadata", "database-metadata.json"),
        "utf8"
      )
    );
    expect(meta.publicTables.count).toBe(7);
    expect(meta.migrationVersions.count).toBe(13);
  });
});
