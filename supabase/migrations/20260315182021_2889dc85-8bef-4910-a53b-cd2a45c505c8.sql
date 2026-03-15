
-- Create a secure view that hides zoom_start_url and zoom_password from non-owners
CREATE OR REPLACE VIEW public.live_sessions_safe AS
SELECT
  id, teacher_id, scheduled_at, started_at, ended_at,
  max_participants, is_recurring, created_at, updated_at,
  is_locked, is_recording, recording_duration, course_id,
  title, description, status, room_name, recurrence_rule,
  recording_url, meeting_type, egress_id,
  zoom_meeting_id,
  zoom_join_url,
  -- Only expose zoom_start_url to session owner or admin
  CASE
    WHEN teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin') THEN zoom_start_url
    ELSE NULL
  END AS zoom_start_url,
  -- Only expose zoom_password to session owner or admin
  CASE
    WHEN teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin') THEN zoom_password
    ELSE NULL
  END AS zoom_password
FROM public.live_sessions;
