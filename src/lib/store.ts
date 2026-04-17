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

export async function saveApplication(app: Omit<Application, 'id' | 'submittedAt' | 'status' | 'offerLetterSent' | 'offerLetterSentAt'>): Promise<Application | null> {
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
const ADMIN_KEY = 'chsuk_admin_auth';
export function isAdminLoggedIn(): boolean { return localStorage.getItem(ADMIN_KEY) === 'true'; }
export function adminLogin(username: string, password: string): boolean {
  if (username === 'admin' && password === 'admin123') { localStorage.setItem(ADMIN_KEY, 'true'); return true; }
  return false;
}
export function adminLogout() { localStorage.removeItem(ADMIN_KEY); }

// ---- EMAIL TEMPLATE BUILDERS ----
function replaceVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return result;
}

export async function buildApplicationConfirmationEmail(app: Application): Promise<string> {
  const templates = await getEmailTemplates();
  const siteSettings = await getSiteSettings();
  return wrapEmailTemplate(replaceVars(templates.applicationConfirmation, {
    fullName: app.fullName, jobTitle: app.jobTitle, email: app.email,
    phone: app.phone, visaStatus: app.visaStatus || 'Not specified',
    nationality: app.nationality, currentLocation: app.currentLocation,
  }), siteSettings.siteName);
}

export async function buildApplicationSuccessEmail(app: Application): Promise<string> {
  const templates = await getEmailTemplates();
  const siteSettings = await getSiteSettings();
  return wrapEmailTemplate(replaceVars(templates.applicationSuccess, {
    fullName: app.fullName, jobTitle: app.jobTitle, email: app.email,
  }), siteSettings.siteName);
}

export async function buildOfferLetterEmail(app: Application, customContent?: string): Promise<string> {
  const templates = await getEmailTemplates();
  const siteSettings = await getSiteSettings();
  const content = customContent || templates.offerLetter;
  return wrapEmailTemplate(replaceVars(content, {
    fullName: app.fullName, jobTitle: app.jobTitle, email: app.email,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  }), siteSettings.siteName);
}

export async function buildContactConfirmationEmail(name: string): Promise<string> {
  const templates = await getEmailTemplates();
  const siteSettings = await getSiteSettings();
  return wrapEmailTemplate(replaceVars(templates.contactConfirmation, { name }), siteSettings.siteName);
}

