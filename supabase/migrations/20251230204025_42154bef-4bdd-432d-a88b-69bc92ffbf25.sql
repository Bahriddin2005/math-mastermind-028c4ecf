-- Enhanced badge awarding function
CREATE OR REPLACE FUNCTION public.award_achievement_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  total_correct INTEGER;
  streak_days INTEGER;
BEGIN
  -- Get user's profile stats
  SELECT * INTO user_profile
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- Award "100 ta to'g'ri javob" badge
  IF user_profile.total_problems_solved >= 100 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'solver_100', '100 masala', '💯', '100 ta masala yechish', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  -- Award "500 ta masala" badge
  IF user_profile.total_problems_solved >= 500 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'solver_500', '500 masala', '🎯', '500 ta masala yechish', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  -- Award "1000 ta masala" badge
  IF user_profile.total_problems_solved >= 1000 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'solver_1000', 'Ming masala', '🏆', '1000 ta masala yechish', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  -- Award streak badges
  IF user_profile.current_streak >= 7 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'streak_7', 'Haftalik seriya', '🔥', '7 kun ketma-ket mashq', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  IF user_profile.current_streak >= 30 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'streak_30', 'Oylik seriya', '⭐', '30 kun ketma-ket mashq', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  -- Award best streak badges
  IF user_profile.best_streak >= 10 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'best_streak_10', 'Seriya ustasi', '⚡', '10+ ketma-ket to''g''ri javob', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  IF user_profile.best_streak >= 25 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'best_streak_25', 'Super seriya', '💎', '25+ ketma-ket to''g''ri javob', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  -- Award score badges
  IF user_profile.total_score >= 1000 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'score_1000', 'Ming ball', '🌟', '1000 ball to''plash', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  IF user_profile.total_score >= 5000 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'score_5000', 'Besh ming ball', '👑', '5000 ball to''plash', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on profiles update
DROP TRIGGER IF EXISTS award_profile_badges ON public.profiles;
CREATE TRIGGER award_profile_badges
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.award_achievement_badges();

-- Function to award weekly winner badge
CREATE OR REPLACE FUNCTION public.award_weekly_winner_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  challenge_record RECORD;
  top_player RECORD;
BEGIN
  -- Get the challenge info
  SELECT * INTO challenge_record
  FROM weekly_challenges
  WHERE id = NEW.challenge_id;

  -- Check if competition has ended (week_end has passed)
  IF challenge_record.week_end < CURRENT_DATE THEN
    -- Get top player
    SELECT * INTO top_player
    FROM weekly_challenge_results
    WHERE challenge_id = NEW.challenge_id
    ORDER BY total_score DESC
    LIMIT 1;

    -- Award badge to winner
    IF top_player.user_id = NEW.user_id THEN
      INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_id, competition_type)
      VALUES (NEW.user_id, 'weekly_winner', 'Haftalik chempion', '🏆', 'Haftalik musobaqada 1-o''rin', NEW.challenge_id, 'weekly')
      ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for weekly results
DROP TRIGGER IF EXISTS award_weekly_badges ON public.weekly_challenge_results;
CREATE TRIGGER award_weekly_badges
AFTER INSERT OR UPDATE ON public.weekly_challenge_results
FOR EACH ROW
EXECUTE FUNCTION public.award_weekly_winner_badge();

-- Add first game badge function
CREATE OR REPLACE FUNCTION public.award_first_game_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  game_count INTEGER;
BEGIN
  -- Count user's games
  SELECT COUNT(*) INTO game_count
  FROM game_sessions
  WHERE user_id = NEW.user_id;

  -- Award first game badge
  IF game_count = 1 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'first_game', 'Birinchi qadam', '🎮', 'Birinchi o''yinni o''ynash', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  -- Award 10 games badge
  IF game_count = 10 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'games_10', 'Faol o''yinchi', '🎲', '10 ta o''yin o''ynash', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  -- Award 50 games badge
  IF game_count = 50 THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_type)
    VALUES (NEW.user_id, 'games_50', 'Tajribali', '🎖️', '50 ta o''yin o''ynash', NULL)
    ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for game sessions
DROP TRIGGER IF EXISTS award_game_badges ON public.game_sessions;
CREATE TRIGGER award_game_badges
AFTER INSERT ON public.game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.award_first_game_badge();