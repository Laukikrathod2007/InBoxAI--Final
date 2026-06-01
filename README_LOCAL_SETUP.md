# InBoxIQ AI Work OS: Local Setup Guide

Follow these steps to get your Intelligent Inbox running on your machine.

## 📋 Prerequisites

1. **Python 3.10+**: [Download here](https://www.python.org/downloads/)
2. **Node.js & NPM**: [Download here](https://nodejs.org/)
3. **Ollama**: [Download here](https://ollama.com/)
   - Run `ollama run llama3` once to ensure the model is downloaded.
4. **Google Cloud Console**:
   - Create a project.
   - Enable **Gmail API**.
   - Create **OAuth 2.0 Client ID** (Desktop Application).
   - Download the JSON and rename it to `gmail_credentials.json` in the root of this project.

## 🚀 One-Step Launch

If you have all prerequisites done, simply run the PowerShell script:

```powershell
./setup_and_run.ps1
```

---

## 🛠️ Step-by-Step Manual Setup

### 1. Build the Frontend
Transform the React source code into optimized static assets.
```bash
cd frontend
npm install
npm run build
cd ..
```

### 2. Prepare the Environment
Create a `.env` file in the root directory (optional, script does it for you):
```env
DATABASE_URL=sqlite:///./inboxiq.db
POLLING_INTERVAL_SECONDS=60
OLLAMA_BASE_URL=http://localhost:11434
```

### 3. Start the Engines
```bash
python run_app.py
```
This will start both the server and the worker.
- **Local Access**: [http://localhost:8000](http://localhost:8000)
- **Network Access**: Accessible from other devices via your local IP (displayed in console).

## 🧠 Using the AI Work OS

- **Dashboard**: View prioritized actions, categories (Money, Hiring, etc.), and AI reasoning.
- **Compose**: Click "Compose Intent" to draft emails via AI.
- **Worker**: The console will show real-time processing as emails arrive.

> [!IMPORTANT]
> **First Run**: On the first execution, a browser window will open asking you to authorize InBoxIQ to access your Gmail. Once authorized, a `token.json` file will be created, and you won't need to login again.
