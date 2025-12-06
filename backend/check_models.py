import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: No API Key found in .env")
else:
    try:
        genai.configure(api_key=api_key)
        print("✅ API Key connected. Available models:")
        found = False
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")
                found = True
        if not found:
            print("⚠️ No models found. Your API Key might need 'Generative Language API' enabled in Google Cloud Console.")
    except Exception as e:
        print(f"❌ Connection Error: {e}")