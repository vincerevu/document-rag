from langchain_core.documents import Document
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_core.language_models import BaseChatModel, BaseLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from vectorstore.chroma import get_vectorstore
from rag.prompts import MULTI_QUERY_PROMPT, HYDE_PROMPT
from config import settings


def get_hybrid_retriever() -> EnsembleRetriever:
    vectorstore = get_vectorstore()
    all_docs = vectorstore.get()

    if not all_docs or not all_docs.get("documents"):
        return vectorstore.as_retriever(search_kwargs={"k": settings.retrieval_top_k})

    # Build BM25 retriever from existing docs
    docs_for_bm25 = []
    for i, (doc_text, metadata) in enumerate(
        zip(all_docs["documents"], all_docs["metadatas"])
    ):
        docs_for_bm25.append(Document(page_content=doc_text, metadata=metadata or {}))

    bm25_retriever = BM25Retriever.from_documents(docs_for_bm25)
    bm25_retriever.k = settings.retrieval_top_k

    vector_retriever = vectorstore.as_retriever(
        search_kwargs={"k": settings.retrieval_top_k}
    )

    return EnsembleRetriever(
        retrievers=[bm25_retriever, vector_retriever],
        weights=[settings.bm25_weight, settings.vector_weight],
    )


def multi_query_retrieve(question: str, llm: BaseChatModel | BaseLLM) -> list[Document]:
    prompt = ChatPromptTemplate.from_template(MULTI_QUERY_PROMPT)
    chain = prompt | llm | StrOutputParser()
    result = chain.invoke({"question": question})

    queries = [q.strip() for q in result.strip().split("\n") if q.strip()]
    queries = queries[:3]
    queries.append(question)

    retriever = get_hybrid_retriever()
    all_docs = []
    seen = set()
    for q in queries:
        docs = retriever.invoke(q)
        for doc in docs:
            key = doc.page_content[:200]
            if key not in seen:
                seen.add(key)
                all_docs.append(doc)

    return all_docs


def hyde_retrieve(question: str, llm: BaseChatModel | BaseLLM) -> list[Document]:
    prompt = ChatPromptTemplate.from_template(HYDE_PROMPT)
    chain = prompt | llm | StrOutputParser()
    hypothetical_answer = chain.invoke({"question": question})

    vectorstore = get_vectorstore()
    docs = vectorstore.similarity_search(hypothetical_answer, k=settings.retrieval_top_k)
    return docs
