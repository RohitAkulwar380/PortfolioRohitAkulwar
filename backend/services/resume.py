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

    def as_plain_text(self) -> str:
        """
        Convert resume data into a readable plain-text block for injection
        into the LLM system prompt. Each section is clearly labelled.

        DRY: a single loop renders every section — no copy-pasted sections.
        """
        d = self._data
        personal = d.get("personal", {})
        lines: list[str] = []

        # ── Personal ─────────────────────────────────────────────────────────
        lines.append("=== PERSONAL ===")
        lines.append(f"Name: {personal.get('name', '')}")
        lines.append(f"Title: {personal.get('title', '')}")
        lines.append(f"Email: {personal.get('email', '')}")
        lines.append(f"Phone: {personal.get('phone', '')}")
        lines.append(f"Location: {personal.get('location', '')}")
        lines.append(f"LinkedIn/GitHub: {personal.get('linkedin', '')} | {personal.get('github', '')}")
        lines.append(f"\nObjective:\n{personal.get('objective', '')}")

        # ── Education ─────────────────────────────────────────────────────────
        lines.append("\n=== EDUCATION ===")
        for edu in d.get("education", []):
            lines.append(
                f"- {edu['degree']} | {edu['institution']} | {edu['dates']} | {edu['score']}"
            )

        # ── Skills ────────────────────────────────────────────────────────────
        skills = d.get("skills", {})
        lines.append("\n=== SKILLS ===")
        lines.append("Technical: " + ", ".join(skills.get("technical", [])))
        lines.append("Soft Skills: " + ", ".join(skills.get("soft", [])))

        # ── Projects ──────────────────────────────────────────────────────────
        lines.append("\n=== PROJECTS ===")
        for project in d.get("projects", []):
            tech = ", ".join(project.get("technologies", []))
            lines.append(f"\n• {project['title']}")
            lines.append(f"  Tech: {tech}")
            lines.append(f"  {project['description']}")

        return "\n".join(lines)
