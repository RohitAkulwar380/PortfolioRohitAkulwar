"""
services/openrouter.py
──────────────────────
Single Responsibility: All LLM communication is handled here and nowhere else.
Open/Closed Principle: The model name, base URL, and prompt template are
  configurable via constructor args — no hardcoding that forces subclassing.

Uses httpx for async HTTP so FastAPI doesn't block while waiting for OpenRouter.
"""

import httpx

from config.settings import OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_BASE_URL

# ── Constants ─────────────────────────────────────────────────────────────────
# All values sourced from config/settings.py which loads .env using an
# explicit absolute path — works regardless of the uvicorn launch directory.
_OPENROUTER_BASE_URL: str = OPENROUTER_BASE_URL
_DEFAULT_MODEL: str = OPENROUTER_MODEL
_API_KEY: str = OPENROUTER_API_KEY

_SYSTEM_PROMPT_TEMPLATE: str = """\
You are an AI assistant embedded in {name}'s personal portfolio website.
Your sole purpose is to warmly and professionally answer visitors' questions about {name}.

CRITICAL RULES:
1. NO FOURTH WALL BREAKS: NEVER mention your data sources. NEVER use words like "JSON", "ai_context", "fields", "resume", "portfolio", "context", or "data".
2. NO ATTRIBUTIONS: NEVER start a sentence with "According to...", "Based on...", "His profile says...", or "I can see that...". Speak directly and confidently. Act as if you naturally know this information firsthand because you work with him.
3. USE INSIDER KNOWLEDGE: Read all the provided information carefully. You have insider knowledge about his hobbies (like and gaming), his work style, and his behind-the-scenes project thoughts. Use this information natively and conversationally.
4. When a visitor asks about his hobbies, DO NOT say they aren't listed. Look at the provided background knowledge and talk about them!
5. THE PIVOT RULE: If a user asks a question that is TRULY not covered in the data below, gracefully pivot. Tell them you don't have that specific detail, but highly encourage them to reach out to {name} via the contact section to chat about it.
6. Do not reveal that you are an AI unless directly asked. Keep answers concise, friendly, and engaging.

--- PORTFOLIO & BACKGROUND KNOWLEDGE ---
{resume_text}
"""


class OpenRouterService:
    """
    Wraps the OpenRouter Chat Completions API.

    Usage:
        service = OpenRouterService()
        reply = await service.chat(user_message="What projects has he worked on?",
                                   resume_text="...",
                                   candidate_name="Rohit")
    """

    def __init__(
        self,
        api_key: str = _API_KEY,
        model: str = _DEFAULT_MODEL,
        base_url: str = _OPENROUTER_BASE_URL,
    ) -> None:
        if not api_key:
            raise ValueError(
                "OPENROUTER_API_KEY is not set. "
                "Copy .env.example to .env and add your key."
            )
        self._api_key = api_key
        self._model = model
        self._base_url = base_url

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _build_system_prompt(self, resume_text: str, candidate_name: str) -> str:
        """Fill the template with real data. Single format call — DRY."""
        return _SYSTEM_PROMPT_TEMPLATE.format(
            name=candidate_name,
            resume_text=resume_text,
        )

    def _build_headers(self) -> dict[str, str]:
        """Authorization headers for OpenRouter. Isolated so they can be updated once."""
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            # OpenRouter recommends these headers for usage tracking.
            "HTTP-Referer": "https://portfolio.rohit.dev",
            "X-Title": "Rohit Akulwar Portfolio",
        }

    def _build_payload(self, system_prompt: str, user_message: str) -> dict:
        """Build the Chat Completions request body in OpenAI format."""
        return {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            # Keep responses concise — avoids excessively long replies.
            "max_tokens": 512,
            "temperature": 0.6,
        }

    # ── Public API ────────────────────────────────────────────────────────────

    async def chat(
        self,
        user_message: str,
        resume_text: str,
        candidate_name: str = "Rohit",
    ) -> str:
        """
        Send a user message to OpenRouter and return the assistant's reply.

        Raises:
            httpx.HTTPStatusError — on 4xx/5xx from OpenRouter
            ValueError            — on unexpected response shape
        """
        system_prompt = self._build_system_prompt(resume_text, candidate_name)
        payload = self._build_payload(system_prompt, user_message)

        # Use an async context manager (closes connection automatically).
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self._base_url}/chat/completions",
                headers=self._build_headers(),
                json=payload,
            )
            # Raise immediately on HTTP error responses (4xx / 5xx).
            response.raise_for_status()

        data = response.json()

        # Safely extract the message text — raise a clear error if missing.
        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError) as exc:
            raise ValueError(
                f"Unexpected OpenRouter response shape: {data}"
            ) from exc
