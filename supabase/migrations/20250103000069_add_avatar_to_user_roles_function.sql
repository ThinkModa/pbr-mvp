-- Add avatar_url to get_all_users_with_roles function
-- Migration: 20250103000069_add_avatar_to_user_roles_function.sql

-- Drop the existing function first to change return type
DROP FUNCTION IF EXISTS public.get_all_users_with_roles();

-- Create the function with avatar_url and other profile fields
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    name VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(20),
    is_active BOOLEAN,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.name,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.role,
        u.is_active,
        u.last_login_at,
        u.created_at
    FROM public.users u
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
