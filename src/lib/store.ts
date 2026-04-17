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
