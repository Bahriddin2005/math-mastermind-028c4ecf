-- Create FAQ table for help widget
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'HelpCircle',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view active FAQ items
CREATE POLICY "Anyone can view active FAQs"
ON public.faq_items
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage FAQ items
CREATE POLICY "Admins can create FAQs"
ON public.faq_items
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update FAQs"
ON public.faq_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete FAQs"
ON public.faq_items
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_faq_items_updated_at
BEFORE UPDATE ON public.faq_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default FAQ items
INSERT INTO public.faq_items (question, answer, icon, order_index) VALUES
('Mashq qanday ishlaydi?', 'Dashboard''da ''Mashq qilish'' bo''limiga o''ting. Qiyinlik darajasini tanlang, vaqt yoki masalalar sonini belgilang va boshlang. Har bir to''g''ri javob uchun ball olasiz!', 'Calculator', 0),
('Kurslarni qanday ko''raman?', 'Menyudan ''Kurslar'' bo''limini tanlang. Video darslarni ko''ring, mashq qiling va progressingizni kuzating.', 'GraduationCap', 1),
('Leaderboard nima?', 'Leaderboard - bu haftalik eng yaxshi o''yinchilar ro''yxati. Ko''proq mashq qilsangiz, yuqori o''rinlarni egallaysiz!', 'Trophy', 2),
('Profilimni qanday o''zgartiraman?', 'Yuqori o''ng burchakdagi profil rasminni bosing va ''Sozlamalar'' bo''limiga o''ting. U yerda ism, rasm va boshqa ma''lumotlarni o''zgartirishingiz mumkin.', 'Settings', 3),
('Kunlik maqsad nima?', 'Kunlik maqsad - har kuni yechishni rejalashtirgan masalalar soni. Bu sizga doimiy mashq qilishga yordam beradi.', 'BookOpen', 4);