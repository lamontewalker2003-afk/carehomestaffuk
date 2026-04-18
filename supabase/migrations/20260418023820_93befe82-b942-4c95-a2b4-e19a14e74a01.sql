-- Add invoice tracking columns to applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS invoice_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invoice_number text;

CREATE INDEX IF NOT EXISTS idx_applications_invoice_sent ON public.applications (invoice_sent);

-- Note: bank accounts and invoice template are stored as JSONB rows in the
-- existing public.admin_settings table under keys 'bank_accounts' and
-- 'invoice_template'. No new tables required — keeps the schema light and
-- backups simple.