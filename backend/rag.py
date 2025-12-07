import os
# Removed load_dotenv() - we don't rely on server env files anymore
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import google.generativeai as genai

# 1. Setup Vector DB (Stays local)
DB_PATH = "./chroma_db"
embedding_function = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_db = Chroma(persist_directory=DB_PATH, embedding_function=embedding_function)

# --- Helper: Error Mapper ---
def get_friendly_error(e):
    err_str = str(e).lower()
    if "404" in err_str: return "Model not found. Your API key might not support this model."
    if "429" in err_str: return "System busy (Rate Limit). Try again in 30s."
    if "401" in err_str or "invalid" in err_str: return "Authentication failed. Invalid API Key."
    return f"System Error: {str(e)[:50]}..."

# 2. Dynamic LLM Loader (Now requires API Key)
def get_llm(model_name, api_key):
    return ChatGoogleGenerativeAI(
        model=model_name,
        temperature=0.3,
        google_api_key=api_key, # Use user-provided key
        convert_system_message_to_human=True 
    )

# --- NEW: Validate & List Models ---
def list_available_models(api_key):
    """
    Checks the user's API key and returns a list of models they can actually use.
    """
    try:
        genai.configure(api_key=api_key)
        models = genai.list_models()
        available = []
        
        # Filter for text-generation models
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                # Clean up the name (remove 'models/' prefix)
                name = m.name.replace('models/', '')
                available.append(name)
        
        # If list is empty, key might be valid but has no permissions (unlikely)
        if not available:
            return {"valid": False, "error": "No text models found for this key."}
            
        return {"valid": True, "models": available}
        
    except Exception as e:
        return {"valid": False, "error": str(e)}

def process_pdf(file_path):
    try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        if not documents: raise ValueError("Empty PDF")
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        vector_db.add_documents(chunks)
        return len(chunks)
    except Exception as e:
        raise ValueError(f"Ingestion failed: {str(e)}")

def summarize_document(file_path, model_name, api_key):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    full_text = "\n".join([d.page_content for d in docs])
    
    prompt = f"""
    Provide a concise summary of this document with 5 key bullet points.
    Use Markdown formatting.
    Document Content: {full_text[:30000]} 
    """
    
    try:
        llm = get_llm(model_name, api_key)
        return llm.invoke(prompt).content
    except Exception as e:
        return get_friendly_error(e)

def generate_flashcards(file_path, model_name, api_key):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    full_text = "\n".join([d.page_content for d in docs])
    
    prompt = f"""
    Create 5 study flashcards from the text below.
    Return ONLY a raw JSON array: [{{"question": "Q?", "answer": "A"}}]
    Text: {full_text[:20000]}
    """
    
    try:
        llm = get_llm(model_name, api_key)
        res = llm.invoke(prompt)
        return res.content.replace("```json", "").replace("```", "").strip()
    except:
        return "[]"

def query_expansion_search(query: str, model_name: str, api_key: str) -> str:
    try:
        llm = get_llm(model_name, api_key)
        
        # 1. Search (Database access doesn't need API key, only Embedding does if using cloud)
        # Note: We use local HuggingFace embeddings so searching is free!
        results = vector_db.similarity_search(query, k=5)
        if not results: return "No relevant info found."
        
        context = "\n---\n".join([doc.page_content for doc in results])

        # 2. Synthesize
        synthesis_prompt = PromptTemplate.from_template(
            """
            You are a research assistant. Answer the question using ONLY the context below.
            Use Markdown (bolding, lists) for clarity.
            
            QUESTION: {query}
            CONTEXT: {context}
            """
        )
        
        chain = synthesis_prompt | llm | StrOutputParser()
        return chain.invoke({"query": query, "context": context})
        
    except Exception as e:
        return get_friendly_error(e)

# API Wrapper
def query_documents(query, api_key, model_name):
    return query_expansion_search(query, model_name, api_key)