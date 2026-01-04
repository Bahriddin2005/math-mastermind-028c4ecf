-- Create game invitations table
CREATE TABLE public.game_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  room_code TEXT,
  game_type TEXT NOT NULL DEFAULT 'mental-arithmetic',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  CONSTRAINT no_self_invite CHECK (sender_id != receiver_id)
);

-- Enable RLS
ALTER TABLE public.game_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations they sent or received
CREATE POLICY "Users can view their invitations"
ON public.game_invitations
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can create invitations
CREATE POLICY "Users can send invitations"
ON public.game_invitations
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can update invitations they received (accept/decline)
CREATE POLICY "Users can respond to invitations"
ON public.game_invitations
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Users can delete their own invitations
CREATE POLICY "Users can delete their invitations"
ON public.game_invitations
FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Enable realtime for invitations
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_invitations;

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;