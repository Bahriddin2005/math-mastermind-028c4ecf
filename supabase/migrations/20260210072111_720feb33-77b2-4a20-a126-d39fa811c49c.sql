
-- CRITICAL SECURITY FIX: Remove public access to verification_codes and telegram_users

-- 1. Secure verification_codes table (remove all permissive policies)
DROP POLICY IF EXISTS "Anyone can view codes by email" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can create verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can update codes" ON public.verification_codes;
-- No new policies needed - Edge Functions use service_role_key which bypasses RLS

-- 2. Secure telegram_users table
DROP POLICY IF EXISTS "Anyone can view telegram users for verification" ON public.telegram_users;
-- No new public policy needed - Edge Functions (generate-otp, telegram-webhook) use service_role_key
