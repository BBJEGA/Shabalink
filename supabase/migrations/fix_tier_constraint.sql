-- Fix for "check_tier_values constraint violated" error

-- 1. Update any existing rows that have old values (e.g. 'level_1') to 'smart'
UPDATE profiles 
SET tier = 'smart' 
WHERE tier NOT IN ('smart', 'reseller', 'partner') OR tier IS NULL;

-- 2. Now try adding the constraint again
ALTER TABLE profiles 
ADD CONSTRAINT check_tier_values 
CHECK (tier IN ('smart', 'reseller', 'partner'));
