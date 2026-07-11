import { writeFileSync, readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

const BACKUP_DIR = process.env.BACKUP_DIR || "backup-work";
const GIT_SHA = process.env.GIT_SHA || "unknown";
const GIT_REF = process.env.GIT_REF || "unknown";

const backupManifest = JSON.parse(readFileSync(join(process.cwd(), ".github", "backup-manifest.json"), "utf8"));

const REQUIRED_MANIFEST_FIELDS = [
  "expectedMigrationCount",
  "expectedTableNames",
  "requiredRecoveryVersion",
  "projectRef",
];

for (const field of REQUIRED_MANIFEST_FIELDS) {
  if (backupManifest[field] === undefined) {
    console.error(`FATAL: Missing required backup manifest field: ${field}`);
    process.exit(1);
  }
}

if (!Number.isInteger(backupManifest.expectedMigrationCount)) {
  console.error("FATAL: expectedMigrationCount must be an integer");
  process.exit(1);
}

if (!Array.isArray(backupManifest.expectedTableNames) || backupManifest.expectedTableNames.length === 0) {
  console.error("FATAL: expectedTableNames must be a non-empty array");
  process.exit(1);
}

const PROJECT_REF = backupManifest.projectRef;
const EXPECTED_TABLE_COUNT = backupManifest.expectedTableNames.length;
const EXPECTED_MIGRATION_COUNT = backupManifest.expectedMigrationCount;
const REQUIRED_RECOVERY_VERSION = backupManifest.requiredRecoveryVersion;

function listFilesRecursive(dir, prefix = "") {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(join(dir, entry.name), rel));
    } else {
      const s = statSync(join(dir, entry.name));
      files.push({ path: rel, size: s.size });
    }
  }
  return files;
}

function loadDatabaseMetadata() {
  const metaPath = join(BACKUP_DIR, "metadata", "database-metadata.json");
  let raw;
  try {
    raw = readFileSync(metaPath, "utf8");
  } catch {
    console.error(`FATAL: database-metadata.json not found at ${metaPath}`);
    process.exit(1);
  }

  const meta = JSON.parse(raw);

  if (!meta.publicTables || !meta.migrationVersions) {
    console.error("FATAL: database-metadata.json missing required fields");
    process.exit(1);
  }

  if (meta.publicTables.count !== EXPECTED_TABLE_COUNT) {
    console.error(
      `FATAL: Expected ${EXPECTED_TABLE_COUNT} public tables, got ${meta.publicTables.count}`
    );
    process.exit(1);
  }

  if (meta.migrationVersions.count !== EXPECTED_MIGRATION_COUNT) {
    console.error(
      `FATAL: Expected ${EXPECTED_MIGRATION_COUNT} migrations, got ${meta.migrationVersions.count}`
    );
    process.exit(1);
  }

  if (!meta.migrationVersions.values.includes(REQUIRED_RECOVERY_VERSION)) {
    console.error(
      `FATAL: Recovery version ${REQUIRED_RECOVERY_VERSION} not found in migration versions`
    );
    process.exit(1);
  }

  const forbidden = ["dbUrl", "password", "secret", "token", "key", "passphrase", "email"];
  const metaStr = JSON.stringify(meta).toLowerCase();
  for (const field of forbidden) {
    if (metaStr.includes(`"${field}"`)) {
      console.error(`FATAL: metadata contains forbidden field: ${field}`);
      process.exit(1);
    }
  }

  return meta;
}

function getAuthUserCount() {
  try {
    const dataFile = join(BACKUP_DIR, "database", "auth_data.sql");
    const content = readFileSync(dataFile, "utf8");
    const match = content.match(/COPY auth\.users .* FROM stdin/);
    if (!match) return 0;
    const section = content.substring(content.indexOf(match[0]));
    const lines = section
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("COPY") && l.trim() !== "\\.");
    return Math.max(0, lines.length - 1);
  } catch {
    return 0;
  }
}

function getStorageInfo() {
  try {
    const bucketsFile = join(BACKUP_DIR, "storage", "buckets.json");
    const manifestFile = join(BACKUP_DIR, "storage", "objects-manifest.json");
    const buckets = JSON.parse(readFileSync(bucketsFile, "utf8"));
    const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
    return {
      bucketNames: (buckets.buckets || buckets || []).map((b) => b.name || b.id),
      objectCounts: manifest.objects.reduce((acc, obj) => {
        acc[obj.bucket] = (acc[obj.bucket] || 0) + 1;
        return acc;
      }, {}),
      totalBytes: manifest.totalBytes,
      totalObjects: manifest.totalObjects,
    };
  } catch {
    return { bucketNames: [], objectCounts: {}, totalBytes: 0, totalObjects: 0 };
  }
}

function getFunctionsInfo() {
  try {
    const funcFile = join(BACKUP_DIR, "metadata", "functions.json");
    return JSON.parse(readFileSync(funcFile, "utf8"));
  } catch {
    return { functions: [] };
  }
}

function main() {
  const timestamp = new Date().toISOString();
  const dbMeta = loadDatabaseMetadata();
  const authUserCount = getAuthUserCount();
  const storageInfo = getStorageInfo();
  const functionsInfo = getFunctionsInfo();
  const bundleFiles = listFilesRecursive(BACKUP_DIR);

  const manifest = {
    backupFormatVersion: "1.0.0",
    timestamp,
    projectRef: PROJECT_REF,
    repository: "painmoney/diplome-cv-builder",
    gitBranch: GIT_REF,
    gitCommitSHA: GIT_SHA,
    supabaseCLIVersion: "2.107.0",
    postgresqlServerVersion: "see database info step",
    migrationVersions: {
      values: dbMeta.migrationVersions.values,
      count: dbMeta.migrationVersions.count,
    },
    publicTables: {
      names: dbMeta.publicTables.names,
      count: dbMeta.publicTables.count,
      rowCounts: dbMeta.publicTables.rowCounts,
    },
    auth: {
      userCount: authUserCount,
    },
    storage: {
      bucketNames: storageInfo.bucketNames,
      objectCounts: storageInfo.objectCounts,
      totalBytes: storageInfo.totalBytes,
      totalObjects: storageInfo.totalObjects,
    },
    functions: functionsInfo,
    encryptionAlgorithm: "AES-256-CBC (pbkdf2, 600000 iterations)",
    restoreDrillStatus: "NOT_YET_PERFORMED",
    bundleFiles: bundleFiles.map((f) => f.path),
  };

  writeFileSync(
    join(BACKUP_DIR, "metadata", "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  writeFileSync(
    join(BACKUP_DIR, "metadata", "required-secret-names.json"),
    JSON.stringify(
      [
        "PRIMARY_DB_URL",
        "PRIMARY_SUPABASE_URL",
        "PRIMARY_SERVICE_ROLE_KEY",
        "SUPABASE_ACCESS_TOKEN",
        "BACKUP_ENCRYPTION_PASSPHRASE",
      ],
      null,
      2
    )
  );

  console.log("✅ Manifest created");
  console.log(`  Timestamp: ${timestamp}`);
  console.log(`  Project ref: ${PROJECT_REF}`);
  console.log(`  Public tables: ${dbMeta.publicTables.count}`);
  console.log(`  Table names: ${dbMeta.publicTables.names.join(", ")}`);
  console.log(`  Migrations: ${dbMeta.migrationVersions.count}`);
  console.log(`  Auth users: ${authUserCount}`);
  console.log(`  Storage objects: ${storageInfo.totalObjects}`);
  console.log(`  Storage buckets: ${storageInfo.bucketNames.length}`);
  console.log(`  Bundle files: ${bundleFiles.length}`);
}

main();
