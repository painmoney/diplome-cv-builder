-- RECOVERY-1: Restore canonical CV Builder backend contract
-- Created: 2026-06-25
-- Purpose: Rebuild full backend from scratch, compatible with:
--   State A: clean database after all previous migrations applied
--   State B: damaged primary where public objects are missing but migration history remains
-- Forward-only, idempotent, safe on repeat application.
-- No destructive DDL, no data removal.

BEGIN;

-- =====================================================
-- 1. TABLES — CREATE IF NOT EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text DEFAULT '',
  template text DEFAULT 'minimalist',
  data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  email text,
  phone text,
  about text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skills (
  id bigserial PRIMARY KEY,
  resume_id uuid NOT NULL,
  skill_name text,
  level smallint
);

CREATE TABLE IF NOT EXISTS public.education (
  id bigserial PRIMARY KEY,
  resume_id uuid NOT NULL,
  institution text,
  institute text,
  department text,
  program text,
  degree text,
  years text
);

CREATE TABLE IF NOT EXISTS public.experience (
  id bigserial PRIMARY KEY,
  resume_id uuid NOT NULL,
  company text,
  position text,
  period text,
  description text
);

CREATE TABLE IF NOT EXISTS public.github_projects (
  id bigserial PRIMARY KEY,
  resume_id uuid NOT NULL,
  project_name text,
  project_url text,
  description text,
  stars integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.manual_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL,
  name text,
  role text,
  description text,
  tech_stack text,
  link text,
  period text,
  "position" integer NOT NULL DEFAULT 0,
  source_id text
);

-- =====================================================
-- 2. ADD COLUMNS IF NOT EXISTS (direct, no exception wrapper)
-- =====================================================

ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- =====================================================
-- 3. NOT NULL constraints (no silent failure)
-- =====================================================

ALTER TABLE public.resumes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.skills ALTER COLUMN resume_id SET NOT NULL;
ALTER TABLE public.education ALTER COLUMN resume_id SET NOT NULL;
ALTER TABLE public.experience ALTER COLUMN resume_id SET NOT NULL;
ALTER TABLE public.github_projects ALTER COLUMN resume_id SET NOT NULL;

-- =====================================================
-- 4. FOREIGN KEYS with pg_constraint verification
-- =====================================================

-- 4a. resumes.user_id → auth.users(id) ON DELETE CASCADE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'resumes_user_id_fkey'
      AND n.nspname = 'public'
      AND rel.relname = 'resumes'
      AND c.contype = 'f'
  ) THEN
    ALTER TABLE public.resumes
      ADD CONSTRAINT resumes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE c.conname = 'resumes_user_id_fkey'
        AND n.nspname = 'public'
        AND rel.relname = 'resumes'
        AND c.contype = 'f'
        AND c.conkey = (SELECT ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.resumes'::regclass AND attname = 'user_id'))
        AND c.confrelid = 'auth.users'::regclass
        AND c.confdeltype = 'c'
    ) THEN
      RAISE EXCEPTION 'FK resumes_user_id_fkey exists but definition mismatch';
    END IF;
  END IF;
END $$;

-- 4b. skills.resume_id → resumes(id) ON DELETE CASCADE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'skills_resume_id_fkey'
      AND n.nspname = 'public'
      AND rel.relname = 'skills'
      AND c.contype = 'f'
  ) THEN
    ALTER TABLE public.skills
      ADD CONSTRAINT skills_resume_id_fkey
      FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE CASCADE;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE c.conname = 'skills_resume_id_fkey'
        AND n.nspname = 'public'
        AND rel.relname = 'skills'
        AND c.contype = 'f'
        AND c.conkey = (SELECT ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.skills'::regclass AND attname = 'resume_id'))
        AND c.confrelid = 'public.resumes'::regclass
        AND c.confdeltype = 'c'
    ) THEN
      RAISE EXCEPTION 'FK skills_resume_id_fkey exists but definition mismatch';
    END IF;
  END IF;
END $$;

-- 4c. education.resume_id → resumes(id) ON DELETE CASCADE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'education_resume_id_fkey'
      AND n.nspname = 'public'
      AND rel.relname = 'education'
      AND c.contype = 'f'
  ) THEN
    ALTER TABLE public.education
      ADD CONSTRAINT education_resume_id_fkey
      FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE CASCADE;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE c.conname = 'education_resume_id_fkey'
        AND n.nspname = 'public'
        AND rel.relname = 'education'
        AND c.contype = 'f'
        AND c.conkey = (SELECT ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.education'::regclass AND attname = 'resume_id'))
        AND c.confrelid = 'public.resumes'::regclass
        AND c.confdeltype = 'c'
    ) THEN
      RAISE EXCEPTION 'FK education_resume_id_fkey exists but definition mismatch';
    END IF;
  END IF;
END $$;

-- 4d. experience.resume_id → resumes(id) ON DELETE CASCADE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'experience_resume_id_fkey'
      AND n.nspname = 'public'
      AND rel.relname = 'experience'
      AND c.contype = 'f'
  ) THEN
    ALTER TABLE public.experience
      ADD CONSTRAINT experience_resume_id_fkey
      FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE CASCADE;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE c.conname = 'experience_resume_id_fkey'
        AND n.nspname = 'public'
        AND rel.relname = 'experience'
        AND c.contype = 'f'
        AND c.conkey = (SELECT ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.experience'::regclass AND attname = 'resume_id'))
        AND c.confrelid = 'public.resumes'::regclass
        AND c.confdeltype = 'c'
    ) THEN
      RAISE EXCEPTION 'FK experience_resume_id_fkey exists but definition mismatch';
    END IF;
  END IF;
