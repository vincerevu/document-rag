from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class Source(BaseModel):
    doc_name: str
    page: Optional[int] = None
    chunk_text: str
    relevance_score: float


class ChatResponse(BaseModel):
    message: str
    sources: list[Source]
    conversation_id: str


class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: Optional[int]
    chunk_count: Optional[int]
    status: str = "completed"
    source_type: str = "file"
    error_message: Optional[str] = None
    source_url: Optional[str] = None
    progress: int = 100
    created_at: str


class URLIngestRequest(BaseModel):
    url: str
    deep_crawl: bool = False


class IngestionEvent(BaseModel):
    stage: str
    progress: int
    detail: Optional[str] = None
    error: Optional[str] = None


class ConnectorType(str, Enum):
    chroma_remote = "chroma_remote"
    pinecone = "pinecone"
    weaviate = "weaviate"


class ConnectorCreate(BaseModel):
    name: str
    type: ConnectorType
    config: dict


class ConnectorOut(BaseModel):
    id: str
    name: str
    type: str
    status: str
    document_count: int
    last_synced: Optional[str] = None
    created_at: str


class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class ConversationCreate(BaseModel):
    title: str = "New Chat"


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    sources: Optional[list[Source]] = None
    created_at: str


class ConversationDetail(BaseModel):
    id: str
    title: str
    messages: list[MessageOut]
    created_at: str
    updated_at: str


class SettingsOut(BaseModel):
    llm_provider: str
    openai_model: str
    watsonx_model: str
    chunk_size: int
    chunk_overlap: int
    retrieval_top_k: int
    rerank_top_k: int
    bm25_weight: float
    vector_weight: float
    use_hybrid_search: bool
    use_multi_query: bool
    use_hyde: bool
    use_reranking: bool


class SettingsUpdate(BaseModel):
    llm_provider: Optional[str] = None
    openai_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    watsonx_api_key: Optional[str] = None
    watsonx_project_id: Optional[str] = None
    watsonx_url: Optional[str] = None
    openai_model: Optional[str] = None
    watsonx_model: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    retrieval_top_k: Optional[int] = None
    rerank_top_k: Optional[int] = None
    bm25_weight: Optional[float] = None
    vector_weight: Optional[float] = None
    use_hybrid_search: Optional[bool] = None
    use_multi_query: Optional[bool] = None
    use_hyde: Optional[bool] = None
    use_reranking: Optional[bool] = None
