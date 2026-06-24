# Staging Environment

## Model

Separate Supabase project (`cv-builder-staging`), isolated from CURRENT_PRIMARY_PROJECT.

- Region: East US (North Virginia) — same as primary
- Tier: Free
- Cost: $0

## Fingerprints

- CURRENT_PRIMARY_PROJECT: `****oskr`
- STAGING_PROJECT: `****yvwq`

## Public browser config

File: `.env.staging.local` (gitignored)

- `VITE_SUPABASE_URL` — staging project URL
- `VITE_SUPABASE_ANON_KEY` — staging anon key

## Server/test secrets

File: `.env.integration.staging.local` (gitignored)

- `VITE_SUPABASE_URL` — staging URL
- `VITE_SUPABASE_ANON_KEY` — staging anon key
- `SUPABASE_SERVICE_ROLE_KEY` — staging service-role key

## How to run

```bash
# Verify isolation from primary
npm run staging:guard

# Validate staging env
npm run env:check:staging

# Local dev against staging
npm run dev:staging

# Build against staging
npm run build:staging

# Integration tests against staging
# (swap .env to staging, run tests, restore .env)
```

## Staging migration history

12 migrations applied (base schema + 11 original):
- Base schema (tables + unique index)
- Security hardening (RLS, policies, grants)
- Schema hardening (NOT NULL, indexes, FK constraints)
- Atomic resume RPC
- Idempotency fix
- Multi-resume schema
- P1003 removal
- Manual projects table
- Manual projects RPC sync
- Grants fix
- RPC fix (WITH ORDINALITY)
- Backfill

## Edge Functions

- `github-repos` deployed
- `verify_jwt = true`
- GITHUB_TOKEN: NOT CONFIGURED (requires manual setup)

## Auth config

- Site URL: `http://localhost:5199`
- Redirect allowlist: `http://localhost:5199/**`

## Storage

NOT_CONFIGURED_YET — requires manual bucket creation in Dashboard.

## Not yet configured

- CI/CD (GitHub Actions)
- Hosted staging frontend
- Production Auth hardening
- Custom SMTP
- Observability
- Storage buckets
- GITHUB_TOKEN for Edge Function
