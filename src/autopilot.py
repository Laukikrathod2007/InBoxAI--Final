from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Tuple

from .config import (
    AUTOPILOT_ENABLED,
    AUTOPILOT_MODE,
    AUTOPILOT_AUTO_ARCHIVE_NOISE,
    AUTOPILOT_MARK_READ_ON_ARCHIVE,
    AUTOPILOT_APPLY_LABELS,
    AUTOPILOT_AUTO_SEND_REPLIES,
    AUTOPILOT_SAFE_SEND_DOMAINS,
)


@dataclass(frozen=True)
class AutopilotConfig:
    enabled: bool
    mode: str  # off | assist | autonomous
    auto_archive_noise: bool
    mark_read_on_archive: bool
    apply_labels: bool
    auto_send_replies: bool
    safe_send_domains: Tuple[str, ...]


def get_autopilot_config() -> AutopilotConfig:
    domains = tuple(
        d.strip().lower()
        for d in (AUTOPILOT_SAFE_SEND_DOMAINS or "").split(",")
        if d.strip()
    )
    mode = (AUTOPILOT_MODE or "assist").strip().lower()
    if mode not in ("off", "assist", "autonomous"):
        mode = "assist"
    return AutopilotConfig(
        enabled=bool(AUTOPILOT_ENABLED) and mode != "off",
        mode=mode,
        auto_archive_noise=bool(AUTOPILOT_AUTO_ARCHIVE_NOISE),
        mark_read_on_archive=bool(AUTOPILOT_MARK_READ_ON_ARCHIVE),
        apply_labels=bool(AUTOPILOT_APPLY_LABELS),
        auto_send_replies=bool(AUTOPILOT_AUTO_SEND_REPLIES),
        safe_send_domains=domains,
    )


def should_auto_archive(decision: str, is_noise: bool, category: str) -> bool:
    cfg = get_autopilot_config()
    if not cfg.enabled or cfg.mode != "autonomous":
        return False
    if not cfg.auto_archive_noise:
        return False
    if is_noise:
        return True
    if (category or "").upper() in ("PROMOTION", "NEWSLETTER", "SPAM"):
        return True
    if (decision or "").upper() == "IGNORE":
        return True
    return False


def label_for_category(category: str) -> Optional[str]:
    if not category:
        return None
    c = category.upper()
    mapping: Dict[str, str] = {
        "MEETING_REQUEST": "InBoxIQ/Meeting",
        "TASK_ASSIGNED": "InBoxIQ/Task",
        "HIRING_COMMUNICATION": "InBoxIQ/Hiring",
        "FINANCE_TRANSACTION": "InBoxIQ/Finance",
        "APPROVAL_REQUEST": "InBoxIQ/Approval",
        "INFORMATION_UPDATE": "InBoxIQ/Update",
        "NEWSLETTER": "InBoxIQ/Newsletter",
        "PROMOTION": "InBoxIQ/Promotion",
        "PERSONAL": "InBoxIQ/Personal",
        "SPAM": "InBoxIQ/Spam",
        "UNCERTAIN": "InBoxIQ/Uncertain",
    }
    return mapping.get(c)


def can_auto_send(to_email: str) -> bool:
    cfg = get_autopilot_config()
    if not cfg.enabled or cfg.mode != "autonomous":
        return False
    if not cfg.auto_send_replies:
        return False
    if not cfg.safe_send_domains:
        return False
    if not to_email or "@" not in to_email:
        return False
    domain = to_email.split("@", 1)[1].strip().lower()
    return domain in cfg.safe_send_domains

