-- MR-MANUAL-PROJECTS-BACKFILL-1: Backfill manual_projects from resumes.data.projects
-- Atomic: validation + backfill in single transaction
-- JSONB remains authoritative; this migration populates the derived mirror

BEGIN;

-- =====================================================
-- 1. Validation: container types
-- =====================================================

DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT count(*) INTO bad_count
  FROM public.resumes r
  WHERE r.data -> 'projects' IS NOT NULL
    AND jsonb_typeof(r.data -> 'projects') NOT IN ('array', 'null');

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'BLOCKED_BY_INVALID_HISTORICAL_PROJECTS_CONTAINER: % resumes', bad_count;
  END IF;
END $$;

-- =====================================================
-- 2. Validation: element types (only objects allowed)
-- =====================================================

DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT count(*) INTO bad_count
  FROM public.resumes r,
       LATERAL jsonb_array_elements(COALESCE(r.data -> 'projects', '[]'::jsonb)) elem
  WHERE jsonb_typeof(r.data -> 'projects') = 'array'
    AND jsonb_typeof(elem) != 'object';

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'BLOCKED_BY_INVALID_HISTORICAL_PROJECT_ITEM: % non-object items', bad_count;
  END IF;
END $$;

-- =====================================================
-- 3. Validation: field types (all must be string/null/missing)
-- =====================================================

DO $$
DECLARE
  bad_count integer;
  v_field text;
BEGIN
  FOR v_field IN SELECT unnest(ARRAY['id','name','role','description','techStack','link','period']) LOOP
    SELECT count(*) INTO bad_count
    FROM public.resumes r,
         LATERAL jsonb_array_elements(COALESCE(r.data -> 'projects', '[]'::jsonb)) elem
    WHERE jsonb_typeof(r.data -> 'projects') = 'array'
      AND jsonb_typeof(elem) = 'object'
      AND elem -> v_field IS NOT NULL
      AND jsonb_typeof(elem -> v_field) NOT IN ('string', 'null');

    IF bad_count > 0 THEN
      RAISE EXCEPTION 'BLOCKED_BY_INVALID_HISTORICAL_PROJECT_FIELD_TYPE: field % has % invalid values', v_field, bad_count;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- 4. Validation: duplicate non-empty source_id within resume
-- =====================================================

DO $$
DECLARE
  bad_groups integer;
BEGIN
  SELECT count(*) INTO bad_groups
  FROM (
    SELECT r.id AS resume_id, elem ->> 'id' AS src_id
    FROM public.resumes r,
         LATERAL jsonb_array_elements(COALESCE(r.data -> 'projects', '[]'::jsonb)) elem
    WHERE jsonb_typeof(r.data -> 'projects') = 'array'
      AND jsonb_typeof(elem) = 'object'
      AND elem ->> 'id' IS NOT NULL
      AND btrim(elem ->> 'id') != ''
    GROUP BY r.id, elem ->> 'id'
    HAVING count(*) > 1
  ) dups;

  IF bad_groups > 0 THEN
    RAISE EXCEPTION 'BLOCKED_BY_DUPLICATE_PROJECT_SOURCE_ID: % duplicate groups', bad_groups;
  END IF;
END $$;

-- =====================================================
-- 5. Clear existing derived rows
-- =====================================================

DELETE FROM public.manual_projects;

-- =====================================================
-- 6. Insert backfill from JSONB
-- =====================================================

INSERT INTO public.manual_projects (id, resume_id, source_id, name, role, description, tech_stack, link, period, "position")
SELECT
  gen_random_uuid(),
  r.id AS resume_id,
  NULLIF(NULLIF(btrim(elem ->> 'id'), ''), '') AS source_id,
  NULLIF(btrim(elem ->> 'name'), '') AS name,
  NULLIF(btrim(elem ->> 'role'), '') AS role,
  NULLIF(btrim(elem ->> 'description'), '') AS description,
  NULLIF(btrim(elem ->> 'techStack'), '') AS tech_stack,
  NULLIF(btrim(elem ->> 'link'), '') AS link,
  NULLIF(btrim(elem ->> 'period'), '') AS period,
  (o - 1)::integer AS "position"
FROM public.resumes r,
     LATERAL jsonb_array_elements(COALESCE(r.data -> 'projects', '[]'::jsonb)) WITH ORDINALITY AS t(elem, o)
WHERE jsonb_typeof(r.data -> 'projects') = 'array'
  AND jsonb_typeof(elem) = 'object';

COMMIT;
