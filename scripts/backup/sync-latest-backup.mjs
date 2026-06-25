import { execSync } from "child_process";
import { mkdirSync, rmSync, renameSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

const PREFIX = "cv-builder-primary-baseline-";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    repo: "painmoney/diplome-cv-builder",
    workflow: "supabase-backup-baseline.yml",
    branch: "production-development",
    dir: "C:\\cv-builder-backups",
    runId: null,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--repo") opts.repo = args[++i];
    else if (args[i] === "--workflow") opts.workflow = args[++i];
    else if (args[i] === "--branch") opts.branch = args[++i];
    else if (args[i] === "--dir") opts.dir = args[++i];
    else if (args[i] === "--run-id") opts.runId = args[++i];
  }
  return opts;
}

function gh(args) {
  return execSync(`gh ${args}`, { encoding: "utf8", timeout: 60000 }).trim();
}

function assertPathInsideRoot(path, root) {
  const normPath = resolve(path.replace(/\//g, "\\"));
  const normRoot = resolve(root.replace(/\//g, "\\"));
  if (!normPath.startsWith(normRoot + "\\") && normPath !== normRoot) {
    throw new Error(`Path outside root: ${path}`);
  }
}

function verifyManifest(manifestPath) {
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));

  if (m.projectRef !== "cxnzlarcmszvnobuoskr") {
    throw new Error(`Wrong project ref: ${m.projectRef}`);
  }
  if (m.publicTables.count !== 7) {
    throw new Error(`Expected 7 tables, got ${m.publicTables.count}`);
  }
  if (m.migrationVersions.count !== 13) {
    throw new Error(`Expected 13 migrations, got ${m.migrationVersions.count}`);
  }
  if (!m.migrationVersions.values.includes("20260625000000")) {
    throw new Error("Recovery version 20260625000000 missing");
  }

  return m;
}

function main() {
  const opts = parseArgs();
  const root = opts.dir;

  console.log("=== Sync Latest Backup ===");

  console.log("\n--- Checking gh auth ---");
  try {
    gh("auth status");
  } catch {
    console.error("FAIL: gh not authenticated");
    process.exit(1);
  }

  console.log("\n--- Finding latest successful run ---");
  let runId = opts.runId;
  if (!runId) {
    const runsJson = gh(`run list --workflow ${opts.workflow} --branch ${opts.branch} --status completed --limit 10 --json databaseId,conclusion`);
    const runs = JSON.parse(runsJson);
    const success = runs.find(r => r.conclusion === "success");
    if (!success) {
      console.error("FAIL: No successful run found");
      process.exit(1);
    }
    runId = String(success.databaseId);
  }
  console.log(`Run ID: ${runId}`);

  console.log("\n--- Getting artifact ---");
  let artifacts;
  try {
    const artJson = gh(`api repos/painmoney/diplome-cv-builder/actions/runs/${runId}/artifacts`);
    artifacts = JSON.parse(artJson).artifacts;
  } catch {
    console.error("FAIL: Could not fetch artifacts");
    process.exit(1);
  }

  const backupArts = artifacts.filter(a => a.name.startsWith(PREFIX));
  if (backupArts.length === 0) {
    console.error("FAIL: No backup artifact found for this run");
    process.exit(1);
  }
  if (backupArts.length > 1) {
    console.error(`FAIL: Found ${backupArts.length} matching artifacts, expected 1`);
    process.exit(1);
  }

  const artifact = backupArts[0];
  console.log(`Artifact: ${artifact.name}`);

  mkdirSync(root, { recursive: true });
  const incomingDir = join(root, `.incoming-${runId}`);

  try {
    if (existsSync(incomingDir)) rmSync(incomingDir, { recursive: true, force: true });
    mkdirSync(incomingDir, { recursive: true });

    console.log("\n--- Downloading artifact ---");
    gh(`run download ${runId} --name ${artifact.name} --dir "${incomingDir}"`);

    console.log("\n--- Checking structure ---");
    const files = readdirSync(incomingDir);
    const encFile = files.find(f => f.endsWith(".tar.gz.enc"));
    const shaFile = files.find(f => f.endsWith(".tar.gz.enc.sha256"));

    if (!encFile) {
      throw new Error("No .tar.gz.enc file found");
    }
    if (!shaFile) {
      throw new Error("No .sha256 file found");
    }

    const encSize = statSync(join(incomingDir, encFile)).size;
    if (encSize === 0) {
      throw new Error("Encrypted archive is empty");
    }
    console.log(`Archive: ${encFile} — ${encSize} bytes`);

    console.log("\n--- Verifying SHA-256 ---");
    const expectedSha = readFileSync(join(incomingDir, shaFile), "utf8").trim().split(" ")[0];
    const actualSha = execSync(`certutil -hashfile "${join(incomingDir, encFile)}" SHA256`, { encoding: "utf8" })
      .split("\n")[1].trim();
    if (actualSha !== expectedSha) {
      throw new Error(`SHA-256 mismatch: expected ${expectedSha}, got ${actualSha}`);
    }
    console.log(`SHA-256 verified: ${actualSha}`);

    let manifestDir = null;
    if (existsSync(join(incomingDir, "backup-work"))) {
      manifestDir = join(incomingDir, "backup-work");
    } else if (existsSync(join(incomingDir, "metadata", "manifest.json"))) {
      manifestDir = join(incomingDir);
    } else {
      for (const d of files) {
        if (d.startsWith("cv-builder-primary-baseline-") && existsSync(join(incomingDir, d, "metadata", "manifest.json"))) {
          manifestDir = join(incomingDir, d);
          break;
        }
      }
    }

    if (!manifestDir) {
      throw new Error("No metadata directory with manifest.json found");
    }

    console.log("\n--- Verifying manifest ---");
    const manifest = verifyManifest(join(manifestDir, "metadata", "manifest.json"));

    console.log(`  Project ref: ${manifest.projectRef}`);
    console.log(`  Tables: ${manifest.publicTables.count}`);
    console.log(`  Migrations: ${manifest.migrationVersions.count}`);

    const latestDir = join(root, "latest");
    const previousDir = join(root, `.previous-${Date.now()}`);

    if (existsSync(latestDir)) {
      console.log("\n--- Moving current latest to previous ---");
      renameSync(latestDir, previousDir);
    }

    console.log("\n--- Renaming incoming to latest ---");
    try {
      renameSync(incomingDir, latestDir);
    } catch (e) {
      if (existsSync(previousDir)) {
        renameSync(previousDir, latestDir);
      }
      throw new Error(`Failed to rename incoming to latest: ${e.message}`, { cause: e });
    }

    console.log("\n--- Writing latest.json ---");
    const latestJson = {
      runId,
      artifactName: artifact.name,
      archiveFilename: encFile,
      sha256: actualSha,
      size: encSize,
      createdUtc: artifact.created_at,
      downloadedUtc: new Date().toISOString(),
      gitCommit: manifest.gitCommitSHA,
      projectRef: manifest.projectRef,
    };
    writeFileSync(join(latestDir, "latest.json"), JSON.stringify(latestJson, null, 2));

    console.log("\n--- Removing previous ---");
    if (existsSync(previousDir)) {
      assertPathInsideRoot(previousDir, root);
      rmSync(previousDir, { recursive: true, force: true });
      console.log(`  Removed: ${previousDir}`);
    }

    console.log("\n--- Cleaning legacy managed directories ---");
    const allEntries = readdirSync(root);
    let removed = 0;
    for (const entry of allEntries) {
      if (entry === "latest" || entry === ".incoming-" || entry === ".previous-") continue;
      if (entry.startsWith("cv-builder-primary-baseline-")) {
        const fullPath = join(root, entry);
        assertPathInsideRoot(fullPath, root);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          rmSync(fullPath, { recursive: true, force: true });
          console.log(`  Removed legacy: ${entry}`);
          removed++;
        }
      }
    }

    console.log("\n=== Sync Complete ===");
    console.log(`  Run ID: ${runId}`);
    console.log(`  Artifact: ${artifact.name}`);
    console.log(`  Archive: ${encFile}`);
    console.log(`  Size: ${encSize}`);
    console.log(`  SHA-256: ${actualSha}`);
    console.log(`  Local: ${latestDir}`);
    console.log(`  Legacy removed: ${removed}`);

  } catch (e) {
    console.error(`\nFAIL: ${e.message}`);
    if (existsSync(incomingDir)) {
      rmSync(incomingDir, { recursive: true, force: true });
    }
    const latestDir = join(root, "latest");
    const previousDirs = readdirSync(root).filter(d => d.startsWith(".previous-"));
    if (!existsSync(latestDir) && previousDirs.length > 0) {
      renameSync(join(root, previousDirs[0]), latestDir);
      console.log("Rolled back previous to latest");
    }
    process.exit(1);
  }
}

main();
