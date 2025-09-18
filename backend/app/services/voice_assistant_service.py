import asyncio
import base64
import io
import json
import logging
from typing import Optional, Dict, Any
import azure.cognitiveservices.speech as speechsdk
from deepgram import DeepgramClient, PrerecordedOptions, LiveOptions
import aiohttp

from app.config import settings
from app.database import get_database
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

class VoiceAssistantService:
    """Voice assistant service for EmotiCare mental health support"""
    
    def __init__(self):
        # Initialize Deepgram client
        self.deepgram = DeepgramClient(settings.DEEPGRAM_API_KEY)
        
        # Initialize Azure Speech synthesizer
        self.speech_config = speechsdk.SpeechConfig(
            subscription=settings.AZURE_SPEECH_KEY, 
            region=settings.AZURE_SPEECH_REGION
        )
        self.speech_config.speech_synthesis_voice_name = settings.AZURE_SPEECH_VOICE
        self.speech_synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=self.speech_config, 
            audio_config=None  # Return raw audio data
        )
        
        # Mental health conversation context
        self.conversation_contexts = {}
        
    async def transcribe_audio(self, audio_data: bytes, user_id: str) -> Optional[str]:
        """Transcribe audio using Deepgram"""
        try:
            # Prepare the audio for Deepgram
            options = PrerecordedOptions(
                model="nova-2",
                smart_format=True,
                language="en-US",
                punctuate=True,
                diarize=False
            )
            
            # Create audio source from bytes
            source = {"buffer": audio_data, "mimetype": "audio/wav"}
            
            # Transcribe
            response = await self.deepgram.listen.asyncprerecorded.v("1").transcribe_file(
                source, options
            )
            
            # Extract transcript
            if response.results and response.results.channels:
                transcript = response.results.channels[0].alternatives[0].transcript
                if transcript.strip():
                    logger.info(f"Transcribed audio for user {user_id}: {transcript[:100]}...")
                    return transcript.strip()
            
            return None
            
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return None
    
    async def generate_mental_health_response(
        self, 
        transcript: str, 
        user_id: str,
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate mental health-focused response using AI service"""
        try:
            # Get user's conversation context (simplified - main history managed by AI service)
            if user_id not in self.conversation_contexts:
                self.conversation_contexts[user_id] = {
                    "user_profile": user_context or {},
                    "session_start": asyncio.get_event_loop().time(),
                    "message_count": 0,
                    "emergency_indicators": []
                }
            
            context = self.conversation_contexts[user_id]
            context["message_count"] += 1
            
            # Generate response using AI service with React agent (maintains complete history internally)
            response = await ai_service.generate_voice_response(
                user_input=transcript,
                user_profile=user_context,
                session_id=f"voice_{user_id}"
            )
            
            # Check for emergency indicators in current exchange
            await self._check_emergency_indicators(context, transcript, response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating mental health response: {e}")
            return "I'm here to listen and support you. Could you please share what's on your mind?"
    
    def _build_mental_health_prompt(
        self, 
        context: Dict[str, Any], 
        user_context: Optional[Dict[str, Any]]
    ) -> str:
        """Build a mental health-focused system prompt"""
        base_prompt = """You are a compassionate AI mental health assistant for EmotiCare, a university counseling platform. Your role is to:

1. LISTEN actively and empathetically
2. VALIDATE feelings and experiences
3. PROVIDE emotional support and coping strategies
4. IDENTIFY signs of crisis and escalate appropriately
5. ENCOURAGE professional help when needed
6. MAINTAIN confidentiality and non-judgmental attitude

Guidelines:
- Use warm, supportive language
- Ask open-ended questions to encourage sharing
- Provide practical coping techniques (breathing, grounding, etc.)
- Recognize and respond to emotional distress
- NEVER provide medical diagnosis or medication advice
- If crisis indicators detected, guide to immediate help

Response style: Keep responses conversational, empathetic, and under 150 words for voice interaction."""
        
        # Add user-specific context
        if user_context:
            if user_context.get("role") == "student":
                base_prompt += f"\n\nUser is a {user_context.get('year_of_study', 'university')} student in {user_context.get('department', 'university')}."
            
            if user_context.get("recent_assessments"):
                base_prompt += "\n\nUser has recent mental health assessments indicating need for support."
        
        # Add conversation context
        if context.get("identified_concerns"):
            concerns = ", ".join(context["identified_concerns"])
            base_prompt += f"\n\nPreviously identified concerns: {concerns}"
        
        return base_prompt
    
    async def _check_emergency_indicators(
        self, 
        context: Dict[str, Any], 
        user_input: str, 
        ai_response: str
    ):
        """Check for emergency indicators and update context"""
        crisis_keywords = [
            "suicide", "kill myself", "end it all", "can't go on",
            "self-harm", "hurt myself", "no point", "better off dead"
        ]
        
        # Check user input for crisis indicators
        user_input_lower = user_input.lower()
        for keyword in crisis_keywords:
            if keyword in user_input_lower:
                context["emergency_indicators"].append({
                    "keyword": keyword,
                    "timestamp": asyncio.get_event_loop().time(),
                    "context": user_input[:100]
                })
                logger.warning(f"Crisis indicator detected: {keyword}")
                break
    
    def _build_mental_health_prompt(
        self, 
        context: Dict[str, Any], 
        user_context: Optional[Dict[str, Any]]
    ) -> str:
        """Build mental health focused prompt (simplified)"""
        prompt_parts = [
            "You are a compassionate mental health assistant.",
            "Provide empathetic, supportive responses.",
            "Keep responses under 100 words for voice interaction."
        ]
        
        if context.get("emergency_indicators"):
            prompt_parts.append("PRIORITY: User has shown crisis indicators. Provide immediate support resources.")
        
        if user_context:
            if user_context.get("department"):
                prompt_parts.append(f"User is from {user_context['department']} department.")
        
        return " ".join(prompt_parts)
    
    async def text_to_speech(self, text: str) -> Optional[bytes]:
        """Convert text to speech using Azure Speech Services"""
        try:
            # Clean text for better speech synthesis
            cleaned_text = self._clean_text_for_speech(text)
            
            # Use SSML for better control
            ssml = f"""
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
                <voice name="{settings.AZURE_SPEECH_VOICE}">
                    <prosody rate="0.9" pitch="medium">
                        {cleaned_text}
                    </prosody>
                </voice>
            </speak>
            """
            
            # Synthesize speech
            result = self.speech_synthesizer.speak_ssml_async(ssml).get()
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                logger.info(f"Successfully synthesized {len(result.audio_data)} bytes of audio")
                return result.audio_data
            else:
                logger.error(f"Speech synthesis failed: {result.reason}")
                if result.reason == speechsdk.ResultReason.Canceled:
                    cancellation = result.cancellation_details
                    logger.error(f"Cancellation reason: {cancellation.reason}")
                    if cancellation.error_details:
                        logger.error(f"Error details: {cancellation.error_details}")
                return None
                
        except Exception as e:
            logger.error(f"Error in text-to-speech conversion: {e}")
            return None
    
    def _clean_text_for_speech(self, text: str) -> str:
        """Clean text for better speech synthesis"""
        # Remove markdown formatting
        text = text.replace("**", "").replace("*", "")
        
        # Replace URLs with "link"
        import re
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', 
                     ' link ', text)
        
        # Ensure proper sentence endings
        if not text.endswith(('.', '!', '?')):
            text += '.'
        
        return text.strip()
    
    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get user context from database for personalized responses"""
        try:
            db = await get_database()
            
            # Get user info
            user = await db.users.find_one({"_id": user_id})
            if not user:
                return {}
            
            # Get recent assessments
            recent_assessments = []
            async for assessment in db.assessments.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(3):
                recent_assessments.append({
                    "type": assessment.get("assessment_type"),
                    "score": assessment.get("total_score"),
                    "severity": assessment.get("severity_level"),
                    "date": assessment.get("created_at")
                })
            
            # Get recent appointments
            recent_appointments = []
            async for appointment in db.appointments.find(
                {"student_id": user_id}
            ).sort("created_at", -1).limit(2):
                recent_appointments.append({
                    "date": appointment.get("appointment_date"),
                    "type": appointment.get("appointment_type"),
                    "status": appointment.get("status")
                })
            
            return {
                "user_id": str(user["_id"]),
                "full_name": user.get("full_name"),
                "role": user.get("role"),
                "department": user.get("department"),
                "year_of_study": user.get("year_of_study"),
                "recent_assessments": recent_assessments,
                "recent_appointments": recent_appointments
            }
            
        except Exception as e:
            logger.error(f"Error getting user context: {e}")
            return {}
    
    async def log_voice_interaction(
        self, 
        user_id: str, 
        transcript: str, 
        response: str,
        session_id: str
    ):
        """Log voice interaction for monitoring and improvement"""
        try:
            db = await get_database()
            
            interaction_log = {
                "user_id": user_id,
                "session_id": session_id,
                "transcript": transcript,
                "response": response,
                "timestamp": asyncio.get_event_loop().time(),
                "interaction_type": "voice_chat",
                "identified_concerns": self.conversation_contexts.get(user_id, {}).get("identified_concerns", []),
                "support_level": self.conversation_contexts.get(user_id, {}).get("support_level", "general")
            }
            
            await db.voice_interactions.insert_one(interaction_log)
            
        except Exception as e:
            logger.error(f"Error logging voice interaction: {e}")
    
    def cleanup_conversation(self, user_id: str):
        """Clean up conversation context when session ends"""
        if user_id in self.conversation_contexts:
            del self.conversation_contexts[user_id]
            logger.info(f"Cleaned up conversation context for user {user_id}")

# Global voice assistant service instance
voice_assistant_service = VoiceAssistantService()