"""
routes/resume.py
────────────────
Single Responsibility: Serve read-only resume data and app health status.

Two endpoints:
  GET /api/resume  — returns the full structured resume JSON
  GET /api/health  — returns {"status": "ok"} for uptime monitoring / Cloudflare health checks
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, Any

from services.resume import ResumeService

# ── Router ────────────────────────────────────────────────────────────────────
router = APIRouter(tags=["Resume"])


# ── Dependency ─────────────────────────────────────────────────────────────────

def get_resume_service() -> ResumeService:
    """
    Returns a ResumeService instance.
    Centralised here so switching to a DB-backed service only changes this
    one function — not the route handlers (Open/Closed Principle).
    """
    return ResumeService()


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/resume", status_code=status.HTTP_200_OK)
async def get_resume(
    resume_svc: Annotated[ResumeService, Depends(get_resume_service)],
) -> dict[str, Any]:
    """
    Return the full resume as structured JSON.
    Used by the frontend to render portfolio sections without hardcoding data.
    """
    try:
        return resume_svc.get_all()
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get("/health", status_code=status.HTTP_200_OK)
@router.head("/health", status_code=status.HTTP_200_OK)
async def health_check() -> dict[str, str]:
    """
    Lightweight health check endpoint.
    Returns 200 OK with {"status": "ok"} when the server is up.
    Used by Cloudflare Tunnel and uptime monitors.
    """
    return {"status": "ok"}
