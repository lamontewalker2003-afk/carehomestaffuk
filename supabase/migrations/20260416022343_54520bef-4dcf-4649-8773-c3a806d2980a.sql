
-- Add status and offer letter fields to applications
ALTER TABLE public.applications 
  ADD COLUMN status text NOT NULL DEFAULT 'pending',
  ADD COLUMN offer_letter_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN offer_letter_sent_at timestamp with time zone;

-- Allow updating applications (for status changes, offer letters)
CREATE POLICY "Anyone can update applications"
  ON public.applications
  FOR UPDATE
  USING (true);
