#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Initializing AI Knowledge Hub...${NC}"

# Cleanup function to kill background processes when you quit
cleanup() {
    echo -e "${BLUE}🛑 Shutting down...${NC}"
    kill $BACKEND_PID
    docker compose stop
    exit
}

# Listen for Ctrl+C
trap cleanup SIGINT

# 1. Start Database (Docker)
echo -e "${GREEN}📦 Starting MongoDB container...${NC}"
docker compose up -d mongodb
sleep 2

# 2. Start Backend (Python)
echo -e "${GREEN}🧠 Starting Backend (Port 8000)...${NC}"
source backend/venv/bin/activate
cd backend
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$! # Save Process ID
cd ..

# 3. Start Frontend (Node)
echo -e "${GREEN}💻 Starting Frontend (Port 3000)...${NC}"
cd frontend
npm run dev

# Wait indefinitely
wait