END $$;

-- 4e. github_projects.resume_id → resumes(id) ON DELETE CASCADE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'github_projects_resume_id_fkey'
      AND n.nspname = 'public'
      AND rel.relname = 'github_projects'
      AND c.contype = 'f'
  ) THEN
    ALTER TABLE public.github_projects
      ADD CONSTRAINT github_projects_resume_id_fkey
      FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE CASCADE;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE c.conname = 'github_projects_resume_id_fkey'
        AND n.nspname = 'public'
        AND rel.relname = 'github_projects'
        AND c.contype = 'f'
        AND c.conkey = (SELECT ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.github_projects'::regclass AND attname = 'resume_id'))
        AND c.confrelid = 'public.resumes'::regclass
        AND c.confdeltype = 'c'
    ) THEN
      RAISE EXCEPTION 'FK github_projects_resume_id_fkey exists but definition mismatch';
    END IF;
  END IF;
END $$;

-- 4f. manual_projects.resume_id → resumes(id) ON DELETE CASCADE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'manual_projects_resume_id_fkey'
      AND n.nspname = 'public'
      AND rel.relname = 'manual_projects'
      AND c.contype = 'f'
  ) THEN
    ALTER TABLE public.manual_projects
      ADD CONSTRAINT manual_projects_resume_id_fkey
      FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE CASCADE;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE c.conname = 'manual_projects_resume_id_fkey'
        AND n.nspname = 'public'
        AND rel.relname = 'manual_projects'
        AND c.contype = 'f'
        AND c.conkey = (SELECT ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.manual_projects'::regclass AND attname = 'resume_id'))
        AND c.confrelid = 'public.resumes'::regclass
        AND c.confdeltype = 'c'
    ) THEN
      RAISE EXCEPTION 'FK manual_projects_resume_id_fkey exists but definition mismatch';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 5. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes (user_id);
CREATE INDEX IF NOT EXISTS idx_skills_resume_id ON public.skills (resume_id);
CREATE INDEX IF NOT EXISTS idx_education_resume_id ON public.education (resume_id);
CREATE INDEX IF NOT EXISTS idx_experience_resume_id ON public.experience (resume_id);
CREATE INDEX IF NOT EXISTS idx_github_projects_resume_id ON public.github_projects (resume_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_projects_resume_source
  ON public.manual_projects (resume_id, source_id)
  WHERE source_id IS NOT NULL;

-- Verify idx_resumes_user_id is NON-UNIQUE
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'resumes'
      AND indexname = 'idx_resumes_user_id' AND indexdef LIKE '%UNIQUE%'
  ) THEN
    RAISE EXCEPTION 'idx_resumes_user_id must be NON-UNIQUE';
  END IF;
END $$;

-- =====================================================
-- 6. CONSTRAINTS with verification
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'manual_projects_position_nonnegative'
      AND n.nspname = 'public' AND rel.relname = 'manual_projects'
      AND c.contype = 'c'
  ) THEN
    ALTER TABLE public.manual_projects
      ADD CONSTRAINT manual_projects_position_nonnegative
      CHECK ("position" >= 0);
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE c.conname = 'manual_projects_position_nonnegative'
        AND n.nspname = 'public' AND rel.relname = 'manual_projects'
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) = 'CHECK (("position" >= 0))'
    ) THEN
      RAISE EXCEPTION 'CHECK manual_projects_position_nonnegative exists but definition mismatch';
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'manual_projects_resume_position_unique'
      AND n.nspname = 'public' AND rel.relname = 'manual_projects'
      AND c.contype = 'u'
  ) THEN
    ALTER TABLE public.manual_projects
      ADD CONSTRAINT manual_projects_resume_position_unique
      UNIQUE (resume_id, "position");
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE c.conname = 'manual_projects_resume_position_unique'
        AND n.nspname = 'public' AND rel.relname = 'manual_projects'
        AND c.contype = 'u'
        AND c.conkey = (SELECT ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.manual_projects'::regclass AND attname IN ('resume_id', 'position') ORDER BY attnum))
    ) THEN
      RAISE EXCEPTION 'UNIQUE manual_projects_resume_position_unique exists but definition mismatch';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 7. RLS — ENABLE on all tables
-- =====================================================

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_projects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. RLS POLICIES — resumes (TO authenticated)
-- =====================================================

DROP POLICY IF EXISTS "resumes_select_own" ON public.resumes;
CREATE POLICY "resumes_select_own" ON public.resumes
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "resumes_insert_own" ON public.resumes;
CREATE POLICY "resumes_insert_own" ON public.resumes
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "resumes_update_own" ON public.resumes;
CREATE POLICY "resumes_update_own" ON public.resumes
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "resumes_delete_own" ON public.resumes;
CREATE POLICY "resumes_delete_own" ON public.resumes
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- =====================================================
-- 9. RLS POLICIES — profiles (TO authenticated)
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- =====================================================
-- 10. RLS POLICIES — skills (TO authenticated)
-- =====================================================

