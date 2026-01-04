
-- Create user_game_currency table for coins and lives
CREATE TABLE public.user_game_currency (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  lives INTEGER NOT NULL DEFAULT 5,
  max_lives INTEGER NOT NULL DEFAULT 5,
  last_life_regen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_currency UNIQUE (user_id)
);

-- Create game_levels table for level progression
CREATE TABLE public.game_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  required_xp INTEGER NOT NULL DEFAULT 0,
  coin_reward INTEGER NOT NULL DEFAULT 10,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  problem_count INTEGER NOT NULL DEFAULT 5,
  time_limit INTEGER DEFAULT NULL,
  icon TEXT DEFAULT '⭐',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_level_progress table
CREATE TABLE public.user_level_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level_id UUID NOT NULL REFERENCES public.game_levels(id) ON DELETE CASCADE,
  stars_earned INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  best_time INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_level UNIQUE (user_id, level_id)
);

-- Create shop_items table for rewards
CREATE TABLE public.shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🎁',
  price INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'avatar',
  item_type TEXT NOT NULL DEFAULT 'cosmetic',
  is_available BOOLEAN DEFAULT true,
  stock INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_inventory table
CREATE TABLE public.user_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_item UNIQUE (user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.user_game_currency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_game_currency
CREATE POLICY "Users can view their own currency" ON public.user_game_currency FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own currency" ON public.user_game_currency FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own currency" ON public.user_game_currency FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for game_levels (public read)
CREATE POLICY "Anyone can view active levels" ON public.game_levels FOR SELECT USING (is_active = true);

-- RLS Policies for user_level_progress
CREATE POLICY "Users can view their own progress" ON public.user_level_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_level_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_level_progress FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for shop_items (public read)
CREATE POLICY "Anyone can view available items" ON public.shop_items FOR SELECT USING (is_available = true);

-- RLS Policies for user_inventory
CREATE POLICY "Users can view their own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own inventory" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own inventory" ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);

-- Insert default levels
INSERT INTO public.game_levels (level_number, name, description, required_xp, coin_reward, difficulty, problem_count, icon) VALUES
(1, 'Boshlash', 'Oddiy qo''shish va ayirish', 0, 10, 'easy', 5, '🌟'),
(2, 'Qadamlar', 'Bir oz qiyinroq', 100, 15, 'easy', 6, '⭐'),
(3, 'Yo''lda', 'Davom etamiz', 250, 20, 'easy', 7, '🌙'),
(4, 'Ildam', 'Tezroq hisoblaymiz', 450, 25, 'medium', 8, '💫'),
(5, 'Kuchli', 'Ko''proq raqamlar', 700, 30, 'medium', 9, '🔥'),
(6, 'Ustoz', 'Professional daraja', 1000, 40, 'medium', 10, '👑'),
(7, 'Ekspert', 'Qiyin masalalar', 1400, 50, 'hard', 10, '💎'),
(8, 'Legenda', 'Eng qiyin daraja', 1900, 75, 'hard', 12, '🏆'),
(9, 'Champion', 'Chempionlik', 2500, 100, 'hard', 15, '🥇'),
(10, 'Master', 'Ustoz daraja', 3200, 150, 'hard', 20, '👨‍🎓');

-- Insert default shop items
INSERT INTO public.shop_items (name, description, icon, price, category, item_type) VALUES
('Qo''shimcha jon', 'Bir marta jonni qayta tiklash', '❤️', 50, 'powerup', 'consumable'),
('2x coin', '10 daqiqa 2x coin olish', '💰', 100, 'powerup', 'consumable'),
('Vaqt to''xtatish', 'Vaqtni 5 soniyaga to''xtatish', '⏰', 75, 'powerup', 'consumable'),
('Yordam', 'Bir marta to''g''ri javobni ko''rish', '💡', 30, 'powerup', 'consumable'),
('Oltin ramka', 'Profil uchun oltin ramka', '🖼️', 500, 'avatar', 'cosmetic'),
('Kumush toj', 'Profil uchun kumush toj', '👑', 1000, 'avatar', 'cosmetic'),
('Oltin toj', 'Profil uchun oltin toj', '👑', 2500, 'avatar', 'cosmetic'),
('VIP badge', 'Maxsus VIP belgisi', '⭐', 5000, 'badge', 'cosmetic');

-- Create updated_at trigger
CREATE TRIGGER update_user_game_currency_updated_at
BEFORE UPDATE ON public.user_game_currency
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_level_progress_updated_at
BEFORE UPDATE ON public.user_level_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
