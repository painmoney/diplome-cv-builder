import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = process.cwd();

const DANGEROUS_PATTERNS = [
  { pattern: /supabase\s+db\s+reset\s+--linked/, desc: "remote db reset --linked" },
  { pattern: /supabase\s+db\s+reset\s+--db-url/, desc: "remote db reset --db-url" },
  { pattern: /supabase\s+migration\s+repair/, desc: "migration repair" },
  { pattern: /supabase\s+db\s+push\s+--yes/, desc: "db push with --yes" },
  { pattern: /supabase\s+link\b/, desc: "supabase link" },
];

const SCAN_DIRS = [".github/workflows", "scripts"];
const SCAN_EXTENSIONS = [".yml", ".yaml", ".mjs", ".js", ".ts", ".sh", ".ps1", ".cmd", ".bat"];
const ROOT_FILES = ["package.json"];

const ALLOWLIST_PATTERNS = [
  /REMOTE-SAFETY\.md/,
  /AGENTS\.md/,
  /scan-dangerous-commands/,
  /FORBIDDEN_PATTERNS/,
  /DANGEROUS_PATTERNS/,
  /README/,
  /CHANGELOG/,
];

function isAllowlisted(filePath) {
  return ALLOWLIST_PATTERNS.some((p) => p.test(filePath));
}

function collectFiles() {
  const files = [];

  for (const f of ROOT_FILES) {
    const full = join(ROOT, f);
    try {
      statSync(full);
      files.push(full);
    } catch { /* file doesn't exist, skip */ }
  }

  for (const dir of SCAN_DIRS) {
    const fullPath = join(ROOT, dir);
    try {
      walkDir(fullPath, files);
    } catch { /* dir doesn't exist, skip */ }
  }

  return files;
}

function walkDir(dir, files) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, files);
    } else if (SCAN_EXTENSIONS.includes(extname(entry.name))) {
      files.push(full);
    }
  }
}

function scan() {
  const files = collectFiles();
  let violations = 0;

  for (const file of files) {
    const rel = file.replace(ROOT + "/", "").replace(ROOT + "\\", "");
    if (isAllowlisted(rel)) continue;

    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { pattern, desc } of DANGEROUS_PATTERNS) {
        if (pattern.test(line)) {
          console.error(`VIOLATION: ${rel}:${i + 1} — ${desc}`);
          console.error(`  ${line.trim()}`);
          violations++;
        }
      }
    }
  }

  if (violations > 0) {
    console.error(`\nFAIL: ${violations} dangerous command(s) found`);
    process.exit(1);
  }

  console.log(`PASS: Scanned ${files.length} files, no dangerous commands found`);
}

scan();
