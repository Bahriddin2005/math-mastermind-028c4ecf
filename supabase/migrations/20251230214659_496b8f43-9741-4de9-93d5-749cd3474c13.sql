-- Create table for team members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can view team members)
CREATE POLICY "Team members are viewable by everyone" 
ON public.team_members 
FOR SELECT 
USING (is_active = true);

-- Create policy for admin full access
CREATE POLICY "Admins can manage team members" 
ON public.team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial team members
INSERT INTO public.team_members (name, role, description, order_index) VALUES
('Safarbek Solijonov', 'O''qituvchi', '4 yillik dasturlash sohasidagi tajriba va ko''plab loyihalar dasturchi. Undan tashqari o''quvchilari yaxshi natijalar ko''rsatib kelmoqda', 1),
('Jamshid Karimov', 'Mental arifmetika ustozi', '8 yillik tajribaga ega professional o''qituvchi. Xalqaro musobaqalar g''olibi va 500+ o''quvchilarni tayyorlagan', 2),
('Dilnoza Rahimova', 'Metodist', 'Ta''lim sohasida 10 yillik tajriba. Zamonaviy o''qitish metodlarini ishlab chiqish va joriy etish bo''yicha mutaxassis', 3);