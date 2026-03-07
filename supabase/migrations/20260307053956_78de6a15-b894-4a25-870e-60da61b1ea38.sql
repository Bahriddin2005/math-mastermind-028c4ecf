
ALTER TABLE public.multiplayer_rooms 
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS host_username text;
