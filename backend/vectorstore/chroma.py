import chromadb
from langchain_community.vectorstores import Chroma
from providers.factory import get_embeddings
from config import settings

_cached_vectorstore = None


def get_vectorstore() -> Chroma:
    global _cached_vectorstore
    if _cached_vectorstore is None:
        _cached_vectorstore = Chroma(
            collection_name="ragforge",
            embedding_function=get_embeddings(),
            persist_directory=settings.chroma_persist_dir,
        )
    return _cached_vectorstore


def reset_vectorstore_cache():
    global _cached_vectorstore
    _cached_vectorstore = None


def delete_document_vectors(doc_id: str):
    client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    collection = client.get_or_create_collection("ragforge")
    results = collection.get(where={"doc_id": doc_id})
    if results["ids"]:
        collection.delete(ids=results["ids"])
    reset_vectorstore_cache()
