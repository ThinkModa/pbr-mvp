-- Test the database triggers
-- Check if the trigger functions exist and work

-- First, let's check if the trigger functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%';

-- Check if the triggers exist
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%user%';

-- Test the trigger function directly
SELECT public.handle_new_user();

