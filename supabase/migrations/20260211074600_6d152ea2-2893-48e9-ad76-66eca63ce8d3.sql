
-- Live Classroom sessions table
CREATE TABLE public.live_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
  room_name TEXT NOT NULL UNIQUE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  max_participants INTEGER DEFAULT 30,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format (optional)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Live session participants
CREATE TABLE public.live_session_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'student', -- teacher, student
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_muted BOOLEAN DEFAULT false,
  is_hand_raised BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_session_participants ENABLE ROW LEVEL SECURITY;

-- RLS for live_sessions
CREATE POLICY "Teachers can create sessions"
  ON public.live_sessions FOR INSERT
  WITH CHECK (auth.uid() = teacher_id AND has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers can update own sessions"
  ON public.live_sessions FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own sessions"
  ON public.live_sessions FOR DELETE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Authenticated users can view sessions"
  ON public.live_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins full access
CREATE POLICY "Admins full access to sessions"
  ON public.live_sessions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS for participants
CREATE POLICY "Authenticated users can view participants"
  ON public.live_session_participants FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join sessions"
  ON public.live_session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON public.live_session_participants FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.live_sessions ls 
    WHERE ls.id = session_id AND ls.teacher_id = auth.uid()
  ));

CREATE POLICY "Teacher can remove participants"
  ON public.live_session_participants FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions ls 
    WHERE ls.id = session_id AND ls.teacher_id = auth.uid()
  ) OR auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for participants (hand raise, mute status)
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_session_participants;
