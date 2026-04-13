import time
import json
import os
import logging
from .config import settings
from .email_reader import gmail_reader
from .pdf_parser import pdf_parser
from .extractor import extractor
from .sheet_updater import sheet_updater
from .reply_generator import reply_generator
from .models import WorkflowState
from .database import init_db, SessionLocal, EmailRecord, ExtractionRecord, SystemLog

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("InBoxIQ.Worker")

class Worker:
    def __init__(self):
        init_db()
        self.processed_ids_file = settings.PROCESSED_EMAILS_FILE
        self.processed_ids = self._load_processed_ids()

    def _load_processed_ids(self):
        """ Still check file for speed but results go to DB """
        if os.path.exists(self.processed_ids_file):
            with open(self.processed_ids_file, 'r') as f:
                return set(json.load(f))
        return set()

    def _save_processed_ids(self):
        with open(self.processed_ids_file, 'w') as f:
            json.dump(list(self.processed_ids), f)

    def _log_to_db(self, level, message):
        db = SessionLocal()
        try:
            log = SystemLog(level=level, message=message)
            db.add(log)
            db.commit()
        finally:
            db.close()

    def process_cycle(self):
        """ Single cycle of checking and processing emails """
        logger.info("Starting processing cycle...")
        emails = gmail_reader.fetch_unread_emails_with_pdfs()
        
        if not emails:
            logger.info("No new unread emails with PDFs found.")
            return

        for email_ref in emails:
            email_id = email_ref['id']
            if email_id in self.processed_ids:
                continue

            try:
                logger.info(f"Processing email: {email_id}")
                self._process_email(email_id)
                self.processed_ids.add(email_id)
                self._save_processed_ids()
                logger.info(f"Successfully processed email: {email_id}")
            except Exception as e:
                logger.error(f"Failed to process email {email_id}: {str(e)}")
                self._log_to_db("ERROR", f"Failed to process email {email_id}: {str(e)}")

    def _process_email(self, email_id):
        # 1. Get Details
        details = gmail_reader.get_email_details(email_id)
        if not details: return

        # 2. Extract PDF text
        pdf_text = ""
        for part in self._get_parts(details['payload']):
            if part.get('filename', '').lower().endswith('.pdf'):
                pdf_bytes = gmail_reader.download_pdf_attachment(email_id, part)
                if pdf_bytes:
                    pdf_text += pdf_parser.extract_text(pdf_bytes) + "\n"

        if not pdf_text:
            logger.warning("No PDF text extracted.")
            return

        # 3. AI Extraction
        extracted_data = extractor.extract(pdf_text)
        logger.info(f"Extracted data: {extracted_data.model_dump()}")

        # 4. Save to Database
        db = SessionLocal()
        try:
            email_rec = EmailRecord(
                id=email_id, 
                sender=details['sender'], 
                subject=details['subject']
            )
            ext_rec = ExtractionRecord(
                email_id=email_id,
                name=extracted_data.name,
                doc_date=extracted_data.date,
                document_type=extracted_data.document_type,
                important_fields=extracted_data.important_fields
            )
            db.add(email_rec)
            db.add(ext_rec)
            db.commit()
        finally:
            db.close()

        # 5. Update Sheet
        sheet_updater.append_row(extracted_data.model_dump())

        # 5. Generate Reply & Draft
        reply_body = reply_generator.generate_reply(
            extracted_data.model_dump(), 
            details['sender'], 
            details['subject']
        )
        
        draft_id = gmail_reader.create_draft(
            details['sender'],
            f"Re: {details['subject']}",
            reply_body
        )
        logger.info(f"Created draft: {draft_id}")

    def _get_parts(self, payload):
        parts = []
        if 'parts' in payload:
            for part in payload['parts']:
                parts.extend(self._get_parts(part))
        else:
            parts.append(payload)
        return parts

    def run_forever(self):
        while True:
            try:
                self.process_cycle()
            except Exception as e:
                logger.error(f"Cycle Error: {str(e)}")
            
            logger.info(f"Sleeping for {settings.POLLING_INTERVAL_SECONDS} seconds...")
            time.sleep(settings.POLLING_INTERVAL_SECONDS)

if __name__ == "__main__":
    worker = Worker()
    worker.run_forever()
