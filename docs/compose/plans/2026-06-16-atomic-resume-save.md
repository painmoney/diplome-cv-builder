# Atomic Resume Save via PostgreSQL RPC — Implementation Plan

> **For agentic workers:** Use compose:execute to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Replace the non-atomic multi-query resume save with a single PostgreSQL RPC call that guarantees all child tables stay in sync with `resumes.data`.

**Architecture:** Create a PostgreSQL function `save_resume_full()` that wraps upsert + profile sync + child table replacement in a single transaction. The frontend calls it via `supabase.rpc()`. The existing `resumes.data` JSON remains the source of truth for export; normalized tables remain for query convenience.

**Tech Stack:** PostgreSQL (Supabase), `supabase.rpc()`, Supabase migrations, Vitest

---

## Inferred Schema (no migration files exist)

From code analysis in `resumeService.js`:

### `resumes`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | UNIQUE (onConflict: "user_id") |
| `title` | text | |
| `template` | text | default 'minimalist' |
| `data` | jsonb | aggregated resume snapshot |
| `updated_at` | timestamptz | |

### `profiles`
| Column | Type | Constraints |
|--------|------|-------------|
| `user_id` | uuid | UNIQUE (onConflict: "user_id") |
| `full_name` | text | nullable |
| `avatar_url` | text | nullable |
| `email` | text | nullable |
| `phone` | text | nullable |
| `about` | text | nullable |
| `updated_at` | timestamptz | |

### `skills`
| Column | Type | Constraints |
|--------|------|-------------|
| `resume_id` | uuid | FK → resumes.id |
| `skill_name` | text | |
| `level` | int | nullable, 1-5 |

### `education`
| Column | Type | Constraints |
|--------|------|-------------|
| `resume_id` | uuid | FK → resumes.id |
| `institution` | text | |
| `institute` | text | nullable |
| `department` | text | nullable |
| `program` | text | nullable |
| `degree` | text | nullable |
| `years` | text | nullable |

### `experience`
| Column | Type | Constraints |
|--------|------|-------------|
| `resume_id` | uuid | FK → resumes.id |
| `company` | text | |
| `position` | text | default 'Не указано' |
| `period` | text | nullable |
| `description` | text | nullable |

### `github_projects`
| Column | Type | Constraints |
|--------|------|-------------|
| `resume_id` | uuid | FK → resumes.id |
| `project_name` | text | |
| `project_url` | text | nullable |
| `description` | text | nullable |
| `stars` | int | default 0 |

---

## Current Flow & Risk

```
saveResumeFull(userId, title, data)
  → upsertResume()          ← gets resume.id
  → Promise.all([
      syncProfile()          ← upsert profiles
      syncSkills()           ← delete + insert skills
      syncEducation()        ← delete + insert education
      syncExperience()       ← delete + insert experience
      syncGitHubProjects()   ← delete + insert github_projects
    ])
```

**Risk:** If `insert` fails after `delete` in any child table (network drop, constraint violation, Supabase timeout), that table's data is permanently lost. The 5 parallel operations are independent — one failure doesn't stop the others, making partial writes likely.

---

## Security Decision: SECURITY INVOKER vs DEFINER

### Why SECURITY INVOKER (recommended)

The current client-side code already works with RLS:
```js
await supabase.from("skills").delete().eq("resume_id", resumeId);
await supabase.from("skills").insert(rows);
```

This means RLS policies on child tables already allow authenticated users to operate on their own rows (via `resume_id` → `resumes.user_id = auth.uid()` join). SECURITY INVOKER preserves this:

| Criterion | SECURITY INVOKER | SECURITY DEFINER |
|-----------|-----------------|------------------|
| RLS applies | Yes (defense in depth) | No (bypassed) |
| Privilege escalation risk | Low | Higher |
| Ownership check needed in SQL | No (RLS handles it) | Yes (explicit `auth.uid()` check) |
| Audit simplicity | Simple | Requires REVOKE/GRANT |
| Breaks if RLS misconfigured | Yes | No |

**Decision:** Use SECURITY INVOKER. RLS provides the ownership guarantee. If RLS is later removed or misconfigured, the function will fail safely (not silently bypass security).

