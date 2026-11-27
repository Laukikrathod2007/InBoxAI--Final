# 2-minute demo video: script

Goal: show the real app on real mail with the local model. The public demo cannot show this.

## Before you record (5 min)
1. In `.env`, keep `AUTOPILOT_MODE=assist`. Gmail will not be changed.
2. Start Ollama, then run `python run_app.py`. The dashboard opens at http://127.0.0.1:8001/#/app.
3. Turn on browser zoom 110% so text is readable.
4. Hide private data: use the **dummy Gmail account** (token.dummy.json), or blur sender names when editing.
5. Recorder: Windows **Win + Alt + R** (Xbox Game Bar), or OBS. Record the browser window only.

## Shot list

| Time | Show | Say (or caption) |
|---|---|---|
| 0:00–0:10 | Landing page hero | "InBoxIQ sorts Gmail with an AI model that runs on this laptop. No email goes to the cloud." |
| 0:10–0:25 | Terminal: `ollama ps` showing llama3 loaded | "The model is local. Here it is running." |
| 0:25–0:45 | Dashboard, click **Sync now**, wait for new mail | "New mail is read, filtered by rules, then the local model summarises and scores it." |
| 0:45–1:00 | **Needs you** page, open the review queue | "Anything the model is unsure about waits here. It never hides mail on a guess." |
| 1:00–1:15 | **Hidden** page | "Only clear promotions are hidden. In assist mode Gmail is untouched; it only logs this." |
| 1:15–1:30 | **Archive & activity**, the DRY RUN rows, then **Undo** on a DONE row (dummy account, autonomous mode) | "Every real action is logged after Gmail confirms it, and can be undone." |
| 1:30–1:45 | **Compose**: type an intent, Write draft, edit | "Compose: say what you want, the local model drafts it, you edit and send." |
| 1:45–2:00 | README results table on GitHub | "Measured on 50 hand-labelled real emails: important mail wrongly hidden went from 57.6% to 0%." |

## After
- Trim dead time while the model thinks (about 10 to 20 s per email).
- Upload to YouTube as **Unlisted** and add the link to the README and resume.
