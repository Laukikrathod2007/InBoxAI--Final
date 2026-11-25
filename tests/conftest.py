"""Test setup. Runs the app inside a temp folder so tests never touch the real
inboxiq.db, .env, token.json or Gmail."""
import os
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

SANDBOX = Path(tempfile.mkdtemp(prefix="inboxiq_test_"))
(SANDBOX / "frontend" / "dist").mkdir(parents=True)
(SANDBOX / "frontend" / "dist" / "index.html").write_text("INDEX_PAGE")
(SANDBOX / "SECRET_PROBE.txt").write_text("SECRET_CONTENT")

# src.main reads os.getcwd() and the DB path at import time, so move first.
os.chdir(SANDBOX)
os.environ["GMAIL_TOKEN_FILE"] = str(SANDBOX / "no_token.json")
os.environ["GMAIL_CLIENT_CONFIG"] = str(SANDBOX / "no_credentials.json")
os.environ["GEMINI_API_KEY"] = ""
