ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS whatsapp_contact TEXT,
  ADD COLUMN IF NOT EXISTS refund_handled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS refund_notes TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;