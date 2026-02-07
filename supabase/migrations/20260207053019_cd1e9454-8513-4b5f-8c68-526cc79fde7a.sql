
-- Add session_token and telegram identity columns to verification_codes
ALTER TABLE public.verification_codes 
  ADD COLUMN IF NOT EXISTS session_token TEXT,
  ADD COLUMN IF NOT EXISTS telegram_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Create unique index on session_token for polling
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_codes_session_token 
  ON public.verification_codes(session_token) WHERE session_token IS NOT NULL;

-- Add unique constraint on telegram_users.username (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_users_username_unique 
  ON public.telegram_users(username) WHERE username IS NOT NULL;

-- Add telegram_id column to profiles for binding (one telegram = one account)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT;

-- Unique constraint: one telegram account = one profile
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_telegram_id_unique 
  ON public.profiles(telegram_id) WHERE telegram_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_telegram_username_unique 
  ON public.profiles(telegram_username) WHERE telegram_username IS NOT NULL;

-- Allow delete on verification_codes for cleanup
CREATE POLICY "Service can delete verification codes"
  ON public.verification_codes
  FOR DELETE
  USING (true);
