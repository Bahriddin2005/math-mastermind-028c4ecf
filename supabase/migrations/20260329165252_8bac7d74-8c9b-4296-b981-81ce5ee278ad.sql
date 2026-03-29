
-- 1. Topic Progress table - har mavzu bo'yicha o'quvchi progressi
CREATE TABLE public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  operation TEXT NOT NULL,
  main_formula INTEGER,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
  mastery_percent INTEGER NOT NULL DEFAULT 0,
  current_difficulty TEXT NOT NULL DEFAULT 'medium',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic, operation, main_formula)
);

-- 2. Session Progress Logs - har session yakunidagi snapshot
CREATE TABLE public.session_progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  operation TEXT NOT NULL,
  main_formula INTEGER,
  digits_count INTEGER NOT NULL,
  terms_count INTEGER NOT NULL,
  attempts_count INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  wrong_count INTEGER NOT NULL,
  accuracy_percent INTEGER NOT NULL,
  avg_response_time_ms INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  old_level INTEGER NOT NULL DEFAULT 1,
  new_level INTEGER NOT NULL DEFAULT 1,
  level_up BOOLEAN NOT NULL DEFAULT false,
  old_difficulty TEXT,
  new_difficulty TEXT,
  streak_after_session INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_progress_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for topic_progress
CREATE POLICY "Users can view own topic progress"
  ON public.topic_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic progress"
  ON public.topic_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic progress"
  ON public.topic_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. RLS policies for session_progress_logs
CREATE POLICY "Users can view own session logs"
  ON public.session_progress_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session logs"
  ON public.session_progress_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. Admin access
CREATE POLICY "Admins full access topic progress"
  ON public.topic_progress FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins full access session logs"
  ON public.session_progress_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Indexes
CREATE INDEX idx_topic_progress_user ON public.topic_progress(user_id);
CREATE INDEX idx_topic_progress_topic ON public.topic_progress(user_id, topic, operation);
CREATE INDEX idx_session_progress_user ON public.session_progress_logs(user_id);
CREATE INDEX idx_session_progress_session ON public.session_progress_logs(session_id);
