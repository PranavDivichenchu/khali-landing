-- Migration: Add indexes for performance optimization
-- Target: Reduce Disk IO by avoiding full table scans in TTS regeneration and common queries

-- (Indexes removed as they were unused/duplicate: idx_aggregated_podcast_audio, idx_news_items_optimized, idx_news_items_podcast_audio)
