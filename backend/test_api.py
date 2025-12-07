# backend/test_api.py
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("❌ Error: GOOGLE_API_KEY not found in .env file.")
    exit()

genai.configure(api_key=api_key)

print("🔍 Checking available models for your API Key...")
try:
    models = genai.list_models()
    found_models = []
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            found_models.append(m.name)
            print(f"  ✅ Available: {m.name}")
    
    if not found_models:
        print("❌ No text generation models found for this API key.")
    else:
        print(f"\n🎉 Found {len(found_models)} working models.")
        
except Exception as e:
    print(f"❌ API Error: {str(e)}")