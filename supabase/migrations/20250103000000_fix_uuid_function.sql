-- Fix UUID function to use gen_random_uuid() as fallback
-- This migration must run before 20250103000001_initial_schema.sql
-- to resolve the uuid_generate_v4() function issue

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION uuid_generate_v4()
RETURNS uuid AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;
