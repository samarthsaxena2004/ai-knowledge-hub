from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# SMART CONNECTION:
# 1. Tries to get MONGO_URI from Docker environment (mongodb://mongodb:27017)
# 2. If not found, falls back to Localhost (mongodb://localhost:27017)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "knowledge_hub")

def get_db():
    try:
        client = MongoClient(MONGO_URI)
        # Send a 'ping' to check if we are truly connected
        client.admin.command('ping')
        print(f"✅ Connected to MongoDB at: {MONGO_URI}")
        return client[DB_NAME]
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        return None