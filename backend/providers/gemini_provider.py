from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from providers.base import LLMProvider, EmbeddingProvider
from config import settings


class GeminiLLMProvider(LLMProvider):
    def get_llm(self):
        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.google_api_key,
            temperature=0,
        )

    def get_streaming_llm(self):
        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.google_api_key,
            temperature=0,
            streaming=True,
        )


class GeminiEmbeddingProvider(EmbeddingProvider):
    def get_embeddings(self):
        return GoogleGenerativeAIEmbeddings(
            model=settings.gemini_embedding_model,
            google_api_key=settings.google_api_key,
        )
