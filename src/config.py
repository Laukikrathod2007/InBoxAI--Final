import os
import sys
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, validator

class Settings(BaseSettings):
    # Gmail API
    GMAIL_CLIENT_CONFIG: str = "gmail_credentials.json"
    GMAIL_TOKEN_FILE: str = "token.json"
    
    # Gemini API (Upgraded)
    GEMINI_API_KEY: str = ""
    MODEL_NAME: str = "gemini-1.5-flash"
    TEMPERATURE: float = 0.2
    MAX_OUTPUT_TOKENS: int = 512
    CONFIDENCE_THRESHOLD: int = 70
    ENABLE_REPLY: bool = True

    # Autopilot (production automation controls)
    AUTOPILOT_ENABLED: bool = True
    # off | assist | autonomous
    AUTOPILOT_MODE: str = "autonomous"
    # Safe defaults: never auto-send unless explicitly enabled.
    AUTOPILOT_AUTO_ARCHIVE_NOISE: bool = True
    AUTOPILOT_MARK_READ_ON_ARCHIVE: bool = True
    AUTOPILOT_APPLY_LABELS: bool = True
    AUTOPILOT_AUTO_SEND_REPLIES: bool = False
    # Comma-separated allowlist for auto-send (only used if AUTOPILOT_AUTO_SEND_REPLIES=true)
    AUTOPILOT_SAFE_SEND_DOMAINS: str = ""
    
    # Application settings
    POLLING_INTERVAL_SECONDS: int = 60
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @validator("GEMINI_API_KEY")
    def validate_api_key(cls, v):
        if not v or v == "your_gemini_api_key_here":
            print("\nWARNING: GEMINI_API_KEY is missing or invalid.")
            print("InBoxIQ will continue in local Ollama fallback/demo mode.\n")
        return v

try:
    settings = Settings()
    # Step 3: Production Fallback Chain
    GEMINI_API_KEY = settings.GEMINI_API_KEY
    PRIMARY_MODEL = os.getenv("PRIMARY_MODEL", "gemini-2.0-flash")
    FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "gemini-flash-latest")
    OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL
    OLLAMA_MODEL = settings.OLLAMA_MODEL
    
    # Backwards compatibility for single MODEL_NAME references
    MODEL_NAME = PRIMARY_MODEL 

    TEMPERATURE = float(settings.TEMPERATURE)
    MAX_OUTPUT_TOKENS = int(settings.MAX_OUTPUT_TOKENS)
    CONFIDENCE_THRESHOLD = settings.CONFIDENCE_THRESHOLD
    ENABLE_REPLY = settings.ENABLE_REPLY

    # Autopilot runtime (env-driven)
    AUTOPILOT_ENABLED = settings.AUTOPILOT_ENABLED
    AUTOPILOT_MODE = settings.AUTOPILOT_MODE
    AUTOPILOT_AUTO_ARCHIVE_NOISE = settings.AUTOPILOT_AUTO_ARCHIVE_NOISE
    AUTOPILOT_MARK_READ_ON_ARCHIVE = settings.AUTOPILOT_MARK_READ_ON_ARCHIVE
    AUTOPILOT_APPLY_LABELS = settings.AUTOPILOT_APPLY_LABELS
    AUTOPILOT_AUTO_SEND_REPLIES = settings.AUTOPILOT_AUTO_SEND_REPLIES
    AUTOPILOT_SAFE_SEND_DOMAINS = settings.AUTOPILOT_SAFE_SEND_DOMAINS

    # Step 6: Debug Log
    print(f"--- InBoxIQ Strategy: Resilient Fallback ---")
    print(f"Primary: {PRIMARY_MODEL}")
    print(f"Fallback: {FALLBACK_MODEL}")
    print("---------------------------------------------")
except Exception as e:
    print(f"Configuration Error: {e}")
    sys.exit(1)
