# InBoxIQ — AI Email & PDF Automation
![Version](https://img.shields.io/badge/Version-v1.0.0-blue)

InBoxIQ is a local AI-powered system that monitors your Gmail for unread emails with PDF attachments, extracts structured data from them using a local LLM, updates a Google Sheet, and generates draft replies.

## 📌 Release Notes (v1.0.0)
- **Email Monitoring**: Automated tracking of unread Gmail messages.
- **AI Extraction**: Integration with Ollama for intelligent PDF data extraction.
- **Sheets Sync**: Seamless synchronization with Google Sheets.
- **Draft Replies**: Automated creation of draft replies for processed emails.
- **Web Dashboard**: Modern React-based frontend for real-time monitoring.


## 🚀 Features
- **Local AI**: Uses Ollama (Llama 3) for data extraction and reply drafting.
- **Gmail Integration**: Automatically tracks unread emails and creates drafts.
- **Structured Extraction**: Extracts names, dates, and custom fields into JSON.
- **Google Sheets**: Appends all processed data to a target spreadsheet.
- **Docker Ready**: Deploy easily with the provided Dockerfile.

## 🛠 Project Structure
```text
inboxiq/
 ├── src/
 │    ├── main.py           # FastAPI entry point
 │    ├── worker.py         # Background automation loop
 │    ├── extractor.py      # AI JSON extraction
 │    ├── llm_client.py     # Ollama communicator
 │    ├── email_reader.py   # Gmail API logic
 │    ├── sheet_updater.py  # Google Sheets logic
 │    ├── pdf_parser.py     # PDF text extraction
 │    ├── config.py         # Configuration management
 │    └── models.py         # Pydantic data models
 ├── gmail_credentials.json # OAuth credentials (User provided)
 ├── sheets_credentials.json # Service Account JSON (User provided)
 ├── .env                  # Environment variables
 └── processed_emails.json # Persistence file for email IDs
```

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Ollama**: Install from [ollama.com](https://ollama.com) and pull Llama 3:
  ```bash
  ollama pull llama3
  ```
- **Python**: 3.11+
- **Google Cloud Console**:
  - Enable Gmail API and Google Sheets API.
  - Create OAuth 2.0 Credentials (for Gmail) and save as `gmail_credentials.json`.
  - Create a Service Account (for Sheets) and save as `sheets_credentials.json`.

### 2. Configuration
Update the `.env` file with your specific settings:
```env
TARGET_SHEET_NAME=InBoxIQ_Data
OLLAMA_BASE_URL=http://localhost:11434
```

### 3. First Run (Authenticating Gmail)
Before running in Docker, you **must** run the script once locally to authorize the Gmail API. This will open a browser window and generate `token.json`.
```bash
pip install -r requirements.txt
python -m src.worker
```

### 4. Running with Docker
Once `token.json` is generated:
```bash
docker build -t inboxiq .
docker run -p 8000:8000 --add-host=host.docker.internal:host-gateway inboxiq
```

## 📡 API Endpoints
- `GET /`: Status check.
- `POST /process-now`: Manually trigger a processing cycle immediately.

## 🧪 Testing
You can test individual modules using the generated scripts or by calling the manual trigger. Logs are printed to the console for every processing step.
