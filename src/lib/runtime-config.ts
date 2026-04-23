// Runtime configuration — supports both Lovable Cloud (env vars baked at
// build time) AND fully standalone deployments where the admin pastes
// their own Supabase URL + anon key into the in-app /setup wizard.
//
// Resolution order (first non-empty wins):
//   1. localStorage runtime override (set by /setup wizard)
//   2. /standalone-config.json fetched at boot (for self-host pre-bake)
//   3. import.meta.env (Vite build-time vars — Lovable Cloud default)

const LS_KEY = "chsuk_runtime_config_v1";
const LS_WIZARD_STEP = "chsuk_wizard_step_v1";

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

/**
 * Force a hard reload so the singleton supabase client (created at module
 * load from runtime config) is rebuilt against the newly saved project.
 * Call this after the wizard saves a new URL/key — without it the running
 * tab keeps writing to the OLD database even though localStorage is updated.
 */
export function reloadForNewConfig() {
  try { window.location.reload(); } catch {}
}

export function clearRuntimeConfig() {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_WIZARD_STEP);
}

/** Persisted wizard step so users can resume mid-setup. */
export function getWizardStep(): number {
  try {
    const n = parseInt(localStorage.getItem(LS_WIZARD_STEP) || "1", 10);
    return Number.isFinite(n) && n >= 1 && n <= 4 ? n : 1;
  } catch {
    return 1;
  }
}
export function saveWizardStep(step: number) {
  try { localStorage.setItem(LS_WIZARD_STEP, String(step)); } catch {}
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

/** Export the full standalone config (URL + anon key + admins) as portable JSON. */
export function exportConfig(): string {
  const local = readLocal() || {};
  const payload = {
    $exported: new Date().toISOString(),
    supabase: {
      url: local.supabaseUrl || "",
      anonKey: local.supabaseAnonKey || "",
    },
    admins: local.admins || [],
  };
  return JSON.stringify(payload, null, 2);
}

/** Import a previously-exported config JSON string. Returns parsed summary. */
export function importConfig(jsonText: string): { ok: boolean; message: string; imported?: { url: boolean; admins: number } } {
  try {
    const parsed = JSON.parse(jsonText);
    const url = parsed?.supabase?.url?.trim() || "";
    const key = parsed?.supabase?.anonKey?.trim() || "";
    const admins = Array.isArray(parsed?.admins) ? parsed.admins.filter((a: any) => a?.username && a?.password) : [];
    if (!url && !admins.length) return { ok: false, message: "No Supabase URL or admins found in file." };
    const existing = readLocal() || {};
    writeLocal({
      supabaseUrl: url || existing.supabaseUrl,
      supabaseAnonKey: key || existing.supabaseAnonKey,
      admins: admins.length ? admins : existing.admins,
    });
    return { ok: true, message: "Configuration imported.", imported: { url: Boolean(url), admins: admins.length } };
  } catch (e: any) {
    return { ok: false, message: `Invalid JSON: ${e?.message || e}` };
  }
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

/** Live-ping the anon key against the REST root to confirm it's valid. */
export async function pingSupabaseAnon(
  supabaseUrl: string,
  anonKey: string,
): Promise<{ ok: boolean; message: string }> {
  if (!supabaseUrl || !anonKey) return { ok: false, message: "URL and anon key are both required." };
  try {
    const u = new URL(supabaseUrl);
    if (!u.hostname.endsWith(".supabase.co") && !u.hostname.endsWith(".supabase.in") && !u.hostname.includes("localhost")) {
      // Allow self-hosted but warn
    }
  } catch {
    return { ok: false, message: "That doesn't look like a valid URL." };
  }
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "Anon key was rejected by this Supabase project." };
    }
    if (!res.ok && res.status !== 404) {
      return { ok: false, message: `Unexpected response (${res.status}). Check the URL.` };
    }
    return { ok: true, message: "Connection verified ✓" };
  } catch (e: any) {
    return { ok: false, message: `Network error: ${e?.message || e}. Check the URL is reachable.` };
  }
}

