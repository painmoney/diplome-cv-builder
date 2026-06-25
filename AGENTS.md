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
