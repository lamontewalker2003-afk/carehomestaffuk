import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  isAdminLoggedIn, adminLogout, getApplications, deleteApplication, getJobs,
  getTelegramSettings, saveTelegramSettings, addJob, deleteJob, updateJob,
  getSEOSettings, saveSEOSettings, getSMTPSettings, saveSMTPSettings,
  getSiteSettings, saveSiteSettings, getEmailTemplates, saveEmailTemplates,
  updateApplicationStatus, markOfferLetterSent, sendEmail,
  buildApplicationSuccessEmail, buildOfferLetterEmail,
  getBankAccounts, saveBankAccounts,
  getInvoiceTemplate, saveInvoiceTemplate, defaultInvoiceTemplate,
  buildInvoiceEmail, generateInvoiceNumber, markInvoiceSent,
  getCustomEmailTemplates, saveCustomEmailTemplates, buildCustomEmail,
  getEmailLogsForEmail, groupApplicationsByEmail,
} from "@/lib/store";
import type {
  Application, Job, TelegramSettings, SEOSettings, SMTPSettings, SiteSettings,
  EmailTemplates, EmailTemplateFields, BankAccount, BankCustomField, InvoiceTemplate, InvoiceBlock, InvoiceLineItem,
  CustomEmailTemplate, EmailLogEntry, ApplicantGroup,
} from "@/lib/store";
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
  FileCheck, CheckCircle, XCircle, Clock, Award, Landmark, Receipt, Star,
  MessageSquare, Copy as CopyIcon, Users, History, ChevronDown, ChevronRight,
} from "lucide-react";

