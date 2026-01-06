import os
import uuid
import asyncio
import tempfile
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import DocumentOut, URLIngestRequest
from ingestion.processor import process_document_async, process_url_async
from vectorstore.chroma import delete_document_vectors
from database import get_db

router = APIRouter()


def _doc_from_row(row) -> DocumentOut:
    return DocumentOut(
        id=row["id"],
        filename=row["filename"],
        file_type=row["file_type"],
        file_size=row["file_size"],
        chunk_count=row["chunk_count"],
        status=row["status"] or "completed",
        source_type=row["source_type"] or "file",
        error_message=row["error_message"],
        source_url=row["source_url"],
        progress=row["progress"] if row["progress"] is not None else 100,
        created_at=row["created_at"],
    )


@router.post("/documents/upload", response_model=list[DocumentOut])
async def upload_documents(files: list[UploadFile] = File(...)):
    results = []
    async for db in get_db():
        for file in files:
            doc_id = str(uuid.uuid4())
            suffix = os.path.splitext(file.filename or "")[1]

            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
            content = await file.read()
            tmp.write(content)
            tmp.close()
            tmp_path = tmp.name

            now = datetime.utcnow().isoformat()
            await db.execute(
                """INSERT INTO documents
                   (id, filename, file_type, file_size, chunk_count, status, source_type, progress, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (doc_id, file.filename, suffix, len(content), 0, "pending", "file", 0, now),
            )

            doc = DocumentOut(
                id=doc_id,
                filename=file.filename or "",
                file_type=suffix,
                file_size=len(content),
                chunk_count=0,
                status="pending",
                source_type="file",
                progress=0,
                created_at=now,
            )
            results.append(doc)

            asyncio.create_task(
                process_document_async(doc_id, tmp_path, file.filename or "", len(content), suffix)
            )

        await db.commit()
    return results


@router.post("/documents/url", response_model=DocumentOut)
async def ingest_url(request: URLIngestRequest):
    doc_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    async for db in get_db():
        await db.execute(
            """INSERT INTO documents
               (id, filename, file_type, file_size, chunk_count, status, source_type, source_url, progress, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (doc_id, request.url, "url", 0, 0, "pending", "url", request.url, 0, now),
        )
        await db.commit()

    asyncio.create_task(process_url_async(doc_id, request.url, deep_crawl=request.deep_crawl))

    return DocumentOut(
        id=doc_id,
        filename=request.url,
        file_type="url",
        file_size=0,
        chunk_count=0,
        status="pending",
        source_type="url",
        source_url=request.url,
        progress=0,
        created_at=now,
    )


@router.get("/documents", response_model=list[DocumentOut])
async def list_documents():
    async for db in get_db():
        cursor = await db.execute("SELECT * FROM documents ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [_doc_from_row(row) for row in rows]


@router.get("/documents/{doc_id}/status")
async def get_document_status(doc_id: str):
    async for db in get_db():
        cursor = await db.execute(
            "SELECT status, progress, error_message FROM documents WHERE id = ?", (doc_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        return {
            "status": row["status"],
            "progress": row["progress"],
            "error_message": row["error_message"],
        }


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    async for db in get_db():
        cursor = await db.execute("SELECT id FROM documents WHERE id = ?", (doc_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Document not found")

        delete_document_vectors(doc_id)
        await db.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        await db.commit()

    return {"status": "deleted"}
