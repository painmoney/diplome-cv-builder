# Staging Environment

Target: `jerwfvhpoanoukxiyvwq` only. The primary database is outside QA scope.

See [current technical readiness](../qa/README.md), [applied migration mapping](../qa/APPLIED-MIGRATIONS.md) and [deployment state](../qa/DEPLOYMENT.md).

The 15 staging migrations are applied. profiles.avatar_shape and the four avatar storage policies are verified. RLS is enabled on all seven application tables with 28 public ownership policies. Both resume RPCs are SECURITY INVOKER. Two synthetic users were used for direct Auth/API/Storage readiness checks; these are not Manual QA portfolio results.

The staging Edge Function is version 2 with verify_jwt=true plus explicit getUser(jwt) authentication in the handler. Anonymous requests are rejected. Authenticated requests return controlled 503 until GITHUB_TOKEN is configured.

The separate Vercel project cv-builder-qa uses Vite, Node 22.x, npm run build:staging and output dist. Only staging browser configuration is set. Final website, Auth redirect and UI verification status is recorded in DEPLOYMENT.md.
