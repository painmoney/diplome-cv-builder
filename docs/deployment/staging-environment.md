# Staging Environment

The existing staging project is `jerwfvhpoanoukxiyvwq` (primary is a different project ending in `oskr`). Do not create a parallel staging project or copy the primary CLI link.

Current technical observations, limitations and setup instructions (22 October 2026):

- [QA readiness and evidence](../qa/README.md)
- [Local launch, migration review, Vercel, Auth and Edge Function setup](../qa/SETUP.md)

The staging Auth API and database REST API respond. The seven tables and two resume RPCs are visible in the API schema. The live profiles table is missing `avatar_shape`; reconcile migration history and apply the existing migration before full CRUD validation. The avatars bucket exists and is public with a 5 MiB limit. Live RLS policies, migration history and Auth redirect URLs still need administrative inspection.

`github-repos` has `verify_jwt=false` at the gateway in the current source. The handler authenticates each caller via Supabase Auth `getUser(jwt)`. Deployment/token state has not been verified. Google/GitHub OAuth providers are currently disabled in staging.

No hosted Vercel staging deployment was created during this preparation. Local frontend uses `npm run dev:staging` on `http://127.0.0.1:5199`; building uses `npm run build:staging`. These observations are technical environment checks, not a completed manual QA run.
