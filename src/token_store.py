"""Gmail OAuth token storage in the OS credential vault.

On Windows this is the Credential Manager (DPAPI-encrypted, tied to your Windows
login), on macOS the Keychain, on Linux the Secret Service. If no vault is
available, or a vault write cannot be verified, it falls back to the token.json
file (owner-only permissions) so the login is never lost.

An existing token.json is moved into the vault on first load and deleted only
after the vault copy has been read back and matches.
"""
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)
SERVICE = "InBoxIQ"
ACCOUNT = os.getenv("INBOXIQ_TOKEN_ACCOUNT", "gmail-oauth")


def _keyring():
    if os.getenv("INBOXIQ_TOKEN_STORE", "keyring") == "file":
        return None
    try:
        import keyring
        from keyring.backends import fail
        kr = keyring.get_keyring()
        return None if isinstance(kr, fail.Keyring) else keyring
    except Exception:
        return None


def _vault_write(kr, value: str) -> bool:
    """Write to the vault and confirm by reading it back."""
    try:
        kr.set_password(SERVICE, ACCOUNT, value)
        return kr.get_password(SERVICE, ACCOUNT) == value
    except Exception as e:
        logger.warning(f"Credential vault write failed ({type(e).__name__}); using token file instead.")
        return False


def _file_write(value: str, file_path: str) -> None:
    fd = os.open(file_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(value)


def load(file_path: str) -> str | None:
    kr = _keyring()
    if kr:
        try:
            value = kr.get_password(SERVICE, ACCOUNT)
            if value:
                return value
        except Exception as e:
            logger.warning(f"Credential vault read failed ({type(e).__name__}); trying token file.")
    p = Path(file_path)
    if not p.exists():
        return None
    value = p.read_text(encoding="utf-8")
    if kr and _vault_write(kr, value):  # migrate, then remove the plain-text copy
        p.unlink(missing_ok=True)
        logger.info("Moved the Gmail token from token.json into the OS credential vault.")
    return value


def save(value: str, file_path: str) -> str:
    """Returns where the token ended up: 'credential vault' or 'file'."""
    kr = _keyring()
    if kr and _vault_write(kr, value):
        Path(file_path).unlink(missing_ok=True)
        return "credential vault"
    _file_write(value, file_path)
    return "file"


def clear(file_path: str) -> None:
    kr = _keyring()
    if kr:
        try:
            kr.delete_password(SERVICE, ACCOUNT)
        except Exception:
            pass
    Path(file_path).unlink(missing_ok=True)
