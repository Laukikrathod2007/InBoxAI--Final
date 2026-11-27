from src.database import EmailRecord, SessionLocal, UserFeedback, init_db
from src.sender_memory import learned_noise, muted_senders, sender_key


def _reset():
    init_db()
    db = SessionLocal()
    db.query(UserFeedback).delete()
    db.query(EmailRecord).filter(EmailRecord.id.like("sm%")).delete(synchronize_session=False)
    db.commit()
    return db


def _mail(db, i, sender):
    db.add(EmailRecord(id=f"sm{i}", sender=sender, subject="s", status="FYI_KNOWLEDGE"))


def _feedback(db, i, value):
    db.add(UserFeedback(email_id=f"sm{i}", field="is_noise", original_value="x", new_value=str(value)))


def test_sender_key_normalises():
    assert sender_key("Deals <News@Shop.Example>") == "news@shop.example"


def test_two_mutes_make_a_sender_noise():
    db = _reset()
    for i in (1, 2):
        _mail(db, i, "Deals <news@shop.example>")
        _feedback(db, i, True)
    db.commit()
    assert "news@shop.example" in muted_senders(db)
    assert learned_noise("Other Name <news@shop.example>", db)["decision"] == "ARCHIVE"
    db.close()


def test_one_mute_is_not_enough():
    db = _reset()
    _mail(db, 3, "x@once.example")
    _feedback(db, 3, True)
    db.commit()
    assert learned_noise("x@once.example", db) is None
    db.close()


def test_unmute_cancels_learning():
    db = _reset()
    for i in (4, 5, 6):
        _mail(db, i, "boss@work.example")
    _feedback(db, 4, True)
    _feedback(db, 5, True)
    _feedback(db, 6, False)  # user said: this one was not noise
    db.commit()
    assert learned_noise("boss@work.example", db) is None
    db.close()
