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

const JOBS_KEY = 'chsuk_jobs';
const APPS_KEY = 'chsuk_applications';
const TELEGRAM_KEY = 'chsuk_telegram';
const ADMIN_KEY = 'chsuk_admin_auth';

const defaultJobs: Job[] = [
  {
    id: '1',
    title: 'Nursing Auxiliary / Assistant',
    socCode: '6131',
    location: 'London, UK',
    type: 'Full-time',
    salary: '£22,000 – £26,000',
    hourlyRate: '£11.50',
    sponsorshipFee: '£1,500',
    description: 'We are seeking dedicated nursing auxiliaries and assistants to support registered nurses in providing high-quality patient care within care home settings.',
    requirements: ['NVQ Level 2 in Health & Social Care', 'Experience in a care setting', 'Good communication skills', 'Right to work in the UK or valid visa'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Care Worker / Home Carer',
    socCode: '6135',
    location: 'Manchester, UK',
    type: 'Full-time',
    salary: '£21,000 – £25,000',
    hourlyRate: '£10.90',
    sponsorshipFee: '£1,500',
    description: 'Join our team as a care worker providing essential daily support to residents including personal care, meals, and companionship.',
    requirements: ['Care Certificate or equivalent', 'Compassionate nature', 'Ability to work shifts', 'DBS check required'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Senior Care Worker',
    socCode: '6136',
    location: 'Birmingham, UK',
    type: 'Full-time',
    salary: '£25,000 – £30,000',
    hourlyRate: '£13.00',
    sponsorshipFee: '£2,000',
    description: 'Lead a team of care workers, oversee care plans, and ensure residents receive the highest standard of care in our residential facility.',
    requirements: ['NVQ Level 3 in Health & Social Care', '2+ years supervisory experience', 'Medication administration training', 'Strong leadership skills'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export function getJobs(): Job[] {
  const stored = localStorage.getItem(JOBS_KEY);
  if (!stored) {
    localStorage.setItem(JOBS_KEY, JSON.stringify(defaultJobs));
    return defaultJobs;
  }
  const jobs = JSON.parse(stored) as Job[];
  // Migrate old jobs missing new fields
  return jobs.map(j => ({
    ...j,
    hourlyRate: j.hourlyRate || '',
    sponsorshipFee: j.sponsorshipFee || '',
    isActive: j.isActive !== undefined ? j.isActive : true,
  }));
}

export function saveJobs(jobs: Job[]) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export function addJob(job: Omit<Job, 'id' | 'createdAt'>): Job {
  const jobs = getJobs();
  const newJob: Job = { ...job, id: Date.now().toString(), createdAt: new Date().toISOString() };
  jobs.push(newJob);
  saveJobs(jobs);
  return newJob;
}

export function updateJob(id: string, updates: Partial<Job>) {
  const jobs = getJobs().map(j => j.id === id ? { ...j, ...updates } : j);
  saveJobs(jobs);
}

export function deleteJob(id: string) {
  const jobs = getJobs().filter(j => j.id !== id);
  saveJobs(jobs);
}

export function getApplications(): Application[] {
  const stored = localStorage.getItem(APPS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveApplication(app: Omit<Application, 'id' | 'submittedAt'>): Application {
  const apps = getApplications();
  const newApp: Application = { ...app, id: Date.now().toString(), submittedAt: new Date().toISOString() };
  apps.push(newApp);
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
  return newApp;
}

export function getTelegramSettings(): TelegramSettings {
  const stored = localStorage.getItem(TELEGRAM_KEY);
  return stored ? JSON.parse(stored) : { botToken: '', chatId: '' };
}

export function saveTelegramSettings(settings: TelegramSettings) {
  localStorage.setItem(TELEGRAM_KEY, JSON.stringify(settings));
}

export async function sendToTelegram(app: Application): Promise<boolean> {
  const settings = getTelegramSettings();
  if (!settings.botToken || !settings.chatId) return false;

  const message = `📋 *New Application Received*\n\n` +
    `*Position:* ${app.jobTitle}\n` +
    `*Name:* ${app.fullName}\n` +
    `*Email:* ${app.email}\n` +
    `*Phone:* ${app.phone}\n` +
    `*Nationality:* ${app.nationality}\n` +
    `*Location:* ${app.currentLocation}\n` +
    `*Visa Status:* ${app.visaStatus}\n` +
    `*Experience:* ${app.experience}\n` +
    `*Qualifications:* ${app.qualifications}\n\n` +
    `*Cover Letter:*\n${app.coverLetter}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

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
