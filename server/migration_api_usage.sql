-- Migration: Create api_usage table for tracking daily API call counts

CREATE TABLE IF NOT EXISTS api_usage (
    id SERIAL PRIMARY KEY,
    service TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service, date)
);

-- Index for fast lookups by service and date
CREATE INDEX IF NOT EXISTS idx_api_usage_service_date ON api_usage(service, date);

-- Comment
COMMENT ON TABLE api_usage IS 'Tracks daily API call counts per service for rate limiting';
