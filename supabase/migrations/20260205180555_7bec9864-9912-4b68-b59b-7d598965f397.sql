-- Make phone_number nullable so we can insert record on /start before contact is shared
ALTER TABLE public.telegram_users ALTER COLUMN phone_number DROP NOT NULL;

-- Remove unique constraint on phone_number (we may have multiple blank entries temporarily)
ALTER TABLE public.telegram_users DROP CONSTRAINT IF EXISTS telegram_users_phone_number_key;

-- Add unique constraint on chat_id for upsert to work
CREATE UNIQUE INDEX IF NOT EXISTS telegram_users_chat_id_key ON public.telegram_users (chat_id);
