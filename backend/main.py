from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Header
from pydantic import BaseModel
from typing import List, Optional
from rag import process_pdf, query_documents, summarize_document, generate_flashcards, list_available_models
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

# --- Data Models ---
class KeyValidationRequest(BaseModel):
    api_key: str

class SearchQuery(BaseModel):
    query: str
    api_key: str
    model: str

# --- Endpoints ---

@app.post("/validate-key")
def validate_key(request: KeyValidationRequest):
    """
    Checks if the API Key is valid and returns the list of available models.
    """
    result = list_available_models(request.api_key)
    if not result["valid"]:
        raise HTTPException(status_code=401, detail=result["error"])
    
    return {"models": result["models"]}

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    model: str = Form(...),
    api_key: str = Form(...) # We now require the user's key
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are allowed.")

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        num_chunks = process_pdf(file_path)
        
        # Pass the user's key to the AI functions
        summary = summarize_document(file_path, model, api_key)
        
        flashcards_json = generate_flashcards(file_path, model, api_key)
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
        return {
            "filename": file.filename,
            "status": "Error",
            "model_used": model,
            "chunks": 0,
            "summary": f"❌ **Analysis Failed**: {str(e)}",
            "flashcards": []
        }

@app.post("/search")
def search_knowledge_base(request: SearchQuery):
    try:
        # Pass user key and model
        answer = query_documents(request.query, request.api_key, request.model)
        return {"results": [answer]} 
    except Exception as e:
        return {"results": [f"❌ Search Error: {str(e)}"]}