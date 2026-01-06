import uuid
import asyncio
import aiosqlite
from datetime import datetime
from database import DB_PATH
from vectorstore.chroma import get_vectorstore, reset_vectorstore_cache


async def test_connection(connector_type: str, config: dict) -> dict:
    """Test connectivity to a remote vector DB."""
    if connector_type == "chroma_remote":
        try:
            import chromadb
            host = config.get("host", "localhost")
            port = int(config.get("port", 8000))
            client = await asyncio.to_thread(chromadb.HttpClient, host=host, port=port)
            await asyncio.to_thread(client.heartbeat)
            return {"ok": True, "message": "Connected successfully"}
        except Exception as e:
            return {"ok": False, "message": str(e)}
    elif connector_type == "pinecone":
        return {"ok": False, "message": "Pinecone connector not yet implemented"}
    elif connector_type == "weaviate":
        return {"ok": False, "message": "Weaviate connector not yet implemented"}
    return {"ok": False, "message": f"Unknown connector type: {connector_type}"}


async def sync_connector(connector_id: str):
    """Pull documents from a remote ChromaDB and merge into local vectorstore."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM connectors WHERE id = ?", (connector_id,))
        row = await cursor.fetchone()
        if not row:
            return

        import json
        config = json.loads(row["config"])
        connector_type = row["type"]

    if connector_type != "chroma_remote":
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                "UPDATE connectors SET status = ? WHERE id = ?",
                ("error", connector_id),
            )
            await db.commit()
        return

    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                "UPDATE connectors SET status = ? WHERE id = ?",
                ("syncing", connector_id),
            )
            await db.commit()

        import chromadb
        from langchain_core.documents import Document

        host = config.get("host", "localhost")
        port = int(config.get("port", 8000))
        collection_name = config.get("collection", "default")

        client = await asyncio.to_thread(chromadb.HttpClient, host=host, port=port)
        collection = await asyncio.to_thread(client.get_collection, collection_name)
        result = await asyncio.to_thread(collection.get, include=["documents", "metadatas"])

        documents = result.get("documents", [])
        metadatas = result.get("metadatas", [])
        ids = result.get("ids", [])

        if not documents:
            async with aiosqlite.connect(DB_PATH) as db:
                await db.execute(
                    "UPDATE connectors SET status = ?, document_count = 0, last_synced = ? WHERE id = ?",
                    ("connected", datetime.utcnow().isoformat(), connector_id),
                )
                await db.commit()
            return

        lc_docs = []
        for doc_text, meta in zip(documents, metadatas):
            if doc_text:
                m = meta or {}
                m["doc_id"] = f"connector-{connector_id}"
                m["chunk_id"] = str(uuid.uuid4())
                lc_docs.append(Document(page_content=doc_text, metadata=m))

        if lc_docs:
            vectorstore = get_vectorstore()
            await asyncio.to_thread(vectorstore.add_documents, lc_docs)
            reset_vectorstore_cache()

        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                "UPDATE connectors SET status = ?, document_count = ?, last_synced = ? WHERE id = ?",
                ("connected", len(lc_docs), datetime.utcnow().isoformat(), connector_id),
            )
            await db.commit()

    except Exception as e:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                "UPDATE connectors SET status = ? WHERE id = ?",
                ("error", connector_id),
            )
            await db.commit()
        raise
