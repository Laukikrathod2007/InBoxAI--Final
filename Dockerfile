FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PyMuPDF
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
# Secrets are NOT baked into the image. Mount them at run time:
#   docker run --env-file .env -v ./gmail_credentials.json:/app/gmail_credentials.json \
#     -v ./token.json:/app/token.json -p 127.0.0.1:8001:8001 inboxiq
# The API app starts the worker itself (src/main.py startup), so run one process.
# Note: first-time Gmail OAuth needs a browser; create token.json on the host first.

EXPOSE 8001

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
