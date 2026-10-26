-- Migration: 20261026000002_pgvector_setup.sql
-- Description: pgvector extension, knowledge documents, chunks, and hybrid search indexes
-- Target: Supabase PostgreSQL (Production Compatible)

-- 1. Ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Enable pgvector in extensions schema (or relocate if already present in public)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

DO $$
BEGIN
    -- If vector was previously installed into public, relocate it to extensions
    IF EXISTS (
        SELECT 1 FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE e.extname = 'vector' AND n.nspname = 'public'
    ) THEN
        BEGIN
            ALTER EXTENSION vector SET SCHEMA extensions;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Vector extension already in public schema and cannot be relocated: %', SQLERRM;
        END;
    END IF;
END $$;

-- 3. Grant schema usage to standard Supabase roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 4. Set search_path for the current session and configure default roles
SET search_path TO public, extensions;

DO $$
BEGIN
    BEGIN
        ALTER ROLE postgres SET search_path TO "$user", public, extensions;
        ALTER ROLE anon SET search_path TO "$user", public, extensions;
        ALTER ROLE authenticated SET search_path TO "$user", public, extensions;
        ALTER ROLE service_role SET search_path TO "$user", public, extensions;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Role search_path update notice: %', SQLERRM;
    END;
END $$;

-- 5. Knowledge Documents Table
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES public.campuses(id) ON DELETE CASCADE,
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

-- 6. Document Chunks Table with Vector (768) and Full-Text Search
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    document_title VARCHAR(255) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(768),
    tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Agent Execution Runs Table
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
    campus_id VARCHAR(64) REFERENCES public.campuses(id) ON DELETE CASCADE,
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

-- 8. Hybrid Search & Foreign-Key Indexes
CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON public.document_chunks USING GIN(tsv);

-- Safe vector index creation: attempts HNSW, falls back to IVFFLAT, non-fatal if index fails
DO $$
BEGIN
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
        ON public.document_chunks USING hnsw (embedding vector_cosine_ops);
    EXCEPTION WHEN OTHERS THEN
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivf 
            ON public.document_chunks USING ivfflat (embedding vector_cosine_ops);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Vector index creation notice (non-fatal): %', SQLERRM;
        END;
    END;
END $$;

CREATE INDEX IF NOT EXISTS idx_agent_runs_ticket ON public.agent_runs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_campus ON public.agent_runs(campus_id);

-- 9. Explicit Table Permissions for Supabase Roles
GRANT ALL ON public.knowledge_documents TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.document_chunks TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.agent_runs TO postgres, anon, authenticated, service_role;
