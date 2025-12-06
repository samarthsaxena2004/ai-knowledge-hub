from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from db import get_db
from rag import process_pdf, query_documents, summarize_document, generate_flashcards
import os
import shutil
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS (Allows Frontend at port 3000 to talk to Backend at 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "documents"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 🛡️ SECURITY: Limit file uploads to 10MB to prevent server freezing
MAX_FILE_SIZE = 10 * 1024 * 1024 

class SearchQuery(BaseModel):
    query: str

@app.get("/")
def home():
    return {"message": "AI Knowledge Hub API is running"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # 🛡️ VALIDATION 1: Check File Type
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are allowed.")

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    
    try:
        # 🛡️ VALIDATION 2: Check File Size
        file_size = 0
        with open(file_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024) # Read 1MB at a time
                if not chunk:
                    break
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    # Cleanup if too big
                    buffer.close()
                    os.remove(file_path)
                    raise HTTPException(status_code=413, detail="File too large. Limit is 10MB.")
                buffer.write(chunk)
        
        # 🛡️ VALIDATION 3: Safe AI Processing
        # If the PDF is corrupted (or a fake PDF), process_pdf will fail.
        # We catch that specific error so the server doesn't crash.
        try:
            # 1. Ingest (Vectorize)
            num_chunks = process_pdf(file_path)
            
            # 2. Generate Summary
            summary = summarize_document(file_path)

            # 3. Generate Flashcards
            flashcards_json = generate_flashcards(file_path)
            try:
                flashcards = json.loads(flashcards_json)
            except:
                flashcards = [] # Fallback if AI output is messy
            
            return {
                "filename": file.filename,
                "status": "Processed",
                "chunks": num_chunks,
                "summary": summary,
                "flashcards": flashcards 
            }
            
        except Exception as ai_error:
            # If AI fails, delete the corrupted file so it doesn't waste space
            if os.path.exists(file_path):
                os.remove(file_path)
            print(f"AI Processing Error: {ai_error}")
            raise HTTPException(status_code=422, detail="Could not read PDF content. Is the file corrupted or encrypted?")

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
def search_knowledge_base(request: SearchQuery):
    try:
        results = query_documents(request.query)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")