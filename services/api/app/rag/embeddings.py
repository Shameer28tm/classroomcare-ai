from typing import List
import hashlib
from app.core.config import settings

class EmbeddingProvider:
    def embed_text(self, text: str) -> List[float]:
        raise NotImplementedError

class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: str, model: str = "text-embedding-004"):
        self.api_key = api_key
        self.model = model

    def embed_text(self, text: str) -> List[float]:
        # If no key, fallback safely to deterministic mock embeddings
        if not self.api_key or self.api_key.startswith("your-"):
            return MockEmbeddingProvider().embed_text(text)
        try:
            import httpx
            # Call Google Gemini embedding endpoint
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:embedContent?key={self.api_key}"
            payload = {
                "model": f"models/{self.model}",
                "content": {"parts": [{"text": text}]}
            }
            resp = httpx.post(url, json=payload, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                return data["embedding"]["values"]
        except Exception:
            pass
        return MockEmbeddingProvider().embed_text(text)

class MockEmbeddingProvider(EmbeddingProvider):
    """
    Deterministic pseudo-vector generator for local offline development and test suites.
    Produces unit-length 768-dimensional vectors based on word hashes.
    """
    def embed_text(self, text: str) -> List[float]:
        dim = settings.EMBEDDING_DIMENSION
        vec = [0.0] * dim
        words = text.lower().split()
        if not words:
            return vec
        for i, word in enumerate(words):
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % dim
            vec[idx] += 1.0 / (1.0 + (i % 5))
            
        # Normalize vector
        magnitude = sum(x * x for x in vec) ** 0.5
        if magnitude > 0:
            vec = [x / magnitude for x in vec]
        return vec

def get_embedding_provider() -> EmbeddingProvider:
    if settings.EMBEDDING_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        return GeminiEmbeddingProvider(settings.GEMINI_API_KEY, settings.EMBEDDING_MODEL)
    return MockEmbeddingProvider()
