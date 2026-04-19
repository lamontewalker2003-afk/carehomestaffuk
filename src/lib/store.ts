import { supabase } from "@/integrations/supabase/client";

export interface Job {
  id: string;
  title: string;
  socCode: string;
  location: string;
  type: string;
  salary: string;
  hourlyRate: string;
  sponsorshipFee: string;
  description: string;
  requirements: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  currentLocation: string;
  visaStatus: string;
  experience: string;
  qualifications: string;
  coverLetter: string;
  cvFileName: string;
  submittedAt: string;
  status: string;
  offerLetterSent: boolean;
  offerLetterSentAt: string | null;
  invoiceSent: boolean;
  invoiceSentAt: string | null;
  invoiceNumber: string | null;
}

export interface TelegramSettings {
  botToken: string;
  chatId: string;
}

export interface SMTPSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

export interface SEOSettings {
  searchConsoleId: string;
  searchKeywords: string[];
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  officeHours: string;
  whatsappNumber: string; // international format with no +, e.g. 441234567890
  whatsappMessage: string;
  footerTagline: string;
  // Footer copyright controls
  footerCompanyName: string;   // shown in © line
  footerYear: string;          // empty = auto current year
  footerExtraNote: string;     // optional additional line under copyright
}

// A single template = an editable email built from friendly fields,
// not raw HTML the admin has to write.
export interface EmailTemplateFields {
  heading: string;        // Big H2
  intro: string;          // Greeting / opening line
  paragraphs: string[];   // Body paragraphs
  highlight?: string;     // Optional highlighted callout box
  signoff: string;        // Closing line
  signature: string;      // Sender name(s)
}

export interface EmailTemplates {
  applicationConfirmation: EmailTemplateFields;
  applicationSuccess: EmailTemplateFields;
  offerLetter: EmailTemplateFields;
  contactConfirmation: EmailTemplateFields;
}

// ---- BANK ACCOUNTS (UK + flexible custom fields) ----
export interface BankCustomField {
  id: string;
  label: string;          // e.g. "Roll number", "Building Society Ref", "Routing"
  value: string;
  monospace?: boolean;    // render in monospace on invoice (good for numbers/codes)
}
export interface BankAccount {
  id: string;             // local uuid
  label: string;          // e.g. "Main GBP Account"
  bankName?: string;
  accountName: string;    // payee name — always required
  sortCode?: string;      // formatted xx-xx-xx
  accountNumber?: string; // 8 digits
  iban?: string;
  swift?: string;         // BIC
  reference?: string;     // payment reference instructions
  customFields?: BankCustomField[]; // free-form extras (e.g. Roll number, Routing)
  isDefault: boolean;
}

// ---- INVOICE TEMPLATE ----
// Dynamic blocks (admin can add/remove freely) PLUS standard fields.
export interface InvoiceBlock {
  id: string;
  heading?: string;       // optional small subheading
  body: string;           // paragraph text — supports {{variables}}
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;         // in selected currency
}

export interface InvoiceTemplate {
  // Branding / standard fields
  title: string;          // e.g. "Sponsorship Invoice"
  invoicePrefix: string;  // e.g. "INV-"
  currency: string;       // e.g. "GBP", "USD"
  currencySymbol: string; // e.g. "£"
  paymentTermsDays: number;
  // Dynamic blocks (paragraphs)
  introBlocks: InvoiceBlock[];   // shown above the line items
  outroBlocks: InvoiceBlock[];   // shown below the line items (terms, thanks)
  // Default line items used when sending — admin can edit per-invoice too
  defaultLineItems: InvoiceLineItem[];
  // Footer
  signoff: string;
  signature: string;
}

// ---- Helper to map DB row to Job interface ----
function mapDbJob(row: any): Job {
  return {
    id: row.id, title: row.title, socCode: row.soc_code, location: row.location,
    type: row.type, salary: row.salary, hourlyRate: row.hourly_rate,
    sponsorshipFee: row.sponsorship_fee, description: row.description,
    requirements: row.requirements || [], isActive: row.is_active, createdAt: row.created_at,
  };
}

