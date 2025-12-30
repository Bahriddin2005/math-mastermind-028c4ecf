-- Function to award badges to top 3 weekly competition finishers
CREATE OR REPLACE FUNCTION public.award_weekly_top3_badges()
RETURNS TRIGGER AS $$
DECLARE
  challenge_record RECORD;
  ranking RECORD;
  badge_type_val TEXT;
  badge_name_val TEXT;
  badge_icon_val TEXT;
  badge_desc_val TEXT;
  player_rank INTEGER := 0;
BEGIN
  -- Get the challenge info
  SELECT * INTO challenge_record
  FROM weekly_challenges
  WHERE id = NEW.challenge_id;

  -- Only award if challenge week has ended
  IF challenge_record.week_end < CURRENT_DATE THEN
    -- Get all participants ranked by score
    FOR ranking IN 
      SELECT user_id, total_score, 
             ROW_NUMBER() OVER (ORDER BY total_score DESC) as rank
      FROM weekly_challenge_results
      WHERE challenge_id = NEW.challenge_id
      ORDER BY total_score DESC
      LIMIT 3
    LOOP
      -- Determine badge based on rank
      IF ranking.rank = 1 THEN
        badge_type_val := 'weekly_gold';
        badge_name_val := 'Haftalik oltin';
        badge_icon_val := '🥇';
        badge_desc_val := 'Haftalik musobaqada 1-o''rin';
      ELSIF ranking.rank = 2 THEN
        badge_type_val := 'weekly_silver';
        badge_name_val := 'Haftalik kumush';
        badge_icon_val := '🥈';
        badge_desc_val := 'Haftalik musobaqada 2-o''rin';
      ELSIF ranking.rank = 3 THEN
        badge_type_val := 'weekly_bronze';
        badge_name_val := 'Haftalik bronza';
        badge_icon_val := '🥉';
        badge_desc_val := 'Haftalik musobaqada 3-o''rin';
      END IF;

      -- Award the badge
      INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_id, competition_type)
      VALUES (ranking.user_id, badge_type_val, badge_name_val, badge_icon_val, badge_desc_val, NEW.challenge_id, 'weekly')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for top 3 weekly badges
DROP TRIGGER IF EXISTS award_weekly_top3_badges_trigger ON public.weekly_challenge_results;
CREATE TRIGGER award_weekly_top3_badges_trigger
  AFTER INSERT OR UPDATE ON public.weekly_challenge_results
  FOR EACH ROW
  EXECUTE FUNCTION public.award_weekly_top3_badges();