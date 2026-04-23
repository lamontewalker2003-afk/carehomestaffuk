// Supabase client — runtime-configurable.
//
// Resolution order (first non-empty wins):
//   1. localStorage runtime override saved by the /setup wizard
//   2. Build-time env vars (Lovable Cloud default)
//
// This makes the standalone /setup wizard ACTUALLY take effect: when the
// admin saves a new Supabase URL + anon key, the next page load (or the
// "Reload App" button in the wizard) re-creates the client against the new
// project — so all data reads/writes go to the user's own database.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getRuntimeConfigSync } from '@/lib/runtime-config';

const ENV_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ENV_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const runtime = getRuntimeConfigSync();

const SUPABASE_URL = runtime.supabaseUrl || ENV_URL || '';
const SUPABASE_PUBLISHABLE_KEY = runtime.supabaseAnonKey || ENV_KEY || '';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Namespace the auth storage per-project so switching projects via the
    // wizard doesn't carry stale sessions across.
    storageKey: `sb-${(SUPABASE_URL || 'default').replace(/[^a-z0-9]/gi, '').slice(0, 24)}-auth-token`,
  },
});

/** True when the live client is pointed at a user-supplied (standalone) project. */
export const isStandaloneSupabase = runtime.isStandalone;

/** Convenience: which URL the live client is talking to (for diagnostics in the wizard). */
export const activeSupabaseUrl = SUPABASE_URL;
