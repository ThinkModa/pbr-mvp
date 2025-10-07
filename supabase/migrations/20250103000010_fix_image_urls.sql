-- Fix image URLs for speakers and businesses
-- Update with more reliable image URLs

-- Update speaker profile images
UPDATE speakers 
SET profile_image_url = 'https://i.pravatar.cc/400?img=1'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE speakers 
SET profile_image_url = 'https://i.pravatar.cc/400?img=2'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE speakers 
SET profile_image_url = 'https://i.pravatar.cc/400?img=3'
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Update business logos
UPDATE businesses 
SET logo_url = 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=TC'
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE businesses 
SET logo_url = 'https://via.placeholder.com/200x200/059669/FFFFFF?text=SI'
WHERE id = '55555555-5555-5555-5555-555555555555';

UPDATE businesses 
SET logo_url = 'https://via.placeholder.com/200x200/DC2626/FFFFFF?text=DS'
WHERE id = '66666666-6666-6666-6666-666666666666';
