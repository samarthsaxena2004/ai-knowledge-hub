from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from rag import process_pdf, query_documents, validate_api_key, analyze_full_document
import os
import shutil
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

class KeyValidationRequest(BaseModel):
    api_key: str

class SearchQuery(BaseModel):
    query: str
    api_key: str

@app.post("/validate-key")
def validate_key_endpoint(request: KeyValidationRequest):
    result = validate_api_key(request.api_key)
    if not result["valid"]:
        raise HTTPException(status_code=401, detail=result["error"])
    return {"status": "Connected"}

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    api_key: str = Form(...)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDFs allowed.")

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 1. Local Ingest
        num_chunks = process_pdf(file_path)
        
        # 2. Smart Analysis (Backend chooses model)
        analysis_result = analyze_full_document(file_path, api_key)
        
        return {
            "filename": file.filename,
            "status": "Processed",
            "chunks": num_chunks,
            "summary": analysis_result.get("summary", "Summary failed."),
            "flashcards": analysis_result.get("flashcards", [])
        }

    except Exception as e:
        if os.path.exists(file_path): os.remove(file_path)
        return {
            "filename": file.filename,
            "status": "Error",
            "chunks": 0,
            "summary": f"❌ Error: {str(e)}",
            "flashcards": []
        }

@app.post("/search")
def search_knowledge_base(request: SearchQuery):
    try:
        answer = query_documents(request.query, request.api_key)
        return {"results": [answer]} 
    except Exception as e:
        return {"results": [f"❌ Error: {str(e)}"]}