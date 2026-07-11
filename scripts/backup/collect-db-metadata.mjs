import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { loadBackupManifest } from "./load-backup-manifest.mjs";

const DB_URL = process.env.PRIMARY_DB_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || "backup-work";

if (!DB_URL) {
  console.error("PRIMARY_DB_URL must be set");
  process.exit(1);
}

const backupManifest = loadBackupManifest();
const EXPECTED_TABLES = backupManifest.expectedTableNames;
const EXPECTED_TABLE_COUNT = backupManifest.expectedTableCount;
const EXPECTED_MIGRATION_COUNT = backupManifest.expectedMigrationCount;
const REQUIRED_RECOVERY_VERSION = backupManifest.requiredRecoveryVersion;

function psql(query) {
  const result = execSync(
    `psql "${DB_URL}" -c "${query.replace(/"/g, '\\"')}" --no-psqlrc -t -A`,
    { encoding: "utf8", timeout: 30000 }
  );
  return result.trim();
}

function psqlLines(query) {
  const raw = psql(query);
  return raw.split("\n").filter((l) => l.trim() !== "");
}

function main() {
  console.log("=== Collecting database metadata ===");

  const tablesRaw = psqlLines(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
  );
  console.log(`Public tables found: ${tablesRaw.length}`);

  const missing = EXPECTED_TABLES.filter((t) => !tablesRaw.includes(t));
  const extra = tablesRaw.filter((t) => !EXPECTED_TABLES.includes(t));

  if (missing.length > 0) {
    console.error(`Missing expected tables: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (extra.length > 0) {
    console.error(`Unexpected extra tables: ${extra.join(", ")}`);
    process.exit(1);
  }
  if (tablesRaw.length !== EXPECTED_TABLE_COUNT) {
    console.error(`Expected exactly ${EXPECTED_TABLE_COUNT} tables, got ${tablesRaw.length}`);
    process.exit(1);
  }
  console.log(`✅ Tables verified: ${tablesRaw.join(", ")}`);

  const rowCounts = {};
  for (const t of tablesRaw) {
    const countStr = psql(`SELECT count(*) FROM public.${t}`);
    const count = parseInt(countStr, 10);
    if (Number.isNaN(count) || count < 0) {
      console.error(`Invalid row count for ${t}: ${countStr}`);
      process.exit(1);
    }
    rowCounts[t] = count;
  }
  console.log("✅ Row counts collected");

  const migrationRaw = psqlLines(
    `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version`
  );
  console.log(`Migration versions found: ${migrationRaw.length}`);

  if (migrationRaw.length !== EXPECTED_MIGRATION_COUNT) {
    console.error(
      `Expected ${EXPECTED_MIGRATION_COUNT} migrations, got ${migrationRaw.length}`
    );
    process.exit(1);
  }

  if (!migrationRaw.includes(REQUIRED_RECOVERY_VERSION)) {
    console.error(
      `Recovery version ${REQUIRED_RECOVERY_VERSION} not found in migrations`
    );
    process.exit(1);
  }
  console.log(`✅ Migrations verified: ${migrationRaw.join(", ")}`);

  const metadata = {
    publicTables: {
      count: tablesRaw.length,
      names: tablesRaw,
      rowCounts,
    },
    migrationVersions: {
      count: migrationRaw.length,
      values: migrationRaw,
    },
  };

  mkdirSync(join(BACKUP_DIR, "metadata"), { recursive: true });
  writeFileSync(
    join(BACKUP_DIR, "metadata", "database-metadata.json"),
    JSON.stringify(metadata, null, 2)
  );

  console.log("✅ database-metadata.json written");
  console.log(`  Tables: ${tablesRaw.length}`);
  console.log(`  Migrations: ${migrationRaw.length}`);
  console.log(`  Recovery version present: ${migrationRaw.includes(REQUIRED_RECOVERY_VERSION)}`);
}

main();
