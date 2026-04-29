-- Run this in the Supabase SQL Editor

ALTER TABLE news_items ADD COLUMN IF NOT EXISTS audio_script TEXT;
ALTER TABLE aggregated_stories ADD COLUMN IF NOT EXISTS audio_script TEXT;
