import { execSync, spawn } from "child_process";
import { join } from "path";

const ROOT = process.cwd();
const TARGETS = {
  primary: { ref: "cxnzlarcmszvnobuoskr", mode: "development", port: "5173" },
  staging: { ref: "jerwfvhpoanoukxiyvwq", mode: "staging", port: "5199" },
};

function assertTarget(targetName) {
  try {
    execSync(`node "${join(ROOT, "scripts", "env", "assert-vite-target.mjs")}" ${targetName}`, {
      encoding: "utf8",
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch (e) {
    console.error(e.stdout || e.message);
    return false;
  }
}

function main() {
  const target = process.argv[2];
  if (!target || !TARGETS[target]) {
    console.error("Usage: node run-vite-target.mjs <primary|staging>");
    process.exit(1);
  }

  const config = TARGETS[target];
  console.log(`Starting Vite in ${config.mode} mode (target: ${target}, port: ${config.port})`);

  if (!assertTarget(target)) {
    console.error("Target assertion failed. Vite NOT started.");
    process.exit(1);
  }

  console.log("Target assertion passed. Starting Vite...");

  const child = spawn("npx", ["vite", "--mode", config.mode, "--port", config.port], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env },
  });

  child.on("exit", (code) => {
    process.exit(code || 0);
  });
}

main();
