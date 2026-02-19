
-- Add brute-force tracking columns
ALTER TABLE public.verification_codes 
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone;

-- Make phone_number optional (email OTP doesn't need phone)
ALTER TABLE public.verification_codes 
  ALTER COLUMN phone_number SET DEFAULT '';
