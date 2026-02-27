
-- Live chat messages table for persistent messaging
CREATE TABLE public.live_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- text, file, emoji, system
  file_url TEXT,
  file_name TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add recording & lock fields to live_sessions
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recording BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS recording_duration INTEGER;

-- Add request_to_speak and emoji_reaction fields to participants
ALTER TABLE public.live_session_participants
  ADD COLUMN IF NOT EXISTS is_camera_on BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_screen_sharing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_spotlighted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_screen_share BOOLEAN DEFAULT false;

-- Enable RLS on chat messages
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for live_chat_messages
CREATE POLICY "Authenticated users can view session messages"
ON public.live_chat_messages FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can send messages"
ON public.live_chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers and admins can delete messages"
ON public.live_chat_messages FOR UPDATE
USING (
  has_role(auth.uid(), 'teacher'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  auth.uid() = user_id
);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;

-- Index for fast message retrieval
CREATE INDEX idx_live_chat_messages_session ON public.live_chat_messages(session_id, created_at);
CREATE INDEX idx_live_chat_messages_user ON public.live_chat_messages(user_id);