/** Check whether the core tables already exist (so we know if migration ran). */
export async function checkSchemaInstalled(
  supabaseUrl: string,
  anonKey: string,
): Promise<{ installed: boolean; missing: string[]; message: string }> {
  const tables = ["jobs", "applications", "contact_submissions", "admin_settings"];
  if (!supabaseUrl || !anonKey) return { installed: false, missing: tables, message: "Missing URL or anon key." };
  const missing: string[] = [];
  try {
    for (const t of tables) {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${t}?select=*&limit=0`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      if (res.status === 404) missing.push(t);
      else if (!res.ok && res.status !== 200 && res.status !== 206) missing.push(t);
    }
    if (missing.length === 0) {
      return { installed: true, missing: [], message: `All ${tables.length} tables present ✓` };
    }
    return { installed: false, missing, message: `Missing tables: ${missing.join(", ")}` };
  } catch (e: any) {
    return { installed: false, missing: tables, message: `Network error: ${e?.message || e}` };
  }
}

// =====================================================================
// SCHEMA VERSIONING
// =====================================================================
// Bump this constant + add a `schema_versions` row in the migration SQL
// every time you ship a schema-changing release. The wizard auto-detects
// the gap and offers a one-click "Apply pending updates" button.
export const CURRENT_SCHEMA_VERSION = 2;

/** Reads the highest applied version from the user's standalone DB. */
export async function getInstalledSchemaVersion(
  supabaseUrl: string,
  anonKey: string,
): Promise<{ version: number | null; supported: boolean; message: string }> {
  if (!supabaseUrl || !anonKey) return { version: null, supported: false, message: "Missing URL or anon key." };
  try {
    const res = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/schema_versions?select=version&order=version.desc&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    );
    if (res.status === 404) {
      return { version: null, supported: false, message: "schema_versions table not found — migration is outdated. Click 'Apply pending updates' to upgrade." };
    }
    if (!res.ok) return { version: null, supported: true, message: `Could not read version (${res.status}).` };
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return { version: 0, supported: true, message: "No version recorded — treating as v0." };
    }
    const v = Number(rows[0]?.version) || 0;
    return { version: v, supported: true, message: `Installed: v${v}` };
  } catch (e: any) {
    return { version: null, supported: false, message: `Network error: ${e?.message || e}` };
  }
}

export interface SchemaUpgradeStatus {
  installed: number | null;
  current: number;
  upToDate: boolean;
  pending: number;       // how many versions behind
  message: string;
}

export async function checkSchemaUpgrade(
  supabaseUrl: string,
  anonKey: string,
): Promise<SchemaUpgradeStatus> {
  const r = await getInstalledSchemaVersion(supabaseUrl, anonKey);
  const installed = r.version;
  const current = CURRENT_SCHEMA_VERSION;
  if (installed === null) {
    return { installed: null, current, upToDate: false, pending: current, message: r.message };
  }
  const pending = Math.max(0, current - installed);
  return {
    installed,
    current,
    upToDate: pending === 0,
    pending,
    message: pending === 0
      ? `Schema is up to date (v${installed}).`
      : `Schema is ${pending} version${pending === 1 ? '' : 's'} behind (installed v${installed}, current v${current}).`,
  };
}

/** Re-runs the bundled standalone migration — safe because it's idempotent. */
export async function applyPendingSchemaUpdates(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<{ ok: boolean; message: string; needsBootstrap?: boolean }> {
  // The standalone migration is fully idempotent (CREATE TABLE IF NOT EXISTS,
  // ADD COLUMN IF NOT EXISTS, INSERT ... ON CONFLICT DO NOTHING) so re-running
  // it is the simplest robust upgrade path.
  return runStandaloneMigration(supabaseUrl, serviceRoleKey);
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
