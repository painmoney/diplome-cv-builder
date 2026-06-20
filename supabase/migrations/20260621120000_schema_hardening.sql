-- Schema-2: Schema hardening for atomic RPC preparation
-- Created: 2026-06-21
-- Security-1 already applied: RLS enabled, policies exist, anon blocked
-- This migration adds: NOT NULL constraints, child indexes, revision column

BEGIN;

-- =====================================================
-- A. Preconditions — abort if data violates baseline
-- =====================================================

DO $$
BEGIN
  -- Check NULL user_id in resumes
  IF EXISTS (SELECT 1 FROM public.resumes WHERE user_id IS NULL) THEN
    RAISE EXCEPTION 'Schema-2 aborted: public.resumes contains NULL user_id';
  END IF;

  -- Check NULL user_id in profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id IS NULL) THEN
    RAISE EXCEPTION 'Schema-2 aborted: public.profiles contains NULL user_id';
  END IF;

  -- Check NULL resume_id in child tables
  IF EXISTS (SELECT 1 FROM public.skills WHERE resume_id IS NULL) THEN
    RAISE EXCEPTION 'Schema-2 aborted: public.skills contains NULL resume_id';
  END IF;

  IF EXISTS (SELECT 1 FROM public.education WHERE resume_id IS NULL) THEN
    RAISE EXCEPTION 'Schema-2 aborted: public.education contains NULL resume_id';
  END IF;

  IF EXISTS (SELECT 1 FROM public.experience WHERE resume_id IS NULL) THEN
    RAISE EXCEPTION 'Schema-2 aborted: public.experience contains NULL resume_id';
  END IF;

  IF EXISTS (SELECT 1 FROM public.github_projects WHERE resume_id IS NULL) THEN
    RAISE EXCEPTION 'Schema-2 aborted: public.github_projects contains NULL resume_id';
  END IF;

  -- Check orphaned child rows (resume_id references non-existent resume)
  IF EXISTS (
    SELECT 1 FROM public.skills s
    WHERE NOT EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = s.resume_id)
  ) THEN
    RAISE EXCEPTION 'Schema-2 aborted: public.skills contains orphaned rows';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.education e
    WHERE NOT EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = e.resume_id)
  ) THEN
    RAISE EXCEPTION 'Schema-2 aborted: public.education contains orphaned rows';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.experience x
    WHERE NOT EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = x.resume_id)
  ) THEN
    RAISE EXCEPTION 'Schema-2 aborted: public.experience contains orphaned rows';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.github_projects g
    WHERE NOT EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = g.resume_id)
  ) THEN
    RAISE EXCEPTION 'Schema-2 aborted: public.github_projects contains orphaned rows';
  END IF;
END
$$;

-- =====================================================
-- C. NOT NULL constraints
-- =====================================================

ALTER TABLE public.resumes
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.skills
  ALTER COLUMN resume_id SET NOT NULL;

ALTER TABLE public.education
  ALTER COLUMN resume_id SET NOT NULL;

ALTER TABLE public.experience
  ALTER COLUMN resume_id SET NOT NULL;

ALTER TABLE public.github_projects
  ALTER COLUMN resume_id SET NOT NULL;

-- =====================================================
-- D. Child indexes on resume_id
-- =====================================================

CREATE INDEX idx_skills_resume_id
  ON public.skills (resume_id);

CREATE INDEX idx_education_resume_id
  ON public.education (resume_id);

CREATE INDEX idx_experience_resume_id
  ON public.experience (resume_id);

CREATE INDEX idx_github_projects_resume_id
  ON public.github_projects (resume_id);

-- =====================================================
-- E. Revision column for optimistic locking
-- =====================================================

ALTER TABLE public.resumes
  ADD COLUMN revision integer NOT NULL DEFAULT 1;

COMMIT;
