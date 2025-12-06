from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from db import get_db
from rag import process_pdf, query_documents, summarize_document
import os
import shutil

app = FastAPI()

UPLOAD_FOLDER = "documents"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Simple data model for search requests
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

        # 2. Generate Summary immediately (Optional, but cool)
        summary = summarize_document(file_path)

        return {
            "filename": file.filename,
            "status": "Processed",
            "chunks": num_chunks,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
def search_knowledge_base(request: SearchQuery):
    results = query_documents(request.query)
    return {"results": results}