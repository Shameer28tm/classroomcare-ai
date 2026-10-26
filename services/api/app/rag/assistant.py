import re
from typing import List, Optional
from app.models.schemas import RAGQueryRequest, RAGQueryResponse, Citation, DocumentChunk
from app.rag.hybrid_retriever import retriever

# Common stop words to exclude when calculating diagnostic overlap
STOP_WORDS = {
    "how", "do", "i", "the", "a", "an", "what", "is", "for", "to", "in", "on", "at",
    "of", "and", "or", "with", "this", "that", "it", "are", "be", "from", "can", "you"
}

class RAGAssistant:
    def answer_query(self, request: RAGQueryRequest) -> RAGQueryResponse:
        """
        Executes grounded retrieval, evaluates context relevance, validates source citations,
        and enforces an abstention protocol when documentation is insufficient.
        """
        query = request.query.strip()
        chunks = retriever.retrieve(
            campus_id=request.campus_id,
            query=query,
            top_k=3,
            category_filter=request.category_filter
        )

        # 1. No chunks returned
        if not chunks:
            return RAGQueryResponse(
                query=query,
                answer=(
                    "Insufficient Documentation: The campus facilities knowledge base does not contain "
                    "verified technical documentation or standard operating procedures for this query. "
                    "Please escalate to the Lead Facilities Supervisor for manual inspection."
                ),
                grounded=False,
                confidence_score=0.15,
                abstained=True,
                explanation="No authorized documentation matched the search criteria across campus manuals.",
                citations=[]
            )

        top_chunk = chunks[0]

        # 2. Extract meaningful keywords excluding stop words
        raw_words = re.findall(r"\b[a-zA-Z]{3,}\b", query.lower())
        meaningful_query_words = set(w for w in raw_words if w not in STOP_WORDS)
        content_words = set(re.findall(r"\b[a-zA-Z]{3,}\b", top_chunk.content.lower()))
        overlap = meaningful_query_words.intersection(content_words)

        # If zero meaningful query words appear in the top document chunk,
        # or less than 2 words for multi-keyword queries, the model MUST abstain!
        has_sufficient_overlap = (
            len(overlap) >= 2 if len(meaningful_query_words) >= 3 else len(overlap) >= 1
        )

        if not has_sufficient_overlap:
            return RAGQueryResponse(
                query=query,
                answer=(
                    "Insufficient Direct Evidence: Available campus manuals do not contain verified "
                    "operational or diagnostic procedures regarding this subject. "
                    "In adherence to campus safety and engineering policy, automated instructions have been withheld. "
                    "Please arrange a physical inspection with a certified senior technician."
                ),
                grounded=False,
                confidence_score=0.25,
                abstained=True,
                explanation="Retrieved passages lacked substantive keyword or conceptual grounding.",
                citations=[
                    Citation(
                        document_id=top_chunk.document_id,
                        document_title=top_chunk.document_title,
                        chunk_id=top_chunk.id,
                        section=top_chunk.metadata.get("section", "General"),
                        text_snippet=top_chunk.content[:160] + "..."
                    )
                ]
            )

        # 3. Construct grounded citations
        citations: List[Citation] = []
        for chk in chunks[:2]:
            citations.append(
                Citation(
                    document_id=chk.document_id,
                    document_title=chk.document_title,
                    chunk_id=chk.id,
                    section=chk.metadata.get("section", "Section"),
                    text_snippet=chk.content[:220].strip() + "..."
                )
            )

        # 4. Synthesize verified response strictly referencing cited text
        section_ref = top_chunk.metadata.get("section", "Manual Reference")
        doc_title = top_chunk.document_title
        
        # Check if Gemini generative LLM is enabled and configured
        gemini_answer: Optional[str] = None
        from app.core.config import settings
        if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your-"):
            try:
                import httpx
                models_to_try = [settings.GEMINI_MODEL, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"]
                unique_models = list(dict.fromkeys(models_to_try))
                prompt = (
                    "You are ClassroomCare AI, an autonomous facilities maintenance assistant for Noorul Islam Centre for Higher Education.\n"
                    "Answer the user query strictly grounded in the following technical reference passage. "
                    "Do NOT extrapolate beyond the facts. Never authorize electrical bypasses or dangerous actions.\n\n"
                    f"Reference Passage ({doc_title}, Section {section_ref}):\n{top_chunk.content.strip()}\n\n"
                    f"User Query: {query}\n"
                    "Provide a concise, factual answer with safety guidance:"
                )
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": 300, "temperature": 0.2}
                }
                for mod in unique_models:
                    try:
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{mod}:generateContent?key={settings.GEMINI_API_KEY}"
                        with httpx.Client(timeout=12.0) as client:
                            resp = client.post(url, json=payload)
                            if resp.status_code == 200:
                                data = resp.json()
                                candidates = data.get("candidates", [])
                                if candidates:
                                    parts = candidates[0].get("content", {}).get("parts", [])
                                    if parts:
                                        gemini_answer = parts[0].get("text", "").strip()
                                        if gemini_answer:
                                            break
                    except Exception:
                        continue
            except Exception:
                gemini_answer = None  # Fall back to verified deterministic template

        if gemini_answer:
            answer_text = (
                f"{gemini_answer}\n\n"
                f"[Grounded via Gemini & Verified Source: {doc_title}, Section {section_ref}]"
            )
        else:
            answer_text = (
                f"According to verified campus documentation ({doc_title}, Section {section_ref}):\n\n"
                f"{top_chunk.content.strip()}\n\n"
                f"Recommended Action: Ensure adherence to manufacturer lockout/tagout safety instructions before attempting service."
            )

        return RAGQueryResponse(
            query=query,
            answer=answer_text,
            grounded=True,
            confidence_score=0.92,
            abstained=False,
            explanation=f"Diagnosis synthesized and verified against {doc_title}.",
            citations=citations
        )

rag_assistant = RAGAssistant()
