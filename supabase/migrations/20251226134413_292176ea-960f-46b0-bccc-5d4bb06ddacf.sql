-- Create math_examples table for admin-managed math problems
CREATE TABLE public.math_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer INTEGER NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  category TEXT NOT NULL DEFAULT 'add-sub',
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  hint TEXT,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.math_examples ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active examples"
ON public.math_examples
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create examples"
ON public.math_examples
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update examples"
ON public.math_examples
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete examples"
ON public.math_examples
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_math_examples_updated_at
BEFORE UPDATE ON public.math_examples
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();