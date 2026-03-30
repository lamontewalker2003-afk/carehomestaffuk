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

// ---- Helper to map DB row to Job interface ----
function mapDbJob(row: any): Job {
  return {
    id: row.id,
    title: row.title,
    socCode: row.soc_code,
    location: row.location,
    type: row.type,
    salary: row.salary,
    hourlyRate: row.hourly_rate,
    sponsorshipFee: row.sponsorship_fee,
    description: row.description,
    requirements: row.requirements || [],
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapDbApp(row: any): Application {
  return {
    id: row.id,
    jobId: row.job_id || '',
    jobTitle: row.job_title,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    nationality: row.nationality,
    currentLocation: row.current_location,
    visaStatus: row.visa_status,
    experience: row.experience,
    qualifications: row.qualifications,
    coverLetter: row.cover_letter,
    cvFileName: row.cv_file_name,
    submittedAt: row.submitted_at,
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

export async function saveApplication(app: Omit<Application, 'id' | 'submittedAt'>): Promise<Application | null> {
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
  const { data } = await supabase.from('admin_settings').select('value').eq('key', key).single();
  return data?.value || null;
}

async function saveSetting(key: string, value: any) {
  const { error } = await supabase.from('admin_settings').upsert({ key, value }, { onConflict: 'key' });
  if (error) console.error(`Error saving setting ${key}:`, error);
}

export async function getTelegramSettings(): Promise<TelegramSettings> {
  const value = await getSetting('telegram');
  return value || { botToken: '', chatId: '' };
}

export async function saveTelegramSettings(settings: TelegramSettings) {
  await saveSetting('telegram', settings);
}

export async function getSMTPSettings(): Promise<SMTPSettings> {
  const value = await getSetting('smtp');
  return value || { host: '', port: 587, username: '', password: '', fromEmail: '', fromName: 'CareHomeStaffUK', secure: false };
}

export async function saveSMTPSettings(settings: SMTPSettings) {
  await saveSetting('smtp', settings);
}

export async function getSEOSettings(): Promise<SEOSettings> {
  const value = await getSetting('seo');
  return value || { searchConsoleId: '', searchKeywords: [] };
}

export async function saveSEOSettings(settings: SEOSettings) {
  await saveSetting('seo', settings);
}

// ---- TELEGRAM (via Edge Function) ----
export async function sendToTelegram(app: Application): Promise<boolean> {
  const message = `📋 <b>New Application Received</b>\n\n` +
    `<b>Position:</b> ${app.jobTitle}\n` +
    `<b>Name:</b> ${app.fullName}\n` +
    `<b>Email:</b> ${app.email}\n` +
    `<b>Phone:</b> ${app.phone}\n` +
    `<b>Nationality:</b> ${app.nationality}\n` +
    `<b>Location:</b> ${app.currentLocation}\n` +
    `<b>Visa Status:</b> ${app.visaStatus}\n` +
    `<b>Experience:</b> ${app.experience}\n` +
    `<b>Qualifications:</b> ${app.qualifications}\n\n` +
    `<b>Cover Letter:</b>\n${app.coverLetter}`;

  try {
    const { data, error } = await supabase.functions.invoke('send-telegram', {
      body: { message },
    });
    if (error) { console.error('Telegram error:', error); return false; }
    return data?.success === true;
  } catch (e) {
    console.error('Telegram send failed:', e);
    return false;
  }
}

// ---- EMAIL (via Edge Function) ----
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html },
    });
    if (error) { console.error('Email error:', error); return false; }
    return data?.success === true;
  } catch (e) {
    console.error('Email send failed:', e);
    return false;
  }
}

// ---- ADMIN AUTH (kept in localStorage for simplicity) ----
const ADMIN_KEY = 'chsuk_admin_auth';

export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

export function adminLogin(username: string, password: string): boolean {
  if (username === 'admin' && password === 'admin123') {
    localStorage.setItem(ADMIN_KEY, 'true');
    return true;
  }
  return false;
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_KEY);
}

