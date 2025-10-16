-- Fix UUID extension issue
-- Enable uuid-ossp extension properly

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant usage on the extension to the public schema
GRANT USAGE ON SCHEMA public TO public;

