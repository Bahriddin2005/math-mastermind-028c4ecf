CREATE OR REPLACE FUNCTION public.get_platform_stats()
 RETURNS TABLE(total_users bigint, total_problems_solved bigint, total_lessons bigint, total_courses bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::BIGINT,
    (SELECT COALESCE(SUM(p.total_problems_solved), 0) FROM public.profiles p)::BIGINT,
    (SELECT COUNT(*) FROM public.lessons WHERE is_published = true)::BIGINT,
    (SELECT COUNT(*) FROM public.courses WHERE is_published = true)::BIGINT;
END;
$function$;