// ---- APPLICATION CONFIRMATION EMAIL ----
export function buildApplicationConfirmationEmail(app: Application): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background:#1a3a3a;padding:30px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">CareHomeStaff<span style="color:#d4a843;">UK</span></h1>
    <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Health & Social Care Recruitment</p>
  </td></tr>
  <!-- Success Icon -->
  <tr><td style="padding:40px 40px 20px;text-align:center;">
    <div style="width:70px;height:70px;border-radius:50%;background:#e8f5e9;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
      <span style="font-size:36px;">✅</span>
    </div>
    <h2 style="color:#1a3a3a;margin:0 0 8px;font-size:22px;">Application Received!</h2>
    <p style="color:#666;font-size:14px;margin:0;">Thank you for applying, <strong>${app.fullName}</strong>.</p>
  </td></tr>
  <!-- Details -->
  <tr><td style="padding:0 40px 30px;">
    <table width="100%" style="background:#f8faf9;border-radius:6px;padding:20px;border:1px solid #e0e8e5;">
      <tr><td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Application Details</td></tr>
      <tr><td style="padding:8px 16px;border-top:1px solid #e0e8e5;">
        <strong style="color:#1a3a3a;">Position:</strong> <span style="color:#444;">${app.jobTitle}</span>
      </td></tr>
      <tr><td style="padding:8px 16px;border-top:1px solid #e0e8e5;">
        <strong style="color:#1a3a3a;">Email:</strong> <span style="color:#444;">${app.email}</span>
      </td></tr>
      <tr><td style="padding:8px 16px;border-top:1px solid #e0e8e5;">
        <strong style="color:#1a3a3a;">Phone:</strong> <span style="color:#444;">${app.phone}</span>
      </td></tr>
      <tr><td style="padding:8px 16px;border-top:1px solid #e0e8e5;">
        <strong style="color:#1a3a3a;">Visa Status:</strong> <span style="color:#444;">${app.visaStatus || 'Not specified'}</span>
      </td></tr>
    </table>
  </td></tr>
  <!-- Next Steps -->
  <tr><td style="padding:0 40px 30px;">
    <h3 style="color:#1a3a3a;font-size:16px;margin:0 0 12px;">What Happens Next?</h3>
    <table width="100%">
      <tr><td style="padding:6px 0;font-size:14px;color:#444;">
        <span style="color:#d4a843;font-weight:bold;margin-right:8px;">1.</span> Our recruitment team will review your application within <strong>3-5 working days</strong>.
      </td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#444;">
        <span style="color:#d4a843;font-weight:bold;margin-right:8px;">2.</span> If shortlisted, we'll contact you for an <strong>initial telephone interview</strong>.
      </td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#444;">
        <span style="color:#d4a843;font-weight:bold;margin-right:8px;">3.</span> Successful candidates will be matched with <strong>care home employers</strong>.
      </td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#444;">
        <span style="color:#d4a843;font-weight:bold;margin-right:8px;">4.</span> We'll support you through the <strong>visa sponsorship process</strong> if applicable.
      </td></tr>
    </table>
  </td></tr>
  <!-- CTA -->
  <tr><td style="padding:0 40px 30px;text-align:center;">
    <a href="https://carehomestaffuk.com/jobs" style="display:inline-block;background:#1a3a3a;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:bold;">Browse More Positions</a>
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#f8faf9;padding:24px 40px;border-top:1px solid #e0e8e5;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">CareHomeStaffUK — Trusted UK Care Recruitment</p>
    <p style="color:#999;font-size:11px;margin:8px 0 0;">This is an automated confirmation. Please do not reply to this email.</p>
    <p style="color:#bbb;font-size:11px;margin:8px 0 0;">© ${new Date().getFullYear()} CareHomeStaffUK. All rights reserved.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildContactConfirmationEmail(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:#1a3a3a;padding:30px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">CareHomeStaff<span style="color:#d4a843;">UK</span></h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:center;">
    <h2 style="color:#1a3a3a;margin:0 0 12px;">Thank You, ${name}!</h2>
    <p style="color:#666;font-size:14px;line-height:1.6;">We've received your message and our team will get back to you within <strong>24 hours</strong>.</p>
    <p style="color:#666;font-size:14px;margin-top:16px;">If your enquiry is urgent, please call us at <strong>+44 (0) 123 456 7890</strong>.</p>
  </td></tr>
  <tr><td style="background:#f8faf9;padding:20px 40px;text-align:center;border-top:1px solid #e0e8e5;">
    <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} CareHomeStaffUK. All rights reserved.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
