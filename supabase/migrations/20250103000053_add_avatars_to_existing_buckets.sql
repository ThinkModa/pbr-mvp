-- Add avatars bucket to existing storage setup
-- This follows the exact same pattern as the working speaker-images and business-images buckets

-- Create avatars bucket (using same approach as working buckets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;
