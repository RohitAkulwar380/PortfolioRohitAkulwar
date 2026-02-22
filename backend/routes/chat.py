"""
routes/chat.py
──────────────
Single Responsibility: Handle POST /api/chat requests only.

The route itself contains NO business logic — it delegates to
ResumeService (data loading) and OpenRouterService (LLM call).
This keeps the route "thin" and focused solely on HTTP concerns:
  - Request validation (via Pydantic)
  - Calling services
  - Logging the exchange to the DB
  - Returning the response
"""

import uuid
import json  # <-- Added json import
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import insert
from sqlalchemy.exc import SQLAlchemyError

from models.database import chat_logs, engine
from services.openrouter import OpenRouterService
from services.resume import ResumeService

# ── Router ────────────────────────────────────────────────────────────────────
# prefix and tags are applied when this router is registered in main.py.
router = APIRouter(prefix="/chat", tags=["Chat"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """
    Validated body for POST /api/chat.
    session_id is optional: the frontend should generate a UUID per browser
    session and send it so conversations can be grouped in chat_logs.
    """
    message: str = Field(..., min_length=1, max_length=2000, description="User's question")
    session_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Anonymous session identifier (UUID). Auto-generated if omitted.",
    )


class ChatResponse(BaseModel):
    """Response envelope returned to the frontend."""
    reply: str
    session_id: str


# ── Dependency injection ──────────────────────────────────────────────────────
# Using FastAPI's Depends() lets us inject mock services in tests without
# modifying the route at all — Dependency Inversion Principle in practice.

def get_resume_service() -> ResumeService:
    return ResumeService()


def get_openrouter_service() -> OpenRouterService:
    return OpenRouterService()


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(
    body: ChatRequest,
    resume_svc: Annotated[ResumeService, Depends(get_resume_service)],
    llm_svc: Annotated[OpenRouterService, Depends(get_openrouter_service)],
) -> ChatResponse:
    """
    Accept a user message, call the LLM with resume context, return the reply.

    Steps:
      1. Get plain-text resume from ResumeService.
      2. Send user message + resume context to OpenRouterService.
      3. Log the exchange to chat_logs (best-effort — never blocks the response).
      4. Return the AI reply to the caller.
    """
    # Step 1: Get ALL resume data and dump to a raw JSON string.
    # This ensures the new 'ai_context' fields are not accidentally filtered out.
    resume_data = resume_svc.get_all()
    candidate_name: str = resume_data.get("personal", {}).get("name", "Rohit")
    
    # THE FIX: Replace .as_plain_text() with a full JSON dump
    resume_text: str = json.dumps(resume_data, indent=2)

    # Step 2: Call the LLM — this is the async network call (may take 2–5s).
    try:
        reply = await llm_svc.chat(
            user_message=body.message,
            resume_text=resume_text,
            candidate_name=candidate_name,
        )
    except Exception as exc:
        # Surface a clean 502 rather than leaking internal details.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM service error: {exc}",
        ) from exc

    # Step 3: Log to DB — best-effort (we don't want a DB hiccup to crash chat).
    try:
        with engine.connect() as conn:
            conn.execute(
                insert(chat_logs).values(
                    session_id=body.session_id,
                    user_message=body.message,
                    ai_response=reply,
                )
            )
            conn.commit()
    except SQLAlchemyError:
        # Log silently — in production you'd emit a structured log entry here.
        pass

    return ChatResponse(reply=reply, session_id=body.session_id)