-- Add storage policies for team-members folder (admin only)
CREATE POLICY "Admins can upload team member avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team-members'
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update team member avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team-members'
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete team member avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team-members'
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Team member avatars are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team-members'
);