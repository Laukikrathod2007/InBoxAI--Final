"""Confirm-before-send for outgoing mail.

The Compose window first asks for a one-time code bound to the exact
recipient, subject, body and thread. /api/send only sends if that code is
valid, unused, under 5 minutes old, and matches the message exactly.

What this protects against: replayed send requests, and a draft being changed
(by a bug or injected content) after it was confirmed. What it does NOT protect
against: a caller who already holds the local API token, because the same token
can request a code. The API token is the real access control.
"""
import hashlib
import hmac
import secrets
import threading
import time

TTL_SECONDS = 300
_pending: dict[str, tuple[str, float]] = {}
_lock = threading.Lock()


def _digest(recipient: str, subject: str, body: str, thread_id: str | None) -> str:
    msg = "\x1f".join([recipient.strip().lower(), subject, body, thread_id or ""]).encode("utf-8")
    return hashlib.sha256(msg).hexdigest()


def issue(recipient: str, subject: str, body: str, thread_id: str | None = None) -> str:
    code = secrets.token_urlsafe(24)
    with _lock:
        now = time.monotonic()
        for k in [k for k, (_, t) in _pending.items() if now - t > TTL_SECONDS]:
            del _pending[k]
        _pending[code] = (_digest(recipient, subject, body, thread_id), now)
    return code


def consume(code: str, recipient: str, subject: str, body: str, thread_id: str | None = None) -> bool:
    with _lock:
        entry = _pending.pop(code or "", None)  # one use only, even on failure
    if not entry:
        return False
    digest, issued = entry
    if time.monotonic() - issued > TTL_SECONDS:
        return False
    return hmac.compare_digest(digest, _digest(recipient, subject, body, thread_id))
