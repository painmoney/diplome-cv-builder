import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const TARGETS_FILE = join(ROOT, "config", "supabase-targets.json");
const PROJECT_REF_FILE = join(ROOT, "supabase", ".temp", "project-ref");

const VALID_TARGETS = ["primary", "staging"];

function loadTargets() {
  if (!existsSync(TARGETS_FILE)) {
    console.error("FATAL: config/supabase-targets.json not found");
    process.exit(1);
  }
  return JSON.parse(readFileSync(TARGETS_FILE, "utf8"));
}

function getLinkedRef() {
  if (!existsSync(PROJECT_REF_FILE)) {
    return null;
  }
  return readFileSync(PROJECT_REF_FILE, "utf8").trim();
}

function assertTarget(targetName) {
  if (!VALID_TARGETS.includes(targetName)) {
    console.error(`FAIL: Unknown target "${targetName}". Valid: ${VALID_TARGETS.join(", ")}`);
    process.exit(1);
  }

  const targets = loadTargets();
  const expectedRef = targets[targetName]?.projectRef;

  if (!expectedRef) {
    console.error(`FAIL: No projectRef for target "${targetName}" in config`);
    process.exit(1);
  }

  const actualRef = getLinkedRef();

  if (!actualRef) {
    console.error("FAIL: No linked project found (supabase/.temp/project-ref missing)");
    console.error(`  Target: ${targetName}`);
    console.error(`  Expected: ${expectedRef}`);
    process.exit(1);
  }

  if (actualRef !== expectedRef) {
    console.error("FAIL: Project ref mismatch");
    console.error(`  Target: ${targetName}`);
    console.error(`  Expected: ${expectedRef}`);
    console.error(`  Actual: ${actualRef}`);
    process.exit(1);
  }

  const otherTarget = targetName === "primary" ? "staging" : "primary";
  const otherRef = targets[otherTarget]?.projectRef;
  if (actualRef === otherRef) {
    console.error(`FAIL: Linked ref matches ${otherTarget} instead of ${targetName}`);
    process.exit(1);
  }

  console.log(`PASS: Target ${targetName} verified`);
  console.log(`  Expected: ${expectedRef}`);
  console.log(`  Actual: ${actualRef}`);
  return true;
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: node assert-target.mjs <primary|staging>");
  process.exit(1);
}

assertTarget(target);
