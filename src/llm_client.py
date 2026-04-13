import requests
import json
import logging
from .config import settings

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL

    def generate(self, prompt: str, system: str = "") -> str:
        """
        Generate text from Ollama local LLM.
        """
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False
        }
        
        try:
            logger.info(f"Calling Ollama API (Model: {self.model})...")
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama API Error: {str(e)}")
            raise Exception(f"Failed to connect to Ollama: {str(e)}")

llm_client = LLMClient()
