
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS street_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS postcode text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS salary_min numeric,
  ADD COLUMN IF NOT EXISTS salary_max numeric,
  ADD COLUMN IF NOT EXISTS company_logo_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS visa_sponsorship boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS valid_through timestamptz;

-- Slug generator: lowercase, hyphenated, ascii-ish
CREATE OR REPLACE FUNCTION public.jobs_generate_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(regexp_replace(coalesce(NEW.title,'job') || '-' || coalesce(NEW.location,''), '[^a-zA-Z0-9]+', '-', 'g'));
    base := trim(both '-' from base);
    IF base = '' THEN base := 'job'; END IF;
    NEW.slug := base || '-' || substr(replace(NEW.id::text,'-',''), 1, 8);
  END IF;
  IF NEW.valid_through IS NULL THEN
    NEW.valid_through := coalesce(NEW.created_at, now()) + interval '90 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_slug_trigger ON public.jobs;
CREATE TRIGGER jobs_slug_trigger
BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.jobs_generate_slug();

-- Backfill existing rows
UPDATE public.jobs SET slug = NULL WHERE slug IS NULL OR slug = '';
UPDATE public.jobs SET title = title WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS jobs_slug_unique ON public.jobs(slug);
