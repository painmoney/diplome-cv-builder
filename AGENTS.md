# Repository Agent Instructions

## Supabase Remote Safety

These rules are mandatory for all agent sessions (MiMo, Claude, Copilot, or any other AI coding assistant).

### Absolute prohibitions

- Never run `supabase db reset --linked` or `supabase db reset --db-url`
- Never run `supabase migration repair`
- Never run raw `supabase db push` outside the safe wrapper
- Never run `supabase link`
- Never use `--yes` flag with any Supabase remote command
- Never push to primary locally — production migrations require an approved CI release workflow
- Never choose destructive actions independently


### Mandatory procedures

- All remote Supabase commands must go through `node scripts/supabase/safe-remote.mjs`
- Exact project ref is verified before every remote operation via `config/supabase-targets.json`
- Staging and primary must never share the same persisted worktree link
- Before any production migration, a fresh successful encrypted backup must exist
- All schema changes must go through tracked migrations only

### Target verification

- Run `node scripts/supabase/assert-target.mjs <primary|staging>` before any remote command
- If target mismatch is detected, stop immediately

### Emergency

- If a wrong target is detected mid-operation, stop immediately
- `Stop-Process -Name node -Force` is prohibited
- Do not attempt to reverse accidental remote writes without explicit human approval

### What this does NOT protect against

- Raw CLI commands executed outside the repository scripts
- Manual `psql` connections to the database
- Direct API calls to Supabase management endpoints
- Commands run from a different directory or machine

## Code Conventions

- Use ES modules (type: "module" in package.json)
- Test framework: Vitest
- Linting: ESLint
- Build: Vite

## Vite Environment Separation

- Never manually rewrite `.env` for staging smoke tests
- Development always runs via `npm run dev` (reads `.env.development.local`)
- Staging always runs via `npm run dev:staging` (reads `.env.staging.local`)
- After smoke tests, no `.env` restore is needed because files are separated
- Never mix URL of one project with key of another
- Never print full anon/publishable keys
- Never kill all Node processes (`Stop-Process -Name node -Force` is prohibited)
- `.env.development.local` and `.env.staging.local` are gitignored — never commit them

# Release safety rules

- Never modify or rewrite Git history.
- Never force-push.
- Never delete branches, tags, secrets, databases, tables, buckets, or remote projects.
- Never run remote database migrations without explicit approval.
- Never run E2E tests against production.
- Never deploy to production without explicit approval.
- Never read, print, copy, commit, or expose secret values.
- Do not modify .env files containing real credentials.
- Use staging Supabase for preview and E2E.
- Implement one plan phase at a time.
- Before every phase, state affected files and risks.
- After every phase, run tests, lint, and production build.
- Stop when tests fail; do not bypass or delete failing tests.
- Keep potentially breaking changes in separate commits.