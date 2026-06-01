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
COPY gmail_credentials.json .
COPY .env .

# We will use a script to run both the API and the worker
RUN echo '#!/bin/bash\n\
uvicorn src.main:app --host 0.0.0.0 --port 8000 & \n\
python -m src.worker\n\
wait' > /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]
