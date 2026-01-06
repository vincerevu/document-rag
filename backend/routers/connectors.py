import uuid
import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, HTTPException
from models.schemas import ConnectorCreate, ConnectorOut
from ingestion.connectors import test_connection, sync_connector
from database import get_db

router = APIRouter()


def _connector_from_row(row) -> ConnectorOut:
    return ConnectorOut(
        id=row["id"],
        name=row["name"],
        type=row["type"],
        status=row["status"] or "disconnected",
        document_count=row["document_count"] or 0,
        last_synced=row["last_synced"],
        created_at=row["created_at"],
    )


@router.post("/connectors", response_model=ConnectorOut)
async def create_connector(data: ConnectorCreate):
    connector_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    async for db in get_db():
        await db.execute(
            """INSERT INTO connectors (id, name, type, config, status, document_count, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (connector_id, data.name, data.type.value, json.dumps(data.config), "disconnected", 0, now),
        )
        await db.commit()
    return ConnectorOut(
        id=connector_id,
        name=data.name,
        type=data.type.value,
        status="disconnected",
        document_count=0,
        created_at=now,
    )


@router.get("/connectors", response_model=list[ConnectorOut])
async def list_connectors():
    async for db in get_db():
        cursor = await db.execute("SELECT * FROM connectors ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [_connector_from_row(row) for row in rows]


@router.post("/connectors/{connector_id}/test")
async def test_connector(connector_id: str):
    async for db in get_db():
        cursor = await db.execute("SELECT type, config FROM connectors WHERE id = ?", (connector_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Connector not found")
        result = await test_connection(row["type"], json.loads(row["config"]))
        if result["ok"]:
            await db.execute("UPDATE connectors SET status = ? WHERE id = ?", ("connected", connector_id))
            await db.commit()
        return result


@router.post("/connectors/{connector_id}/sync")
async def trigger_sync(connector_id: str):
    async for db in get_db():
        cursor = await db.execute("SELECT id FROM connectors WHERE id = ?", (connector_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Connector not found")
    asyncio.create_task(sync_connector(connector_id))
    return {"status": "sync_started"}


@router.delete("/connectors/{connector_id}")
async def delete_connector(connector_id: str):
    async for db in get_db():
        cursor = await db.execute("SELECT id FROM connectors WHERE id = ?", (connector_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Connector not found")
        await db.execute("DELETE FROM connectors WHERE id = ?", (connector_id,))
        await db.commit()
    return {"status": "deleted"}
