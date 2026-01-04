-- Create tournament tables for real multiplayer tournaments

-- Tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Turnir',
  host_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  player_count INTEGER NOT NULL DEFAULT 4 CHECK (player_count IN (4, 8, 16)),
  digit_count INTEGER NOT NULL DEFAULT 1,
  formula_type TEXT NOT NULL DEFAULT 'oddiy',
  speed NUMERIC NOT NULL DEFAULT 0.5,
  problem_count INTEGER NOT NULL DEFAULT 5,
  current_round INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Tournament participants
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  is_eliminated BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Tournament matches
CREATE TABLE public.tournament_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_index INTEGER NOT NULL,
  player1_id UUID REFERENCES public.tournament_participants(id),
  player2_id UUID REFERENCES public.tournament_participants(id),
  winner_id UUID REFERENCES public.tournament_participants(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'playing', 'finished')),
  player1_answer INTEGER,
  player2_answer INTEGER,
  player1_time NUMERIC,
  player2_time NUMERIC,
  correct_answer INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournaments
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Host can update tournament" ON public.tournaments FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Host can delete tournament" ON public.tournaments FOR DELETE USING (auth.uid() = host_id);

-- RLS Policies for tournament_participants
CREATE POLICY "Anyone can view participants" ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join" ON public.tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can update own data" ON public.tournament_participants FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for tournament_matches
CREATE POLICY "Anyone can view matches" ON public.tournament_matches FOR SELECT USING (true);
CREATE POLICY "Tournament host can manage matches" ON public.tournament_matches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id AND host_id = auth.uid())
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_matches;