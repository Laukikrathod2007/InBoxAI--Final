# Architecture

```
Gmail API (OAuth, gmail.modify)
   |  worker.py: poll every N s, lock, dedupe via ProcessedEmail
   v
LangGraph pipeline (brain.py)
 ingest -> rule_filter --(sure noise)--> store
              |
              v
        process_attachments (PDF text, extractor.py)
              -> classify_extract (LLM, JSON)
              -> decision_engine (confidence gate)
              -> generate_reply (draft only)
              -> store -> autopilot
   v
SQLite (inboxiq.db): emails, action_items, document_extractions,
                     decision_logs, user_feedback, system_logs (audit)
   v
FastAPI (main.py, api_routes.py) on 127.0.0.1:8001  -> React SPA (frontend/dist)
```

Data flow notes
- LLM order: local Ollama first, Gemini only if a key is set. If no model answers, the analysis is empty, confidence is 0, and the email goes to REVIEW. Nothing is invented.
- Autopilot: `assist` (default) writes DRY_RUN rows to `system_logs` and never calls Gmail. `autonomous` executes and writes EXECUTED rows.
- Rules (`quick_rule_filter`) only hide mail when very sure. Everything else goes to the LLM.
- Evaluation: `eval/` scores the rules (and optionally the local LLM) on a labelled synthetic mailbox.
