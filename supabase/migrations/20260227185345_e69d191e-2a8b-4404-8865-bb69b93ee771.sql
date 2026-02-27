
-- Drop existing restrictive policies on live_sessions
DROP POLICY IF EXISTS "Admins full access to sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Teachers can create sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Teachers can update own sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Teachers can delete own sessions" ON public.live_sessions;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins full access to sessions"
ON public.live_sessions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view sessions"
ON public.live_sessions FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can create sessions"
ON public.live_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update own sessions"
ON public.live_sessions FOR UPDATE TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own sessions"
ON public.live_sessions FOR DELETE TO authenticated
USING (auth.uid() = teacher_id);

-- Also fix live_session_participants policies
DROP POLICY IF EXISTS "Users can view participants" ON public.live_session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON public.live_session_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.live_session_participants;
DROP POLICY IF EXISTS "Teachers can manage participants" ON public.live_session_participants;
DROP POLICY IF EXISTS "Authenticated users can view participants" ON public.live_session_participants;
DROP POLICY IF EXISTS "Authenticated users can join sessions" ON public.live_session_participants;
DROP POLICY IF EXISTS "Users can update own participant record" ON public.live_session_participants;
DROP POLICY IF EXISTS "Session teacher can manage participants" ON public.live_session_participants;

CREATE POLICY "Authenticated users can view participants"
ON public.live_session_participants FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can join sessions"
ON public.live_session_participants FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participant record"
ON public.live_session_participants FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Session teacher can manage participants"
ON public.live_session_participants FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.live_sessions
  WHERE live_sessions.id = live_session_participants.session_id
  AND live_sessions.teacher_id = auth.uid()
));

-- Also fix live_chat_messages policies
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.live_chat_messages;

CREATE POLICY "Authenticated users can view chat messages"
ON public.live_chat_messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can send messages"
ON public.live_chat_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
ON public.live_chat_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);
