from abc import ABC, abstractmethod
from langchain_core.language_models import BaseChatModel, BaseLLM
from langchain_core.embeddings import Embeddings


class LLMProvider(ABC):
    @abstractmethod
    def get_llm(self) -> BaseChatModel | BaseLLM:
        ...

    @abstractmethod
    def get_streaming_llm(self) -> BaseChatModel | BaseLLM:
        ...


class EmbeddingProvider(ABC):
    @abstractmethod
    def get_embeddings(self) -> Embeddings:
        ...
