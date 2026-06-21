-- 20260621170000_add_dedicated_verse_to_members.sql
ALTER TABLE members ADD COLUMN IF NOT EXISTS dedicated_verse text;