DROP POLICY IF EXISTS "skills_select_own" ON public.skills;
CREATE POLICY "skills_select_own" ON public.skills FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = skills.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "skills_insert_own" ON public.skills;
CREATE POLICY "skills_insert_own" ON public.skills FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = skills.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "skills_update_own" ON public.skills;
CREATE POLICY "skills_update_own" ON public.skills FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = skills.resume_id AND r.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = skills.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "skills_delete_own" ON public.skills;
CREATE POLICY "skills_delete_own" ON public.skills FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = skills.resume_id AND r.user_id = (select auth.uid())));

-- =====================================================
-- 11. RLS POLICIES — education (TO authenticated)
-- =====================================================

DROP POLICY IF EXISTS "education_select_own" ON public.education;
CREATE POLICY "education_select_own" ON public.education FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = education.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "education_insert_own" ON public.education;
CREATE POLICY "education_insert_own" ON public.education FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = education.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "education_update_own" ON public.education;
CREATE POLICY "education_update_own" ON public.education FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = education.resume_id AND r.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = education.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "education_delete_own" ON public.education;
CREATE POLICY "education_delete_own" ON public.education FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = education.resume_id AND r.user_id = (select auth.uid())));

-- =====================================================
-- 12. RLS POLICIES — experience (TO authenticated)
-- =====================================================

DROP POLICY IF EXISTS "experience_select_own" ON public.experience;
CREATE POLICY "experience_select_own" ON public.experience FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = experience.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "experience_insert_own" ON public.experience;
CREATE POLICY "experience_insert_own" ON public.experience FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = experience.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "experience_update_own" ON public.experience;
CREATE POLICY "experience_update_own" ON public.experience FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = experience.resume_id AND r.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = experience.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "experience_delete_own" ON public.experience;
CREATE POLICY "experience_delete_own" ON public.experience FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = experience.resume_id AND r.user_id = (select auth.uid())));

-- =====================================================
-- 13. RLS POLICIES — github_projects (TO authenticated)
-- =====================================================

DROP POLICY IF EXISTS "github_projects_select_own" ON public.github_projects;
CREATE POLICY "github_projects_select_own" ON public.github_projects FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = github_projects.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "github_projects_insert_own" ON public.github_projects;
CREATE POLICY "github_projects_insert_own" ON public.github_projects FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = github_projects.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "github_projects_update_own" ON public.github_projects;
CREATE POLICY "github_projects_update_own" ON public.github_projects FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = github_projects.resume_id AND r.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = github_projects.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "github_projects_delete_own" ON public.github_projects;
CREATE POLICY "github_projects_delete_own" ON public.github_projects FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = github_projects.resume_id AND r.user_id = (select auth.uid())));

-- =====================================================
-- 14. RLS POLICIES — manual_projects (TO authenticated, select auth.uid())
-- =====================================================

DROP POLICY IF EXISTS "manual_projects_select_own" ON public.manual_projects;
CREATE POLICY "manual_projects_select_own" ON public.manual_projects
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = manual_projects.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "manual_projects_insert_own" ON public.manual_projects;
CREATE POLICY "manual_projects_insert_own" ON public.manual_projects
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = manual_projects.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "manual_projects_update_own" ON public.manual_projects;
CREATE POLICY "manual_projects_update_own" ON public.manual_projects
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = manual_projects.resume_id AND r.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = manual_projects.resume_id AND r.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "manual_projects_delete_own" ON public.manual_projects;
CREATE POLICY "manual_projects_delete_own" ON public.manual_projects
  FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = manual_projects.resume_id AND r.user_id = (select auth.uid())));

-- =====================================================
-- 15. GRANTS — scoped to 7 application tables only
-- =====================================================

REVOKE ALL PRIVILEGES ON TABLE
  public.resumes, public.profiles, public.skills,
  public.education, public.experience, public.github_projects,
  public.manual_projects
FROM anon;

REVOKE ALL PRIVILEGES ON TABLE
  public.resumes, public.profiles, public.skills,
  public.education, public.experience, public.github_projects,
  public.manual_projects
FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.resumes, public.profiles, public.skills,
  public.education, public.experience, public.github_projects
TO authenticated;

GRANT SELECT, INSERT, DELETE ON TABLE public.manual_projects TO authenticated;

-- =====================================================
-- 16. SEQUENCE PRIVILEGES
-- =====================================================
-- SECURITY INVOKER RPC performs INSERT into tables with bigserial PKs.
-- nextval() requires USAGE on the backing sequence.

REVOKE ALL ON SEQUENCE public.skills_id_seq FROM anon, authenticated;
GRANT USAGE ON SEQUENCE public.skills_id_seq TO authenticated;

REVOKE ALL ON SEQUENCE public.education_id_seq FROM anon, authenticated;
GRANT USAGE ON SEQUENCE public.education_id_seq TO authenticated;

REVOKE ALL ON SEQUENCE public.experience_id_seq FROM anon, authenticated;
GRANT USAGE ON SEQUENCE public.experience_id_seq TO authenticated;

