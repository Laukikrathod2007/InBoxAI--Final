"""Run the dashboard on the synthetic mailbox. No Gmail, no LLM, no real data.

  python scripts/demo_server.py      # http://127.0.0.1:8002

Works in a temp folder, so it never touches inboxiq.db, .env or token.json.
"""
import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
work = Path(tempfile.mkdtemp(prefix="inboxiq_demo_"))
shutil.copytree(ROOT / "frontend" / "dist", work / "frontend" / "dist")
os.chdir(work)
sys.path.insert(0, str(ROOT))
os.environ.update({
    "GMAIL_TOKEN_FILE": str(work / "none.json"), "GMAIL_CLIENT_CONFIG": str(work / "none.json"),
    "GEMINI_API_KEY": "", "OLLAMA_BASE_URL": "http://127.0.0.1:9", "AUTOPILOT_MODE": "assist",
    "INBOXIQ_TOKEN_FILE": str(work / ".inboxiq_token"),
    "CORS_ORIGINS": "http://127.0.0.1:8002,http://localhost:8002",
})

from src import main  # noqa: E402
from src.brain import quick_rule_filter  # noqa: E402
from src.database import ActionItem, EmailRecord, SessionLocal, SystemLog, init_db  # noqa: E402

main.worker.start_auto = lambda: False  # never poll Gmail in the demo

init_db()
db = SessionLocal()
rows = [json.loads(x) for x in (ROOT / "eval/data/synthetic_mailbox.jsonl").read_text().splitlines() if x]
STATUS = {"needs_action": "TASK", "fyi": "FYI_KNOWLEDGE"}
now = datetime.utcnow()
for i, r in enumerate(rows[:80]):
    hidden = quick_rule_filter(r["sender"], r["subject"], r["body"], [], "") is not None
    status = "ARCHIVE" if hidden else STATUS.get(r["label"], "FYI_KNOWLEDGE")
    if r["hard"] and not hidden:
        status = "REVIEW"
    if "reply" in r["subject"].lower() or "approval" in r["subject"].lower():
        status = "REPLY"
    db.add(EmailRecord(id=r["id"], thread_id=r["id"], sender=r["sender"], subject=r["subject"],
                       content=r["body"], summary=r["body"][:140], status=status,
                       priority="high" if r["label"] == "needs_action" else "low",
                       received_at=now - timedelta(minutes=37 * i), latency=8 if hidden else 21000))
    if status == "REVIEW":
        db.add(ActionItem(email_id=r["id"], thread_id=r["id"], type="task", title=r["subject"],
                          description="Low confidence. Check before acting.", priority="high",
                          status="open", confidence=55))
    if hidden:
        db.add(SystemLog(level="INFO", component="autopilot", message="DRY_RUN archive",
                         details={"email_id": r["id"], "action": "archive", "detail": "", "executed": False}))
db.commit()
db.close()

if __name__ == "__main__":
    import uvicorn
    print("Demo running at http://127.0.0.1:8002  (synthetic data, Gmail untouched)")
    uvicorn.run(main.app, host="127.0.0.1", port=8002, log_level="warning")
