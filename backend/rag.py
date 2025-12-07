import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# 1. Setup Vector DB
DB_PATH = "./chroma_db"
embedding_function = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_db = Chroma(persist_directory=DB_PATH, embedding_function=embedding_function)

# 2. Dynamic LLM Loader
def get_llm(model_name):
    # Map friendly names to actual API model names if needed
    return ChatGoogleGenerativeAI(
        model=model_name,
        temperature=0.1, # Keep strict!
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )

def process_pdf(file_path):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    vector_db.add_documents(chunks)
    return len(chunks)

def summarize_document(file_path, model_name="gemini-2.5-flash"):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    full_text = "\n".join([d.page_content for d in docs])
    
    prompt = f"""
    You are an expert synthesizer. Provide a concise summary of this document with 5 key bullet points.
    Use Markdown formatting.
    Document Content: {full_text[:30000]} 
    """
    
    llm = get_llm(model_name)
    try:
        response = llm.invoke(prompt)
        return response.content
    except Exception as e:
        return f"Error: {str(e)}"

def generate_flashcards(file_path, model_name="gemini-2.5-flash"):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    full_text = "\n".join([d.page_content for d in docs])
    
    prompt = f"""
    Create 5 study flashcards from the text below.
    Return ONLY a raw JSON array: [{{"question": "Q?", "answer": "A"}}]
    Text: {full_text[:20000]}
    """
    
    llm = get_llm(model_name)
    try:
        response = llm.invoke(prompt)
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        return clean_json
    except:
        return "[]"

def query_expansion_search(query: str, model_name: str = "gemini-2.5-flash") -> str:
    """
    Strict RAG: Searches for context and synthesizes an answer. 
    Prevents hallucination by enforcing context usage.
    """
    llm = get_llm(model_name)
    
    # 1. Retrieve Context (Get top 5 relevant chunks)
    results = vector_db.similarity_search(query, k=5)
    context = "\n---\n".join([doc.page_content for doc in results])

    # 2. Strict Synthesis Prompt
    synthesis_prompt = PromptTemplate.from_template(
        """
        You are a highly accurate research assistant. 
        Answer the user's question using ONLY the context provided below.
        
        If the answer is not in the context, say: "I cannot find that information in the uploaded document."
        Do not guess. Use Markdown formatting (bolding, lists) to make the answer clear.

        QUESTION: {query}
        
        CONTEXT:
        {context}
        """
    )
    
    chain = synthesis_prompt | llm | StrOutputParser()
    return chain.invoke({"query": query, "context": context})

# Main entry point used by API
def query_documents(query):
    return query_expansion_search(query)