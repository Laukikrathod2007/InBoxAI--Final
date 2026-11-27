"""Reconnect Gmail without starting the app or the worker.

  python scripts/gmail_login.py

Opens Google's sign-in page in your browser. You sign in there; this script
never sees your password. The new token is saved in the Windows Credential
Manager (falls back to token.json only if no credential vault exists).
"""
import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]
ROOT = Path(__file__).resolve().parent.parent
CLIENT = ROOT / "gmail_credentials.json"
TOKEN = ROOT / "token.json"

if not CLIENT.exists():
    sys.exit("gmail_credentials.json not found in the project folder.")

sys.path.insert(0, str(ROOT))
from src import token_store  # noqa: E402

flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT), SCOPES)
print("A browser window is opening. Sign in to Google and allow access.")
creds = flow.run_local_server(port=0, open_browser=True)
where = token_store.save(creds.to_json(), str(TOKEN))
print(f"Gmail connected. Login saved in the {where}.")
