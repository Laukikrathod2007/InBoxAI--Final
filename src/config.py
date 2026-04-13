import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Gmail API
    GMAIL_CLIENT_CONFIG: str = "gmail_credentials.json"
    GMAIL_TOKEN_FILE: str = "token.json"
    
    # Google Sheets API
    SHEETS_CREDENTIALS_FILE: str = "sheets_credentials.json"
    TARGET_SHEET_NAME: str = "InBoxIQ_Data"
    
    # Ollama API
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    
    # Application settings
    POLLING_INTERVAL_SECONDS: int = 60
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"
    PROCESSED_EMAILS_FILE: str = "processed_emails.json"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
