"""Score InBoxIQ on YOUR real mail. Nothing here is committed (paths are gitignored).

  python -m eval.real export    # writes eval/data/real_export.csv (id, sender, subject, app decision)
  # add a "label" column: noise | needs_action | fyi, save as eval/data/real_labels.csv
  python -m eval.real score     # prints only totals, never email content
"""
import csv
import sqlite3
import sys
from pathlib import Path

from eval.run_eval import score

D = Path(__file__).parent / "data"
HIDDEN = {"ARCHIVE", "IGNORE", "noise", "archived"}  # statuses that keep mail out of the action views


def export(n=50):
    c = sqlite3.connect("file:inboxiq.db?mode=ro", uri=True)  # read-only
    rows = c.execute("select id, sender, subject, status from emails order by received_at desc limit ?", (n,)).fetchall()
    with open(D / "real_export.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "sender", "subject", "app_decision", "label"])
        w.writerows([*r, ""] for r in rows)
    print(f"wrote {len(rows)} rows to {D / 'real_export.csv'}; fill the label column, save as real_labels.csv")


def score_real():
    labels = {r["id"]: r["label"].strip() for r in csv.DictReader(open(D / "real_labels.csv", encoding="utf-8"))
              if r.get("label", "").strip() in ("noise", "needs_action", "fyi")}
    c = sqlite3.connect("file:inboxiq.db?mode=ro", uri=True)
    rows, preds = [], []
    for eid, label in labels.items():
        hit = c.execute("select status from emails where id = ?", (eid,)).fetchone()
        if hit:
            rows.append({"label": label, "hard": False})
            preds.append(hit[0] in HIDDEN)
    print(f"labelled emails scored: {len(rows)}")
    print(score(rows, preds))


if __name__ == "__main__":
    {"export": export, "score": score_real}[sys.argv[1] if len(sys.argv) > 1 else "export"]()
