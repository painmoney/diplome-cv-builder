-- RPC-DB-1-FIX: Fix create_resume_full idempotency
-- Created: 2026-06-21
-- Fixes: same user + same UUID → idempotent return (was returning P1003)
-- Only replaces create_resume_full; save_resume_full unchanged.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_resume_full(
  p_resume_id uuid,
  p_title text,
  p_template text,
  p_data jsonb
)
RETURNS TABLE (
  out_resume_id uuid,
  out_revision integer,
  out_updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_template text;
  v_data jsonb;
  v_resume_id uuid;
  v_revision integer;
  v_updated_at timestamptz;
  v_constraint_name text;
BEGIN
  -- ===================================================
  -- Authentication
  -- ===================================================
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'
      USING ERRCODE = 'P1001';
  END IF;

  -- ===================================================
  -- Payload validation (before any write)
  -- ===================================================
  IF p_resume_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD'
      USING ERRCODE = 'P1002';
  END IF;

  IF p_data IS NULL OR jsonb_typeof(p_data) != 'object' THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD'
      USING ERRCODE = 'P1002';
  END IF;

  IF p_data->'skills' IS NOT NULL
     AND jsonb_typeof(p_data->'skills') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD'
      USING ERRCODE = 'P1002';
  END IF;

  IF p_data->'education' IS NOT NULL
     AND jsonb_typeof(p_data->'education') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD'
      USING ERRCODE = 'P1002';
  END IF;

  IF p_data->'experience' IS NOT NULL
     AND jsonb_typeof(p_data->'experience') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD'
      USING ERRCODE = 'P1002';
  END IF;

  IF p_data->'github' IS NOT NULL
     AND jsonb_typeof(p_data->'github') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD'
      USING ERRCODE = 'P1002';
  END IF;

  IF p_data->'projects' IS NOT NULL
     AND jsonb_typeof(p_data->'projects') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD'
      USING ERRCODE = 'P1002';
  END IF;

  IF p_data->'profile' IS NOT NULL
     AND jsonb_typeof(p_data->'profile') NOT IN ('object', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD'
      USING ERRCODE = 'P1002';
  END IF;

  -- ===================================================
  -- Template normalization
  -- ===================================================
  v_template := COALESCE(NULLIF(btrim(p_template), ''), 'minimalist');
  v_data := jsonb_set(p_data, '{template}', to_jsonb(v_template), true);

  -- ===================================================
  -- Insert parent resume
  -- ON CONFLICT (id) handles same-UUID retry (idempotent).
  -- EXCEPTION handler catches resumes_user_id_unique for different-UUID case.
  -- ===================================================
  BEGIN
    INSERT INTO public.resumes (id, user_id, title, template, data, revision, updated_at)
    VALUES (p_resume_id, v_user_id, p_title, v_template, v_data, 1, now())
    ON CONFLICT (id) DO NOTHING
    RETURNING id, revision, updated_at
    INTO v_resume_id, v_revision, v_updated_at;
  EXCEPTION
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
      IF v_constraint_name = 'resumes_user_id_unique' THEN
        -- User already has a resume. Check if same UUID (idempotent) or different (P1003).
        SELECT r.id, r.revision, r.updated_at
        INTO v_resume_id, v_revision, v_updated_at
        FROM public.resumes r
        WHERE r.id = p_resume_id AND r.user_id = v_user_id;

        IF v_resume_id IS NOT NULL THEN
          -- Same UUID, same user → idempotent retry. Return existing, skip child sync.
          out_resume_id := v_resume_id;
          out_revision  := v_revision;
          out_updated_at := v_updated_at;
          RETURN NEXT;
          RETURN;
        ELSE
          -- Different UUID, same user → not idempotent.
          RAISE EXCEPTION 'RESUME_ALREADY_EXISTS'
            USING ERRCODE = 'P1003';
        END IF;
      ELSE
        RAISE;
      END IF;
  END;

  -- ===================================================
  -- INSERT succeeded (new resume) — sync child rows
  -- ===================================================
  IF v_resume_id IS NOT NULL THEN

    -- --- Skills ---
    DELETE FROM public.skills WHERE resume_id = v_resume_id;

    INSERT INTO public.skills (resume_id, skill_name, level)
    WITH raw_skills AS (
      SELECT
        s,
        NULLIF(btrim(
          CASE WHEN jsonb_typeof(s) = 'string' THEN s#>>'{}'
               ELSE s->>'name'
          END
        ), '') AS skill_name,
        CASE WHEN jsonb_typeof(s) = 'object' THEN s->>'level'
             ELSE NULL
        END AS raw_level
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(v_data->'skills') = 'array'
             THEN v_data->'skills'
             ELSE '[]'::jsonb
        END
      ) s
    ),
    parsed_levels AS (
      SELECT
        skill_name,
        CASE
          WHEN raw_level IS NULL THEN NULL
          WHEN raw_level ~ '^-?[0-9]+(\.[0-9]+)?$'
            THEN LEAST(5::numeric, GREATEST(1::numeric, ROUND(raw_level::numeric)))::smallint
          ELSE NULL
        END AS level
      FROM raw_skills
    )
    SELECT v_resume_id, skill_name, level
    FROM parsed_levels
    WHERE skill_name IS NOT NULL;

    -- --- Education ---
    DELETE FROM public.education WHERE resume_id = v_resume_id;

    INSERT INTO public.education (resume_id, institution, institute, department, program, degree, years)
    SELECT v_resume_id,
      NULLIF(btrim(e->>'institution'), ''),
      NULLIF(btrim(e->>'institute'), ''),
      NULLIF(btrim(e->>'department'), ''),
      NULLIF(btrim(e->>'program'), ''),
      NULLIF(btrim(e->>'degree'), ''),
      COALESCE(NULLIF(btrim(e->>'years'), ''), NULLIF(btrim(e->>'year'), ''))
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(v_data->'education') = 'array'
           THEN v_data->'education'
           ELSE '[]'::jsonb
      END
    ) e
    WHERE jsonb_typeof(e) = 'object'
      AND NULLIF(btrim(e->>'institution'), '') IS NOT NULL;

    -- --- Experience ---
    DELETE FROM public.experience WHERE resume_id = v_resume_id;

    INSERT INTO public.experience (resume_id, company, position, period, description)
    SELECT v_resume_id,
      NULLIF(btrim(x->>'company'), ''),
      COALESCE(NULLIF(btrim(x->>'position'), ''), 'Не указано'),
      NULLIF(btrim(x->>'period'), ''),
      NULLIF(btrim(x->>'description'), '')
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(v_data->'experience') = 'array'
           THEN v_data->'experience'
           ELSE '[]'::jsonb
      END
    ) x
    WHERE jsonb_typeof(x) = 'object'
      AND NULLIF(btrim(x->>'company'), '') IS NOT NULL;

    -- --- GitHub Projects ---
    DELETE FROM public.github_projects WHERE resume_id = v_resume_id;

    INSERT INTO public.github_projects (resume_id, project_name, project_url, description, stars)
    SELECT v_resume_id,
      NULLIF(btrim(g->>'name'), ''),
      NULLIF(btrim(g->>'url'), ''),
      NULLIF(btrim(g->>'description'), ''),
      CASE
        WHEN g->>'stars' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN
          CASE
            WHEN ROUND((g->>'stars')::numeric)
                 BETWEEN (-2147483648)::numeric
                     AND 2147483647::numeric
              THEN ROUND((g->>'stars')::numeric)::integer
            ELSE 0
          END
        ELSE 0
      END
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(v_data->'github') = 'array'
           THEN v_data->'github'
           ELSE '[]'::jsonb
      END
    ) g
    WHERE jsonb_typeof(g) = 'object'
      AND NULLIF(btrim(g->>'name'), '') IS NOT NULL;

    -- Return created resume
    out_resume_id := v_resume_id;
    out_revision  := v_revision;
    out_updated_at := v_updated_at;
    RETURN NEXT;
    RETURN;
  END IF;

  -- ===================================================
  -- INSERT skipped by ON CONFLICT (id) DO NOTHING
  -- Same UUID, same user → return existing (idempotent)
  -- ===================================================
  SELECT r.id, r.revision, r.updated_at
  INTO v_resume_id, v_revision, v_updated_at
  FROM public.resumes r
  WHERE r.id = p_resume_id
    AND r.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESUME_NOT_FOUND_OR_FORBIDDEN'
      USING ERRCODE = 'P1004';
  END IF;

  out_resume_id := v_resume_id;
  out_revision  := v_revision;
  out_updated_at := v_updated_at;
  RETURN NEXT;
  RETURN;
END;
$$;

COMMIT;
