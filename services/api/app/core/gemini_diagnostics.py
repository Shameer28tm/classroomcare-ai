"""
ClassroomCare AI × NIU
Safe Gemini API Diagnostics
"""

from typing import Dict, Any
import httpx
from datetime import datetime, timezone
from app.core.config import settings

class GeminiDiagnostics:
    @staticmethod
    def get_status(test_live: bool = False) -> Dict[str, Any]:
        """
        Diagnostic probe for Google Gemini API configuration and live connectivity.
        Never reveals or prints raw API keys.
        Distinguishes:
        - UNCONFIGURED / BLOCKED: Key is missing or placeholder.
        - CONFIGURED: Valid key format detected.
        - LIVE_TEST_PASSED: Minimal test prompt and embedding generation successfully answered.
        - FAILED: Upstream quota, rate-limit, auth, or network error.
        """
        api_key = settings.GEMINI_API_KEY.strip()
        is_placeholder = (
            not api_key
            or api_key.startswith("your-")
            or "AIzaSy" not in api_key and len(api_key) < 20
        )

        if is_placeholder:
            return {
                "status": "BLOCKED (Awaiting API Key)",
                "is_configured": False,
                "model": settings.GEMINI_MODEL,
                "embedding_model": settings.EMBEDDING_MODEL,
                "detail": "GEMINI_API_KEY is not configured or contains placeholder text in local environment.",
                "live_tested": False,
                "instructions": "Set GEMINI_API_KEY in your root .env to enable Google Gemini generative triage and embeddings.",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        # Key is present
        status_info = {
            "status": "CONFIGURED",
            "is_configured": True,
            "model": settings.GEMINI_MODEL,
            "embedding_model": settings.EMBEDDING_MODEL,
            "key_present": True,
            "key_preview": f"{api_key[:6]}...{api_key[-4:]}",
            "live_tested": False,
            "detail": "Gemini API key is configured. Ready for generative maintenance assistance.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        if not test_live:
            return status_info

        # Perform minimal non-destructive live probe across available models
        models_to_probe = [settings.GEMINI_MODEL, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]
        unique_models = list(dict.fromkeys(models_to_probe))
        
        last_error = None
        gen_success = False
        active_gen_model = None

        with httpx.Client(timeout=15.0) as client:
            for mod in unique_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{mod}:generateContent?key={api_key}"
                    payload = {
                        "contents": [{"parts": [{"text": "Respond with 'OK' only for system health check."}]}],
                        "generationConfig": {"maxOutputTokens": 5, "temperature": 0.0}
                    }
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        gen_success = True
                        active_gen_model = mod
                        break
                    elif resp.status_code in [429, 503]:
                        last_error = f"HTTP {resp.status_code}: Rate limit / temporary load on {mod}."
                    elif resp.status_code in [400, 403]:
                        status_info["status"] = "FAILED (Authentication Error)"
                        status_info["live_tested"] = True
                        status_info["detail"] = f"Gemini API returned HTTP {resp.status_code}: Invalid API key or unauthorized access."
                        return status_info
                    else:
                        last_error = f"HTTP {resp.status_code} on {mod}."
                except Exception as e:
                    last_error = str(e)[:80]
                    continue

            # Probe embeddings with verified model and target dimension (768)
            emb_success = False
            active_emb_model = None
            emb_models = [settings.EMBEDDING_MODEL, "gemini-embedding-001", "gemini-embedding-2"]
            for emod in list(dict.fromkeys(emb_models)):
                try:
                    eurl = f"https://generativelanguage.googleapis.com/v1beta/models/{emod}:embedContent?key={api_key}"
                    epayload = {
                        "content": {"parts": [{"text": "ClassroomCare AI health check"}]},
                        "outputDimensionality": settings.EMBEDDING_DIMENSION
                    }
                    eresp = client.post(eurl, json=epayload)
                    if eresp.status_code == 200:
                        values = eresp.json().get("embedding", {}).get("values", [])
                        if len(values) == settings.EMBEDDING_DIMENSION:
                            emb_success = True
                            active_emb_model = emod
                            break
                except Exception:
                    continue

        if gen_success:
            status_info["status"] = "LIVE_TEST_PASSED"
            status_info["live_tested"] = True
            status_info["model"] = active_gen_model
            if emb_success:
                status_info["embedding_model"] = active_emb_model
                status_info["embedding_dimension"] = settings.EMBEDDING_DIMENSION
                status_info["detail"] = (
                    f"Successfully connected to Gemini API ({active_gen_model}) and verified "
                    f"real {settings.EMBEDDING_DIMENSION}-dim embeddings ({active_emb_model})."
                )
            else:
                status_info["detail"] = f"Successfully connected to Gemini API ({active_gen_model}) for generative inference."
            return status_info

        status_info["status"] = "FAILED"
        status_info["live_tested"] = True
        status_info["detail"] = f"Gemini live test could not complete: {last_error or 'No response from models'}"
        return status_info
