from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.security import HTTPBearer
from typing import Dict, Set
import json
import logging
import asyncio
import base64
from datetime import datetime
import uuid

from app.utils.auth import get_current_user_websocket
from app.services.voice_assistant_service import voice_assistant_service
from app.database import get_database

router = APIRouter()
logger = logging.getLogger(__name__)

# Active WebSocket connections
active_connections: Dict[str, WebSocket] = {}
user_sessions: Dict[str, str] = {}  # user_id -> session_id

class VoiceConnectionManager:
    """Manage WebSocket connections for voice chat"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_sessions: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str) -> str:
        """Accept WebSocket connection and create session"""
        await websocket.accept()
        session_id = str(uuid.uuid4())
        
        self.active_connections[user_id] = websocket
        self.user_sessions[user_id] = session_id
        
        logger.info(f"Voice chat connected: User {user_id}, Session {session_id}")
        return session_id
    
    def disconnect(self, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        if user_id in self.user_sessions:
            del self.user_sessions[user_id]
        
        # Cleanup conversation context
        voice_assistant_service.cleanup_conversation(user_id)
        logger.info(f"Voice chat disconnected: User {user_id}")
    
    async def send_message(self, user_id: str, message: dict):
        """Send message to specific user"""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(json.dumps(message))
    
    async def send_audio(self, user_id: str, audio_data: bytes):
        """Send audio data to specific user"""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            
            # Encode audio as base64 for JSON transmission
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            message = {
                "type": "audio_response",
                "audio_data": audio_b64,
                "format": "wav",
                "timestamp": datetime.utcnow().isoformat()
            }
            await websocket.send_text(json.dumps(message))

# Global connection manager
connection_manager = VoiceConnectionManager()

@router.websocket("/ws/voice-chat")
async def voice_chat_websocket(websocket: WebSocket, token: str = None):
    """
    WebSocket endpoint for voice chat
    
    Expected message format from client:
    {
        "type": "audio_chunk",
        "audio_data": "base64_encoded_audio",
        "format": "wav",
        "sample_rate": 16000
    }
    
    Or for text input:
    {
        "type": "text_input", 
        "text": "user message"
    }
    """
    
    user_id = None
    session_id = None
    
    try:
        # Authenticate user
        if not token:
            await websocket.close(code=1008, reason="Authentication required")
            return
        
        # Verify token and get user info
        user = await get_current_user_websocket(token)
        if not user:
            await websocket.close(code=1008, reason="Invalid authentication")
            return
        
        user_id = user.id
        
        # Connect and create session
        session_id = await connection_manager.connect(websocket, user_id)
        
        # Get user context for personalized responses
        user_context = await voice_assistant_service.get_user_context(user_id)
        
        # Send welcome message
        welcome_message = {
            "type": "welcome",
            "message": f"Hello {user.full_name}, I'm here to listen and support you. Feel free to speak or type what's on your mind.",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_message(user_id, welcome_message)
        
        # Main message loop
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                message_type = message.get("type")
                
                if message_type == "audio_chunk":
                    await handle_audio_input(message, user_id, user_context, session_id)
                
                elif message_type == "text_input":
                    await handle_text_input(message, user_id, user_context, session_id)
                
                elif message_type == "ping":
                    # Respond to ping to keep connection alive
                    pong_message = {
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    await connection_manager.send_message(user_id, pong_message)
                
                elif message_type == "end_session":
                    # End the voice chat session
                    logger.info(f"User {user_id} ended voice chat session")
                    break
                
                else:
                    logger.warning(f"Unknown message type: {message_type}")
            
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for user {user_id}")
                break
            
            except json.JSONDecodeError:
                error_message = {
                    "type": "error",
                    "message": "Invalid message format. Please send valid JSON.",
                    "timestamp": datetime.utcnow().isoformat()
                }
                await connection_manager.send_message(user_id, error_message)
            
            except Exception as e:
                logger.error(f"Error processing message for user {user_id}: {e}")
                error_message = {
                    "type": "error", 
                    "message": "Sorry, I encountered an error processing your message. Please try again.",
                    "timestamp": datetime.utcnow().isoformat()
                }
                await connection_manager.send_message(user_id, error_message)
    
    except Exception as e:
        logger.error(f"Error in voice chat WebSocket: {e}")
        if user_id:
            try:
                error_message = {
                    "type": "error",
                    "message": "Sorry, there was a connection error. Please try reconnecting.",
                    "timestamp": datetime.utcnow().isoformat()
                }
                await connection_manager.send_message(user_id, error_message)
            except:
                pass
    
    finally:
        # Cleanup on disconnect
        if user_id:
            connection_manager.disconnect(user_id)

async def handle_audio_input(
    message: dict, 
    user_id: str, 
    user_context: dict, 
    session_id: str
):
    """Handle audio input from client"""
    try:
        # Decode base64 audio data
        audio_b64 = message.get("audio_data")
        if not audio_b64:
            raise ValueError("No audio data provided")
        
        audio_data = base64.b64decode(audio_b64)
        
        # Send processing status
        status_message = {
            "type": "status",
            "message": "Processing your voice message...",
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_message(user_id, status_message)
        
        # Transcribe audio
        transcript = await voice_assistant_service.transcribe_audio(audio_data, user_id)
        
        if not transcript:
            error_message = {
                "type": "error",
                "message": "I couldn't understand what you said. Could you please try speaking again?",
                "timestamp": datetime.utcnow().isoformat()
            }
            await connection_manager.send_message(user_id, error_message)
            return
        
        # Send transcript to user for confirmation
        transcript_message = {
            "type": "transcript",
            "text": transcript,
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_message(user_id, transcript_message)
        
        # Process with voice assistant
        await process_user_input(transcript, user_id, user_context, session_id, input_type="voice")
        
    except Exception as e:
        logger.error(f"Error handling audio input: {e}")
        error_message = {
            "type": "error",
            "message": "Sorry, I had trouble processing your voice message. Please try again.",
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_message(user_id, error_message)

async def handle_text_input(
    message: dict, 
    user_id: str, 
    user_context: dict, 
    session_id: str
):
    """Handle text input from client"""
    try:
        text = message.get("text", "").strip()
        if not text:
            return
        
        # Process with voice assistant
        await process_user_input(text, user_id, user_context, session_id, input_type="text")
        
    except Exception as e:
        logger.error(f"Error handling text input: {e}")
        error_message = {
            "type": "error",
            "message": "Sorry, I had trouble processing your message. Please try again.",
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_message(user_id, error_message)

async def process_user_input(
    user_input: str, 
    user_id: str, 
    user_context: dict, 
    session_id: str,
    input_type: str = "text"
):
    """Process user input and generate response"""
    try:
        # Generate mental health response
        response_text = await voice_assistant_service.generate_mental_health_response(
            transcript=user_input,
            user_id=user_id,
            user_context=user_context
        )
        
        # Send text response
        text_response_message = {
            "type": "text_response",
            "text": response_text,
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_message(user_id, text_response_message)
        
        # Convert response to speech
        audio_data = await voice_assistant_service.text_to_speech(response_text)
        
        if audio_data:
            # Send audio response
            await connection_manager.send_audio(user_id, audio_data)
        
        # Log interaction
        await voice_assistant_service.log_voice_interaction(
            user_id=user_id,
            transcript=user_input,
            response=response_text,
            session_id=session_id
        )
        
        # Check for crisis indicators and send alerts if needed
        await check_crisis_indicators(user_input, response_text, user_id, user_context)
        
    except Exception as e:
        logger.error(f"Error processing user input: {e}")
        fallback_message = {
            "type": "text_response",
            "text": "I'm here to listen and support you. Could you please share what's on your mind?",
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_message(user_id, fallback_message)

async def check_crisis_indicators(
    user_input: str, 
    response: str, 
    user_id: str, 
    user_context: dict
):
    """Check for crisis indicators and send appropriate alerts"""
    try:
        crisis_keywords = [
            "suicide", "kill myself", "end it all", "die", "hurt myself", 
            "can't go on", "no point", "give up", "overdose"
        ]
        
        user_input_lower = user_input.lower()
        
        if any(keyword in user_input_lower for keyword in crisis_keywords):
            logger.warning(f"Crisis indicators detected for user {user_id}")
            
            # Send crisis support message
            crisis_message = {
                "type": "crisis_alert",
                "message": "I'm concerned about what you've shared. Please know that help is available. Would you like me to connect you with crisis support resources?",
                "resources": [
                    {
                        "name": "National Suicide Prevention Lifeline",
                        "phone": "988",
                        "description": "24/7 crisis support"
                    },
                    {
                        "name": "Crisis Text Line", 
                        "text": "Text HOME to 741741",
                        "description": "24/7 text support"
                    },
                    {
                        "name": "Campus Counseling Center",
                        "phone": "Emergency Contact",
                        "description": "Immediate campus support"
                    }
                ],
                "timestamp": datetime.utcnow().isoformat()
            }
            await connection_manager.send_message(user_id, crisis_message)
            
            # Log crisis event
            db = await get_database()
            crisis_log = {
                "user_id": user_id,
                "transcript": user_input,
                "timestamp": datetime.utcnow(),
                "crisis_indicators": "suicide_ideation",
                "response_provided": True,
                "escalation_needed": True
            }
            await db.crisis_logs.insert_one(crisis_log)
            
    except Exception as e:
        logger.error(f"Error checking crisis indicators: {e}")

# Additional utility functions for WebSocket management
@router.get("/voice-chat/status")
async def get_voice_chat_status():
    """Get current voice chat service status"""
    return {
        "service": "Voice Chat",
        "status": "active",
        "active_connections": len(connection_manager.active_connections),
        "features": [
            "Real-time voice transcription",
            "Mental health-focused responses", 
            "Crisis detection and intervention",
            "Personalized user context",
            "Audio response synthesis"
        ]
    }