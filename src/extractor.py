import logging
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from .llm_client import llm_client
from .pdf_parser import pdf_parser

logger = logging.getLogger("InBoxIQ.Extractor")

class DocumentExtractor:
    """
    Intelligent Document Understanding Engine
    Specialized extractors for different document types
    """

    def __init__(self):
        self.document_types = {
            "invoice": self._extract_invoice,
            "resume": self._extract_resume,
            "form": self._extract_form,
            "receipt": self._extract_receipt,
            "contract": self._extract_contract
        }

    def extract_from_pdf(self, pdf_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Main entry point for PDF document extraction
        """
        try:
            # Extract raw text
            raw_text = pdf_parser.extract_text(pdf_bytes)

            if not raw_text.strip():
                return self._create_error_response("No text could be extracted from PDF")

            # Determine document type
            doc_type = self._classify_document_type(raw_text, filename)

            # Extract using specialized extractor
            if doc_type in self.document_types:
                extracted_data, confidence = self.document_types[doc_type](raw_text)
            else:
                # Fallback to generic extraction
                extracted_data, confidence = self._extract_generic(raw_text)

            return {
                "document_type": doc_type,
                "extracted_data": extracted_data,
                "confidence": confidence,
                "raw_text_length": len(raw_text),
                "extraction_timestamp": datetime.now().isoformat(),
                "filename": filename
            }

        except Exception as e:
            logger.error(f"Document extraction failed: {str(e)}")
            return self._create_error_response(f"Extraction failed: {str(e)}")

    def _classify_document_type(self, text: str, filename: str = "") -> str:
        """
        Classify document type using heuristics and AI
        """
        text_lower = text.lower()
        filename_lower = filename.lower()

        # Fast heuristic checks
        if any(word in filename_lower for word in ["invoice", "inv", "bill"]):
            return "invoice"
        if any(word in filename_lower for word in ["resume", "cv", "curriculum"]):
            return "resume"
        if any(word in filename_lower for word in ["receipt", "payment"]):
            return "receipt"
        if any(word in filename_lower for word in ["contract", "agreement"]):
            return "contract"

        # Content-based classification
        if re.search(r'\b(invoice|inv\.?|bill)\b', text_lower):
            return "invoice"
        if re.search(r'\b(resume|cv|curriculum vitae|experience|skills)\b', text_lower):
            return "resume"
        if re.search(r'\b(receipt|paid|payment)\b', text_lower):
            return "receipt"
        if re.search(r'\b(contract|agreement|terms)\b', text_lower):
            return "contract"

        # AI-based classification for uncertain cases
        return self._ai_classify_document(text)

    def _ai_classify_document(self, text: str) -> str:
        """
        Use AI to classify uncertain documents
        """
        prompt = f"""
        Analyze this document text and classify it into one of these types:
        - invoice: Bills, purchase orders, vendor invoices
        - resume: CVs, job applications, candidate profiles
        - form: Government forms, applications, surveys
        - receipt: Payment confirmations, transaction receipts
        - contract: Legal agreements, terms of service
        - other: Anything else

        DOCUMENT TEXT (first 1000 chars):
        {text[:1000]}

        Respond with ONLY the document type, no explanation.
        """

        try:
            response = llm_client.generate(prompt, max_tokens=20).strip().lower()
            valid_types = ["invoice", "resume", "form", "receipt", "contract"]
            return response if response in valid_types else "other"
        except:
            return "other"

    def _extract_invoice(self, text: str) -> Tuple[Dict[str, Any], float]:
        """
        Specialized invoice extractor
        """
        prompt = f"""
        You are an expert invoice analyst with 20 years of experience.

        INVOICE TEXT:
        {text}

        EXTRACT the following fields. If a field is not found, use null.
        Be smart about formats:
        - Dates: Convert "March 15, 2024" to "2024-03-15"
        - Money: Extract as number only, e.g. "$1,500.00" → 1500.00
        - Invoice numbers: Look for patterns like "INV-123", "Invoice #456"

        REQUIRED FIELDS:
        - invoice_number: string
        - vendor_name: string
        - vendor_address: string
        - invoice_date: string (YYYY-MM-DD)
        - due_date: string (YYYY-MM-DD, calculate if "Net 30")
        - total_amount: number
        - currency: string (USD, EUR, etc.)
        - payment_terms: string
        - line_items: array of objects with description, quantity, price, total
        - tax_amount: number (if present)
        - subtotal: number (if present)

        OUTPUT as valid JSON only:
        """

        try:
            response = llm_client.generate(prompt, max_tokens=1000)
            data = json.loads(response)

            # Calculate confidence based on field completeness
            confidence = self._calculate_confidence(data, [
                "invoice_number", "vendor_name", "invoice_date", "total_amount"
            ])

            # Calculate derived fields
            if data.get("payment_terms") and "Net" in str(data["payment_terms"]):
                days = int(re.search(r'Net (\d+)', str(data["payment_terms"])).group(1))
                if data.get("invoice_date"):
                    invoice_date = datetime.fromisoformat(data["invoice_date"])
                    data["due_date"] = (invoice_date + timedelta(days=days)).strftime("%Y-%m-%d")

            return data, confidence

        except Exception as e:
            logger.error(f"Invoice extraction failed: {str(e)}")
            return {}, 0.0

    def _extract_resume(self, text: str) -> Tuple[Dict[str, Any], float]:
        """
        Specialized resume/CV extractor
        """
        prompt = f"""
        You are a professional HR recruiter analyzing a resume.

        RESUME TEXT:
        {text}

        EXTRACT the following information:

        - name: Full name of candidate
        - email: Email address
        - phone: Phone number
        - location: City, State/Country
        - current_position: Current job title
        - experience_years: Total years of experience (number)
        - education: Array of education entries
        - skills: Array of technical skills
        - previous_companies: Array of company names
        - linkedin_url: LinkedIn profile URL if present

        Be smart about:
        - Experience: Calculate from job history dates
        - Skills: Extract from skills section or infer from experience
        - Contact info: Look in header or footer

        OUTPUT as valid JSON only:
        """

        try:
            response = llm_client.generate(prompt, max_tokens=800)
            data = json.loads(response)

            confidence = self._calculate_confidence(data, [
                "name", "email", "experience_years"
            ])

            return data, confidence

        except Exception as e:
            logger.error(f"Resume extraction failed: {str(e)}")
            return {}, 0.0

    def _extract_form(self, text: str) -> Tuple[Dict[str, Any], float]:
        """
        Specialized form extractor
        """
        prompt = f"""
        You are analyzing a form document.

        FORM TEXT:
        {text}

        EXTRACT:
        - form_type: Type of form (application, survey, government, etc.)
        - form_number: Form ID or number
        - applicant_name: Name of person filling form
        - submission_date: When form was submitted
        - fields: Array of field names and values found

        OUTPUT as valid JSON only:
        """

        try:
            response = llm_client.generate(prompt, max_tokens=600)
            data = json.loads(response)
            confidence = self._calculate_confidence(data, ["form_type"])
            return data, confidence
        except:
            return {}, 0.0

    def _extract_receipt(self, text: str) -> Tuple[Dict[str, Any], float]:
        """
        Specialized receipt extractor
        """
        prompt = f"""
        You are analyzing a payment receipt.

        RECEIPT TEXT:
        {text}

        EXTRACT:
        - receipt_number: Receipt ID
        - merchant_name: Who received payment
        - transaction_date: Date of transaction
        - amount: Payment amount
        - currency: Currency code
        - payment_method: How payment was made
        - items: Array of purchased items (if present)

        OUTPUT as valid JSON only:
        """

        try:
            response = llm_client.generate(prompt, max_tokens=600)
            data = json.loads(response)
            confidence = self._calculate_confidence(data, ["merchant_name", "amount"])
            return data, confidence
        except:
            return {}, 0.0

    def _extract_contract(self, text: str) -> Tuple[Dict[str, Any], float]:
        """
        Specialized contract extractor
        """
        prompt = f"""
        You are analyzing a contract or agreement.

        CONTRACT TEXT:
        {text}

        EXTRACT:
        - contract_type: Type of contract
        - parties: Array of parties involved
        - effective_date: When contract starts
        - expiration_date: When contract ends
        - key_terms: Array of important clauses
        - value: Contract value if mentioned

        OUTPUT as valid JSON only:
        """

        try:
            response = llm_client.generate(prompt, max_tokens=600)
            data = json.loads(response)
            confidence = self._calculate_confidence(data, ["contract_type", "parties"])
            return data, confidence
        except:
            return {}, 0.0

    def _extract_generic(self, text: str) -> Tuple[Dict[str, Any], float]:
        """
        Fallback generic extractor
        """
        prompt = f"""
        Analyze this document and extract any structured information you can find.

        DOCUMENT TEXT:
        {text[:2000]}

        OUTPUT as JSON with whatever fields make sense:
        """

        try:
            response = llm_client.generate(prompt, max_tokens=600)
            data = json.loads(response)
            return data, 0.5  # Low confidence for generic extraction
        except:
            return {"raw_text": text[:1000]}, 0.3

    def _calculate_confidence(self, data: Dict[str, Any], required_fields: List[str]) -> float:
        """
        Calculate extraction confidence based on field completeness
        """
        if not data:
            return 0.0

        filled_required = sum(1 for field in required_fields if data.get(field))
        completeness = filled_required / len(required_fields)

        # Base confidence from completeness
        confidence = completeness * 0.7

        # Bonus for having many fields
        total_fields = len([v for v in data.values() if v is not None])
        field_bonus = min(total_fields / 10, 0.3)  # Max 0.3 bonus

        return min(confidence + field_bonus, 1.0)

    def _create_error_response(self, message: str) -> Dict[str, Any]:
        """
        Create standardized error response
        """
        return {
            "document_type": "error",
            "extracted_data": {},
            "confidence": 0.0,
            "error": message,
            "extraction_timestamp": datetime.now().isoformat()
        }

# Global instance
document_extractor = DocumentExtractor()
