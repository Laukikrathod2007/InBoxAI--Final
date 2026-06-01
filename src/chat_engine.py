import json
import logging
import sqlite3
from .llm_client import llm_client
from .database import DB_URL

logger = logging.getLogger(__name__)

class ChatEngine:
    def __init__(self):
        self.db_path = DB_URL.replace("sqlite:///", "")
        self.system_prompt = (
            "You are the InBoxIQ Intelligence Core. "
            "Convert natural language questions into precise SQLite queries. "
            "TABLE SCHEMA:\n"
            "- emails (id, thread_id, sender, subject, summary, category, priority, importance_score, needs_reply, status, received_at)\n"
            "- threads (id, summary, participants, last_updated)\n"
            "Rules:\n"
            "1. Output ONLY a valid JSON object.\n"
            "2. JSON Keys: 'sql' (the SQLite query), 'explanation' (brief reasoning).\n"
            "3. Query only the necessary fields.\n"
            "Format: {\"sql\": \"...\", \"explanation\": \"...\"}"
        )

    def query(self, question: str):
        """
        Convert question to SQL, execute, and return results.
        """
        try:
            # 1. NL -> SQL
            sql_data = self._generate_sql(question)
            sql = sql_data.get("sql")
            if not sql:
                return "I couldn't generate a query for that question."

            # 2. Execute SQL
            results = self._execute_sql(sql)
            
            # 3. SQL Result -> NL Response
            return self._format_response(question, results)
        except Exception as e:
            logger.error(f"Chat Engine Error: {str(e)}")
            return f"Error: {str(e)}"

    def _generate_sql(self, question: str):
        return llm_client.generate_json(question, system=self.system_prompt)

    def _execute_sql(self, sql: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            # Basic safety: only allow SELECT
            if not sql.strip().upper().startswith("SELECT"):
                raise Exception("Only SELECT queries are allowed for safety.")
            
            cursor.execute(sql)
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        finally:
            conn.close()

    def _format_response(self, question, results):
        if not results:
            return "I couldn't find any matching records in your inbox."
        
        prompt = (
            f"Question: {question}\n"
            f"Data: {json.dumps(results[:10])}\n\n"
            "Explain the results naturally to the user."
        )
        return llm_client.generate(prompt, system="You are a helpful AI assistant for an email client.")

chat_engine = ChatEngine()
