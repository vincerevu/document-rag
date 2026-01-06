from langchain_core.documents import Document
from sentence_transformers import CrossEncoder
from config import settings

_reranker = None


def get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")
    return _reranker


def rerank_documents(query: str, documents: list[Document]) -> list[Document]:
    if not documents:
        return []

    reranker = get_reranker()
    pairs = [[query, doc.page_content] for doc in documents]
    scores = reranker.predict(pairs)

    scored_docs = list(zip(documents, scores))
    scored_docs.sort(key=lambda x: x[1], reverse=True)

    top_docs = scored_docs[: settings.rerank_top_k]
    result = []
    for doc, score in top_docs:
        doc.metadata["relevance_score"] = float(score)
        result.append(doc)

    return result
