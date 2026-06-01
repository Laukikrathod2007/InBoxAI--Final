import logging
from .llm_client import llm_client

logger = logging.getLogger("InBoxIQ.Tools")

class ToolLayer:
    def __init__(self):
        pass

    def ghostwrite_reply(self, thread_context: str, sender: str, subject: str):
        """ Drafts a professional reply based on thread context """
        prompt = f"""
        Draft a concise, professional reply to:
        Sender: {sender}
        Subject: {subject}
        
        Thread Context:
        {thread_context}
        
        Rules:
        - Be direct and helpful.
        - Sign off as "InBoxIQ Assistant (on behalf of User)".
        - Keep it under 100 words.
        """
        try:
            draft = llm_client.generate(prompt, system="You are an elite executive assistant ghostwriter.")
            return draft
        except Exception as e:
            logger.error(f"Reply tool failed: {e}")
            return "Unable to generate draft automatically."

    def propose_meeting_slots(self, body: str):
        """ Extracts meeting intent and proposes next steps """
        # In a real app, this would check a calendar API
        return "I can see you're looking for a meeting. I've flagged this for review."

tools = ToolLayer()
