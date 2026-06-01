# InBoxIQ — Project Journal
### From Basic Automation Tool → AI-Native Work Operating System

---

## 📌 What Is InBoxIQ?

InBoxIQ is a personal **AI Work OS** built around Gmail. Instead of opening your email inbox, you interact with an intelligent dashboard that:
- Automatically reads, classifies, and prioritizes your emails using a local LLM (Llama 3 via Ollama)
- Presents work as **actionable items**, not raw messages
- Lets you **compose and send emails using intent** ("Schedule interview with Laukik for Friday")
- Answers questions about your inbox via a built-in **AI Chat**
- Never requires you to open Gmail

---

## 🏗️ Architecture Overview

```
Google Gmail API
      ↓
  GmailReader (src/email_reader.py)
      ↓
  NoiseFilter (src/noise_filter.py)  ← Ollama LLM
      ↓
  Extractor (src/extractor.py)       ← Ollama LLM
      ↓
  SQLite Database (inboxiq.db)
      ↓
  FastAPI Backend (src/api_routes.py)
      ↓
  React Frontend (frontend/src/App.jsx)
```

**Tech Stack:**
| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS v4 + Lucide React |
| Backend | FastAPI + SQLAlchemy + SQLite |
| AI Brain | Ollama (Llama 3) running locally |
| Gmail Integration | Google Gmail API (OAuth 2.0) |
| Serving | FastAPI serves the built React SPA at port 8000 |

---

## 🗺️ What Was Built (Phase by Phase)

### Phase 1 — Database & Data Model
Built the foundational SQLite schema with:
- `EmailRecord` — stores all processed email knowledge
- `ThreadRecord` — caches Gmail thread context
- `ProcessedEmail` — registry to avoid reprocessing
- `UserFeedback` — stores manual overrides (priority, noise, done)
- `SystemLog` — records pipeline events and errors

### Phase 2 — Noise + Intelligence Pipeline
- **NoiseFilter**: LLM-powered spam/marketing detector. Returns `is_noise` + reason.
- **Extractor**: Full LLM extraction producing structured JSON with: `summary`, `category`, `entities`, `actions_required`, `priority`, `importance_score`, `needs_reply`, `reasoning`.
- **LLM client** (`src/llm_client.py`): Connects to local Ollama API.

### Phase 3 — Worker Pipeline (4-Stage)
`src/worker.py` runs a continuous loop every 30 seconds:
1. **Fetch** unread Gmail messages
2. **Check** ProcessedEmail registry (skip already-processed)
3. **Noise Filter** → mark as noise and skip if marketing/spam
4. **LLM Extraction** → store full knowledge in EmailRecord
5. **Thread Caching** → update ThreadRecord with participants & summary

### Phase 4 — Chat Engine & API
- `src/chat_engine.py`: Takes natural language queries, fetches recent email context from DB, sends to LLM for a contextual answer.
- `src/api_routes.py` exposes:
  - `GET /api/history` — all processed emails
  - `GET /api/search` — full-text search (subject, sender, summary, body)
  - `POST /api/chat` — AI inbox assistant
  - `POST /api/compose-draft` — AI email drafting from intent
  - `POST /api/send` — Gmail API email sending
  - `GET /api/stats` — email counts for sidebar
  - `GET /api/daily-briefing` — LLM-generated summary of last 24h
  - `POST /api/overrides` — manual user corrections

### Phase 5 — AI-Native Frontend (Work OS UI)
Complete React frontend with:
- **3-column layout**: Sidebar → Email Feed → Intelligence Panel
- **Intelligent Sidebar**: LLM-driven category filters (Finance, Hiring, Meetings, Deadlines)
- **Email Cards**: Priority dot, category badge, AI summary, due dates
- **Intelligence Panel**: Always visible. Shows AI Reasoning, Entities, Actions Required
- **AI Chat**: Embedded at bottom of Intelligence Panel — real chat bubbles, typing dots
- **Compose Modal**: Intent → LLM Draft → Edit → Send via Gmail API. Tone presets (Professional, Casual, Direct)
- **Working Search**: Debounced live search via `/api/search` endpoint
- **Sync Now Button**: Manual Gmail poll trigger

### Phase 6 — AI-Native Compose
- User writes an **intent**, not an email
- AI reads thread context from DB
- Drafts subject + body via LLM
- User previews and edits
- Sends directly via Gmail API (no Gmail interface needed)
- **Actions Required are clickable** — clicking auto-opens Compose modal with action pre-filled as intent

---

## 🐛 Problems Faced & How They Were Resolved

### 1. `'.' is not recognized` — PowerShell Script Not Running
**Problem:** User ran `./setup_and_run.ps1` in Command Prompt, not PowerShell.  
**Fix:** Instructed to use `powershell -File setup_and_run.ps1` from `cmd`, or `.\setup_and_run.ps1` in a PowerShell terminal.

---

### 2. PowerShell Script Parse Error (Emoji Encoding)
**Problem:** The setup script contained emojis (🚀, 📦) which caused parse failures on some Windows/PowerShell versions.  
**Fix:** Rewrote `setup_and_run.ps1` without emojis, using plain ASCII text. Also replaced `Out-File` with `Set-Content` for safer UTF-8 handling.

