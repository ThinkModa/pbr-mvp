-- Seed data for speakers and businesses
-- This adds sample speakers and businesses for testing

-- Insert sample speakers
INSERT INTO speakers (
    id, organization_id, first_name, last_name, email, title, company, bio, expertise, 
    profile_image_url, social_links, is_public, allow_contact
) VALUES 
(
    '11111111-1111-1111-1111-111111111111', 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    'Sarah', 
    'Johnson', 
    'sarah.johnson@techcorp.com', 
    'Senior Software Engineer', 
    'TechCorp', 
    'Sarah is a passionate software engineer with 8+ years of experience in full-stack development. She specializes in React, Node.js, and cloud architecture.',
    '["React", "Node.js", "Cloud Architecture", "Full-Stack Development"]'::jsonb,
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    '{"linkedin": "https://linkedin.com/in/sarahjohnson", "twitter": "@sarahj_dev", "github": "sarahjohnson"}'::jsonb,
    true, true
),
(
    '22222222-2222-2222-2222-222222222222', 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    'Michael', 
    'Chen', 
    'michael.chen@startup.io', 
    'CTO & Co-Founder', 
    'StartupIO', 
    'Michael is a serial entrepreneur and technology leader with expertise in scaling engineering teams and building innovative products.',
    '["Leadership", "Product Strategy", "Team Building", "Startups"]'::jsonb,
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    '{"linkedin": "https://linkedin.com/in/michaelchen", "twitter": "@mchen_cto"}'::jsonb,
    true, true
),
(
    '33333333-3333-3333-3333-333333333333', 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    'Emily', 
    'Rodriguez', 
    'emily.rodriguez@designstudio.com', 
    'UX Design Director', 
    'Design Studio', 
    'Emily is a design leader focused on creating user-centered experiences that drive business growth and user satisfaction.',
    '["UX Design", "User Research", "Design Systems", "Product Design"]'::jsonb,
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    '{"linkedin": "https://linkedin.com/in/emilyrodriguez", "twitter": "@emily_ux"}'::jsonb,
    true, true
);

-- Insert sample businesses
INSERT INTO businesses (
    id, organization_id, name, description, industry, size, email, website, 
    logo_url, social_links, founded_year, employee_count, services, products,
    is_public, allow_contact, is_sponsor
) VALUES 
(
    '44444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'TechCorp Solutions',
    'Leading provider of enterprise software solutions and cloud infrastructure services.',
    'Technology',
    'large',
    'contact@techcorp.com',
    'https://techcorp.com',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200',
    '{"linkedin": "https://linkedin.com/company/techcorp", "twitter": "@techcorp"}'::jsonb,
    2010,
    500,
    '["Cloud Infrastructure", "Enterprise Software", "Consulting", "Support"]'::jsonb,
    '["Cloud Platform", "CRM Software", "Analytics Dashboard"]'::jsonb,
    true, true, true
),
(
    '55555555-5555-5555-5555-555555555555',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'StartupIO',
    'Innovative startup building the next generation of productivity tools for remote teams.',
    'Technology',
    'startup',
    'hello@startup.io',
    'https://startup.io',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=200',
    '{"linkedin": "https://linkedin.com/company/startupio", "twitter": "@startupio"}'::jsonb,
    2022,
    25,
    '["Product Development", "Remote Work Tools", "Team Collaboration"]'::jsonb,
    '["Project Management App", "Team Chat Platform", "Time Tracking Tool"]'::jsonb,
    true, true, false
),
(
    '66666666-6666-6666-6666-666666666666',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Design Studio',
    'Creative agency specializing in user experience design and brand identity.',
    'Design',
    'small',
    'studio@designstudio.com',
    'https://designstudio.com',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200',
    '{"linkedin": "https://linkedin.com/company/designstudio", "instagram": "@designstudio"}'::jsonb,
    2018,
    15,
    '["UX Design", "Brand Identity", "Web Design", "Design Consulting"]'::jsonb,
    '["Design System", "Brand Guidelines", "Website Templates"]'::jsonb,
    true, true, false
);

-- Insert business contacts
INSERT INTO business_contacts (
    id, business_id, first_name, last_name, email, title, role, is_primary
) VALUES 
(
    '77777777-7777-7777-7777-777777777777',
    '44444444-4444-4444-4444-444444444444',
    'David',
    'Wilson',
    'david.wilson@techcorp.com',
    'VP of Business Development',
    'manager',
    true
),
(
    '88888888-8888-8888-8888-888888888888',
    '55555555-5555-5555-5555-555555555555',
    'Lisa',
    'Park',
    'lisa.park@startup.io',
    'Head of Marketing',
    'manager',
    true
),
(
    '99999999-9999-9999-9999-999999999999',
    '66666666-6666-6666-6666-666666666666',
    'Alex',
    'Thompson',
    'alex.thompson@designstudio.com',
    'Creative Director',
    'owner',
    true
);

-- Add speakers to existing events
INSERT INTO event_speakers (
    id, event_id, speaker_id, role, session_title, session_description, 
    display_order, is_confirmed, is_public
) VALUES 
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- PBR Meetup #1
    '11111111-1111-1111-1111-111111111111',
    'speaker',
    'Building Scalable React Applications',
    'Learn best practices for building large-scale React applications with proper state management and performance optimization.',
    1,
    true,
    true
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- PBR Meetup #1
    '22222222-2222-2222-2222-222222222222',
    'moderator',
    'Panel Discussion: Future of Tech',
    'Moderating a panel discussion about emerging technologies and their impact on the industry.',
    2,
    true,
    true
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- PBR Meetup #1 (using same event)
    '33333333-3333-3333-3333-333333333333',
    'speaker',
    'Design Systems That Scale',
    'Creating and maintaining design systems that grow with your product and team.',
    3,
    true,
    true
);

-- Add businesses to existing events
INSERT INTO event_businesses (
    id, event_id, business_id, role, sponsorship_level, display_order, 
    is_featured, is_confirmed, is_public
) VALUES 
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- PBR Meetup #1
    '44444444-4444-4444-4444-444444444444',
    'sponsor',
    'gold',
    1,
    true,
    true,
    true
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- PBR Meetup #1
    '55555555-5555-5555-5555-555555555555',
    'participant',
    null,
    2,
    false,
    true,
    true
),
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- PBR Meetup #1 (using same event)
    '66666666-6666-6666-6666-666666666666',
    'sponsor',
    'silver',
    3,
    true,
    true,
    true
);
