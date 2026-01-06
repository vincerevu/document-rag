import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from models.schemas import ConversationOut, ConversationCreate, ConversationDetail, MessageOut, Source
from database import get_db

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations():
    async for db in get_db():
        cursor = await db.execute("SELECT * FROM conversations ORDER BY updated_at DESC")
        rows = await cursor.fetchall()
        return [
            ConversationOut(
                id=row["id"], title=row["title"],
                created_at=row["created_at"], updated_at=row["updated_at"],
            )
            for row in rows
        ]


@router.post("/conversations", response_model=ConversationOut)
async def create_conversation(body: ConversationCreate):
    conv_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    async for db in get_db():
        await db.execute(
            "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (conv_id, body.title, now, now),
        )
        await db.commit()
    return ConversationOut(id=conv_id, title=body.title, created_at=now, updated_at=now)


@router.get("/conversations/{conv_id}", response_model=ConversationDetail)
async def get_conversation(conv_id: str):
    async for db in get_db():
        cursor = await db.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
        conv = await cursor.fetchone()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        cursor = await db.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conv_id,),
        )
        rows = await cursor.fetchall()

        messages = []
        for row in rows:
            sources = None
            if row["sources"]:
                raw = json.loads(row["sources"])
                sources = [Source(**s) for s in raw]
            messages.append(MessageOut(
                id=row["id"], role=row["role"], content=row["content"],
                sources=sources, created_at=row["created_at"],
            ))

        return ConversationDetail(
            id=conv["id"], title=conv["title"], messages=messages,
            created_at=conv["created_at"], updated_at=conv["updated_at"],
        )


@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    async for db in get_db():
        cursor = await db.execute("SELECT id FROM conversations WHERE id = ?", (conv_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Conversation not found")
        await db.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
        await db.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        await db.commit()
    return {"status": "deleted"}
