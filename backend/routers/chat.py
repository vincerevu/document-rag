import json
import uuid
from datetime import datetime
from fastapi import APIRouter
from models.schemas import ChatRequest, ChatResponse
from rag.engine import rag_engine
from database import get_db

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    async for db in get_db():
        # Create conversation if needed
        conversation_id = request.conversation_id
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (conversation_id, request.message[:50], datetime.utcnow().isoformat(), datetime.utcnow().isoformat()),
            )

        # Save user message
        user_msg_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_msg_id, conversation_id, "user", request.message, datetime.utcnow().isoformat()),
        )
        await db.commit()

        # Run RAG with conversation context
        answer, sources = await rag_engine.query(request.message, conversation_id=conversation_id)

        # Save assistant message
        assistant_msg_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO messages (id, conversation_id, role, content, sources, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (assistant_msg_id, conversation_id, "assistant", answer, json.dumps([s.model_dump() for s in sources]), datetime.utcnow().isoformat()),
        )

        # Update conversation timestamp
        await db.execute(
            "UPDATE conversations SET updated_at = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), conversation_id),
        )
        await db.commit()

        return ChatResponse(message=answer, sources=sources, conversation_id=conversation_id)
