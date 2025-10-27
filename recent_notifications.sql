SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict mPwvTZd9Ljpu0QAlMrybiVBYSfz0EGtRWY2r7Fc8VPSs2U5lCoQVMqeq7lM9Ayv

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: activity_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."activity_categories" ("id", "name", "description", "color", "icon", "is_active", "display_order", "created_at", "updated_at") VALUES
	('aaf19dd1-9efe-4c4e-9989-b8ee3c7a9d8e', 'General', 'General activities and sessions', '#3B82F6', '📋', true, 1, '2025-10-27 04:27:47.119932+00', '2025-10-27 04:27:47.119932+00'),
	('78256b11-a13b-49f4-856c-4b2aca3bd648', 'Keynote', 'Keynote presentations and talks', '#EF4444', '🎤', true, 2, '2025-10-27 04:27:47.119932+00', '2025-10-27 04:27:47.119932+00'),
	('9948be61-1bb0-4b50-a9e4-dc7bebaa3357', 'Workshop', 'Hands-on workshops and training', '#10B981', '🔧', true, 3, '2025-10-27 04:27:47.119932+00', '2025-10-27 04:27:47.119932+00'),
	('b88aa338-0ffa-4640-bd79-3e5ac422ab38', 'Networking', 'Networking and social activities', '#F59E0B', '🤝', true, 4, '2025-10-27 04:27:47.119932+00', '2025-10-27 04:27:47.119932+00'),
	('37abb7a4-dfb6-4977-b2b3-43da3f13a2bf', 'Break', 'Breaks, meals, and downtime', '#6B7280', '☕', true, 5, '2025-10-27 04:27:47.119932+00', '2025-10-27 04:27:47.119932+00'),
	('f9ee0757-18a4-482b-b809-83288624e86e', 'Panel', 'Panel discussions and Q&A', '#8B5CF6', '💬', true, 6, '2025-10-27 04:27:47.119932+00', '2025-10-27 04:27:47.119932+00'),
	('a2db543d-f933-4d59-83be-6edc63829d7b', 'Demo', 'Product demos and showcases', '#EC4899', '🚀', true, 7, '2025-10-27 04:27:47.119932+00', '2025-10-27 04:27:47.119932+00'),
	('23c2f02a-f4ed-430e-a731-af7e48d1bb4d', 'Training', 'Educational and training sessions', '#06B6D4', '📚', true, 8, '2025-10-27 04:27:47.119932+00', '2025-10-27 04:27:47.119932+00');


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organizations" ("id", "name", "slug", "description", "logo_url", "website", "email", "phone", "address", "business_hours", "is_active", "created_at", "updated_at", "industry", "size", "founded_year", "is_public", "allow_contact", "is_sponsor", "tags", "metadata") VALUES
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PBR Community', 'pbr-community', 'The main PBR community organization', NULL, NULL, 'hello@pbr.com', NULL, NULL, '{"friday": {"open": "09:00", "close": "17:00", "closed": false}, "monday": {"open": "09:00", "close": "17:00", "closed": false}, "sunday": {"open": "10:00", "close": "16:00", "closed": false}, "tuesday": {"open": "09:00", "close": "17:00", "closed": false}, "saturday": {"open": "10:00", "close": "16:00", "closed": false}, "thursday": {"open": "09:00", "close": "17:00", "closed": false}, "wednesday": {"open": "09:00", "close": "17:00", "closed": false}}', true, '2025-10-27 04:27:46.699935', '2025-10-27 04:27:46.699935', 'Technology', 'medium', 2020, true, true, false, '["community", "events", "networking"]', '{}'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TechCorp Solutions', 'techcorp-solutions', 'Leading technology solutions provider', NULL, 'https://techcorp.com', 'info@techcorp.com', NULL, NULL, '{"friday": {"open": "09:00", "close": "17:00", "closed": false}, "monday": {"open": "09:00", "close": "17:00", "closed": false}, "sunday": {"open": "10:00", "close": "16:00", "closed": false}, "tuesday": {"open": "09:00", "close": "17:00", "closed": false}, "saturday": {"open": "10:00", "close": "16:00", "closed": false}, "thursday": {"open": "09:00", "close": "17:00", "closed": false}, "wednesday": {"open": "09:00", "close": "17:00", "closed": false}}', true, '2025-10-27 04:27:47.014625', '2025-10-27 04:27:47.014625', 'Technology', 'large', 2015, true, true, true, '["technology", "enterprise", "sponsor"]', '{}'),
	('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Design Studio', 'design-studio', 'Creative design and branding agency', NULL, 'https://designstudio.com', 'hello@designstudio.com', NULL, NULL, '{"friday": {"open": "09:00", "close": "17:00", "closed": false}, "monday": {"open": "09:00", "close": "17:00", "closed": false}, "sunday": {"open": "10:00", "close": "16:00", "closed": false}, "tuesday": {"open": "09:00", "close": "17:00", "closed": false}, "saturday": {"open": "10:00", "close": "16:00", "closed": false}, "thursday": {"open": "09:00", "close": "17:00", "closed": false}, "wednesday": {"open": "09:00", "close": "17:00", "closed": false}}', true, '2025-10-27 04:27:47.014625', '2025-10-27 04:27:47.014625', 'Design', 'small', 2018, true, true, true, '["design", "creative", "sponsor"]', '{}');


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."events" ("id", "title", "description", "slug", "status", "organization_id", "start_time", "end_time", "timezone", "location", "max_capacity", "current_rsvps", "is_free", "price", "cover_image_url", "gallery_urls", "allow_waitlist", "require_approval", "is_public", "tags", "metadata", "created_at", "updated_at", "show_capacity", "show_price", "show_attendee_count", "has_tracks") VALUES
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PBR Meetup #1', 'Our first community meetup!', 'pbr-meetup-1', 'published', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-03 04:27:46.699935', '2025-11-03 07:27:46.699935', 'UTC', NULL, NULL, 0, true, NULL, NULL, '[]', true, false, true, '[]', '{}', '2025-10-27 04:27:46.699935', '2025-10-27 04:27:46.699935', true, true, true, false),
	('840b8aac-424a-4fd0-90b8-9985840d26f8', 'Know Us: Atlanta 2025', 'A three-day community, culture, and impact summit that brings you closer - to place, to purpose, and to the people shaping what’s next.', 'know-us--atlanta-2025', 'published', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-07 15:00:00', '2025-11-10 15:00:00', 'UTC', '{"name": "Atlanta", "address": "Atlanta, GA, USA", "placeId": "ChIJjQmTaV0E9YgRC2MLmS_e_mY", "coordinates": {"lat": 33.7501275, "lng": -84.3885209}}', NULL, 0, true, NULL, '', '[]', true, false, true, '[]', '{}', '2025-10-24 00:08:46.832227', '2025-10-26 06:07:51.351', true, false, true, true);


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."activities" ("id", "event_id", "title", "description", "start_time", "end_time", "location", "max_capacity", "current_rsvps", "is_required", "order", "created_at", "updated_at", "category_id", "location_name") VALUES
	('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Welcome & Introductions', 'Get to know the community', '2025-11-03 04:27:46.699935', '2025-11-03 04:57:46.699935', NULL, NULL, 0, false, 1, '2025-10-27 04:27:46.699935', '2025-10-27 04:27:46.699935', NULL, NULL),
	('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Main Discussion', 'Discuss PBR topics', '2025-11-03 05:27:46.699935', '2025-11-03 06:27:46.699935', NULL, NULL, 0, false, 2, '2025-10-27 04:27:46.699935', '2025-10-27 04:27:46.699935', NULL, NULL),
	('572ae563-1876-4a55-b0ed-599003a92864', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'Hear Us: Community & Culture Conversation', 'Here directly from community members, stakeholders, artists, activists, and leaders who are shaping Atlanta one action at a time. ', '2025-11-07 18:00:00', '2025-11-12 21:00:00', '{"address": "One Contemporary Gallery"}', NULL, 0, false, 0, '2025-10-26 06:07:51.64867', '2025-10-26 06:07:51.64867', NULL, 'One Contemporary Gallery'),
	('90cb4b1d-b8d5-46fe-b5e3-70de79a48026', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'Martin Luther King Jr. National Park Visit', 'Come experience the historic site where Martin Luther King Jr. is laid to rest and learn more about how he transformed the history of America as we all know it today. ', '2025-11-07 15:30:00', '2025-11-07 17:00:00', '{"address": "Martin Luther King, Jr. National Historical Park"}', NULL, 0, false, 0, '2025-10-26 06:07:51.64867', '2025-10-26 06:07:51.64867', NULL, 'Martin Luther King, Jr. National Historical Park'),
	('0fc9e6b8-4086-468e-9b9c-0f7157181b3d', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'Know Us Tribe Breakfast & Refresh', 'Join us for a morning breakfast to get energized for a day of community culture and experiences. ', '2025-11-08 08:00:00', '2025-11-08 09:00:00', '{"address": "110 Mitchell St SW, Atlanta, GA 30303, USA", "placeId": "ChIJEWRKvh0D9YgRWNIsHem4pU0", "coordinates": {"lat": 33.7499887, "lng": -84.3917077}}', NULL, 0, false, 0, '2025-10-26 06:07:51.64867', '2025-10-26 06:07:51.64867', NULL, 'Origin Atlanta, a Wyndham Hotel'),
	('98805beb-2136-44e0-a103-50fb448c7813', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'Morning Movement - Pilates', 'Get moving this morning with a Pilates session for the culture. ', '2025-11-08 08:30:00', '2025-11-08 09:30:00', '{"address": "KKRU Pilates Studio & Wellness"}', NULL, 0, false, 0, '2025-10-26 06:07:51.64867', '2025-10-26 06:07:51.64867', NULL, 'KKRU Pilates Studio & Wellness'),
	('ef851a6a-63cd-4a6a-ba1c-beafa933d481', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'Coffee and Refreshments for the Culture." ', 'After some morning movement, come have a fresh coffee or tea to get your brain stimulated and further grow your bonds in your tribe. ', '2025-11-08 09:30:00', '2025-11-08 10:00:00', '{"address": "Portrait Coffee"}', NULL, 0, false, 0, '2025-10-26 06:07:51.64867', '2025-10-26 06:07:51.64867', NULL, 'Portrait Coffee'),
	('cbf9f849-18a3-40d5-a0f9-2502c46eae71', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'Morning Tea and Revitalization', 'Stimulate your mind before activating your body with a refreshing tea in the community. ', '2025-11-08 08:30:00', '2025-11-08 09:30:00', '{"address": "348 Auburn Ave NE"}', NULL, 0, false, 0, '2025-10-26 06:07:51.64867', '2025-10-26 06:07:51.64867', NULL, '348 Auburn Ave NE'),
	('018e61a3-0ab6-405e-878c-9ba353472af5', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'Historic BeltLine Walking Tour', 'Join us on the West Side for a historic walking tour along the BeltLine, learning about its development, impact, and future state. ', '2025-11-08 10:30:00', '2025-11-08 12:00:00', '{"address": "Beltline Bridge @ Ponce City Market"}', NULL, 0, false, 0, '2025-10-26 06:07:51.64867', '2025-10-26 06:07:51.64867', NULL, 'Beltline Bridge @ Ponce City Market'),
	('8999733d-945a-4c0c-ac1d-839dcbda5d9c', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'Food and Housing Justice Conversation', 'Learn about the state of food and housing in Atlanta. Learn what they''re doing to solve for the issues that persist, and how we can turn it into a national model. ', '2025-11-08 10:30:00', '2025-11-08 12:00:00', '{"address": "Goodr Community Market on Edgewood"}', NULL, 0, false, 0, '2025-10-26 06:07:51.64867', '2025-10-26 06:07:51.64867', NULL, 'Goodr Community Market on Edgewood'),
	('da706f55-e172-4373-95a2-39a52a8eaa86', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'The Power Behind the Hustle', 'Learn what it takes to hustle and grow your business in Atlanta and beyond. Hear from real entrepreneurs and experience them as they showcase their businesses. ', '2025-11-08 13:00:00', '2025-11-08 15:00:00', '{"address": "Visa Inc. Atlanta Office"}', NULL, 0, false, 0, '2025-10-26 06:07:51.64867', '2025-10-26 06:07:51.64867', NULL, 'Visa Inc. Atlanta Office');


--
-- Data for Name: activity_organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "email", "name", "avatar_url", "role", "is_active", "preferences", "last_login_at", "created_at", "updated_at", "first_name", "last_name", "phone_number", "t_shirt_size", "dietary_restrictions", "accessibility_needs", "bio", "organization_affiliation", "title_position", "points", "status", "invited_at", "activated_at", "import_batch_id", "notification_preferences") VALUES
	('11111111-1111-1111-1111-111111111111', 'admin@pbr.com', 'Admin User', NULL, 'admin', true, '{"privacy": {"showEmail": false, "showPhone": false}, "notifications": {"chat": true, "push": true, "email": true}}', NULL, '2025-10-27 04:27:46.699935', '2025-10-27 04:27:46.699935', 'Admin', 'User', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'active', NULL, NULL, NULL, '{"chat_enabled": true, "push_enabled": true, "events_enabled": true}'),
	('22222222-2222-2222-2222-222222222222', 'business@pbr.com', 'Business Owner', NULL, 'business', true, '{"privacy": {"showEmail": false, "showPhone": false}, "notifications": {"chat": true, "push": true, "email": true}}', NULL, '2025-10-27 04:27:46.699935', '2025-10-27 04:27:46.699935', 'Business', 'Owner', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'active', NULL, NULL, NULL, '{"chat_enabled": true, "push_enabled": true, "events_enabled": true}'),
	('33333333-3333-3333-3333-333333333333', 'user@pbr.com', 'Regular User', NULL, 'general', true, '{"privacy": {"showEmail": false, "showPhone": false}, "notifications": {"chat": true, "push": true, "email": true}}', NULL, '2025-10-27 04:27:46.699935', '2025-10-27 04:27:46.699935', 'Regular', 'User', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'active', NULL, NULL, NULL, '{"chat_enabled": true, "push_enabled": true, "events_enabled": true}'),
	('44444444-4444-4444-4444-444444444444', 'david@example.com', 'David Wilson', NULL, 'general', true, '{"privacy": {"showEmail": false, "showPhone": false}, "notifications": {"chat": true, "push": true, "email": true}}', NULL, '2025-10-27 04:27:47.314243', '2025-10-27 04:27:47.314243', 'David', 'Wilson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'active', NULL, NULL, NULL, '{"chat_enabled": true, "push_enabled": true, "events_enabled": true}'),
	('55555555-5555-5555-5555-555555555555', 'rahwalton9@gmail.com', 'Rod Walton', NULL, 'admin', true, '{"privacy": {"showEmail": false, "showPhone": false}, "notifications": {"chat": true, "push": true, "email": true}}', NULL, '2025-10-27 04:27:47.663444', '2025-10-27 04:27:47.663444', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'active', NULL, NULL, NULL, '{"chat_enabled": true, "push_enabled": true, "events_enabled": true}'),
	('6fc36b62-03a9-4e6b-8478-acc1c443ff36', 'shakori@plantbuildrestore.com', 'Shakori Fletcher Walton', NULL, 'general', true, '{"privacy": {"showEmail": false, "showPhone": false}, "notifications": {"chat": true, "push": true, "email": true}}', NULL, '2025-10-27 04:28:50.498057', '2025-10-27 04:44:46.92958', 'Shakori', 'Walton', '9189245355', 'S', 'None', 'None', NULL, NULL, NULL, 0, 'active', NULL, NULL, NULL, '{"chat_enabled": true, "push_enabled": true, "events_enabled": true}'),
	('9e7d5754-0de9-4b5f-8952-2cc39ae455d2', 'craigsinter@gmail.com', 'Craigs Inters', NULL, 'admin', true, '{"privacy": {"showEmail": false, "showPhone": false}, "notifications": {"chat": true, "push": true, "email": true}}', NULL, '2025-10-27 04:44:28.45206', '2025-10-27 04:47:16.222823', 'Chevy', 'Chase', '4122677759', 'L', 'None', 'None', NULL, NULL, NULL, 0, 'active', NULL, NULL, NULL, '{"chat_enabled": true, "push_enabled": true, "events_enabled": true}');


--
-- Data for Name: activity_rsvps; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."speakers" ("id", "organization_id", "first_name", "last_name", "email", "phone", "title", "company", "bio", "expertise", "profile_image_url", "headshot_url", "social_links", "is_public", "allow_contact", "tags", "metadata", "created_at", "updated_at") VALUES
	('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sarah', 'Johnson', 'sarah.johnson@techcorp.com', NULL, 'Senior Software Engineer', 'TechCorp', 'Sarah is a passionate software engineer with 8+ years of experience in full-stack development. She specializes in React, Node.js, and cloud architecture.', '["React", "Node.js", "Cloud Architecture", "Full-Stack Development"]', 'https://i.pravatar.cc/400?img=1', NULL, '{"github": "sarahjohnson", "twitter": "@sarahj_dev", "linkedin": "https://linkedin.com/in/sarahjohnson"}', true, true, '[]', '{}', '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.939483+00'),
	('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Michael', 'Chen', 'michael.chen@startup.io', NULL, 'CTO & Co-Founder', 'StartupIO', 'Michael is a serial entrepreneur and technology leader with expertise in scaling engineering teams and building innovative products.', '["Leadership", "Product Strategy", "Team Building", "Startups"]', 'https://i.pravatar.cc/400?img=2', NULL, '{"twitter": "@mchen_cto", "linkedin": "https://linkedin.com/in/michaelchen"}', true, true, '[]', '{}', '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.939483+00'),
	('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Emily', 'Rodriguez', 'emily.rodriguez@designstudio.com', NULL, 'UX Design Director', 'Design Studio', 'Emily is a design leader focused on creating user-centered experiences that drive business growth and user satisfaction.', '["UX Design", "User Research", "Design Systems", "Product Design"]', 'https://i.pravatar.cc/400?img=3', NULL, '{"twitter": "@emily_ux", "linkedin": "https://linkedin.com/in/emilyrodriguez"}', true, true, '[]', '{}', '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.939483+00');


--
-- Data for Name: activity_speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."businesses" ("id", "organization_id", "name", "description", "industry", "size", "email", "phone", "website", "address", "logo_url", "cover_image_url", "gallery_urls", "social_links", "founded_year", "employee_count", "revenue", "services", "products", "is_public", "allow_contact", "is_sponsor", "tags", "metadata", "created_at", "updated_at") VALUES
	('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TechCorp Solutions', 'Leading provider of enterprise software solutions and cloud infrastructure services.', 'Technology', 'large', 'contact@techcorp.com', NULL, 'https://techcorp.com', NULL, 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=TC', NULL, '[]', '{"twitter": "@techcorp", "linkedin": "https://linkedin.com/company/techcorp"}', 2010, 500, NULL, '["Cloud Infrastructure", "Enterprise Software", "Consulting", "Support"]', '["Cloud Platform", "CRM Software", "Analytics Dashboard"]', true, true, true, '[]', '{}', '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.939483+00'),
	('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'StartupIO', 'Innovative startup building the next generation of productivity tools for remote teams.', 'Technology', 'startup', 'hello@startup.io', NULL, 'https://startup.io', NULL, 'https://via.placeholder.com/200x200/059669/FFFFFF?text=SI', NULL, '[]', '{"twitter": "@startupio", "linkedin": "https://linkedin.com/company/startupio"}', 2022, 25, NULL, '["Product Development", "Remote Work Tools", "Team Collaboration"]', '["Project Management App", "Team Chat Platform", "Time Tracking Tool"]', true, true, false, '[]', '{}', '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.939483+00'),
	('66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Design Studio', 'Creative agency specializing in user experience design and brand identity.', 'Design', 'small', 'studio@designstudio.com', NULL, 'https://designstudio.com', NULL, 'https://via.placeholder.com/200x200/DC2626/FFFFFF?text=DS', NULL, '[]', '{"linkedin": "https://linkedin.com/company/designstudio", "instagram": "@designstudio"}', 2018, 15, NULL, '["UX Design", "Brand Identity", "Web Design", "Design Consulting"]', '["Design System", "Brand Guidelines", "Website Templates"]', true, true, false, '[]', '{}', '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.939483+00');


--
-- Data for Name: business_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."business_contacts" ("id", "business_id", "first_name", "last_name", "email", "phone", "title", "role", "is_primary", "is_public", "allow_contact", "created_at", "updated_at") VALUES
	('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'David', 'Wilson', 'david.wilson@techcorp.com', NULL, 'VP of Business Development', 'manager', true, true, true, '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.883627+00'),
	('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'Lisa', 'Park', 'lisa.park@startup.io', NULL, 'Head of Marketing', 'manager', true, true, true, '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.883627+00'),
	('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', 'Alex', 'Thompson', 'alex.thompson@designstudio.com', NULL, 'Creative Director', 'owner', true, true, true, '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.883627+00');


--
-- Data for Name: chat_threads; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."chat_threads" ("id", "name", "description", "type", "is_private", "organization_id", "event_id", "allow_member_invites", "allow_file_uploads", "max_members", "metadata", "created_at", "updated_at", "last_message_at", "thread_type", "is_notification", "created_by") VALUES
	('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'General Chat', 'General community discussion', 'group', false, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, true, true, NULL, '{}', '2025-10-27 04:27:46.699935', '2025-10-27 04:27:46.699935', NULL, 'group', false, NULL),
	('22222222-2222-2222-2222-222222222222', 'PBR Community Chat', 'General discussion for PBR community members', 'group', false, NULL, NULL, true, true, NULL, '{}', '2025-10-26 04:27:47.314243', '2025-10-27 03:57:47.314243', '2025-10-27 03:57:47.314243', 'group', false, NULL),
	('33333333-3333-3333-3333-333333333333', NULL, NULL, 'dm', true, NULL, NULL, true, true, NULL, '{}', '2025-10-27 01:27:47.314243', '2025-10-27 04:27:47.972814', '2025-10-27 04:17:47.314243', 'dm', false, NULL),
	('11111111-1111-1111-1111-111111111111', 'PBR Meetup #1 Announcements', 'Official announcements for PBR Meetup #1', 'event', false, NULL, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true, true, NULL, '{}', '2025-10-25 04:27:47.314243', '2025-10-27 04:27:47.972814', '2025-10-27 03:27:47.314243', 'event', false, NULL),
	('a5dbe0b9-5179-480b-be57-046025065552', NULL, NULL, 'dm', true, NULL, NULL, false, true, NULL, '{}', '2025-10-27 04:45:30.349772', '2025-10-27 04:45:30.349772', NULL, 'group', false, NULL),
	('571f8017-3a74-44b5-8a23-1419369ac9f4', NULL, NULL, 'dm', true, NULL, NULL, false, true, NULL, '{}', '2025-10-27 04:46:56.383315', '2025-10-27 04:47:02.549772', '2025-10-27 04:47:02.453', 'dm', false, NULL),
	('fea9afd5-1602-46bc-8234-08eb2355ac80', 'Event Notification: Know Us: Atlanta 2025', NULL, 'event', false, NULL, '840b8aac-424a-4fd0-90b8-9985840d26f8', true, true, NULL, '{}', '2025-10-27 05:02:02.08062', '2025-10-27 05:02:02.08062', '2025-10-27 05:02:02.08062', 'notification', true, '9e7d5754-0de9-4b5f-8952-2cc39ae455d2');


--
-- Data for Name: chat_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."chat_memberships" ("id", "thread_id", "user_id", "role", "notifications_enabled", "mute_until", "last_read_at", "unread_count", "is_active", "joined_at", "left_at") VALUES
	('5acd0cad-0bb0-448c-b161-74daef16964a', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'admin', true, NULL, NULL, 0, true, '2025-10-27 04:27:46.699935', NULL),
	('a419eb49-6381-4b47-a299-9678c422c118', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'member', true, NULL, NULL, 0, true, '2025-10-27 04:27:46.699935', NULL),
	('34299486-2ffc-4f33-9af4-cf07e4e3ab8e', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'member', true, NULL, NULL, 0, true, '2025-10-27 04:27:46.699935', NULL),
	('22363eaa-ee58-4eb7-a9f2-c9e9b50e1a2e', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'member', true, NULL, '2025-10-27 03:27:47.314243', 0, true, '2025-10-25 04:27:47.314243', NULL),
	('19c90fd8-dcef-4171-98a6-6bc4421dd5ba', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'member', true, NULL, '2025-10-27 02:27:47.314243', 1, true, '2025-10-25 04:27:47.314243', NULL),
	('469cbe2e-2779-4acd-8ea1-7ce689db8c12', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'member', true, NULL, '2025-10-27 03:27:47.314243', 0, true, '2025-10-25 04:27:47.314243', NULL),
	('989eadb4-337b-4520-9311-b6affeb02640', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'member', true, NULL, '2025-10-27 01:27:47.314243', 2, true, '2025-10-25 04:27:47.314243', NULL),
	('9c7b661a-d227-4ba1-9ce0-43f0cf17e57f', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin', true, NULL, '2025-10-27 03:57:47.314243', 0, true, '2025-10-26 04:27:47.314243', NULL),
	('11cba8b3-bb22-4537-988a-8b997ac1736a', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'member', true, NULL, '2025-10-27 03:27:47.314243', 1, true, '2025-10-26 04:27:47.314243', NULL),
	('5bfa2deb-5ced-449c-aff7-1c577991f88b', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'member', true, NULL, '2025-10-27 03:57:47.314243', 0, true, '2025-10-26 04:27:47.314243', NULL),
	('d53a71a2-f2e3-4a4a-aee2-f8640eb4b45f', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'member', true, NULL, '2025-10-27 04:17:47.314243', 0, true, '2025-10-27 01:27:47.314243', NULL),
	('3c40bca6-7f12-4270-bec8-0009808bd90f', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'member', true, NULL, '2025-10-27 04:07:47.314243', 1, true, '2025-10-27 01:27:47.314243', NULL),
	('12182db0-21b0-4cf5-b96f-8e0c841dc910', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'admin', true, NULL, NULL, 0, true, '2025-10-27 04:27:47.663444', NULL),
	('a6b4500f-954a-48ce-80da-921a4713cb41', '571f8017-3a74-44b5-8a23-1419369ac9f4', '6fc36b62-03a9-4e6b-8478-acc1c443ff36', 'member', true, NULL, NULL, 0, true, '2025-10-27 04:46:56.620184', NULL),
	('9b3b2737-6311-447e-a105-8c8cd28c8561', '571f8017-3a74-44b5-8a23-1419369ac9f4', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', 'member', true, NULL, '2025-10-27 04:54:47.8', 0, true, '2025-10-27 04:46:56.615979', NULL),
	('4a735bb4-f819-4117-82c8-5eddf3466fbb', 'fea9afd5-1602-46bc-8234-08eb2355ac80', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', 'member', true, NULL, NULL, 0, true, '2025-10-27 05:02:02.08062', NULL),
	('b8eab96a-5fbb-4f34-a24a-195722a8d42a', 'fea9afd5-1602-46bc-8234-08eb2355ac80', '6fc36b62-03a9-4e6b-8478-acc1c443ff36', 'member', true, NULL, NULL, 0, true, '2025-10-27 05:02:02.08062', NULL);


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."chat_messages" ("id", "thread_id", "user_id", "content", "message_type", "reply_to_id", "event_id", "attachments", "is_edited", "edited_at", "is_deleted", "deleted_at", "reactions", "created_at", "updated_at") VALUES
	('ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Welcome to the PBR community! 🎉', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-27 04:27:46.699935', '2025-10-27 04:27:46.699935'),
	('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Welcome to PBR Meetup #1! We have an exciting lineup of speakers and activities planned.', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-25 04:27:47.314243', '2025-10-27 04:27:47.314243'),
	('11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Don''t forget to RSVP and check out the agenda in the mobile app!', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-26 04:27:47.314243', '2025-10-27 04:27:47.314243'),
	('11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Event starts at 6:00 PM. See you there! 🎉', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-27 03:27:47.314243', '2025-10-27 04:27:47.314243'),
	('22222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Hey everyone! Welcome to the PBR community chat!', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-26 04:27:47.314243', '2025-10-27 04:27:47.314243'),
	('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Thanks for setting this up, Alice!', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-26 05:27:47.314243', '2025-10-27 04:27:47.314243'),
	('22222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Looking forward to connecting with everyone!', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-27 03:57:47.314243', '2025-10-27 04:27:47.314243'),
	('33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Hey Bob! How are you doing?', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-27 01:27:47.314243', '2025-10-27 04:27:47.314243'),
	('33333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Hi Alice! I''m doing great, thanks for asking. How about you?', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-27 02:27:47.314243', '2025-10-27 04:27:47.314243'),
	('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'I''m excited about the PBR meetup next week!', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-27 04:17:47.314243', '2025-10-27 04:27:47.314243'),
	('d3886ffe-5e91-4c1c-8094-adaf9d7904b8', '571f8017-3a74-44b5-8a23-1419369ac9f4', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', 'Hey there', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-27 04:47:02.302565', '2025-10-27 04:47:02.302565'),
	('16144d58-f352-42a7-8665-75ba5c153b96', 'fea9afd5-1602-46bc-8234-08eb2355ac80', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', 'Buses are on the way', 'text', NULL, NULL, '[]', false, NULL, false, NULL, '{}', '2025-10-27 05:02:02.08062', '2025-10-27 05:02:02.08062');


--
-- Data for Name: community_interests; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."community_interests" ("id", "name", "description", "icon", "is_active", "sort_order", "created_at", "updated_at") VALUES
	('4c21b825-098c-42e8-a209-69dfa2872f44', 'Social Justice', 'Advocacy for equality and social change', NULL, true, 1, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('4a359db7-a2d4-4174-a898-e4605bba9e9e', 'Education', 'Supporting educational initiatives and learning', NULL, true, 2, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('1674c8c1-e828-453a-b23c-e269590032f2', 'Health & Wellness', 'Physical and mental health advocacy', NULL, true, 3, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('ec3bf1d3-7665-407e-b592-515bd9253027', 'Environment', 'Environmental protection and sustainability', NULL, true, 4, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('c09639a6-f87c-49bc-9fb5-5d55497d6eb4', 'Arts & Culture', 'Supporting local arts and cultural events', NULL, true, 5, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('f32a0061-2974-4aea-9f47-8dc47c9a195e', 'Technology', 'Tech innovation and digital literacy', NULL, true, 6, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('fee3f356-58af-4385-9a6b-6761a3208713', 'Community Development', 'Building stronger local communities', NULL, true, 7, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('12de1fa7-6a59-4bad-b328-7992f3934bcf', 'Youth Development', 'Supporting children and young adults', NULL, true, 8, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('5680615d-fdb2-44f9-a276-ad0995d50d01', 'Senior Care', 'Supporting elderly community members', NULL, true, 9, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('6590cf77-989c-4563-8cea-9076b9ec732e', 'Housing', 'Affordable housing and homelessness advocacy', NULL, true, 10, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('04a63b3e-c227-4432-80ea-1f1628a884a3', 'Food Security', 'Addressing hunger and food access issues', NULL, true, 11, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('c0142616-d5d1-4214-9181-2d6c1d77293a', 'Economic Development', 'Supporting local business and entrepreneurship', NULL, true, 12, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('6e4e3ec1-81b8-4c29-9167-6319c8149ee9', 'Civic Engagement', 'Political participation and civic involvement', NULL, true, 13, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('e7888baa-ada9-4ab4-9cd5-c323dd496309', 'Sports & Recreation', 'Community sports and recreational activities', NULL, true, 14, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('bf244dd4-5619-4754-a3d3-a5c79b4423dc', 'Animal Welfare', 'Supporting animal rescue and welfare', NULL, true, 15, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('64e269b8-7929-4a31-b5d6-9ca995f4f4e0', 'Veterans Support', 'Supporting military veterans and families', NULL, true, 16, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('61d5a454-0ed9-459e-ac9f-c40f5b147dae', 'Immigration', 'Supporting immigrant and refugee communities', NULL, true, 17, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('804e753e-9d0c-412b-8ca8-74be4d8fe3e2', 'Disability Advocacy', 'Supporting people with disabilities', NULL, true, 18, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('be51e880-3579-4719-ae02-ce73fd7246a3', 'LGBTQ+ Rights', 'Supporting LGBTQ+ community and rights', NULL, true, 19, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('d4fbf9a1-2826-40ad-9dd7-e64563a21a40', 'Other', 'Other community interests not listed above', NULL, true, 20, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00');


--
-- Data for Name: event_businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."event_businesses" ("id", "event_id", "business_id", "role", "sponsorship_level", "booth_number", "display_order", "is_featured", "is_confirmed", "is_public", "created_at", "updated_at") VALUES
	('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'sponsor', 'gold', NULL, 1, true, true, true, '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.883627+00'),
	('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'participant', NULL, NULL, 2, false, true, true, '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.883627+00'),
	('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', 'sponsor', 'silver', NULL, 3, true, true, true, '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.883627+00');


--
-- Data for Name: event_organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: track_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."track_groups" ("id", "event_id", "name", "description", "is_mutually_exclusive", "created_at", "updated_at") VALUES
	('6391ad7f-3d7b-454e-a8bb-525e93bccbc6', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'Know Us 2026 Tracks', NULL, true, '2025-10-27 05:01:06.467136+00', '2025-10-27 05:01:06.467136+00');


--
-- Data for Name: event_tracks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."event_tracks" ("id", "event_id", "name", "description", "max_capacity", "display_order", "is_active", "created_at", "updated_at", "track_group_id") VALUES
	('aa6d5dc4-3227-46f8-85b3-f0af60e47793', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'West Side Track', NULL, NULL, 0, true, '2025-10-27 05:00:15.72421', '2025-10-27 05:00:15.72421', '6391ad7f-3d7b-454e-a8bb-525e93bccbc6'),
	('077bd230-c22c-412a-a2ea-dce0f1df0072', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'East Side Track', NULL, NULL, 0, true, '2025-10-27 05:00:22.715909', '2025-10-27 05:00:22.715909', '6391ad7f-3d7b-454e-a8bb-525e93bccbc6');


--
-- Data for Name: event_rsvps; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."event_rsvps" ("id", "user_id", "event_id", "status", "guest_count", "dietary_restrictions", "accessibility_needs", "notes", "is_approved", "approved_at", "approved_by", "created_at", "updated_at", "track_id") VALUES
	('0a54619a-77fe-459b-a5ce-9ac63d793515', '6fc36b62-03a9-4e6b-8478-acc1c443ff36', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'attending', 1, NULL, NULL, NULL, true, NULL, NULL, '2025-10-27 04:59:43.520516', '2025-10-27 05:01:23.517', 'aa6d5dc4-3227-46f8-85b3-f0af60e47793');


--
-- Data for Name: event_speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."event_speakers" ("id", "event_id", "speaker_id", "role", "session_title", "session_description", "session_start_time", "session_end_time", "display_order", "is_confirmed", "is_public", "created_at", "updated_at") VALUES
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'speaker', 'Building Scalable React Applications', 'Learn best practices for building large-scale React applications with proper state management and performance optimization.', NULL, NULL, 1, true, true, '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.883627+00'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'moderator', 'Panel Discussion: Future of Tech', 'Moderating a panel discussion about emerging technologies and their impact on the industry.', NULL, NULL, 2, true, true, '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.883627+00'),
	('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'speaker', 'Design Systems That Scale', 'Creating and maintaining design systems that grow with your product and team.', NULL, NULL, 3, true, true, '2025-10-27 04:27:46.883627+00', '2025-10-27 04:27:46.883627+00');


--
-- Data for Name: import_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: import_errors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: invitation_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: media_objects; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notification_templates" ("id", "name", "title_template", "content_template", "trigger_type", "trigger_offset_hours", "is_active", "created_at", "updated_at") VALUES
	('07c5d6d9-3d27-4293-b2e0-861050a3eaf7', 'event_created', 'New Event: {{event_title}}', 'A new event "{{event_title}}" has been created. Check it out and RSVP!', 'event_created', 0, true, '2025-10-27 04:27:47.785197+00', '2025-10-27 04:27:47.785197+00'),
	('f5a3d931-877e-43cf-ad8d-a66b3c6a15c4', 'event_reminder_24h', 'Event Tomorrow: {{event_title}}', 'Don''t forget! "{{event_title}}" is happening tomorrow at {{event_time}}.', 'event_reminder_24h', -24, true, '2025-10-27 04:27:47.785197+00', '2025-10-27 04:27:47.785197+00'),
	('bfbe02fa-2771-40b7-9728-77e308d97efd', 'event_reminder_48h', 'Event in 2 Days: {{event_title}}', 'Just a reminder that "{{event_title}}" is coming up in 2 days. Make sure you''re ready!', 'event_reminder_48h', -48, true, '2025-10-27 04:27:47.785197+00', '2025-10-27 04:27:47.785197+00'),
	('7152b906-f3dc-44be-a96d-a46a75efbc4a', 'event_starting_1h', 'Event Starting Soon: {{event_title}}', '{{event_title}} starts in 1 hour! See you there!', 'event_starting_1h', -1, true, '2025-10-27 04:27:47.785197+00', '2025-10-27 04:27:47.785197+00'),
	('8c4f2644-5c30-461f-9a74-ad0f4419aa7c', 'rsvp_reminder', 'RSVP Reminder: {{event_title}}', 'Don''t forget to RSVP for "{{event_title}}" happening on {{event_date}}.', 'rsvp_reminder', -48, true, '2025-10-27 04:27:47.785197+00', '2025-10-27 04:27:47.785197+00'),
	('a5a6d9f7-9c11-4eaf-b0e6-b0c702a2d9ae', 'event_cancelled', 'Event Cancelled: {{event_title}}', 'Unfortunately, "{{event_title}}" has been cancelled. We apologize for any inconvenience.', 'event_cancelled', 0, true, '2025-10-27 04:27:47.785197+00', '2025-10-27 04:27:47.785197+00'),
	('b584e22a-feeb-485a-93d8-f7a08a495b88', 'event_updated', 'Event Updated: {{event_title}}', 'The details for "{{event_title}}" have been updated. Please check the new information.', 'event_updated', 0, true, '2025-10-27 04:27:47.785197+00', '2025-10-27 04:27:47.785197+00');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notifications" ("id", "event_id", "title", "content", "created_by", "created_at", "updated_at") VALUES
	('abdc1c3d-c6f4-4d83-97e0-cec330e5b1bc', '840b8aac-424a-4fd0-90b8-9985840d26f8', 'Event Update: Know Us: Atlanta 2025', 'Buses are on the way', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', '2025-10-27 05:02:02.08062+00', '2025-10-27 05:02:02.08062+00');


--
-- Data for Name: organization_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organization_memberships" ("id", "user_id", "organization_id", "role", "joined_at", "is_active") VALUES
	('29814c8f-6f71-47cb-bdf8-570bc923a468', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', '2025-10-27 04:27:46.699935', true),
	('8c0cf763-30df-411a-990d-0f984f016b74', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', '2025-10-27 04:27:46.699935', true),
	('400c3f50-9718-431a-8d9c-a520970095fd', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member', '2025-10-27 04:27:46.699935', true),
	('e8d84aad-9031-4226-b484-6f7feeeed602', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', '2025-10-27 04:27:47.663444', true);


--
-- Data for Name: professional_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."professional_categories" ("id", "name", "description", "icon", "is_active", "sort_order", "created_at", "updated_at") VALUES
	('eaf10147-9fec-4a8e-92a0-ba308255cd27', 'Technology', 'Software development, IT, and tech-related fields', NULL, true, 1, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('161a55df-9f18-4f24-bcf2-7a1381490ec5', 'Engineering', 'Various engineering disciplines and technical roles', NULL, true, 2, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('4d4d9ad0-9e22-4942-b22e-c3b18920ea47', 'Healthcare', 'Medical, nursing, and healthcare professions', NULL, true, 3, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('e7a21999-92e6-415b-97ef-91717d8d75c3', 'Education', 'Teaching, training, and educational services', NULL, true, 4, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('5db55295-5255-4553-8160-3eaee9236694', 'Finance', 'Banking, investment, and financial services', NULL, true, 5, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('a6e9ab6d-73e7-4311-ba7d-c722705d93a8', 'Marketing', 'Digital marketing, advertising, and brand management', NULL, true, 6, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('912a558c-661a-41cd-9a4b-66d05a935471', 'Sales', 'Business development and sales roles', NULL, true, 7, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('8022860f-c934-46d1-912e-1432a4152557', 'Design', 'Graphic design, UX/UI, and creative fields', NULL, true, 8, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('61ed1033-1f42-464f-b66f-a15533a3ead4', 'Consulting', 'Business consulting and advisory services', NULL, true, 9, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('5d6bc4ef-4b21-47fe-8c85-5fa76295b99c', 'Legal', 'Law, compliance, and legal services', NULL, true, 10, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('c686f18e-9f9b-4497-8fcb-0bd16c4ae0bd', 'Real Estate', 'Property management and real estate services', NULL, true, 11, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('089e5914-eb9a-42c9-a6a1-1eac22ac39c6', 'Non-Profit', 'Charitable organizations and social impact', NULL, true, 12, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('11ac7660-4d8b-4780-aceb-3befa1c94b56', 'Government', 'Public sector and government roles', NULL, true, 13, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('a3fb2334-aad1-4718-ab5e-1714c98fda75', 'Media', 'Journalism, broadcasting, and media production', NULL, true, 14, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('f4d0bcbe-265e-43f4-9ecc-0259579816ea', 'Retail', 'Retail management and customer service', NULL, true, 15, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('14d95de8-5056-47d9-b623-a78d51b56d76', 'Manufacturing', 'Production, operations, and manufacturing', NULL, true, 16, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('344099b5-51e5-44aa-8c9a-513dfd30af48', 'Transportation', 'Logistics, shipping, and transportation', NULL, true, 17, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('054131f2-a59a-4b27-a613-3c59fc48ea0b', 'Construction', 'Building, contracting, and construction trades', NULL, true, 18, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('1eb35aec-3223-4ad7-8ba2-914f9e1cfa3f', 'Agriculture', 'Farming, food production, and agricultural services', NULL, true, 19, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00'),
	('c84f90a2-3e2e-4adb-b545-5ce3842ddf83', 'Other', 'Other professional categories not listed above', NULL, true, 20, '2025-10-27 04:27:47.466265+00', '2025-10-27 04:27:47.466265+00');


--
-- Data for Name: scheduled_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: track_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."track_activities" ("id", "track_id", "activity_id", "created_at") VALUES
	('6518b3bf-06b7-4f06-94e1-ff9b5561fd7a', 'aa6d5dc4-3227-46f8-85b3-f0af60e47793', '98805beb-2136-44e0-a103-50fb448c7813', '2025-10-27 05:00:31.389509'),
	('11d54a0b-fd87-4640-a8b6-527a64553868', 'aa6d5dc4-3227-46f8-85b3-f0af60e47793', '0fc9e6b8-4086-468e-9b9c-0f7157181b3d', '2025-10-27 05:00:32.950166'),
	('a83aee78-287a-4133-9ebf-89b52d82a521', '077bd230-c22c-412a-a2ea-dce0f1df0072', 'cbf9f849-18a3-40d5-a0f9-2502c46eae71', '2025-10-27 05:00:39.09628'),
	('e2eeab6c-4cdc-4a3d-97ff-711518292d09', '077bd230-c22c-412a-a2ea-dce0f1df0072', '018e61a3-0ab6-405e-878c-9ba353472af5', '2025-10-27 05:00:40.471761');


--
-- Data for Name: user_community_interests; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_community_interests" ("id", "user_id", "interest_id", "created_at") VALUES
	('bf6553e7-de94-42a0-bca0-d514b3b5b294', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', '4c21b825-098c-42e8-a209-69dfa2872f44', '2025-10-27 04:45:49.186149+00'),
	('072d5202-80c9-4b3c-a1ec-32a45afe2505', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', '4a359db7-a2d4-4174-a898-e4605bba9e9e', '2025-10-27 04:45:49.186149+00'),
	('0ef40e88-fb0a-46f6-a8f0-35526dd167c9', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', '1674c8c1-e828-453a-b23c-e269590032f2', '2025-10-27 04:45:49.186149+00');


--
-- Data for Name: user_event_attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_event_attendance" ("id", "user_id", "event_id", "attended_at", "check_in_time", "check_out_time", "notes", "created_at") VALUES
	('29dfd5ce-4fbc-4789-8b8a-428d59246a35', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2025-10-26 04:27:47.466265+00', '2025-10-26 04:57:47.466265+00', '2025-10-26 06:27:47.466265+00', NULL, '2025-10-27 04:27:47.466265+00');


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_notifications" ("id", "notification_id", "user_id", "is_read", "read_at", "created_at") VALUES
	('1e13df22-dd3a-400f-86c2-0ddc953c76c9', 'abdc1c3d-c6f4-4d83-97e0-cec330e5b1bc', '6fc36b62-03a9-4e6b-8478-acc1c443ff36', false, NULL, '2025-10-27 05:02:02.08062+00');


--
-- Data for Name: user_professional_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_professional_categories" ("id", "user_id", "category_id", "created_at") VALUES
	('3e17645c-535c-47f4-be2d-b9a18391fecd', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', 'eaf10147-9fec-4a8e-92a0-ba308255cd27', '2025-10-27 04:45:46.268572+00'),
	('2be684af-0637-4d22-8069-09dd40a7f9ba', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', '161a55df-9f18-4f24-bcf2-7a1381490ec5', '2025-10-27 04:45:46.268572+00'),
	('a5dfb454-7a06-4544-9a0b-645708961170', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', '4d4d9ad0-9e22-4942-b22e-c3b18920ea47', '2025-10-27 04:45:46.268572+00');


--
-- Data for Name: user_push_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_push_tokens" ("id", "user_id", "push_token", "platform", "is_active", "created_at", "updated_at") VALUES
	('8ce097ac-17bd-405b-a55b-2db6fca9c632', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', 'ExponentPushToken[kHIcmJFJgOtViDgPaFLE7J]', 'ios', true, '2025-10-27 04:45:54.127501+00', '2025-10-27 04:45:54.018+00'),
	('6a18ffd2-9d56-49a4-b889-4b5119fbe038', '6fc36b62-03a9-4e6b-8478-acc1c443ff36', 'ExponentPushToken[rinV3CLv9sGlNGi6wcMlcr]', 'ios', true, '2025-10-27 04:46:43.223085+00', '2025-10-27 04:46:43.161+00');


--
-- Data for Name: user_role_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_role_history" ("id", "user_id", "old_role", "new_role", "changed_by", "reason", "created_at") VALUES
	('b3134c1c-e376-4fae-95fb-d0990c9c3a65', '9e7d5754-0de9-4b5f-8952-2cc39ae455d2', 'general', 'admin', '11111111-1111-1111-1111-111111111111', NULL, '2025-10-27 04:47:16.222823');


--
-- PostgreSQL database dump complete
--

-- \unrestrict mPwvTZd9Ljpu0QAlMrybiVBYSfz0EGtRWY2r7Fc8VPSs2U5lCoQVMqeq7lM9Ayv

RESET ALL;
