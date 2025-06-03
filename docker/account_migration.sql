-- Add full_name column to accounts table
ALTER TABLE accounts 
ADD COLUMN full_name TEXT;

-- Update accounts where full_name is null but username is available
UPDATE accounts 
SET full_name = username 
WHERE full_name IS NULL; 