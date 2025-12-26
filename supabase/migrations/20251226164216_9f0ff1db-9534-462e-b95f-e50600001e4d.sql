-- Kunlik musobaqalar jadvali
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  formula_type TEXT NOT NULL DEFAULT 'hammasi',
  digit_count INTEGER NOT NULL DEFAULT 1,
  speed NUMERIC NOT NULL DEFAULT 0.5,
  problem_count INTEGER NOT NULL DEFAULT 5,
  seed INTEGER NOT NULL DEFAULT floor(random() * 1000000)::integer,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Kunlik musobaqa natijalari
CREATE TABLE public.daily_challenge_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  answer INTEGER,
  correct_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  completion_time NUMERIC NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

-- RLS yoqish
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_results ENABLE ROW LEVEL SECURITY;

-- Daily challenges policies
CREATE POLICY "Anyone can view challenges"
ON public.daily_challenges
FOR SELECT
USING (true);

-- Faqat service role yoki admin yaratishi mumkin
CREATE POLICY "Service role can create challenges"
ON public.daily_challenges
FOR INSERT
WITH CHECK (true);

-- Daily challenge results policies
CREATE POLICY "Anyone can view results"
ON public.daily_challenge_results
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can submit results"
ON public.daily_challenge_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own results"
ON public.daily_challenge_results
FOR UPDATE
USING (auth.uid() = user_id);

-- Realtime uchun
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_challenge_results;

-- Bugungi kunlik musobaqani yaratish funktsiyasi
CREATE OR REPLACE FUNCTION public.get_or_create_daily_challenge()
RETURNS public.daily_challenges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_challenge public.daily_challenges;
  formula_types TEXT[] := ARRAY['oddiy', 'formula5', 'formula10plus', 'formula10minus', 'hammasi'];
  random_formula TEXT;
  random_digits INTEGER;
  random_speed NUMERIC;
  random_count INTEGER;
BEGIN
  -- Bugungi musobaqani tekshirish
  SELECT * INTO today_challenge
  FROM public.daily_challenges
  WHERE challenge_date = CURRENT_DATE;
  
  -- Agar mavjud bo'lmasa, yaratish
  IF today_challenge IS NULL THEN
    random_formula := formula_types[1 + floor(random() * array_length(formula_types, 1))::integer];
    random_digits := 1 + floor(random() * 3)::integer;
    random_speed := (ARRAY[0.3, 0.5, 0.7, 1.0])[1 + floor(random() * 4)::integer];
    random_count := (ARRAY[5, 7, 10])[1 + floor(random() * 3)::integer];
    
    INSERT INTO public.daily_challenges (
      challenge_date,
      formula_type,
      digit_count,
      speed,
      problem_count,
      seed
    ) VALUES (
      CURRENT_DATE,
      random_formula,
      random_digits,
      random_speed,
      random_count,
      floor(random() * 1000000)::integer
    )
    RETURNING * INTO today_challenge;
  END IF;
  
  RETURN today_challenge;
END;
$$;