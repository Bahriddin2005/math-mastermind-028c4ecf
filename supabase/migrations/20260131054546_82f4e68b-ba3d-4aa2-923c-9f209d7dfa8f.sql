-- Telegram foydalanuvchilarni saqlash uchun jadval
CREATE TABLE public.telegram_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- Service role can manage all records (for edge functions)
CREATE POLICY "Service role can manage telegram users"
ON public.telegram_users
FOR ALL
USING (true)
WITH CHECK (true);

-- Anyone can view (for verification lookup)
CREATE POLICY "Anyone can view telegram users for verification"
ON public.telegram_users
FOR SELECT
USING (true);

-- Create index for phone number lookups
CREATE INDEX idx_telegram_users_phone ON public.telegram_users(phone_number);

-- Add trigger for updated_at
CREATE TRIGGER update_telegram_users_updated_at
BEFORE UPDATE ON public.telegram_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();