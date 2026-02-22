"""
config/settings.py
──────────────────
Single Responsibility: All environment/config loading lives here.
Every other module imports from this file — never calls load_dotenv directly.

By computing the .env path relative to THIS file's location, settings.py
works correctly regardless of the working directory uvicorn is launched from.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# ── Resolve .env path relative to this file (backend/.env) ───────────────────
# This file lives at: backend/config/settings.py
# .env lives at:      backend/.env
# So we go up two levels: config/ → backend/
_BACKEND_DIR: Path = Path(__file__).parent.parent
_ENV_FILE: Path = _BACKEND_DIR / ".env"

# load_dotenv with an explicit path — never fails silently due to cwd issues.
load_dotenv(dotenv_path=_ENV_FILE)

# ── App settings ──────────────────────────────────────────────────────────────

# OpenRouter
OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-r1:free")
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

# Database
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./portfolio.db")

# CORS — comma-separated list of allowed origins
_raw_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",")]
