
-- Remove the redundant broad SELECT policy on profiles
DROP POLICY IF EXISTS "Public leaderboard data visible" ON public.profiles;

-- Create a security definer function for safe leaderboard data
CREATE OR REPLACE FUNCTION public.get_leaderboard_profiles()
RETURNS TABLE(
  user_id uuid,
  username text,
  avatar_url text,
  total_score integer,
  total_problems_solved integer,
  current_streak integer,
  best_streak integer,
  selected_frame text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.avatar_url,
    p.total_score,
    p.total_problems_solved,
    p.current_streak,
    p.best_streak,
    p.selected_frame
  FROM public.profiles p
  ORDER BY p.total_score DESC NULLS LAST;
$$;

-- Create a function to get a specific user's public profile
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  username text,
  avatar_url text,
  total_score integer,
  total_problems_solved integer,
  current_streak integer,
  best_streak integer,
  selected_frame text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.avatar_url,
    p.total_score,
    p.total_problems_solved,
    p.current_streak,
    p.best_streak,
    p.selected_frame
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
$$;
