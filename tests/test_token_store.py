"""Token storage: vault preferred, plain file migrated and deleted."""
import importlib

import pytest


class FakeVault:
    def __init__(self):
        self.data = {}

    def get_password(self, s, a):
        return self.data.get((s, a))

    def set_password(self, s, a, v):
        self.data[(s, a)] = v

    def delete_password(self, s, a):
        self.data.pop((s, a), None)


@pytest.fixture
def store(monkeypatch):
    from src import token_store
    importlib.reload(token_store)
    vault = FakeVault()
    monkeypatch.setattr(token_store, "_keyring", lambda: vault)
    return token_store, vault


def test_plain_file_is_moved_into_vault_and_deleted(store, tmp_path):
    ts, vault = store
    f = tmp_path / "token.json"
    f.write_text('{"refresh_token": "x"}', encoding="utf-8")
    assert ts.load(str(f)) == '{"refresh_token": "x"}'
    assert not f.exists()
    assert vault.get_password(ts.SERVICE, ts.ACCOUNT) == '{"refresh_token": "x"}'


def test_save_goes_to_vault_not_disk(store, tmp_path):
    ts, vault = store
    f = tmp_path / "token.json"
    assert ts.save("secret", str(f)) == "credential vault"
    assert not f.exists()


def test_clear_removes_everything(store, tmp_path):
    ts, vault = store
    f = tmp_path / "token.json"
    ts.save("secret", str(f))
    ts.clear(str(f))
    assert ts.load(str(f)) is None


def test_file_fallback_when_no_vault(monkeypatch, tmp_path):
    from src import token_store as ts
    monkeypatch.setattr(ts, "_keyring", lambda: None)
    f = tmp_path / "token.json"
    assert ts.save("secret", str(f)) == "file"
    assert ts.load(str(f)) == "secret"


def test_failed_vault_write_falls_back_to_file(tmp_path, monkeypatch):
    """If the vault refuses the token (e.g. too large), the login must not be lost."""
    from src import token_store

    class BrokenVault:
        def set_password(self, *a):
            raise RuntimeError("blob too large")

        def get_password(self, *a):
            return None

    monkeypatch.setattr(token_store, "_keyring", lambda: BrokenVault())
    f = tmp_path / "token.json"
    assert token_store.save('{"refresh_token": "r"}', str(f)) == "file"
    assert f.read_text(encoding="utf-8") == '{"refresh_token": "r"}'
