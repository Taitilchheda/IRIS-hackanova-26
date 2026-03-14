"""
Unified LLM calling utility.
"""
from app.config import settings
from app.utils.logger import get_logger
import httpx
import os

log = get_logger(__name__)

def _call_llm(system: str, user: str) -> str:
    """Try Anthropic first, then Groq, then OpenRouter (OpenAI-compatible), else return ''."""
    
    # Anthropic
    if settings.anthropic_api_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            msg = client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=1024,
                system=system.encode('ascii', 'ignore').decode('ascii'),
                messages=[{"role": "user", "content": user.encode('ascii', 'ignore').decode('ascii')}],
            )
            return msg.content[0].text.strip()
        except Exception as e:
            log.warning(f"LLM call via Anthropic failed: {e}")

    # Groq (Extreme speed)
    if settings.groq_api_key:
        try:
            headers = {
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system.encode('ascii', 'ignore').decode('ascii')},
                    {"role": "user", "content": user.encode('ascii', 'ignore').decode('ascii')},
                ],
                "max_tokens": 1024,
                "temperature": 0.1,
            }
            resp = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            log.warning(f"LLM call via Groq failed: {e}")

    # OpenRouter
    if settings.openrouter_api_key:
        try:
            headers = {
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": settings.openrouter_model or "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system.encode('ascii', 'ignore').decode('ascii')},
                    {"role": "user", "content": user.encode('ascii', 'ignore').decode('ascii')},
                ],
                "max_tokens": 1024,
                "temperature": 0.3,
            }
            resp = httpx.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=20.0,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            log.warning(f"LLM call via OpenRouter failed: {e}")

    return ""
