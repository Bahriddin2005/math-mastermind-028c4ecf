-- Add parent_id column to blog_comments for replies
ALTER TABLE public.blog_comments 
ADD COLUMN parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE;

-- Create blog_likes table
CREATE TABLE public.blog_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for likes
CREATE POLICY "Anyone can view likes"
ON public.blog_likes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add likes"
ON public.blog_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
ON public.blog_likes
FOR DELETE
USING (auth.uid() = user_id);