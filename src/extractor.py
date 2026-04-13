import json
import logging
from .llm_client import llm_client
from .models import ExtractedData

logger = logging.getLogger(__name__)

class Extractor:
    def extract(self, pdf_text: str) -> ExtractedData:
        """
        Extract structured data from PDF text using Ollama.
        """
        prompt = self._build_prompt(pdf_text)
        system_msg = "You are a precise data extraction AI. You output ONLY valid JSON."
        
        try:
            response_text = llm_client.generate(prompt, system=system_msg)
            data = self._parse_json(response_text)
            
            # Simple retry if extraction feels empty or fails once
            if not data or data.get('name') == 'Unknown':
                logger.info("Retrying extraction due to low quality output...")
                response_text = llm_client.generate(prompt + " (Ensure valid JSON and extract all fields)", system=system_msg)
                data = self._parse_json(response_text)
            
            return ExtractedData(**data)
        except Exception as e:
            logger.error(f"Extraction Error: {str(e)}")
            return ExtractedData(
                name="Unknown",
                date="Unknown",
                document_type="Other",
                important_fields={"error": str(e)}
            )

    def _build_prompt(self, text: str) -> str:
        return f"""
Extract the following information from the provided document text:
- name (full name of person or company)
- date (relevant document date)
- document_type (invoice, resume, form, leave_application, or other)
- important_fields (dictionary of key-value pairs specific to the document type, e.g., total_amount for invoice, skills for resume)

Document Text:
{text[:4000]}  # Limiting text to avoid context window issues

Return the result STRICTLY as a JSON object with these keys:
{{
  "name": "...",
  "date": "...",
  "document_type": "...",
  "important_fields": {{...}}
}}
"""

    def _parse_json(self, text: str) -> dict:
        """ Clean and parse JSON from LLM response """
        try:
            # Try to find the JSON block if LLM added preamble
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != -1:
                json_str = text[start:end]
                return json.loads(json_str)
            return json.loads(text)
        except Exception as e:
            logger.warning(f"Failed to parse JSON: {str(e)}")
            return {}

extractor = Extractor()
