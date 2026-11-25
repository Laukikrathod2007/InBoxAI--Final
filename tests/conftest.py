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
# TestClient uses Host "testserver" and client "testclient"; allow them in tests only.
os.environ["ALLOWED_HOSTS"] = "testserver"
os.environ["INBOXIQ_EXTRA_LOOPBACK"] = "testclient"
os.environ["INBOXIQ_TOKEN_FILE"] = str(SANDBOX / ".inboxiq_token")


import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _fresh_token_headers(request):
    """Give each test module the current token (one test rotates it on purpose)."""
    from src.auth import get_token
    mod = request.module
    if hasattr(mod, "H"):
        mod.H = {"X-InBoxIQ-Token": get_token()}
