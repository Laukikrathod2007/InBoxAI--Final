import asyncio
import logging
import threading
import time
from datetime import datetime
from typing import Any, Dict, Optional
from .config import settings
from .email_reader import gmail_reader
from .database import init_db, SessionLocal, ProcessedEmail
from .brain import brain

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("InBoxIQ.Worker")

class Worker:
    def __init__(self):
        # Ensure DB is initialized before any cycles start.
        init_db()
        self._cycle_lock = threading.Lock()
        self._stop_event = threading.Event()
        self._loop_thread: Optional[threading.Thread] = None
        self._is_running = False
        self.last_cycle_at: Optional[str] = None
        self.last_cycle_result: Optional[Dict[str, Any]] = None
        self.total_cycles = 0

    def process_cycle(self):
        """Run exactly one safe processing cycle."""
        if not self._cycle_lock.acquire(blocking=False):
            logger.info("Skipping cycle because another cycle is still running.")
            return {"status": "skipped", "reason": "cycle_already_running"}

        self._is_running = True
        start = time.time()
        result: Dict[str, Any] = {
            "status": "success",
            "fetched": 0,
            "new_emails": 0,
            "processed": 0,
            "failed": 0,
        }

        logger.info("Checking for new emails...")
        try:
            unread_messages = gmail_reader.fetch_unread_emails(max_results=20)
            pdf_messages = gmail_reader.fetch_pdf_emails(max_results=20)
            
            # Combine both lists and remove duplicates preserving order
            all_messages = []
            seen_ids = set()
            for msg in unread_messages + pdf_messages:
                if msg["id"] not in seen_ids:
                    seen_ids.add(msg["id"])
                    all_messages.append(msg)
                    
            result["fetched"] = len(all_messages)
            if not all_messages:
                result["status"] = "idle"
                return result

            db = SessionLocal()
            new_emails = []
            try:
                for msg_ref in all_messages:
                    email_id = msg_ref["id"]
                    existing = (
                        db.query(ProcessedEmail)
                        .filter(ProcessedEmail.email_id == email_id)
                        .first()
                    )
                    if not existing:
                        new_emails.append(msg_ref)
            finally:
                db.close()

            result["new_emails"] = len(new_emails)
            if not new_emails:
                result["status"] = "idle"
                return result

            logger.info("Agents starting work on %s new signals...", len(new_emails))
            for msg_ref in new_emails:
                try:
                    if self._process_email(msg_ref["id"], msg_ref["threadId"]):
                        result["processed"] += 1
                    else:
                        result["failed"] += 1
                except Exception as e:
                    result["failed"] += 1
                    logger.error("Failed to process %s: %s", msg_ref["id"], e)

            if result["failed"] > 0:
                result["status"] = "partial_success"
            return result
        except Exception as e:
            logger.error("Cycle execution failed: %s", e)
            result["status"] = "error"
            result["error"] = str(e)
            return result
        finally:
            elapsed_ms = int((time.time() - start) * 1000)
            self.total_cycles += 1
            result["elapsed_ms"] = elapsed_ms
            self.last_cycle_at = datetime.utcnow().isoformat() + "Z"
            self.last_cycle_result = result
            self._is_running = False
            self._cycle_lock.release()

    def _process_email(self, email_id: str, thread_id: str) -> bool:
        db = SessionLocal()
        try:
            logger.info("Invoking Upgraded Engine for: %s", email_id)
            # The Brain handles: Clean -> Rule Filter -> Classify -> Decide -> Reply -> Store
            asyncio.run(brain.execute(email_id, thread_id))
            # Finalize Mark as Processed
            db.add(ProcessedEmail(email_id=email_id))
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            logger.error("Brain execution failed for %s: %s", email_id, str(e))
            return False
        finally:
            db.close()

    def run_forever(self):
        logger.info("InBoxIQ Worker started. Polling for emails...")
        while not self._stop_event.is_set():
            try:
                self.process_cycle()
            except Exception as e:
                logger.error("Cycle Error: %s", str(e))
            self._stop_event.wait(settings.POLLING_INTERVAL_SECONDS)

    def start_auto(self):
        """Start the autonomous polling loop in a daemon thread."""
        if self._loop_thread and self._loop_thread.is_alive():
            return False
        self._stop_event.clear()
        self._loop_thread = threading.Thread(target=self.run_forever, daemon=True)
        self._loop_thread.start()
        logger.info("Autonomous worker loop started.")
        return True

    def stop_auto(self):
        """Stop autonomous loop gracefully."""
        self._stop_event.set()
        if self._loop_thread and self._loop_thread.is_alive():
            self._loop_thread.join(timeout=5)
        logger.info("Autonomous worker loop stopped.")
        return True

    def get_status(self):
        """Runtime status for monitoring and UI."""
        return {
            "automation_active": bool(self._loop_thread and self._loop_thread.is_alive()),
            "cycle_in_progress": self._is_running,
            "polling_interval_seconds": settings.POLLING_INTERVAL_SECONDS,
            "last_cycle_at": self.last_cycle_at,
            "last_cycle_result": self.last_cycle_result,
            "total_cycles": self.total_cycles,
        }

if __name__ == "__main__":
    worker = Worker()
    worker.run_forever()
