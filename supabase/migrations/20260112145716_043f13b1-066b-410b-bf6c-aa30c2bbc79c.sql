
-- ========================================
-- 1. CHAT_MESSAGES - user_id ustunini qo'shish va RLS yangilash
-- ========================================

-- user_id ustunini qo'shish
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Eski siyosatlarni o'chirish
DROP POLICY IF EXISTS "Anyone can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can create chat messages" ON public.chat_messages;

-- Yangi xavfsiz siyosatlar
-- Foydalanuvchilar faqat o'z xabarlarini ko'ra oladi (user_id yoki session_id orqali)
CREATE POLICY "Users can view own chat messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Foydalanuvchilar faqat o'z xabarlarini yarata oladi
CREATE POLICY "Users can create own chat messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ========================================
-- 2. PROFILES - Faqat autentifikatsiya qilinganlar
-- ========================================

-- Eski siyosatni o'chirish
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Yangi siyosat - faqat tizimga kirganlar profillarni ko'ra oladi
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
