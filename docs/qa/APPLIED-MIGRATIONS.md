# Applied staging migrations

Target: `jerwfvhpoanoukxiyvwq` only. On 22 October 2026, the first 13 repository migrations through `20260625000000_restore_canonical_backend.sql` were already recorded in staging. The SQL from the two remaining existing files was reviewed and applied in order through the Supabase migration service. No reset, backfill rerun, RLS disablement or primary operation was performed.

The service assigned application timestamps. In the QA branch only, filenames were renamed to match that history; SQL contents are unchanged:

| Original repository version | Recorded staging version | Name |
| --- | --- | --- |
| 20260710190000 | 20261022150933 | add_avatar_storage_policies |
| 20260807000000 | 20261022150953 | add_avatar_shape |

The remote history was not manually repaired. Use this QA branch when inspecting this staging history. The original production-development branch and its migration files were not changed. Do not push this staging-renumbered set to another database without reconciling its own history.

Verified in the staging catalog: profiles.avatar_shape text NOT NULL default round with CHECK round/square; RLS enabled on all seven application tables; 28 public ownership policies; four avatar storage policies; public avatars bucket with 5 MiB limit and jpeg/png/webp/gif MIME types; both resume RPCs are SECURITY INVOKER with an empty search_path and execution restricted to authenticated/service_role/owner.

A profiles-to-auth.users FK is not present in the inherited schema. This was documented rather than adding a business/schema change outside the launch requirements. The security advisor reports only disabled leaked-password protection; no new RLS advisory was introduced.
