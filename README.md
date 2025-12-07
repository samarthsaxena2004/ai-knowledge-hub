# AI Knowledge Hub (Second Brain)

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20LangChain-orange)

**AI Knowledge Hub** is a powerful Retrieval-Augmented Generation (RAG) platform that transforms static PDF documents into an interactive "Second Brain."

Users can upload textbooks, research papers, or legal documents and instantly receive **concise summaries**, **study flashcards**, and a **semantic chat interface** to ask deep questions about the content.

It leverages **Google Gemini 2.5 Flash** for high-speed, cost-effective analysis and **ChromaDB** for local vector storage, ensuring a privacy-first, zero-cost deployment architecture.

---

## Features

- **PDF Ingestion Engine:** Parses complex PDFs, splits them into semantic chunks, and creates vector embeddings  
- **Instant Executive Summary:** Generates a 5-point summary immediately after upload  
- **Study Flashcards:** AI-generated flashcards for active recall  
- **RAG Chat:** Ask questions and get context-aware answers strictly from the document  
- **Bring Your Own Key (BYOK):** API key is never stored — privacy-first  
- **Fully Dockerized:** One-command setup on any OS  

---

## Tech Stack

### Frontend
- Next.js 14 • Tailwind CSS • Shadcn/UI • Framer Motion • Lucide Icons

### Backend
- FastAPI • LangChain • ChromaDB (Embedded) • Google Gemini 2.5 Flash

### DevOps
- Docker + Docker Compose • Vercel (Frontend) • Render (Backend)

---

## Getting Started (Local Setup)

### Prerequisites
- Docker Desktop
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-knowledge-hub.git
cd ai-knowledge-hub
```

### 2. Run with Docker Compose (Recommended)
```bash
docker compose up --build
```

### 3. Open the app
- Frontend: ```http://localhost:3000```
- Backend API docs: ```http://localhost:8000/docs```
- Mobile on same WiFi: ```http://<your-local-ip>:3000```

---

## Manual Installation (No Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- Open http://localhost:3000

---

## Deployment Guide

### Backend → Render
1. Create new Web Service → Runtime: Docker → Root Directory: backend
2. Add environment variable: GOOGLE_API_KEY=your_key_here
3. Deploy → copy the backend URL

## Frontend → Vercel
1. Import the repo
2. Set root directory to /frontend
3. Add environment variable:
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```
4. Deploy

---

## Project Structure
```bash
ai-knowledge-hub/
├── backend/
│   ├── chroma_db/
│   ├── Dockerfile
│   ├── main.py
│   ├── rag.py
│   └── requirements.txt
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── public/
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Contributing
1. Fork the repo
2. Create your feature branch (```git checkout -b feature/amazing```)
3. Commit your changes (```git commit -m 'Add amazing feature'```)
4. Push to the branch (```git push origin feature/amazing```)
5. Open a Pull Request

---

## License
- Released under the MIT License.
- Built with ❤️ by [Samarth Saxena](https://github.com/samarthsaxena2004)
