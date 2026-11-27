# Security

InBoxIQ holds access to a Gmail account, so it is built to keep that access on one machine and limit what can go wrong.

## Threat model
- **In scope:** other devices on the network, websites open in your browser, other programs on your computer, malicious email content (prompt injection), leaks through files, logs or git, and mistakes by the automation.
- **Out of scope:** an attacker with full control of your logged-in Windows account. That attacker can read anything you can.

## Controls

| Area | Control | Evidence |
|---|---|---|
| Network | `run_app.py` binds to 127.0.0.1 by default; Host header allowlist blocks DNS rebinding. (The demo Docker image binds 0.0.0.0 on purpose; it holds only synthetic mail.) | `run_app.py`, `src/main.py`, `tests/test_origin_guard.py` |
| Access | Local API token on every `/api` and automation route, except `/health` and `/api/session`. The token is handed only to loopback clients (not when `INBOXIQ_PUBLIC_DEMO=1`, which only the demo image sets). | `src/auth.py`, `tests/test_auth_undo.py` |
| Browser | CORS allowlist, cross-site write blocking (checked before rate limiting), CSP, X-Frame-Options DENY, nosniff, no-referrer | `src/security.py`, `tests/test_hardening.py`, `tests/test_send_guard.py` |
| Files | Path traversal blocked on the static route | `tests/test_security.py` |
| Gmail token | Stored in Windows Credential Manager (DPAPI, tied to your Windows login) when available. Falls back to `token.json` (owner-only) if no vault exists or a vault write cannot be verified, so the login is never lost. A network error never deletes the login; only a revoked grant does. | `src/token_store.py`, `tests/test_token_store.py` (fake vault; the real Credential Manager was checked by hand) |
| Sending mail | Confirm-before-send: a one-time code bound to recipient, subject, body and thread; 5-minute expiry; single use. Stops replays and drafts changed after review. It does **not** stop a caller who already has the API token. | `src/send_guard.py`, `tests/test_send_guard.py` |
| Abuse | Rate limits: send 5/min (confirm has its own bucket), drafts and chat 20/min, API 300/min. Only the send limit has a test. | `src/security.py`, `tests/test_hardening.py` |
| Automation | Dry run by default; audit row after each Gmail call; undo; Gmail untouched if saving fails | `tests/test_autopilot_safety.py` |
| Prompt injection | Rules ignore instructions; low confidence goes to review; low importance never archives | `tests/test_compose_and_injection.py` |
| Privacy | Model output is never logged (length and hash only). No cloud model unless `GEMINI_API_KEY` is set; it is commented out in this install. | `src/llm_client.py`, `tests/test_hardening.py` |
| Retention | Full email bodies erased after 30 days (`RETENTION_DAYS`) while the worker runs. Subjects, senders, summaries, suggested replies and decisions are kept. | `src/retention.py`, `tests/test_retention.py` |
| Supply chain | `pip-audit` and `npm audit` (runtime deps, high severity) run in CI on every push | `.github/workflows/ci.yml` |
| Secrets in git | `.env`, tokens, credentials, databases and real-mail eval files are gitignored; full history checked by file name | `.gitignore` |
## Known limits
- **Scope `gmail.modify`.** It can read, label, archive and send. A read-only mode for assist mode is planned.
- **Database is not encrypted by the app.** Turn on BitLocker (below).
- **Single user.** Not designed to be hosted for several people.
- **Testing-mode Google app.** Logins expire about every 7 days.

## What you should do
1. **Turn on device encryption:** Windows Settings → Privacy & security → Device encryption (or BitLocker). This protects `inboxiq.db` if the laptop is lost.
2. **Keep `.env` and `gmail_credentials.json` private.** Never share or commit them.
3. **If you suspect a leak:** remove InBoxIQ at https://myaccount.google.com/permissions. Access stops immediately.

## Reporting a vulnerability
Open a GitHub issue without exploit details and ask for a private contact, or email the maintainer.
