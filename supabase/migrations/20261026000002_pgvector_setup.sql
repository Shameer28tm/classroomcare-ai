-- Migration: 20261026000002_pgvector_setup.sql
-- Description: pgvector extension, knowledge documents, chunks, and hybrid search indexes

-- 1. Ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Safely create or locate vector extension
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        BEGIN
            CREATE EXTENSION vector WITH SCHEMA extensions;
        EXCEPTION WHEN OTHERS THEN
            CREATE EXTENSION vector;
        END;
    END IF;
END $$;

-- 3. Grant usage on schema containing vector to standard Supabase roles
DO $$
DECLARE
    ext_schema text;
BEGIN
    SELECT n.nspname INTO ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'vector';

    IF ext_schema IS NOT NULL THEN
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO postgres, anon, authenticated, service_role;', ext_schema);
    END IF;
END $$;

-- 4. Set search_path so vector and its operator classes resolve seamlessly
SET search_path TO public, extensions;

-- 5. Knowledge Documents Table
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    file_type VARCHAR(32) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
    chunk_count INT NOT NULL DEFAULT 0,
    uploaded_by VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Ready',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Document Chunks with Vector (768) and Full-Text Search
CREATE TABLE IF NOT EXISTS document_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    document_title VARCHAR(255) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(768),
    tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Hybrid Search Indexes
CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON document_chunks USING GIN(tsv);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- 8. Agent Execution Runs
CREATE TABLE IF NOT EXISTS agent_runs (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    nodes_executed JSONB NOT NULL DEFAULT '[]'::jsonb,
    deterministic_safety_hit BOOLEAN NOT NULL DEFAULT FALSE,
    replan_count INT NOT NULL DEFAULT 0,
    decision_summary TEXT NOT NULL,
    recommended_priority VARCHAR(32) NOT NULL,
    recommended_category VARCHAR(64) NOT NULL,
    recommended_technician VARCHAR(255),
    citations JSONB DEFAULT '[]'::jsonb,
    executed_tools JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_ticket ON agent_runs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_campus ON agent_runs(campus_id);
