import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  isAdminLoggedIn, adminLogout, getApplications, deleteApplication, getJobs,
  getTelegramSettings, saveTelegramSettings, addJob, deleteJob, updateJob,
  getSEOSettings, saveSEOSettings, getSMTPSettings, saveSMTPSettings,
  getSiteSettings, saveSiteSettings, getEmailTemplates, saveEmailTemplates,
  updateApplicationStatus, markOfferLetterSent, sendEmail,
  buildApplicationSuccessEmail, buildOfferLetterEmail,
} from "@/lib/store";
import type { Application, Job, TelegramSettings, SEOSettings, SMTPSettings, SiteSettings, EmailTemplates, EmailTemplateFields } from "@/lib/store";
import { defaultSiteSettings } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, FileText, Briefcase, Send, LogOut, Plus, Trash2, Eye,
  Pencil, X, PoundSterling, Search, Globe, Menu, Mail, Server, Settings,
  FileCheck, CheckCircle, XCircle, Clock, Award,
} from "lucide-react";

type Tab = "dashboard" | "applications" | "jobs" | "telegram" | "smtp" | "email-templates" | "seo" | "site-settings";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) navigate("/bestadmin");
  }, [navigate]);

  const handleLogout = () => { adminLogout(); navigate("/bestadmin"); };

  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "applications" as Tab, label: "Applications", icon: FileText },
    { id: "jobs" as Tab, label: "Manage Jobs", icon: Briefcase },
    { id: "telegram" as Tab, label: "Telegram", icon: Send },
    { id: "smtp" as Tab, label: "SMTP / Email", icon: Mail },
    { id: "email-templates" as Tab, label: "Email Templates", icon: FileCheck },
    { id: "site-settings" as Tab, label: "Site Settings", icon: Settings },
    { id: "seo" as Tab, label: "SEO & Search", icon: Globe },
  ];

  return (
    <div className="min-h-screen flex bg-muted">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-hero text-hero-foreground flex flex-col shrink-0 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-hero-foreground/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1">
            <span className="font-heading text-lg font-bold">CareHomeStaff</span>
            <span className="font-heading text-lg font-bold text-hero-accent">UK</span>
          </Link>
          <button className="lg:hidden text-hero-foreground/70" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <p className="text-xs text-hero-foreground/50 px-6 pt-2">Admin Panel</p>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-hero-foreground/70 hover:bg-sidebar-accent/50"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-hero-foreground/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-hero-foreground/70 hover:bg-sidebar-accent/50">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
          <span className="font-heading font-semibold text-sm">Admin Panel</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          {tab === "dashboard" && <DashboardTab />}
          {tab === "applications" && <ApplicationsTab />}
          {tab === "jobs" && <JobsTab />}
          {tab === "telegram" && <TelegramTab />}
          {tab === "smtp" && <SMTPTab />}
          {tab === "email-templates" && <EmailTemplatesTab />}
          {tab === "site-settings" && <SiteSettingsTab />}
          {tab === "seo" && <SEOTab />}
        </div>
      </main>
    </div>
  );
};

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-lg border p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg lg:text-xl font-bold truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [telegram, setTelegram] = useState<TelegramSettings>({ botToken: '', chatId: '' });

  useEffect(() => {
    getApplications().then(setApps);
    getJobs().then(setJobs);
    getTelegramSettings().then(setTelegram);
  }, []);

  const successful = apps.filter(a => a.status === 'successful').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard icon={FileText} label="Total Applications" value={apps.length} />
        <StatCard icon={CheckCircle} label="Successful" value={successful} />
        <StatCard icon={Briefcase} label="Active Jobs" value={jobs.filter(j => j.isActive).length} />
        <StatCard icon={Send} label="Telegram" value={telegram.botToken ? "Connected" : "Not Set"} />
      </div>
      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">Recent Applications</h2>
        {apps.length === 0 ? <p className="text-muted-foreground text-sm">No applications yet.</p> : (
          <div className="bg-card rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr>
                <th className="text-left p-3 font-medium whitespace-nowrap">Name</th>
                <th className="text-left p-3 font-medium whitespace-nowrap">Position</th>
                <th className="text-left p-3 font-medium whitespace-nowrap">Status</th>
                <th className="text-left p-3 font-medium whitespace-nowrap">Date</th>
              </tr></thead>
              <tbody>
                {apps.slice(0, 5).map(app => (
                  <tr key={app.id} className="border-t">
                    <td className="p-3 whitespace-nowrap">{app.fullName}</td>
                    <td className="p-3 whitespace-nowrap">{app.jobTitle}</td>
                    <td className="p-3 whitespace-nowrap"><StatusBadge status={app.status} /></td>
                    <td className="p-3 whitespace-nowrap">{new Date(app.submittedAt).toLocaleDateString()}</td>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    reviewed: { label: "Reviewed", className: "bg-blue-100 text-blue-800 border-blue-200" },
    successful: { label: "Successful", className: "bg-green-100 text-green-800 border-green-200" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
  };
  const s = map[status] || map.pending;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.className}`}>{s.label}</span>;
}

function ApplicationsTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [offerOverrides, setOfferOverrides] = useState<Partial<EmailTemplateFields>>({});
  const [showOfferForm, setShowOfferForm] = useState(false);

  useEffect(() => { getApplications().then(setApps); }, []);

  const refresh = async () => {
    const updated = await getApplications();
    setApps(updated);
    if (selected) setSelected(updated.find(a => a.id === selected.id) || null);
  };

  const filteredApps = apps.filter(app => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return app.fullName.toLowerCase().includes(s) || app.email.toLowerCase().includes(s) ||
      app.jobTitle.toLowerCase().includes(s) || app.nationality.toLowerCase().includes(s) ||
      app.visaStatus.toLowerCase().includes(s) || app.currentLocation.toLowerCase().includes(s);
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    await deleteApplication(id);
    await refresh();
    if (selected?.id === id) setSelected(null);
    toast({ title: "Application deleted" });
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateApplicationStatus(id, status);
    if (status === 'successful') {
      const app = apps.find(a => a.id === id);
      if (app) {
        setSendingEmail(true);
        const html = await buildApplicationSuccessEmail(app);
        const sent = await sendEmail(app.email, "Congratulations — Your Application Was Successful!", html);
        setSendingEmail(false);
        if (sent) toast({ title: "Success email sent to " + app.email });
        else toast({ title: "Status updated but email may not have sent (check SMTP)", variant: "destructive" });
      }
    } else {
      toast({ title: `Status updated to ${status}` });
    }
    await refresh();
  };

  const handleSendOfferLetter = async (app: Application) => {
    setSendingEmail(true);
    const overrides = Object.keys(offerOverrides).length > 0 ? offerOverrides : undefined;
    const html = await buildOfferLetterEmail(app, overrides);
    const sent = await sendEmail(app.email, "Offer of Employment", html);
    if (sent) {
      await markOfferLetterSent(app.id);
      toast({ title: "Offer letter sent to " + app.email });
    } else {
      toast({ title: "Failed to send offer letter. Check SMTP settings.", variant: "destructive" });
    }
    setSendingEmail(false);
    setShowOfferForm(false);
    setOfferOverrides({});
    await refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Applications ({apps.length})</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="successful">Successful</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {selected ? (
        <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { setSelected(null); setShowOfferForm(false); }}>← Back</Button>
            <div className="flex items-center gap-2">
              <StatusBadge status={selected.status} />
              <Button variant="destructive" size="sm" onClick={() => handleDelete(selected.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </div>

          <h2 className="font-heading text-xl font-semibold">{selected.fullName}</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
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

          {/* Status actions */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="font-heading font-semibold text-sm">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {selected.status !== 'reviewed' && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(selected.id, 'reviewed')} disabled={sendingEmail}>
                  <Eye className="h-4 w-4 mr-1" /> Mark Reviewed
                </Button>
              )}
              {selected.status !== 'successful' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange(selected.id, 'successful')} disabled={sendingEmail}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Mark Successful
                </Button>
              )}
              {selected.status !== 'rejected' && (
                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(selected.id, 'rejected')} disabled={sendingEmail}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              )}
            </div>

            {/* Offer Letter section */}
            {selected.status === 'successful' && (
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-semibold text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" /> Offer Letter
                  </h4>
                  {selected.offerLetterSent && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Sent {selected.offerLetterSentAt ? new Date(selected.offerLetterSentAt).toLocaleDateString() : ''}
                    </span>
                  )}
                </div>
                {!showOfferForm ? (
                  <Button size="sm" onClick={() => setShowOfferForm(true)} className="bg-primary text-primary-foreground">
                    <Mail className="h-4 w-4 mr-1" /> {selected.offerLetterSent ? 'Resend Offer Letter' : 'Send Offer Letter'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Optionally override any field for this offer letter. Leave blank to use the saved template. Variables: {'{{fullName}}, {{jobTitle}}, {{date}}, {{siteName}}'}</p>
                    <div>
                      <Label className="text-xs">Heading (optional)</Label>
                      <Input value={offerOverrides.heading || ''} onChange={e => setOfferOverrides(o => ({ ...o, heading: e.target.value }))} placeholder="Offer of Employment" />
                    </div>
                    <div>
                      <Label className="text-xs">Opening line (optional)</Label>
                      <Textarea value={offerOverrides.intro || ''} onChange={e => setOfferOverrides(o => ({ ...o, intro: e.target.value }))} rows={2} placeholder="Dear {{fullName}}..." />
                    </div>
                    <div>
                      <Label className="text-xs">Body paragraphs (one per line, optional)</Label>
                      <Textarea
                        value={(offerOverrides.paragraphs || []).join('\n')}
                        onChange={e => setOfferOverrides(o => ({ ...o, paragraphs: e.target.value.split('\n').filter(Boolean) }))}
                        rows={6}
                        placeholder="One paragraph per line..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Highlight box (optional)</Label>
                      <Input value={offerOverrides.highlight || ''} onChange={e => setOfferOverrides(o => ({ ...o, highlight: e.target.value }))} placeholder="Welcome to the team..." />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSendOfferLetter(selected)} disabled={sendingEmail} className="bg-primary text-primary-foreground">
                        {sendingEmail ? 'Sending...' : 'Send Offer Letter'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setShowOfferForm(false); setOfferOverrides({}); }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : filteredApps.length === 0 ? (
        <p className="text-muted-foreground">{search || statusFilter !== "all" ? "No applications match your filters." : "No applications received yet."}</p>
      ) : (
        <div className="bg-card rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr>
              <th className="text-left p-3 font-medium whitespace-nowrap">Name</th>
              <th className="text-left p-3 font-medium whitespace-nowrap">Position</th>
              <th className="text-left p-3 font-medium whitespace-nowrap hidden sm:table-cell">Email</th>
              <th className="text-left p-3 font-medium whitespace-nowrap">Status</th>
              <th className="text-left p-3 font-medium whitespace-nowrap hidden md:table-cell">Date</th>
              <th className="p-3"></th>
            </tr></thead>
            <tbody>
              {filteredApps.map(app => (
                <tr key={app.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium whitespace-nowrap">{app.fullName}</td>
                  <td className="p-3 whitespace-nowrap">{app.jobTitle}</td>
                  <td className="p-3 whitespace-nowrap hidden sm:table-cell">{app.email}</td>
                  <td className="p-3 whitespace-nowrap"><StatusBadge status={app.status} /></td>
                  <td className="p-3 whitespace-nowrap hidden md:table-cell">{new Date(app.submittedAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(app)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(app.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", socCode: "", location: "", type: "Full-time", salary: "",
    hourlyRate: "", sponsorshipFee: "", description: "", requirements: "", isActive: true,
  });

  useEffect(() => { getJobs().then(setJobs); }, []);
  const refreshJobs = async () => { setJobs(await getJobs()); };
  const resetForm = () => {
    setForm({ title: "", socCode: "", location: "", type: "Full-time", salary: "", hourlyRate: "", sponsorshipFee: "", description: "", requirements: "", isActive: true });
    setEditingId(null); setShowForm(false);
  };
  const startEdit = (job: Job) => {
    setForm({ title: job.title, socCode: job.socCode, location: job.location, type: job.type, salary: job.salary, hourlyRate: job.hourlyRate, sponsorshipFee: job.sponsorshipFee, description: job.description, requirements: job.requirements.join("\n"), isActive: job.isActive });
    setEditingId(job.id); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.socCode) { toast({ title: "Title and SOC code are required", variant: "destructive" }); return; }
    if (editingId) {
      await updateJob(editingId, { title: form.title, socCode: form.socCode, location: form.location, type: form.type, salary: form.salary, hourlyRate: form.hourlyRate, sponsorshipFee: form.sponsorshipFee, description: form.description, requirements: form.requirements.split("\n").filter(Boolean), isActive: form.isActive });
      toast({ title: "Job updated successfully!" });
    } else {
      await addJob({ ...form, requirements: form.requirements.split("\n").filter(Boolean) });
      toast({ title: "Job added successfully!" });
    }
    await refreshJobs(); resetForm();
  };

  const handleDelete = async (id: string) => { await deleteJob(id); await refreshJobs(); toast({ title: "Job deleted" }); };
  const handleToggleActive = async (id: string, active: boolean) => { await updateJob(id, { isActive: active }); await refreshJobs(); toast({ title: active ? "Job activated" : "Job deactivated" }); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Manage Positions ({jobs.length})</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-primary text-primary-foreground">
          {showForm ? <><X className="h-4 w-4 mr-1" /> Close</> : <><Plus className="h-4 w-4 mr-1" /> Add Position</>}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold">{editingId ? "Edit Position" : "Add New Position"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Job Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
            <div><Label>SOC Code *</Label><Input value={form.socCode} onChange={e => setForm(f => ({ ...f, socCode: e.target.value }))} placeholder="e.g. 6131" required /></div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><Label>Employment Type</Label><Input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} /></div>
            <div><Label>Annual Salary Range</Label><Input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="e.g. £25,000 – £30,000" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="flex items-center gap-1"><PoundSterling className="h-3.5 w-3.5" /> Hourly Rate</Label><Input value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} placeholder="e.g. £12.50" /></div>
            <div><Label className="flex items-center gap-1"><PoundSterling className="h-3.5 w-3.5" /> Sponsorship Fee</Label><Input value={form.sponsorshipFee} onChange={e => setForm(f => ({ ...f, sponsorshipFee: e.target.value }))} placeholder="e.g. £1,500" /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          <div><Label>Requirements (one per line)</Label><Textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={3} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} /><Label>Position Active</Label></div>
          <div className="flex gap-2">
            <Button type="submit" className="bg-primary text-primary-foreground">{editingId ? "Update Position" : "Save Position"}</Button>
            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {jobs.map(job => (
          <div key={job.id} className={`bg-card rounded-lg border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${!job.isActive ? "opacity-60" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{job.title}</h3>
                {!job.isActive && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Inactive</span>}
              </div>
              <p className="text-sm text-muted-foreground">SOC {job.socCode} · {job.location} · {job.salary}</p>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                {job.hourlyRate && <span>Hourly: {job.hourlyRate}</span>}
                {job.sponsorshipFee && <span>Sponsorship: {job.sponsorshipFee}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Switch checked={job.isActive} onCheckedChange={v => handleToggleActive(job.id, v)} />
              <Button variant="ghost" size="sm" onClick={() => startEdit(job)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(job.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TelegramTab() {
  const [settings, setSettings] = useState<TelegramSettings>({ botToken: '', chatId: '' });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getTelegramSettings().then(setSettings); }, []);

  const handleSave = async () => { setSaving(true); await saveTelegramSettings(settings); setSaving(false); toast({ title: "Telegram settings saved!" }); };
  const handleTest = async () => {
    if (!settings.botToken || !settings.chatId) { toast({ title: "Please save bot token and chat ID first", variant: "destructive" }); return; }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram', { body: { message: "✅ CareHomeStaffUK webhook test — connection successful!" } });
      if (error || !data?.success) toast({ title: "Failed to send. Check credentials.", variant: "destructive" });
      else toast({ title: "Test message sent to Telegram!" });
    } catch { toast({ title: "Error connecting to Telegram", variant: "destructive" }); }
    finally { setTesting(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Telegram Bot Settings</h1>
      <p className="text-muted-foreground text-sm">Configure your Telegram bot to receive application notifications.</p>
      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4 max-w-lg">
        <div><Label>Bot Token</Label><Input value={settings.botToken} onChange={e => setSettings(s => ({ ...s, botToken: e.target.value }))} placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" type="password" /><p className="text-xs text-muted-foreground mt-1">Get this from @BotFather on Telegram</p></div>
        <div><Label>Chat ID</Label><Input value={settings.chatId} onChange={e => setSettings(s => ({ ...s, chatId: e.target.value }))} placeholder="-1001234567890" /><p className="text-xs text-muted-foreground mt-1">Your chat or group ID</p></div>
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">{saving ? "Saving..." : "Save Settings"}</Button>
          <Button onClick={handleTest} variant="outline" disabled={testing}>{testing ? "Sending..." : "Send Test Message"}</Button>
        </div>
      </div>
    </div>
  );
}

function SMTPTab() {
  const [settings, setSettings] = useState<SMTPSettings>({ host: '', port: 587, username: '', password: '', fromEmail: '', fromName: 'CareHomeStaffUK', secure: false });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => { getSMTPSettings().then(setSettings); }, []);

  const handleSave = async () => { setSaving(true); await saveSMTPSettings(settings); setSaving(false); toast({ title: "SMTP settings saved!" }); };
  const handleTest = async () => {
    if (!settings.host || !settings.username || !settings.fromEmail) { toast({ title: "Please save SMTP settings first", variant: "destructive" }); return; }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to: settings.fromEmail, subject: "SMTP Test — CareHomeStaffUK", html: "<h2>SMTP Test</h2><p>Your SMTP settings are working correctly!</p>" },
      });
      if (error || !data?.success) toast({ title: data?.error || "SMTP test failed.", variant: "destructive" });
      else toast({ title: `Test email sent to ${settings.fromEmail}!` });
    } catch { toast({ title: "Error testing SMTP", variant: "destructive" }); }
    finally { setTesting(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">SMTP / Email Configuration</h1>
      <p className="text-muted-foreground text-sm">Configure your outgoing mail server for sending emails to applicants.</p>
      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4 max-w-lg">
        <div className="flex items-center gap-2 mb-2"><Server className="h-5 w-5 text-primary" /><h2 className="font-heading font-semibold">SMTP Server</h2></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>SMTP Host *</Label><Input value={settings.host} onChange={e => setSettings(s => ({ ...s, host: e.target.value }))} placeholder="smtp.gmail.com" /></div>
          <div><Label>Port</Label><Input type="number" value={settings.port} onChange={e => setSettings(s => ({ ...s, port: parseInt(e.target.value) || 587 }))} /></div>
        </div>
        <div><Label>Username / Email *</Label><Input value={settings.username} onChange={e => setSettings(s => ({ ...s, username: e.target.value }))} /></div>
        <div><Label>Password / App Password *</Label><Input type="password" value={settings.password} onChange={e => setSettings(s => ({ ...s, password: e.target.value }))} /><p className="text-xs text-muted-foreground mt-1">For Gmail, use an App Password</p></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>From Email *</Label><Input value={settings.fromEmail} onChange={e => setSettings(s => ({ ...s, fromEmail: e.target.value }))} /></div>
          <div><Label>From Name</Label><Input value={settings.fromName} onChange={e => setSettings(s => ({ ...s, fromName: e.target.value }))} /></div>
        </div>
        <div className="flex items-center gap-2"><Switch checked={settings.secure} onCheckedChange={v => setSettings(s => ({ ...s, secure: v }))} /><Label>Use SSL/TLS (port 465)</Label></div>
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">{saving ? "Saving..." : "Save Settings"}</Button>
          <Button onClick={handleTest} variant="outline" disabled={testing}>{testing ? "Testing..." : "Send Test Email"}</Button>
        </div>
      </div>
      <div className="bg-secondary rounded-lg p-4 sm:p-6 max-w-lg">
        <h3 className="font-heading font-semibold mb-2">Common SMTP Settings</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Gmail:</strong> smtp.gmail.com / Port 587 / TLS off or Port 465 / SSL on</p>
          <p><strong>Outlook:</strong> smtp-mail.outlook.com / Port 587</p>
          <p><strong>Zoho:</strong> smtp.zoho.com / Port 587</p>
        </div>
      </div>
    </div>
  );
}

function EmailTemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplates | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<keyof EmailTemplates>("applicationConfirmation");

  useEffect(() => { getEmailTemplates().then(setTemplates); }, []);

  if (!templates) return <p>Loading...</p>;

  const templateInfo: Record<keyof EmailTemplates, { label: string; description: string; variables: string }> = {
    applicationConfirmation: {
      label: "Application Confirmation",
      description: "Sent automatically when someone submits an application.",
      variables: "{{fullName}}, {{jobTitle}}, {{email}}, {{phone}}, {{visaStatus}}, {{nationality}}, {{currentLocation}}",
    },
    applicationSuccess: {
      label: "Application Success",
      description: "Sent when admin marks an application as successful.",
      variables: "{{fullName}}, {{jobTitle}}, {{email}}",
    },
    offerLetter: {
      label: "Offer Letter",
      description: "Default offer letter template sent to successful candidates.",
      variables: "{{fullName}}, {{jobTitle}}, {{email}}, {{date}}",
    },
    contactConfirmation: {
      label: "Contact Confirmation",
      description: "Sent when someone submits the contact form.",
      variables: "{{name}}",
    },
  };

  const handleSave = async () => {
    setSaving(true);
    await saveEmailTemplates(templates);
    setSaving(false);
    toast({ title: "Email templates saved!" });
  };

  const info = templateInfo[activeTemplate];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Email Templates</h1>
      <p className="text-muted-foreground text-sm">Customise the HTML email templates sent to applicants and contacts. Use template variables for dynamic content.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(templateInfo) as (keyof EmailTemplates)[]).map(key => (
          <button key={key} onClick={() => setActiveTemplate(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTemplate === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {templateInfo[key].label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="font-heading font-semibold text-lg">{info.label}</h2>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </div>
        <div className="bg-muted rounded-md p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Available Variables:</p>
          <p className="text-xs font-mono text-foreground">{info.variables}</p>
        </div>
        <Textarea
          value={templates[activeTemplate]}
          onChange={e => setTemplates(t => t ? { ...t, [activeTemplate]: e.target.value } : t)}
          rows={16}
          className="font-mono text-xs"
          placeholder="Enter HTML template..."
        />
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? "Saving..." : "Save All Templates"}
        </Button>
      </div>
    </div>
  );
}

function SiteSettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>({ siteName: 'CareHomeStaffUK' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSiteSettings().then(setSettings); }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveSiteSettings(settings);
    setSaving(false);
    toast({ title: "Site settings saved!" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Site Settings</h1>
      <p className="text-muted-foreground text-sm">Configure your website name and general settings.</p>
      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4 max-w-lg">
        <div>
          <Label>Website Name</Label>
          <Input value={settings.siteName} onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))} placeholder="CareHomeStaffUK" />
          <p className="text-xs text-muted-foreground mt-1">This name appears in emails and across the site.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

function SEOTab() {
  const [settings, setSettings] = useState<SEOSettings>({ searchConsoleId: '', searchKeywords: [] });
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => { getSEOSettings().then(setSettings); }, []);

  const handleSave = async () => { await saveSEOSettings(settings); toast({ title: "SEO settings saved!" }); };
  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw) return;
    if (settings.searchKeywords.includes(kw)) { toast({ title: "Keyword already exists", variant: "destructive" }); return; }
    setSettings(s => ({ ...s, searchKeywords: [...s.searchKeywords, kw] }));
    setNewKeyword("");
  };
  const removeKeyword = (kw: string) => { setSettings(s => ({ ...s, searchKeywords: s.searchKeywords.filter(k => k !== kw) })); };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">SEO & Search Console</h1>
      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-6 max-w-2xl">
        <div>
          <Label>Google Search Console Verification ID</Label>
          <Input value={settings.searchConsoleId} onChange={e => setSettings(s => ({ ...s, searchConsoleId: e.target.value }))} placeholder="e.g. abc123xyz..." />
        </div>
        <div>
          <Label>Target Keywords</Label>
          <div className="flex gap-2 mb-3 mt-2">
            <Input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder="e.g. care home jobs UK" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())} />
            <Button type="button" onClick={addKeyword} className="bg-primary text-primary-foreground shrink-0">Add</Button>
          </div>
          {settings.searchKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.searchKeywords.map(kw => (
                <span key={kw} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-md">
                  {kw}<button onClick={() => removeKeyword(kw)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save SEO Settings</Button>
      </div>
    </div>
  );
}

export default AdminDashboard;
