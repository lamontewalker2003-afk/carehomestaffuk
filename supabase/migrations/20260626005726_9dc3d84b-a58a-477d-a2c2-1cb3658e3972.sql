ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS application_type text NOT NULL DEFAULT 'standard';
CREATE INDEX IF NOT EXISTS idx_applications_type ON public.applications(application_type);