from typing import List
import hashlib
from app.core.config import settings

class EmbeddingProvider:
    def embed_text(self, text: str) -> List[float]:
        raise NotImplementedError

class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: str, model: str = "gemini-embedding-001"):
        self.api_key = api_key
        self.model = model

    def embed_text(self, text: str) -> List[float]:
        # If no key, fallback safely to deterministic mock embeddings
        if not self.api_key or self.api_key.startswith("your-"):
            return MockEmbeddingProvider().embed_text(text)
        
        models_to_try = [self.model, "gemini-embedding-001", "gemini-embedding-2"]
        # Remove duplicates while preserving order
        unique_models = list(dict.fromkeys(models_to_try))
        
        import httpx
        for mod in unique_models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{mod}:embedContent?key={self.api_key}"
                payload = {
                    "model": f"models/{mod}",
                    "content": {"parts": [{"text": text}]},
                    "outputDimensionality": settings.EMBEDDING_DIMENSION
                }
                resp = httpx.post(url, json=payload, timeout=12.0)
                if resp.status_code == 200:
                    data = resp.json()
                    values = data.get("embedding", {}).get("values", [])
                    if values and len(values) == settings.EMBEDDING_DIMENSION:
                        return values
                    elif values and len(values) > settings.EMBEDDING_DIMENSION:
                        return values[:settings.EMBEDDING_DIMENSION]
            except Exception:
                continue

        if settings.ENVIRONMENT.lower() == "production" and not settings.ENABLE_DEMO_DATA:
            raise RuntimeError("Gemini embedding generation failed in production: real provider response required.")
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