---

### 3. `NameError: name 'BaseModel' is not defined` in `src/models.py`
**Problem:** `models.py` used Pydantic's `BaseModel`, `List`, `Dict`, `Optional` without importing them.  
**Fix:** Added the required imports at the top of `models.py`:
```python
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
```

---

### 4. `ImportError: cannot import name 'ExtractionRecord'`
**Problem:** `src/worker.py` had duplicate, conflicting import blocks from an earlier version. One block referenced `ExtractionRecord` (a deprecated table) and `sheet_updater`, `reply_generator` (removed modules).  
**Fix:** Cleaned up `worker.py` — removed all old imports, kept only the correct ones.

---

### 5. `sqlite3.OperationalError: no such column: emails.reasoning`
**Problem:** The `reasoning` column was added to the SQLAlchemy model but the existing `inboxiq.db` file was already created without it. SQLite does not auto-migrate.  
**Fix:** Added an automatic migration inside `init_db()` in `database.py`:
```python
conn.execute(text("ALTER TABLE emails ADD COLUMN reasoning TEXT"))
```
This runs on every startup and silently skips if the column already exists.

---

### 6. White Screen — App Renders Nothing
**Problem:** `App.jsx` used `ShieldCheck` icon from Lucide React in the component but it was not in the import list. React crashes silently at runtime.  
**Fix:** Added `ShieldCheck` to the lucide-react import block.

---

### 7. `ExpandMore` and `Label` Icons Not Found in Lucide
**Problem:** Material Design icon names were used (`ExpandMore`, `Label`) that don't exist in the Lucide React library.  
**Fix:** Replaced with correct Lucide equivalents:
- `ExpandMore` → `ChevronDown`
- `Label` → `Tag`
- `SearchIcon` → `Search`

---

### 8. AI Classification Working But Errors Silently Swallowed
**Problem:** `src/extractor.py` called `logger.error(...)` but `logger` was never defined (missing import). All extraction errors disappeared quietly.  
**Fix:** Added at the top of `extractor.py`:
```python
logger = logging.getLogger(__name__)
```

---

### 9. Pydantic Version Conflict (LangChain vs InBoxIQ)
**Problem:** The system had LangChain installed (needing `pydantic>=2.7.4`) but `requirements.txt` pinned `pydantic==2.5.3`.  
**Fix:** Updated `requirements.txt` to use flexible version constraints:
```
pydantic>=2.8.2
pydantic-settings>=2.4.0
```

---

### 10. Chat Response Appearing as Browser `alert()` Dialog
**Problem:** The AI Chat response was displayed using `alert(res.data.response)` — a terrible UX that breaks the "professional OS" feeling.  
**Fix:** Replaced with a proper inline chat panel embedded in the Intelligence Panel sidebar. Features: message bubbles, typing animation (3 bouncing dots), auto-scroll to latest message.

---

### 11. Layout Gap Between Intelligence Panel and Chat
**Problem:** When no email was selected, the Intelligence Panel was conditionally hidden — leaving a blank white column gap next to the Chat panel.  
**Fix:** Made the Intelligence Panel **always visible**. When no email is selected, it shows a clean empty state ("Select an Email to see AI Reasoning"). The AI Chat is now **embedded at the bottom** of the Intelligence Panel — no separate floating column.

---

### 12. Actions Required — Display Only, Not Functional
**Problem:** The "Actions Required" items (e.g., "Review Laukik's resume", "Schedule interview") were just static text labels. Clicking them did nothing.  
**Fix:** Converted to interactive `<button>` elements. Clicking any action now opens the **AI Compose modal with that action pre-filled as the intent**, and the email's thread context and sender pre-loaded. The user just clicks "Draft with Intelligence" and the AI writes the email.

---

### 13. Search Bar Not Working
**Problem:** The search input had no backing logic — typing in it did nothing.  
**Fix:**
- Added `/api/search` backend endpoint that does `ILIKE` queries across subject, sender, summary, and body
- Added a `useDebounce` hook (400ms) to avoid API flooding
- Search state tied to the email list display with a clear (×) button

---

## 📁 Current File Structure

```
InBoxIQ/
├── src/
│   ├── main.py           — FastAPI app, serves React SPA
│   ├── api_routes.py     — All API endpoints
│   ├── worker.py         — Email polling & 4-stage pipeline
│   ├── email_reader.py   — Gmail API (fetch, send, thread)
│   ├── extractor.py      — LLM email classification
│   ├── noise_filter.py   — LLM spam/noise detector
│   ├── chat_engine.py    — Inbox Q&A via LLM
│   ├── llm_client.py     — Ollama API wrapper
│   ├── database.py       — SQLAlchemy models + auto-migration
│   ├── models.py         — Pydantic models (EmailKnowledge)
│   └── config.py         — Settings (from .env)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               — Main UI (3-column Work OS)
│   │   ├── index.css             — Tailwind v4 + Inter font
│   │   └── components/
│   │       └── ComposeModal.jsx  — AI Compose modal
│   └── dist/                     — Built production assets
│
├── gmail_credentials.json  — Google OAuth client config
├── token.json              — Gmail auth token (auto-generated)
├── inboxiq.db              — SQLite database
├── requirements.txt        — Python dependencies
├── setup_and_run.ps1       — One-command launcher (Windows)
├── run_app.py              — Starts server + worker threads
└── PROJECT_JOURNAL.md      — This file
```

