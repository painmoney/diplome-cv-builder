# Environment Configuration Contract

## Environment Model

| Environment | Frontend hosting | Supabase project | Integration tests |
| --- | --- | --- | --- |
| local | Vite dev server | linked (same project) | service-role from .env |
| staging | TBD | separate project | separate service-role |
| production | TBD | current linked project | separate service-role |

## Public Browser Variables

Only these variables are included in the browser bundle:

| Variable | Required | Public/Secret | Validation |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | public | valid URL, https for remote, http allowed for localhost |
| `VITE_SUPABASE_ANON_KEY` | yes | public | non-empty string, not service-role |

These values are visible to end users. Security depends on Supabase RLS policies, not key secrecy.

## Server/Deployment Secrets

Never included in the browser bundle:

| Variable | Used by | Storage |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | integration tests, Supabase CLI | .env (gitignored), GitHub Actions secrets |
| `GITHUB_TOKEN` | Edge Function (github-repos) | Supabase Function secrets |

## Storage Locations

| Context | File/Location | Tracked? |
| --- | --- | --- |
| Local dev | `.env` | NO (gitignored) |
| Integration tests | `SUPABASE_SERVICE_ROLE_KEY` env var or `.env` | NO |
| Edge Functions | Supabase Dashboard → Edge Functions → Secrets | NO |
| Staging frontend | hosting environment variables | NO |
| Production frontend | hosting environment variables | NO |
| GitHub Actions | repository/environment secrets | NO |

## Rules

1. Real secrets are never committed to Git.
2. Staging and production use separate credentials.
3. Integration tests do not run against production data.
4. Service-role key never reaches the browser bundle.
5. `.env.example` contains only safe placeholders.
6. Logs and reports never contain secret values.
7. Rotation is performed separately when exposure is suspected.

## Future Staging Checklist

- [ ] Create separate Supabase staging project
- [ ] Apply migrations to staging
- [ ] Set staging frontend environment variables
- [ ] Configure staging Auth URLs and redirect allowlist
- [ ] Set Edge Function secrets for staging
- [ ] Run integration tests against staging
- [ ] Verify no production data leakage
