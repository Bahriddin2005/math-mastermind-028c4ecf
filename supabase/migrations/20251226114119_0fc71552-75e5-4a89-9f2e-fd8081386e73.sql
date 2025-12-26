-- Add daily goal column to profiles
ALTER TABLE public.profiles 
ADD COLUMN daily_goal integer DEFAULT 20;

-- Add last_active_date for tracking streaks
ALTER TABLE public.profiles 
ADD COLUMN last_active_date date;

-- Add current_streak column
ALTER TABLE public.profiles 
ADD COLUMN current_streak integer DEFAULT 0;