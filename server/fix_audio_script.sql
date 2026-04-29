-- Fix missing audioScript column migration
-- Run this in Supabase SQL Editor

-- Add audio_script columns to both tables if they don't exist
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS audio_script TEXT;
ALTER TABLE aggregated_stories ADD COLUMN IF NOT EXISTS audio_script TEXT;