-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    story_id UUID NOT NULL REFERENCES aggregated_stories(id) ON DELETE CASCADE,
    vote TEXT CHECK (vote IN ('agree', 'disagree')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

-- Index for counting votes per story
CREATE INDEX IF NOT EXISTS idx_votes_story_id ON user_votes(story_id);

-- View for aggregated counts
CREATE OR REPLACE VIEW story_vote_stats AS
SELECT 
    story_id,
    COUNT(*) FILTER (WHERE vote = 'agree') as agree_count,
    COUNT(*) FILTER (WHERE vote = 'disagree') as disagree_count
FROM user_votes
GROUP BY story_id;
