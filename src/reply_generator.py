import logging
from .llm_client import llm_client

logger = logging.getLogger(__name__)

class ReplyGenerator:
    def generate_reply(self, extracted_data_dict: dict, sender: str, subject: str) -> str:
        """
        Generate a professional email reply based on extracted information.
        """
        doc_type = extracted_data_dict.get('document_type', 'document')
        name = extracted_data_dict.get('name', 'there')
        
        prompt = f"""
Draft a professional, short email reply for the following situation:
- Original Sender: {sender}
- Original Subject: {subject}
- Document Type Received: {doc_type}
- Extracted Name/Entity: {name}
- Key Details: {extracted_data_dict.get('important_fields', {})}

Requirements:
1. Acknowledge receipt of the {doc_type}.
2. Mention that it has been logged and is being processed.
3. Be professional and courteous.
4. Do NOT use placeholders like [Your Name]. Just end with "Best regards, InBoxIQ Team".

Draft Reply:
"""
        try:
            reply_text = llm_client.generate(prompt, system="You are an expert business communicator.")
            return reply_text.strip()
        except Exception as e:
            logger.error(f"Reply Generation Error: {str(e)}")
            return f"Hello, thank you for your email. We have received your {doc_type} and are processing it. Best regards, InBoxIQ Team."

reply_generator = ReplyGenerator()
