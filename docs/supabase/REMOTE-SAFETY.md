# Supabase Remote Safety

## Why remote reset is dangerous

`supabase db reset --linked` drops and recreates the entire database on the linked remote project. This is irreversible and destroys all data, including auth users, storage objects, and row-level security policies. A local `supabase db reset` only affects the local Docker instance and is safe for development.

## Project refs

| Environment | Project ref |
|---|---|
| Primary | `cxnzlarcmszvnobuoskr` |
| Staging | `jerwfvhpoanoukxiyvwq` |

These are not secrets. They identify which Supabase project a command targets.

## Safe npm commands

| Command | Description |
|---|---|
| `npm run db:staging:status` | Show staging target status |
| `npm run db:staging:migrations` | List staging migrations |
| `npm run db:staging:dry-run` | Preview staging push changes |
| `npm run db:staging:push` | Push to staging (guarded, interactive) |
| `npm run db:primary:status` | Show primary target status |
| `npm run db:primary:migrations` | List primary migrations |
| `npm run db:primary:dry-run` | Preview primary push changes (no actual push) |

## Local reset vs remote reset

- **Local reset** (`supabase db reset` without `--linked`): Resets the local Docker database. Safe for development.
- **Remote reset** (`supabase db reset --linked`): Destroys the remote database. Never run this.

## Checking your link

```bash
cat supabase/.temp/project-ref
```

This file shows which remote project your local Supabase CLI is linked to. It should match the intended target.

## Staging dry-run

```bash
npm run db:staging:dry-run
```

This shows which migrations would be applied without actually pushing.

## Why primary push is CI-only

Primary database migrations must go through an approved CI release workflow to ensure:
- Code review before deployment
- Automated testing passes
- Backup is verified before migration
- Audit trail exists

Local primary push is blocked by the safe wrapper.

## Incident response for wrong target

1. Stop immediately — do not proceed with any write command
2. Check `supabase/.temp/project-ref` to confirm which project was linked
3. Verify no unintended writes were committed
4. If a wrong migration was applied to staging, coordinate with the team before attempting remediation
5. Never attempt to fix a wrong-target migration by running additional migrations without human approval

## Removing stale links

If `supabase/.temp/project-ref` points to the wrong project:

```bash
rm supabase/.temp/project-ref
```

This removes the local link without affecting any remote project. Re-link with the correct target when needed.

## Limitations

Repository safety guards reduce risk through:
- Mandatory wrapper scripts
- Automated tests
- CI scanning
- Agent policy files

They cannot prevent:
- Running raw `supabase` CLI commands outside the repository
- Manual `psql` database connections
- Direct Supabase API calls
- Commands executed from a different directory or machine
