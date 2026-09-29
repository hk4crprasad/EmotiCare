import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.services.agent_service import get_agent_service

logger = logging.getLogger(__name__)

class AIService:
    """Simplified AI service that uses the centralized agent service"""
    
    def __init__(self):
        self.agent_service = None
    
    @classmethod
    async def create(cls):
        """Async factory method to create AIService"""
        self = cls()
        self.agent_service = await get_agent_service()
        logger.info("AI Service initialized with centralized agent service")
        return self

    async def generate_mental_health_response(
        self,
        user_input: str,
        conversation_history: List[Dict[str, str]] = None,
        user_profile: Dict[str, Any] = None,
        context_type: str = "chat",
        session_id: str = "default"
    ) -> str:
        """Generate empathetic mental health response using centralized agent service"""
        return await self.agent_service.generate_response(
            user_input=user_input,
            session_id=session_id,
            conversation_history=conversation_history,
            user_profile=user_profile,
            context_type=context_type
        )

    async def generate_voice_response(
        self,
        user_input: str,
        user_profile: Dict[str, Any] = None,
        session_id: str = "voice_default"
    ) -> str:
        """Generate optimized response for voice interaction"""
        return await self.agent_service.generate_response(
            user_input=user_input,
            session_id=session_id,
            user_profile=user_profile,
            context_type="voice"
        )
    
    async def get_conversation_summary(self, session_id: str) -> str:
        """Get a summary of the conversation for context"""
        history = self.agent_service.get_conversation_history(session_id)
        
        if not history:
            return "No previous conversation history."
        
        if len(history) <= 2:  # Just current exchange
            return "Beginning of conversation."
        
        # Get last 10 messages for summary (5 exchanges)
        recent_messages = history[-10:] if len(history) > 10 else history[:-2]  # Exclude current exchange
        
        summary_parts = []
        for i in range(0, len(recent_messages), 2):
            if i + 1 < len(recent_messages):
                user_msg = recent_messages[i].get("content", "")[:100]
                assistant_msg = recent_messages[i + 1].get("content", "")[:100]
                summary_parts.append(f"User: {user_msg}...")
                summary_parts.append(f"Assistant: {assistant_msg}...")
        
        return "\n".join(summary_parts)
    
    def get_conversation_length(self, session_id: str) -> int:
        """Get the number of messages in a conversation session"""
        return self.agent_service.get_conversation_length(session_id)
    
    def get_full_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get the complete conversation history for a session"""
        return self.agent_service.get_conversation_history(session_id)
    
    async def clear_conversation(self, session_id: str):
        """Clear conversation history for a session"""
        await self.agent_service.clear_conversation(session_id)
    
    def get_tools_info(self) -> List[Dict[str, str]]:
        """Get information about available tools"""
        return self.agent_service.get_tools_info()

# Global AI service instance - initialized async
ai_service = None

async def get_ai_service():
    """Get or create the global AI service instance"""
    global ai_service
    if ai_service is None:
        ai_service = await AIService.create()
    return ai_service
