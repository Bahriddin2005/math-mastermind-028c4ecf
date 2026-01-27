-- Add phone_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone_number text;

-- Add index for phone number lookup
CREATE INDEX idx_profiles_phone_number ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;