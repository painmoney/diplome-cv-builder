# Environment Configuration Contract

| Environment | Frontend | Backend |
| --- | --- | --- |
| QA local | Vite staging mode, fixed loopback port 5199 | registered staging project |
| QA hosted | https://cv-builder-qa.vercel.app; separate Vercel project | same registered staging project |
| primary | existing configuration; outside QA scope | registered primary project |

Registry: `config/supabase-targets.json`. QA instructions: [SETUP](../qa/SETUP.md).

## Public browser settings

- `VITE_SUPABASE_URL`: exact registered project HTTPS URL.
- `VITE_SUPABASE_ANON_KEY`: publishable key or legacy anon JWT for that project.
- `VITE_SENTRY_DSN`: optional public DSN; leave unset if telemetry is not required.

Copy `.env.staging.example` to gitignored `.env.staging.local` for local QA. Hosting uses environment variables. Vite precedence applies, including process overrides and `.env.local`; staging guards inspect effective configuration. Automatic prefix exposure is disabled with `envPrefix: []`; only the three approved fields above are explicitly defined in the browser bundle. Additional hosting variables are not exposed. Primary credentials and primary env files are not required for staging. A publishable key's association with the project must also be confirmed by a live request; its ref is not encoded like a legacy JWT.

Treat `VITE_` values as public configuration despite the explicit exposure restriction. Service-role/secret keys, database passwords, access tokens, SMTP credentials and GitHub tokens must never be stored there or committed. `GITHUB_TOKEN` belongs only in staging Edge Function Secrets. `SUPABASE_ACCESS_TOKEN`/database credentials belong only in the administrator's CLI/session. Server credentials are not needed for ordinary manual API work: use a public key plus the test user's JWT.

## Deployment

Use `npm ci`, `npm run build:staging`, output `dist`, existing SPA rewrite in `vercel.json`. An optional CLI configuration is provided as `vercel.staging.json`; Git imports require the build override in the separate QA project's Dashboard. Configure staging Auth Site URL and redirect allowlist for the exact QA/local origins. See SETUP for migration review, known schema drift and remaining access requirements.

Existing automated tests remain in the repository; no automation is part of the Manual QA preparation or portfolio plan. Never point tests or manual data operations at primary.
