-- Add embedding column to event_clusters table
ALTER TABLE event_clusters ADD COLUMN IF NOT EXISTS representative_embedding JSONB;
