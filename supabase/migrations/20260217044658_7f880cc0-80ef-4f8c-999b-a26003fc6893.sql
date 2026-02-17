-- Add teacher_status to profiles for approval flow
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS teacher_status text DEFAULT NULL;

-- Create index for teacher approval queries
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_status ON public.profiles (teacher_status) WHERE teacher_status IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.teacher_status IS 'NULL = not a teacher, pending = awaiting approval, approved = active teacher, rejected = rejected';
