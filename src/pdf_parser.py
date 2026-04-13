import fitz  # PyMuPDF
import re
import logging

logger = logging.getLogger(__name__)

class PDFParser:
    def extract_text(self, pdf_bytes: bytes) -> str:
        """
        Extract text from PDF bytes.
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            full_text = ""
            for page in doc:
                full_text += page.get_text()
            
            cleaned_text = self.clean_text(full_text)
            return cleaned_text
        except Exception as e:
            logger.error(f"PDF Parsing Error: {str(e)}")
            return ""

    def clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text.
        """
        # Remove null characters
        text = re.sub(r'\x00', '', text)
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        # Fix basic line break issues
        text = re.sub(r'(\n\s*){3,}', '\n\n', text)
        return text.strip()

    def is_scanned_pdf(self, pdf_bytes: bytes) -> bool:
        """
        Heuristic check if PDF is scanned (low text content).
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            total_text = ""
            for page in doc:
                total_text += page.get_text()
            
            # If text length is very low compared to page count, it's likely scanned
            if len(total_text.strip()) < 50 * len(doc):
                return True
            return False
        except:
            return True

pdf_parser = PDFParser()
