-- Extra performance indexes
CREATE INDEX IF NOT EXISTS idx_news_items_status ON news_items(status);
CREATE INDEX IF NOT EXISTS idx_news_items_date ON news_items(date DESC);
CREATE INDEX IF NOT EXISTS idx_event_clusters_updated_at ON event_clusters(updated_at DESC);

-- RPC for efficient cluster matching
CREATE OR REPLACE FUNCTION match_clusters(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  time_window_hours int
)
RETURNS TABLE (
  id UUID,
  representative_title TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.representative_title,
    1 - (ec.representative_embedding_vector <=> query_embedding) AS similarity
  FROM event_clusters ec
  WHERE ec.updated_at > (NOW() - (time_window_hours || ' hours')::interval)
    AND 1 - (ec.representative_embedding_vector <=> query_embedding) > match_threshold
  ORDER BY ec.representative_embedding_vector <=> query_embedding
  LIMIT match_count;
END;
$$;
