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

class GmailReader:
    def __init__(self):
        self.creds = self.authenticate()
        self.service = build('gmail', 'v1', credentials=self.creds)

    def authenticate(self):
        """
        Authenticate using OAuth 2.0.
        Returns credentials object.
        """
        creds = None
        # The file token.json stores the user's access and refresh tokens.
        if os.path.exists(settings.GMAIL_TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(settings.GMAIL_TOKEN_FILE, SCOPES)
        
        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    settings.GMAIL_CLIENT_CONFIG, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open(settings.GMAIL_TOKEN_FILE, 'w') as token:
                token.write(creds.to_json())
        
        return creds

    def fetch_unread_emails_with_pdfs(self, max_results=10):
        """
        Fetch unread emails with PDF attachments.
        """
        query = "is:unread has:attachment filename:pdf"
        try:
            results = self.service.users().messages().list(userId='me', q=query, maxResults=max_results).execute()
            messages = results.get('messages', [])
            return messages
        except Exception as e:
            logger.error(f"Error fetching emails: {str(e)}")
            return []

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
            
            return {
                "id": message_id,
                "subject": subject,
                "sender": sender,
                "date": date,
                "payload": msg['payload']
            }
        except Exception as e:
            logger.error(f"Error getting email details: {str(e)}")
            return None

    def download_pdf_attachment(self, message_id, part):
        """
        Download PDF attachment from a message part.
        """
        try:
            attachment_id = part['body']['attachmentId']
            attachment = self.service.users().messages().attachments().get(
                userId='me', messageId=message_id, id=attachment_id).execute()
            
            data = attachment['data']
            file_data = base64.urlsafe_b64decode(data.encode('UTF-8'))
            return file_data
        except Exception as e:
            logger.error(f"Error downloading attachment: {str(e)}")
            return None

    def create_draft(self, to_email, subject, body_text):
        """
        Create a draft reply.
        """
        try:
            message = {
                'message': {
                    'raw': self._create_raw_email(to_email, subject, body_text)
                }
            }
            draft = self.service.users().drafts().create(userId='me', body=message).execute()
            return draft['id']
        except Exception as e:
            logger.error(f"Error creating draft: {str(e)}")
            return None

    def _create_raw_email(self, to, subject, body):
        import email.message
        msg = email.message.EmailMessage()
        msg.set_content(body)
        msg['To'] = to
        msg['Subject'] = subject
        return base64.urlsafe_b64encode(msg.as_bytes()).decode()

gmail_reader = GmailReader()
