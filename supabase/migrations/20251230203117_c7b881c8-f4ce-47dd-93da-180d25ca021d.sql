-- Create user_badges table for achievements
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL DEFAULT '🏆',
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  competition_id UUID,
  competition_type TEXT, -- 'daily' or 'weekly'
  UNIQUE(user_id, badge_type, competition_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view badges" 
ON public.user_badges FOR SELECT USING (true);

CREATE POLICY "System can create badges" 
ON public.user_badges FOR INSERT 
WITH CHECK (true);

-- Add delete policy for weekly challenge results (for admins)
CREATE POLICY "Admins can delete weekly results" 
ON public.weekly_challenge_results FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Function to award badges automatically
CREATE OR REPLACE FUNCTION public.award_competition_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  winner_record RECORD;
  badge_icon TEXT;
  badge_name TEXT;
  badge_desc TEXT;
BEGIN
  -- For daily challenges - award badge to winner (highest score, fastest time)
  IF TG_TABLE_NAME = 'daily_challenge_results' THEN
    -- Get the top performer for this challenge
    SELECT * INTO winner_record
    FROM daily_challenge_results
    WHERE challenge_id = NEW.challenge_id AND is_correct = true
    ORDER BY score DESC, completion_time ASC
    LIMIT 1;
    
    IF winner_record.user_id = NEW.user_id AND winner_record.id = NEW.id THEN
      -- Check if there are other participants
      IF (SELECT COUNT(*) FROM daily_challenge_results WHERE challenge_id = NEW.challenge_id) >= 3 THEN
        badge_icon := '🥇';
        badge_name := 'Kunlik g''olib';
        badge_desc := 'Kunlik musobaqada 1-o''rin';
        
        INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, description, competition_id, competition_type)
        VALUES (NEW.user_id, 'daily_winner', badge_name, badge_icon, badge_desc, NEW.challenge_id, 'daily')
        ON CONFLICT (user_id, badge_type, competition_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-awarding badges
CREATE TRIGGER award_daily_badges
AFTER INSERT ON public.daily_challenge_results
FOR EACH ROW
EXECUTE FUNCTION public.award_competition_badges();