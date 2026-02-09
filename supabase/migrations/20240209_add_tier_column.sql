-- Migration: Add 'tier' column to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'smart';

-- Optional: Add a check constraint to ensure valid values
ALTER TABLE profiles 
ADD CONSTRAINT check_tier_values 
CHECK (tier IN ('smart', 'reseller', 'partner'));

-- Update existing users to 'smart' if null (handled by default but good for safety)
UPDATE profiles SET tier = 'smart' WHERE tier IS NULL;
