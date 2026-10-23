# Supabase Remote Safety

- Work on a separate branch and preserve the existing application architecture.
- Use `config/supabase-targets.json` to distinguish primary and staging.
- Never run `supabase db reset --linked`, remote resets via database URLs,
  migration repair, or destructive operations against primary.
- Do not run raw `supabase db push`. Use the guarded npm wrappers documented
  in `docs/supabase/REMOTE-SAFETY.md`.
- Primary writes are CI-only. QA data and migrations belong only in confirmed
  staging; do not copy a primary CLI link into a QA checkout.
- Before staging migrations, inspect migration history, order, dependencies,
  destructive statements and dry-run output. Preserve interactive target
  confirmation and never disable RLS to bypass errors.
- Never commit credentials, real env files, database passwords, access tokens,
  or service-role keys. Only public client configuration belongs in Vite.
- Manual QA scope and remaining setup are documented in `docs/qa/`.
