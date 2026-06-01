import json
import logging
from .llm_client import llm_client

logger = logging.getLogger(__name__)

class NoiseFilter:
    def __init__(self):
        self.system_prompt = (
            "You are a Noise Gatekeeper for an intelligent email system. "
            "Your job is to decide if an email is 'noise' (spam, marketing, automated notifications, newsletters) "
            "or 'significant' (personal communication, business inquiries, invoices, meeting requests, important alerts). "
            "Respond ONLY with a JSON object: {\"is_noise\": true/false, \"reason\": \"string\"}"
        )

    def is_noise(self, sender, subject, body):
        prompt = (
            f"SENDER: {sender}\n"
            f"SUBJECT: {subject}\n"
            f"BODY: {body[:1000]}\n\n" # Truncate for efficiency
            "Is this email noise?"
        )
        
        try:
            data = llm_client.generate_json(prompt, system=self.system_prompt)
            return data.get("is_noise", False), data.get("reason", "")
        except Exception as e:
            logger.error(f"Noise Filter Error: {str(e)}")
            return False, f"Error: {str(e)}"

noise_filter = NoiseFilter()
