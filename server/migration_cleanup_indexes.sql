-- Migration: Cleanup Unused and Duplicate Indexes
-- Run this in Supabase SQL Editor

-- 1. Remove Unused Indexes (Optimizations that are no longer needed)
DROP INDEX IF EXISTS idx_aggregated_podcast_audio;
DROP INDEX IF EXISTS idx_news_items_optimized;
DROP INDEX IF EXISTS idx_news_items_podcast_audio;

-- 2. Remove Potential Duplicate Indexes
-- Supabase/Postgres might have created default named indexes if they were defined in multiple places.
-- We try to drop common default names to resolve "Duplicate Index" warnings.

-- content: news_items(status)
DROP INDEX IF EXISTS news_items_status_idx;
-- content: news_items(date)
DROP INDEX IF EXISTS news_items_date_idx;
-- content: news_items(cluster_id)
DROP INDEX IF EXISTS news_items_cluster_id_idx;

-- Also try dropping duplicates on aggregated_stories if any
DROP INDEX IF EXISTS aggregated_stories_status_idx;
DROP INDEX IF EXISTS aggregated_stories_date_idx;

-- 3. Ensure the official indexes still exist (Idempotent)
CREATE INDEX IF NOT EXISTS idx_status ON news_items(status);
CREATE INDEX IF NOT EXISTS idx_date ON news_items(date DESC);
CREATE INDEX IF NOT EXISTS idx_cluster_id ON news_items(cluster_id);

CREATE INDEX IF NOT EXISTS idx_aggregated_status ON aggregated_stories(status);
CREATE INDEX IF NOT EXISTS idx_aggregated_date ON aggregated_stories(date DESC);
