import json
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import google.generativeai as genai

# 1. Setup Vector DB (Local & Free)
DB_PATH = "./chroma_db"
embedding_function = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_db = Chroma(persist_directory=DB_PATH, embedding_function=embedding_function)

# --- CONFIGURATION ---
# We force this specific model ID. 
# "gemini-2.5" does not exist. "gemini-1.5-flash" is the correct latest version.
FIXED_MODEL = "gemini-2.5-flash"

def get_llm(api_key):
    """
    Returns the Gemini 1.5 Flash client.
    """
    return ChatGoogleGenerativeAI(
        model=FIXED_MODEL,
        temperature=0.3,
        google_api_key=api_key,
        convert_system_message_to_human=True 
    )

def validate_api_key(api_key):
    try:
        genai.configure(api_key=api_key)
        # Simple test call to check validity
        list(genai.list_models(page_size=1))
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": str(e)}

def process_pdf(file_path):
    try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        if not documents: raise ValueError("Empty PDF")
        
        # Split text for vector storage
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        vector_db.add_documents(chunks)
        return len(chunks)
    except Exception as e:
        raise ValueError(f"Ingestion failed: {str(e)}")

def analyze_full_document(file_path, api_key):
    """
    Performs Summary + Flashcards in a SINGLE call to save time/limits.
    """
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    # Limit to ~30k chars to ensure we don't hit obscure limits, 
    # though 1.5 Flash can handle much more.
    full_text = "\n".join([d.page_content for d in docs])[:50000]
    
    prompt = f"""
    Analyze the text below. Return ONLY raw JSON.
    Structure:
    {{
      "summary": "markdown summary with 5 bullet points",
      "flashcards": [
         {{"question": "Q1", "answer": "A1"}},
         {{"question": "Q2", "answer": "A2"}},
         {{"question": "Q3", "answer": "A3"}},
         {{"question": "Q4", "answer": "A4"}},
         {{"question": "Q5", "answer": "A5"}}
      ]
    }}
    
    Document Text:
    {full_text}
    """
    
    try:
        llm = get_llm(api_key)
        res = llm.invoke(prompt).content
        
        # Clean markdown formatting if model adds it
        clean_json = res.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        return {
            "summary": f"Error generating summary: {str(e)}",
            "flashcards": []
        }

def query_documents(query, api_key):
    try:
        llm = get_llm(api_key)
        results = vector_db.similarity_search(query, k=5)
        if not results: return "No info found in document."
        
        context = "\n---\n".join([doc.page_content for doc in results])
        synthesis_prompt = PromptTemplate.from_template(
            """
            Answer the question based ONLY on the context below.
            Context: {context}
            Question: {query}
            """
        )
        chain = synthesis_prompt | llm | StrOutputParser()
        return chain.invoke({"query": query, "context": context})
    except Exception as e:
        return f"Error: {str(e)}"