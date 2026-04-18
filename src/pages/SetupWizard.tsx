import { useState, useEffect } from "react";
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
  type AdminCredential,
} from "@/lib/runtime-config";
import { Database, Download, KeyRound, Server, Users, RefreshCw, CheckCircle2, AlertCircle, Copy, Zap } from "lucide-react";

const SetupWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: Supabase config
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [serviceRoleKey, setServiceRoleKey] = useState("");

  // Step 2: Migration
  const [migrationSql, setMigrationSql] = useState("");
  const [bootstrapSql, setBootstrapSql] = useState("");
  const [migrationStatus, setMigrationStatus] = useState<{ ok: boolean; message: string; needsBootstrap?: boolean } | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [testingRpc, setTestingRpc] = useState(false);
  const [rpcStatus, setRpcStatus] = useState<{ installed: boolean; message: string } | null>(null);

  // Step 3: Admins
  const [admins, setAdmins] = useState<AdminCredential[]>([{ username: "admin", password: "" }]);

  useEffect(() => {
    const cfg = getRuntimeConfigSync();
    setSupabaseUrl(cfg.supabaseUrl);
    setSupabaseAnonKey(cfg.supabaseAnonKey);
    fetch("/standalone-migration.sql").then(r => r.text()).then(setMigrationSql).catch(() => {});
    fetch("/bootstrap-exec-sql.sql").then(r => r.text()).then(setBootstrapSql).catch(() => {});
    getAdminCredentials().then(a => { if (a.length) setAdmins(a); });
  }, []);

  const handleSaveSupabase = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      toast({ title: "Both URL and anon key are required", variant: "destructive" });
      return;
    }
    saveRuntimeConfig(supabaseUrl, supabaseAnonKey);
    toast({ title: "Supabase config saved", description: "Reload the app to apply." });
    setStep(2);
  };

  const handleRunMigration = async () => {
    setMigrating(true);
    setMigrationStatus(null);
    const result = await runStandaloneMigration(supabaseUrl, serviceRoleKey);
    setMigrationStatus(result);
    setMigrating(false);
    if (result.ok) toast({ title: "Migration completed!" });
  };

  const handleDownloadSql = () => {
    const blob = new Blob([migrationSql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carehomestaffuk-schema.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySql = async () => {
    await navigator.clipboard.writeText(migrationSql);
    toast({ title: "SQL copied to clipboard" });
  };

  const handleSaveAdmins = () => {
    const valid = admins.filter(a => a.username.trim() && a.password.trim());
    if (!valid.length) {
      toast({ title: "Add at least one admin with username and password", variant: "destructive" });
      return;
    }
    saveAdminCredentials(valid);
    toast({ title: "Admin credentials saved" });
    setStep(4);
  };

  const handleReset = () => {
    if (!confirm("Clear all standalone configuration and revert to bundled defaults?")) return;
    clearRuntimeConfig();
    toast({ title: "Configuration cleared" });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-muted py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Server className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold">Standalone Setup Wizard</h1>
          <p className="text-muted-foreground mt-2">Connect this app to your own Supabase project in 3 steps.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= n ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground"}`}>
                {step > n ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              {n < 4 && <div className={`h-0.5 w-8 sm:w-16 ${step > n ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
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
              <Input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="https://your-project.supabase.co" />
            </div>
            <div>
              <Label>Anon (public) Key *</Label>
              <Textarea value={supabaseAnonKey} onChange={e => setSupabaseAnonKey(e.target.value)} rows={3} placeholder="eyJhbGciOi..." className="font-mono text-xs" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveSupabase} className="bg-primary text-primary-foreground">Save & Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" /> Step 2: Run Database Migration
            </h2>
            <p className="text-sm text-muted-foreground">
              This creates all tables (jobs, applications, contact submissions, admin settings) and Row-Level Security policies. <strong>One file. Zero dependencies.</strong>
            </p>

            <div className="bg-muted rounded-md p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-accent" /> Recommended: Manual run (always works)
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                <li>Click <strong>Download SQL</strong> or <strong>Copy SQL</strong> below</li>
                <li>Open your Supabase project → <strong>SQL Editor</strong> → <strong>New query</strong></li>
                <li>Paste the SQL and click <strong>Run</strong></li>
              </ol>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleDownloadSql}><Download className="h-4 w-4 mr-1" /> Download SQL</Button>
                <Button variant="outline" size="sm" onClick={handleCopySql}><Copy className="h-4 w-4 mr-1" /> Copy SQL</Button>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Optional: Auto-run with service-role key</p>
              <p className="text-xs text-muted-foreground">
                Requires an <code className="bg-muted px-1 rounded">exec_sql</code> RPC in your project. Skip this if you ran the SQL manually above.
              </p>
              <div>
                <Label className="text-xs">Service Role Key (kept in memory only — never stored)</Label>
                <Input type="password" value={serviceRoleKey} onChange={e => setServiceRoleKey(e.target.value)} placeholder="eyJhbGciOi..." className="font-mono text-xs" />
              </div>
              <Button variant="outline" onClick={handleRunMigration} disabled={migrating || !serviceRoleKey}>
                {migrating ? "Running..." : "Try Auto-Run"}
              </Button>
              {migrationStatus && (
                <div className={`text-sm rounded-md p-3 ${migrationStatus.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-yellow-50 text-yellow-800 border border-yellow-200"}`}>
                  {migrationStatus.message}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-between pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)} className="bg-primary text-primary-foreground">I've run the migration →</Button>
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
              Set the username/password pairs that can sign in to <code className="bg-muted px-1 rounded">/bestadmin</code>. Stored in your browser's localStorage — change anytime.
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
              <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
              <Button onClick={handleSaveAdmins} className="bg-primary text-primary-foreground">Save & Finish →</Button>
            </div>
          </div>
        )}

        {/* Step 4 - Done */}
        {step === 4 && (
          <div className="bg-card rounded-lg border p-6 space-y-4 text-center">
            <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto" />
            <h2 className="font-heading text-xl font-semibold">Setup Complete</h2>
            <p className="text-sm text-muted-foreground">
              Your standalone deployment is ready. Reload the app for the new Supabase connection to take effect, then sign in to the admin panel.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground">
                <RefreshCw className="h-4 w-4 mr-1" /> Reload App
              </Button>
              <Button variant="outline" onClick={() => navigate("/bestadmin")}>
                <KeyRound className="h-4 w-4 mr-1" /> Go to Admin Login
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
