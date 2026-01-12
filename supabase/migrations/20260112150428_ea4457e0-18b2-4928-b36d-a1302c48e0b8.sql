
-- ========================================
-- 1. CHAT_SESSIONS - Faqat o'z sessiyalarini ko'rish
-- ========================================

-- Eski siyosatlarni o'chirish
DROP POLICY IF EXISTS "Anyone can view their own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.chat_sessions;

-- Yangi xavfsiz siyosatlar
CREATE POLICY "Users can view own chat sessions"
ON public.chat_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own chat sessions"
ON public.chat_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ========================================
-- 2. GAME_SESSIONS - Faqat o'z o'yinlarini ko'rish (INSERT hamma uchun)
-- ========================================

-- Eski siyosatlarni o'chirish
DROP POLICY IF EXISTS "Users can view all game sessions" ON public.game_sessions;

-- Yangi siyosat - foydalanuvchilar faqat o'z o'yinlarini ko'ra oladi
CREATE POLICY "Users can view own game sessions"
ON public.game_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
