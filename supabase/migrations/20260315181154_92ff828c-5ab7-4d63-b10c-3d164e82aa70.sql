
-- Create a secure view for public profile data (no phone/telegram info)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  username,
  avatar_url,
  total_score,
  total_problems_solved,
  current_streak,
  best_streak,
  selected_frame,
  daily_goal,
  created_at,
  last_active_date,
  vip_expires_at,
  teacher_status
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
