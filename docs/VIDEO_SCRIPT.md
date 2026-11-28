# InBoxIQ demo video: shooting script (about 90 seconds)

Goal: show that the app works and that you measured it. Record the real app with the local model. The public demo cannot show this.

## Before you record (10 min)
1. Use the **dummy Gmail account** for anything on screen. If you use the real account, blur senders and subjects when editing.
2. In `.env`, keep `AUTOPILOT_MODE=assist` for the real account. For the Undo shot, use the dummy account in autonomous mode (never the real one).
3. Start Ollama, then run `python run_app.py`. Open http://127.0.0.1:8001/#/app.
4. Browser zoom 110%, close other tabs, turn on Do Not Disturb.
5. Open these in tabs, in order: landing page, dashboard, README results table, the `#/try` demo.
6. Record the browser window only. Windows: **Win + Alt + R**, or OBS. 1080p, mic close to your mouth.
7. Sync once before recording so the dashboard already has mail. Cut any waiting time while the model thinks (10 to 20 s per email).

## Script

Say it in your own words. Short sentences. Put the key line of each shot on screen as a caption, because most people watch on mute.

### Shot 1. Hook (0:00 to 0:08). Landing page hero
**Say:** "I built an AI email assistant. The first version hid more than half of my important emails."
**Caption:** "My AI hid 57.6% of my important emails."

### Shot 2. The fix, in one line (0:08 to 0:18). Terminal, `ollama ps`
**Say:** "So I measured it, found the bugs, and rebuilt it. It runs on a local model on this laptop. No email goes to the cloud."
**Caption:** "Local model. Nothing leaves my laptop."

### Shot 3. Sync (0:18 to 0:35). Dashboard, click **Sync now**
**Say:** "New mail is read, cheap rules filter the obvious noise first, then the local model summarises each email and scores how much it needs me."
**Caption:** "Rules first. Local AI second."

### Shot 4. Needs you (0:35 to 0:48). **Needs you** page
**Say:** "When the model is unsure, the email goes here. It never hides mail on a guess."
**Caption:** "Unsure = it asks you. It never guesses."

### Shot 5. Hidden and dry run (0:48 to 1:00). **Hidden** page, then **Archive & activity**
**Say:** "Only clear promotions are hidden. By default it only suggests. Gmail is not touched until I switch it on."
**Caption:** "Default: suggest only. Gmail untouched."

### Shot 6. Undo (1:00 to 1:12). Dummy account, a DONE row, click **Undo**
**Say:** "If I let it act, every action is logged after Gmail confirms it, and I can undo it with one click."
**Caption:** "Every action is logged. One-click undo."

### Shot 7. Compose (1:12 to 1:22). **Compose**: type an intent, Write draft
**Say:** "It also drafts replies. I say what I want, the local model writes it, and I edit before anything is sent."
**Caption:** "It drafts. You send."

### Shot 8. The proof (1:22 to 1:35). README results table
**Say:** "I hand-labelled 50 real emails and tested it. Important mail wrongly hidden went from 57.6% to 0%. It's a small sample, and I say so in the README."
**Caption:** "57.6% to 0% wrongly hidden. 50 real emails, hand-labelled."

### Shot 9. Call to action (1:35 to 1:45). `#/try` page
**Say:** "You can try the rules in your browser, no sign-up. The link and the code are below."
**Caption:** "Try it in your browser. Link below."

## Tips
- Keep the voice plain and a bit slow. Do not read word for word; read it twice, then say it from memory.
- Cut every pause. A 75 to 90 second video is enough.
- Add captions in CapCut (auto captions, then fix the typos).
- First frame matters most: start on the hook caption, not on a logo.
- Export 1080p, MP4. Upload to YouTube as **Unlisted** and attach the file directly to LinkedIn (native video gets more reach than a link).
- Do not claim "production-ready". The 50-email sample is small. The honest limits are part of why people trust it.

## Numbers you can use (all measured)
- Important mail wrongly hidden: 57.6% to 0.0% (50 hand-labelled real emails).
- Noise still hidden: 17.6%.
- llama3.2:3b is about 2x faster than llama3 (p50 10.5 s vs 22.5 s).
- Default mode is dry run. Actions are logged and undoable.
