import pytest
from app.models.schemas import RAGQueryRequest
from app.rag.assistant import rag_assistant
from app.rag.hybrid_retriever import retriever

def test_rag_retriever_finds_relevant_manual():
    chunks = retriever.retrieve(
        campus_id="campus-main-01",
        query="Trane compressor high pressure fault reset",
        top_k=2
    )
    assert len(chunks) > 0
    top_chunk = chunks[0]
    assert "Trane" in top_chunk.document_title or "HVAC" in top_chunk.document_title
    assert top_chunk.relevance_score is not None

def test_rag_assistant_grounded_answer():
    req = RAGQueryRequest(
        campus_id="campus-main-01",
        query="What is the permitted refrigerant and test pressure for the Trane Voyager unit?"
    )
    res = rag_assistant.answer_query(req)
    assert res.grounded is True
    assert res.abstained is False
    assert res.confidence_score >= 0.65
    assert len(res.citations) > 0
    assert "R-410A" in res.answer or "Trane Voyager" in res.answer

def test_rag_assistant_abstains_on_unknown_topic():
    req = RAGQueryRequest(
        campus_id="campus-main-01",
        query="How do I repair a submarine nuclear reactor propulsion valve?"
    )
    res = rag_assistant.answer_query(req)
    assert res.abstained is True
    assert res.grounded is False
    assert "Insufficient" in res.answer or "inspection" in res.answer