REVOKE ALL ON SEQUENCE public.github_projects_id_seq FROM anon, authenticated;
GRANT USAGE ON SEQUENCE public.github_projects_id_seq TO authenticated;

-- =====================================================
-- 17. RPC: create_resume_full
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_resume_full(
  p_resume_id uuid,
  p_title text,
  p_template text,
  p_data jsonb
)
RETURNS TABLE(out_resume_id uuid, out_revision integer, out_updated_at timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_template text;
  v_data jsonb;
  v_resume_id uuid;
  v_revision integer;
  v_updated_at timestamptz;
  v_projects jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE = 'P1001';
  END IF;
  IF p_resume_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data IS NULL OR jsonb_typeof(p_data) != 'object' THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'skills' IS NOT NULL AND jsonb_typeof(p_data->'skills') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'education' IS NOT NULL AND jsonb_typeof(p_data->'education') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'experience' IS NOT NULL AND jsonb_typeof(p_data->'experience') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'github' IS NOT NULL AND jsonb_typeof(p_data->'github') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'projects' IS NOT NULL AND jsonb_typeof(p_data->'projects') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'profile' IS NOT NULL AND jsonb_typeof(p_data->'profile') NOT IN ('object', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;

  v_template := COALESCE(NULLIF(btrim(p_template), ''), 'minimalist');
  v_data := jsonb_set(p_data, '{template}', to_jsonb(v_template), true);

  INSERT INTO public.resumes (id, user_id, title, template, data, revision, updated_at)
  VALUES (p_resume_id, v_user_id, p_title, v_template, v_data, 1, now())
  ON CONFLICT (id) DO NOTHING
  RETURNING id, revision, updated_at
  INTO v_resume_id, v_revision, v_updated_at;

  IF v_resume_id IS NOT NULL THEN
    DELETE FROM public.skills WHERE resume_id = v_resume_id;
    INSERT INTO public.skills (resume_id, skill_name, level)
    WITH raw_skills AS (
      SELECT s,
        NULLIF(btrim(CASE WHEN jsonb_typeof(s) = 'string' THEN s#>>'{}' ELSE s->>'name' END), '') AS skill_name,
        CASE WHEN jsonb_typeof(s) = 'object' THEN s->>'level' ELSE NULL END AS raw_level
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_data->'skills') = 'array' THEN v_data->'skills' ELSE '[]'::jsonb END) s
    ), parsed_levels AS (
      SELECT skill_name,
        CASE WHEN raw_level IS NULL THEN NULL
          WHEN raw_level ~ '^-?[0-9]+(\.[0-9]+)?$' THEN LEAST(5::numeric, GREATEST(1::numeric, ROUND(raw_level::numeric)))::smallint
          ELSE NULL END AS level
      FROM raw_skills
    )
    SELECT v_resume_id, skill_name, level FROM parsed_levels WHERE skill_name IS NOT NULL;

    DELETE FROM public.education WHERE resume_id = v_resume_id;
    INSERT INTO public.education (resume_id, institution, institute, department, program, degree, years)
    SELECT v_resume_id,
      NULLIF(btrim(e->>'institution'), ''), NULLIF(btrim(e->>'institute'), ''),
      NULLIF(btrim(e->>'department'), ''), NULLIF(btrim(e->>'program'), ''),
      NULLIF(btrim(e->>'degree'), ''), COALESCE(NULLIF(btrim(e->>'years'), ''), NULLIF(btrim(e->>'year'), ''))
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_data->'education') = 'array' THEN v_data->'education' ELSE '[]'::jsonb END) e
    WHERE jsonb_typeof(e) = 'object' AND NULLIF(btrim(e->>'institution'), '') IS NOT NULL;

    DELETE FROM public.experience WHERE resume_id = v_resume_id;
    INSERT INTO public.experience (resume_id, company, position, period, description)
    SELECT v_resume_id,
      NULLIF(btrim(x->>'company'), ''), COALESCE(NULLIF(btrim(x->>'position'), ''), 'Не указано'),
      NULLIF(btrim(x->>'period'), ''), NULLIF(btrim(x->>'description'), '')
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_data->'experience') = 'array' THEN v_data->'experience' ELSE '[]'::jsonb END) x
    WHERE jsonb_typeof(x) = 'object' AND NULLIF(btrim(x->>'company'), '') IS NOT NULL;

    DELETE FROM public.github_projects WHERE resume_id = v_resume_id;
    INSERT INTO public.github_projects (resume_id, project_name, project_url, description, stars)
    SELECT v_resume_id,
      NULLIF(btrim(g->>'name'), ''), NULLIF(btrim(g->>'url'), ''),
      NULLIF(btrim(g->>'description'), ''),
      CASE WHEN g->>'stars' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN
        CASE WHEN ROUND((g->>'stars')::numeric) BETWEEN (-2147483648)::numeric AND 2147483647::numeric
          THEN ROUND((g->>'stars')::numeric)::integer ELSE 0 END ELSE 0 END
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_data->'github') = 'array' THEN v_data->'github' ELSE '[]'::jsonb END) g
    WHERE jsonb_typeof(g) = 'object' AND NULLIF(btrim(g->>'name'), '') IS NOT NULL;

    v_projects := CASE WHEN jsonb_typeof(v_data->'projects') = 'array' THEN v_data->'projects' ELSE '[]'::jsonb END;
    DELETE FROM public.manual_projects WHERE resume_id = v_resume_id;
    INSERT INTO public.manual_projects (resume_id, source_id, name, role, description, tech_stack, link, period, "position")
    SELECT v_resume_id,
      NULLIF(NULLIF(btrim(elem->>'id'), ''), ''), NULLIF(btrim(elem->>'name'), ''),
      NULLIF(btrim(elem->>'role'), ''), NULLIF(btrim(elem->>'description'), ''),
      NULLIF(btrim(elem->>'techStack'), ''), NULLIF(btrim(elem->>'link'), ''),
      NULLIF(btrim(elem->>'period'), ''), (o - 1)::integer
    FROM jsonb_array_elements(v_projects) WITH ORDINALITY AS t(elem, o)
    WHERE jsonb_typeof(elem) = 'object';

    out_resume_id := v_resume_id;
    out_revision := v_revision;
    out_updated_at := v_updated_at;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT r.id, r.revision, r.updated_at INTO v_resume_id, v_revision, v_updated_at
  FROM public.resumes r WHERE r.id = p_resume_id AND r.user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESUME_NOT_FOUND_OR_FORBIDDEN' USING ERRCODE = 'P1004';
  END IF;
  out_resume_id := v_resume_id;
  out_revision := v_revision;
  out_updated_at := v_updated_at;
  RETURN NEXT;
  RETURN;
