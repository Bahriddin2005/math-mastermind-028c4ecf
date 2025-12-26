-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  practice_config JSONB DEFAULT '{"enabled": true, "difficulty": "easy", "problems_count": 5}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson questions (Q&A) table
CREATE TABLE public.lesson_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.lesson_questions(id) ON DELETE CASCADE,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user lesson progress table
CREATE TABLE public.user_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  watched_seconds INTEGER DEFAULT 0,
  practice_score INTEGER,
  practice_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Courses policies (everyone can view published, admins can manage)
CREATE POLICY "Anyone can view published courses" 
ON public.courses FOR SELECT 
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create courses" 
ON public.courses FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courses" 
ON public.courses FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete courses" 
ON public.courses FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Lessons policies
CREATE POLICY "Anyone can view published lessons" 
ON public.lessons FOR SELECT 
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create lessons" 
ON public.lessons FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lessons" 
ON public.lessons FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lessons" 
ON public.lessons FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Lesson questions policies
CREATE POLICY "Anyone can view questions" 
ON public.lesson_questions FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can add questions" 
ON public.lesson_questions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions" 
ON public.lesson_questions FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own questions" 
ON public.lesson_questions FOR DELETE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- User lesson progress policies
CREATE POLICY "Users can view own progress" 
ON public.user_lesson_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" 
ON public.user_lesson_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
ON public.user_lesson_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- Create storage bucket for course videos
INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', true);

-- Storage policies for course videos
CREATE POLICY "Anyone can view course videos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'course-videos');

CREATE POLICY "Admins can upload course videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'course-videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update course videos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'course-videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete course videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'course-videos' AND has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_questions_updated_at
BEFORE UPDATE ON public.lesson_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_lesson_progress_updated_at
BEFORE UPDATE ON public.user_lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();