
-- ========================================
-- 1. MULTIPLAYER_ROOMS - Faqat autentifikatsiya qilinganlar
-- ========================================

-- Eski siyosatni o'chirish
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.multiplayer_rooms;

-- Yangi siyosat - faqat tizimga kirgan foydalanuvchilar xonalarni ko'ra oladi
CREATE POLICY "Authenticated users can view rooms"
ON public.multiplayer_rooms
FOR SELECT
TO authenticated
USING (true);

-- ========================================
-- 2. INCREMENT_BLOG_VIEWS - Faqat nashr qilingan postlar
-- ========================================

CREATE OR REPLACE FUNCTION public.increment_blog_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Faqat nashr qilingan postlar uchun views_count ni oshirish
  UPDATE public.blog_posts 
  SET views_count = COALESCE(views_count, 0) + 1 
  WHERE id = post_id 
    AND is_published = true;
END;
$$;
