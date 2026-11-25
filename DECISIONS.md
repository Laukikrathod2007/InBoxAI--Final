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

## 2026-11-25: Local API token instead of a user login
Context: Any program or page reaching 127.0.0.1:8001 could read mail and send email.
Options: (A) username/password with sessions, (B) OAuth via Google, (C) a random local token handed to the same-origin UI.
Decision: C. One user on one machine; it blocks other local processes and web pages without a login screen. An empty token file regenerates the token (found by review).
Consequence: Not suitable for hosting or several users. Revisit with (B) if this ever runs on a server.

## 2026-11-25: Undo and truthful audit for autopilot
Context: Autonomous archive had no undo, and the audit could say EXECUTED for a failed Gmail call.
Decision: Write the audit row after the Gmail call with the real result; skip Gmail entirely if the DB write failed; add an undo route that restores INBOX and UNREAD.
Consequence: Labels added by autopilot are not undone yet.

## 2026-11-26: Rules v3, cut to what held up on real mail
Context: On 50 hand-labelled emails from my own inbox, rules v2 (tuned on the synthetic set) hid 30.3% of important mail. The original app hid 57.6% of important mail and 66.7% of needs-action mail. Sender keywords (newsletter, digest, marketing, jobs-noreply) and "unsubscribe + noreply" caused every false hide; promo subjects ("% off") caused none.
Options: (A) keep v2 and accept 30% false-archive, (B) add sender allowlists per person, (C) hide only on promo subjects and send the rest to the LLM/review.
Decision: C. Hiding wanted mail costs much more than reading one extra promotion.
Consequence: Noise hidden by rules fell to 17.6% on real mail (38.3% synthetic), at 0% false-archive on both. Lesson: a synthetic test set tuned alongside the rules gave 0% and was wrong on real data. Revisit with more labelled real mail and a per-sender allowlist learned from user overrides.
