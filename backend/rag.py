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

# --- Helper: Error Mapper ---
def get_friendly_error(e):
    err_str = str(e).lower()
    if "404" in err_str: return "Selected model not found. Switching model..."
    if "429" in err_str: return "System busy (Rate Limit). Try again in 30s."
    if "401" in err_str: return "Authentication failed. Check API Key."
    return f"System Error: {str(e)[:50]}..."

# 2. Dynamic LLM Loader (UPDATED FOR YOUR API ACCESS)
def get_llm(model_name):
    # Mapping UI selection to your AVAILABLE models
    model_map = {
        "gemini-2.5-flash": "gemini-2.5-flash", # You have this!
        "gemini-2.5-pro": "gemini-2.5-pro",     # You have this too!
    }
    
    # Default to 2.5 Flash if name is weird
    api_model = model_map.get(model_name, "gemini-2.5-flash")

    return ChatGoogleGenerativeAI(
        model=api_model,
        temperature=0.3,
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        convert_system_message_to_human=True 
    )

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

def summarize_document(file_path, model_name="gemini-2.5-flash"):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    full_text = "\n".join([d.page_content for d in docs])
    
    prompt = f"""
    Provide a concise summary of this document with 5 key bullet points.
    Use Markdown formatting.
    Document Content: {full_text[:30000]} 
    """
    
    try:
        llm = get_llm(model_name)
        return llm.invoke(prompt).content
    except Exception as e:
        return get_friendly_error(e)

def generate_flashcards(file_path, model_name="gemini-2.5-flash"):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    full_text = "\n".join([d.page_content for d in docs])
    
    prompt = f"""
    Create 5 study flashcards from the text below.
    Return ONLY a raw JSON array: [{{"question": "Q?", "answer": "A"}}]
    Text: {full_text[:20000]}
    """
    
    try:
        llm = get_llm(model_name)
        res = llm.invoke(prompt)
        return res.content.replace("```json", "").replace("```", "").strip()
    except:
        return "[]"

def query_expansion_search(query: str, model_name: str = "gemini-2.5-flash") -> str:
    llm = get_llm(model_name)
    
    try:
        # 1. Search
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

def query_documents(query):
    return query_expansion_search(query, "gemini-2.5-flash")