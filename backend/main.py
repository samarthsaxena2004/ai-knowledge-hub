from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from db import get_db
from rag import process_pdf, query_documents, summarize_document, generate_flashcards
import os
import shutil
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "documents"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024 

class SearchQuery(BaseModel):
    query: str

@app.get("/")
def home():
    return {"message": "AI Knowledge Hub API is running"}

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    model: str = Form("gemini-2.5-flash") # Default if not provided
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are allowed.")

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    
    try:
        # Save File
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 1. Ingest
        num_chunks = process_pdf(file_path)
        
        # 2. Generate Summary (Using selected model)
        summary = summarize_document(file_path, model)

        # 3. Generate Flashcards (Using selected model)
        flashcards_json = generate_flashcards(file_path, model)
        try:
            flashcards = json.loads(flashcards_json)
        except:
            flashcards = []
        
        return {
            "filename": file.filename,
            "status": "Processed",
            "model_used": model,
            "chunks": num_chunks,
            "summary": summary,
            "flashcards": flashcards 
        }
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
def search_knowledge_base(request: SearchQuery):
    results = query_documents(request.query)
    return {"results": results}