-- Create avatars storage bucket for profile images
-- This creates the necessary storage bucket for user profile images

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for avatars bucket (using same permissive approach as other buckets)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Allow public read access to all images (including avatars)
CREATE POLICY "Public read access for all images" ON storage.objects
FOR SELECT USING (true);

-- Allow anonymous users to upload images (for our testing environment)
CREATE POLICY "Anonymous users can upload images" ON storage.objects
FOR INSERT WITH CHECK (true);

-- Allow anonymous users to update images
CREATE POLICY "Anonymous users can update images" ON storage.objects
FOR UPDATE USING (true);

-- Allow anonymous users to delete images
CREATE POLICY "Anonymous users can delete images" ON storage.objects
FOR DELETE USING (true);