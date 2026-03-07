
CREATE OR REPLACE FUNCTION public.get_user_total_score(p_user_id uuid)
RETURNS TABLE(total_score bigint, total_problems bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT 
    COALESCE(SUM(score), 0) as total_score,
    COALESCE(SUM(correct), 0) as total_problems
  FROM public.game_sessions
  WHERE user_id = p_user_id;
$$;
