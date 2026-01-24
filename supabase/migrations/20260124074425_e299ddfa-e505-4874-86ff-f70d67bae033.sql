-- Parent email preferences table
CREATE TABLE public.parent_email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  weekly_report_enabled BOOLEAN NOT NULL DEFAULT true,
  streak_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  last_report_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Enable RLS
ALTER TABLE public.parent_email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own email preferences"
ON public.parent_email_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences"
ON public.parent_email_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences"
ON public.parent_email_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email preferences"
ON public.parent_email_preferences FOR DELETE
USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_parent_email_preferences_updated_at
BEFORE UPDATE ON public.parent_email_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();