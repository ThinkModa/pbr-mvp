-- Seed professional categories and community interests
-- This migration populates the lookup tables with 20 options each

-- Insert professional categories
INSERT INTO professional_categories (name, description, sort_order) VALUES
('Technology', 'Software development, IT, and tech-related fields', 1),
('Engineering', 'Various engineering disciplines and technical roles', 2),
('Healthcare', 'Medical, nursing, and healthcare professions', 3),
('Education', 'Teaching, training, and educational services', 4),
('Finance', 'Banking, investment, and financial services', 5),
('Marketing', 'Digital marketing, advertising, and brand management', 6),
('Sales', 'Business development and sales roles', 7),
('Design', 'Graphic design, UX/UI, and creative fields', 8),
('Consulting', 'Business consulting and advisory services', 9),
('Legal', 'Law, compliance, and legal services', 10),
('Real Estate', 'Property management and real estate services', 11),
('Non-Profit', 'Charitable organizations and social impact', 12),
('Government', 'Public sector and government roles', 13),
('Media', 'Journalism, broadcasting, and media production', 14),
('Retail', 'Retail management and customer service', 15),
('Manufacturing', 'Production, operations, and manufacturing', 16),
('Transportation', 'Logistics, shipping, and transportation', 17),
('Construction', 'Building, contracting, and construction trades', 18),
('Agriculture', 'Farming, food production, and agricultural services', 19),
('Other', 'Other professional categories not listed above', 20)
ON CONFLICT (name) DO NOTHING;

-- Insert community interests
INSERT INTO community_interests (name, description, sort_order) VALUES
('Social Justice', 'Advocacy for equality and social change', 1),
('Education', 'Supporting educational initiatives and learning', 2),
('Health & Wellness', 'Physical and mental health advocacy', 3),
('Environment', 'Environmental protection and sustainability', 4),
('Arts & Culture', 'Supporting local arts and cultural events', 5),
('Technology', 'Tech innovation and digital literacy', 6),
('Community Development', 'Building stronger local communities', 7),
('Youth Development', 'Supporting children and young adults', 8),
('Senior Care', 'Supporting elderly community members', 9),
('Housing', 'Affordable housing and homelessness advocacy', 10),
('Food Security', 'Addressing hunger and food access issues', 11),
('Economic Development', 'Supporting local business and entrepreneurship', 12),
('Civic Engagement', 'Political participation and civic involvement', 13),
('Sports & Recreation', 'Community sports and recreational activities', 14),
('Animal Welfare', 'Supporting animal rescue and welfare', 15),
('Veterans Support', 'Supporting military veterans and families', 16),
('Immigration', 'Supporting immigrant and refugee communities', 17),
('Disability Advocacy', 'Supporting people with disabilities', 18),
('LGBTQ+ Rights', 'Supporting LGBTQ+ community and rights', 19),
('Other', 'Other community interests not listed above', 20)
ON CONFLICT (name) DO NOTHING;

-- Add some sample event attendance data for testing
-- This will create attendance records for the existing PBR Meetup #1 event
INSERT INTO user_event_attendance (user_id, event_id, attended_at, check_in_time, check_out_time)
SELECT 
    u.id as user_id,
    e.id as event_id,
    NOW() - INTERVAL '1 day' as attended_at,
    NOW() - INTERVAL '1 day' + INTERVAL '30 minutes' as check_in_time,
    NOW() - INTERVAL '1 day' + INTERVAL '2 hours' as check_out_time
FROM users u
CROSS JOIN events e
WHERE u.email = 'admin@pbr.com' 
  AND e.title = 'PBR Meetup #1'
ON CONFLICT (user_id, event_id) DO NOTHING;

