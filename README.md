# AI Knowledge Hub (Second Brain)

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20LangChain-orange)

**AI Knowledge Hub** is a powerful Retrieval-Augmented Generation (RAG) platform that transforms static PDF documents into an interactive "Second Brain."

Users can upload textbooks, research papers, or legal documents and instantly receive **concise summaries**, **study flashcards**, and a **semantic chat interface** to ask deep questions about the content.

It leverages **Google Gemini 1.5 Flash** for high-speed, cost-effective analysis and **ChromaDB** for local vector storage, ensuring a privacy-first, zero-cost deployment architecture.

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
- FastAPI • LangChain • ChromaDB (Embedded) • Google Gemini 1.5 Flash

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
