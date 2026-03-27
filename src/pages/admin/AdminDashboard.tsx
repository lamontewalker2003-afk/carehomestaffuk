import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { isAdminLoggedIn, adminLogout, getApplications, getJobs, getTelegramSettings, saveTelegramSettings, addJob, deleteJob } from "@/lib/store";
import type { Application, Job, TelegramSettings } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { LayoutDashboard, FileText, Briefcase, Settings, LogOut, Plus, Trash2, Send, Users, Eye } from "lucide-react";

type Tab = "dashboard" | "applications" | "jobs" | "telegram";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!isAdminLoggedIn()) navigate("/bestadmin");
  }, [navigate]);

  const handleLogout = () => {
    adminLogout();
    navigate("/bestadmin");
  };

  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "applications" as Tab, label: "Applications", icon: FileText },
    { id: "jobs" as Tab, label: "Manage Jobs", icon: Briefcase },
    { id: "telegram" as Tab, label: "Telegram", icon: Send },
  ];

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar */}
      <aside className="w-64 bg-hero text-hero-foreground flex flex-col shrink-0">
        <div className="p-6 border-b border-hero-foreground/10">
          <Link to="/" className="flex items-center gap-1">
            <span className="font-heading text-lg font-bold">CareHomeStaff</span>
            <span className="font-heading text-lg font-bold text-hero-accent">UK</span>
          </Link>
          <p className="text-xs text-hero-foreground/50 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-hero-foreground/70 hover:bg-sidebar-accent/50"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-hero-foreground/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-hero-foreground/70 hover:bg-sidebar-accent/50">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "applications" && <ApplicationsTab />}
        {tab === "jobs" && <JobsTab />}
        {tab === "telegram" && <TelegramTab />}
      </main>
    </div>
  );
};

