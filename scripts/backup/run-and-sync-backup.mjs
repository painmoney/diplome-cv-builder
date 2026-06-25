import { execSync } from "child_process";

function gh(args) {
  return execSync(`gh ${args}`, { encoding: "utf8", timeout: 120000 }).trim();
}

function main() {
  console.log("=== Trigger and Sync Backup ===");

  console.log("\n--- Checking gh auth ---");
  try {
    gh("auth status");
  } catch {
    console.error("FAIL: gh not authenticated");
    process.exit(1);
  }

  console.log("\n--- Triggering workflow ---");
  gh("workflow run supabase-backup-baseline.yml --ref production-development");
  console.log("Workflow dispatched");

  console.log("\n--- Waiting for new run ---");
  const startTime = Date.now();
  let runId = null;

  while (Date.now() - startTime < 600000) {
    const runsJson = gh("run list --workflow supabase-backup-baseline.yml --branch production-development --status in_progress --limit 1 --json databaseId,createdAt");
    const runs = JSON.parse(runsJson);
    if (runs.length > 0) {
      const run = runs[0];
      const created = new Date(run.createdAt).getTime();
      if (created > startTime - 5000) {
        runId = String(run.databaseId);
        break;
      }
    }

    const runsJson2 = gh("run list --workflow supabase-backup-baseline.yml --branch production-development --status completed --limit 3 --json databaseId,conclusion,updatedAt");
    const recentRuns = JSON.parse(runsJson2);
    for (const r of recentRuns) {
      const updated = new Date(r.updatedAt).getTime();
      if (updated > startTime - 10000) {
        if (r.conclusion === "success") {
          runId = String(r.databaseId);
          console.log(`Found just-completed run: ${runId}`);
          break;
        } else {
          console.error(`FAIL: Run ${r.databaseId} concluded with: ${r.conclusion}`);
          process.exit(1);
        }
      }
    }
    if (runId) break;

    execSync("timeout 5 || sleep 5", { stdio: "ignore" });
  }

  if (!runId) {
    console.error("FAIL: Could not find new run within timeout");
    process.exit(1);
  }

  console.log(`Run ID: ${runId}`);
  console.log(`URL: https://github.com/painmoney/diplome-cv-builder/actions/runs/${runId}`);

  console.log("\n--- Watching run ---");
  try {
    gh(`run watch ${runId} --exit-status`);
  } catch {
    console.error(`FAIL: Run ${runId} did not succeed`);
    process.exit(1);
  }

  console.log("\n--- Syncing latest backup ---");
  const syncScript = new URL("./sync-latest-backup.mjs", import.meta.url).pathname;
  try {
    execSync(`node "${syncScript}" --run-id ${runId}`, { encoding: "utf8", stdio: "inherit", timeout: 120000 });
  } catch {
    console.error("FAIL: sync-latest-backup.mjs failed");
    process.exit(1);
  }

  console.log("\n=== Done ===");
}

main();
