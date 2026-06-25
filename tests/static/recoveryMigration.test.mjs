import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATION = resolve(process.cwd(), "supabase/migrations/20260625000000_restore_canonical_backend.sql");
let sql;
try { sql = readFileSync(MIGRATION, "utf8"); } catch { sql = ""; }

function validateSql(s) {
  const e = [];
  const has = (p) => new RegExp(p, "i").test(s);

  // Tables
  for (const t of ["resumes","profiles","skills","education","experience","github_projects","manual_projects"])
    if (!has(`CREATE TABLE IF NOT EXISTS public\\.${t}\\s*\\(`)) e.push(`missing CREATE TABLE ${t}`);

  // ADD COLUMN
  if (!has("ALTER TABLE public\\.resumes ADD COLUMN IF NOT EXISTS created_at")) e.push("missing resumes.created_at");
  if (!has("ALTER TABLE public\\.profiles ADD COLUMN IF NOT EXISTS phone")) e.push("missing profiles.phone");
  if (!has("ALTER TABLE public\\.profiles ADD COLUMN IF NOT EXISTS about")) e.push("missing profiles.about");
  if (!has("ALTER TABLE public\\.profiles ADD COLUMN IF NOT EXISTS updated_at")) e.push("missing profiles.updated_at");
  if (has("ADD COLUMN.*location.*profiles|profiles.*ADD COLUMN.*location")) e.push("forbidden profiles.location");
  if (has("ADD COLUMN.*github.*profiles|profiles.*ADD COLUMN.*github")) e.push("forbidden profiles.github");

  // No silent failures
  if (has("EXCEPTION WHEN others THEN NULL")) e.push("forbidden silent failure");

  // FKs — extract each block by first occurrence, verify contents
  const fkSpecs = [
    { name: "resumes_user_id_fkey", col: "user_id", ref: "auth.users", refcol: "id" },
    { name: "skills_resume_id_fkey", col: "resume_id", ref: "resumes", refcol: "id" },
    { name: "education_resume_id_fkey", col: "resume_id", ref: "resumes", refcol: "id" },
    { name: "experience_resume_id_fkey", col: "resume_id", ref: "resumes", refcol: "id" },
    { name: "github_projects_resume_id_fkey", col: "resume_id", ref: "resumes", refcol: "id" },
    { name: "manual_projects_resume_id_fkey", col: "resume_id", ref: "resumes", refcol: "id" },
  ];
  for (const fk of fkSpecs) {
    const idx = s.indexOf(fk.name);
    if (idx === -1) { e.push(`missing FK ${fk.name}`); continue; }
    const block = s.substring(idx, idx + 400);
    if (!block.includes("FOREIGN KEY")) e.push(`${fk.name} missing FOREIGN KEY`);
    if (!block.includes("ON DELETE CASCADE")) e.push(`${fk.name} missing CASCADE`);
    if (!block.includes(`(${fk.col})`)) e.push(`${fk.name} source column mismatch`);
    if (!block.includes(fk.ref)) e.push(`${fk.name} ref table mismatch`);
  }

  // No EXCEPTION WHEN duplicate_object in FK/constraint sections
  if (has("EXCEPTION WHEN duplicate_object")) e.push("forbidden duplicate_object exception pattern");

  // Indexes
  if (!has("CREATE INDEX IF NOT EXISTS idx_resumes_user_id")) e.push("missing idx_resumes_user_id");
  if (has("CREATE UNIQUE INDEX[\\s\\S]{0,50}idx_resumes_user_id")) e.push("idx_resumes_user_id must be NON-UNIQUE");
  if (!has("CREATE INDEX IF NOT EXISTS idx_skills_resume_id")) e.push("missing idx_skills_resume_id");
  if (!has("CREATE INDEX IF NOT EXISTS idx_education_resume_id")) e.push("missing idx_education_resume_id");
  if (!has("CREATE INDEX IF NOT EXISTS idx_experience_resume_id")) e.push("missing idx_experience_resume_id");
  if (!has("CREATE INDEX IF NOT EXISTS idx_github_projects_resume_id")) e.push("missing idx_github_projects_resume_id");
  if (!has("CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_projects_resume_source")) e.push("missing idx_manual_projects_resume_source");

  // RPC
  if (!has("CREATE OR REPLACE FUNCTION public\\.create_resume_full")) e.push("missing create_resume_full");
  if (!has("CREATE OR REPLACE FUNCTION public\\.save_resume_full")) e.push("missing save_resume_full");
  if (!has("create_resume_full[\\s\\S]{0,500}SECURITY INVOKER")) e.push("create_resume_full missing SECURITY INVOKER");
  if (!has("save_resume_full[\\s\\S]{0,500}SECURITY INVOKER")) e.push("save_resume_full missing SECURITY INVOKER");
  if (!has("create_resume_full[\\s\\S]{0,500}SET search_path TO ''")) e.push("create_resume_full missing search_path");
  if (!has("save_resume_full[\\s\\S]{0,500}SET search_path TO ''")) e.push("save_resume_full missing search_path");

  // RLS
  for (const t of ["resumes","profiles","skills","education","experience","github_projects","manual_projects"])
    if (!has(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY`)) e.push(`missing RLS ${t}`);

  // 28 policies TO authenticated
  for (const t of ["resumes","profiles","skills","education","experience","github_projects","manual_projects"])
    for (const op of ["select","insert","update","delete"]) {
      const n = `${t}_${op}_own`;
      if (!has(`"${n}"`)) e.push(`missing policy ${n}`);
      if (!has(`${n}[\\s\\S]{0,300}TO authenticated`)) e.push(`${n} missing TO authenticated`);
    }

  // Sequences
  for (const seq of ["skills_id_seq","education_id_seq","experience_id_seq","github_projects_id_seq"]) {
    if (!has(`GRANT USAGE ON SEQUENCE public\\.${seq} TO authenticated`)) e.push(`missing USAGE ${seq}`);
    if (!has(`REVOKE ALL ON SEQUENCE public\\.${seq} FROM`)) e.push(`missing REVOKE ${seq}`);
  }

  // Grants
  if (has("ON ALL TABLES IN SCHEMA")) e.push("forbidden broad REVOKE");
  if (!has("REVOKE ALL PRIVILEGES ON TABLE")) e.push("missing explicit REVOKE");
  if (!has("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE")) e.push("missing explicit GRANT");
  if (!has("GRANT SELECT, INSERT, DELETE ON TABLE public\\.manual_projects")) e.push("manual_projects GRANT mismatch");

  // RPC grants
  if (!has("REVOKE ALL ON FUNCTION public\\.create_resume_full.*FROM PUBLIC")) e.push("create missing REVOKE PUBLIC");
  if (!has("REVOKE ALL ON FUNCTION public\\.create_resume_full.*FROM anon")) e.push("create missing REVOKE anon");
  if (!has("GRANT EXECUTE ON FUNCTION public\\.create_resume_full.*TO authenticated")) e.push("create missing GRANT auth");
  if (!has("REVOKE ALL ON FUNCTION public\\.save_resume_full.*FROM PUBLIC")) e.push("save missing REVOKE PUBLIC");
  if (!has("REVOKE ALL ON FUNCTION public\\.save_resume_full.*FROM anon")) e.push("save missing REVOKE anon");
  if (!has("GRANT EXECUTE ON FUNCTION public\\.save_resume_full.*TO authenticated")) e.push("save missing GRANT auth");

  // Constraints
  if (!has("manual_projects_position_nonnegative")) e.push("missing CHECK constraint");
  if (!has("manual_projects_resume_position_unique")) e.push("missing UNIQUE constraint");
  if (!has('CHECK \\(\\"position\\" >= 0\\)')) e.push("CHECK expression mismatch");
  if (!has('UNIQUE \\(resume_id, \\"position\\"\\)')) e.push("UNIQUE columns mismatch");

  // Partial unique predicate
  if (!has("WHERE source_id IS NOT NULL")) e.push("missing source_id IS NOT NULL predicate");

  // Catalog assertions
  if (!has("CATALOG ASSERTIONS")) e.push("missing catalog assertions");
  if (!has("expected 7 tables")) e.push("missing 7 tables check");
  if (!has("expected 6 CASCADE FKs")) e.push("missing 6 FKs check");
  if (!has("expected 28 policies")) e.push("missing 28 policies check");
  if (!has("resumes\\.created_at missing")) e.push("missing created_at check");
  if (!has("profiles\\.phone missing")) e.push("missing phone check");
  if (!has("profiles\\.about missing")) e.push("missing about check");
  if (!has("profiles\\.updated_at missing")) e.push("missing updated_at check");
  if (!has("resumes.*user_id.*must not exist|no unique.*resumes.*user_id")) e.push("missing unique prohibition");
  if (!has("prosecdef")) e.push("missing prosecdef check");
  if (!has("has_sequence_privilege")) e.push("missing has_sequence_privilege check");
  if (!has("has_function_privilege")) e.push("missing has_function_privilege check");
  if (!has("indnkeyatts")) e.push("missing indnkeyatts check (must not use indkey = ARRAY)");
  // Single-column indexes must use indkey[0]
  if (!has("indkey\\[0\\]")) e.push("missing indkey[0] for single-column index checks");
  // Must NOT have indkey[1] for single-column (indnkeyatts=1) contexts
  if (has("indnkeyatts = 1 AND i\\.indkey\\[1\\]")) e.push("forbidden indkey[1] with indnkeyatts=1");
  // Verify indnkeyatts is used in index checks (not just individually)
  const indnkeyattsCount = (s.match(/indnkeyatts/g) || []).length;
  if (indnkeyattsCount < 6) e.push(`expected at least 6 indnkeyatts uses, found ${indnkeyattsCount}`);
  // Verify exact column names in index assertions
  if (!has("attname = 'user_id'")) e.push("missing user_id column in resumes index check");
  if (!has("attname = 'resume_id'")) e.push("missing resume_id column in child index checks");
  if (!has("attname = 'source_id'")) e.push("missing source_id column in partial unique check");
  if (!has('search_path=\\"\\"')) e.push("search_path assertion must use empty quotes");
  if (!has("COALESCE.*proconfig")) e.push("missing COALESCE for NULL-safe search_path check");

  // Destructive
  if (/\bDROP\s+TABLE\b/i.test(s)) e.push("forbidden DROP TABLE");
  if (/\bDROP\s+SCHEMA\b/i.test(s)) e.push("forbidden DROP SCHEMA");
  if (/\bTRUNCATE\b/i.test(s)) e.push("forbidden TRUNCATE");
  const rpc = s.match(/\$function\$[\s\S]*?\$function\$/g) || [];
  let rest = s;
  for (const b of rpc) rest = rest.replace(b, "");
  if (/DELETE\s+FROM\b/i.test(rest)) e.push("forbidden DELETE outside RPC");
  if (has("cxnzlarcmszvnobuoskr")) e.push("forbidden primary ref");
  if (has("jerwfvhpoanoukxiyvwq")) e.push("forbidden staging ref");
  if (has("ghp_|service_role_key|SUPABASE_SERVICE_ROLE_KEY")) e.push("forbidden secrets");
  if (has("migration.*repair")) e.push("forbidden migration repair");
  if (has("pg_get_userbyid")) e.push("forbidden pg_get_userbyid");
  if (has("pg_auth_members")) e.push("forbidden pg_auth_members");
  if (has("authrel\\.rolname")) e.push("forbidden authrel.rolname");

  return e;
}

describe("validateSql", () => {
  it("clean migration passes", () => {
    const errors = validateSql(sql);
    assert.deepEqual(errors, [], `Errors: ${errors.join("; ")}`);
  });
});

describe("mutations", () => {
  function shouldFail(label, fn) {
    it(`catches: ${label}`, () => {
      const mutated = fn(sql);
      assert.notEqual(mutated, sql, `mutation "${label}" did not alter the SQL`);
      const errors = validateSql(mutated);
      assert.ok(errors.length > 0, `"${label}" produced changed SQL but no validation errors`);
    });
  }

  // FK mutations
  shouldFail("remove skills FK", s => s.replace(/ADD CONSTRAINT skills_resume_id_fkey[\s\S]*?END\s*\$\$/g, ""));
  shouldFail("remove education FK", s => s.replace(/ADD CONSTRAINT education_resume_id_fkey[\s\S]*?END\s*\$\$/g, ""));
  shouldFail("remove experience FK", s => s.replace(/ADD CONSTRAINT experience_resume_id_fkey[\s\S]*?END\s*\$\$/g, ""));
  shouldFail("remove github_projects FK", s => s.replace(/ADD CONSTRAINT github_projects_resume_id_fkey[\s\S]*?END\s*\$\$/g, ""));
  shouldFail("remove manual_projects FK", s => s.replace(/ADD CONSTRAINT manual_projects_resume_id_fkey[\s\S]*?END\s*\$\$/g, ""));
  shouldFail("remove resumes FK", s => s.replace(/ADD CONSTRAINT resumes_user_id_fkey[\s\S]*?END\s*\$\$/g, ""));
  shouldFail("corrupt skills FK source column", s => {
    const re = /(ADD CONSTRAINT skills_resume_id_fkey\r?\n\s*FOREIGN KEY )\(resume_id\)/;
    return s.replace(re, "$1(wrong_col)");
  });
  shouldFail("corrupt skills FK ref table", s => {
    const re = /FOREIGN KEY \(resume_id\) REFERENCES public\.resumes\(id\) ON DELETE CASCADE/;
    return s.replace(re, "FOREIGN KEY (resume_id) REFERENCES public.wrong_table(id) ON DELETE CASCADE");
  });
  shouldFail("remove all CASCADE", s => s.replaceAll("ON DELETE CASCADE", "ON DELETE RESTRICT"));

  // RPC mutations
  shouldFail("SECURITY INVOKER → DEFINER on create", s => s.replace(/create_resume_full[\s\S]{0,500}SECURITY INVOKER/, "create_resume_full\nSECURITY DEFINER"));
  shouldFail("SECURITY INVOKER → DEFINER on save", s => s.replace(/save_resume_full[\s\S]{0,500}SECURITY INVOKER/, "save_resume_full\nSECURITY DEFINER"));
  shouldFail("remove search_path on create", s => s.replace(/create_resume_full[\s\S]{0,500}SET search_path TO ''/, "create_resume_full\nAS"));
  shouldFail("remove search_path on save", s => s.replace(/save_resume_full[\s\S]{0,500}SET search_path TO ''/, "save_resume_full\nAS"));

  // Sequence mutations
  shouldFail("remove USAGE grant", s => s.replaceAll("GRANT USAGE ON SEQUENCE", "GRANT SELECT ON SEQUENCE"));
  shouldFail("corrupt sequence name", s => s.replace("skills_id_seq", "skills_WRONG_seq"));

  // Index mutations
  shouldFail("make idx_resumes_user_id UNIQUE", s => s.replace("CREATE INDEX IF NOT EXISTS idx_resumes_user_id", "CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_user_id"));
  shouldFail("corrupt partial unique columns", s => s.replace("idx_manual_projects_resume_source", "idx_manual_projects_WRONG"));
  shouldFail("remove source_id predicate", s => s.replaceAll("WHERE source_id IS NOT NULL", ""));

  // Constraint mutations
  shouldFail("corrupt CHECK expression", s => s.replaceAll('CHECK ("position" >= 0)', "CHECK (1=0)"));
  shouldFail("corrupt UNIQUE columns", s => s.replaceAll('UNIQUE (resume_id, "position")', "UNIQUE (resume_id, name)"));

  // Runtime pattern mutations
  shouldFail("re-add EXCEPTION duplicate_object", s => s + "\nEXCEPTION WHEN duplicate_object THEN NULL;\n");
  shouldFail("re-add pg_get_userbyid", s => s + "\nIF pg_get_userbyid(1) != 'postgres' THEN RAISE NOTICE 'x'; END IF;\n");
  shouldFail("re-add pg_auth_members", s => s + "\nSELECT 1 INTO v_count FROM pg_auth_members;\n");
  shouldFail("re-add authrel.rolname", s => s + "\nSELECT authrel.rolname INTO v_msg FROM pg_class authrel LIMIT 1;\n");
  shouldFail("re-add silent failure", s => s + "\nDO $$ BEGIN RAISE NOTICE 'x'; EXCEPTION WHEN others THEN NULL; END $$;\n");
  shouldFail("re-add broad REVOKE", s => s + "\nREVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated;\n");
  shouldFail("remove catalog section", s => s.replace(/-- 20\. CATALOG[\s\S]*$/m, ""));
  shouldFail("re-add indkey = ARRAY pattern", s => s.replace(/i\.indnkeyatts = 1 AND i\.indkey\[0\]/g, "i.indkey = ARRAY[0]::smallint[] AND false"));
  shouldFail("indkey[0] → indkey[1] on resumes", s => s.replace(
    /i\.indnkeyatts = 1 AND i\.indkey\[0\] = \(SELECT attnum[^)]+attname = 'user_id'\)/,
    "i.indnkeyatts = 1 AND i.indkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.resumes'::regclass AND attname = 'user_id')"
  ));
  shouldFail("corrupt all child index columns", s => s.replaceAll("attname = 'resume_id'", "attname = 'wrong_col'"));
  shouldFail("corrupt partial index second key", s => s.replace(
    /i\.indkey\[1\] = \(SELECT attnum[^)]+attname = 'source_id'\)/,
    "i.indkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.manual_projects'::regclass AND attname = 'wrong_col')"
  ));
  shouldFail("corrupt search_path value", s => {
    return s.replaceAll('search_path=""', "search_path=wrong");
  });
  shouldFail("remove COALESCE from search_path", s => {
    const find = "COALESCE((SELECT proconfig @> ARRAY['search_path=\"\"'] FROM pg_proc WHERE oid = v_oid), false)";
    const replace = "(SELECT proconfig @> ARRAY['search_path=\"\"'] FROM pg_proc WHERE oid = v_oid)";
    return s.replaceAll(find, replace);
  });
});
