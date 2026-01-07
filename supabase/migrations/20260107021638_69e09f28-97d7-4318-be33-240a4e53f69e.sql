-- Create table for storing generated problem sheets
CREATE TABLE public.problem_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  digit_count INTEGER NOT NULL DEFAULT 1,
  operation_count INTEGER NOT NULL DEFAULT 8,
  formula_type TEXT NOT NULL DEFAULT 'formulasiz',
  problem_count INTEGER NOT NULL DEFAULT 50,
  columns_per_row INTEGER NOT NULL DEFAULT 10,
  problems JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.problem_sheets ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own sheets" 
ON public.problem_sheets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sheets" 
ON public.problem_sheets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sheets" 
ON public.problem_sheets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sheets" 
ON public.problem_sheets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_problem_sheets_updated_at
BEFORE UPDATE ON public.problem_sheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_problem_sheets_user_id ON public.problem_sheets(user_id);
CREATE INDEX idx_problem_sheets_created_at ON public.problem_sheets(created_at DESC);