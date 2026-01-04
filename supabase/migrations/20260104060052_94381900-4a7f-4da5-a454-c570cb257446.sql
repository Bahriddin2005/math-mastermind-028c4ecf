-- Profilga tanlangan ramka va VIP status qo'shish
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_frame TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Inventarga aktiv status qo'shish
ALTER TABLE public.user_inventory 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;