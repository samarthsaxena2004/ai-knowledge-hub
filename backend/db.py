from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Get connection details from the .env file
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

def get_db():
    try:
        # Connect to the MongoDB container running in Docker
        client = MongoClient(MONGO_URI)
        # Send a 'ping' to check if we are truly connected
        client.admin.command('ping')
        return client[DB_NAME]
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None
