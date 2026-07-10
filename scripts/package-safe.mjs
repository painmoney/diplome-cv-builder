import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "safe-packages");

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
  }).trim();
}

function fail(message) {
  console.error(`[package:safe] ${message}`);
  process.exit(1);
}

function isSensitiveTrackedFile(file) {
  const normalized = file.replaceAll("\\", "/");
  if (/^\.env($|\.|\/)/.test(normalized) && normalized !== ".env.example") return true;
  if (normalized.startsWith("supabase/.temp/")) return true;
  if (normalized.startsWith("node_modules/")) return true;
  if (normalized.startsWith("dist/")) return true;
  if (normalized.startsWith(".git/")) return true;
  if (/(^|\/)(credentials|secret|secrets)(\/|\.|$)/i.test(normalized)) return true;
  return false;
}

const insideWorkTree = git(["rev-parse", "--is-inside-work-tree"]);
if (insideWorkTree !== "true") {
  fail("Run this command from the repository root.");
}

const trackedFiles = git(["ls-files"]).split(/\r?\n/).filter(Boolean);
const sensitiveTracked = trackedFiles.filter(isSensitiveTrackedFile);
if (sensitiveTracked.length > 0) {
  fail(`Refusing to package sensitive tracked files:\n${sensitiveTracked.join("\n")}`);
}

const status = git(["status", "--porcelain"]);
if (status) {
  fail("Working tree has uncommitted or untracked files. Commit or stash changes before packaging.");
}

mkdirSync(outDir, { recursive: true });

const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).replace(/[^\w.-]+/g, "-");
const shortSha = git(["rev-parse", "--short", "HEAD"]);
const archiveName = `cv-builder-safe-${branch}-${shortSha}.zip`;
const archivePath = join(outDir, archiveName);

if (existsSync(archivePath)) {
  fail(`Archive already exists: ${archivePath}`);
}

execFileSync("git", ["archive", "--format=zip", "--output", archivePath, "HEAD"], {
  cwd: root,
  stdio: "inherit",
});

const sizeMb = (statSync(archivePath).size / 1024 / 1024).toFixed(2);
console.log(`[package:safe] Created ${archivePath}`);
console.log(`[package:safe] Size: ${sizeMb} MB`);
console.log("[package:safe] Contents are tracked files from HEAD only.");
