-- Fix: Grant necessary privileges on manual_projects to authenticated
-- The REVOKE ALL in migration 1 stripped all privileges.
-- Migration 2's GRANT INSERT, DELETE did not take effect (Supabase default grants interference).
-- This migration explicitly grants SELECT, INSERT, DELETE to authenticated.
-- Follows the same pattern as github_projects in migration 20260621000000.

BEGIN;

GRANT SELECT, INSERT, DELETE ON TABLE public.manual_projects TO authenticated;

COMMIT;
