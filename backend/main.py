from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from db import get_db
# IMPORT THE NEW FUNCTION HERE 👇
from rag import process_pdf, query_documents, summarize_document, generate_flashcards
import os
import shutil
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "documents"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class SearchQuery(BaseModel):
    query: str

@app.get("/")
def home():
    return {"message": "AI Knowledge Hub API is running"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 1. Ingest
        num_chunks = process_pdf(file_path)
        
        # 2. Generate Summary
        summary = summarize_document(file_path)

        # 3. Generate Flashcards (New Feature!)
        flashcards_json = generate_flashcards(file_path)
        try:
            flashcards = json.loads(flashcards_json)
        except:
            flashcards = [] # Fallback if AI fails to give clean JSON
        
        return {
            "filename": file.filename,
            "status": "Processed",
            "chunks": num_chunks,
            "summary": summary,
            "flashcards": flashcards 
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
def search_knowledge_base(request: SearchQuery):
    results = query_documents(request.query)
    return {"results": results}