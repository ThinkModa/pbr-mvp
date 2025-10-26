-- Fix specific direct message thread between test user and Rod Walton
-- This will ensure the thread appears in the Direct tab instead of Groups tab

-- First, let's see what threads exist for direct messages
SELECT 
    ct.id,
    ct.name,
    ct.type,
    ct.thread_type,
    ct.is_private,
    ct.created_at,
    array_agg(cm.user_id) as member_user_ids,
    array_agg(u.email) as member_emails
FROM chat_threads ct
JOIN chat_memberships cm ON ct.id = cm.thread_id
JOIN users u ON cm.user_id = u.id
WHERE ct.type = 'dm' OR ct.thread_type = 'dm'
GROUP BY ct.id, ct.name, ct.type, ct.thread_type, ct.is_private, ct.created_at
ORDER BY ct.created_at DESC;

-- Fix any direct message threads that don't have the correct thread_type
UPDATE chat_threads 
SET thread_type = 'dm' 
WHERE type = 'dm' AND (thread_type IS NULL OR thread_type != 'dm');

-- Verify the fix
SELECT 
    ct.id,
    ct.name,
    ct.type,
    ct.thread_type,
    ct.is_private,
    array_agg(u.email) as member_emails
FROM chat_threads ct
JOIN chat_memberships cm ON ct.id = cm.thread_id
JOIN users u ON cm.user_id = u.id
WHERE ct.type = 'dm'
GROUP BY ct.id, ct.name, ct.type, ct.thread_type, ct.is_private
ORDER BY ct.created_at DESC;

