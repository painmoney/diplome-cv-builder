-- Security-1: Secure resume tables with RLS + grants hardening
-- Created: 2026-06-21
-- Read-only audit confirmed: RLS disabled, anon/authenticated have full table privileges
-- This migration restricts access to authenticated users only with row-level ownership

BEGIN;

-- =====================================================
-- 1. REVOKE all privileges from anon on all 6 tables
-- =====================================================

REVOKE ALL PRIVILEGES ON TABLE
  public.resumes,
  public.profiles,
  public.skills,
  public.education,
  public.experience,
  public.github_projects
FROM anon;

-- =====================================================
-- 2. REVOKE all from authenticated, then GRANT minimal set
-- =====================================================

REVOKE ALL PRIVILEGES ON TABLE
  public.resumes,
  public.profiles,
  public.skills,
  public.education,
  public.experience,
  public.github_projects
FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.resumes,
  public.profiles,
  public.skills,
  public.education,
  public.experience,
  public.github_projects
TO authenticated;

-- =====================================================
-- 3. ENABLE RLS on all 6 tables
-- =====================================================

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_projects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. Parent-table policies: resumes
-- =====================================================

DROP POLICY IF EXISTS "resumes_select_own" ON public.resumes;
CREATE POLICY "resumes_select_own"
  ON public.resumes
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "resumes_insert_own" ON public.resumes;
CREATE POLICY "resumes_insert_own"
  ON public.resumes
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "resumes_update_own" ON public.resumes;
CREATE POLICY "resumes_update_own"
  ON public.resumes
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "resumes_delete_own" ON public.resumes;
CREATE POLICY "resumes_delete_own"
  ON public.resumes
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- 5. Parent-table policies: profiles
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- 6. Child-table policies: skills
-- =====================================================

DROP POLICY IF EXISTS "skills_select_own" ON public.skills;
CREATE POLICY "skills_select_own"
  ON public.skills
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = skills.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "skills_insert_own" ON public.skills;
CREATE POLICY "skills_insert_own"
  ON public.skills
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = skills.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "skills_update_own" ON public.skills;
CREATE POLICY "skills_update_own"
  ON public.skills
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = skills.resume_id
      AND r.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = skills.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "skills_delete_own" ON public.skills;
CREATE POLICY "skills_delete_own"
  ON public.skills
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = skills.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 7. Child-table policies: education
-- =====================================================

DROP POLICY IF EXISTS "education_select_own" ON public.education;
CREATE POLICY "education_select_own"
  ON public.education
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = education.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "education_insert_own" ON public.education;
CREATE POLICY "education_insert_own"
  ON public.education
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = education.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "education_update_own" ON public.education;
CREATE POLICY "education_update_own"
  ON public.education
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = education.resume_id
      AND r.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = education.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "education_delete_own" ON public.education;
CREATE POLICY "education_delete_own"
  ON public.education
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = education.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 8. Child-table policies: experience
-- =====================================================

DROP POLICY IF EXISTS "experience_select_own" ON public.experience;
CREATE POLICY "experience_select_own"
  ON public.experience
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = experience.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "experience_insert_own" ON public.experience;
CREATE POLICY "experience_insert_own"
  ON public.experience
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = experience.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "experience_update_own" ON public.experience;
CREATE POLICY "experience_update_own"
  ON public.experience
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = experience.resume_id
      AND r.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = experience.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "experience_delete_own" ON public.experience;
CREATE POLICY "experience_delete_own"
  ON public.experience
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = experience.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 9. Child-table policies: github_projects
-- =====================================================

DROP POLICY IF EXISTS "github_projects_select_own" ON public.github_projects;
CREATE POLICY "github_projects_select_own"
  ON public.github_projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = github_projects.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "github_projects_insert_own" ON public.github_projects;
CREATE POLICY "github_projects_insert_own"
  ON public.github_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = github_projects.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "github_projects_update_own" ON public.github_projects;
CREATE POLICY "github_projects_update_own"
  ON public.github_projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = github_projects.resume_id
      AND r.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = github_projects.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "github_projects_delete_own" ON public.github_projects;
CREATE POLICY "github_projects_delete_own"
  ON public.github_projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = github_projects.resume_id
      AND r.user_id = (select auth.uid())
    )
  );

COMMIT;