### When SECURITY DEFINER would be needed

Only if RLS policies DON'T cover the operations in the function (e.g., cross-user batch operations, admin tools). Not the case here.

---

## Proposed RPC: `save_resume_full()`

### Function Signature

```sql
save_resume_full(
  p_title text,
  p_data jsonb,
  p_template text DEFAULT 'minimalist'
) RETURNS jsonb
```

**No `p_user_id` parameter.** The function derives user identity from `auth.uid()`. This prevents client-side spoofing.

### SQL Structure

```sql
CREATE OR REPLACE FUNCTION public.save_resume_full(
  p_title text,
  p_data jsonb,
  p_template text DEFAULT 'minimalist'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_resume_id uuid;
  v_result jsonb;
BEGIN
  -- 1. Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 2. Upsert resume
  INSERT INTO public.resumes (user_id, title, template, data, updated_at)
  VALUES (v_user_id, p_title, p_template, p_data, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    template = EXCLUDED.template,
    data = EXCLUDED.data,
    updated_at = EXCLUDED.updated_at
  RETURNING id INTO v_resume_id;

  -- 3. Upsert profile (from data->'profile')
  INSERT INTO public.profiles (user_id, full_name, avatar_url, email, phone, about, updated_at)
  VALUES (
    v_user_id,
    NULLIF(p_data->'profile'->>'name', ''),
    NULLIF(p_data->'profile'->>'photo', ''),
    NULLIF(p_data->'profile'->>'email', ''),
    NULLIF(p_data->'profile'->>'phone', ''),
    NULLIF(p_data->'profile'->>'about', ''),
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    about = EXCLUDED.about,
    updated_at = EXCLUDED.updated_at;

  -- 4. Replace skills (safe numeric cast for level)
  DELETE FROM public.skills WHERE resume_id = v_resume_id;

  INSERT INTO public.skills (resume_id, skill_name, level)
  SELECT
    v_resume_id,
    NULLIF(s->>'name', ''),
    CASE
      WHEN s->>'level' ~ '^[1-5]$' THEN (s->>'level')::int
      ELSE NULL
    END
  FROM jsonb_array_elements(p_data->'skills') s
  WHERE NULLIF(s->>'name', '') IS NOT NULL;

  -- 5. Replace education
  DELETE FROM public.education WHERE resume_id = v_resume_id;

  INSERT INTO public.education (resume_id, institution, institute, department, program, degree, years)
  SELECT
    v_resume_id,
    NULLIF(e->>'institution', ''),
    NULLIF(e->>'institute', ''),
    NULLIF(e->>'department', ''),
    NULLIF(e->>'program', ''),
    NULLIF(e->>'degree', ''),
    NULLIF(COALESCE(e->>'years', e->>'year'), '')
  FROM jsonb_array_elements(p_data->'education') e
  WHERE NULLIF(e->>'institution', '') IS NOT NULL;

  -- 6. Replace experience
  DELETE FROM public.experience WHERE resume_id = v_resume_id;

  INSERT INTO public.experience (resume_id, company, position, period, description)
  SELECT
    v_resume_id,
    NULLIF(x->>'company', ''),
    COALESCE(NULLIF(x->>'position', ''), 'Не указано'),
    NULLIF(x->>'period', ''),
    NULLIF(x->>'description', '')
  FROM jsonb_array_elements(p_data->'experience') x
  WHERE NULLIF(x->>'company', '') IS NOT NULL;

  -- 7. Replace github_projects (safe numeric cast for stars)
  DELETE FROM public.github_projects WHERE resume_id = v_resume_id;

  INSERT INTO public.github_projects (resume_id, project_name, project_url, description, stars)
  SELECT
    v_resume_id,
    NULLIF(g->>'name', ''),
    NULLIF(g->>'url', ''),
    NULLIF(g->>'description', ''),
    CASE
      WHEN g->>'stars' ~ '^[0-9]+$' THEN (g->>'stars')::int
      ELSE 0
    END
  FROM jsonb_array_elements(p_data->'github') g
  WHERE NULLIF(g->>'name', '') IS NOT NULL;

  -- 8. Return the saved resume row
  SELECT to_jsonb(r.*) INTO v_result
  FROM public.resumes r
  WHERE r.id = v_resume_id;

  RETURN v_result;
END;
$$;
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Security mode | `SECURITY INVOKER` | RLS provides ownership guarantee; less privilege escalation risk |
| `SET search_path` | `''` (empty) | All tables fully qualified as `public.tablename`; prevents search_path hijacking |
| User identity | `auth.uid()` internally | No `p_user_id` parameter; prevents client-side spoofing |
| Ownership check | Implicit via RLS | RLS policies on child tables already enforce `user_id = auth.uid()` through `resume_id` FK join |
| `ON CONFLICT (user_id)` | Yes | Matches existing `upsert` behavior — one resume per user |
| Return value | `jsonb` (full resume row) | Frontend needs `id` and `updated_at` after save |
| Numeric casts | Regex-guarded | `'^[1-5]$'` for level, `'^[0-9]+$'` for stars; no unsafe `::int` |

### Safe Numeric Cast Details

**Level (skills):**
```sql
CASE
  WHEN s->>'level' ~ '^[1-5]$' THEN (s->>'level')::int
  ELSE NULL
