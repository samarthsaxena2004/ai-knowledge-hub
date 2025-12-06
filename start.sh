#!/bin/bash

# Define colors for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Initializing AI Knowledge Hub...${NC}"

# Function to kill backend when you press Ctrl+C
cleanup() {
    echo -e "${BLUE}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID
    docker compose stop
    exit
}

# Trap the Ctrl+C signal
trap cleanup SIGINT

# 1. Start Database (Docker)
echo -e "${GREEN}📦 Ensuring Database is running...${NC}"
docker compose up -d
sleep 2 # Give Mongo a moment to wake up

# 2. Start Backend (Python) in the Background
echo -e "${GREEN}🧠 Starting Backend Brain (Port 8000)...${NC}"
source backend/venv/bin/activate
cd backend
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$! # Save the Process ID so we can kill it later
cd ..

# 3. Start Frontend (Next.js) in the Foreground
echo -e "${GREEN}💻 Starting Frontend Interface (Port 3000)...${NC}"
cd frontend
npm run dev

# Keep script running
wait