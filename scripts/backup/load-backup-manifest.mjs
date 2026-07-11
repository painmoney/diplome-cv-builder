import { readFileSync } from "fs";
import { join } from "path";

const REQUIRED_FIELDS = [
  "expectedMigrationCount",
  "expectedTableNames",
  "requiredRecoveryVersion",
  "projectRef",
];

export function loadBackupManifest() {
  const manifestPath = join(process.cwd(), ".github", "backup-manifest.json");

  let raw;
  try {
    raw = readFileSync(manifestPath, "utf8");
  } catch {
    console.error(`FATAL: Cannot read backup manifest at ${manifestPath}`);
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    console.error(`FATAL: Invalid JSON in backup manifest at ${manifestPath}`);
    process.exit(1);
  }

  for (const field of REQUIRED_FIELDS) {
    if (manifest[field] === undefined) {
      console.error(`FATAL: Missing required backup manifest field: ${field}`);
      process.exit(1);
    }
  }

  if (!Number.isInteger(manifest.expectedMigrationCount)) {
    console.error("FATAL: expectedMigrationCount must be an integer");
    process.exit(1);
  }

  if (!Array.isArray(manifest.expectedTableNames) || manifest.expectedTableNames.length === 0) {
    console.error("FATAL: expectedTableNames must be a non-empty array");
    process.exit(1);
  }

  return {
    expectedMigrationCount: manifest.expectedMigrationCount,
    expectedTableNames: manifest.expectedTableNames,
    expectedTableCount: manifest.expectedTableNames.length,
    requiredRecoveryVersion: manifest.requiredRecoveryVersion,
    projectRef: manifest.projectRef,
  };
}
