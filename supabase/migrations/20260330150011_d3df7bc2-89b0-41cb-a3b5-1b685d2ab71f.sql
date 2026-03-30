
-- Create RPC for leaderboard with gamification data (all time)
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_gamification()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  avatar_url text,
  total_score integer,
  best_streak integer,
  selected_frame text,
  level integer,
  total_xp integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.username,
    p.avatar_url,
    p.total_score,
    p.best_streak,
    p.selected_frame,
    COALESCE(g.level, 1) as level,
    COALESCE(g.total_xp, 0) as total_xp
  FROM public.profiles p
  LEFT JOIN public.user_gamification g ON g.user_id = p.user_id
  ORDER BY p.total_score DESC NULLS LAST
  LIMIT 50;
$$;

-- Create RPC for time-filtered leaderboard (weekly/monthly)
CREATE OR REPLACE FUNCTION public.get_leaderboard_by_period(period_days integer DEFAULT 7)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  avatar_url text,
  total_score bigint,
  best_streak integer,
  level integer,
  total_xp integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.username,
    p.avatar_url,
    COALESCE(SUM(gs.score), 0) as total_score,
    COALESCE(MAX(gs.best_streak), 0) as best_streak,
    COALESCE(g.level, 1) as level,
    COALESCE(g.total_xp, 0) as total_xp
  FROM public.game_sessions gs
  INNER JOIN public.profiles p ON p.user_id = gs.user_id
  LEFT JOIN public.user_gamification g ON g.user_id = gs.user_id
  WHERE gs.created_at >= now() - (period_days || ' days')::interval
  GROUP BY p.id, p.user_id, p.username, p.avatar_url, g.level, g.total_xp
  ORDER BY total_score DESC
  LIMIT 50;
$$;

-- Create RPC for dashboard stats (own user data)
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id uuid)
RETURNS TABLE(
  username text,
  total_score integer,
  total_problems_solved integer,
  best_streak integer,
  daily_goal integer,
  current_streak integer,
  avatar_url text,
  level integer,
  current_xp integer,
  energy integer,
  combo integer,
  total_xp integer,
  today_solved bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.username,
    COALESCE(p.total_score, 0),
    COALESCE(p.total_problems_solved, 0),
    COALESCE(p.best_streak, 0),
    COALESCE(p.daily_goal, 20),
    COALESCE(p.current_streak, 0),
    p.avatar_url,
    COALESCE(g.level, 1),
    COALESCE(g.current_xp, 0),
    COALESCE(g.energy, 100),
    COALESCE(g.combo, 0),
    COALESCE(g.total_xp, 0),
    (SELECT COALESCE(SUM(gs.correct), 0)
     FROM public.game_sessions gs
     WHERE gs.user_id = p_user_id
     AND gs.created_at >= CURRENT_DATE::timestamptz
    )
  FROM public.profiles p
  LEFT JOIN public.user_gamification g ON g.user_id = p.user_id
  WHERE p.user_id = p_user_id;
END;
$$;
