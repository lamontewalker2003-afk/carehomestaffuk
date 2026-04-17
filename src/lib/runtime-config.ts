// Runtime configuration — supports both Lovable Cloud (env vars baked at
// build time) AND fully standalone deployments where the admin pastes
// their own Supabase URL + anon key into the in-app /setup wizard.
//
// Resolution order (first non-empty wins):
//   1. localStorage runtime override (set by /setup wizard)
//   2. /standalone-config.json fetched at boot (for self-host pre-bake)
//   3. import.meta.env (Vite build-time vars — Lovable Cloud default)

const LS_KEY = "chsuk_runtime_config_v1";

export interface RuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** True when the user has explicitly set their own Supabase project. */
  isStandalone: boolean;
}

export interface AdminCredential {
  username: string;
  password: string;
}

interface StoredConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  admins?: AdminCredential[];
}

function readLocal(): StoredConfig | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(cfg: StoredConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
}

let cachedFileConfig: StoredConfig | null = null;
let fileConfigLoaded = false;

async function loadFileConfig(): Promise<StoredConfig | null> {
  if (fileConfigLoaded) return cachedFileConfig;
  fileConfigLoaded = true;
  try {
    const res = await fetch("/standalone-config.json", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    cachedFileConfig = {
      supabaseUrl: json?.supabase?.url || "",
      supabaseAnonKey: json?.supabase?.anonKey || "",
      admins: Array.isArray(json?.admins) ? json.admins : undefined,
    };
    return cachedFileConfig;
  } catch {
    return null;
  }
}

/** Synchronous getter — use for boot, falls back to env vars only. */
export function getRuntimeConfigSync(): RuntimeConfig {
  const local = readLocal();
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
  const envKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  const url = local?.supabaseUrl || envUrl;
  const key = local?.supabaseAnonKey || envKey;

  return {
    supabaseUrl: url,
    supabaseAnonKey: key,
    isStandalone: Boolean(local?.supabaseUrl),
  };
}

/** Async getter — also checks /standalone-config.json. */
export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  const sync = getRuntimeConfigSync();
  if (sync.supabaseUrl && sync.supabaseAnonKey) return sync;
  const file = await loadFileConfig();
  return {
    supabaseUrl: sync.supabaseUrl || file?.supabaseUrl || "",
    supabaseAnonKey: sync.supabaseAnonKey || file?.supabaseAnonKey || "",
    isStandalone: sync.isStandalone,
  };
}

export function saveRuntimeConfig(supabaseUrl: string, supabaseAnonKey: string) {
  const existing = readLocal() || {};
  writeLocal({ ...existing, supabaseUrl: supabaseUrl.trim(), supabaseAnonKey: supabaseAnonKey.trim() });
}

export function clearRuntimeConfig() {
  localStorage.removeItem(LS_KEY);
}

/** Admin credentials — pulled from /standalone-config.json or local override. */
export async function getAdminCredentials(): Promise<AdminCredential[]> {
  const local = readLocal();
  if (local?.admins?.length) return local.admins;
  const file = await loadFileConfig();
  if (file?.admins?.length) return file.admins;
  // Default fallback so a freshly cloned app is never locked out.
  return [{ username: "admin", password: "admin123" }];
}

export function saveAdminCredentials(admins: AdminCredential[]) {
  const existing = readLocal() || {};
  writeLocal({ ...existing, admins });
}

/** Runs the consolidated standalone migration against the configured DB. */
export async function runStandaloneMigration(supabaseUrl: string, serviceRoleKey: string): Promise<{ ok: boolean; message: string }> {
  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, message: "Supabase URL and service-role key are both required." };
  }
  try {
    const sqlRes = await fetch("/standalone-migration.sql", { cache: "no-store" });
    if (!sqlRes.ok) return { ok: false, message: "Could not load /standalone-migration.sql from the bundle." };
    const sql = await sqlRes.text();

    // Supabase exposes a PostgREST RPC `exec_sql` ONLY if the user has created it.
    // We don't assume that — instead we direct the user to the SQL editor.
    // But we still try a best-effort POST in case they have it set up.
    const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (res.ok) return { ok: true, message: "Migration executed successfully." };
    if (res.status === 404) {
      return {
        ok: false,
        message:
          "Auto-execution requires an `exec_sql` RPC in your Supabase project. " +
          "Please open the SQL editor in your Supabase dashboard and paste the contents of /standalone-migration.sql manually. " +
          "The full SQL has been downloaded for you.",
      };
    }
    const txt = await res.text();
    return { ok: false, message: `Migration failed (${res.status}): ${txt.slice(0, 300)}` };
  } catch (e: any) {
    return { ok: false, message: `Network error: ${e?.message || e}` };
  }
}
