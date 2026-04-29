-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to event_clusters (OpenAI embeddings are 1536 dimensions)
ALTER TABLE event_clusters ADD COLUMN IF NOT EXISTS representative_embedding_vector vector(1536);

-- Optional: Create an index for vector similarity search (IVFFlat or HNSW)
-- Using HNSW for better performance at the cost of build time
CREATE INDEX IF NOT EXISTS idx_event_clusters_embedding_hnsw 
ON event_clusters USING hnsw (representative_embedding_vector vector_cosine_ops);
