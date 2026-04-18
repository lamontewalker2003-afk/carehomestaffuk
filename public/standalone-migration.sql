-- =====================================================================
-- CareHomeStaffUK — Standalone Full Schema Migration
-- =====================================================================
-- Run this ONE file against any fresh Supabase project to bootstrap
-- the entire backend (tables, RLS, triggers).
--
-- Two ways to run it:
--   A) ONE-CLICK (recommended): First paste /bootstrap-exec-sql.sql once
--      into your Supabase SQL Editor. Then return to /setup and click
--      "Auto-Run Migration" — this file will be executed automatically.
--   B) MANUAL: Paste this entire file into the SQL Editor and click Run.
--
-- This migration is idempotent (safe to run multiple times).
-- =====================================================================

-- ---------- Helper: timestamp trigger ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ---------- TABLE: jobs ----------
CREATE TABLE IF NOT EXISTS public.jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  soc_code      text NOT NULL,
  location      text NOT NULL DEFAULT '',
  type          text NOT NULL DEFAULT 'Full-time',
  salary        text NOT NULL DEFAULT '',
  hourly_rate   text NOT NULL DEFAULT '',
  sponsorship_fee text NOT NULL DEFAULT '',
  description   text NOT NULL DEFAULT '',
  requirements  text[] NOT NULL DEFAULT '{}',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read jobs"   ON public.jobs;
DROP POLICY IF EXISTS "Anyone can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can delete jobs" ON public.jobs;

CREATE POLICY "Anyone can read jobs"   ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert jobs" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update jobs" ON public.jobs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete jobs" ON public.jobs FOR DELETE USING (true);

-- ---------- TABLE: applications ----------
CREATE TABLE IF NOT EXISTS public.applications (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id               uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  job_title            text NOT NULL,
  full_name            text NOT NULL,
  email                text NOT NULL,
  phone                text NOT NULL,
  nationality          text NOT NULL DEFAULT '',
  current_location     text NOT NULL DEFAULT '',
  visa_status          text NOT NULL DEFAULT '',
  experience           text NOT NULL DEFAULT '',
  qualifications       text NOT NULL DEFAULT '',
  cover_letter         text NOT NULL DEFAULT '',
  cv_file_name         text NOT NULL DEFAULT '',
  status               text NOT NULL DEFAULT 'pending',
  offer_letter_sent    boolean NOT NULL DEFAULT false,
  offer_letter_sent_at timestamptz,
  invoice_sent         boolean NOT NULL DEFAULT false,
  invoice_sent_at      timestamptz,
  invoice_number       text,
  submitted_at         timestamptz NOT NULL DEFAULT now()
);

-- Idempotent column adds for upgrades from older versions
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS invoice_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invoice_number text;

CREATE INDEX IF NOT EXISTS idx_applications_status      ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_submitted   ON public.applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_email       ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_invoice_sent ON public.applications(invoice_sent);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read applications"   ON public.applications;
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can update applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can delete applications" ON public.applications;

CREATE POLICY "Anyone can read applications"   ON public.applications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update applications" ON public.applications FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete applications" ON public.applications FOR DELETE USING (true);

-- ---------- TABLE: contact_submissions ----------
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  subject    text NOT NULL DEFAULT '',
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read contact submissions"   ON public.contact_submissions;
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;

CREATE POLICY "Anyone can read contact submissions"   ON public.contact_submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert contact submissions" ON public.contact_submissions FOR INSERT WITH CHECK (true);

-- ---------- TABLE: admin_settings ----------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read admin settings"   ON public.admin_settings;
DROP POLICY IF EXISTS "Anyone can upsert admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Anyone can update admin settings" ON public.admin_settings;

CREATE POLICY "Anyone can read admin settings"   ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can upsert admin settings" ON public.admin_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update admin settings" ON public.admin_settings FOR UPDATE USING (true);

-- =====================================================================
-- Done! Your schema is ready. Now:
--   • Deploy the edge functions in /supabase/functions (send-email,
--     send-telegram) using the Supabase CLI:
--         supabase functions deploy send-email
--         supabase functions deploy send-telegram
--   • Open the app's /setup page and paste your project URL + anon key.
-- =====================================================================
