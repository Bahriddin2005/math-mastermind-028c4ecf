
-- 1. User Period Stats - leaderboard uchun davr bo'yicha statistika
CREATE TABLE public.user_period_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL, -- daily / weekly / monthly / all_time
  period_key TEXT NOT NULL,  -- 2026-03-29 / 2026-W13 / 2026-03 / all_time
  topic TEXT,
  operation TEXT,
  main_formula INTEGER,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_key, topic, operation, main_formula)
);

-- 2. Enable RLS
ALTER TABLE public.user_period_stats ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "Users can view own period stats"
  ON public.user_period_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own period stats"
  ON public.user_period_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own period stats"
  ON public.user_period_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins full access period stats"
  ON public.user_period_stats FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Anyone can view for leaderboard
CREATE POLICY "Anyone can view leaderboard stats"
  ON public.user_period_stats FOR SELECT
  TO authenticated
  USING (true);

-- 5. Indexes
CREATE INDEX idx_period_stats_user ON public.user_period_stats(user_id);
CREATE INDEX idx_period_stats_period ON public.user_period_stats(period_type, period_key);
CREATE INDEX idx_period_stats_leaderboard ON public.user_period_stats(period_type, period_key, xp_earned DESC);
CREATE INDEX idx_period_stats_topic ON public.user_period_stats(topic, operation, main_formula);
