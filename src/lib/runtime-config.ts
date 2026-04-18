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

async function callExecSql(supabaseUrl: string, serviceRoleKey: string, sql: string) {
  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ sql }),
  });
  return res;
}

/** Runs the consolidated standalone migration against the configured DB. */
export async function runStandaloneMigration(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<{ ok: boolean; message: string; needsBootstrap?: boolean }> {
  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, message: "Supabase URL and service-role key are both required." };
  }
  try {
    const sqlRes = await fetch("/standalone-migration.sql", { cache: "no-store" });
    if (!sqlRes.ok) return { ok: false, message: "Could not load /standalone-migration.sql from the bundle." };
    const sql = await sqlRes.text();

    const res = await callExecSql(supabaseUrl, serviceRoleKey, sql);

    if (res.status === 404) {
      return {
        ok: false,
        needsBootstrap: true,
        message:
          "The `exec_sql` RPC is not installed in this Supabase project yet. " +
          "Run the one-time bootstrap script (shown below) in your SQL Editor, then click Auto-Run again.",
      };
    }

    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, message: `Migration failed (${res.status}): ${txt.slice(0, 400)}` };
    }

    // exec_sql returns { ok, error?, sqlstate? }
    const data = await res.json().catch(() => null);
    if (data && typeof data === "object" && data.ok === false) {
      return { ok: false, message: `SQL error (${data.sqlstate || "?"}): ${data.error || "unknown"}` };
    }
    return { ok: true, message: "Migration executed successfully. All tables and policies are in place." };
  } catch (e: any) {
    return { ok: false, message: `Network error: ${e?.message || e}` };
  }
}

/** Tests whether the exec_sql RPC is installed and the service-role key works. */
export async function testExecSqlInstalled(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<{ installed: boolean; message: string }> {
  if (!supabaseUrl || !serviceRoleKey) return { installed: false, message: "Missing URL or key." };
  try {
    const res = await callExecSql(supabaseUrl, serviceRoleKey, "SELECT 1;");
    if (res.status === 404) return { installed: false, message: "exec_sql RPC not found — run the bootstrap script first." };
    if (res.status === 401 || res.status === 403) return { installed: false, message: "Service-role key was rejected. Double-check the key." };
    if (!res.ok) return { installed: false, message: `Unexpected error (${res.status}).` };
    return { installed: true, message: "exec_sql is installed and the key works ✓" };
  } catch (e: any) {
    return { installed: false, message: `Network error: ${e?.message || e}` };
  }
}
