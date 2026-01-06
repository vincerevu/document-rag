from langchain_ibm import WatsonxLLM, WatsonxEmbeddings
from providers.base import LLMProvider, EmbeddingProvider
from config import settings


class WatsonxLLMProvider(LLMProvider):
    def _get_params(self):
        return {
            "url": settings.watsonx_url,
            "apikey": settings.watsonx_api_key,
            "project_id": settings.watsonx_project_id,
        }

    def get_llm(self):
        return WatsonxLLM(
            model_id=settings.watsonx_model,
            params={"decoding_method": "greedy", "max_new_tokens": 1024},
            **self._get_params(),
        )

    def get_streaming_llm(self):
        return WatsonxLLM(
            model_id=settings.watsonx_model,
            params={"decoding_method": "greedy", "max_new_tokens": 1024},
            **self._get_params(),
        )


class WatsonxEmbeddingProvider(EmbeddingProvider):
    def get_embeddings(self):
        return WatsonxEmbeddings(
            model_id=settings.watsonx_embedding_model,
            url=settings.watsonx_url,
            apikey=settings.watsonx_api_key,
            project_id=settings.watsonx_project_id,
        )