function mapDbApp(row: any): Application {
  return {
    id: row.id, jobId: row.job_id || '', jobTitle: row.job_title, fullName: row.full_name,
    email: row.email, phone: row.phone, nationality: row.nationality,
    currentLocation: row.current_location, visaStatus: row.visa_status,
    experience: row.experience, qualifications: row.qualifications,
    coverLetter: row.cover_letter, cvFileName: row.cv_file_name, submittedAt: row.submitted_at,
    status: row.status || 'pending', offerLetterSent: row.offer_letter_sent || false,
    offerLetterSentAt: row.offer_letter_sent_at || null,
    invoiceSent: row.invoice_sent || false,
    invoiceSentAt: row.invoice_sent_at || null,
    invoiceNumber: row.invoice_number || null,
  };
}

// ---- JOBS ----
export async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error fetching jobs:', error); return []; }
  return (data || []).map(mapDbJob);
}

export async function addJob(job: Omit<Job, 'id' | 'createdAt'>): Promise<Job | null> {
  const { data, error } = await supabase.from('jobs').insert({
    title: job.title, soc_code: job.socCode, location: job.location, type: job.type,
    salary: job.salary, hourly_rate: job.hourlyRate, sponsorship_fee: job.sponsorshipFee,
    description: job.description, requirements: job.requirements, is_active: job.isActive,
  }).select().single();
  if (error) { console.error('Error adding job:', error); return null; }
  return mapDbJob(data);
}

export async function updateJob(id: string, updates: Partial<Job>) {
  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.socCode !== undefined) dbUpdates.soc_code = updates.socCode;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.salary !== undefined) dbUpdates.salary = updates.salary;
  if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
  if (updates.sponsorshipFee !== undefined) dbUpdates.sponsorship_fee = updates.sponsorshipFee;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.requirements !== undefined) dbUpdates.requirements = updates.requirements;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  const { error } = await supabase.from('jobs').update(dbUpdates).eq('id', id);
  if (error) console.error('Error updating job:', error);
}

export async function deleteJob(id: string) {
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) console.error('Error deleting job:', error);
}

// ---- APPLICATIONS ----
export async function getApplications(): Promise<Application[]> {
  const { data, error } = await supabase.from('applications').select('*').order('submitted_at', { ascending: false });
  if (error) { console.error('Error fetching applications:', error); return []; }
  return (data || []).map(mapDbApp);
}

export async function saveApplication(app: Omit<Application, 'id' | 'submittedAt' | 'status' | 'offerLetterSent' | 'offerLetterSentAt' | 'invoiceSent' | 'invoiceSentAt' | 'invoiceNumber'>): Promise<Application | null> {
  const { data, error } = await supabase.from('applications').insert({
    job_id: app.jobId || null, job_title: app.jobTitle, full_name: app.fullName,
    email: app.email, phone: app.phone, nationality: app.nationality,
    current_location: app.currentLocation, visa_status: app.visaStatus,
    experience: app.experience, qualifications: app.qualifications,
    cover_letter: app.coverLetter, cv_file_name: app.cvFileName,
  }).select().single();
  if (error) { console.error('Error saving application:', error); return null; }
  return mapDbApp(data);
}

export async function updateApplicationStatus(id: string, status: string) {
  const { error } = await supabase.from('applications').update({ status }).eq('id', id);
  if (error) console.error('Error updating application status:', error);
}

