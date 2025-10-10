-- Create first admin user (Rod Walton)
-- This migration creates the initial admin user for testing

-- Insert Rod Walton as admin user
INSERT INTO public.users (id, email, name, role, is_active) VALUES
    ('55555555-5555-5555-5555-555555555555', 'rahwalton9@gmail.com', 'Rod Walton', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Add Rod Walton to the main organization as admin
INSERT INTO public.organization_memberships (user_id, organization_id, role) VALUES
    ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin')
ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role;

-- Add Rod Walton to the general chat as admin
INSERT INTO public.chat_memberships (thread_id, user_id, role) VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'admin')
ON CONFLICT (thread_id, user_id) DO UPDATE SET
    role = EXCLUDED.role;
