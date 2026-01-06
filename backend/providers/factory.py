from providers.base import LLMProvider, EmbeddingProvider
from providers.openai_provider import OpenAILLMProvider, OpenAIEmbeddingProvider
from providers.watsonx_provider import WatsonxLLMProvider, WatsonxEmbeddingProvider
from providers.gemini_provider import GeminiLLMProvider, GeminiEmbeddingProvider
from providers.groq_provider import GroqLLMProvider, GroqEmbeddingProvider
from config import settings

_PROVIDERS = {
    "openai": (OpenAILLMProvider, OpenAIEmbeddingProvider),
    "watsonx": (WatsonxLLMProvider, WatsonxEmbeddingProvider),
    "gemini": (GeminiLLMProvider, GeminiEmbeddingProvider),
    "groq": (GroqLLMProvider, GroqEmbeddingProvider),
}


def get_llm_provider() -> LLMProvider:
    llm_cls, _ = _PROVIDERS[settings.llm_provider]
    return llm_cls()


def get_embedding_provider() -> EmbeddingProvider:
    _, emb_cls = _PROVIDERS[settings.llm_provider]
    return emb_cls()


def get_llm():
    return get_llm_provider().get_llm()


def get_streaming_llm():
    return get_llm_provider().get_streaming_llm()


def get_embeddings():
    return get_embedding_provider().get_embeddings()
