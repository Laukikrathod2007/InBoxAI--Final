# InBoxIQ — AI-Native Work Operating System

<div align="center">

![Version](https://img.shields.io/badge/Version-v1.1.0-6366f1?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Stop reading emails. Start acting on them.**

InBoxIQ is a privacy-first AI Work OS built around Gmail. It automatically reads, classifies, and prioritizes your inbox using local or cloud LLMs — turning raw emails into actionable work items on an intelligent dashboard.

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Configuration](#-configuration)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| **AI Email Pipeline** | 6-stage LangGraph brain: Ingest → Rule Filter → PDF Extract → Classify → Decide → Store |
| **Intelligent Dashboard** | 3-column Work OS UI — Sidebar, Email Feed, Intelligence Panel |
| **Compose by Intent** | Describe what you want to say, AI drafts the full email |
| **Inbox Q&A** | Chat with your inbox in natural language |
| **PDF Intelligence** | Automatically extracts invoices, resumes, contracts from attachments |
| **Autopilot Mode** | Auto-archives noise, applies Gmail labels, marks emails read |
| **Daily Briefing** | AI-generated executive summary of your pending work |
| **Local-first** | Runs on your machine with Ollama (Llama 3). Gemini is an optional fallback and only used if `GEMINI_API_KEY` is set; then email text can leave your machine. |
| **Gemini Fallback** | Optional Google Gemini API as a cloud fallback |
| **Noise Control** | Deterministic rule engine + LLM spam filter |

---

## 🏗 Architecture

```
Gmail API (OAuth 2.0)
        │
        ▼
┌─────────────────────────────────────────────────────┐
│                  LangGraph Brain                     │
│                                                     │
│  [1] Ingest → [2] Rule Filter → [2.5] PDF Extract  │
│       → [3] LLM Classify → [4] Decision Engine     │
│       → [5] Draft Reply → [6] Store + Autopilot    │
└─────────────────────────────────────────────────────┘
        │
        ▼
  SQLite Database (inboxiq.db)
        │
        ▼
  FastAPI Backend (port 8001)
        │
        ▼
  React + Vite + Tailwind Frontend
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + Tailwind CSS v4 + Lucide React |
| **Backend** | FastAPI + SQLAlchemy + SQLite |
| **AI Orchestration** | LangGraph (stateful agent graph) |
| **Local AI** | Ollama (Llama 3) — runs on your machine |
| **Cloud AI** | Google Gemini 2.0 Flash (optional fallback) |
| **Gmail** | Google Gmail API v1 (OAuth 2.0) |
| **PDF Parsing** | PyMuPDF |

---

## Results (synthetic mailbox, 150 labelled emails, seed 42)

Reproduce: `python -m eval.make_dataset` then `python -m eval.run_eval --name rules` (no network). LLM row: `python -m eval.run_eval --name llm --llm` (needs local Ollama; refuses cloud).

| System | Noise caught | Noise precision | Important mail wrongly hidden | Needs-action mail lost |
|---|---|---|---|---|
| Archive nothing (baseline) | 0% | n/a | 0% | 0% |
| Original keyword rules | 88.3% | 63.9% | 33.3% | 40.0% |
| Rules v2 (this repo) | 88.3% | 100% | 0.0% | 0.0% |
| Llama 3 8B local, archive-if-low-importance | 96.7% | 65.2% | 34.4% | 0.0% |

Reading this honestly: the data is synthetic and the labels are mine, so the rules score is partly tuned to the test set. Treat it as a regression guard, not as accuracy on real mail. The LLM row shows a plain "archive if not important" policy is unsafe, which is why `assist` is the default and the LLM never archives on its own.
Latency (`GET /api/metrics`) and cost per email are not yet documented.

## Known limits
- No login. Server is localhost-only; browser cross-site writes are blocked, but any local program can reach the API.
- No automatic undo for archived mail (audit log exists).
- Synthetic test set only; no real-user results yet.
- Prompt-injection behavior is not tested.
- Docker path is untested; first-time Gmail OAuth needs a host browser.
## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- [Ollama](https://ollama.ai) installed with Llama 3 pulled (`ollama pull llama3`)
- A Google Cloud project with the Gmail API enabled
- `gmail_credentials.json` downloaded from Google Cloud Console

### 1. Clone the Repository

```bash
git clone https://github.com/Laukikrathod2007/InBoxAI--Final.git
cd InBoxAI--Final
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
# Gmail API
GMAIL_CLIENT_CONFIG=gmail_credentials.json
GMAIL_TOKEN_FILE=token.json

# AI Model (choose one or both)
GEMINI_API_KEY=your_gemini_api_key_here   # Optional — leave blank for local-only
PRIMARY_MODEL=gemini-2.0-flash
FALLBACK_MODEL=gemini-flash-latest

# Local Ollama (used first if available)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# App Settings
POLLING_INTERVAL_SECONDS=20
CONFIDENCE_THRESHOLD=70
TEMPERATURE=0.2
MAX_OUTPUT_TOKENS=512
```

Place your `gmail_credentials.json` in the project root.

### 3. One-Click Launch (Windows)

```powershell
powershell -File setup_and_run.ps1
```

Or double-click **`Launch InBoxIQ.bat`**.

### 4. Manual Launch

```bash
# Install Python dependencies
pip install -r requirements.txt

# Build the frontend
cd frontend
npm install
npm run build
cd ..

# Start the server
python run_app.py
```

### 5. Open the Dashboard

```
Local:   http://localhost:8001
Network: off by default. Set INBOXIQ_HOST=0.0.0.0 only on a trusted network (no login).
```

On first launch, a browser window will open for Gmail OAuth authorization. After approving, `token.json` is saved and the worker starts polling automatically.

---

## 📁 Project Structure

```
InBoxIQ/
├── src/
│   ├── main.py           — FastAPI app entry point, serves React SPA
│   ├── api_routes.py     — All REST API endpoints (/api/*)
│   ├── worker.py         — Background email polling loop (every N seconds)
│   ├── brain.py          — LangGraph 6-stage AI pipeline
│   ├── email_reader.py   — Gmail API: fetch, send, thread, labels
│   ├── extractor.py      — PDF document intelligence (invoice, resume, etc.)
│   ├── noise_filter.py   — LLM-powered spam/marketing detector
│   ├── chat_engine.py    — NL → SQL → NL inbox Q&A engine
│   ├── ghostwriter.py    — AI email drafting from intent
│   ├── autopilot.py      — Gmail automation (archive, label, mark read)
│   ├── llm_client.py     — Unified LLM client (Ollama → Gemini fallback)
│   ├── database.py       — SQLAlchemy models + auto-migration
│   ├── models.py         — Pydantic request/response models
│   └── config.py         — Settings loaded from .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    — Main 3-column Work OS layout
│   │   ├── index.css                  — Tailwind v4 + Inter font
│   │   └── components/
│   │       ├── AskModal.jsx           — AI Q&A drawer
│   │       ├── ComposeModal.jsx       — Intent → Draft → Send modal
│   │       ├── EmailCard.jsx          — Email list item card
│   │       ├── EmailList.jsx          — Scrollable email feed
│   │       ├── RightPanel.jsx         — Intelligence panel + AI chat
│   │       ├── SideBar.jsx            — Category navigation sidebar
│   │       └── TopBar.jsx             — Search + navigation bar
│   └── dist/                          — Built production assets (gitignored)
│
├── gmail_credentials.json  — Google OAuth client (gitignored, add your own)
├── token.json              — Gmail session token (auto-generated, gitignored)
├── inboxiq.db              — SQLite database (gitignored)
├── requirements.txt        — Python dependencies
├── run_app.py              — App launcher (server + browser open)
├── setup_and_run.ps1       — Windows one-click setup script
├── Launch InBoxIQ.bat      — Windows batch launcher
└── .env                    — Configuration (gitignored, create your own)
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/history` | Fetch processed emails (most recent first) |
| `GET` | `/api/search?q=term` | Full-text search across subject, sender, summary, body |
| `GET` | `/api/stats` | Dashboard counts (total, noise, needs reply, errors) |
| `GET` | `/api/daily-briefing` | AI-generated executive summary of open action items |
| `GET` | `/api/action-items` | Fetch open work items (reply, task, invoice, resume, schedule) |
| `GET` | `/api/threads` | Fetch email thread summaries |
| `GET` | `/api/document-extractions` | PDF extraction results |
| `GET` | `/api/extraction-stats` | Document extraction performance stats |
| `GET` | `/api/review-queue` | Low-confidence emails needing human review |
| `GET` | `/api/emails-by-category` | Emails grouped by noise category (LinkedIn, Naukri, etc.) |
| `GET` | `/api/user-profile` | Gmail account info |
| `GET` | `/api/settings` | Current confidence threshold and autopilot settings |
| `POST` | `/api/chat` | Ask a natural language question about your inbox |
| `POST` | `/api/compose-draft` | Generate an email draft from intent + tone |
| `POST` | `/api/send` | Send an email via Gmail API |
| `POST` | `/api/overrides` | Manually override priority / noise / done status |
| `POST` | `/api/bulk-action` | Archive or mute an entire email category |
| `POST` | `/api/action-items/{id}/status` | Update action item status |
| `POST` | `/api/settings` | Update confidence threshold |
| `GET` | `/automation/status` | Worker loop runtime status |
| `POST` | `/automation/start` | Start the background worker |
| `POST` | `/automation/stop` | Stop the background worker |
| `POST` | `/process-now` | Manually trigger one email processing cycle |
| `GET` | `/health` | Health check |

---

## ⚙️ Configuration

All settings are controlled via `.env`:

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | _(empty)_ | Google Gemini API key. Leave blank for local-only mode. |
| `PRIMARY_MODEL` | `gemini-2.0-flash` | Primary Gemini model |
| `FALLBACK_MODEL` | `gemini-flash-latest` | Fallback Gemini model |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3` | Local model name |
| `POLLING_INTERVAL_SECONDS` | `20` | How often to check Gmail |
| `CONFIDENCE_THRESHOLD` | `70` | Below this %, email goes to review queue |
| `TEMPERATURE` | `0.2` | LLM temperature (lower = more deterministic) |
| `AUTOPILOT_ENABLED` | `true` | Enable/disable autopilot actions |
| `AUTOPILOT_MODE` | `autonomous` | `off` / `assist` / `autonomous` |
| `AUTOPILOT_AUTO_ARCHIVE_NOISE` | `true` | Auto-archive spam/marketing |
| `AUTOPILOT_AUTO_SEND_REPLIES` | `false` | Auto-send AI replies (disabled by default) |

---

## 🧠 How the AI Pipeline Works

Each new email goes through a 6-stage LangGraph pipeline:

1. **Ingest** — Fetches full email content, thread history, and attachment metadata from Gmail API
2. **Rule Filter** — Deterministic pre-bucketing (marketing keywords, no-reply senders, etc.) — skips LLM for obvious noise
3. **PDF Extract** — Downloads and intelligently extracts structured data from PDF attachments (invoices, resumes, contracts, receipts)
4. **LLM Classify** — Sends cleaned content + document context to LLM for structured JSON extraction: category, priority, actions required, deadlines, people, organizations
5. **Decision Engine** — Multi-factor scoring: confidence × importance × thread history → routes to TASK / REPLY / SCHEDULE / ARCHIVE / REVIEW
6. **Store + Autopilot** — Saves to SQLite, creates ActionItems for the UI, then applies Gmail-side actions (labels, archive, mark read) based on autopilot config

---

## 🔒 Privacy & Security

- **Local-first**: With no `GEMINI_API_KEY`, email text stays on your machine. If a key is set and Ollama is down, prompts containing email text go to Google Gemini.
- **Secrets gitignored**: `.env`, `gmail_credentials.json`, `token.json`, and `inboxiq.db` are all excluded from version control.
- **Safe by default**: `AUTOPILOT_MODE=assist` never changes Gmail; it logs what it would do. Auto-send is off. Server binds to 127.0.0.1, with cross-origin write blocking and Host checks. There is no login yet.
- **OAuth 2.0**: Gmail access uses Google's standard OAuth flow with `gmail.modify` scope.

---

## 🔮 Roadmap

| Feature | Status |
|---|---|
| Google Calendar integration for meeting scheduling | Planned |
| Multi-account Gmail support | Planned |
| Model fine-tuning using UserFeedback table | Planned |
| Desktop notifications for high-priority emails | Planned |
| Switch to `google.genai` SDK (deprecation fix) | Pending |

---

## 🐛 Known Issues

- `google.generativeai` package shows a deprecation warning — still functional, migration to `google.genai` is planned
- Gmail OAuth token expires periodically — re-run the app to trigger a fresh OAuth flow

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with FastAPI, React, LangGraph, and local LLMs.<br/>
<strong>Local-first. Measured. Reversible by default.</strong>
</div>
