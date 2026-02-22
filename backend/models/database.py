"""
models/database.py
──────────────────
Single Responsibility: Database engine setup and table definitions only.
No business logic lives here.

Design decision: Using SQLAlchemy Core (not ORM) for the chat_logs table
so we avoid heavy ORM overhead for a simple append-only log.
"""

import asyncio
from sqlalchemy import (
    create_engine,
    MetaData,
    Table,
    Column,
    Integer,
    String,
    Text,
    DateTime,
)
from sqlalchemy.sql import func
from config.settings import DATABASE_URL

# ── Engine ────────────────────────────────────────────────────────────────────
# DATABASE_URL sourced from config/settings.py (loaded from backend/.env).
#
# SQLite requires check_same_thread=False for FastAPI.
# Postgres (Supabase) requires SSL. We append ?sslmode=require to the URL
# if it's not already there, rather than using connect_args which can clash.
_is_sqlite = DATABASE_URL.startswith("sqlite")

final_url = DATABASE_URL
if not _is_sqlite and "sslmode=" not in final_url.lower():
    separator = "&" if "?" in final_url else "?"
    final_url = f"{final_url}{separator}sslmode=require"

connect_args = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(final_url, connect_args=connect_args)

# Shared metadata registry — all tables are registered here.
metadata = MetaData()

# ── Table: chat_logs ──────────────────────────────────────────────────────────
# Optional but useful: stores every chat exchange for analytics / debugging.
chat_logs = Table(
    "chat_logs",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    # Anonymous session ID sent by the frontend — lets us group a conversation.
    Column("session_id", String(64), nullable=False, index=True),
    Column("user_message", Text, nullable=False),
    Column("ai_response", Text, nullable=False),
    # server_default uses the DB's current timestamp — no Python datetime needed.
    Column("created_at", DateTime, server_default=func.now(), nullable=False),
)


async def create_tables() -> None:
    """
    Create all tables that are registered in `metadata` if they don't exist.
    Called once at app startup from main.py. Runs in a thread to avoid blocking.
    """
    await asyncio.to_thread(metadata.create_all, engine)
