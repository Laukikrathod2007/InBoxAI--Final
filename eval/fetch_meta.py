"""Read-only: fetch Gmail labels + a few headers for the labelled real emails.

  python -m eval.fetch_meta

Uses messages.get(format="metadata"), which returns no message body, and
messages.list on the Sent folder to see whether you have ever written to the
sender. Nothing in Gmail is changed. Output goes to eval/data/real_meta.json
(gitignored). Only totals are printed.
"""
import csv
import json
import re
import sys
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

D = Path(__file__).parent / "data"
HEADERS = ["From", "List-Unsubscribe", "List-Id", "Precedence", "Auto-Submitted"]


def _service():
    tok = Path("token.json")
    if not tok.exists():
        sys.exit("token.json not found. Run the app once to connect Gmail.")
    creds = Credentials.from_authorized_user_file(str(tok))
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())  # in memory only; token.json is not rewritten
        else:
            sys.exit("Gmail token is not valid. Run the app once to reconnect.")
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


def sender_address(from_header: str) -> str:
    m = re.search(r"<([^>]+)>", from_header or "")
    return (m.group(1) if m else (from_header or "")).strip().lower()


def main():
    ids = [r["id"] for r in csv.DictReader(open(D / "real_labels.csv", encoding="utf-8-sig"))]
    svc = _service()
    out, sent_cache = {}, {}
    for mid in ids:
        try:
            m = svc.users().messages().get(userId="me", id=mid, format="metadata",
                                           metadataHeaders=HEADERS).execute()
        except Exception:
            continue
        hdrs = {h["name"].lower(): h["value"] for h in m.get("payload", {}).get("headers", [])}
        addr = sender_address(hdrs.get("from", ""))
        if addr and addr not in sent_cache:
            res = svc.users().messages().list(userId="me", q=f"in:sent to:{addr}", maxResults=1).execute()
            sent_cache[addr] = bool(res.get("messages"))
        out[mid] = {
            "labels": m.get("labelIds", []),
            "has_list_unsubscribe": "list-unsubscribe" in hdrs,
            "has_list_id": "list-id" in hdrs,
            "precedence_bulk": hdrs.get("precedence", "").lower() in ("bulk", "list", "junk"),
            "auto_submitted": hdrs.get("auto-submitted", "no").lower() != "no",
            "user_wrote_to_sender": sent_cache.get(addr, False),
        }
    (D / "real_meta.json").write_text(json.dumps(out), encoding="utf-8")
    cats = {}
    for v in out.values():
        for lab in v["labels"]:
            if lab.startswith("CATEGORY_"):
                cats[lab] = cats.get(lab, 0) + 1
    print(f"fetched {len(out)}/{len(ids)}; categories {cats}; "
          f"list-unsubscribe {sum(v['has_list_unsubscribe'] for v in out.values())}; "
          f"you wrote to sender {sum(v['user_wrote_to_sender'] for v in out.values())}")


if __name__ == "__main__":
    main()
