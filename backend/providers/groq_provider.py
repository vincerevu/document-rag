import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from providers.base import LLMProvider, EmbeddingProvider
from config import settings

_cached_embeddings = None


class GroqLLMProvider(LLMProvider):
    def get_llm(self):
        return ChatGroq(
            model=settings.groq_model,
            api_key=settings.groq_api_key,
            temperature=0,
        )

    def get_streaming_llm(self):
        return ChatGroq(
            model=settings.groq_model,
            api_key=settings.groq_api_key,
            temperature=0,
            streaming=True,
        )


class GroqEmbeddingProvider(EmbeddingProvider):
    def get_embeddings(self):
        global _cached_embeddings
        if _cached_embeddings is None:
            _cached_embeddings = HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2",
            )
        return _cached_embeddings
