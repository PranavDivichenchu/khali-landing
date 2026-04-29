-- Run this in the Supabase SQL Editor

-- Event clusters table to group similar articles
CREATE TABLE IF NOT EXISTS event_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    representative_title TEXT,
    entity_fingerprint TEXT[],
    article_count INTEGER DEFAULT 0,
    representative_embedding JSONB -- Cached AI embedding for the representative title
);

-- Link news_items to clusters
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES event_clusters(id);
CREATE INDEX IF NOT EXISTS idx_cluster_id ON news_items(cluster_id);

-- Aggregated stories table for the unified posts
CREATE TABLE IF NOT EXISTS aggregated_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID REFERENCES event_clusters(id) UNIQUE,
    title TEXT NOT NULL,
    summary JSONB, -- Unified bullet points
    "leftPerspective" TEXT,
    "rightPerspective" TEXT,
    claim TEXT,
    "sourceCount" INTEGER,
    sources JSONB, -- Array of { sourceAPI, iconURL, articleURL, originalTitle }
    "podcastAudioPath" TEXT,
    "youtubeID" TEXT,
    "clipUrl" TEXT,
    "clipDuration" FLOAT,
    date TIMESTAMP WITH TIME ZONE,
    category TEXT DEFAULT 'Current',
    status TEXT DEFAULT 'PENDING',
    "audioScript" TEXT,
    "sampleQuestion" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aggregated_status ON aggregated_stories(status);
CREATE INDEX IF NOT EXISTS idx_aggregated_date ON aggregated_stories(date DESC);
