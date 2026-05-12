
-- Email log: attachment metadata for re-download
ALTER TABLE public.email_log
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_filename text;

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  scheduled_at timestamptz NOT NULL,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | revoked
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert appointments" ON public.appointments;
CREATE POLICY "Anyone can insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can read appointments" ON public.appointments;
CREATE POLICY "Anyone can read appointments" ON public.appointments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can update appointments" ON public.appointments;
CREATE POLICY "Anyone can update appointments" ON public.appointments FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete appointments" ON public.appointments;
CREATE POLICY "Anyone can delete appointments" ON public.appointments FOR DELETE USING (true);

DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
CREATE TRIGGER appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS appointments_scheduled_at_idx ON public.appointments(scheduled_at);

-- Storage bucket for offer letters (public so admin can re-download via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-letters', 'offer-letters', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read offer letters" ON storage.objects;
CREATE POLICY "Public read offer letters" ON storage.objects
  FOR SELECT USING (bucket_id = 'offer-letters');

DROP POLICY IF EXISTS "Public upload offer letters" ON storage.objects;
CREATE POLICY "Public upload offer letters" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'offer-letters');

DROP POLICY IF EXISTS "Public delete offer letters" ON storage.objects;
CREATE POLICY "Public delete offer letters" ON storage.objects
  FOR DELETE USING (bucket_id = 'offer-letters');
