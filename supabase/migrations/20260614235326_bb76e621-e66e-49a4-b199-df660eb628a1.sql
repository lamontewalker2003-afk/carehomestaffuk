
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS cv_url TEXT,
  ADD COLUMN IF NOT EXISTS cv_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS cv_content_type TEXT,
  ADD COLUMN IF NOT EXISTS sponsor_company TEXT;

-- Allow anyone to read/upload CVs to the applicant-cvs bucket (bucket itself created via tool).
DO $$ BEGIN
  CREATE POLICY "Public read applicant-cvs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'applicant-cvs');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone insert applicant-cvs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'applicant-cvs');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
