# document-rag

document-rag is a full-stack Retrieval-Augmented Generation app for uploading knowledge sources, indexing them into a local vector store, and chatting with citations. It combines a Next.js frontend, a FastAPI backend, ChromaDB, SQLite, and pluggable LLM providers.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-FF6F00?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat-square&logo=python&logoColor=white)

## What It Does

- Upload documents and websites, then ask questions against the indexed content.
- Stream chat responses over WebSocket with source citations and relevance scores.
- Store conversations, messages, document metadata, and connector state in SQLite.
- Persist embeddings and chunks in ChromaDB.
- Switch between supported LLM providers from configuration or the settings API.
- Tune RAG behavior including chunking, retrieval depth, reranking, hybrid search, multi-query, and HyDE toggles.

## Architecture

```text
+-------------------------------+
| Next.js 14 Frontend            |
| Chat, documents, settings, UI  |
+---------------+---------------+
                |
                | REST + WebSocket
                |
+---------------v---------------+
| FastAPI Backend                |
| API routes, ingestion, RAG     |
+---------------+---------------+
                |
      +---------+---------+
      |                   |
+-----v------+     +------v-----+
| ChromaDB   |     | SQLite     |
| vectors    |     | app data   |
+------------+     +------------+
```

## Features

### RAG Pipeline

- ChromaDB vector similarity search with HuggingFace embeddings.
- Optional hybrid retrieval with BM25/vector weighting.
- Optional reranking, multi-query expansion, and HyDE query generation.
- Configurable chunk size, chunk overlap, retrieval top-k, and rerank top-k.
- Source citations returned with document name, page when available, chunk text, and relevance score.

### Ingestion

- File upload support for common document formats through LangChain loaders.
- URL ingestion with optional deep crawl flag.
- Background document processing with status/progress tracking.
- Ingestion progress WebSocket at `/ws/ingest/{doc_id}`.

### LLM Providers

- OpenAI: `gpt-4o-mini` by default.
- Groq: `llama-3.1-8b-instant` by default.
- Google Gemini: `gemini-2.0-flash` by default.
- IBM WatsonX: Granite model defaults.

### Frontend

- Chat interface with streaming responses.
- Document upload, URL ingestion, document status, and deletion.
- Conversation list with create, view, and delete flows.
- Settings UI for provider and RAG parameter updates.
- Light/dark theme and responsive layout.

### Connectors

- Remote ChromaDB connector can be created, tested, synced, and deleted.
- Pinecone and Weaviate connector types are present in the API schema but are not implemented yet.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, lucide-react |
| Backend | FastAPI, Python 3.11, LangChain, Pydantic Settings |
| LLM Providers | OpenAI, Groq, Google Gemini, IBM WatsonX |
| Retrieval | ChromaDB, sentence-transformers, rank-bm25 |
| Storage | SQLite via aiosqlite, persisted ChromaDB directory |
| Deployment | Docker, Docker Compose |

## Prerequisites

- Node.js 20 or newer.
- Python 3.11.
- At least one supported LLM provider API key.
- Docker and Docker Compose if running the containerized stack.

## Environment Variables

Backend variables are read from `backend/.env` when running locally from the `backend` directory. Start from `backend/.env.example`.

```env
LLM_PROVIDER=openai

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant

GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=models/embedding-001

WATSONX_API_KEY=
WATSONX_PROJECT_ID=
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL=ibm/granite-13b-chat-v2
WATSONX_EMBEDDING_MODEL=ibm/slate-125m-english-rtrvr

CHROMA_PERSIST_DIR=./chromadb
SQLITE_DB_PATH=./data/document-rag.db

CHUNK_SIZE=1000
CHUNK_OVERLAP=200
RETRIEVAL_TOP_K=10
RERANK_TOP_K=8
BM25_WEIGHT=0.4
VECTOR_WEIGHT=0.6
USE_HYBRID_SEARCH=false
USE_MULTI_QUERY=false
USE_HYDE=false
USE_RERANKING=true
```

Frontend variables are read from `frontend/.env.local`.

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Local Development

### 1. Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

On Windows PowerShell, activate the virtual environment with:

```powershell
.\.venv\Scripts\Activate.ps1
```

Then update `backend/.env` with the provider key you want to use.

### 2. Start the frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), upload a document or ingest a URL, and start chatting.

## Docker

Create `backend/.env` first, then run:

```bash
docker-compose up --build
```

The frontend is exposed at [http://localhost:3000](http://localhost:3000), and the API is exposed at [http://localhost:8000](http://localhost:8000).

Docker Compose persists backend data in named volumes:

- `chroma_data` for ChromaDB persistence.
- `sqlite_data` for the SQLite database.

## API Reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/chat` | Send a non-streaming chat message |
| WS | `/ws/chat/{conversation_id}` | Stream chat tokens and sources |
| POST | `/api/documents/upload` | Upload one or more files |
| POST | `/api/documents/url` | Ingest a URL |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/{doc_id}/status` | Get ingestion status |
| DELETE | `/api/documents/{doc_id}` | Delete a document and its vectors |
| WS | `/ws/ingest/{doc_id}` | Stream ingestion progress |
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations` | Create a conversation |
| GET | `/api/conversations/{id}` | Get conversation details |
| DELETE | `/api/conversations/{id}` | Delete a conversation |
| GET | `/api/settings` | Read runtime settings |
| PUT | `/api/settings` | Update runtime settings |
| GET | `/api/connectors` | List vector connectors |
| POST | `/api/connectors` | Create a vector connector |
| POST | `/api/connectors/{id}/test` | Test a connector |
| POST | `/api/connectors/{id}/sync` | Sync a connector |
| DELETE | `/api/connectors/{id}` | Delete a connector |

## Project Structure

```text
backend/
|-- main.py                 # FastAPI app, CORS, REST routers, WebSockets
|-- config.py               # Pydantic Settings and env defaults
|-- database.py             # SQLite setup and database access
|-- ingestion/              # File, URL, and connector ingestion
|-- models/                 # Pydantic request/response schemas
|-- providers/              # LLM provider adapters and factory
|-- rag/                    # RAG engine, retrieval, prompts, reranking
|-- routers/                # Chat, documents, conversations, settings, connectors
|-- vectorstore/            # ChromaDB integration
`-- requirements.txt

frontend/
|-- app/                    # Next.js App Router pages and global styles
|-- components/             # UI, chat, documents, settings, sidebar
|-- lib/                    # API client and WebSocket hooks
|-- types/                  # TypeScript interfaces
`-- package.json
```

## Common Commands

```bash
# Backend
cd backend
uvicorn main:app --reload

# Frontend
cd frontend
npm run dev
npm run build
npm run lint

# Full stack
docker-compose up --build
```

## Notes

- Runtime settings are updated in memory through `/api/settings`; persist desired defaults in `backend/.env`.
- The backend creates SQLite tables on startup and stores data at `SQLITE_DB_PATH`.
- Uploaded file processing runs in the background, so clients should poll `/api/documents/{doc_id}/status` or subscribe to `/ws/ingest/{doc_id}`.
- `chroma_remote` is the only connector type with implemented connection and sync behavior.
