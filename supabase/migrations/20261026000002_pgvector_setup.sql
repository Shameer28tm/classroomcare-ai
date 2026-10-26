-- Migration: 20261026000002_pgvector_setup.sql
-- Description: pgvector extension, knowledge documents, chunks, and hybrid search indexes

-- Enable vector extension safely in extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
SET search_path TO public, extensions;

-- Knowledge Documents
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

-- Document Chunks with Vector (768) and Full-Text Search
CREATE TABLE IF NOT EXISTS document_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    document_title VARCHAR(255) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding extensions.vector(768),
    tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hybrid Search Indexes
-- 1. Full-Text Search GIN index
CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON document_chunks USING GIN(tsv);

-- 2. HNSW index for pgvector cosine distance
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw ON document_chunks USING hnsw (embedding extensions.vector_cosine_ops);

-- Agent Execution Runs
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
