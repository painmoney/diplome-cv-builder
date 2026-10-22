-- Read-only catalog inspection. Run manually ONLY in the confirmed staging
-- jerwfvhpoanoukxiyvwq Dashboard / read-only connection. No data mutations.
-- A privileged SQL Editor does not demonstrate end-user RLS isolation.
BEGIN TRANSACTION READ ONLY;

SELECT current_database(), current_user, version();
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles','resumes','skills','education','experience','github_projects','manual_projects')
ORDER BY table_name, ordinal_position;

SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND c.relname IN ('profiles','resumes','skills','education','experience','github_projects','manual_projects');

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE (schemaname = 'public' AND tablename IN
  ('profiles','resumes','skills','education','experience','github_projects','manual_projects'))
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, policyname;

SELECT conrelid::regclass AS table_name, conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid IN ('public.profiles'::regclass,'public.resumes'::regclass,
    'public.skills'::regclass,'public.education'::regclass,'public.experience'::regclass,
    'public.github_projects'::regclass,'public.manual_projects'::regclass)
ORDER BY table_name, conname;

SELECT tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN
  ('profiles','resumes','skills','education','experience','github_projects','manual_projects')
ORDER BY tablename, indexname;

SELECT p.oid::regprocedure AS signature, p.prosecdef AS security_definer,
  p.proconfig, p.proacl, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('create_resume_full','save_resume_full');

SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated','PUBLIC')
ORDER BY table_name, grantee, privilege_type;

SELECT role_name, function_name,
  has_function_privilege(role_name, function_name, 'EXECUTE') AS can_execute
FROM (VALUES ('anon'),('authenticated')) roles(role_name)
CROSS JOIN (VALUES ('public.create_resume_full(uuid,text,text,jsonb)'),
  ('public.save_resume_full(uuid,text,text,jsonb,integer)')) functions(function_name);

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets WHERE id = 'avatars';

COMMIT;

-- For data checks, substitute only a known synthetic resume UUID and run
-- manually, one query at a time. Do not SELECT all users' data.
-- SELECT id, user_id, title, revision, template, data FROM public.resumes WHERE id = '<QA_UUID>'::uuid;
-- SELECT * FROM public.skills WHERE resume_id = '<QA_UUID>'::uuid;
-- SELECT * FROM public.education WHERE resume_id = '<QA_UUID>'::uuid;
-- SELECT * FROM public.experience WHERE resume_id = '<QA_UUID>'::uuid;
-- SELECT * FROM public.github_projects WHERE resume_id = '<QA_UUID>'::uuid;
-- SELECT * FROM public.manual_projects WHERE resume_id = '<QA_UUID>'::uuid ORDER BY position;