export async function markOfferLetterSent(id: string) {
  const { error } = await supabase.from('applications').update({
    offer_letter_sent: true, offer_letter_sent_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) console.error('Error marking offer letter sent:', error);
}

export async function markInvoiceSent(id: string, invoiceNumber: string) {
  const { error } = await supabase.from('applications').update({
    invoice_sent: true,
    invoice_sent_at: new Date().toISOString(),
    invoice_number: invoiceNumber,
  }).eq('id', id);
  if (error) console.error('Error marking invoice sent:', error);
}

export async function deleteApplication(id: string) {
  const { error } = await supabase.from('applications').delete().eq('id', id);
  if (error) console.error('Error deleting application:', error);
}

// ---- CONTACT ----
export async function saveContactSubmission(contact: { name: string; email: string; subject: string; message: string }) {
  const { error } = await supabase.from('contact_submissions').insert(contact);
  if (error) console.error('Error saving contact:', error);
}

// ---- ADMIN SETTINGS ----
async function getSetting(key: string): Promise<any> {
  const { data, error } = await supabase.from('admin_settings').select('value').eq('key', key).maybeSingle();
  if (error) console.error(`Error fetching setting ${key}:`, error);
  return data?.value ?? null;
}

async function saveSetting(key: string, value: any) {
  const { error } = await supabase.from('admin_settings').upsert({ key, value }, { onConflict: 'key' });
  if (error) console.error(`Error saving setting ${key}:`, error);
}

export async function getTelegramSettings(): Promise<TelegramSettings> {
  const value = await getSetting('telegram');
  return value || { botToken: '', chatId: '' };
}
export async function saveTelegramSettings(settings: TelegramSettings) { await saveSetting('telegram', settings); }

export async function getSMTPSettings(): Promise<SMTPSettings> {
  const value = await getSetting('smtp');
  return value || { host: '', port: 587, username: '', password: '', fromEmail: '', fromName: 'CareHomeStaffUK', secure: false };
}
export async function saveSMTPSettings(settings: SMTPSettings) { await saveSetting('smtp', settings); }

export async function getSEOSettings(): Promise<SEOSettings> {
  const value = await getSetting('seo');
  return value || { searchConsoleId: '', searchKeywords: [] };
}
export async function saveSEOSettings(settings: SEOSettings) { await saveSetting('seo', settings); }

export const defaultSiteSettings: SiteSettings = {
  siteName: 'CareHomeStaffUK',
  tagline: 'Health & Social Care Recruitment',
  contactEmail: 'info@carehomestaffuk.com',
  contactPhone: '+44 (0) 123 456 7890',
  contactAddress: 'London, United Kingdom',
  officeHours: 'Mon–Fri 9:00 AM – 5:30 PM',
  whatsappNumber: '441234567890',
  whatsappMessage: 'Hello! I would like to enquire about UK care work opportunities.',
  footerTagline: 'Connecting care homes with compassionate, qualified healthcare professionals across the United Kingdom. Visa sponsorship available.',
  footerCompanyName: 'CareHomeStaffUK',
  footerYear: '',
  footerExtraNote: '',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const value = await getSetting('site_settings');
  return { ...defaultSiteSettings, ...(value || {}) };
}
export async function saveSiteSettings(settings: SiteSettings) { await saveSetting('site_settings', settings); }

export async function getEmailTemplates(): Promise<EmailTemplates> {
  const value = await getSetting('email_templates');
  return {
    applicationConfirmation: { ...defaultApplicationConfirmationTemplate, ...(value?.applicationConfirmation || {}) },
    applicationSuccess: { ...defaultApplicationSuccessTemplate, ...(value?.applicationSuccess || {}) },
    offerLetter: { ...defaultOfferLetterTemplate, ...(value?.offerLetter || {}) },
    contactConfirmation: { ...defaultContactConfirmationTemplate, ...(value?.contactConfirmation || {}) },
  };
}
export async function saveEmailTemplates(templates: EmailTemplates) { await saveSetting('email_templates', templates); }

// ---- BANK ACCOUNTS ----
export async function getBankAccounts(): Promise<BankAccount[]> {
  const value = await getSetting('bank_accounts');
  return Array.isArray(value) ? value : [];
}
export async function saveBankAccounts(accounts: BankAccount[]) {
  // Ensure exactly one default if there's at least one account
  let normalized = accounts;
  if (accounts.length > 0 && !accounts.some(a => a.isDefault)) {
    normalized = accounts.map((a, i) => ({ ...a, isDefault: i === 0 }));
  } else if (accounts.filter(a => a.isDefault).length > 1) {
    let used = false;
    normalized = accounts.map(a => {
      if (a.isDefault && !used) { used = true; return a; }
      return { ...a, isDefault: false };
    });
  }
  await saveSetting('bank_accounts', normalized);
}

// ---- INVOICE TEMPLATE ----
export const defaultInvoiceTemplate: InvoiceTemplate = {
  title: 'Sponsorship Service Invoice',
  invoicePrefix: 'INV-',
  currency: 'GBP',
  currencySymbol: '£',
  paymentTermsDays: 14,
  introBlocks: [
    {
      id: 'b1',
      heading: '',
      body: 'Dear {{fullName}}, thank you for accepting our offer for the {{jobTitle}} position. Please find your invoice for the agreed sponsorship and recruitment services below.',
    },
  ],
  outroBlocks: [
    {
      id: 'b2',
      heading: 'Payment Terms',
      body: 'Payment is due within {{paymentTermsDays}} days of the invoice date ({{invoiceDate}}). Please use your invoice number {{invoiceNumber}} as the payment reference.',
    },
    {
      id: 'b3',
      heading: 'Important',
      body: 'Once payment is received, we will issue your Certificate of Sponsorship (CoS) and begin the visa application process on your behalf.',
    },
  ],
  defaultLineItems: [
    { id: 'li1', description: 'Certificate of Sponsorship (CoS) processing', amount: 199 },
    { id: 'li2', description: 'Recruitment & placement service fee', amount: 800 },
  ],
  signoff: 'Kind regards,',
  signature: 'The {{siteName}} Finance Team',
};

export async function getInvoiceTemplate(): Promise<InvoiceTemplate> {
  const value = await getSetting('invoice_template');
  return { ...defaultInvoiceTemplate, ...(value || {}) };
}
export async function saveInvoiceTemplate(t: InvoiceTemplate) { await saveSetting('invoice_template', t); }

// ---- INVOICE NUMBER GENERATOR ----
export async function generateInvoiceNumber(prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('invoice_sent', true);
  const next = (count || 0) + 1;
  return `${prefix}${year}-${String(next).padStart(4, '0')}`;
}

// ---- INVOICE EMAIL BUILDER ----
export async function buildInvoiceEmail(
  app: Application,
  invoiceNumber: string,
  overrides?: { lineItems?: InvoiceLineItem[]; bankAccountId?: string; notes?: string },
): Promise<string> {
  const [template, banks, site] = await Promise.all([
    getInvoiceTemplate(),
    getBankAccounts(),
    getSiteSettings(),
  ]);

  const lineItems = overrides?.lineItems && overrides.lineItems.length > 0
    ? overrides.lineItems
    : template.defaultLineItems;

  const bank = overrides?.bankAccountId
    ? banks.find(b => b.id === overrides.bankAccountId)
    : banks.find(b => b.isDefault) || banks[0];

  const total = lineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);
  const invoiceDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dueDate = new Date(Date.now() + (template.paymentTermsDays || 14) * 86400000)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const vars: Record<string, string> = {
    fullName: app.fullName,
    jobTitle: app.jobTitle,
    email: app.email,
    siteName: site.siteName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    paymentTermsDays: String(template.paymentTermsDays),
    total: `${template.currencySymbol}${total.toFixed(2)}`,
  };

  const renderBlocks = (blocks: InvoiceBlock[]) => blocks.map(b => {
    const heading = b.heading ? `<h3 style="color:#1a3a3a;font-size:15px;margin:20px 0 8px;font-weight:600;">${escapeHtml(replaceVars(b.heading, vars))}</h3>` : '';
    const body = `<p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 12px;white-space:pre-wrap;">${escapeHtml(replaceVars(b.body, vars))}</p>`;
    return heading + body;
  }).join('\n');

  const lineItemsHtml = lineItems.map(li => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #eef2f0;color:#333;font-size:14px;">${escapeHtml(replaceVars(li.description, vars))}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #eef2f0;color:#333;font-size:14px;text-align:right;font-variant-numeric:tabular-nums;">${template.currencySymbol}${Number(li.amount).toFixed(2)}</td>
    </tr>`).join('');

  const bankHtml = bank ? `
    <div style="background:#f8faf9;border:1px solid #e8ede9;border-radius:8px;padding:18px 20px;margin:24px 0 8px;">
      <p style="color:#1a3a3a;font-size:13px;font-weight:700;margin:0 0 12px;letter-spacing:0.5px;text-transform:uppercase;">Payment Details</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;color:#333;">
        ${bank.bankName ? `<tr><td style="padding:4px 0;color:#888;width:40%;">Bank</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(bank.bankName)}</td></tr>` : ''}
        ${bank.accountName ? `<tr><td style="padding:4px 0;color:#888;">Account name</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(bank.accountName)}</td></tr>` : ''}
        ${bank.sortCode ? `<tr><td style="padding:4px 0;color:#888;">Sort code</td><td style="padding:4px 0;font-family:monospace;font-weight:600;">${escapeHtml(bank.sortCode)}</td></tr>` : ''}
        ${bank.accountNumber ? `<tr><td style="padding:4px 0;color:#888;">Account number</td><td style="padding:4px 0;font-family:monospace;font-weight:600;">${escapeHtml(bank.accountNumber)}</td></tr>` : ''}
        ${bank.iban ? `<tr><td style="padding:4px 0;color:#888;">IBAN</td><td style="padding:4px 0;font-family:monospace;font-weight:600;">${escapeHtml(bank.iban)}</td></tr>` : ''}
        ${bank.swift ? `<tr><td style="padding:4px 0;color:#888;">SWIFT/BIC</td><td style="padding:4px 0;font-family:monospace;font-weight:600;">${escapeHtml(bank.swift)}</td></tr>` : ''}
        ${(bank.customFields || []).filter(f => f.label && f.value).map(f => `<tr><td style="padding:4px 0;color:#888;">${escapeHtml(f.label)}</td><td style="padding:4px 0;font-weight:600;${f.monospace ? 'font-family:monospace;' : ''}">${escapeHtml(replaceVars(f.value, vars))}</td></tr>`).join('')}
        ${bank.reference ? `<tr><td style="padding:4px 0;color:#888;">Reference</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(replaceVars(bank.reference, vars))}</td></tr>` : `<tr><td style="padding:4px 0;color:#888;">Reference</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(invoiceNumber)}</td></tr>`}
      </table>
    </div>` : `<p style="color:#b00;font-size:13px;">⚠ No bank account configured. Add one in the admin panel.</p>`;

  const notesHtml = overrides?.notes
    ? `<div style="background:#fff8e6;border-left:4px solid #d4a843;border-radius:6px;padding:14px 18px;margin:18px 0;color:#5a4500;font-size:13px;line-height:1.6;">${escapeHtml(overrides.notes)}</div>`
    : '';

  const body = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin:0 0 24px;">
      <div>
        <h2 style="color:#1a3a3a;margin:0 0 4px;font-size:24px;">${escapeHtml(replaceVars(template.title, vars))}</h2>
        <p style="color:#888;margin:0;font-size:13px;">Issued ${escapeHtml(invoiceDate)} · Due ${escapeHtml(dueDate)}</p>
      </div>
      <div style="text-align:right;">
        <p style="color:#888;margin:0;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Invoice No.</p>
        <p style="color:#1a3a3a;margin:0;font-size:18px;font-weight:700;font-family:monospace;">${escapeHtml(invoiceNumber)}</p>
      </div>
    </div>

    <div style="background:#f8faf9;border-radius:8px;padding:14px 18px;margin:0 0 20px;font-size:13px;color:#333;">
      <p style="margin:0;color:#888;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">Billed to</p>
      <p style="margin:4px 0 0;font-weight:600;color:#1a3a3a;">${escapeHtml(app.fullName)}</p>
      <p style="margin:2px 0 0;color:#666;">${escapeHtml(app.email)}${app.phone ? ' · ' + escapeHtml(app.phone) : ''}</p>
    </div>

    ${renderBlocks(template.introBlocks || [])}

    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:18px 0 0;border:1px solid #eef2f0;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#1a3a3a;color:#fff;">
          <th style="padding:12px 16px;text-align:left;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;font-weight:600;">Description</th>
          <th style="padding:12px 16px;text-align:right;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;font-weight:600;">Amount</th>
        </tr>
      </thead>
      <tbody>${lineItemsHtml}</tbody>
      <tfoot>
        <tr style="background:#f8faf9;">
          <td style="padding:14px 16px;font-weight:700;color:#1a3a3a;font-size:15px;">Total Due</td>
          <td style="padding:14px 16px;text-align:right;font-weight:700;color:#1a3a3a;font-size:18px;font-variant-numeric:tabular-nums;">${template.currencySymbol}${total.toFixed(2)} ${escapeHtml(template.currency)}</td>
        </tr>
      </tfoot>
    </table>

    ${bankHtml}
    ${notesHtml}
    ${renderBlocks(template.outroBlocks || [])}

    <p style="color:#444;font-size:14px;margin:22px 0 6px;">${escapeHtml(replaceVars(template.signoff, vars))}</p>
    <p style="color:#1a3a3a;font-size:14px;font-weight:600;margin:0;">${escapeHtml(replaceVars(template.signature, vars))}</p>
  `;

  return wrapEmailTemplate(body, site);
}


// ---- TELEGRAM ----
export async function sendToTelegram(app: Application): Promise<boolean> {
  const message = `📋 <b>New Application Received</b>\n\n` +
    `<b>Position:</b> ${app.jobTitle}\n<b>Name:</b> ${app.fullName}\n` +
    `<b>Email:</b> ${app.email}\n<b>Phone:</b> ${app.phone}\n` +
    `<b>Nationality:</b> ${app.nationality}\n<b>Location:</b> ${app.currentLocation}\n` +
    `<b>Visa Status:</b> ${app.visaStatus}\n<b>Experience:</b> ${app.experience}\n` +
    `<b>Qualifications:</b> ${app.qualifications}\n\n<b>Cover Letter:</b>\n${app.coverLetter}`;
  try {
    const { data, error } = await supabase.functions.invoke('send-telegram', { body: { message } });
    if (error) { console.error('Telegram error:', error); return false; }
    return data?.success === true;
  } catch (e) { console.error('Telegram send failed:', e); return false; }
}

// ---- EMAIL ----
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', { body: { to, subject, html } });
    if (error) { console.error('Email error:', error); return false; }
    return data?.success === true;
  } catch (e) { console.error('Email send failed:', e); return false; }
}

