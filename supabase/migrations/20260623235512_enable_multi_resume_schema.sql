-- MR-DB-1: Enable multi-resume database schema
-- Replaces unique user_id index with non-unique to allow multiple resumes per user

-- Step 1: Verify the expected standalone unique index exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'resumes'
      AND indexname = 'resumes_user_id_unique'
  ) THEN
    RAISE EXCEPTION 'Precondition failed: resumes_user_id_unique index does not exist';
  END IF;
END $$;

-- Step 2: Verify the index is unique, not primary, and indexes exactly user_id
DO $$
DECLARE
  idx RECORD;
BEGIN
  SELECT
    c.relname AS indexname,
    i.indisunique,
    i.indisprimary,
    pg_get_indexdef(i.indexrelid) AS indexdef
  INTO idx
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'resumes_user_id_unique';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Precondition failed: resumes_user_id_unique not found in pg_index';
  END IF;

  IF NOT idx.indisunique THEN
    RAISE EXCEPTION 'Precondition failed: resumes_user_id_unique is not unique';
  END IF;

  IF idx.indisprimary THEN
    RAISE EXCEPTION 'Precondition failed: resumes_user_id_unique is a primary key';
  END IF;

  IF idx.indexdef NOT LIKE '%user_id%' THEN
    RAISE EXCEPTION 'Precondition failed: resumes_user_id_unique does not index user_id';
  END IF;
END $$;

-- Step 3: Verify the index is not backed by a table constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.resumes'::regclass
      AND conindid = 'public.resumes_user_id_unique'::regclass
  ) THEN
    RAISE EXCEPTION 'Precondition failed: resumes_user_id_unique is backed by a constraint';
  END IF;
END $$;

-- Step 4: Create replacement non-unique index (if not exists with exact definition)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'resumes'
      AND indexname = 'idx_resumes_user_id'
  ) THEN
    CREATE INDEX idx_resumes_user_id
    ON public.resumes (user_id);
  ELSIF (
    SELECT indexdef FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'resumes'
      AND indexname = 'idx_resumes_user_id'
  ) != 'CREATE INDEX idx_resumes_user_id ON public.resumes USING btree (user_id)' THEN
    RAISE EXCEPTION 'Precondition failed: idx_resumes_user_id exists with unexpected definition';
  END IF;
END $$;

-- Step 5: Drop the unique index
DROP INDEX public.resumes_user_id_unique;
