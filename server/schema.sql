-- Run this in the Supabase SQL Editor to set up your tables

CREATE TABLE IF NOT EXISTS news_items (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    summary JSONB, -- Storing array as JSONB
    "leftPerspective" TEXT,
    "rightPerspective" TEXT,
    "imageURL" TEXT,
    "youtubeID" TEXT,
    "clipUrl" TEXT,
    "clipDuration" FLOAT,
    "podcastAudioPath" TEXT,
    "articleURL" TEXT,
    "sourceAPI" TEXT,
    claims JSONB,
    date TIMESTAMP WITH TIME ZONE,
    category TEXT DEFAULT 'Current',
    status TEXT DEFAULT 'INGESTED',
    "isOptimized" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "sample_question" TEXT,
    "audio_script" TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_status ON news_items(status);
CREATE INDEX IF NOT EXISTS idx_date ON news_items(date DESC);