// ---- ADMIN AUTH ----
import { getAdminCredentials } from './runtime-config';
const ADMIN_KEY = 'chsuk_admin_auth';
export function isAdminLoggedIn(): boolean { return localStorage.getItem(ADMIN_KEY) === 'true'; }
export async function adminLogin(username: string, password: string): Promise<boolean> {
  const creds = await getAdminCredentials();
  const match = creds.find(c => c.username === username && c.password === password);
  if (match) { localStorage.setItem(ADMIN_KEY, 'true'); return true; }
  return false;
}
export function adminLogout() { localStorage.removeItem(ADMIN_KEY); }

// ---- EMAIL TEMPLATE BUILDERS ----
function escapeHtml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function replaceVars(text: string, vars: Record<string, string>): string {
  let result = text || '';
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return result;
}

function renderTemplateBody(t: EmailTemplateFields, vars: Record<string, string>): string {
  const heading = replaceVars(t.heading, vars);
  const intro = replaceVars(t.intro, vars);
  const paragraphs = (t.paragraphs || []).map(p => replaceVars(p, vars)).filter(Boolean);
  const highlight = t.highlight ? replaceVars(t.highlight, vars) : '';
  const signoff = replaceVars(t.signoff, vars);
  const signature = replaceVars(t.signature, vars);

  const parts: string[] = [];
  if (heading) parts.push(`<h2 style="color:#1a3a3a;margin:0 0 16px;font-size:22px;">${escapeHtml(heading)}</h2>`);
  if (intro) parts.push(`<p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px;">${escapeHtml(intro)}</p>`);
  for (const p of paragraphs) {
    parts.push(`<p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 14px;">${escapeHtml(p)}</p>`);
  }
  if (highlight) {
    parts.push(`<div style="background:#f0f7f4;border-left:4px solid #1a3a3a;border-radius:6px;padding:16px 20px;margin:20px 0;color:#1a3a3a;font-size:14px;line-height:1.6;">${escapeHtml(highlight)}</div>`);
  }
  if (signoff) parts.push(`<p style="color:#444;font-size:14px;margin:20px 0 6px;">${escapeHtml(signoff)}</p>`);
  if (signature) parts.push(`<p style="color:#1a3a3a;font-size:14px;font-weight:600;margin:0;">${escapeHtml(signature)}</p>`);
  return parts.join('\n');
}

