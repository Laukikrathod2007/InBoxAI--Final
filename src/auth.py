"""Local API token. Protects every write action and email-content read.

The token is created on first start in `.inboxiq_token` (gitignored, 32 bytes
random) or taken from INBOXIQ_API_TOKEN. The web UI receives it from the
same-origin `/api/session` endpoint, which only answers loopback clients.
"""
import os
import secrets
from pathlib import Path

from fastapi import Header, HTTPException, Request

TOKEN_FILE = Path(os.getenv("INBOXIQ_TOKEN_FILE", ".inboxiq_token"))


def get_token() -> str:
    env = os.getenv("INBOXIQ_API_TOKEN", "").strip()
    if env:
        return env
    if TOKEN_FILE.exists():
        tok = TOKEN_FILE.read_text().strip()
        if len(tok) >= 20:
            return tok
    # Missing or too short (e.g. empty file): create a fresh one, owner-only.
    tok = secrets.token_urlsafe(32)
    fd = os.open(str(TOKEN_FILE), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        f.write(tok)
    return tok


def require_token(x_inboxiq_token: str = Header(default="")):
    expected = get_token()
    if not expected or not secrets.compare_digest(x_inboxiq_token.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Missing or invalid API token")


LOOPBACK = {"127.0.0.1", "::1", "localhost"} | \
    {h for h in os.getenv("INBOXIQ_EXTRA_LOOPBACK", "").split(",") if h}


def is_loopback(request: Request) -> bool:
    host = request.client.host if request.client else ""
    return host in LOOPBACK