function wrapEmailTemplate(body: string, siteName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <tr><td style="background:#1a3a3a;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:-0.5px;">${siteName.replace(/UK$/i, '<span style="color:#d4a843;">UK</span>')}</h1>
    <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:13px;letter-spacing:0.5px;">Health & Social Care Recruitment</p>
  </td></tr>
  <tr><td style="padding:36px 40px 32px;">${body}</td></tr>
  <tr><td style="background:#f8faf9;padding:24px 40px;border-top:1px solid #e8ede9;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">${siteName} — Trusted UK Care Recruitment</p>
    <p style="color:#bbb;font-size:11px;margin:8px 0 0;">© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ---- DEFAULT TEMPLATES ----
const defaultApplicationConfirmationTemplate = `
<div style="text-align:center;margin-bottom:24px;">
  <div style="width:70px;height:70px;border-radius:50%;background:#e8f5e9;display:inline-flex;align-items:center;justify-content:center;">
    <span style="font-size:36px;">✅</span>
  </div>
</div>
<h2 style="color:#1a3a3a;margin:0 0 8px;font-size:22px;text-align:center;">Application Received!</h2>
<p style="color:#666;font-size:14px;text-align:center;margin:0 0 24px;">Thank you for applying, <strong>{{fullName}}</strong>.</p>
<table width="100%" style="background:#f8faf9;border-radius:8px;padding:20px;border:1px solid #e0e8e5;">
  <tr><td style="padding:8px 16px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Application Details</td></tr>
  <tr><td style="padding:8px 16px;border-top:1px solid #e0e8e5;"><strong style="color:#1a3a3a;">Position:</strong> <span style="color:#444;">{{jobTitle}}</span></td></tr>
  <tr><td style="padding:8px 16px;border-top:1px solid #e0e8e5;"><strong style="color:#1a3a3a;">Email:</strong> <span style="color:#444;">{{email}}</span></td></tr>
  <tr><td style="padding:8px 16px;border-top:1px solid #e0e8e5;"><strong style="color:#1a3a3a;">Phone:</strong> <span style="color:#444;">{{phone}}</span></td></tr>
  <tr><td style="padding:8px 16px;border-top:1px solid #e0e8e5;"><strong style="color:#1a3a3a;">Visa Status:</strong> <span style="color:#444;">{{visaStatus}}</span></td></tr>
</table>
<h3 style="color:#1a3a3a;font-size:16px;margin:24px 0 12px;">What Happens Next?</h3>
<table width="100%">
  <tr><td style="padding:6px 0;font-size:14px;color:#444;"><span style="color:#d4a843;font-weight:bold;margin-right:8px;">1.</span> Our team will review your application within <strong>3-5 working days</strong>.</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:#444;"><span style="color:#d4a843;font-weight:bold;margin-right:8px;">2.</span> If shortlisted, we'll contact you for an <strong>initial telephone interview</strong>.</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:#444;"><span style="color:#d4a843;font-weight:bold;margin-right:8px;">3.</span> Successful candidates will be matched with <strong>care home employers</strong>.</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:#444;"><span style="color:#d4a843;font-weight:bold;margin-right:8px;">4.</span> We'll support you through the <strong>visa sponsorship process</strong> if applicable.</td></tr>
</table>`;

const defaultApplicationSuccessTemplate = `
<div style="text-align:center;margin-bottom:24px;">
  <div style="width:70px;height:70px;border-radius:50%;background:#e8f5e9;display:inline-flex;align-items:center;justify-content:center;">
    <span style="font-size:36px;">🎉</span>
  </div>
</div>
<h2 style="color:#1a3a3a;margin:0 0 8px;font-size:22px;text-align:center;">Congratulations, {{fullName}}!</h2>
<p style="color:#666;font-size:14px;text-align:center;margin:0 0 24px;">Your application for <strong>{{jobTitle}}</strong> has been <span style="color:#2e7d32;font-weight:bold;">approved</span>!</p>
<div style="background:#e8f5e9;border-radius:8px;padding:20px;border-left:4px solid #2e7d32;margin-bottom:24px;">
  <p style="color:#1b5e20;font-size:14px;margin:0;">Our recruitment team has reviewed your qualifications and experience, and we're pleased to move forward with your application.</p>
</div>
<h3 style="color:#1a3a3a;font-size:16px;margin:0 0 12px;">Next Steps</h3>
<table width="100%">
  <tr><td style="padding:6px 0;font-size:14px;color:#444;"><span style="color:#d4a843;font-weight:bold;margin-right:8px;">1.</span> You will receive a formal <strong>offer letter</strong> shortly.</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:#444;"><span style="color:#d4a843;font-weight:bold;margin-right:8px;">2.</span> Please prepare your <strong>identification documents</strong> and references.</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:#444;"><span style="color:#d4a843;font-weight:bold;margin-right:8px;">3.</span> Our team will guide you through <strong>visa sponsorship</strong> if required.</td></tr>
</table>`;

const defaultOfferLetterTemplate = `
<p style="color:#444;font-size:14px;margin:0 0 8px;">Date: {{date}}</p>
<p style="color:#444;font-size:14px;margin:0 0 24px;">Dear <strong>{{fullName}}</strong>,</p>
<h2 style="color:#1a3a3a;margin:0 0 16px;font-size:20px;">Offer of Employment</h2>
<p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 16px;">
  We are pleased to offer you the position of <strong>{{jobTitle}}</strong> with our organisation. After careful review of your application, qualifications, and experience, we are confident you will be an excellent addition to our care team.
</p>
<div style="background:#f0f4f8;border-radius:8px;padding:20px;border-left:4px solid #1a3a3a;margin:20px 0;">
  <p style="color:#1a3a3a;font-size:14px;margin:0 0 8px;font-weight:600;">Position Details</p>
  <p style="color:#444;font-size:14px;margin:0;">Role: <strong>{{jobTitle}}</strong></p>
</div>
<p style="color:#444;font-size:14px;line-height:1.7;margin:16px 0;">
  This offer is subject to satisfactory completion of all pre-employment checks, including DBS checks, right to work verification, and professional references. If you require visa sponsorship, we will initiate the Certificate of Sponsorship (CoS) process upon your acceptance.
</p>
<p style="color:#444;font-size:14px;line-height:1.7;margin:16px 0;">
  Please confirm your acceptance by replying to this email within <strong>7 working days</strong>.
</p>
<p style="color:#444;font-size:14px;margin:24px 0 0;">Yours sincerely,<br/><strong>The Recruitment Team</strong></p>`;

const defaultContactConfirmationTemplate = `
<h2 style="color:#1a3a3a;margin:0 0 12px;text-align:center;">Thank You, {{name}}!</h2>
<p style="color:#666;font-size:14px;line-height:1.6;text-align:center;">We've received your message and our team will get back to you within <strong>24 hours</strong>.</p>
<p style="color:#666;font-size:14px;margin-top:16px;text-align:center;">If your enquiry is urgent, please call us at <strong>+44 (0) 123 456 7890</strong>.</p>`;
