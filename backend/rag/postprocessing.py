from langchain_core.documents import Document
from langchain.retrievers.document_compressors import EmbeddingsFilter
from langchain_community.document_transformers import LongContextReorder
from providers.factory import get_embeddings


def remove_redundant(documents: list[Document], threshold: float = 0.95) -> list[Document]:
    if len(documents) <= 1:
        return documents

    embeddings = get_embeddings()
    texts = [doc.page_content for doc in documents]
    vectors = embeddings.embed_documents(texts)

    keep = [0]
    for i in range(1, len(documents)):
        is_redundant = False
        for j in keep:
            sim = _cosine_similarity(vectors[i], vectors[j])
            if sim > threshold:
                is_redundant = True
                break
        if not is_redundant:
            keep.append(i)

    return [documents[i] for i in keep]


def reorder_long_context(documents: list[Document]) -> list[Document]:
    if len(documents) <= 2:
        return documents
    reorder = LongContextReorder()
    return reorder.transform_documents(documents)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
