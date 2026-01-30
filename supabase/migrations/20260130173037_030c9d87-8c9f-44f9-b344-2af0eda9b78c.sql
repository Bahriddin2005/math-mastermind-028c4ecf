-- To'lov so'rovlari jadvali
CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type text NOT NULL, -- 'bolajon_monthly', 'bolajon_yearly', 'ustoz_monthly', 'ustoz_yearly'
  amount integer NOT NULL, -- so'm hisobida
  receipt_url text, -- yuklangan chek rasmi
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_note text, -- admin izohi
  reviewed_by uuid, -- tasdiqlagan admin
  reviewed_at timestamp with time zone,
  subscription_end timestamp with time zone, -- obuna tugash sanasi
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS yoqish
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Foydalanuvchilar o'z so'rovlarini ko'rishi
CREATE POLICY "Users can view own payment requests"
ON public.payment_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Foydalanuvchilar so'rov yaratishi
CREATE POLICY "Users can create payment requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Adminlar barcha so'rovlarni ko'rishi
CREATE POLICY "Admins can view all payment requests"
ON public.payment_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adminlar so'rovlarni yangilashi
CREATE POLICY "Admins can update payment requests"
ON public.payment_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adminlar so'rovlarni o'chirishi
CREATE POLICY "Admins can delete payment requests"
ON public.payment_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket yaratish (cheklar uchun)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-receipts' AND has_role(auth.uid(), 'admin'::app_role));