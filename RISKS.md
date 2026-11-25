# Risks

| Risk | Likelihood | Impact | Mitigation | Evidence |
|---|---|---|---|---|
| Path traversal reads secrets | was high | critical | resolve path, stay inside dist | tests/test_security.py |
| Cross-site page drives the local API | medium | high | Origin guard on writes, CORS allowlist, Host check | tests/test_origin_guard.py |
| Any local process can call the API (no login) | medium | high | OPEN: login/token not built yet | none |
| Rules archive important mail | was high (33% on test set) | high | precision-first rules, assist default | eval/results, tests/test_rules_eval.py |
| LLM hides important mail | high (llama3: 34.4% false-archive on synthetic set) | high | LLM output never archives in assist mode; review queue | eval/results/llama3_local.md |
| Prompt injection in email text | medium | medium | drafts only, no auto-send; not tested | OPEN |
| Email text sent to Gemini | medium | medium | only if key set; eval refuses cloud | eval/run_eval.py |
| Invented data stored as fact | was high | medium | empty result routes to REVIEW | tests/test_failure_modes.py |
| Lost undo after autonomous archive | medium | medium | audit log only; undo not built | OPEN |
