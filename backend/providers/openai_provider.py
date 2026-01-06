from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from providers.base import LLMProvider, EmbeddingProvider
from config import settings


class OpenAILLMProvider(LLMProvider):
    def get_llm(self):
        return ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0,
        )

    def get_streaming_llm(self):
        return ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0,
            streaming=True,
        )


class OpenAIEmbeddingProvider(EmbeddingProvider):
    def get_embeddings(self):
        return OpenAIEmbeddings(
            model=settings.openai_embedding_model,
            api_key=settings.openai_api_key,
        )
