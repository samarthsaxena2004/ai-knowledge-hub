# 🧠 AI Knowledge Hub (Second Brain)

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20LangChain-orange)

**AI Knowledge Hub** is a powerful Retrieval-Augmented Generation (RAG) platform that transforms static PDF documents into an interactive "Second Brain." 

Users can upload textbooks, research papers, or legal documents and instantly receive **concise summaries**, **study flashcards**, and a **semantic chat interface** to ask deep questions about the content.

It leverages **Google Gemini 1.5 Flash** for high-speed, cost-effective analysis and **ChromaDB** for local vector storage, ensuring a privacy-first, zero-cost deployment architecture.

---

## ✨ Features

- **📄 PDF Ingestion Engine:** Parses complex PDF documents, splits them into semantic chunks, and generates vector embeddings.
- **⚡ Instant Summaries:** Automatically generates a 5-point executive summary upon upload.
- **🧠 Active Recall Flashcards:** AI-generated Q&A flashcards to help users study and retain information.
- **💬 Deep Search (RAG Chat):** Ask specific questions ("What is the conclusion of section 3?") and get answers based *only* on the document's context.
- **🔑 Bring Your Own Key (BYOK):** Secure architecture where users provide their own Google Gemini API Key. No backend storage of keys.
- **🐳 Fully Dockerized:** One-command setup for any device (Windows, Mac, Linux).

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** [Next.js 14](https://nextjs.org/) (React)
- **Styling:** Tailwind CSS, Shadcn/UI
- **Animations:** Framer Motion
- **Icons:** Lucide React

### **Backend**
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **AI Orchestration:** [LangChain](https://www.langchain.com/)
- **Vector Database:** [ChromaDB](https://www.trychroma.com/) (Embedded)
- **LLM Engine:** Google Gemini 1.5 Flash (via `langchain-google-genai`)

### **DevOps**
- **Containerization:** Docker & Docker Compose
- **Deployment:** Vercel (Frontend) + Render (Backend)

---

## 🚀 Getting Started (Local Setup)

The easiest way to run this project is using **Docker**. This ensures compatibility across all devices.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Git](https://git-scm.com/) installed.

### Step 1: Clone the Repository
```bash
git clone [https://github.com/yourusername/ai-knowledge-hub.git](https://github.com/yourusername/ai-knowledge-hub.git)
cd ai-knowledge-hub
