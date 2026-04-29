-- Migration: Switch to Podcast Audio (News Items)
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS "podcastAudioPath" TEXT;
ALTER TABLE news_items DROP COLUMN IF EXISTS "titleAudioPath";
ALTER TABLE news_items DROP COLUMN IF EXISTS "descriptionAudioPath";
ALTER TABLE news_items DROP COLUMN IF EXISTS "claimAudioPath";

-- Migration: Switch to Podcast Audio (Aggregated Stories)-- 1. Add new column
ALTER TABLE aggregated_stories ADD COLUMN podcast_audio_path TEXT;

-- 2. Drop old columns (SAFE for now, or could just ignore them)
-- We will drop them to clean up as requested "delete all the tts audios"
ALTER TABLE aggregated_stories DROP COLUMN IF EXISTS titleAudioPath;
ALTER TABLE aggregated_stories DROP COLUMN IF EXISTS descriptionAudioPath;
ALTER TABLE aggregated_stories DROP COLUMN IF EXISTS claimAudioPath;
