-- Create friends table
CREATE TABLE public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  CONSTRAINT no_self_friend CHECK (user_id != friend_id)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Users can view their own friend requests (sent or received)
CREATE POLICY "Users can view their friendships"
ON public.friends
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.friends
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update friend requests they received (accept/reject)
CREATE POLICY "Users can respond to friend requests"
ON public.friends
FOR UPDATE
USING (auth.uid() = friend_id);

-- Users can delete their friendships
CREATE POLICY "Users can delete their friendships"
ON public.friends
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create trigger for updated_at
CREATE TRIGGER update_friends_updated_at
BEFORE UPDATE ON public.friends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();