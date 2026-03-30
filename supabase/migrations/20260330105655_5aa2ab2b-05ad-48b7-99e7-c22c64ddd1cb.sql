
-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  soc_code TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Full-time',
  salary TEXT NOT NULL DEFAULT '',
  hourly_rate TEXT NOT NULL DEFAULT '',
  sponsorship_fee TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  nationality TEXT NOT NULL DEFAULT '',
  current_location TEXT NOT NULL DEFAULT '',
  visa_status TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL DEFAULT '',
  qualifications TEXT NOT NULL DEFAULT '',
  cover_letter TEXT NOT NULL DEFAULT '',
  cv_file_name TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_settings table (key-value store for admin config)
CREATE TABLE public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Jobs: publicly readable, admin manages via app auth
CREATE POLICY "Anyone can read jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert jobs" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update jobs" ON public.jobs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete jobs" ON public.jobs FOR DELETE USING (true);

-- Applications: publicly insertable, admin reads via app auth
CREATE POLICY "Anyone can insert applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Anyone can delete applications" ON public.applications FOR DELETE USING (true);

-- Contact submissions: publicly insertable
CREATE POLICY "Anyone can insert contact submissions" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read contact submissions" ON public.contact_submissions FOR SELECT USING (true);

-- Admin settings: readable/writable (admin auth handled in app)
CREATE POLICY "Anyone can read admin settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can upsert admin settings" ON public.admin_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update admin settings" ON public.admin_settings FOR UPDATE USING (true);

-- Seed default jobs
INSERT INTO public.jobs (title, soc_code, location, type, salary, hourly_rate, sponsorship_fee, description, requirements, is_active) VALUES
('Nursing Auxiliary / Assistant', '6131', 'London, UK', 'Full-time', '£22,000 – £26,000', '£11.50', '£1,500', 'We are seeking dedicated nursing auxiliaries and assistants to support registered nurses in providing high-quality patient care within care home settings.', ARRAY['NVQ Level 2 in Health & Social Care', 'Experience in a care setting', 'Good communication skills', 'Right to work in the UK or valid visa'], true),
('Care Worker / Home Carer', '6135', 'Manchester, UK', 'Full-time', '£21,000 – £25,000', '£10.90', '£1,500', 'Join our team as a care worker providing essential daily support to residents including personal care, meals, and companionship.', ARRAY['Care Certificate or equivalent', 'Compassionate nature', 'Ability to work shifts', 'DBS check required'], true),
('Senior Care Worker', '6136', 'Birmingham, UK', 'Full-time', '£25,000 – £30,000', '£13.00', '£2,000', 'Lead a team of care workers, oversee care plans, and ensure residents receive the highest standard of care in our residential facility.', ARRAY['NVQ Level 3 in Health & Social Care', '2+ years supervisory experience', 'Medication administration training', 'Strong leadership skills'], true);

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