END;
$function$;

-- =====================================================
-- 18. RPC: save_resume_full
-- =====================================================

CREATE OR REPLACE FUNCTION public.save_resume_full(
  p_resume_id uuid,
  p_title text,
  p_template text,
  p_data jsonb,
  p_expected_revision integer
)
RETURNS TABLE(out_resume_id uuid, out_revision integer, out_updated_at timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_template text;
  v_data jsonb;
  v_resume_id uuid;
  v_new_revision integer;
  v_updated_at timestamptz;
  v_found boolean;
  v_projects jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE = 'P1001';
  END IF;
  IF p_resume_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data IS NULL OR jsonb_typeof(p_data) != 'object' THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'skills' IS NOT NULL AND jsonb_typeof(p_data->'skills') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'education' IS NOT NULL AND jsonb_typeof(p_data->'education') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'experience' IS NOT NULL AND jsonb_typeof(p_data->'experience') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'github' IS NOT NULL AND jsonb_typeof(p_data->'github') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'projects' IS NOT NULL AND jsonb_typeof(p_data->'projects') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_data->'profile' IS NOT NULL AND jsonb_typeof(p_data->'profile') NOT IN ('object', 'null') THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;
  IF p_expected_revision IS NULL OR p_expected_revision < 1 THEN
    RAISE EXCEPTION 'INVALID_RESUME_PAYLOAD' USING ERRCODE = 'P1002';
  END IF;

  v_template := COALESCE(NULLIF(btrim(p_template), ''), 'minimalist');
  v_data := jsonb_set(p_data, '{template}', to_jsonb(v_template), true);

  UPDATE public.resumes AS r
  SET title = p_title, template = v_template, data = v_data,
      revision = r.revision + 1, updated_at = now()
  WHERE r.id = p_resume_id AND r.user_id = v_user_id AND r.revision = p_expected_revision
  RETURNING r.id, r.revision, r.updated_at
  INTO v_resume_id, v_new_revision, v_updated_at;

  IF v_resume_id IS NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.resumes r WHERE r.id = p_resume_id AND r.user_id = v_user_id) INTO v_found;
    IF v_found THEN
      RAISE EXCEPTION 'REVISION_CONFLICT' USING ERRCODE = 'P1005';
    ELSE
      RAISE EXCEPTION 'RESUME_NOT_FOUND_OR_FORBIDDEN' USING ERRCODE = 'P1004';
    END IF;
  END IF;

  DELETE FROM public.skills WHERE resume_id = v_resume_id;
  INSERT INTO public.skills (resume_id, skill_name, level)
  WITH raw_skills AS (
    SELECT s,
      NULLIF(btrim(CASE WHEN jsonb_typeof(s) = 'string' THEN s#>>'{}' ELSE s->>'name' END), '') AS skill_name,
      CASE WHEN jsonb_typeof(s) = 'object' THEN s->>'level' ELSE NULL END AS raw_level
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_data->'skills') = 'array' THEN v_data->'skills' ELSE '[]'::jsonb END) s
  ), parsed_levels AS (
    SELECT skill_name,
      CASE WHEN raw_level IS NULL THEN NULL
        WHEN raw_level ~ '^-?[0-9]+(\.[0-9]+)?$' THEN LEAST(5::numeric, GREATEST(1::numeric, ROUND(raw_level::numeric)))::smallint
        ELSE NULL END AS level
    FROM raw_skills
  )
  SELECT v_resume_id, skill_name, level FROM parsed_levels WHERE skill_name IS NOT NULL;

  DELETE FROM public.education WHERE resume_id = v_resume_id;
  INSERT INTO public.education (resume_id, institution, institute, department, program, degree, years)
  SELECT v_resume_id,
    NULLIF(btrim(e->>'institution'), ''), NULLIF(btrim(e->>'institute'), ''),
    NULLIF(btrim(e->>'department'), ''), NULLIF(btrim(e->>'program'), ''),
    NULLIF(btrim(e->>'degree'), ''), COALESCE(NULLIF(btrim(e->>'years'), ''), NULLIF(btrim(e->>'year'), ''))
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_data->'education') = 'array' THEN v_data->'education' ELSE '[]'::jsonb END) e
  WHERE jsonb_typeof(e) = 'object' AND NULLIF(btrim(e->>'institution'), '') IS NOT NULL;

  DELETE FROM public.experience WHERE resume_id = v_resume_id;
  INSERT INTO public.experience (resume_id, company, position, period, description)
  SELECT v_resume_id,
    NULLIF(btrim(x->>'company'), ''), COALESCE(NULLIF(btrim(x->>'position'), ''), 'Не указано'),
    NULLIF(btrim(x->>'period'), ''), NULLIF(btrim(x->>'description'), '')
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_data->'experience') = 'array' THEN v_data->'experience' ELSE '[]'::jsonb END) x
  WHERE jsonb_typeof(x) = 'object' AND NULLIF(btrim(x->>'company'), '') IS NOT NULL;

  DELETE FROM public.github_projects WHERE resume_id = v_resume_id;
  INSERT INTO public.github_projects (resume_id, project_name, project_url, description, stars)
  SELECT v_resume_id,
    NULLIF(btrim(g->>'name'), ''), NULLIF(btrim(g->>'url'), ''),
    NULLIF(btrim(g->>'description'), ''),
    CASE WHEN g->>'stars' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN
      CASE WHEN ROUND((g->>'stars')::numeric) BETWEEN (-2147483648)::numeric AND 2147483647::numeric
        THEN ROUND((g->>'stars')::numeric)::integer ELSE 0 END ELSE 0 END
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_data->'github') = 'array' THEN v_data->'github' ELSE '[]'::jsonb END) g
  WHERE jsonb_typeof(g) = 'object' AND NULLIF(btrim(g->>'name'), '') IS NOT NULL;

  v_projects := CASE WHEN jsonb_typeof(v_data->'projects') = 'array' THEN v_data->'projects' ELSE '[]'::jsonb END;
  DELETE FROM public.manual_projects WHERE resume_id = v_resume_id;
  INSERT INTO public.manual_projects (resume_id, source_id, name, role, description, tech_stack, link, period, "position")
  SELECT v_resume_id,
    NULLIF(NULLIF(btrim(elem->>'id'), ''), ''), NULLIF(btrim(elem->>'name'), ''),
    NULLIF(btrim(elem->>'role'), ''), NULLIF(btrim(elem->>'description'), ''),
    NULLIF(btrim(elem->>'techStack'), ''), NULLIF(btrim(elem->>'link'), ''),
    NULLIF(btrim(elem->>'period'), ''), (o - 1)::integer
  FROM jsonb_array_elements(v_projects) WITH ORDINALITY AS t(elem, o)
  WHERE jsonb_typeof(elem) = 'object';

  out_resume_id := v_resume_id;
  out_revision := v_new_revision;
  out_updated_at := v_updated_at;
  RETURN NEXT;
  RETURN;