---

## ▶️ How to Run

```cmd
cd C:\Users\LAUKIK\Desktop\InBoxIQ
powershell -File setup_and_run.ps1
```

Visit: **http://localhost:8000**

### Prerequisites
| Requirement | Status |
|---|---|
| Python 3.10+ | ✅ |
| Node.js + npm | ✅ |
| Ollama (`llama3`) | ✅ Running locally |
| `gmail_credentials.json` | ✅ In project root |
| `token.json` | ✅ Auto-generated on first run |

---

---

### 14. "Archive" and "Rules" Sections Blank Screen
**Problem:** Clicking on `Archive` or `Rules` in the top bar navigation set the selected view state, but there was no corresponding UI render block in `App.jsx`, rendering a blank main screen.
**Fix:** Created beautifully formatted executive dashboard widgets in `App.jsx`:
- **Archive view**: Connects to the processed database list and filters for all elements marked as completed/done (`is_done === true` or `status === 'archived'`).
- **Rules view**: Displays a visual layout of our multi-stage deterministic routing filters (LinkedIn, Naukri, Quora, Marketing), complete with trigger conditions, stats of matched emails, and active bulk-action controls (`Archive All`, `Mute All`).

---

### 15. "Waiting / FYI" Section Completely Empty
**Problem:** Informational emails were categorized under `status = "processed"` or `status = "FYI_KNOWLEDGE"`. However, the frontend filter strictly checked for `!item.status` or `item.status === "FYI_KNOWLEDGE"` and rejected any automation matches, completely hiding standard emails from the folder.
**Fix:** Aligned filter rules in `App.jsx`: `WaitingFYI` now correctly includes all non-priority informational and default `processed` emails (`(!item.status || item.status === 'FYI_KNOWLEDGE' || item.status === 'processed')`), populating the view instantly.

---

### 16. Document Extraction Muted for PDFs
**Problem:** Two root issues prevented PDF parsing from succeeding:
1. The background worker ONLY fetched unread messages (`is:unread`). If a user sent a PDF email and it was already marked as read, it was ignored.
2. Silent KeyError in the ingest node: `src/email_reader.py` saved the Gmail attachment ID as `attachmentId` (CamelCase), but `src/brain.py` tried to fetch it as `attachment['attachment_id']` (snake_case). This raised a KeyError, causing PDF download requests to fail silently.
**Fix:**
- Updated the worker loop in `src/worker.py` to scavenge for both unread messages and any messages containing PDF attachments from the last 30 days (`has:attachment filename:pdf newer_than:30d`), ensuring any test files are caught immediately.
- Unified key access in `src/brain.py` to support both CamelCase and snake_case (`attachment.get('attachmentId') or attachment.get('attachment_id')`), eliminating KeyErrors and fully enabling invoice/resume parsing.

---

### 17. AI Briefing Section Overhaul
**Problem:** The original `AIBriefing` viewport rendered a simple, text-based text area with a generic background card. It did not reflect the premium, multi-column executive layout seen in the reference dashboard visual mockup.
**Fix:** Overhauled the viewport inside `frontend/src/App.jsx` to render an executive-grade dashboard:
- **Greeting Header**: Greeting (`Good morning, Laukik ☀️`) inside a light violet accent banner alongside an interactive date selector.
- **Metrics Row**: Dynamic card row for Action Items, Due Today, Overdue, and Invoices Due (summing total extracted amount from the active SQLite document dataset).
- **Three-Column Grid**: 
  - *Top Priorities*: Filters real action items dynamically (high priority first) with fallback mocks to ensure visual completeness.
  - *Today's Schedule*: Lists meetings categorized under `SCHEDULE` with custom avatars and time markers.
  - *Invoice Summary*: Draws a beautiful, dynamic SVG donut progress ring representing relative due amounts, displaying full billing detail cards.
- **AI Insights & Ask Pill**: Renders 4 horizontal summary cards alongside an interactive pill button (`Ask InBoxIQ anything...`) triggering the natural language query drawer.

---

## 🔮 What's Next (Planned)

| Feature | Description |
|---|---|
| **Phase 7 — Calendar Integration** | Actions Required that involve scheduling auto-create Google Calendar events |
| **Phase 9 — Model Fine-tuning** | Use `UserFeedback` table to improve classification accuracy |
| **Phase 10 — Multi-account** | Support multiple Gmail accounts in one dashboard |
| **Notifications** | Desktop notifications when high-priority email arrives |

---

*Document generated: May 18, 2026 — InBoxIQ v1.0 AI Work OS*

