import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  getRuntimeConfigSync,
  saveRuntimeConfig,
  clearRuntimeConfig,
  runStandaloneMigration,
  testExecSqlInstalled,
  getAdminCredentials,
  saveAdminCredentials,
  pingSupabaseAnon,
  checkSchemaInstalled,
  exportConfig,
  importConfig,
  getWizardStep,
  saveWizardStep,
  CURRENT_SCHEMA_VERSION,
  checkSchemaUpgrade,
  applyPendingSchemaUpdates,
  normalizeSupabaseUrl,
  type AdminCredential,
  type SchemaUpgradeStatus,
} from "@/lib/runtime-config";
import { activeSupabaseUrl, isStandaloneSupabase } from "@/integrations/supabase/client";
import {
  Database, Download, KeyRound, Server, Users, RefreshCw, CheckCircle2,
  AlertCircle, Copy, Zap, Upload, FileDown, Loader2, ShieldCheck, Eye, EyeOff,
  ArrowUpCircle, AlertTriangle,
} from "lucide-react";

type Status = { ok: boolean; message: string } | null;

const SetupWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(getWizardStep());

  // Step 1
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [showAnon, setShowAnon] = useState(false);
  const [pingStatus, setPingStatus] = useState<Status>(null);
  const [pinging, setPinging] = useState(false);

  // Step 2
  const [migrationSql, setMigrationSql] = useState("");
  const [bootstrapSql, setBootstrapSql] = useState("");
  const [jobsSeedSql, setJobsSeedSql] = useState("");
  const [serviceRoleKey, setServiceRoleKey] = useState("");
  const [showService, setShowService] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<Status & { needsBootstrap?: boolean }>(null);
  const [migrating, setMigrating] = useState(false);
  const [testingRpc, setTestingRpc] = useState(false);
  const [rpcStatus, setRpcStatus] = useState<{ installed: boolean; message: string } | null>(null);
  const [schemaCheck, setSchemaCheck] = useState<{ installed: boolean; missing: string[]; message: string } | null>(null);
  const [checkingSchema, setCheckingSchema] = useState(false);
  // Schema version (upgrade detection)
  const [versionStatus, setVersionStatus] = useState<SchemaUpgradeStatus | null>(null);
  const [checkingVersion, setCheckingVersion] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [isLiveConnectionMismatch, setIsLiveConnectionMismatch] = useState(false);

  // Step 3
  const [admins, setAdmins] = useState<AdminCredential[]>([{ username: "admin", password: "" }]);

  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cfg = getRuntimeConfigSync();
    setSupabaseUrl(cfg.supabaseUrl);
    setSupabaseAnonKey(cfg.supabaseAnonKey);
    fetch("/standalone-migration.sql").then(r => r.text()).then(setMigrationSql).catch(() => {});
    fetch("/bootstrap-exec-sql.sql").then(r => r.text()).then(setBootstrapSql).catch(() => {});
    fetch("/jobs-seed.sql").then(r => r.text()).then(setJobsSeedSql).catch(() => {});
    getAdminCredentials().then(a => { if (a.length) setAdmins(a); });
  }, []);

  useEffect(() => {
    const liveNorm = normalizeSupabaseUrl(activeSupabaseUrl || "");
    const savedNorm = normalizeSupabaseUrl(supabaseUrl);
    setIsLiveConnectionMismatch(Boolean(savedNorm && liveNorm && liveNorm !== savedNorm));
  }, [supabaseUrl]);

  // Persist step every time it changes.
  useEffect(() => { saveWizardStep(step); }, [step]);

  // Auto-check schema when arriving at step 2 with valid creds.
  useEffect(() => {
    if (step === 2 && supabaseUrl && supabaseAnonKey && !schemaCheck) {
      void runSchemaCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const goStep = (n: number) => setStep(n);

  // ---------- Step 1 actions ----------
  const handlePing = async () => {
    setPinging(true);
    setPingStatus(null);
    const r = await pingSupabaseAnon(supabaseUrl.trim(), supabaseAnonKey.trim());
    setPingStatus(r);
    setPinging(false);
    return r.ok;
  };

  const handleSaveSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      toast({ title: "Both URL and anon key are required", variant: "destructive" });
      return;
    }
    const ok = await handlePing();
    if (!ok) {
      toast({ title: "Connection check failed", description: "Saving anyway — fix details on next step if migration fails.", variant: "destructive" });
    }
    saveRuntimeConfig(supabaseUrl, supabaseAnonKey);
    // If the running client is still pointed at a different DB, reload so all
    // subsequent reads/writes (including the migration step) hit the new project.
    const liveNorm = normalizeSupabaseUrl(activeSupabaseUrl || "");
    const savedNorm = normalizeSupabaseUrl(supabaseUrl);
    if (liveNorm !== savedNorm) {
      toast({ title: "Reloading to apply new connection..." });
      saveWizardStep(2);
      setTimeout(() => window.location.reload(), 600);
      return;
    }
    toast({ title: "Supabase config saved" });
    goStep(2);
  };

  // ---------- Step 2 actions ----------
  const runSchemaCheck = async () => {
    setCheckingSchema(true);
    const r = await checkSchemaInstalled(supabaseUrl, supabaseAnonKey);
    setSchemaCheck(r);
    setCheckingSchema(false);
    // Once tables exist, also detect schema version drift
    if (r.installed) void runVersionCheck();
  };

  const runVersionCheck = async () => {
    setCheckingVersion(true);
    const v = await checkSchemaUpgrade(supabaseUrl, supabaseAnonKey);
    setVersionStatus(v);
    setCheckingVersion(false);
  };

  const handleApplyUpdates = async () => {
    if (!serviceRoleKey) {
      toast({ title: "Paste your service-role key first", variant: "destructive" });
      return;
    }
    setUpgrading(true);
    const r = await applyPendingSchemaUpdates(supabaseUrl, serviceRoleKey);
    setUpgrading(false);
    if (r.ok) {
      toast({ title: "Schema updated to v" + CURRENT_SCHEMA_VERSION });
      await runSchemaCheck();
    } else {
      toast({ title: "Update failed", description: r.message, variant: "destructive" });
    }
  };

  const handleRunMigration = async () => {
    if (isLiveConnectionMismatch) {
      const message = "Reload the app first so migration runs against the newly saved database.";
      setMigrationStatus({ ok: false, message });
      toast({ title: "Reload required", description: message, variant: "destructive" });
      return;
    }
    setMigrating(true);
    setMigrationStatus(null);
    const result = await runStandaloneMigration(supabaseUrl, serviceRoleKey);
    setMigrationStatus(result);
    setMigrating(false);
    if (result.ok) {
      toast({ title: "Migration completed!", description: "Verifying tables..." });
      await runSchemaCheck();
    }
  };

  const handleTestRpc = async () => {
    if (isLiveConnectionMismatch) {
      const message = "Reload the app first so the RPC test checks the newly saved database.";
      setRpcStatus({ installed: false, message });
      toast({ title: "Reload required", description: message, variant: "destructive" });
      return;
    }
    setTestingRpc(true);
    setRpcStatus(null);
    const result = await testExecSqlInstalled(supabaseUrl, serviceRoleKey);
    setRpcStatus(result);
    setTestingRpc(false);
  };

  const downloadFile = (content: string, filename: string, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSql = () => downloadFile(migrationSql, "carehomestaffuk-schema.sql");
  const handleDownloadBootstrap = () => downloadFile(bootstrapSql, "bootstrap-exec-sql.sql");
  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  // ---------- Step 3 actions ----------
  const handleSaveAdmins = () => {
    const valid = admins.filter(a => a.username.trim() && a.password.trim());
    if (!valid.length) {
      toast({ title: "Add at least one admin with username and password", variant: "destructive" });
      return;
    }
    saveAdminCredentials(valid);
    toast({ title: "Admin credentials saved" });
    goStep(4);
  };

  // ---------- Global actions ----------
  const handleReset = () => {
    if (!confirm("Clear ALL standalone configuration (Supabase + admins) and revert to bundled defaults?")) return;
    clearRuntimeConfig();
    toast({ title: "Configuration cleared" });
    setTimeout(() => window.location.reload(), 400);
  };

  const handleExportConfig = () => {
    const json = exportConfig();
    downloadFile(json, `carehomestaffuk-config-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    toast({ title: "Configuration exported", description: "Keep this file safe — it contains your admin passwords." });
  };

  const handleImportClick = () => importInputRef.current?.click();
  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const r = importConfig(text);
    if (!r.ok) {
      toast({ title: "Import failed", description: r.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Configuration imported",
      description: `URL: ${r.imported?.url ? "✓" : "—"}, Admins: ${r.imported?.admins || 0}`,
    });
    setTimeout(() => window.location.reload(), 600);
  };

  const allSchemaOk = schemaCheck?.installed === true;

  return (
    <div className="min-h-screen bg-muted py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Server className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold">Standalone Setup Wizard</h1>
          <p className="text-muted-foreground mt-2">Connect this app to your own Supabase project in a few clicks.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => goStep(n)}
              className="flex items-center"
              aria-label={`Go to step ${n}`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${step >= n ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground hover:border-primary"}`}>
                {step > n ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              {n < 4 && <div className={`h-0.5 w-8 sm:w-16 ${step > n ? "bg-primary" : "bg-border"}`} />}
            </button>
          ))}
        </div>

        {/* Active connection banner — shows where the running app is ACTUALLY writing */}
        {(() => {
          const savedUrl = normalizeSupabaseUrl(supabaseUrl);
          const liveUrl = normalizeSupabaseUrl(activeSupabaseUrl || "") || "(none)";
          const mismatch = isLiveConnectionMismatch;
          return (
            <div className={`rounded-md border p-3 mb-4 text-xs ${mismatch ? "bg-destructive/10 border-destructive/30" : "bg-muted border-border"}`}>
              <div className="flex items-start gap-2">
                {mismatch ? <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" /> : <Database className="h-4 w-4 text-muted-foreground mt-0.5" />}
                <div className="flex-1 space-y-1">
                  <div><strong>Live app is connected to:</strong> <code className="break-all">{liveUrl}</code> {isStandaloneSupabase ? "(standalone)" : "(Lovable Cloud default)"}</div>
                  {savedUrl && <div><strong>Saved in wizard:</strong> <code className="break-all">{savedUrl}</code></div>}
                  {mismatch && (
                    <div className="text-destructive font-medium pt-1">
                      ⚠ The running app is still using the OLD database. Click "Reload App" below to switch.
                      <Button size="sm" variant="destructive" className="ml-2 h-6 px-2 text-xs" onClick={() => window.location.reload()}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Reload now
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Quick actions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={handleExportConfig}>
            <FileDown className="h-4 w-4 mr-1" /> Export config
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-1" /> Import config
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ""; }}
          />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> Step 1: Connect Supabase
            </h2>
            <p className="text-sm text-muted-foreground">
              Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">supabase.com</a>, then copy your project URL and anon (public) key from <strong>Project Settings → API</strong>.
            </p>
            <div>
              <Label>Supabase Project URL *</Label>
              <Input value={supabaseUrl} onChange={e => { setSupabaseUrl(e.target.value); setPingStatus(null); }} placeholder="https://your-project.supabase.co" />
            </div>
            <div>
              <Label>Anon (public) Key *</Label>
              <div className="relative">
                <Textarea
                  value={supabaseAnonKey}
                  onChange={e => { setSupabaseAnonKey(e.target.value); setPingStatus(null); }}
                  rows={3}
                  placeholder="eyJhbGciOi..."
                  className={`font-mono text-xs pr-9 ${showAnon ? "" : "[-webkit-text-security:disc] [text-security:disc]"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowAnon(s => !s)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle visibility"
                >
                  {showAnon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {pingStatus && (
              <div className={`text-xs rounded-md p-2 ${pingStatus.ok ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                {pingStatus.message}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handlePing} disabled={pinging || !supabaseUrl || !supabaseAnonKey}>
                {pinging ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Testing...</> : <><ShieldCheck className="h-4 w-4 mr-1" /> Test connection</>}
              </Button>
              <Button onClick={handleSaveSupabase} className="bg-primary text-primary-foreground">Save & Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-card rounded-lg border p-6 space-y-5">
            <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" /> Step 2: Database Migration
            </h2>
            <p className="text-sm text-muted-foreground">
              Creates all tables (jobs, applications, contact submissions, admin settings, bank accounts, invoice template) and Row-Level Security policies. The migration is idempotent — safe to re-run.
            </p>

            {/* Live schema status */}
            <div className={`rounded-md p-3 border flex items-start gap-3 ${allSchemaOk ? "bg-primary/10 border-primary/20" : "bg-muted border-border"}`}>
              <div className="mt-0.5">
                {checkingSchema
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  : allSchemaOk
                    ? <CheckCircle2 className="h-5 w-5 text-primary" />
                    : <AlertCircle className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-semibold">
                  {checkingSchema ? "Checking schema..." : allSchemaOk ? "Schema is installed" : "Schema not detected"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {schemaCheck?.message || "We'll auto-check the moment you load this step."}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={runSchemaCheck} disabled={checkingSchema}>
                <RefreshCw className={`h-4 w-4 ${checkingSchema ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Schema version / pending updates */}
            {allSchemaOk && (
              <div className={`rounded-md p-3 border flex items-start gap-3 ${versionStatus?.upToDate ? "bg-primary/10 border-primary/20" : versionStatus && !versionStatus.upToDate ? "bg-amber-50 border-amber-200" : "bg-muted border-border"}`}>
                <div className="mt-0.5">
                  {checkingVersion
                    ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    : versionStatus?.upToDate
                      ? <CheckCircle2 className="h-5 w-5 text-primary" />
                      : <ArrowUpCircle className="h-5 w-5 text-amber-600" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold">
                    {checkingVersion ? "Checking schema version..." : versionStatus?.upToDate ? `Schema is up to date (v${versionStatus.installed})` : versionStatus ? `Update available — installed v${versionStatus.installed ?? '?'} → current v${versionStatus.current}` : "Detecting schema version…"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{versionStatus?.message || `Bundled app version: v${CURRENT_SCHEMA_VERSION}`}</p>
                  {versionStatus && !versionStatus.upToDate && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" onClick={handleApplyUpdates} disabled={upgrading || !serviceRoleKey} className="bg-primary text-primary-foreground">
                        {upgrading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Applying…</> : <><ArrowUpCircle className="h-4 w-4 mr-1" />Apply pending updates</>}
                      </Button>
                      {!serviceRoleKey && <span className="text-xs text-muted-foreground self-center">(paste service-role key below first)</span>}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={runVersionCheck} disabled={checkingVersion}>
                  <RefreshCw className={`h-4 w-4 ${checkingVersion ? "animate-spin" : ""}`} />
                </Button>
              </div>
            )}
            {!allSchemaOk && (
              <>
                {/* Bootstrap */}
                <div className="border-2 border-primary/30 bg-primary/5 rounded-md p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">One-time bootstrap (~30 seconds, only once per Supabase project)</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Installs a tiny <code className="bg-muted px-1 rounded">exec_sql</code> RPC so this wizard (and future schema updates) can run with one click.
                      </p>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4 mt-2">
                        <li>Click <strong>Copy bootstrap SQL</strong></li>
                        <li>Open Supabase → <strong>SQL Editor</strong> → <strong>New query</strong> → paste → <strong>Run</strong></li>
                        <li>Come back, paste your service-role key below, then click <strong>Auto-Run Migration</strong></li>
                      </ol>
                      <div className="flex flex-wrap gap-2 pt-3">
                        <Button variant="outline" size="sm" onClick={() => copyText(bootstrapSql, "Bootstrap SQL")}>
                          <Copy className="h-4 w-4 mr-1" /> Copy bootstrap SQL
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadBootstrap}>
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-run */}
                <div className="border-2 border-accent/30 bg-accent/5 rounded-md p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <div className="flex-1 space-y-3">
                      <p className="font-semibold text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4" /> One-click auto-run
                      </p>
                      <div>
                        <Label className="text-xs">Service Role Key (in-memory only — never stored)</Label>
                        <div className="relative">
                          <Input
                            type={showService ? "text" : "password"}
                            value={serviceRoleKey}
                            onChange={e => setServiceRoleKey(e.target.value)}
                            placeholder="eyJhbGciOi..."
                            className="font-mono text-xs pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowService(s => !s)}
                            className="absolute top-1/2 -translate-y-1/2 right-2 text-muted-foreground hover:text-foreground"
                            aria-label="Toggle visibility"
                          >
                            {showService ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Find it in Supabase → <strong>Project Settings → API → service_role</strong> (secret). Never commit this key.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={handleTestRpc} disabled={testingRpc || !serviceRoleKey}>
                          {testingRpc ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Testing...</> : "Test connection"}
                        </Button>
                        <Button onClick={handleRunMigration} disabled={migrating || !serviceRoleKey || isLiveConnectionMismatch} className="bg-primary text-primary-foreground">
                          {migrating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Running...</> : <><Zap className="h-4 w-4 mr-1" />Auto-Run Migration</>}
                        </Button>
                        {isLiveConnectionMismatch && (
                          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                            <RefreshCw className="h-4 w-4 mr-1" /> Reload App
                          </Button>
                        )}
                      </div>
                      {rpcStatus && (
                        <div className={`text-xs rounded-md p-2 ${rpcStatus.installed ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                          {rpcStatus.message}
                        </div>
                      )}
                      {migrationStatus && (
                        <div className={`text-sm rounded-md p-3 ${migrationStatus.ok ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                          {migrationStatus.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Manual fallback */}
                <details className="bg-muted rounded-md p-4">
                  <summary className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Prefer to run manually? (fallback)
                  </summary>
                  <div className="pt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Skip the bootstrap. Just paste the full schema directly into Supabase SQL Editor.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleDownloadSql}><Download className="h-4 w-4 mr-1" />Download schema</Button>
                      <Button variant="outline" size="sm" onClick={() => copyText(migrationSql, "Schema SQL")}><Copy className="h-4 w-4 mr-1" />Copy schema</Button>
                    </div>
                  </div>
                </details>
              </>
            )}

            <div className="flex gap-2 justify-between pt-4 border-t">
              <Button variant="ghost" onClick={() => goStep(1)}>← Back</Button>
              <Button onClick={() => goStep(3)} className="bg-primary text-primary-foreground">
                {allSchemaOk ? "Continue →" : "Skip & continue →"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Step 3: Admin Accounts
            </h2>
            <p className="text-sm text-muted-foreground">
              Set the username/password pairs that can sign in to <code className="bg-muted px-1 rounded">/bestadmin</code>. Stored locally in your browser — change anytime.
            </p>

            {admins.map((a, i) => (
              <div key={i} className="grid sm:grid-cols-2 gap-3 p-3 bg-muted rounded-md">
                <div>
                  <Label className="text-xs">Username</Label>
                  <Input value={a.username} onChange={e => setAdmins(list => list.map((x, j) => j === i ? { ...x, username: e.target.value } : x))} />
                </div>
                <div>
                  <Label className="text-xs">Password</Label>
                  <div className="flex gap-2">
                    <Input type="password" value={a.password} onChange={e => setAdmins(list => list.map((x, j) => j === i ? { ...x, password: e.target.value } : x))} />
                    {admins.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => setAdmins(list => list.filter((_, j) => j !== i))}>×</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={() => setAdmins(list => [...list, { username: "", password: "" }])}>
              + Add another admin
            </Button>

            <div className="flex gap-2 justify-between pt-4 border-t">
              <Button variant="ghost" onClick={() => goStep(2)}>← Back</Button>
              <Button onClick={handleSaveAdmins} className="bg-primary text-primary-foreground">Save & Finish →</Button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="bg-card rounded-lg border p-6 space-y-4 text-center">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
            <h2 className="font-heading text-xl font-semibold">Setup Complete</h2>
            <p className="text-sm text-muted-foreground">
              Your standalone deployment is ready. Reload the app for the new Supabase connection to take effect, then sign in to the admin panel.
            </p>
            <div className="bg-muted rounded-md p-3 text-left text-xs space-y-1">
              <p><strong>URL:</strong> <span className="font-mono break-all">{supabaseUrl || "—"}</span></p>
              <p><strong>Admins:</strong> {admins.filter(a => a.username && a.password).map(a => a.username).join(", ") || "—"}</p>
              <p><strong>Schema:</strong> {allSchemaOk ? "✓ verified" : "not verified — run migration if you haven't"}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground">
                <RefreshCw className="h-4 w-4 mr-1" /> Reload App
              </Button>
              <Button variant="outline" onClick={() => navigate("/bestadmin")}>
                <KeyRound className="h-4 w-4 mr-1" /> Go to Admin Login
              </Button>
              <Button variant="outline" onClick={handleExportConfig}>
                <FileDown className="h-4 w-4 mr-1" /> Backup config
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-destructive underline">
            Reset all standalone configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
