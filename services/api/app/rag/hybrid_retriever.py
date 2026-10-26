import math
from typing import List, Tuple, Dict
from app.models.schemas import DocumentChunk
from app.core.database import repository
from app.rag.embeddings import get_embedding_provider

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    mag1 = math.sqrt(sum(a * a for a in v1))
    mag2 = math.sqrt(sum(b * b for b in v2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)

class HybridRetriever:
    def __init__(self):
        self.embedding_provider = get_embedding_provider()

    def retrieve(
        self,
        campus_id: str,
        query: str,
        top_k: int = 5,
        category_filter: str = None
    ) -> List[DocumentChunk]:
        """
        Executes Reciprocal Rank Fusion (RRF) between lexical keyword matching
        and semantic vector cosine similarity.
        """
        # 1. Fetch authorized chunks for campus
        available_chunks: List[DocumentChunk] = []
        for chunk in repository.document_chunks.values():
            parent_doc = repository.knowledge_docs.get(chunk.document_id)
            if parent_doc and parent_doc.campus_id == campus_id:
                if category_filter and parent_doc.category != category_filter:
                    continue
                available_chunks.append(chunk)

        if not available_chunks:
            return []

        # 2. Lexical Keyword Scoring
        query_terms = set(query.lower().split())
        lexical_scores: List[Tuple[DocumentChunk, float]] = []
        for chk in available_chunks:
            chunk_text = chk.content.lower()
            matches = sum(1 for term in query_terms if term in chunk_text)
            score = matches / max(len(query_terms), 1)
            lexical_scores.append((chk, score))

        # Rank by lexical score descending
        lexical_ranked = sorted(lexical_scores, key=lambda x: x[1], reverse=True)

        # 3. Semantic Vector Scoring
        query_vec = self.embedding_provider.embed_text(query)
        semantic_scores: List[Tuple[DocumentChunk, float]] = []
        for chk in available_chunks:
            chk_vec = self.embedding_provider.embed_text(chk.content)
            sim = cosine_similarity(query_vec, chk_vec)
            semantic_scores.append((chk, sim))

        semantic_ranked = sorted(semantic_scores, key=lambda x: x[1], reverse=True)

        # 4. Reciprocal Rank Fusion (RRF)
        # RRF score = 1 / (60 + rank_lex) + 1 / (60 + rank_sem)
        k_rrf = 60
        rrf_map: Dict[str, float] = {}
        chunk_map: Dict[str, DocumentChunk] = {c.id: c for c in available_chunks}

        for rank, (chk, _) in enumerate(lexical_ranked):
            rrf_map[chk.id] = rrf_map.get(chk.id, 0.0) + (1.0 / (k_rrf + rank + 1))

        for rank, (chk, _) in enumerate(semantic_ranked):
            rrf_map[chk.id] = rrf_map.get(chk.id, 0.0) + (1.0 / (k_rrf + rank + 1))

        # Sort by final RRF score
        sorted_rrf = sorted(rrf_map.items(), key=lambda x: x[1], reverse=True)

        results: List[DocumentChunk] = []
        for chunk_id, score in sorted_rrf[:top_k]:
            chunk_copy = chunk_map[chunk_id].model_copy()
            # Normalize score approximately 0-1 for UI display
            chunk_copy.relevance_score = min(round(score * 30.0, 3), 0.99)
            results.append(chunk_copy)

        return results

retriever = HybridRetriever()
