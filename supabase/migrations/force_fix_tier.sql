-- FORCE FIX for Tier Constraint

-- 1. Drop the constraint if it exists (to avoid conflicts)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_tier_values;

-- 2. Force text conversion and sanitation
-- Update NULLs
UPDATE profiles SET tier = 'smart' WHERE tier IS NULL;

-- Update anything that is NOT exact match
UPDATE profiles 
SET tier = 'smart' 
WHERE tier NOT IN ('smart', 'reseller', 'partner');

-- 3. Verify no bad data exists (This is just logic, the next step enforces it)

-- 4. Re-apply the constraint
ALTER TABLE profiles 
ADD CONSTRAINT check_tier_values 
CHECK (tier IN ('smart', 'reseller', 'partner'));
