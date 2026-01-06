import logging

import aiosqlite
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from providers.factory import get_llm, get_streaming_llm
from vectorstore.chroma import get_vectorstore
from rag.prompts import RAG_PROMPT, CONDENSE_QUESTION_PROMPT
from rag.retrieval import get_hybrid_retriever, multi_query_retrieve, hyde_retrieve
from rag.reranking import rerank_documents
from rag.postprocessing import remove_redundant, reorder_long_context
from models.schemas import Source
from config import settings
from database import DB_PATH

logger = logging.getLogger(__name__)

MAX_HISTORY_MESSAGES = 10


class RAGEngine:
    async def _load_chat_history(self, conversation_id: str | None) -> list[dict]:
        """Load last N messages from the conversation."""
        if not conversation_id:
            return []
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?",
                (conversation_id, MAX_HISTORY_MESSAGES),
            )
            rows = await cursor.fetchall()
        # Rows come newest-first, reverse to chronological order
        return [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]

    def _format_chat_history(self, chat_history: list[dict]) -> str:
        """Format history into a readable string for prompts."""
        if not chat_history:
            return ""
        lines = []
        for msg in chat_history:
            role = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{role}: {msg['content']}")
        return "\n".join(lines)

    def _condense_question(self, question: str, chat_history: list[dict]) -> str:
        """Rewrite a follow-up question into a standalone question using history."""
        if not chat_history:
            return question
        llm = get_llm()
        history_str = self._format_chat_history(chat_history)
        prompt = ChatPromptTemplate.from_template(CONDENSE_QUESTION_PROMPT)
        chain = prompt | llm | StrOutputParser()
        condensed = chain.invoke({"chat_history": history_str, "question": question})
        logger.info("Condensed question: %s -> %s", question, condensed.strip())
        return condensed.strip()

    def _retrieve(self, question: str, chat_history: list[dict] | None = None) -> list[Document]:
        """Configurable retrieval pipeline based on settings."""
        # Condense question using conversation history
        search_question = self._condense_question(question, chat_history or [])

        llm = get_llm()

        # Step 1: Retrieve documents
        if settings.use_multi_query:
            logger.info("Using multi-query retrieval")
            docs = multi_query_retrieve(search_question, llm)
        elif settings.use_hyde:
            logger.info("Using HyDE retrieval")
            docs = hyde_retrieve(search_question, llm)
        elif settings.use_hybrid_search:
            logger.info("Using hybrid (BM25 + vector) retrieval")
            retriever = get_hybrid_retriever()
            docs = retriever.invoke(search_question)
        else:
            logger.info("Using simple vector similarity search")
            vectorstore = get_vectorstore()
            results = vectorstore.similarity_search_with_relevance_scores(
                search_question, k=settings.retrieval_top_k
            )
            docs = []
            for doc, score in results:
                doc.metadata["relevance_score"] = score
                docs.append(doc)

        if not docs:
            return []

        # Step 2: Rerank if enabled
        if settings.use_reranking:
            logger.info("Reranking %d documents", len(docs))
            docs = rerank_documents(search_question, docs)

        # Step 3: Post-processing (always applied)
        docs = remove_redundant(docs)
        docs = reorder_long_context(docs)

        return docs

    def _build_context(self, docs: list[Document]) -> str:
        return "\n\n---\n\n".join(
            f"[Source: {doc.metadata.get('source_file', 'unknown')}]\n{doc.page_content}"
            for doc in docs
        )

    def _build_sources(self, docs: list[Document]) -> list[Source]:
        return [
            Source(
                doc_name=doc.metadata.get("source_file", "unknown"),
                page=doc.metadata.get("page"),
                chunk_text=doc.page_content[:300],
                relevance_score=round(doc.metadata.get("relevance_score", 0.0), 4),
            )
            for doc in docs
        ]

    def _build_chat_history_block(self, chat_history: list[dict]) -> str:
        if not chat_history:
            return ""
        formatted = self._format_chat_history(chat_history)
        return f"\nConversation so far:\n{formatted}\n"

    async def query(self, question: str, conversation_id: str | None = None) -> tuple[str, list[Source]]:
        chat_history = await self._load_chat_history(conversation_id)
        docs = self._retrieve(question, chat_history)

        if not docs:
            return "I don't have enough context to answer this question. Please upload relevant documents first.", []

        llm = get_llm()
        context = self._build_context(docs)
        chat_history_block = self._build_chat_history_block(chat_history)

        prompt = ChatPromptTemplate.from_template(RAG_PROMPT)
        chain = prompt | llm | StrOutputParser()
        answer = chain.invoke({"context": context, "question": question, "chat_history_block": chat_history_block})

        return answer, self._build_sources(docs)

    async def stream_query(self, question: str, conversation_id: str | None = None):
        chat_history = await self._load_chat_history(conversation_id)
        docs = self._retrieve(question, chat_history)

        if not docs:
            yield {"type": "token", "content": "I don't have enough context to answer this question. Please upload relevant documents first."}
            yield {"type": "sources", "sources": []}
            return

        streaming_llm = get_streaming_llm()
        context = self._build_context(docs)
        chat_history_block = self._build_chat_history_block(chat_history)

        prompt = ChatPromptTemplate.from_template(RAG_PROMPT)
        chain = prompt | streaming_llm

        async for chunk in chain.astream({"context": context, "question": question, "chat_history_block": chat_history_block}):
            token = chunk.content if hasattr(chunk, "content") else str(chunk)
            if token:
                yield {"type": "token", "content": token}

        sources = self._build_sources(docs)
        yield {"type": "sources", "sources": [s.model_dump() for s in sources]}


rag_engine = RAGEngine()
