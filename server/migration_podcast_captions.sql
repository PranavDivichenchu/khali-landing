-- Add podcast_captions column to aggregated_stories
ALTER TABLE aggregated_stories ADD COLUMN IF NOT EXISTS podcast_captions JSONB;

-- Add caption_data column to news_items
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS caption_data JSONB;
