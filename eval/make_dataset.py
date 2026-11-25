"""Generate eval/data/synthetic_mailbox.jsonl: 150 labelled emails, seed 42.

All people, companies and domains are fictional (.example). Labels were written
together with the templates, so they are subjective. "hard" marks important mail
that looks like bulk mail (list footers, bot senders). That is where keyword rules fail.
"""
import json
import random
from pathlib import Path

rnd = random.Random(42)
NAMES = ["Priya Shah", "Marcus Lee", "Ana Silva", "Tom Becker", "Aisha Khan", "Leo Rossi"]
rows = []


def person():
    n = rnd.choice(NAMES)
    return f"{n} <{n.split()[0].lower()}@client.example>"


def add(label, sender, subject, body, hard=False):
    rows.append({"label": label, "hard": hard, "sender": sender, "subject": subject, "body": body})


# --- noise (60) ---
for _ in range(15):
    add("noise", "Shop Deals <newsletter@shopdeals.example>", f"{rnd.choice([10, 20, 30, 50])}% off your next order",
        "Big sale this week only. Shop now. Unsubscribe here.")
for _ in range(12):
    add("noise", "LinkedIn <jobs-noreply@linkedin.com>", f"{rnd.randint(3, 9)} new jobs for you",
        "Jobs picked for you. Manage email preferences or unsubscribe.")
for _ in range(10):
    add("noise", "Quora Digest <digest@quora.example>", "Top stories for you",
        "Questions you may like. Unsubscribe from this digest.")
for _ in range(8):
    add("noise", "Cloud Status <no-reply@status.example>", "Daily update: all systems normal", "No incidents today.")
for _ in range(8):
    add("noise", "Tool Co <hello@toolco.example>", f"New in ToolCo {rnd.randint(2, 9)}.{rnd.randint(0, 9)}",
        "What's new this month. To unsubscribe click the link below.")
for _ in range(7):  # noise without obvious keywords
    add("noise", "Brand X <store@brandx.example>", "Weekend picks chosen for you",
        "Fresh arrivals and bestsellers. Free shipping over $50.")

# --- needs_action (50) ---
for _ in range(10):
    add("needs_action", person(), rnd.choice(["Can you send the revised proposal by Friday?",
        "Need your approval on the budget", "Please review the attached draft"]),
        f"Hi, could you take care of this by {rnd.choice(['Friday', 'Monday', 'Wednesday'])}? Thanks.")
for i in range(10):
    add("needs_action", "Accounts <billing@vendor.example>", f"Invoice #{1000 + i} for {rnd.choice(['March', 'April', 'May'])}",
        "Please find the invoice attached. Payment is due in 14 days.")
for _ in range(10):
    add("needs_action", "Recruiter <hr@company.example>", f"Interview schedule for {rnd.choice(['Backend', 'Data', 'ML'])} role",
        "Please confirm one of these three slots for your interview.")
for _ in range(5):
    add("needs_action", "GitHub <notifications@github.com>", f"Review requested: PR #{rnd.randint(10, 99)}",
        "Priya requested your review on a pull request. View it on GitHub. Unsubscribe from notifications.", True)
for _ in range(5):
    add("needs_action", "Jira <jira@team.example>", f"PLAT-{rnd.randint(100, 999)} assigned to you",
        "A ticket was assigned to you. Due this sprint.", True)
for _ in range(4):
    add("needs_action", "Bank Security <alerts@bank.example>", "Security alert: new sign-in to your account",
        "We noticed a sign-in from a new device. If this was not you, secure your account now.", True)
for _ in range(3):
    add("needs_action", "Dana Cole <dana@partner.example>", "Contract draft for your signature",
        "Attached is the contract draft. Please sign by Thursday.\n\n--\nTo unsubscribe from this mailing list, click here.", True)
for _ in range(3):
    add("needs_action", "Payments <no-reply@payments.example>", "Payment failed for your subscription",
        "Your card was declined. Update your payment method to keep your account active.", True)

# --- fyi (40) ---
for i in range(12):
    add("fyi", person(), f"Weekly status: sprint {10 + i}", "Summary of what shipped this week. Nothing needed from you.")
for i in range(10):
    add("fyi", "Receipts <receipts@store.example>", f"Your receipt from CafeCo #{200 + i}", "Thanks for your purchase. Total: $12.40.")
for _ in range(8):
    add("fyi", person(), "Notes from today's call", "Sharing the notes for reference. No follow-up needed.")
for _ in range(5):
    add("fyi", "Ops Alerts <ops-alerts@team.example>", f"Deploy finished: api v2.{rnd.randint(1, 9)}",
        "The deploy completed successfully.", True)
for _ in range(5):
    add("fyi", person(), "Project update: milestone 2 shipped",
        "Milestone 2 is live.\n\nYou received this because you are on the project list. Unsubscribe from this list.", True)

rnd.shuffle(rows)
for i, r in enumerate(rows):
    r["id"] = f"s{i:03d}"

out = Path(__file__).parent / "data" / "synthetic_mailbox.jsonl"
out.parent.mkdir(exist_ok=True)
out.write_text("\n".join(json.dumps(r) for r in rows) + "\n", encoding="utf-8")
print(f"wrote {len(rows)} rows to {out}")
