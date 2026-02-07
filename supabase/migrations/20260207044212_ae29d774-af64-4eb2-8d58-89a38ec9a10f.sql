DROP FUNCTION IF EXISTS public.get_platform_stats();

CREATE OR REPLACE FUNCTION public.get_platform_stats()
 RETURNS TABLE(total_users bigint, total_problems_solved bigint, total_lessons bigint, total_courses bigint, accuracy_rate numeric, d7_retention numeric, weekly_growth numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_users bigint;
  v_total_correct bigint;
  v_total_incorrect bigint;
  v_users_7days_ago bigint;
  v_users_returned bigint;
  v_users_this_week bigint;
  v_users_last_week bigint;
BEGIN
  v_total_users := (SELECT COUNT(*) FROM public.profiles);
  
  SELECT COALESCE(SUM(gs.correct), 0), COALESCE(SUM(gs.incorrect), 0)
  INTO v_total_correct, v_total_incorrect
  FROM public.game_sessions gs;
  
  v_users_7days_ago := (SELECT COUNT(*) FROM public.profiles WHERE created_at <= now() - interval '7 days');
  v_users_returned := (
    SELECT COUNT(DISTINCT gs.user_id) FROM public.game_sessions gs
    INNER JOIN public.profiles pr ON pr.user_id = gs.user_id
    WHERE pr.created_at <= now() - interval '7 days'
    AND gs.created_at >= now() - interval '7 days'
  );
  
  v_users_this_week := (SELECT COUNT(*) FROM public.profiles WHERE created_at >= now() - interval '7 days');
  v_users_last_week := (SELECT COUNT(*) FROM public.profiles WHERE created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days');

  RETURN QUERY SELECT
    v_total_users,
    (SELECT COALESCE(SUM(p.total_problems_solved), 0) FROM public.profiles p)::BIGINT,
    (SELECT COUNT(*) FROM public.lessons WHERE is_published = true)::BIGINT,
    (SELECT COUNT(*) FROM public.courses WHERE is_published = true)::BIGINT,
    CASE WHEN (v_total_correct + v_total_incorrect) > 0
      THEN ROUND((v_total_correct::numeric / (v_total_correct + v_total_incorrect)) * 100, 1)
      ELSE 0
    END,
    CASE WHEN v_users_7days_ago > 0
      THEN ROUND((v_users_returned::numeric / v_users_7days_ago) * 100, 1)
      ELSE 0
    END,
    CASE WHEN v_users_last_week > 0
      THEN ROUND(((v_users_this_week - v_users_last_week)::numeric / v_users_last_week) * 100, 1)
      ELSE 0
    END;
END;
$function$;