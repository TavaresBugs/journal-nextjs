-- ============================================
-- DEBUG SCRIPT: Check mentor_invites state
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check all invites in the database
SELECT 
    id,
    mentor_email,
    mentee_email,
    status,
    permission,
    created_at,
    expires_at,
    CASE WHEN expires_at > NOW() THEN 'Valid' ELSE 'Expired' END as validity
FROM mentor_invites
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check RLS policies on mentor_invites
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual::text as using_clause,
    with_check::text
FROM pg_policies
WHERE tablename = 'mentor_invites';

-- 3. Check if mentee_email matches (case sensitivity)
-- Replace 'jhontavares2025@gmail.com' with the actual email
SELECT 
    id,
    mentor_email,
    mentee_email,
    status,
    CASE 
        WHEN LOWER(mentee_email) = LOWER('jhontavares2025@gmail.com') THEN 'MATCH'
        ELSE 'NO MATCH'
    END as email_match
FROM mentor_invites
WHERE LOWER(mentee_email) = LOWER('jhontavares2025@gmail.com');

-- 4. Check all pending invites (admin view, bypasses RLS)
SELECT * FROM mentor_invites WHERE status = 'pending';
