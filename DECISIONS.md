# Decisions

## 2026-11-25: Fix path traversal in the SPA route
Context: `serve_frontend` joined the URL path onto `frontend/dist` without checking the result, so `/..%2f..%2fX` served files outside `dist` (reproduced by tests/test_security.py before the fix).
Options: (A) reject any path containing `..`, (B) resolve the path and require it to stay inside `dist`, (C) drop the catch-all.
Decision: B. It is the standard check and keeps client-side routing working.
Consequence: Symlinks inside `dist` that point outside are refused. Revisit if `dist` ever needs symlinks.

## 2026-11-25: Localhost bind, narrow CORS, autopilot defaults to `assist`
Context: The server listened on 0.0.0.0 with `allow_origins=["*"]` and no login, and autopilot defaulted to `autonomous` (archives real Gmail mail).
Options: (A) add a login now, (B) bind to localhost and narrow CORS, keep LAN access opt-in.
Decision: B for now. A login is planned (see ROADMAP in README) before any LAN or hosted use.
Consequence: Phone/LAN access needs `INBOXIQ_HOST=0.0.0.0`. Users who want auto-archive must set `AUTOPILOT_MODE=autonomous` explicitly.

## 2026-11-25: Fix `/api/overrides` and a misleading button
Context: The route built `UserFeedback` with columns that do not exist, so Archive, Mute and Approve returned 500. "Approve" also said the draft was sent when nothing was sent.
Decision: Write one feedback row per changed field using the real columns, return 404 for unknown emails, and make the toast truthful.
Consequence: Feedback rows now accumulate and can feed later evaluation. A real "send approved draft" action is not built yet.

## 2026-11-25: Dockerfile no longer bakes in secrets
Context: `COPY .env` and `COPY gmail_credentials.json` put secrets in image layers, and the worker ran twice.
Decision: Mount secrets at run time, run one uvicorn process, use port 8001 like the rest of the code.
Consequence: Docker is still not a full path: first-time Gmail OAuth needs a browser on the host.
