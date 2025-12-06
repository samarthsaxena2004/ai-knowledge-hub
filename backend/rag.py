import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

load_dotenv()

# 1. Setup Vector DB (The Memory)
DB_PATH = "./chroma_db"
embedding_function = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_db = Chroma(persist_directory=DB_PATH, embedding_function=embedding_function)

# 2. Setup LLM (The Brain)
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3, # Low temperature = more factual responses
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

def process_pdf(file_path):
    """Ingests a PDF: Loads, Chunks, Embeds, Stores."""
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)

    vector_db.add_documents(chunks)
    return len(chunks)

def query_documents(query):
    """
    Semantic Search: Finds the 5 most relevant chunks for a query.
    """
    results = vector_db.similarity_search(query, k=5)
    # Return just the text content
    return [doc.page_content for doc in results]

def summarize_document(file_path):
    """
    Reads the full PDF and asks Gemini to summarize it.
    """
    loader = PyPDFLoader(file_path)
    docs = loader.load()

    # Combine all pages into one big string
    full_text = "\n".join([d.page_content for d in docs])

    # Create a prompt for the LLM
    prompt = f"""
    You are an expert synthesizer of information.
    Please provide a concise summary of the following document.
    Include the top 5 key takeaways in bullet points.

    Document Content:
    {full_text}
    """
    
    # Send to Gemini
    response = llm.invoke(prompt)
    return response.content

def generate_flashcards(file_path):
    """
    Generates 5 flashcards (Q&A) from the document.
    """
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    full_text = "\n".join([d.page_content for d in docs])
    
    # We limit text context to 4000 chars to ensure fast processing for flashcards
    # This usually captures the introduction and key concepts.
    prompt = f"""
    Based on the following text, create 5 study flashcards.
    Return ONLY a raw JSON array (no markdown formatting, no code blocks) like this:
    [
        {{"question": "What is X?", "answer": "X is Y"}},
        {{"question": "Who did Z?", "answer": "Person A"}}
    ]

    Text:
    {full_text[:4000]}
    """
    
    response = llm.invoke(prompt)
    
    # Cleaning up the response to ensure it's valid JSON
    # Sometimes LLMs add ```json at the start, we remove it.
    content = response.content.replace("```json", "").replace("```", "").strip()
    return content