export async function buildApplicationConfirmationEmail(app: Application): Promise<string> {
  const templates = await getEmailTemplates();
  const site = await getSiteSettings();
  const vars = {
    fullName: app.fullName, jobTitle: app.jobTitle, email: app.email,
    phone: app.phone, visaStatus: app.visaStatus || 'Not specified',
    nationality: app.nationality, currentLocation: app.currentLocation,
    siteName: site.siteName,
  };
  return wrapEmailTemplate(renderTemplateBody(templates.applicationConfirmation, vars), site);
}

export async function buildApplicationSuccessEmail(app: Application): Promise<string> {
  const templates = await getEmailTemplates();
  const site = await getSiteSettings();
  const vars = { fullName: app.fullName, jobTitle: app.jobTitle, email: app.email, siteName: site.siteName };
  return wrapEmailTemplate(renderTemplateBody(templates.applicationSuccess, vars), site);
}

export async function buildOfferLetterEmail(app: Application, customFields?: Partial<EmailTemplateFields>): Promise<string> {
  const templates = await getEmailTemplates();
  const site = await getSiteSettings();
  const merged: EmailTemplateFields = { ...templates.offerLetter, ...(customFields || {}) };
  const vars = {
    fullName: app.fullName, jobTitle: app.jobTitle, email: app.email,
    siteName: site.siteName,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  };
  return wrapEmailTemplate(renderTemplateBody(merged, vars), site);
}