type Tab = "dashboard" | "applications" | "jobs" | "telegram" | "smtp" | "email-templates" | "custom-emails" | "seo" | "site-settings" | "banks" | "invoice-template";

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
    { id: "banks" as Tab, label: "Bank Accounts", icon: Landmark },
    { id: "invoice-template" as Tab, label: "Invoice Template", icon: Receipt },
    { id: "telegram" as Tab, label: "Telegram", icon: Send },
    { id: "smtp" as Tab, label: "SMTP / Email", icon: Mail },
    { id: "email-templates" as Tab, label: "Email Templates", icon: FileCheck },
    { id: "custom-emails" as Tab, label: "Custom Emails", icon: MessageSquare },
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
          {tab === "banks" && <BanksTab />}
          {tab === "invoice-template" && <InvoiceTemplateTab />}
          {tab === "telegram" && <TelegramTab />}
          {tab === "smtp" && <SMTPTab />}
          {tab === "email-templates" && <EmailTemplatesTab />}
          {tab === "custom-emails" && <CustomEmailsTab />}
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
  const [phoneSearch, setPhoneSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupByEmail, setGroupByEmail] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sendingEmail, setSendingEmail] = useState(false);
  const [offerOverrides, setOfferOverrides] = useState<Partial<EmailTemplateFields>>({});
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceTemplate, setInvoiceTemplateState] = useState<InvoiceTemplate | null>(null);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [invoiceLineItems, setInvoiceLineItems] = useState<InvoiceLineItem[]>([]);
  const [invoiceBankId, setInvoiceBankId] = useState<string>("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  // ---- Custom email state ----
  const [customTemplates, setCustomTemplates] = useState<CustomEmailTemplate[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTemplateId, setCustomTemplateId] = useState<string>("");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState(""); // free-form body, one paragraph per line
  const [customHeading, setCustomHeading] = useState("");
  const [customSignoff, setCustomSignoff] = useState("Kind regards,");
  const [customSignature, setCustomSignature] = useState("");

  useEffect(() => {
    getApplications().then(setApps);
    getInvoiceTemplate().then(t => { setInvoiceTemplateState(t); setInvoiceLineItems(t.defaultLineItems); });
    getBankAccounts().then(b => { setBanks(b); const def = b.find(x => x.isDefault) || b[0]; if (def) setInvoiceBankId(def.id); });
    getCustomEmailTemplates().then(setCustomTemplates);
  }, []);

  // When admin picks a saved template, prefill the editable fields
  const loadCustomTemplate = (id: string) => {
    setCustomTemplateId(id);
    const tpl = customTemplates.find(t => t.id === id);
    if (!tpl) return;
    setCustomSubject(tpl.subject);
    setCustomHeading(tpl.fields.heading || "");
    setCustomMessage([
      tpl.fields.intro,
      ...(tpl.fields.paragraphs || []),
      ...(tpl.fields.highlight ? [`> ${tpl.fields.highlight}`] : []),
    ].filter(Boolean).join('\n\n'));
    setCustomSignoff(tpl.fields.signoff || "Kind regards,");
    setCustomSignature(tpl.fields.signature || "");
  };

  const refresh = async () => {
    const updated = await getApplications();
    setApps(updated);
    if (selected) setSelected(updated.find(a => a.id === selected.id) || null);
  };

  const filteredApps = apps.filter(app => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (phoneSearch.trim()) {
      // Normalise: match any digits the admin types, optionally starting with +
      const target = phoneSearch.trim().replace(/\s|-/g, '');
      const phone = (app.phone || '').replace(/\s|-/g, '');
      if (!phone.includes(target)) return false;
    }
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
        const sent = await sendEmail(app.email, "Congratulations — Your Application Was Successful!", html, { applicationId: app.id, kind: 'success' });
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
    const sent = await sendEmail(app.email, "Offer of Employment", html, { applicationId: app.id, kind: 'offer_letter' });
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

  const handleSendInvoice = async (app: Application) => {
    if (banks.length === 0) {
      toast({ title: "Add at least one bank account first (Bank Accounts tab)", variant: "destructive" });
      return;
    }
    if (invoiceLineItems.length === 0 || invoiceLineItems.every(li => !li.description.trim() || !li.amount)) {
      toast({ title: "Add at least one line item with a description and amount", variant: "destructive" });
      return;
    }
    setSendingEmail(true);
    const tpl = invoiceTemplate || defaultInvoiceTemplate;
    const invoiceNumber = await generateInvoiceNumber(tpl.invoicePrefix || "INV-");
    const html = await buildInvoiceEmail(app, invoiceNumber, {
      lineItems: invoiceLineItems,
      bankAccountId: invoiceBankId,
      notes: invoiceNotes,
    });
    const sent = await sendEmail(app.email, `${tpl.title} ${invoiceNumber}`, html, { applicationId: app.id, kind: 'invoice' });
    if (sent) {
      await markInvoiceSent(app.id, invoiceNumber);
      toast({ title: `Invoice ${invoiceNumber} sent to ${app.email}` });
    } else {
      toast({ title: "Failed to send invoice. Check SMTP settings.", variant: "destructive" });
    }
    setSendingEmail(false);
    setShowInvoiceForm(false);
    setInvoiceNotes("");
    await refresh();
  };

  const handleSendCustomEmail = async (app: Application) => {
    if (!customSubject.trim()) {
      toast({ title: "Subject is required", variant: "destructive" });
      return;
    }
    if (!customMessage.trim()) {
      toast({ title: "Message body is required", variant: "destructive" });
      return;
    }
    // Parse the textarea: lines starting with "> " become the highlight box,
    // first non-highlight line is the intro, the rest are paragraphs.
    const lines = customMessage.split('\n').map(l => l.trimEnd());
    const blocks: string[] = [];
    let buffer: string[] = [];
    for (const line of lines) {
      if (line === '') {
        if (buffer.length) { blocks.push(buffer.join('\n')); buffer = []; }
      } else {
        buffer.push(line);
      }
    }
    if (buffer.length) blocks.push(buffer.join('\n'));

    const highlightBlock = blocks.find(b => b.startsWith('> '));
    const highlight = highlightBlock ? highlightBlock.replace(/^>\s?/, '').replace(/\n>\s?/g, '\n') : '';
    const nonHighlight = blocks.filter(b => !b.startsWith('> '));
    const intro = nonHighlight[0] || '';
    const paragraphs = nonHighlight.slice(1);

    // Either a saved template (with overrides) or a fully ad-hoc one.
    const saved = customTemplates.find(t => t.id === customTemplateId);
    const baseTpl: CustomEmailTemplate = saved || {
      id: 'adhoc',
      name: 'Ad-hoc',
      subject: customSubject,
      fields: {
        heading: customHeading,
        intro,
        paragraphs,
        highlight,
        signoff: customSignoff,
        signature: customSignature,
      },
    };

    setSendingEmail(true);
    const { subject, html } = await buildCustomEmail(app, baseTpl, {
      subject: customSubject,
      fields: {
        heading: customHeading,
        intro,
        paragraphs,
        highlight,
        signoff: customSignoff,
        signature: customSignature,
      },
    });
    const sent = await sendEmail(app.email, subject, html, { applicationId: app.id, kind: 'custom' });
    setSendingEmail(false);
    if (sent) {
      toast({ title: `Email sent to ${app.email}` });
      setShowCustomForm(false);
      setCustomTemplateId("");
      setCustomSubject("");
      setCustomMessage("");
      setCustomHeading("");
    } else {
      toast({ title: "Failed to send email. Check SMTP settings.", variant: "destructive" });
    }
  };

  const updateLineItem = (id: string, updates: Partial<InvoiceLineItem>) => {
    setInvoiceLineItems(items => items.map(li => li.id === id ? { ...li, ...updates } : li));
  };
  const addLineItem = () => {
    setInvoiceLineItems(items => [...items, { id: `li-${Date.now()}`, description: "", amount: 0 }]);
  };
  const removeLineItem = (id: string) => {
    setInvoiceLineItems(items => items.filter(li => li.id !== id));
  };
  const invoiceTotal = invoiceLineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Applications ({apps.length})</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, email, role..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="relative sm:w-40">
            <Input placeholder="+44, +234..." value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)} className="pl-3 font-mono" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="successful">Successful</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button
            type="button"
            variant={groupByEmail ? "default" : "outline"}
            size="sm"
            onClick={() => setGroupByEmail(g => !g)}
            className={groupByEmail ? "bg-primary text-primary-foreground" : ""}
          >
            <Users className="h-4 w-4 mr-1" />
            {groupByEmail ? "Grouped" : "Group by email"}
          </Button>
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

            {/* Invoice section */}
            {selected.status === 'successful' && (
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-semibold text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" /> Invoice
                  </h4>
                  {selected.invoiceSent && selected.invoiceNumber && (
                    <span className="text-xs text-primary font-medium">
                      ✓ {selected.invoiceNumber} sent {selected.invoiceSentAt ? new Date(selected.invoiceSentAt).toLocaleDateString() : ''}
                    </span>
                  )}
                </div>
                {!showInvoiceForm ? (
                  <Button size="sm" onClick={() => setShowInvoiceForm(true)} className="bg-primary text-primary-foreground">
                    <Mail className="h-4 w-4 mr-1" /> {selected.invoiceSent ? 'Resend Invoice' : 'Send Invoice'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {banks.length === 0 ? (
                      <p className="text-xs text-destructive">⚠ Add a bank account in the Bank Accounts tab first.</p>
                    ) : (
                      <div>
                        <Label className="text-xs">Bank account</Label>
                        <select value={invoiceBankId} onChange={e => setInvoiceBankId(e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                          {banks.map(b => (
                            <option key={b.id} value={b.id}>{b.label || b.bankName} {b.isDefault ? '(default)' : ''}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs">Line items</Label>
                      <div className="space-y-2 mt-1">
                        {invoiceLineItems.map(li => (
                          <div key={li.id} className="flex gap-2">
                            <Input value={li.description} onChange={e => updateLineItem(li.id, { description: e.target.value })} placeholder="Description" className="flex-1" />
                            <Input type="number" step="0.01" value={li.amount} onChange={e => updateLineItem(li.id, { amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" className="w-28" />
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeLineItem(li.id)}><X className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={addLineItem} className="mt-2">
                        <Plus className="h-3 w-3 mr-1" /> Add line item
                      </Button>
                      <p className="text-xs text-right mt-2 font-semibold">
                        Total: {invoiceTemplate?.currencySymbol || '£'}{invoiceTotal.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Notes (optional, shown on invoice)</Label>
                      <Textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} rows={2} placeholder="Any special note for this invoice..." />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSendInvoice(selected)} disabled={sendingEmail || banks.length === 0} className="bg-primary text-primary-foreground">
                        {sendingEmail ? 'Sending...' : 'Send Invoice'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowInvoiceForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Email section — always available */}
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-semibold text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Send Custom Email
                </h4>
                <span className="text-xs text-muted-foreground">{customTemplates.length} saved template{customTemplates.length === 1 ? '' : 's'}</span>
              </div>
              {!showCustomForm ? (
                <Button size="sm" onClick={() => { setShowCustomForm(true); if (!customSignature && customTemplates[0]) setCustomSignature(customTemplates[0].fields.signature); }} className="bg-primary text-primary-foreground">
                  <Mail className="h-4 w-4 mr-1" /> Compose Email
                </Button>
              ) : (
                <div className="space-y-3">
                  {customTemplates.length > 0 && (
                    <div>
                      <Label className="text-xs">Start from a saved template (optional)</Label>
                      <select value={customTemplateId} onChange={e => loadCustomTemplate(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">— Write a new message from scratch —</option>
                        {customTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Manage saved templates in the <strong>Custom Emails</strong> tab.
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Subject</Label>
                    <Input value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="e.g. Interview invitation — {{jobTitle}}" />
                  </div>
                  <div>
                    <Label className="text-xs">Heading <span className="text-muted-foreground font-normal">(optional, big H2 at top)</span></Label>
                    <Input value={customHeading} onChange={e => setCustomHeading(e.target.value)} placeholder="e.g. You're invited to an interview" />
                  </div>
                  <div>
                    <Label className="text-xs">Message</Label>
                    <Textarea
                      value={customMessage}
                      onChange={e => setCustomMessage(e.target.value)}
                      rows={10}
                      placeholder={"Dear {{fullName}},\n\nWrite your message here. Separate paragraphs with a blank line.\n\n> Lines starting with '>' become a highlighted callout box.\n\nUse variables like {{jobTitle}}, {{siteName}}, {{date}}."}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Variables: {'{{fullName}}, {{firstName}}, {{jobTitle}}, {{email}}, {{phone}}, {{nationality}}, {{currentLocation}}, {{visaStatus}}, {{siteName}}, {{date}}'} — separate paragraphs with a blank line — start a line with <code>&gt;</code> for a highlight box.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Sign-off</Label>
                      <Input value={customSignoff} onChange={e => setCustomSignoff(e.target.value)} placeholder="Kind regards," />
                    </div>
                    <div>
                      <Label className="text-xs">Signature</Label>
                      <Input value={customSignature} onChange={e => setCustomSignature(e.target.value)} placeholder="The {{siteName}} Team" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSendCustomEmail(selected)} disabled={sendingEmail} className="bg-primary text-primary-foreground">
                      {sendingEmail ? 'Sending...' : `Send to ${selected.email}`}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowCustomForm(false); setCustomTemplateId(""); setCustomSubject(""); setCustomMessage(""); setCustomHeading(""); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Email history (audit trail for this applicant by email) */}
            <EmailHistoryPanel email={selected.email} />
          </div>
        </div>
      ) : filteredApps.length === 0 ? (
        <p className="text-muted-foreground">{search || phoneSearch || statusFilter !== "all" ? "No applications match your filters." : "No applications received yet."}</p>
      ) : groupByEmail ? (
        <GroupedApplicationsView
          groups={groupApplicationsByEmail(filteredApps)}
          expanded={expandedGroups}
          toggle={(email) => setExpandedGroups(s => {
            const n = new Set(s); n.has(email) ? n.delete(email) : n.add(email); return n;
          })}
          onSelect={setSelected}
          onDelete={handleDelete}
        />
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
      variables: "{{fullName}}, {{jobTitle}}, {{email}}, {{phone}}, {{visaStatus}}, {{nationality}}, {{currentLocation}}, {{siteName}}",
    },
    applicationSuccess: {
      label: "Application Success",
      description: "Sent when admin marks an application as successful.",
      variables: "{{fullName}}, {{jobTitle}}, {{email}}, {{siteName}}",
    },
    offerLetter: {
      label: "Offer Letter",
      description: "Default offer letter sent to successful candidates.",
      variables: "{{fullName}}, {{jobTitle}}, {{email}}, {{date}}, {{siteName}}",
    },
    contactConfirmation: {
      label: "Contact Confirmation",
      description: "Sent when someone submits the contact form.",
      variables: "{{name}}, {{siteName}}, {{contactPhone}}, {{contactEmail}}",
    },
  };

  const handleSave = async () => {
    setSaving(true);
    await saveEmailTemplates(templates);
    setSaving(false);
    toast({ title: "Email templates saved!" });
  };

  const info = templateInfo[activeTemplate];
  const current = templates[activeTemplate];

  const updateField = <K extends keyof EmailTemplateFields>(field: K, value: EmailTemplateFields[K]) => {
    setTemplates(t => t ? { ...t, [activeTemplate]: { ...t[activeTemplate], [field]: value } } : t);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Email Templates</h1>
      <p className="text-muted-foreground text-sm">Edit your emails using simple fields — no HTML needed. The header, footer and styling are added automatically. Use variables like {'{{fullName}}'} to personalise the message.</p>

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
          <p className="text-xs font-medium text-muted-foreground mb-1">Available Variables (paste into any field):</p>
          <p className="text-xs font-mono text-foreground break-all">{info.variables}</p>
        </div>

        <div>
          <Label>Heading</Label>
          <Input value={current.heading} onChange={e => updateField('heading', e.target.value)} placeholder="Application Received" />
        </div>

        <div>
          <Label>Opening line / greeting</Label>
          <Textarea value={current.intro} onChange={e => updateField('intro', e.target.value)} rows={2} placeholder="Hello {{fullName}}, thank you for applying..." />
        </div>

        <div>
          <Label>Body paragraphs <span className="text-xs text-muted-foreground font-normal">(one paragraph per line)</span></Label>
          <Textarea
            value={(current.paragraphs || []).join('\n')}
            onChange={e => updateField('paragraphs', e.target.value.split('\n').filter(Boolean))}
            rows={6}
            placeholder="Write each paragraph on its own line..."
          />
          <p className="text-xs text-muted-foreground mt-1">Each line becomes one paragraph in the email.</p>
        </div>

        <div>
          <Label>Highlight box <span className="text-xs text-muted-foreground font-normal">(optional — appears as a callout)</span></Label>
          <Textarea value={current.highlight || ''} onChange={e => updateField('highlight', e.target.value)} rows={2} placeholder="Welcome to the team..." />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Sign-off</Label>
            <Input value={current.signoff} onChange={e => updateField('signoff', e.target.value)} placeholder="Kind regards," />
          </div>
          <div>
            <Label>Signature</Label>
            <Input value={current.signature} onChange={e => updateField('signature', e.target.value)} placeholder="The Recruitment Team" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? "Saving..." : "Save All Templates"}
        </Button>
      </div>
    </div>
  );
}

function SiteSettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSiteSettings().then(setSettings); }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveSiteSettings(settings);
    setSaving(false);
    toast({ title: "Site settings saved!" });
  };

  const update = <K extends keyof SiteSettings>(field: K, value: SiteSettings[K]) => {
    setSettings(s => ({ ...s, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Site Settings</h1>
      <p className="text-muted-foreground text-sm">Control your website name, contact details and the floating WhatsApp button.</p>

      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-5 max-w-2xl">
        <h2 className="font-heading font-semibold flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Brand</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Website Name</Label>
            <Input value={settings.siteName} onChange={e => update('siteName', e.target.value)} placeholder="CareHomeStaffUK" />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input value={settings.tagline} onChange={e => update('tagline', e.target.value)} placeholder="Health & Social Care Recruitment" />
          </div>
        </div>
        <div>
          <Label>Footer Description</Label>
          <Textarea value={settings.footerTagline} onChange={e => update('footerTagline', e.target.value)} rows={2} />
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4 max-w-2xl">
        <h2 className="font-heading font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Footer Copyright</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Company name (in © line)</Label>
            <Input value={settings.footerCompanyName} onChange={e => update('footerCompanyName', e.target.value)} placeholder="CareHomeStaffUK" />
          </div>
          <div>
            <Label>Year <span className="text-xs text-muted-foreground font-normal">(blank = auto current year)</span></Label>
            <Input value={settings.footerYear} onChange={e => update('footerYear', e.target.value)} placeholder={new Date().getFullYear().toString()} />
          </div>
        </div>
        <div>
          <Label>Extra footer note <span className="text-xs text-muted-foreground font-normal">(optional, e.g. company number, regulator)</span></Label>
          <Input value={settings.footerExtraNote} onChange={e => update('footerExtraNote', e.target.value)} placeholder="Registered in England & Wales" />
        </div>
        <div className="bg-muted rounded-md p-3 text-xs">
          <span className="text-muted-foreground">Preview:</span>{' '}
          © {settings.footerYear || new Date().getFullYear()} {settings.footerCompanyName || settings.siteName}. All rights reserved.
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4 max-w-2xl">
        <h2 className="font-heading font-semibold flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Contact Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Contact Email</Label>
            <Input type="email" value={settings.contactEmail} onChange={e => update('contactEmail', e.target.value)} />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input value={settings.contactPhone} onChange={e => update('contactPhone', e.target.value)} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={settings.contactAddress} onChange={e => update('contactAddress', e.target.value)} />
          </div>
          <div>
            <Label>Office Hours</Label>
            <Input value={settings.officeHours} onChange={e => update('officeHours', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4 max-w-2xl">
        <h2 className="font-heading font-semibold flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-[10px]">W</span>
          WhatsApp Floating Button
        </h2>
        <div>
          <Label>WhatsApp Number <span className="text-xs text-muted-foreground font-normal">(country code + number, no spaces or +)</span></Label>
          <Input value={settings.whatsappNumber} onChange={e => update('whatsappNumber', e.target.value.replace(/[^\d]/g, ''))} placeholder="441234567890" />
          <p className="text-xs text-muted-foreground mt-1">Leave empty to hide the floating button.</p>
        </div>
        <div>
          <Label>Pre-filled Message</Label>
          <Textarea value={settings.whatsappMessage} onChange={e => update('whatsappMessage', e.target.value)} rows={2} placeholder="Hello! I'd like to enquire..." />
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-3 max-w-2xl">
        <h2 className="font-heading font-semibold flex items-center gap-2"><Server className="h-4 w-4 text-primary" /> Self-Hosting / Standalone</h2>
        <p className="text-sm text-muted-foreground">
          Want to run this app on your own Supabase project? Use the standalone setup wizard to configure your own database connection, run the consolidated migration, and set admin credentials — all from the browser, no terminal needed.
        </p>
        <Button asChild variant="outline">
          <Link to="/setup">Open Standalone Setup Wizard →</Link>
        </Button>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
        {saving ? "Saving..." : "Save All Settings"}
      </Button>
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

// ============================================================
// BANK ACCOUNTS TAB — manage multiple UK bank accounts
// ============================================================
function BanksTab() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { getBankAccounts().then(a => { setAccounts(a); setLoaded(true); }); }, []);

  const addAccount = () => {
    const newAcc: BankAccount = {
      id: crypto.randomUUID(),
      label: 'New Account',
      bankName: '',
      accountName: '',
      sortCode: '',
      accountNumber: '',
      iban: '',
      swift: '',
      reference: '',
      customFields: [],
      isDefault: accounts.length === 0,
    };
    setAccounts(a => [...a, newAcc]);
  };

  const updateAccount = (id: string, patch: Partial<BankAccount>) => {
    setAccounts(a => a.map(acc => acc.id === id ? { ...acc, ...patch } : acc));
  };

  const addCustomField = (accId: string) => {
    const f: BankCustomField = { id: crypto.randomUUID(), label: '', value: '', monospace: false };
    setAccounts(a => a.map(acc => acc.id === accId ? { ...acc, customFields: [...(acc.customFields || []), f] } : acc));
  };
  const updateCustomField = (accId: string, fId: string, patch: Partial<BankCustomField>) => {
    setAccounts(a => a.map(acc => acc.id === accId
      ? { ...acc, customFields: (acc.customFields || []).map(f => f.id === fId ? { ...f, ...patch } : f) }
      : acc
    ));
  };
  const removeCustomField = (accId: string, fId: string) => {
    setAccounts(a => a.map(acc => acc.id === accId
      ? { ...acc, customFields: (acc.customFields || []).filter(f => f.id !== fId) }
      : acc
    ));
  };

  const removeAccount = (id: string) => {
    if (!confirm('Delete this bank account?')) return;
    setAccounts(a => a.filter(acc => acc.id !== id));
  };

  const setDefault = (id: string) => {
    setAccounts(a => a.map(acc => ({ ...acc, isDefault: acc.id === id })));
  };

  const handleSave = async () => {
    // Flexible validation: require label + accountName, AND at least one identifying detail
    // (sort code+account number, OR IBAN, OR a populated custom field).
    for (const a of accounts) {
      if (!a.label || !a.accountName) {
        toast({ title: `"${a.label || 'Account'}" needs a label and account name`, variant: "destructive" });
        return;
      }
      const hasUk = a.sortCode && a.accountNumber;
      const hasIban = !!a.iban;
      const hasCustom = (a.customFields || []).some(f => f.label && f.value);
      if (!hasUk && !hasIban && !hasCustom) {
        toast({ title: `"${a.label}" needs sort code + account number, an IBAN, or a custom field`, variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    await saveBankAccounts(accounts);
    const fresh = await getBankAccounts();
    setAccounts(fresh);
    setSaving(false);
    toast({ title: "Bank accounts saved!" });
  };

  if (!loaded) return <p>Loading...</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Bank Accounts</h1>
          <p className="text-muted-foreground text-sm">Manage UK bank accounts used on invoices. Mark one as default.</p>
        </div>
        <Button onClick={addAccount} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center">
          <Landmark className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No bank accounts yet. Add one to enable invoicing.</p>
          <Button onClick={addAccount} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" /> Add Your First Account
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-primary" />
                  <h2 className="font-heading font-semibold">{acc.label || 'Untitled Account'}</h2>
                  {acc.isDefault && (
                    <Badge className="bg-primary text-primary-foreground"><Star className="h-3 w-3 mr-1" /> Default</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {!acc.isDefault && (
                    <Button size="sm" variant="outline" onClick={() => setDefault(acc.id)}>
                      <Star className="h-3 w-3 mr-1" /> Set Default
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => removeAccount(acc.id)} className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Label *</Label>
                  <Input value={acc.label} onChange={e => updateAccount(acc.id, { label: e.target.value })} placeholder="Main GBP Account" />
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input value={acc.bankName || ''} onChange={e => updateAccount(acc.id, { bankName: e.target.value })} placeholder="Barclays Bank PLC (optional)" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Account Name *</Label>
                  <Input value={acc.accountName} onChange={e => updateAccount(acc.id, { accountName: e.target.value })} placeholder="Adrian Bolocan / Company Ltd" />
                </div>
                <div>
                  <Label>Sort Code</Label>
                  <Input value={acc.sortCode || ''} onChange={e => updateAccount(acc.id, { sortCode: e.target.value })} placeholder="04-00-03 or 040003" />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input value={acc.accountNumber || ''} onChange={e => updateAccount(acc.id, { accountNumber: e.target.value })} placeholder="88679349" />
                </div>
                <div>
                  <Label>IBAN</Label>
                  <Input value={acc.iban || ''} onChange={e => updateAccount(acc.id, { iban: e.target.value })} placeholder="GB29 NWBK 6016 1331 9268 19" />
                </div>
                <div>
                  <Label>SWIFT / BIC</Label>
                  <Input value={acc.swift || ''} onChange={e => updateAccount(acc.id, { swift: e.target.value })} placeholder="BARCGB22" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Payment Reference Instructions</Label>
                  <Input value={acc.reference || ''} onChange={e => updateAccount(acc.id, { reference: e.target.value })} placeholder="Use invoice number as reference" />
                </div>
              </div>

              {/* Custom fields — admin can add anything (Roll number, Routing, Building Society Ref, etc.) */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <Label className="text-sm font-semibold">Custom Fields</Label>
                    <p className="text-xs text-muted-foreground">Add any extra detail that should appear on the invoice (e.g. Roll number, Routing, BSB).</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addCustomField(acc.id)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Field
                  </Button>
                </div>
                {(acc.customFields || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No custom fields.</p>
                ) : (
                  <div className="space-y-2">
                    {(acc.customFields || []).map(f => (
                      <div key={f.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-muted/30 p-3 rounded-md">
                        <div className="sm:col-span-4">
                          <Label className="text-xs">Field Label</Label>
                          <Input value={f.label} onChange={e => updateCustomField(acc.id, f.id, { label: e.target.value })} placeholder="Roll number" />
                        </div>
                        <div className="sm:col-span-6">
                          <Label className="text-xs">Value</Label>
                          <Input value={f.value} onChange={e => updateCustomField(acc.id, f.id, { value: e.target.value })} placeholder="123456789" />
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-between gap-2">
                          <label className="flex items-center gap-1 text-xs cursor-pointer" title="Render in monospace (best for numbers/codes)">
                            <input
                              type="checkbox"
                              checked={!!f.monospace}
                              onChange={e => updateCustomField(acc.id, f.id, { monospace: e.target.checked })}
                            />
                            <span>123</span>
                          </label>
                          <Button size="sm" variant="ghost" onClick={() => removeCustomField(acc.id, f.id)} className="text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? "Saving..." : "Save All Accounts"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// INVOICE TEMPLATE TAB — dynamic blocks + line items + branding
// ============================================================
function InvoiceTemplateTab() {
  const [tmpl, setTmpl] = useState<InvoiceTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getInvoiceTemplate().then(setTmpl); }, []);

  if (!tmpl) return <p>Loading...</p>;

  const update = (patch: Partial<InvoiceTemplate>) => setTmpl(t => t ? { ...t, ...patch } : t);

  const addBlock = (which: 'introBlocks' | 'outroBlocks') => {
    const newBlock: InvoiceBlock = { id: crypto.randomUUID(), heading: '', body: '' };
    update({ [which]: [...tmpl[which], newBlock] } as Partial<InvoiceTemplate>);
  };
  const updateBlock = (which: 'introBlocks' | 'outroBlocks', id: string, patch: Partial<InvoiceBlock>) => {
    update({ [which]: tmpl[which].map(b => b.id === id ? { ...b, ...patch } : b) } as Partial<InvoiceTemplate>);
  };
  const removeBlock = (which: 'introBlocks' | 'outroBlocks', id: string) => {
    update({ [which]: tmpl[which].filter(b => b.id !== id) } as Partial<InvoiceTemplate>);
  };

  const addLineItem = () => {
    const newItem: InvoiceLineItem = { id: crypto.randomUUID(), description: '', amount: 0 };
    update({ defaultLineItems: [...tmpl.defaultLineItems, newItem] });
  };
  const updateLineItem = (id: string, patch: Partial<InvoiceLineItem>) => {
    update({ defaultLineItems: tmpl.defaultLineItems.map(li => li.id === id ? { ...li, ...patch } : li) });
  };
  const removeLineItem = (id: string) => {
    update({ defaultLineItems: tmpl.defaultLineItems.filter(li => li.id !== id) });
  };

  const handleSave = async () => {
    setSaving(true);
    await saveInvoiceTemplate(tmpl);
    setSaving(false);
    toast({ title: "Invoice template saved!" });
  };

  const handleReset = async () => {
    if (!confirm('Reset to default template? Your changes will be lost.')) return;
    setTmpl(defaultInvoiceTemplate);
    toast({ title: "Reset to defaults — click Save to apply." });
  };

  const renderBlocks = (which: 'introBlocks' | 'outroBlocks', label: string) => (
    <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold">{label}</h2>
        <Button size="sm" variant="outline" onClick={() => addBlock(which)}>
          <Plus className="h-3 w-3 mr-1" /> Add Block
        </Button>
      </div>
      {tmpl[which].length === 0 && <p className="text-sm text-muted-foreground">No blocks yet.</p>}
      {tmpl[which].map((block, i) => (
        <div key={block.id} className="border rounded-md p-3 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Block {i + 1}</span>
            <Button size="sm" variant="ghost" onClick={() => removeBlock(which, block.id)} className="text-destructive h-7">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Input
            placeholder="Heading (optional)"
            value={block.heading || ''}
            onChange={e => updateBlock(which, block.id, { heading: e.target.value })}
          />
          <Textarea
            placeholder="Body text. Use {{fullName}}, {{jobTitle}}, {{invoiceNumber}}, {{invoiceDate}}, {{dueDate}}, {{paymentTermsDays}}, {{siteName}}"
            value={block.body}
            rows={3}
            onChange={e => updateBlock(which, block.id, { body: e.target.value })}
          />
        </div>
      ))}
    </div>
  );

  const total = tmpl.defaultLineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Invoice Template</h1>
          <p className="text-muted-foreground text-sm">Customize the invoice sent to applicants. Bank details are pulled from the default account.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>Reset</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /><h2 className="font-heading font-semibold">Branding & Settings</h2></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Invoice Title *</Label>
            <Input value={tmpl.title} onChange={e => update({ title: e.target.value })} />
          </div>
          <div>
            <Label>Invoice Number Prefix *</Label>
            <Input value={tmpl.invoicePrefix} onChange={e => update({ invoicePrefix: e.target.value })} placeholder="INV-" />
          </div>
          <div>
            <Label>Currency Code</Label>
            <Input value={tmpl.currency} onChange={e => update({ currency: e.target.value.toUpperCase() })} placeholder="GBP" />
          </div>
          <div>
            <Label>Currency Symbol</Label>
            <Input value={tmpl.currencySymbol} onChange={e => update({ currencySymbol: e.target.value })} placeholder="£" />
          </div>
          <div>
            <Label>Payment Terms (days)</Label>
            <Input type="number" value={tmpl.paymentTermsDays} onChange={e => update({ paymentTermsDays: parseInt(e.target.value) || 14 })} />
          </div>
        </div>
      </div>

      {/* Intro blocks */}
      {renderBlocks('introBlocks', 'Intro Blocks (above line items)')}

      {/* Default Line items */}
      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold">Default Line Items</h2>
          <Button size="sm" variant="outline" onClick={addLineItem}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">These appear by default when sending an invoice. Admin can edit per-application.</p>
        {tmpl.defaultLineItems.length === 0 && <p className="text-sm text-muted-foreground">No line items.</p>}
        {tmpl.defaultLineItems.map(li => (
          <div key={li.id} className="grid grid-cols-[1fr_120px_auto] gap-2 items-end border rounded-md p-3 bg-muted/30">
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={li.description} onChange={e => updateLineItem(li.id, { description: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Amount ({tmpl.currencySymbol})</Label>
              <Input type="number" step="0.01" value={li.amount} onChange={e => updateLineItem(li.id, { amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <Button size="sm" variant="ghost" onClick={() => removeLineItem(li.id)} className="text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <div className="flex justify-end pt-2 border-t">
          <p className="font-semibold">Total: {tmpl.currencySymbol}{total.toFixed(2)}</p>
        </div>
      </div>

      {/* Outro blocks */}
      {renderBlocks('outroBlocks', 'Outro Blocks (below line items — terms, thanks)')}

      {/* Signoff */}
      <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
        <h2 className="font-heading font-semibold">Sign-off</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Sign-off line</Label>
            <Input value={tmpl.signoff} onChange={e => update({ signoff: e.target.value })} placeholder="Kind regards," />
          </div>
          <div>
            <Label>Signature</Label>
            <Input value={tmpl.signature} onChange={e => update({ signature: e.target.value })} placeholder="The {{siteName}} Team" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Custom Emails tab — manage reusable templates the admin can pick from
// when sending an ad-hoc email to any application.
// ----------------------------------------------------------------------
function CustomEmailsTab() {
  const [templates, setTemplates] = useState<CustomEmailTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CustomEmailTemplate>(emptyTemplate());

  useEffect(() => { getCustomEmailTemplates().then(setTemplates); }, []);

  function emptyTemplate(): CustomEmailTemplate {
    return {
      id: `tpl-${Date.now()}`,
      name: '',
      subject: '',
      fields: { heading: '', intro: '', paragraphs: [], highlight: '', signoff: 'Kind regards,', signature: 'The {{siteName}} Team' },
    };
  }

  const startEdit = (t: CustomEmailTemplate) => {
    setForm({ ...t, fields: { ...t.fields, paragraphs: [...(t.fields.paragraphs || [])] } });
    setEditingId(t.id);
    setShowForm(true);
  };

  const startNew = () => {
    setForm(emptyTemplate());
    setEditingId(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: 'Template name is required', variant: 'destructive' }); return; }
    if (!form.subject.trim()) { toast({ title: 'Subject is required', variant: 'destructive' }); return; }
    setSaving(true);
    const next = editingId
      ? templates.map(t => t.id === editingId ? form : t)
      : [...templates, form];
    await saveCustomEmailTemplates(next);
    setTemplates(next);
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    toast({ title: editingId ? 'Template updated' : 'Template created' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    const next = templates.filter(t => t.id !== id);
    await saveCustomEmailTemplates(next);
    setTemplates(next);
    toast({ title: 'Template deleted' });
  };

  const handleDuplicate = async (t: CustomEmailTemplate) => {
    const copy: CustomEmailTemplate = { ...t, id: `tpl-${Date.now()}`, name: `${t.name} (copy)` };
    const next = [...templates, copy];
    await saveCustomEmailTemplates(next);
    setTemplates(next);
    toast({ title: 'Template duplicated' });
  };

  const updateField = <K extends keyof EmailTemplateFields>(field: K, value: EmailTemplateFields[K]) => {
    setForm(f => ({ ...f, fields: { ...f.fields, [field]: value } }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Custom Email Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reusable email templates you can send to any application from the Applications tab.
            Useful for interview invites, document requests, follow-ups, anything.
          </p>
        </div>
        {!showForm && (
          <Button onClick={startNew} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> New Template
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-lg">
              {editingId ? 'Edit Template' : 'New Template'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="bg-muted rounded-md p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Available variables (paste into any field):</p>
            <p className="text-xs font-mono break-all">
              {'{{fullName}}, {{firstName}}, {{jobTitle}}, {{email}}, {{phone}}, {{nationality}}, {{currentLocation}}, {{visaStatus}}, {{siteName}}, {{contactEmail}}, {{contactPhone}}, {{date}}'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Template name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Interview Invitation" />
              <p className="text-xs text-muted-foreground mt-1">Internal name — only the admin sees this.</p>
            </div>
            <div>
              <Label>Email subject <span className="text-destructive">*</span></Label>
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Interview invitation — {{jobTitle}}" />
            </div>
          </div>

          <div>
            <Label>Heading <span className="text-xs text-muted-foreground font-normal">(big H2 at the top)</span></Label>
            <Input value={form.fields.heading} onChange={e => updateField('heading', e.target.value)} placeholder="You're invited to an interview" />
          </div>

          <div>
            <Label>Opening line / greeting</Label>
            <Textarea value={form.fields.intro} onChange={e => updateField('intro', e.target.value)} rows={2} placeholder="Dear {{fullName}}, thank you for applying for the {{jobTitle}} position." />
          </div>

          <div>
            <Label>Body paragraphs <span className="text-xs text-muted-foreground font-normal">(one per line)</span></Label>
            <Textarea
              value={(form.fields.paragraphs || []).join('\n')}
              onChange={e => updateField('paragraphs', e.target.value.split('\n').filter(Boolean))}
              rows={6}
              placeholder="One paragraph per line..."
            />
          </div>

          <div>
            <Label>Highlight box <span className="text-xs text-muted-foreground font-normal">(optional callout)</span></Label>
            <Textarea value={form.fields.highlight || ''} onChange={e => updateField('highlight', e.target.value)} rows={2} placeholder="Tip: have a copy of your CV ready..." />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Sign-off</Label>
              <Input value={form.fields.signoff} onChange={e => updateField('signoff', e.target.value)} placeholder="Kind regards," />
            </div>
            <div>
              <Label>Signature</Label>
              <Input value={form.fields.signature} onChange={e => updateField('signature', e.target.value)} placeholder="The {{siteName}} Team" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? 'Saving...' : (editingId ? 'Update Template' : 'Create Template')}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No custom templates yet. Click <strong>New Template</strong> to create one.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map(t => (
            <div key={t.id} className="bg-card rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-heading font-semibold">{t.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  <span className="font-medium">Subject:</span> {t.subject}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t.fields.intro}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDuplicate(t)} title="Duplicate">
                  <CopyIcon className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
