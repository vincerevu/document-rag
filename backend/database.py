import aiosqlite
import json
from pathlib import Path
from config import settings

DB_PATH = settings.sqlite_db_path

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    chunk_count INTEGER,
    status TEXT DEFAULT 'completed',
    source_type TEXT DEFAULT 'file',
    error_message TEXT,
    source_url TEXT,
    progress INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connectors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT NOT NULL,
    status TEXT DEFAULT 'disconnected',
    document_count INTEGER DEFAULT 0,
    last_synced TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    sources TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
"""

# Columns to add to existing documents table (safe migration)
_DOCUMENTS_MIGRATIONS = [
    ("status", "TEXT DEFAULT 'completed'"),
    ("source_type", "TEXT DEFAULT 'file'"),
    ("error_message", "TEXT"),
    ("source_url", "TEXT"),
    ("progress", "INTEGER DEFAULT 100"),
]


async def init_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        # Safe column additions for existing DBs
        for col_name, col_def in _DOCUMENTS_MIGRATIONS:
            try:
                await db.execute(f"ALTER TABLE documents ADD COLUMN {col_name} {col_def}")
            except Exception:
                pass  # Column already exists
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA foreign_keys=ON")
        await db.commit()


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
    finally:
        await db.close()
