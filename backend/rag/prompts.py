MULTI_QUERY_PROMPT = """You are an AI assistant helping to generate multiple search queries.
Given the user question, generate 3 different versions of the question to retrieve relevant documents.
Provide these alternative questions separated by newlines.
Original question: {question}
Alternative questions:"""

HYDE_PROMPT = """Write a short passage that would answer the following question.
Do not say "I don't know". Write a plausible answer even if you're unsure.
Question: {question}
Passage:"""

CONDENSE_QUESTION_PROMPT = """Given the following conversation history and a follow-up question, rephrase the follow-up question to be a standalone question that captures the full context.

Chat History:
{chat_history}

Follow-up Question: {question}

Standalone Question:"""

RAG_PROMPT = """You are a knowledgeable assistant. Use the following context to provide a detailed, comprehensive answer to the question.

Instructions:
- Give thorough, well-structured answers with explanations and examples from the context
- Use bullet points or numbered lists when appropriate for clarity
- Include relevant details, definitions, and relationships between concepts
- If the context covers multiple aspects of the question, address all of them
- Cite the source documents you used
- If the context is insufficient, say what you can answer and what is missing
{chat_history_block}
Context:
{context}

Question: {question}

Detailed Answer:"""
