import os
import base64
import logging
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from .config import settings

logger = logging.getLogger(__name__)

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

import threading
class GmailReader:
    def __init__(self):
        self._creds = None
        self._thread_local = threading.local()
        self._labels_cache = None

    @property
    def creds(self):
        if self._creds is None:
            self._creds = self.authenticate()
        return self._creds

    @property
    def service(self):
        from googleapiclient.discovery import build
        if not hasattr(self._thread_local, 'service'):
            self._thread_local.service = build('gmail', 'v1', credentials=self.creds, cache_discovery=False)
        return self._thread_local.service

    def authenticate(self):
        """
        Authenticate using OAuth 2.0.
        Returns credentials object.
        """
        creds = None
        # The file token.json stores the user's access and refresh tokens.
        if os.path.exists(settings.GMAIL_TOKEN_FILE):
            try:
                creds = Credentials.from_authorized_user_file(settings.GMAIL_TOKEN_FILE, SCOPES)
            except Exception as e:
                logger.error(f"Error loading credentials from token file: {e}")
                creds = None
        
        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    logger.info("Attempting to refresh Gmail token...")
                    creds.refresh(Request())
                except Exception as e:
                    logger.error(f"Token refresh failed: {e}. Re-authenticating...")
                    if os.path.exists(settings.GMAIL_TOKEN_FILE):
                        try:
                            os.remove(settings.GMAIL_TOKEN_FILE)
                        except Exception:
                            pass
                    creds = None
            
            if not creds:
                logger.info("Starting Gmail OAuth flow...")
                flow = InstalledAppFlow.from_client_secrets_file(
                    settings.GMAIL_CLIENT_CONFIG, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            try:
                with open(settings.GMAIL_TOKEN_FILE, 'w') as token:
                    token.write(creds.to_json())
                logger.info("Gmail credentials saved successfully.")
            except Exception as e:
                logger.error(f"Failed to save credentials token: {e}")
        
        return creds

    def fetch_unread_emails(self, max_results=100):
        """
        Fetch unread emails from the last 7 days.
        """
        query = "is:unread newer_than:7d"
        try:
            results = self.service.users().messages().list(userId='me', q=query, maxResults=max_results).execute()
            messages = results.get('messages', [])
            return messages
        except Exception as e:
            logger.error(f"Error fetching emails: {str(e)}")
            return []

    def fetch_pdf_emails(self, max_results=100):
        """
        Fetch emails with PDF attachments from the last 30 days.
        """
        query = "has:attachment filename:pdf newer_than:30d"
        try:
            results = self.service.users().messages().list(userId='me', q=query, maxResults=max_results).execute()
            messages = results.get('messages', [])
            return messages
        except Exception as e:
            logger.error(f"Error fetching PDF emails: {str(e)}")
            return []

    def get_thread(self, thread_id):
        """
        Fetch full thread details.
        """
        try:
            thread = self.service.users().threads().get(userId='me', id=thread_id).execute()
            return thread
        except Exception as e:
            logger.error(f"Error getting thread {thread_id}: {str(e)}")
            return None

    def check_if_user_replied(self, thread_id):
        """
        Check if the last message in the thread is from the user (Sent folder).
        """
        try:
            thread = self.get_thread(thread_id)
            if not thread: return False
            
            messages = thread.get('messages', [])
            if not messages: return False
            
            # Use a query to check if there are any messages in this thread in the SENT folder
            # or simply check the last message's labels/sender.
            last_msg = messages[-1]
            labels = last_msg.get('labelIds', [])
            
            if 'SENT' in labels:
                return True
            
            # Backup check: compare sender with 'me'
            headers = last_msg.get('payload', {}).get('headers', [])
            sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), "")
            # Note: 'me' is a special alias in Gmail API
            if "me" in sender.lower(): # Basic check, in reality we might want the actual user email
                return True
                
            return False
        except Exception as e:
            logger.error(f"Error checking reply status for thread {thread_id}: {str(e)}")
            return False

    def get_email_details(self, message_id):
        """
        Get message details including headers and parts.
        """
        try:
            msg = self.service.users().messages().get(userId='me', id=message_id).execute()
            headers = msg['payload']['headers']
            
            subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), "No Subject")
            sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), "Unknown")
            date = next((h['value'] for h in headers if h['name'].lower() == 'date'), "Unknown")
            thread_id = msg.get('threadId')
            
            # Extract body text
            body = self._extract_body(msg['payload'])
            
            # Discover attachments from payload
            attachments = self._extract_attachments(msg['payload'])
            
            return {
                "id": message_id,
                "thread_id": thread_id,
                "subject": subject,
                "sender": sender,
                "date": date,
                "body": body,
                "attachments": attachments,
                "payload": msg['payload']
            }
        except Exception as e:
            logger.error(f"Error getting email details: {str(e)}")
            return None

    def _extract_body(self, payload):
        """ Helper to recursively extract text from email payload """
        body = ""
        if 'parts' in payload:
            for part in payload['parts']:
                body += self._extract_body(part)
        else:
            if payload.get('mimeType') == 'text/plain':
                data = payload.get('body', {}).get('data')
                if data:
                    body += base64.urlsafe_b64decode(data.encode('UTF-8')).decode('UTF-8')
        return body

    def download_pdf_attachment(self, message_id, part):
        """
        Download PDF attachment from a message part.
        """
        try:
            attachment_id = part['body'].get('attachmentId')
            if not attachment_id:
                return None
            
            attachment = self.service.users().messages().attachments().get(
                userId='me', messageId=message_id, id=attachment_id).execute()
            
            data = attachment.get('data')
            if not data:
                return None
            file_data = base64.urlsafe_b64decode(data.encode('UTF-8'))
            return file_data
        except Exception as e:
            logger.error(f"Error downloading attachment: {str(e)}")
            return None

    def download_attachment(self, message_id, attachment_id):
        """
        Download a Gmail attachment by its id.
        """
        try:
            attachment = self.service.users().messages().attachments().get(
                userId='me', messageId=message_id, id=attachment_id
            ).execute()
            data = attachment.get('data')
            if not data:
                return None
            return base64.urlsafe_b64decode(data.encode('UTF-8'))
        except Exception as e:
            logger.error(f"Error downloading attachment: {str(e)}")
            return None

    def _extract_attachments(self, payload):
        attachments = []
        if not payload:
            return attachments

        if payload.get('parts'):
            for part in payload['parts']:
                if part.get('filename'):
                    attachment_id = part.get('body', {}).get('attachmentId')
                    mime_type = part.get('mimeType')
                    filename = part.get('filename')
                    size = part.get('body', {}).get('size', 0)
                    attachments.append({
                        'filename': filename,
                        'mimeType': mime_type,
                        'size': size,
                        'attachmentId': attachment_id,
                        'partId': part.get('partId'),
                    })

                # Recurse into nested parts
                attachments.extend(self._extract_attachments(part))

        return attachments

    def send_email(self, recipient: str, subject: str, body: str, thread_id: str = None):
        """
        Send an email or a reply.
        """
        try:
            message_body = self._create_raw_email(recipient, subject, body, thread_id)
            message = {'raw': message_body}
            if thread_id:
                message['threadId'] = thread_id
            
            sent_msg = self.service.users().messages().send(userId='me', body=message).execute()
            logger.info(f"Email sent successfully. ID: {sent_msg['id']}")
            return sent_msg['id']
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return None

    # ── Gmail Actions (Autopilot primitives) ────────────────────────────────

    def _get_labels(self):
        try:
            if self._labels_cache is None:
                res = self.service.users().labels().list(userId="me").execute()
                self._labels_cache = res.get("labels", [])
            return self._labels_cache
        except Exception as e:
            logger.error(f"Error listing labels: {str(e)}")
            return []

    def _get_label_id_by_name(self, name: str):
        name_norm = (name or "").strip().lower()
        for lbl in self._get_labels():
            if (lbl.get("name", "").strip().lower()) == name_norm:
                return lbl.get("id")
        return None

    def ensure_label(self, name: str):
        """Return labelId; create label if missing."""
        try:
            label_id = self._get_label_id_by_name(name)
            if label_id:
                return label_id
            created = (
                self.service.users()
                .labels()
                .create(userId="me", body={"name": name, "labelListVisibility": "labelShow", "messageListVisibility": "show"})
                .execute()
            )
            # bust cache
            self._labels_cache = None
            return created.get("id")
        except Exception as e:
            logger.error(f"Error ensuring label '{name}': {str(e)}")
            return None

    def modify_message_labels(self, message_id: str, add_label_ids=None, remove_label_ids=None):
        add_label_ids = add_label_ids or []
        remove_label_ids = remove_label_ids or []
        try:
            self.service.users().messages().modify(
                userId="me",
                id=message_id,
                body={"addLabelIds": add_label_ids, "removeLabelIds": remove_label_ids},
            ).execute()
            return True
        except Exception as e:
            logger.error(f"Error modifying labels for message {message_id}: {str(e)}")
            return False

    def mark_read(self, message_id: str):
        return self.modify_message_labels(message_id, remove_label_ids=["UNREAD"])

    def archive(self, message_id: str):
        # Removing INBOX archives the message.
        return self.modify_message_labels(message_id, remove_label_ids=["INBOX"])

    def apply_label_by_name(self, message_id: str, label_name: str):
        label_id = self.ensure_label(label_name)
        if not label_id:
            return False
        return self.modify_message_labels(message_id, add_label_ids=[label_id])

    def _create_raw_email(self, to, subject, body, thread_id=None):
        import email.message
        msg = email.message.EmailMessage()
        msg.set_content(body)
        msg['To'] = to
        msg['Subject'] = subject
        
        # If it's a reply, we should ideally set In-Reply-To and References headers
        # but for simple Gmail API threading, setting threadId in the send body is often enough.
        # However, let's add Basic headers if we have a thread context.
        return base64.urlsafe_b64encode(msg.as_bytes()).decode()

gmail_reader = GmailReader()
