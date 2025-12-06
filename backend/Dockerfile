# 1. Start with a blank Linux machine that has Python 3.10 installed
FROM python:3.10-slim

# 2. Create a folder named "app" inside that box
WORKDIR /app

# 3. Install the tools needed to run Linux commands
RUN apt-get update && apt-get install -y build-essential curl

# 4. Copy the "requirements.txt" from your Mac into the Box
COPY requirements.txt .

# 5. Install the Python libraries inside the Box
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy ALL your backend code into the Box
COPY . .

# 7. Open Port 8000 so we can talk to it
EXPOSE 8000

# 8. Run the Server (with --reload so it updates when you change files!)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
