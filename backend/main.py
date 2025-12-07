from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from rag import process_pdf, query_documents, summarize_document, generate_flashcards, get_friendly_error
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

class SearchQuery(BaseModel):
    query: str

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    model: str = Form("gemini-2.5-flash")
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
        
        # 2. Generate Summary
        # (This will raise an Exception if the model is broken, triggering the 'except' block below)
        summary = summarize_document(file_path, model)
        
        # 3. Generate Flashcards
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
        
        # Now we use the helper to format the error nicely for the frontend
        friendly_msg = get_friendly_error(e)
        
        # Return a "Success" 200 OK so the frontend renders the UI, 
        # but put the error message in the summary box so the user sees it.
        return {
            "filename": file.filename,
            "status": "Error",
            "model_used": model,
            "chunks": 0,
            "summary": f"❌ **Analysis Failed**: {friendly_msg}",
            "flashcards": []
        }

@app.post("/search")
def search_knowledge_base(request: SearchQuery):
    try:
        answer = query_documents(request.query)
        return {"results": [answer]} 
    except Exception as e:
        return {"results": [f"❌ Search Error: {get_friendly_error(e)}"]}