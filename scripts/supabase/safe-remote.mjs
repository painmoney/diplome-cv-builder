import { readFileSync, existsSync, readSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const TARGETS_FILE = join(ROOT, "config", "supabase-targets.json");
const PROJECT_REF_FILE = join(ROOT, "supabase", ".temp", "project-ref");

const ALLOWED_COMMANDS = ["target-status", "migration-list", "push-dry-run", "push-staging"];
const FORBIDDEN_PATTERNS = [
  /db\s+reset/i,
  /migration\s+repair/i,
  /--yes\b/,
  /--include-seed\b/,
  /--db-url\b/,
];

function loadTargets() {
  return JSON.parse(readFileSync(TARGETS_FILE, "utf8"));
}

function getLinkedRef() {
  if (!existsSync(PROJECT_REF_FILE)) return null;
  return readFileSync(PROJECT_REF_FILE, "utf8").trim();
}

function assertGitClean() {
  const status = execSync("git status --porcelain", { encoding: "utf8", cwd: ROOT }).trim();
  if (status.length > 0) {
    console.error("FAIL: Git working tree is not clean");
    process.exit(1);
  }
}

function assertTarget(target) {
  const targets = loadTargets();
  const expectedRef = targets[target]?.projectRef;
  if (!expectedRef) {
    console.error(`FAIL: Unknown target "${target}"`);
    process.exit(1);
  }
  const actualRef = getLinkedRef();
  if (!actualRef) {
    console.error("FAIL: No linked project");
    process.exit(1);
  }
  if (actualRef !== expectedRef) {
    console.error(`FAIL: Target ${target} ref mismatch. Expected: ${expectedRef}, Actual: ${actualRef}`);
    process.exit(1);
  }
  const otherTarget = target === "primary" ? "staging" : "primary";
  const otherRef = targets[otherTarget]?.projectRef;
  if (actualRef === otherRef) {
    console.error(`FAIL: Linked ref matches ${otherTarget} instead of ${target}`);
    process.exit(1);
  }
  return expectedRef;
}

function runSupabase(args) {
  const cmd = `supabase ${args}`;
  console.log(`> ${cmd}`);
  const output = execSync(cmd, { encoding: "utf8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] });
  console.log(output);
  return output;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const command = args[0];
  const targetIdx = args.indexOf("--target");
  const target = targetIdx !== -1 ? args[targetIdx + 1] : null;
  const extraArgs = args.filter((a, i) => i > 0 && a !== "--target" && (targetIdx === -1 || i !== targetIdx + 1));
  return { command, target, extraArgs };
}

function validateNoForbidden(args) {
  const full = args.join(" ");
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(full)) {
      console.error(`FAIL: Forbidden pattern detected: ${pattern}`);
      process.exit(1);
    }
  }
}

function cmdTargetStatus(target) {
  console.log(`=== Target Status: ${target} ===`);
  assertTarget(target);
  const ref = loadTargets()[target].projectRef;
  console.log(`Project ref: ${ref}`);
  console.log(`Remote writes: ${loadTargets()[target].remoteWrites}`);
}

function cmdMigrationList(target) {
  console.log(`=== Migration List: ${target} ===`);
  assertTarget(target);
  runSupabase("migration list");
}

function cmdPushDryRun(target) {
  console.log(`=== Push Dry Run: ${target} ===`);
  assertTarget(target);
  runSupabase("db push --dry-run");
}

function cmdPushStaging(target) {
  if (target !== "staging") {
    console.error("FAIL: push-staging is only allowed for staging target");
    process.exit(1);
  }

  console.log("=== Push Staging ===");
  assertGitClean();
  assertTarget(target);

  const branch = execSync("git branch --show-current", { encoding: "utf8", cwd: ROOT }).trim();
  if (branch !== "production-development") {
    console.error(`FAIL: Must be on production-development, currently on: ${branch}`);
    process.exit(1);
  }

  const aheadBehind = execSync("git rev-list --left-right --count HEAD...origin/production-development", { encoding: "utf8", cwd: ROOT }).trim();
  const [ahead, behind] = aheadBehind.split(/\s+/).map(Number);
  if (ahead !== 0 || behind !== 0) {
    console.error(`FAIL: Branch not synced. Ahead: ${ahead}, Behind: ${behind}`);
    process.exit(1);
  }

  runSupabase("migration list");
  const dryRunOutput = runSupabase("db push --dry-run");

  if (!dryRunOutput || dryRunOutput.trim().length === 0) {
    console.error("FAIL: Dry run produced no output — nothing to push?");
    process.exit(1);
  }

  if (process.env.CI || !process.stdin.isTTY) {
    console.error("FAIL: Non-interactive environment. Staging push requires manual interactive confirmation.");
    process.exit(1);
  }

  const stagingRef = loadTargets().staging.projectRef;
  console.log(`\nTo proceed with staging push, type the full staging ref: ${stagingRef}`);
  process.stdout.write("> ");
  const buf = Buffer.alloc(256);
  const n = readSync(process.stdin.fd, buf, 0, 256);
  const answer = buf.toString("utf8", 0, n).trim();

  if (answer.trim() !== stagingRef) {
    console.error("FAIL: Typed ref does not match staging ref. Aborting.");
    process.exit(1);
  }

  console.log("Confirmed. Executing db push...");
  runSupabase("db push");
  console.log("Staging push complete.");
}

function main() {
  const { command, target, extraArgs } = parseArgs(process.argv);

  if (!command || !ALLOWED_COMMANDS.includes(command)) {
    console.error(`FAIL: Unknown command "${command}". Allowed: ${ALLOWED_COMMANDS.join(", ")}`);
    process.exit(1);
  }

  if (!target || !["primary", "staging"].includes(target)) {
    console.error("FAIL: --target primary|staging is required");
    process.exit(1);
  }

  if (extraArgs.length > 0) {
    console.error(`FAIL: Unexpected arguments: ${extraArgs.join(" ")}`);
    process.exit(1);
  }

  validateNoForbidden(process.argv.slice(2));

  switch (command) {
    case "target-status":
      cmdTargetStatus(target);
      break;
    case "migration-list":
      cmdMigrationList(target);
      break;
    case "push-dry-run":
      cmdPushDryRun(target);
      break;
    case "push-staging":
      cmdPushStaging(target);
      break;
  }
}

main();
