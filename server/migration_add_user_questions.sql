-- Migration to add user_questions table for tracking AI QA
-- Enforces one question per user per post

CREATE TABLE IF NOT EXISTS user_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    post_id UUID NOT NULL REFERENCES aggregated_stories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_user_questions_user_id ON user_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_post_id ON user_questions(post_id);
