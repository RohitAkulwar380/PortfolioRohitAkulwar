"""
main.py
───────
FastAPI application entry point.

Responsibilities:
  - Create the FastAPI app instance.
  - Configure CORS so the React frontend can call the API.
  - Register all route modules under the /api prefix.
  - Create DB tables on startup.

Nothing else lives here — all business logic is in services/ and routes/.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import ALLOWED_ORIGINS
from models.database import create_tables
from routes import chat, resume


# ── Lifespan ──────────────────────────────────────────────────────────────────
# The lifespan context manager runs startup/shutdown logic without using the
# deprecated @app.on_event("startup") decorator.

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Startup: create DB tables (idempotent — safe to call on every restart).
    Shutdown: nothing to clean up for now.
    """
    create_tables()
    yield  # Application runs here
    # (Add cleanup logic below the yield if ever needed, e.g. closing a connection pool)


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Rohit Akulwar — Portfolio API",
    description="Backend API powering the AI-chat portfolio website.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the frontend origin(s) to call the API from the browser.
# allow_credentials=False because we use anonymous session IDs, not cookies.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],   # Only the methods our routes actually use.
    allow_headers=["Content-Type"],
)


# ── Routers ───────────────────────────────────────────────────────────────────
# All routes are grouped under /api to keep the API surface clean.
app.include_router(resume.router, prefix="/api")   # GET /api/resume, GET /api/health
app.include_router(chat.router, prefix="/api")     # POST /api/chat


# ── Dev entrypoint ────────────────────────────────────────────────────────────
# Run directly with: python main.py
# Or via uvicorn:    uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
