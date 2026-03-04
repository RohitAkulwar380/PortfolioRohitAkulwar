"""
services/resume.py
──────────────────
Single Responsibility: Load and serve resume data from `data/resume.json`.
Open/Closed Principle: To swap to a DB source, only change this file —
  callers (routes) remain untouched.

The resume JSON is read once at startup and cached in memory to avoid
repeated disk I/O on every request.
"""

import json
import os
from pathlib import Path
from typing import Any


# ── Path resolution ──────────────────────────────────────────────────────────
# __file__ is services/resume.py → parent is services/ → parent is backend/
# data/ lives at the same level as services/, so we navigate up two levels.
_RESUME_PATH: Path = Path(__file__).parent.parent / "data" / "resume.json"


class ResumeService:
    """
    Loads and exposes resume data from resume.json.

    Usage:
        resume_service = ResumeService()
        data = resume_service.get_all()          # full dict
        text = resume_service.as_plain_text()    # formatted string for LLM prompt
    """

    def __init__(self, resume_path: Path = _RESUME_PATH) -> None:
        # Dependency injection: accept a custom path — makes unit testing easy.
        self._data: dict[str, Any] = self._load(resume_path)

    # ── Private ───────────────────────────────────────────────────────────────

    @staticmethod
    def _load(path: Path) -> dict[str, Any]:
        """Read and parse the JSON file. Raises FileNotFoundError if missing."""
        if not path.exists():
            raise FileNotFoundError(f"resume.json not found at: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    # ── Public API ────────────────────────────────────────────────────────────

    def get_all(self) -> dict[str, Any]:
        """Return the full resume dictionary (for the /api/resume endpoint)."""
        return self._data

