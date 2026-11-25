# Runbook

Run (local): `pip install -r requirements.txt`, build UI (`cd frontend && npm ci && npm run build`), then `python run_app.py`.
Check health: `GET http://127.0.0.1:8001/health` -> `{"status":"healthy","worker":{...}}`. Latency: `GET /api/metrics`.
Run tests: `pytest -q` (25+ tests, no network). Score rules: `python -m eval.run_eval --name rules`.

If errors rise: look at `GET /api/logs` and the console. Audit of Gmail actions: rows in `system_logs` with component `autopilot`.

If a dependency is down
- Ollama down, no Gemini key: analyses are empty, mail goes to REVIEW, nothing is archived. Start Ollama and click "Run Processing Now".
- Ollama down, Gemini key set: prompts go to Gemini (email text leaves the machine). Remove the key for strict local use.
- Gmail token expired: the worker asks for OAuth in a browser. Run the app interactively once to renew `token.json`.

Top failures
1. Wrongly archived mail: set `AUTOPILOT_MODE=assist`. Find affected rows in `system_logs` (`EXECUTED archive`), then remove the Gmail label/INBOX state by hand in Gmail. Automatic undo is not built.
2. Empty UI: `frontend/dist` is missing. Build it.
3. All emails go to REVIEW: model not reachable; check `OLLAMA_BASE_URL`.

Rollback: `git revert <commit>`; the database is additive (ALTER TABLE ADD COLUMN only). Back up `inboxiq.db` before upgrades.
