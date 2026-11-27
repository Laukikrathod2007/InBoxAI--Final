# Risks

| Risk | Likelihood | Impact | Mitigation | Evidence |
|---|---|---|---|---|
| Path traversal reads secrets | was high | critical | resolve path, stay inside dist | tests/test_security.py |
| Cross-site page drives the local API | medium | high | Origin guard on writes, CORS allowlist, Host check | tests/test_origin_guard.py |
| Any local process can call the API | low | high | local token on all /api and automation routes; /api/session loopback-only | tests/test_auth_undo.py |
| Rules archive important mail | was high (33% on test set) | high | precision-first rules, assist default | eval/results, tests/test_rules_eval.py |
| LLM hides important mail | high (llama3: 34.4% false-archive on synthetic set) | high | LLM output never archives in assist mode; review queue | eval/results/llama3_local.md |
| Prompt injection in email text | medium | medium | drafts only, no auto-send; not tested | OPEN |
| Email text sent to Gemini | low | medium | key disabled in .env; only used if set; eval refuses cloud | eval/run_eval.py |
| Invented data stored as fact | was high | medium | empty result routes to REVIEW | tests/test_failure_modes.py |
| Lost mail after autonomous archive | low | medium | audit row after each real Gmail call; undo route; Gmail untouched if DB write fails | tests/test_auth_undo.py |
| Gmail token copied from disk | was medium | high | token moved to Windows Credential Manager (DPAPI); plain token.json deleted | src/token_store.py, tests/test_token_store.py |
| Mail sent by a stolen API token or a replayed/altered request | low | high | one-time send code bound to the exact message, 5 min expiry, single use | src/send_guard.py, tests/test_send_guard.py |
| Endpoint map exposed via /docs | was low | low | docs off unless INBOXIQ_DEBUG=1 | tests/test_hardening.py |
| Email text in logs | was medium | medium | model output logged as length + hash only | tests/test_hardening.py |
| Clickjacking / content sniffing | low | low | CSP, X-Frame-Options DENY, nosniff, no-referrer | tests/test_hardening.py |
| API flooding / send spam | low | medium | rate limits (send 5/min, API 300/min) | tests/test_hardening.py |
| Old mail piling up on disk | medium | medium | bodies erased after RETENTION_DAYS (30) | src/retention.py, tests/test_retention.py |
| Vulnerable dependency | unknown | varies | pip-audit and npm audit run in CI on every push | .github/workflows/ci.yml |
| Database copied from a lost laptop | low | high | OPEN for the user: turn on BitLocker | SECURITY.md |