export async function buildContactConfirmationEmail(name: string): Promise<string> {
  const templates = await getEmailTemplates();
  const site = await getSiteSettings();
  const vars = { name, siteName: site.siteName, contactPhone: site.contactPhone, contactEmail: site.contactEmail };
  return wrapEmailTemplate(renderTemplateBody(templates.contactConfirmation, vars), site);
}

function wrapEmailTemplate(body: string, site: SiteSettings): string {
  const siteName = site.siteName || 'CareHomeStaffUK';
  const headerName = siteName.replace(/UK$/i, '<span style="color:#d4a843;">UK</span>');
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <tr><td style="background:#1a3a3a;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:-0.5px;">${headerName}</h1>
    <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:13px;letter-spacing:0.5px;">${escapeHtml(site.tagline || 'Health & Social Care Recruitment')}</p>
  </td></tr>
  <tr><td style="padding:36px 40px 32px;">${body}</td></tr>
  <tr><td style="background:#f8faf9;padding:24px 40px;border-top:1px solid #e8ede9;text-align:center;">
    <p style="color:#666;font-size:12px;margin:0 0 6px;">${escapeHtml(site.contactEmail)} · ${escapeHtml(site.contactPhone)}</p>
    <p style="color:#999;font-size:12px;margin:0;">${escapeHtml(siteName)} — ${escapeHtml(site.contactAddress)}</p>
    <p style="color:#bbb;font-size:11px;margin:8px 0 0;">© ${new Date().getFullYear()} ${escapeHtml(siteName)}. All rights reserved.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ---- DEFAULT TEMPLATES (friendly fields, not raw HTML) ----
const defaultApplicationConfirmationTemplate: EmailTemplateFields = {
  heading: 'Application Received',
  intro: 'Hello {{fullName}}, thank you for applying for the {{jobTitle}} position with {{siteName}}.',
  paragraphs: [
    'We have safely received your application and our recruitment team will review your details within 3–5 working days.',
    'If you are shortlisted, we will contact you by email or phone to arrange an initial telephone interview.',
    'Successful candidates will be matched with UK care home employers, and we will guide you through the visa sponsorship process where applicable.',
  ],
  highlight: 'Your application reference uses your email ({{email}}). Please reply to this email if any of your details change.',
  signoff: 'Kind regards,',
  signature: 'The {{siteName}} Recruitment Team',
};

const defaultApplicationSuccessTemplate: EmailTemplateFields = {
  heading: 'Congratulations, {{fullName}}!',
  intro: 'We are delighted to let you know that your application for the {{jobTitle}} role has been successful.',
  paragraphs: [
    'Our team has carefully reviewed your qualifications, experience and supporting information, and we would like to move forward with the next stage of your recruitment.',
    'You will shortly receive a formal offer of employment by email. Please prepare your identification documents, qualification certificates and two professional references.',
    'If you require Health & Care Worker visa sponsorship, our team will initiate the Certificate of Sponsorship (CoS) process once you have accepted the offer.',
  ],
  highlight: 'Welcome to the {{siteName}} family — we look forward to supporting you on your journey into UK care work.',
  signoff: 'With best wishes,',
  signature: 'The {{siteName}} Recruitment Team',
};

const defaultOfferLetterTemplate: EmailTemplateFields = {
  heading: 'Offer of Employment',
  intro: 'Date: {{date}}\nDear {{fullName}},',
  paragraphs: [
    'Following the successful review of your application, we are pleased to formally offer you the position of {{jobTitle}}.',
    'This offer is subject to the satisfactory completion of pre-employment checks, including an enhanced DBS check, right-to-work verification and two professional references.',
    'If you require visa sponsorship under the UK Health and Care Worker route, we will initiate the Certificate of Sponsorship (CoS) process upon your written acceptance of this offer.',
    'Please confirm your acceptance by replying to this email within 7 working days. A member of our team will then be in touch with full contract details and onboarding information.',
  ],
  highlight: 'We are excited to welcome you to {{siteName}} and look forward to supporting you in your new role.',
  signoff: 'Yours sincerely,',
  signature: 'The {{siteName}} Recruitment Team',
};

const defaultContactConfirmationTemplate: EmailTemplateFields = {
  heading: 'Thank you for getting in touch, {{name}}',
  intro: 'We have received your message and one of our advisors will get back to you within 24 working hours.',
  paragraphs: [
    'In the meantime, feel free to browse our latest care worker vacancies on the website, or read our visa information pages for guidance on the UK Health and Care Worker route.',
    'If your enquiry is urgent, please call us on {{contactPhone}} or email {{contactEmail}}.',
  ],
  signoff: 'Warm regards,',
  signature: 'The {{siteName}} Team',
};
