-- MR-MIGRATION-HISTORY-BASELINE-1: Base schema for CV Builder
-- Recreated from staging-verified structure.
-- Tables created outside migration history in the original project.
-- Columns added by later migrations (revision, NOT NULL, indexes) are NOT here.

CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text DEFAULT '',
  template text DEFAULT 'minimalist',
  data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS resumes_user_id_unique
  ON public.resumes (user_id);

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skills (
  id bigserial PRIMARY KEY,
  resume_id uuid,
  skill_name text,
  level smallint
);

CREATE TABLE IF NOT EXISTS public.education (
  id bigserial PRIMARY KEY,
  resume_id uuid,
  institution text,
  institute text,
  department text,
  program text,
  degree text,
  years text
);

CREATE TABLE IF NOT EXISTS public.experience (
  id bigserial PRIMARY KEY,
  resume_id uuid,
  company text,
  position text,
  period text,
  description text
);

CREATE TABLE IF NOT EXISTS public.github_projects (
  id bigserial PRIMARY KEY,
  resume_id uuid,
  project_name text,
  project_url text,
  description text,
  stars integer DEFAULT 0
);