END
```
- Only accepts exactly "1" through "5"
- Rejects "", "abc", "6", "1.5", null → NULL
- PostgreSQL regex `~` is safe against injection

**Stars (github_projects):**
```sql
CASE
  WHEN g->>'stars' ~ '^[0-9]+$' THEN (g->>'stars')::int
  ELSE 0
END
```
- Only accepts pure digit strings
- Rejects "", "abc", "-1", "1.5" → 0 (default)
- Non-negative integers only

---

## Files to Modify (Build Phase)

| File | Change |
|------|--------|
| `supabase/migrations/20260616_save_resume_full.sql` | **New** — migration with `save_resume_full()` function |
| `src/api/resumeService.js` | Replace `saveResumeFull()` body: call `supabase.rpc("save_resume_full", ...)` instead of multi-query. Remove `userId` param. Keep `normalizeLoadedResumeData`, `loadUserResume`, helpers. |
| `src/utils/tests/resumeService.test.js` | **New** — unit tests for `normalizeLoadedResumeData` |

### `resumeService.js` changes (high-level)

```js
// BEFORE (current)
export async function saveResumeFull(userId, title, rawResumeData) {
  const resumeData = normalizeLoadedResumeData(rawResumeData);
  const resume = await upsertResume(userId, title, resumeData);
  await Promise.all([
    syncProfile(userId, resumeData.profile),
    syncSkills(resume.id, resumeData.skills),
    syncEducation(resume.id, resumeData.education),
    syncExperience(resume.id, resumeData.experience),
    syncGitHubProjects(resume.id, resumeData.github),
  ]);
  return resume;
}

// AFTER (proposed)
export async function saveResumeFull(title, rawResumeData) {
  const resumeData = normalizeLoadedResumeData(rawResumeData);

  const { data, error } = await supabase.rpc("save_resume_full", {
    p_title: title,
    p_data: resumeData,
    p_template: resumeData.template || "minimalist",
  });

  if (error) throw error;
  return data;
}
```

**Note:** `userId` parameter removed from `saveResumeFull()`. All callers in `ResumeEditor.jsx` must be updated to remove the `userId` argument.

Functions that become **unused** after RPC migration:
- `upsertResume()`
- `syncProfile()`
- `syncSkills()`
- `syncEducation()`
- `syncExperience()`
- `syncGitHubProjects()`
- `replaceRows()`

These can be deleted or kept as dead code initially.

---

## Migration File Location

```
supabase/migrations/
  20260616_save_resume_full.sql
