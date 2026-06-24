-- MR-MANUAL-PROJECTS-SCHEMA-1: Create manual_projects table
-- Derived mirror of resumes.data.projects (authoritative source remains JSONB)
-- No backfill, no RPC changes, no frontend changes on this stage

BEGIN;

-- =====================================================
-- 1. Table
-- =====================================================

CREATE TABLE public.manual_projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id   uuid NOT NULL,
  name        text,
  role        text,
  description text,
  tech_stack  text,
  link        text,
  period      text,
  "position"  integer NOT NULL DEFAULT 0,

  CONSTRAINT manual_projects_resume_id_fkey
    FOREIGN KEY (resume_id)
    REFERENCES public.resumes(id)
    ON DELETE CASCADE,

  CONSTRAINT manual_projects_position_nonnegative
    CHECK ("position" >= 0),

  CONSTRAINT manual_projects_resume_position_unique
    UNIQUE (resume_id, "position")
);

-- =====================================================
-- 2. Indexes
-- =====================================================

-- Unique constraint already creates a B-tree on (resume_id, position),
-- covering resume_id lookups. No additional index needed.

-- =====================================================
-- 3. RLS
-- =====================================================

ALTER TABLE public.manual_projects ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS "manual_projects_select_own" ON public.manual_projects;
CREATE POLICY "manual_projects_select_own"
  ON public.manual_projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = manual_projects.resume_id
        AND r.user_id = auth.uid()
    )
  );

-- INSERT
DROP POLICY IF EXISTS "manual_projects_insert_own" ON public.manual_projects;
CREATE POLICY "manual_projects_insert_own"
  ON public.manual_projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = manual_projects.resume_id
        AND r.user_id = auth.uid()
    )
  );

-- UPDATE
DROP POLICY IF EXISTS "manual_projects_update_own" ON public.manual_projects;
CREATE POLICY "manual_projects_update_own"
  ON public.manual_projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = manual_projects.resume_id
        AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = manual_projects.resume_id
        AND r.user_id = auth.uid()
    )
  );

-- DELETE
DROP POLICY IF EXISTS "manual_projects_delete_own" ON public.manual_projects;
CREATE POLICY "manual_projects_delete_own"
  ON public.manual_projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = manual_projects.resume_id
        AND r.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. Grants — revoke all from client roles
-- =====================================================

-- Table is schema-only at this stage; no direct client access.
-- RPC functions will use SECURITY INVOKER and bypass RLS.
-- Revoke from anon and authenticated to prevent direct table access.

REVOKE ALL PRIVILEGES ON TABLE public.manual_projects FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.manual_projects FROM authenticated;

COMMIT;
