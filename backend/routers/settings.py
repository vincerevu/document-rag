from fastapi import APIRouter
from models.schemas import SettingsOut, SettingsUpdate
from config import settings

router = APIRouter()


@router.get("/settings", response_model=SettingsOut)
async def get_settings():
    return SettingsOut(
        llm_provider=settings.llm_provider,
        openai_model=settings.openai_model,
        watsonx_model=settings.watsonx_model,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        retrieval_top_k=settings.retrieval_top_k,
        rerank_top_k=settings.rerank_top_k,
        bm25_weight=settings.bm25_weight,
        vector_weight=settings.vector_weight,
        use_hybrid_search=settings.use_hybrid_search,
        use_multi_query=settings.use_multi_query,
        use_hyde=settings.use_hyde,
        use_reranking=settings.use_reranking,
    )


@router.put("/settings", response_model=SettingsOut)
async def update_settings(body: SettingsUpdate):
    for field, value in body.model_dump(exclude_none=True).items():
        if hasattr(settings, field):
            setattr(settings, field, value)

    return await get_settings()
