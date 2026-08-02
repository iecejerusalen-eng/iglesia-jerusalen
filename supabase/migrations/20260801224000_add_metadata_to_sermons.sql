-- Add metadata JSONB column to sermons table
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
