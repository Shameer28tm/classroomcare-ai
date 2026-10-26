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
        - LIVE_TEST_PASSED: Minimal test prompt successfully answered.
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

        # Perform minimal non-destructive live probe
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": "Respond with 'OK' only for system health check."}]}],
                "generationConfig": {"maxOutputTokens": 5, "temperature": 0.0}
            }
            with httpx.Client(timeout=8.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    status_info["status"] = "LIVE_TEST_PASSED"
                    status_info["live_tested"] = True
                    status_info["detail"] = "Successfully connected to Gemini API and received valid generative response."
                elif resp.status_code == 429:
                    status_info["status"] = "FAILED (Rate Limit / Quota Exceeded)"
                    status_info["live_tested"] = True
                    status_info["detail"] = "Gemini API returned HTTP 429: Resource exhausted or quota limit reached."
                elif resp.status_code == 400 or resp.status_code == 403:
                    status_info["status"] = "FAILED (Authentication Error)"
                    status_info["live_tested"] = True
                    status_info["detail"] = f"Gemini API returned HTTP {resp.status_code}: Invalid API key or unauthorized model access."
                else:
                    status_info["status"] = f"FAILED (HTTP {resp.status_code})"
                    status_info["live_tested"] = True
                    status_info["detail"] = f"Gemini API returned unexpected status code {resp.status_code}."
        except httpx.TimeoutException:
            status_info["status"] = "FAILED (Timeout)"
            status_info["live_tested"] = True
            status_info["detail"] = "Gemini API request timed out after 8.0 seconds."
        except Exception as e:
            status_info["status"] = "FAILED (Network Error)"
            status_info["live_tested"] = True
            status_info["detail"] = f"Unable to reach Google API endpoints: {str(e)[:80]}"

        return status_info
