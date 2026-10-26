from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from app.models.schemas import KnowledgeDocument, DocumentChunk, RAGQueryRequest, RAGQueryResponse
from app.core.database import repository
from app.core.security import get_current_user, require_permission, AuthenticatedUser
from app.rag.assistant import rag_assistant

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base & RAG Assistant"])

@router.get("/documents", response_model=List[KnowledgeDocument])
def list_documents(
    campus_id: str = Query("campus-main-01"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    return [d for d in repository.knowledge_docs.values() if d.campus_id == campus_id]

@router.get("/chunks", response_model=List[DocumentChunk])
def list_chunks(
    document_id: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    if document_id:
        return [c for c in repository.document_chunks.values() if c.document_id == document_id]
    return list(repository.document_chunks.values())

@router.post("/query", response_model=RAGQueryResponse)
def query_knowledge_assistant(
    request: RAGQueryRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    return rag_assistant.answer_query(request)

@router.post("/upload", response_model=KnowledgeDocument)
async def upload_document(
    title: str = Form(...),
    category: str = Form(...),
    version: str = Form("v1.0"),
    content: str = Form(...),
    file: Optional[UploadFile] = File(None),
    user: AuthenticatedUser = Depends(require_permission("knowledge:upload"))
):
    if not content.strip():
        raise HTTPException(status_code=422, detail="Document content cannot be empty.")
    now = datetime.now(timezone.utc).isoformat()
    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    doc = KnowledgeDocument(
        id=doc_id,
        campus_id=user.campus_id,
        title=title,
        category=category,
        file_type="txt",
        file_size_bytes=len(content.encode("utf-8")),
        version=version,
        chunk_count=1,
        uploaded_by=user.full_name,
        created_at=now,
        status="Ready"
    )
    repository.knowledge_docs[doc_id] = doc
    
    # Chunk and store
    chunk_id = f"chk-{uuid.uuid4().hex[:8]}"
    chunk = DocumentChunk(
        id=chunk_id,
        document_id=doc_id,
        document_title=title,
        chunk_index=1,
        content=content,
        metadata={"category": category, "version": version, "section": "1.0"}
    )
    repository.document_chunks[chunk_id] = chunk
    return doc
