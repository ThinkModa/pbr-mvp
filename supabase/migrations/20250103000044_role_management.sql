-- Role Management System
-- This migration creates functions and tables for dynamic role management

-- Create user role history table for audit trail
CREATE TABLE IF NOT EXISTS public.user_role_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    old_role VARCHAR(20) NOT NULL,
    new_role VARCHAR(20) NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_role_history_user_id ON public.user_role_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_history_created_at ON public.user_role_history(created_at);

-- Function to change user role with audit trail
CREATE OR REPLACE FUNCTION public.change_user_role(
    target_user_id UUID,
    new_role VARCHAR(20),
    changed_by_user_id UUID,
    reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    old_role_value VARCHAR(20);
    target_user_exists BOOLEAN;
    changer_is_admin BOOLEAN;
BEGIN
    -- Validate inputs
    IF target_user_id IS NULL OR new_role IS NULL OR changed_by_user_id IS NULL THEN
        RAISE EXCEPTION 'All parameters are required';
    END IF;
    
    -- Check if target user exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = target_user_id) INTO target_user_exists;
    IF NOT target_user_exists THEN
        RAISE EXCEPTION 'Target user does not exist';
    END IF;
    
    -- Check if changer is admin
    SELECT EXISTS(
        SELECT 1 FROM public.users 
        WHERE id = changed_by_user_id AND role = 'admin'
    ) INTO changer_is_admin;
    IF NOT changer_is_admin THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
    
    -- Validate new role
    IF new_role NOT IN ('admin', 'business', 'general') THEN
        RAISE EXCEPTION 'Invalid role: %', new_role;
    END IF;
    
    -- Get current role
    SELECT role INTO old_role_value FROM public.users WHERE id = target_user_id;
    
    -- Don't change if role is the same
    IF old_role_value = new_role THEN
        RETURN FALSE;
    END IF;
    
    -- Update user role
    UPDATE public.users 
    SET 
        role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Log the change
    INSERT INTO public.user_role_history (
        user_id,
        old_role,
        new_role,
        changed_by,
        reason
    ) VALUES (
        target_user_id,
        old_role_value,
        new_role,
        changed_by_user_id,
        reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role history
CREATE OR REPLACE FUNCTION public.get_user_role_history(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    old_role VARCHAR(20),
    new_role VARCHAR(20),
    changed_by_name VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        urh.id,
        urh.old_role,
        urh.new_role,
        u.name as changed_by_name,
        urh.reason,
        urh.created_at
    FROM public.user_role_history urh
    JOIN public.users u ON urh.changed_by = u.id
    WHERE urh.user_id = target_user_id
    ORDER BY urh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users with their roles (for admin management)
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    name VARCHAR(100),
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
        u.role,
        u.is_active,
        u.last_login_at,
        u.created_at
    FROM public.users u
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on user_role_history table
ALTER TABLE public.user_role_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all role history
CREATE POLICY "Admins can view all role history" ON public.user_role_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Users can view their own role history
CREATE POLICY "Users can view own role history" ON public.user_role_history
    FOR SELECT USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.change_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_with_roles TO authenticated;