END;
$function$;

-- =====================================================
-- 19. RPC GRANTS
-- =====================================================

REVOKE ALL ON FUNCTION public.create_resume_full(uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_resume_full(uuid, text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_resume_full(uuid, text, text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.save_resume_full(uuid, text, text, jsonb, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_resume_full(uuid, text, text, jsonb, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_resume_full(uuid, text, text, jsonb, integer) TO authenticated;

-- =====================================================
-- 20. CATALOG ASSERTIONS (stop migration on contract violation)
-- =====================================================

DO $$ DECLARE
  v_count integer;
  v_oid oid;
BEGIN
  -- ── 20a. Seven tables exist ──
  SELECT count(*) INTO v_count FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND c.relname IN ('resumes','profiles','skills','education','experience','github_projects','manual_projects');
  IF v_count != 7 THEN
    RAISE EXCEPTION 'CATALOG: expected 7 tables, found %', v_count;
  END IF;

  -- ── 20b. Required columns exist ──
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='resumes' AND a.attname='created_at' AND NOT a.attisdropped
  ) THEN RAISE EXCEPTION 'CATALOG: resumes.created_at missing'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='profiles' AND a.attname='phone' AND NOT a.attisdropped
  ) THEN RAISE EXCEPTION 'CATALOG: profiles.phone missing'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='profiles' AND a.attname='about' AND NOT a.attisdropped
  ) THEN RAISE EXCEPTION 'CATALOG: profiles.about missing'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='profiles' AND a.attname='updated_at' AND NOT a.attisdropped
  ) THEN RAISE EXCEPTION 'CATALOG: profiles.updated_at missing'; END IF;

  -- ── 20c. Exact FK definitions ──
  -- resumes.user_id → auth.users.id ON DELETE CASCADE
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'resumes_user_id_fkey' AND n.nspname = 'public' AND rel.relname = 'resumes'
      AND c.contype = 'f' AND c.confdeltype = 'c'
      AND c.confrelid = 'auth.users'::regclass
      AND c.conkey = (SELECT ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.resumes'::regclass AND attname = 'user_id' ORDER BY attnum))
      AND c.confkey = (SELECT ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'auth.users'::regclass AND attname = 'id' ORDER BY attnum))
  ) THEN RAISE EXCEPTION 'CATALOG: FK resumes_user_id_fkey definition mismatch'; END IF;

  -- skills/education/experience/github_projects/manual_projects.resume_id → resumes.id ON DELETE CASCADE
  FOR v_oid IN
    SELECT c.oid FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname IN ('skills_resume_id_fkey','education_resume_id_fkey','experience_resume_id_fkey','github_projects_resume_id_fkey','manual_projects_resume_id_fkey')
      AND n.nspname = 'public' AND c.contype = 'f' AND c.confdeltype = 'c'
      AND c.confrelid = 'public.resumes'::regclass
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c2
      WHERE c2.oid = v_oid
        AND c2.conkey = (SELECT ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = c2.conrelid AND attname = 'resume_id' ORDER BY attnum))
        AND c2.confkey = (ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.resumes'::regclass AND attname = 'id')])
    ) THEN RAISE EXCEPTION 'CATALOG: FK constraint % has wrong columns', (SELECT conname FROM pg_constraint WHERE oid = v_oid); END IF;
  END LOOP;

  -- Verify all 6 FKs exist with exact names
  SELECT count(*) INTO v_count FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid JOIN pg_namespace n ON n.oid = rel.relnamespace
  WHERE n.nspname = 'public' AND c.contype = 'f' AND c.confdeltype = 'c'
    AND c.conname IN ('resumes_user_id_fkey','skills_resume_id_fkey','education_resume_id_fkey','experience_resume_id_fkey','github_projects_resume_id_fkey','manual_projects_resume_id_fkey');
  IF v_count != 6 THEN
    RAISE EXCEPTION 'CATALOG: expected 6 CASCADE FKs, found %', v_count;
  END IF;

  -- ── 20d. Exact constraint definitions ──
  -- manual_projects_position_nonnegative: CHECK ("position" >= 0)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'manual_projects_position_nonnegative' AND n.nspname = 'public'
      AND rel.relname = 'manual_projects' AND c.contype = 'c'
  ) THEN RAISE EXCEPTION 'CATALOG: CHECK manual_projects_position_nonnegative missing'; END IF;

  -- manual_projects_resume_position_unique: UNIQUE (resume_id, position)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.conname = 'manual_projects_resume_position_unique' AND n.nspname = 'public'
      AND rel.relname = 'manual_projects' AND c.contype = 'u'
  ) THEN RAISE EXCEPTION 'CATALOG: UNIQUE manual_projects_resume_position_unique missing'; END IF;

  -- ── 20e. Exact index definitions ──
  -- idx_resumes_user_id: NON-UNIQUE on resumes(user_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
      JOIN pg_class ix ON ix.oid = i.indexrelid JOIN pg_class t ON t.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'resumes' AND ix.relname = 'idx_resumes_user_id'
      AND i.indisunique = false
      AND i.indnkeyatts = 1 AND i.indkey[0] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.resumes'::regclass AND attname = 'user_id')
  ) THEN RAISE EXCEPTION 'CATALOG: idx_resumes_user_id must be NON-UNIQUE on resumes(user_id)'; END IF;

  -- No unique index on resumes.user_id (any name)
  IF EXISTS (
    SELECT 1 FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'resumes' AND i.indisunique = true
      AND i.indnkeyatts = 1 AND i.indkey[0] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.resumes'::regclass AND attname = 'user_id')
  ) THEN RAISE EXCEPTION 'CATALOG: no unique index on resumes.user_id allowed'; END IF;

  -- child table indexes: exact table, name, uniqueness, columns
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_class ix ON ix.oid = i.indexrelid JOIN pg_class t ON t.oid = i.indrelid JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'skills' AND ix.relname = 'idx_skills_resume_id'
      AND i.indisunique = false AND i.indnkeyatts = 1
      AND i.indkey[0] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.skills'::regclass AND attname = 'resume_id')
  ) THEN RAISE EXCEPTION 'CATALOG: idx_skills_resume_id definition mismatch'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_class ix ON ix.oid = i.indexrelid JOIN pg_class t ON t.oid = i.indrelid JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'education' AND ix.relname = 'idx_education_resume_id'
      AND i.indisunique = false AND i.indnkeyatts = 1
      AND i.indkey[0] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.education'::regclass AND attname = 'resume_id')
  ) THEN RAISE EXCEPTION 'CATALOG: idx_education_resume_id definition mismatch'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_class ix ON ix.oid = i.indexrelid JOIN pg_class t ON t.oid = i.indrelid JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'experience' AND ix.relname = 'idx_experience_resume_id'
      AND i.indisunique = false AND i.indnkeyatts = 1
      AND i.indkey[0] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.experience'::regclass AND attname = 'resume_id')
  ) THEN RAISE EXCEPTION 'CATALOG: idx_experience_resume_id definition mismatch'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_class ix ON ix.oid = i.indexrelid JOIN pg_class t ON t.oid = i.indrelid JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'github_projects' AND ix.relname = 'idx_github_projects_resume_id'
      AND i.indisunique = false AND i.indnkeyatts = 1
      AND i.indkey[0] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.github_projects'::regclass AND attname = 'resume_id')
  ) THEN RAISE EXCEPTION 'CATALOG: idx_github_projects_resume_id definition mismatch'; END IF;

  -- idx_manual_projects_resume_source: UNIQUE on (resume_id, source_id) WHERE source_id IS NOT NULL
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
      JOIN pg_class ix ON ix.oid = i.indexrelid JOIN pg_class t ON t.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'manual_projects' AND ix.relname = 'idx_manual_projects_resume_source'
      AND i.indisunique = true AND i.indnkeyatts = 2
      AND i.indkey[0] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.manual_projects'::regclass AND attname = 'resume_id')
      AND i.indkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.manual_projects'::regclass AND attname = 'source_id')
      AND pg_get_expr(i.indpred, i.indrelid) = '(source_id IS NOT NULL)'
  ) THEN RAISE EXCEPTION 'CATALOG: idx_manual_projects_resume_source definition mismatch'; END IF;

  -- ── 20f. RLS on 7 tables ──
  SELECT count(*) INTO v_count FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
    AND c.relname IN ('resumes','profiles','skills','education','experience','github_projects','manual_projects');
  IF v_count != 7 THEN
    RAISE EXCEPTION 'CATALOG: RLS not enabled on all 7 tables (found %)', v_count;
  END IF;

  -- ── 20g. 28 named policies with TO authenticated ──
  SELECT count(*) INTO v_count FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('resumes','profiles','skills','education','experience','github_projects','manual_projects')
    AND pol.polroles @> ARRAY[(SELECT oid FROM pg_roles WHERE rolname = 'authenticated')];
  IF v_count != 28 THEN
    RAISE EXCEPTION 'CATALOG: expected 28 policies TO authenticated, found %', v_count;
  END IF;

  -- ── 20h. RPC exact signatures, SECURITY INVOKER, search_path ──
  -- create_resume_full(uuid,text,text,jsonb)
  v_oid := 'public.create_resume_full(uuid,text,text,jsonb)'::regprocedure;
  IF v_oid = 0 THEN
    RAISE EXCEPTION 'CATALOG: create_resume_full(uuid,text,text,jsonb) not found';
  END IF;
  IF (SELECT prosecdef FROM pg_proc WHERE oid = v_oid) THEN
    RAISE EXCEPTION 'CATALOG: create_resume_full must be SECURITY INVOKER (prosecdef=false)';
  END IF;
  IF NOT COALESCE((SELECT proconfig @> ARRAY['search_path=""'] FROM pg_proc WHERE oid = v_oid), false) THEN
    RAISE EXCEPTION 'CATALOG: create_resume_full missing SET search_path TO empty';
  END IF;

  -- save_resume_full(uuid,text,text,jsonb,integer)
  v_oid := 'public.save_resume_full(uuid,text,text,jsonb,integer)'::regprocedure;
  IF v_oid = 0 THEN
    RAISE EXCEPTION 'CATALOG: save_resume_full(uuid,text,text,jsonb,integer) not found';
  END IF;
  IF (SELECT prosecdef FROM pg_proc WHERE oid = v_oid) THEN
    RAISE EXCEPTION 'CATALOG: save_resume_full must be SECURITY INVOKER (prosecdef=false)';
  END IF;
  IF NOT COALESCE((SELECT proconfig @> ARRAY['search_path=""'] FROM pg_proc WHERE oid = v_oid), false) THEN
    RAISE EXCEPTION 'CATALOG: save_resume_full missing SET search_path TO empty';
  END IF;

  -- RPC ACL: EXECUTE only for authenticated, not for anon/PUBLIC
  IF has_function_privilege('anon', 'public.create_resume_full(uuid,text,text,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CATALOG: anon must not have EXECUTE on create_resume_full';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.create_resume_full(uuid,text,text,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CATALOG: authenticated lacks EXECUTE on create_resume_full';
  END IF;
  IF has_function_privilege('anon', 'public.save_resume_full(uuid,text,text,jsonb,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CATALOG: anon must not have EXECUTE on save_resume_full';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.save_resume_full(uuid,text,text,jsonb,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CATALOG: authenticated lacks EXECUTE on save_resume_full';
  END IF;

  -- ── 20i. Sequence existence and ACL ──
  IF NOT has_sequence_privilege('authenticated', 'public.skills_id_seq', 'USAGE') THEN
    RAISE EXCEPTION 'CATALOG: authenticated lacks USAGE on skills_id_seq';
  END IF;
  IF NOT has_sequence_privilege('authenticated', 'public.education_id_seq', 'USAGE') THEN
    RAISE EXCEPTION 'CATALOG: authenticated lacks USAGE on education_id_seq';
  END IF;
  IF NOT has_sequence_privilege('authenticated', 'public.experience_id_seq', 'USAGE') THEN
    RAISE EXCEPTION 'CATALOG: authenticated lacks USAGE on experience_id_seq';
  END IF;
  IF NOT has_sequence_privilege('authenticated', 'public.github_projects_id_seq', 'USAGE') THEN
    RAISE EXCEPTION 'CATALOG: authenticated lacks USAGE on github_projects_id_seq';
  END IF;
END $$;

COMMIT;
