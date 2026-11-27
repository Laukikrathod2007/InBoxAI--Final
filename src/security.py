"""Security middleware: browser hardening headers and a simple in-memory rate limit.

Single-user local app, so a per-client sliding window is enough. Limits are per
process and reset on restart.
"""
import os
import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Pyodide (demo only) is loaded from jsDelivr; fonts from Google.
CSP = (
    "default-src 'self'; "
    "script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com; "
    "img-src 'self' data:; "
    "connect-src 'self' https://cdn.jsdelivr.net; "
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
)

SECURITY_HEADERS = {
    "Content-Security-Policy": CSP,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}


class SecurityHeaders(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        for k, v in SECURITY_HEADERS.items():
            response.headers.setdefault(k, v)
        return response


# (path prefix, max requests, window seconds). First match wins.
LIMITS = [
    # Confirm gets its own bucket so it does not count against real sends.
    ("/api/send/confirm", 30, 60),
    ("/api/send", int(os.getenv("RATE_SEND_PER_MIN", "5")), 60),
    ("/api/compose-draft", 20, 60),
    ("/api/chat", 20, 60),
    ("/api/", int(os.getenv("RATE_API_PER_MIN", "300")), 60),
    ("/process-now", 10, 60),
]


class RateLimit(BaseHTTPMiddleware):
    _instances = []

    def __init__(self, app):
        super().__init__(app)
        self.hits = defaultdict(deque)
        RateLimit._instances.append(self)

    @classmethod
    def reset_all(cls):
        for inst in cls._instances:
            inst.hits.clear()

    async def dispatch(self, request, call_next):
        path = request.url.path
        rule = next((r for r in LIMITS if path.startswith(r[0])), None)
        if rule:
            prefix, limit, window = rule
            key = (request.client.host if request.client else "?", prefix)
            q, now = self.hits[key], time.monotonic()
            while q and now - q[0] > window:
                q.popleft()
            if len(q) >= limit:
                return JSONResponse({"detail": "Too many requests. Try again shortly."},
                                    status_code=429, headers={"Retry-After": str(window)})
            q.append(now)
        return await call_next(request)
