import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from .config import settings

logger = logging.getLogger(__name__)

class SheetUpdater:
    def __init__(self):
        self.creds = self.authenticate()
        self.service = build('sheets', 'v4', credentials=self.creds)
        self.spreadsheet_id = None # Will find by name or assume user provides later
        self.sheet_name = settings.TARGET_SHEET_NAME

    def authenticate(self):
        """ authenticate with service account """
        return service_account.Credentials.from_service_account_file(
            settings.SHEETS_CREDENTIALS_FILE,
            scopes=[
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.metadata.readonly'
            ]
        )

    def find_spreadsheet_id(self):
        """ Find spreadsheet by name in the service account's drive """
        drive_service = build('drive', 'v3', credentials=self.creds)
        query = f"name = '{self.sheet_name}' and mimeType = 'application/vnd.google-apps.spreadsheet'"
        results = drive_service.files().list(q=query).execute()
        files = results.get('files', [])
        if not files:
            raise Exception(f"Spreadsheet '{self.sheet_name}' not found. Please ensure it's created and shared with {self.creds.service_account_email}")
        return files[0]['id']

    def get_spreadsheet_url(self):
        """ Return the direct URL of the current spreadsheet """
        if not self.spreadsheet_id:
            try:
                self.spreadsheet_id = self.find_spreadsheet_id()
            except:
                return None
        return f"https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}/edit"

    def append_row(self, data_dict):
        """ Append a row of data to the target sheet """
        if not self.spreadsheet_id:
            self.spreadsheet_id = self.find_spreadsheet_id()

        # Simple conversion of dict to list: [name, date, type, important_fields_str]
        values = [
            data_dict.get('name', 'N/A'),
            data_dict.get('date', 'N/A'),
            data_dict.get('document_type', 'N/A'),
            str(data_dict.get('important_fields', {}))
        ]
        
        body = {
            'values': [values]
        }
        
        try:
            result = self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=f"A1",
                valueInputOption="RAW",
                body=body
            ).execute()
            logger.info(f"Appended row: {result.get('updates').get('updatedRange')}")
            return True
        except Exception as e:
            logger.error(f"Error appending to sheet: {str(e)}")
            return False

sheet_updater = SheetUpdater()