```

Since no `migrations/` directory exists yet, it needs to be created.

---

## What RPC Does NOT Change

- `resumes.data` remains the primary JSON snapshot (used by export)
- `loadUserResume()` — no change, still reads from `resumes` + `normalizeLoadedResumeData`
- Normalized tables (`skills`, `education`, `experience`, `github_projects`) — still populated, just atomically
- PDF/DOCX/Markdown export — reads from `resume.data`, not from normalized tables
- GitHub Import — unrelated
- AI safety logic — unrelated
- UI components — minimal change (only `saveResumeFull` call signature)
- Dev-only test scenarios — no change

---

## Error Scenarios

| Error | Cause | Client sees |
|-------|-------|-------------|
| `Authentication required` | `auth.uid()` is null | "Ошибка сохранения" |
| RLS violation | User tries to save another user's resume | "Ошибка сохранения" (PostgreSQL error) |
| FK violation | resume_id references non-existent resume | "Ошибка сохранения" |
| NULL constraint | Empty skill name passes filter | Caught by WHERE clause, row skipped |
| Invalid JSON | Malformed `p_data` | "Ошибка сохранения" (PostgreSQL parse error) |
| Network timeout | Supabase connection drops mid-RPC | "Ошибка сохранения" (transaction rolled back) |

**Key benefit:** If ANY step fails, PostgreSQL rolls back the entire transaction. No partial writes possible.

---

## Manual Testing Plan

1. **Fresh resume:** Create new resume via editor → verify all tables populated
2. **Update existing:** Edit skills → save → verify old skills deleted, new ones present
3. **Empty sections:** Save with empty education → verify education table empty, other tables intact
4. **Race condition:** Rapid autosave (multiple saves within 1s) → verify no duplicate rows, data consistent
5. **Concurrent users:** Two browser tabs editing same resume → last write wins (expected behavior)
6. **Export check:** After save, export PDF/DOCX/Markdown → verify content matches
7. **Load check:** After save, reload page → verify `loadUserResume()` returns correct data
8. **Dashboard:** After save, Dashboard shows correct counts for skills/education/experience/github
9. **Unauthenticated:** Call RPC without JWT → should fail with "Authentication required"

---

## Security Analysis

| Concern | Mitigation |
|---------|------------|
| User A saves User B's resume | RLS policies enforce `user_id = auth.uid()` through FK join |
| Client spoofs `user_id` | No `p_user_id` parameter; function uses `auth.uid()` internally |
| SQL injection via jsonb | `jsonb_array_elements` is type-safe; no string interpolation |
| search_path hijacking | `SET search_path = ''` + fully qualified `public.tablename` |
| Unsafe numeric casts | Regex-guarded: `'^[1-5]$'` for level, `'^[0-9]+$'` for stars |
| `SECURITY INVOKER` RLS dependency | RLS is already enforced by existing client code; INVOKER preserves this |
| Malformed JSON | PostgreSQL will throw on invalid JSON; client gets error, transaction rolls back |

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| RPC deployment requires `supabase db push` | Medium | Document deployment steps clearly |
| RLS dependency (SECURITY INVOKER) | Low | RLS already works for current client code; INVOKER preserves it |
| No local testing without Supabase DB | Medium | Unit tests for client normalization; manual testing on hosted Supabase |
| Breaking change if RPC signature changes later | Low | Stable interface, version via migration naming |
| Existing data migration | None | RPC works with existing data; no schema changes to tables |
| `userId` parameter removal breaks callers | Low | Find-and-replace in `ResumeEditor.jsx` |

---

## Execution Order

| Step | Task | Estimated Time |
|------|------|----------------|
| 1 | Create migration SQL file with `save_resume_full()` | 15 min |
| 2 | Update `resumeService.js` to call RPC (remove `userId` param) | 10 min |
| 3 | Update `ResumeEditor.jsx` to remove `userId` from `saveResumeFull` call | 5 min |
| 4 | Add unit tests for `normalizeLoadedResumeData` | 10 min |
| 5 | Build + lint + test verification | 5 min |
| 6 | Deploy migration to Supabase (manual) | 5 min |
| 7 | Manual testing on hosted Supabase | 15 min |

**Total estimated:** ~65 min

---

## Deployment Steps (Manual)

```bash
# 1. Push migration
supabase db push

# 2. Verify function exists
supabase sql --query "SELECT proname FROM pg_proc WHERE proname = 'save_resume_full';"

# 3. Test manually (authenticated)
supabase sql --query "SELECT save_resume_full(
  'Test Resume',
  '{\"profile\":{\"name\":\"Test\"},\"skills\":[],\"education\":[],\"experience\":[],\"github\":[]}'::jsonb
);"

# 4. Verify RLS still works
# (should fail if called without auth)
```
