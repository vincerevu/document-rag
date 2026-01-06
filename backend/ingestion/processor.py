import uuid
import asyncio
import aiosqlite
from langchain_core.documents import Document
from rag.chunking import chunk_documents
from vectorstore.chroma import get_vectorstore, reset_vectorstore_cache
from database import DB_PATH

# Progress channels for WebSocket streaming
_progress_channels: dict[str, asyncio.Queue] = {}


def get_progress_channel(doc_id: str) -> asyncio.Queue:
    if doc_id not in _progress_channels:
        _progress_channels[doc_id] = asyncio.Queue()
    return _progress_channels[doc_id]


def remove_progress_channel(doc_id: str):
    _progress_channels.pop(doc_id, None)


def process_documents(docs: list[Document], doc_id: str) -> int:
    """Synchronous processing (backward compatibility)."""
    for doc in docs:
        doc.metadata["doc_id"] = doc_id

    chunks = chunk_documents(docs)

    for chunk in chunks:
        chunk.metadata["chunk_id"] = str(uuid.uuid4())

    vectorstore = get_vectorstore()
    vectorstore.add_documents(chunks)
    reset_vectorstore_cache()

    return len(chunks)


async def _update_doc(doc_id: str, **fields):
    sets = ", ".join(f"{k} = ?" for k in fields)
    vals = list(fields.values()) + [doc_id]
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(f"UPDATE documents SET {sets} WHERE id = ?", vals)
        await db.commit()


async def _push(doc_id: str, stage: str, progress: int, detail: str | None = None, error: str | None = None):
    queue = get_progress_channel(doc_id)
    await queue.put({"stage": stage, "progress": progress, "detail": detail, "error": error})


async def process_document_async(doc_id: str, file_path: str, filename: str, file_size: int, suffix: str):
    """Async processing with progress events pushed to a queue."""
    from ingestion.loader import load_file
    try:
        # Stage: loading
        await _push(doc_id, "loading", 10, "Loading document...")
        await _update_doc(doc_id, status="processing", progress=10)
        docs = await asyncio.to_thread(load_file, file_path)

        # Stage: chunking
        await _push(doc_id, "chunking", 40, "Splitting into chunks...")
        await _update_doc(doc_id, progress=40)
        for doc in docs:
            doc.metadata["doc_id"] = doc_id
        chunks = await asyncio.to_thread(chunk_documents, docs)
        for chunk in chunks:
            chunk.metadata["chunk_id"] = str(uuid.uuid4())

        # Stage: embedding
        await _push(doc_id, "embedding", 70, "Generating embeddings...")
        await _update_doc(doc_id, progress=70)
        vectorstore = get_vectorstore()
        await asyncio.to_thread(vectorstore.add_documents, chunks)

        # Stage: indexing
        await _push(doc_id, "indexing", 90, "Updating search index...")
        await _update_doc(doc_id, progress=90)
        reset_vectorstore_cache()

        # Complete
        await _update_doc(doc_id, status="completed", progress=100, chunk_count=len(chunks))
        await _push(doc_id, "complete", 100, f"Done — {len(chunks)} chunks")

    except Exception as exc:
        await _update_doc(doc_id, status="failed", error_message=str(exc))
        await _push(doc_id, "error", 0, error=str(exc))
    finally:
        import os
        try:
            os.unlink(file_path)
        except OSError:
            pass
        # Sentinel to close WebSocket listener
        queue = get_progress_channel(doc_id)
        await queue.put(None)


async def process_url_async(doc_id: str, url: str, deep_crawl: bool = False):
    """Async URL ingestion with progress events."""
    from ingestion.loader import load_url, load_url_recursive
    try:
        if deep_crawl:
            await _push(doc_id, "crawling", 5, "Crawling website links...")
            await _update_doc(doc_id, status="processing", progress=5)
            docs = await asyncio.to_thread(load_url_recursive, url)
            await _push(doc_id, "loading", 10, f"Crawled {len(docs)} pages")
            await _update_doc(doc_id, progress=10)
        else:
            await _push(doc_id, "loading", 10, "Fetching URL...")
            await _update_doc(doc_id, status="processing", progress=10)
            docs = await asyncio.to_thread(load_url, url)

        await _push(doc_id, "chunking", 40, "Splitting into chunks...")
        await _update_doc(doc_id, progress=40)
        for doc in docs:
            doc.metadata["doc_id"] = doc_id
        chunks = await asyncio.to_thread(chunk_documents, docs)
        for chunk in chunks:
            chunk.metadata["chunk_id"] = str(uuid.uuid4())

        await _push(doc_id, "embedding", 70, "Generating embeddings...")
        await _update_doc(doc_id, progress=70)
        vectorstore = get_vectorstore()
        await asyncio.to_thread(vectorstore.add_documents, chunks)

        await _push(doc_id, "indexing", 90, "Updating search index...")
        await _update_doc(doc_id, progress=90)
        reset_vectorstore_cache()

        await _update_doc(doc_id, status="completed", progress=100, chunk_count=len(chunks))
        await _push(doc_id, "complete", 100, f"Done — {len(chunks)} chunks")

    except Exception as exc:
        await _update_doc(doc_id, status="failed", error_message=str(exc))
        await _push(doc_id, "error", 0, error=str(exc))
    finally:
        queue = get_progress_channel(doc_id)
        await queue.put(None)
