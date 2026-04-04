-- Grant execute permission on get_platform_stats to anon and authenticated roles
-- This fixes the issue where stats don't load on deployed environments
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;

-- Also grant for get_user_dashboard_stats if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_dashboard_stats') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats(uuid) TO authenticated';
  END IF;
END $$;

-- Grant for get_leaderboard_profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_leaderboard_profiles') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_leaderboard_profiles() TO anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_leaderboard_profiles() TO authenticated';
  END IF;
END $$;

-- Grant for get_leaderboard_with_gamification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_leaderboard_with_gamification') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_leaderboard_with_gamification() TO anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_leaderboard_with_gamification() TO authenticated';
  END IF;
END $$;

-- Grant for get_or_create_daily_challenge
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_or_create_daily_challenge') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_or_create_daily_challenge() TO authenticated';
  END IF;
END $$;
