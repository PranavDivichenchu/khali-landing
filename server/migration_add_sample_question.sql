-- Add sample_question column to news_items table
-- Run this in Supabase SQL Editor if the column is missing from the schema cache

ALTER TABLE news_items ADD COLUMN IF NOT EXISTS sample_question TEXT;

-- Reload PostgREST schema cache so the column is immediately visible
NOTIFY pgrst, 'reload schema';
