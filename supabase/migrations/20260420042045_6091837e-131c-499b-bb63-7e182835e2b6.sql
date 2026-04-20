-- ---------- TABLE: email_log ----------
CREATE TABLE IF NOT EXISTS public.email_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  kind            text NOT NULL DEFAULT 'custom',
  subject         text NOT NULL DEFAULT '',
  body_snippet    text NOT NULL DEFAULT '',
  success         boolean NOT NULL DEFAULT true,
  sent_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_recipient   ON public.email_log(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_log_application ON public.email_log(application_id);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at     ON public.email_log(sent_at DESC);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read email log"   ON public.email_log;
DROP POLICY IF EXISTS "Anyone can insert email log" ON public.email_log;

CREATE POLICY "Anyone can read email log"   ON public.email_log FOR SELECT USING (true);
CREATE POLICY "Anyone can insert email log" ON public.email_log FOR INSERT WITH CHECK (true);

-- ---------- TABLE: schema_versions ----------
CREATE TABLE IF NOT EXISTS public.schema_versions (
  version     integer PRIMARY KEY,
  description text NOT NULL DEFAULT '',
  applied_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schema_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read schema versions"   ON public.schema_versions;
DROP POLICY IF EXISTS "Anyone can insert schema versions" ON public.schema_versions;

CREATE POLICY "Anyone can read schema versions"   ON public.schema_versions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert schema versions" ON public.schema_versions FOR INSERT WITH CHECK (true);

-- Seed already-applied versions for this Cloud project
INSERT INTO public.schema_versions (version, description) VALUES
  (1, 'Initial schema: jobs, applications, contact_submissions, admin_settings'),
  (2, 'Add email_log + schema_versions for audit trail and version detection')
ON CONFLICT (version) DO NOTHING;