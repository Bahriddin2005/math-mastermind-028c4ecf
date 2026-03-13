
-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to recordings
CREATE POLICY "Recordings are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'recordings');

-- Allow authenticated users to upload recordings  
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recordings' AND auth.role() = 'authenticated');

-- Add egress_id column to live_sessions for tracking active recording
ALTER TABLE public.live_sessions 
ADD COLUMN IF NOT EXISTS egress_id TEXT DEFAULT NULL;
