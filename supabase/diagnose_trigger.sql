-- Run this directly in the Supabase SQL Editor
-- This will manually simulate what the trigger does to see EXACTLY why it crashes.

DO $$
DECLARE
    new_user_id uuid := uuid_generate_v4();
BEGIN
    -- 1. Create a dummy auth account
    INSERT INTO auth.users (id, email)
    VALUES (new_user_id, 'diagnostic@shabalink.com');

    -- 2. Try to insert into profiles directly to catch the specific column/RLS error
    INSERT INTO public.profiles (id, email, full_name, wallet_balance)
    VALUES (new_user_id, 'diagnostic@shabalink.com', 'Diag Name', 0.00);

    RAISE NOTICE 'SUCCESS: Profile insertion worked.';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAILURE EXACT REASON: % %', SQLERRM, SQLSTATE;
END $$;
