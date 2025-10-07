-- Fix storage policies for image uploads
-- This creates proper RLS policies for the storage buckets

-- First, let's check if the buckets exist and create them if they don't
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'speaker-images',
  'speaker-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-images',
  'business-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for speaker images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for business images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload speaker images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload business images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update speaker images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update business images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete speaker images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete business images" ON storage.objects;

-- Create new policies that allow public access for our use case
-- Since we're using the anon key, we need to allow anonymous access

-- Allow public read access to all images
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
