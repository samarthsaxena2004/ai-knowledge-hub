import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

# 1. Setup Vector DB (The Memory)
DB_PATH = "./chroma_db"
embedding_function = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_db = Chroma(persist_directory=DB_PATH, embedding_function=embedding_function)

# 2. Dynamic LLM Loader
def get_llm(model_name):
    # Fallback to flash if an invalid model is passed
    valid_models = ["gemini-2.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-8b"]
    if model_name not in valid_models:
        model_name = "gemini-2.5-flash"
        
    return ChatGoogleGenerativeAI(
        model=model_name,
        temperature=0.3,
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )

def process_pdf(file_path):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    vector_db.add_documents(chunks)
    return len(chunks)

def query_documents(query):
    results = vector_db.similarity_search(query, k=5)
    return [doc.page_content for doc in results]

def summarize_document(file_path, model_name="gemini-2.5-flash"):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    full_text = "\n".join([d.page_content for d in docs])
    
    prompt = f"""
    You are an expert synthesizer. Provide a concise summary of this document with 5 key bullet points.
    Document Content: {full_text}
    """
    
    llm = get_llm(model_name)
    try:
        response = llm.invoke(prompt)
        return response.content
    except Exception as e:
        return f"Error generating summary with {model_name}: {str(e)}"

def generate_flashcards(file_path, model_name="gemini-2.5-flash"):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    full_text = "\n".join([d.page_content for d in docs])
    
    prompt = f"""
    Create 5 study flashcards from the text below.
    Return ONLY a raw JSON array: [{{"question": "Q?", "answer": "A"}}]
    Text: {full_text[:4000]}
    """
    
    llm = get_llm(model_name)
    try:
        response = llm.invoke(prompt)
        return response.content.replace("```json", "").replace("```", "").strip()
    except Exception as e:
        return "[]"