function DashboardTab() {
  const apps = getApplications();
  const jobs = getJobs();
  const telegram = getTelegramSettings();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Total Applications" value={apps.length} />
        <StatCard icon={Briefcase} label="Active Jobs" value={jobs.length} />
        <StatCard icon={Send} label="Telegram" value={telegram.botToken ? "Connected" : "Not Set"} />
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">Recent Applications</h2>
        {apps.length === 0 ? (
          <p className="text-muted-foreground text-sm">No applications yet.</p>
        ) : (
          <div className="bg-card rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Position</th>
                  <th className="text-left p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {apps.slice(-5).reverse().map(app => (
                  <tr key={app.id} className="border-t">
                    <td className="p-3">{app.fullName}</td>
                    <td className="p-3">{app.jobTitle}</td>
                    <td className="p-3">{new Date(app.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ApplicationsTab() {
  const apps = getApplications();
  const [selected, setSelected] = useState<Application | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Applications ({apps.length})</h1>
      {selected ? (
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <Button variant="outline" size="sm" onClick={() => setSelected(null)}>← Back to list</Button>
          <h2 className="font-heading text-xl font-semibold">{selected.fullName}</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Position:</span> {selected.jobTitle}</div>
            <div><span className="text-muted-foreground">Email:</span> {selected.email}</div>
            <div><span className="text-muted-foreground">Phone:</span> {selected.phone}</div>
            <div><span className="text-muted-foreground">Nationality:</span> {selected.nationality}</div>
            <div><span className="text-muted-foreground">Location:</span> {selected.currentLocation}</div>
            <div><span className="text-muted-foreground">Visa Status:</span> {selected.visaStatus}</div>
          </div>
          <div><span className="text-sm text-muted-foreground">Experience:</span><p className="text-sm mt-1">{selected.experience}</p></div>
          <div><span className="text-sm text-muted-foreground">Qualifications:</span><p className="text-sm mt-1">{selected.qualifications}</p></div>
          <div><span className="text-sm text-muted-foreground">Cover Letter:</span><p className="text-sm mt-1">{selected.coverLetter}</p></div>
          <p className="text-xs text-muted-foreground">Submitted: {new Date(selected.submittedAt).toLocaleString()}</p>
        </div>
      ) : apps.length === 0 ? (
        <p className="text-muted-foreground">No applications received yet.</p>
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Position</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Visa</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {apps.slice().reverse().map(app => (
                <tr key={app.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">{app.fullName}</td>
                  <td className="p-3">{app.jobTitle}</td>
                  <td className="p-3">{app.email}</td>
                  <td className="p-3">{app.visaStatus || "—"}</td>
                  <td className="p-3">{new Date(app.submittedAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(app)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>(getJobs());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", socCode: "", location: "", type: "Full-time", salary: "", description: "", requirements: "",
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.socCode) {
      toast({ title: "Title and SOC code are required", variant: "destructive" });
      return;
    }
    addJob({
      ...form,
      requirements: form.requirements.split("\n").filter(Boolean),
    });
    setJobs(getJobs());
    setForm({ title: "", socCode: "", location: "", type: "Full-time", salary: "", description: "", requirements: "" });
    setShowForm(false);
    toast({ title: "Job added successfully!" });
  };

  const handleDelete = (id: string) => {
    deleteJob(id);
    setJobs(getJobs());
    toast({ title: "Job deleted" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Manage Jobs ({jobs.length})</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Add Job
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-card rounded-lg border p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Job Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
            <div><Label>SOC Code *</Label><Input value={form.socCode} onChange={e => setForm(f => ({ ...f, socCode: e.target.value }))} placeholder="e.g. 6131" required /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><Label>Type</Label><Input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} /></div>
            <div><Label>Salary</Label><Input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="e.g. £25,000 – £30,000" /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          <div><Label>Requirements (one per line)</Label><Textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={3} /></div>
          <div className="flex gap-2">
            <Button type="submit" className="bg-primary text-primary-foreground">Save Job</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {jobs.map(job => (
          <div key={job.id} className="bg-card rounded-lg border p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{job.title}</h3>
              <p className="text-sm text-muted-foreground">SOC {job.socCode} · {job.location} · {job.salary}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(job.id)} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TelegramTab() {
  const [settings, setSettings] = useState<TelegramSettings>(getTelegramSettings());
  const [testing, setTesting] = useState(false);

  const handleSave = () => {
    saveTelegramSettings(settings);
    toast({ title: "Telegram settings saved!" });
  };

  const handleTest = async () => {
    if (!settings.botToken || !settings.chatId) {
      toast({ title: "Please enter bot token and chat ID first", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: settings.chatId,
          text: "✅ CareHomeStaffUK webhook test — connection successful!",
        }),
      });
      if (res.ok) {
        toast({ title: "Test message sent to Telegram!" });
      } else {
        toast({ title: "Failed to send test message. Check your credentials.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error connecting to Telegram", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Telegram Bot Settings</h1>
      <p className="text-muted-foreground text-sm">Configure your Telegram bot to receive application notifications.</p>

      <div className="bg-card rounded-lg border p-6 space-y-4 max-w-lg">
        <div>
          <Label htmlFor="botToken">Bot Token</Label>
          <Input
            id="botToken"
            value={settings.botToken}
            onChange={e => setSettings(s => ({ ...s, botToken: e.target.value }))}
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            type="password"
          />
          <p className="text-xs text-muted-foreground mt-1">Get this from @BotFather on Telegram</p>
        </div>

        <div>
          <Label htmlFor="chatId">Chat ID</Label>
          <Input
            id="chatId"
            value={settings.chatId}
            onChange={e => setSettings(s => ({ ...s, chatId: e.target.value }))}
            placeholder="-1001234567890"
          />
          <p className="text-xs text-muted-foreground mt-1">Your chat or group ID where notifications will be sent</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            Save Settings
          </Button>
          <Button onClick={handleTest} variant="outline" disabled={testing}>
            {testing ? "Sending..." : "Send Test Message"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
