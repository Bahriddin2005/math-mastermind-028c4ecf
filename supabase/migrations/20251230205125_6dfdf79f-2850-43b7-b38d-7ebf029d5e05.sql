-- Add new badge awarding triggers for additional badge types

-- Function to award accuracy badges (after game session)
CREATE OR REPLACE FUNCTION public.award_accuracy_badges()
RETURNS TRIGGER AS $$
DECLARE
  session_accuracy numeric;
  problems_count integer;
BEGIN
  -- Calculate accuracy for this session
  problems_count := COALESCE(NEW.correct, 0) + COALESCE(NEW.incorrect, 0);
  IF problems_count >= 5 THEN
    session_accuracy := (COALESCE(NEW.correct, 0)::numeric / problems_count) * 100;
    
    -- Award 95%+ accuracy badge
    IF session_accuracy >= 95 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, description)
      VALUES (NEW.user_id, 'accuracy_95', 'Super aniqlik', '🎯', '95%+ aniqlik bilan o''yin')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Award 100% accuracy badge
    IF session_accuracy = 100 AND problems_count >= 10 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, description)
      VALUES (NEW.user_id, 'perfect_game', 'Mukammal o''yin', '💎', '100% aniqlik, 10+ masala')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for accuracy badges
DROP TRIGGER IF EXISTS award_accuracy_badges_trigger ON public.game_sessions;
CREATE TRIGGER award_accuracy_badges_trigger
  AFTER INSERT ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_accuracy_badges();

-- Function to award daily score badges
CREATE OR REPLACE FUNCTION public.award_daily_score_badges()
RETURNS TRIGGER AS $$
DECLARE
  daily_score integer;
  today_date date := CURRENT_DATE;
BEGIN
  -- Calculate today's total score
  SELECT COALESCE(SUM(score), 0) INTO daily_score
  FROM public.game_sessions
  WHERE user_id = NEW.user_id
    AND DATE(created_at) = today_date;
  
  -- Award 1000 daily score badge
  IF daily_score >= 1000 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, description)
    SELECT NEW.user_id, 'daily_score_1000', 'Kunlik ming ball', '🔥', '1 kunda 1000+ ball to''plash'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = NEW.user_id 
        AND badge_type = 'daily_score_1000' 
        AND DATE(earned_at) = today_date
    );
  END IF;
  
  -- Award 500 daily score badge
  IF daily_score >= 500 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, description)
    SELECT NEW.user_id, 'daily_score_500', 'Kunlik besh yuz ball', '⭐', '1 kunda 500+ ball to''plash'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = NEW.user_id 
        AND badge_type = 'daily_score_500' 
        AND DATE(earned_at) = today_date
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for daily score badges
DROP TRIGGER IF EXISTS award_daily_score_badges_trigger ON public.game_sessions;
CREATE TRIGGER award_daily_score_badges_trigger
  AFTER INSERT ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_daily_score_badges();

-- Function to award daily streak badges (3 days, 5 days, etc.)
CREATE OR REPLACE FUNCTION public.award_streak_badges_v2()
RETURNS TRIGGER AS $$
DECLARE
  current_streak_val integer;
BEGIN
  current_streak_val := COALESCE(NEW.current_streak, 0);
  
  -- Award 3-day streak badge
  IF current_streak_val >= 3 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, description)
    SELECT NEW.user_id, 'streak_3', 'Uch kunlik seriya', '🔥', '3 kun ketma-ket mashq'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = NEW.user_id AND badge_type = 'streak_3'
    );
  END IF;
  
  -- Award 5-day streak badge
  IF current_streak_val >= 5 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, description)
    SELECT NEW.user_id, 'streak_5', 'Besh kunlik seriya', '🔥', '5 kun ketma-ket mashq'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = NEW.user_id AND badge_type = 'streak_5'
    );
  END IF;
  
  -- Award 14-day streak badge
  IF current_streak_val >= 14 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, description)
    SELECT NEW.user_id, 'streak_14', 'Ikki haftalik seriya', '⚡', '14 kun ketma-ket mashq'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = NEW.user_id AND badge_type = 'streak_14'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for streak badges v2
DROP TRIGGER IF EXISTS award_streak_badges_v2_trigger ON public.profiles;
CREATE TRIGGER award_streak_badges_v2_trigger
  AFTER UPDATE OF current_streak ON public.profiles
  FOR EACH ROW
  WHEN (NEW.current_streak > OLD.current_streak)
  EXECUTE FUNCTION public.award_streak_badges_v2();