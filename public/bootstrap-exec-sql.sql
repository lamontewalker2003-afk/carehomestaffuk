-- =====================================================================
-- CareHomeStaffUK — One-time Bootstrap (paste ONCE per Supabase project)
-- =====================================================================
-- This creates a single `exec_sql` RPC that lets the /setup wizard run
-- the full schema migration (and any future updates) with one click —
-- no more copy-pasting SQL into the dashboard.
--
-- HOW TO USE (takes ~30 seconds, only needed once per Supabase project):
--   1. Open your Supabase project → SQL Editor → New query
--   2. Paste this entire file
--   3. Click "Run"
--   4. Return to the app's /setup page and click "Auto-Run Migration"
--
-- SECURITY: The function is `SECURITY DEFINER` and restricted to the
-- `service_role` only. Never expose your service-role key in client code
-- or commit it to git. The /setup wizard keeps it in memory only.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE sql;
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'ok', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$;

-- Lock it down: only the service_role key can call this.
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Done. You can now run the full migration from the /setup wizard.
