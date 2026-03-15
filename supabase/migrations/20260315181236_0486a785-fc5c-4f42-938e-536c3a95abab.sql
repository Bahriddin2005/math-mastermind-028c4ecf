
-- Drop the view since it won't work with security_invoker
DROP VIEW IF EXISTS public.public_profiles;

-- Create bulk function for fetching multiple public profiles
CREATE OR REPLACE FUNCTION public.get_public_profiles_by_ids(user_ids uuid[])
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  avatar_url text,
  total_score integer,
  total_problems_solved integer,
  current_streak integer,
  best_streak integer,
  selected_frame text,
  daily_goal integer,
  created_at timestamptz,
  last_active_date text,
  vip_expires_at timestamptz,
  teacher_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, p.user_id, p.username, p.avatar_url,
    p.total_score, p.total_problems_solved,
    p.current_streak, p.best_streak, p.selected_frame,
    p.daily_goal, p.created_at, p.last_active_date,
    p.vip_expires_at, p.teacher_status
  FROM public.profiles p
  WHERE p.user_id = ANY(user_ids);
$$;
