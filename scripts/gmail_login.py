"""Reconnect Gmail without starting the app or the worker.

  python scripts/gmail_login.py

Opens Google's sign-in page in your browser. You sign in there; this script
never sees your password. It saves the new token to token.json (gitignored).
An old, expired token is kept as token.expired.json (also gitignored).
"""
import shutil
import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]
ROOT = Path(__file__).resolve().parent.parent
CLIENT = ROOT / "gmail_credentials.json"
TOKEN = ROOT / "token.json"

if not CLIENT.exists():
    sys.exit("gmail_credentials.json not found in the project folder.")

if TOKEN.exists():
    shutil.copy2(TOKEN, ROOT / "token.expired.json")

flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT), SCOPES)
print("A browser window is opening. Sign in to Google and allow access.")
creds = flow.run_local_server(port=0, open_browser=True)
TOKEN.write_text(creds.to_json(), encoding="utf-8")
print("Gmail connected. token.json saved.")
