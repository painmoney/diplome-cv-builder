import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { createHash } from "crypto";

const SUPABASE_URL = process.env.PRIMARY_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.PRIMARY_SERVICE_ROLE_KEY;
const BACKUP_DIR = process.env.BACKUP_DIR || "backup-work";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("PRIMARY_SUPABASE_URL and PRIMARY_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
};

async function supabaseGet(path) {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function listAllObjects(bucket, prefix = "") {
  const objects = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const path = `/storage/v1/object/list/${bucket}?prefix=${encodeURIComponent(prefix)}&limit=${limit}&offset=${offset}`;
    const data = await supabaseGet(path);
    if (!data || data.length === 0) break;
    objects.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }

  return objects;
}

async function downloadObject(bucket, objectPath) {
  const encodedPath = encodeURIComponent(objectPath);
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`;
  const res = await fetch(url, {
    headers,
  });
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} for ${bucket}/${objectPath}`);
  }
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

async function main() {
  console.log("=== Storage Backup ===");

  const storageDir = join(BACKUP_DIR, "storage");
  const filesDir = join(storageDir, "files");
  mkdirSync(storageDir, { recursive: true });
  mkdirSync(filesDir, { recursive: true });

  console.log("Listing buckets...");
  const bucketsRes = await supabaseGet("/storage/v1/bucket");
  const buckets = bucketsRes.buckets || bucketsRes || [];

  writeFileSync(
    join(storageDir, "buckets.json"),
    JSON.stringify({ buckets }, null, 2)
  );
  console.log(`Found ${buckets.length} buckets`);

  const manifest = { objects: [], totalBytes: 0, totalObjects: 0 };
  const checksums = {};

  for (const bucket of buckets) {
    const bucketName = bucket.name || bucket.id;
    console.log(`\nProcessing bucket: ${bucketName}`);

    let objects = [];
    try {
      objects = await listAllObjects(bucketName);
    } catch (err) {
      console.log(`  ⚠️ Could not list objects in ${bucketName}: ${err.message}`);
      console.log(`  Treating bucket as empty`);
    }
    console.log(`  Found ${objects.length} objects in ${bucketName}`);

    for (const obj of objects) {
      if (obj.id && !obj.name) continue;

      const objectPath = obj.name;
      const destPath = join(filesDir, bucketName, objectPath);
      const destDir = dirname(destPath);

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      try {
        const { buffer, contentType } = await downloadObject(bucketName, objectPath);
        writeFileSync(destPath, buffer);

        const sha256 = createHash("sha256").update(buffer).digest("hex");
        const entry = {
          bucket: bucketName,
          name: objectPath,
          contentType,
          size: buffer.length,
          sha256,
        };
        manifest.objects.push(entry);
        manifest.totalBytes += buffer.length;
        manifest.totalObjects++;

        checksums[`${bucketName}/${objectPath}`] = sha256;
        console.log(`  ✅ ${objectPath} — ${buffer.length} bytes — sha256:${sha256.substring(0, 12)}...`);
      } catch (err) {
        console.error(`  ❌ Failed to download ${bucketName}/${objectPath}: ${err.message}`);
      }
    }
  }

  writeFileSync(join(storageDir, "objects-manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n=== Storage backup complete ===`);
  console.log(`Total objects: ${manifest.totalObjects}`);
  console.log(`Total bytes: ${manifest.totalBytes}`);
}

main().catch((err) => {
  console.error("Storage backup failed:", err);
  process.exit(1);
});
