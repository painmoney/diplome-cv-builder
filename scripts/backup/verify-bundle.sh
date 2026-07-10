#!/usr/bin/env bash
set -Eeuo pipefail

ENC_FILE="${1:?Usage: verify-bundle.sh <encrypted-file>}"
VERIFY_DIR=$(mktemp -d)
trap 'rm -rf "$VERIFY_DIR"' EXIT

echo "=== Bundle Verification ==="

echo "--- Step 1: Decrypt ---"
openssl enc \
  -aes-256-cbc \
  -d \
  -pbkdf2 \
  -iter 600000 \
  -in "$ENC_FILE" \
  -out "${VERIFY_DIR}/bundle.tar.gz" \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE

echo "--- Step 2: Extract ---"
mkdir -p "${VERIFY_DIR}/bundle"
tar -xzf "${VERIFY_DIR}/bundle.tar.gz" -C "${VERIFY_DIR}/bundle"

echo "--- Step 3: Checksums ---"
cd "${VERIFY_DIR}/bundle"
if sha256sum -c checksums.sha256; then
  echo "✅ SHA-256 checksums verified"
else
  echo "::error::SHA-256 checksum verification failed"
  exit 1
fi

echo "--- Step 4: Required files ---"
REQUIRED=(
  "database/roles.sql"
  "database/public_schema.sql"
  "database/public_data.sql"
  "database/migration_history_schema.sql"
  "database/migration_history_data.sql"
  "database/auth_schema.sql"
  "database/auth_data.sql"
  "database/storage_schema.sql"
  "database/storage_data.sql"
  "storage/buckets.json"
  "storage/objects-manifest.json"
  "metadata/manifest.json"
  "metadata/functions.json"
  "metadata/checksums.sha256"
)

ALL_OK=true
for f in "${REQUIRED[@]}"; do
  if [[ -f "$f" ]]; then
    SIZE=$(stat -c%s "$f")
    echo "  ✅ $f — $SIZE bytes"
  else
    echo "  ❌ MISSING: $f"
    ALL_OK=false
  fi
done

if [[ "$ALL_OK" != "true" ]]; then
  echo "::error::Required files missing from bundle"
  exit 1
fi

echo "--- Step 5: Migration count ---"
MIG_COUNT=$(grep -c "INSERT" database/migration_history_data.sql || true)
echo "  Migration INSERTs: $MIG_COUNT"
if [[ "$MIG_COUNT" -ne 14 ]]; then
  echo "::error::Expected 14 migrations, got $MIG_COUNT"
  exit 1
fi

echo "--- Step 6: Public tables ---"
TABLE_COUNT=$(grep -c "CREATE TABLE" database/public_schema.sql || true)
echo "  Public tables: $TABLE_COUNT"

echo "--- Step 7: Auth schema ---"
if grep -q "auth.users" database/auth_schema.sql; then
  echo "  ✅ auth.users present"
else
  echo "  ❌ auth.users NOT found"
  exit 1
fi

echo "--- Step 8: Storage ---"
if [[ -f storage/buckets.json ]]; then
  echo "  ✅ buckets.json present"
else
  echo "  ❌ buckets.json NOT found"
  exit 1
fi

echo "=== ✅ Bundle verification passed ==="
