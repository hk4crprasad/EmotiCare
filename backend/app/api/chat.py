from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import logging

from app.database import get_database
from app.schemas.chat import (
    ChatSession, ChatSessionCreate, ChatMessage, ChatResponse,
    ChatMessageRole, ChatSessionStatus, EmotionalState, MessageRequest, ChatSessionSummary
)
from app.services.chat_service import mental_health_chat
from app.utils.auth import get_current_user
from app.schemas.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/start-session", response_model=ChatSession)
async def start_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Start a new chat session"""
    try:
        # Create initial message
        initial_message = ChatMessage(
            role=ChatMessageRole.USER,
            content=session_data.initial_message
        )
        
        # Get AI response
        chat_response = await mental_health_chat.generate_response(
            message=session_data.initial_message,
            chat_history=[],
            user_context={"user_id": current_user.id, "role": current_user.role},
            session_id=None  # Will be set after session is created
        )
        
        # Create AI response message
        ai_message = ChatMessage(
            role=ChatMessageRole.ASSISTANT,
            content=chat_response.message,
            emotional_analysis={
                "requires_intervention": chat_response.requires_intervention,
                "emotional_support_level": chat_response.emotional_support_level,
                "suggested_resources": chat_response.suggested_resources
            }
        )
        
        # Create chat session document
        current_time = datetime.utcnow()
        session_doc = {
            "user_id": ObjectId(current_user.id),
            "messages": [initial_message.dict(), ai_message.dict()],
            "status": ChatSessionStatus.ESCALATED if chat_response.requires_intervention else ChatSessionStatus.ACTIVE,
            "emotional_state": session_data.emotional_state,
            "crisis_indicators": [],
            "intervention_triggered": chat_response.requires_intervention,
            "counselor_notified": chat_response.requires_intervention,
            "session_summary": None,
            "created_at": current_time,
            "updated_at": current_time,
            "ended_at": None
        }
        
        # If crisis indicators detected, add them
        if chat_response.requires_intervention:
            crisis_indicators, _, _ = mental_health_chat.analyze_crisis_indicators(session_data.initial_message)
            session_doc["crisis_indicators"] = crisis_indicators
        
        # Insert to database
        result = await db.chat_sessions.insert_one(session_doc)
        session_doc["_id"] = result.inserted_id
        
        # Convert to response format
        session = ChatSession(
            id=str(result.inserted_id),
            user_id=current_user.id,
            messages=[initial_message, ai_message],
            status=session_doc["status"],
            emotional_state=session_data.emotional_state,
            crisis_indicators=session_doc["crisis_indicators"],
            intervention_triggered=chat_response.requires_intervention,
            counselor_notified=chat_response.requires_intervention,
            session_summary=None,
            created_at=session_doc["created_at"],
            updated_at=session_doc["updated_at"],
            ended_at=None
        )
        
        logger.info(f"Chat session started for user {current_user.id}, intervention: {chat_response.requires_intervention}")
        return session
        
    except Exception as e:
        logger.error(f"Error starting chat session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start chat session"
        )

@router.post("/sessions/{session_id}/message", response_model=ChatResponse)
async def send_message(
    session_id: str,
    message_request: MessageRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send a message in an existing chat session"""
    try:
        message_content = message_request.message_content
        # Validate session exists and belongs to user
        session = await db.chat_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        if session["status"] not in [ChatSessionStatus.ACTIVE, ChatSessionStatus.ESCALATED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chat session is not active"
            )
        
        # Convert existing messages to ChatMessage objects
        chat_history = [
            ChatMessage(**msg) for msg in session.get("messages", [])
        ]
        
        # Generate AI response with full conversation history
        chat_response = await mental_health_chat.generate_response(
            message=message_content,
            chat_history=chat_history,
            user_context={"user_id": current_user.id, "role": current_user.role},
            session_id=session_id  # Use the actual session_id to maintain conversation history
        )
        
        # Create new messages
        user_message = ChatMessage(
            role=ChatMessageRole.USER,
            content=message_content
        )
        
        ai_message = ChatMessage(
            role=ChatMessageRole.ASSISTANT,
            content=chat_response.message,
            emotional_analysis={
                "requires_intervention": chat_response.requires_intervention,
                "emotional_support_level": chat_response.emotional_support_level,
                "suggested_resources": chat_response.suggested_resources
            }
        )
        
        # Update session with new messages
        update_data = {
            "$push": {
                "messages": {
                    "$each": [user_message.dict(), ai_message.dict()]
                }
            },
            "$set": {
                "updated_at": user_message.timestamp
            }
        }
        
        # If intervention triggered, update session status
        if chat_response.requires_intervention:
            crisis_indicators, _, _ = mental_health_chat.analyze_crisis_indicators(message_content)
            update_data["$set"].update({
                "status": ChatSessionStatus.ESCALATED,
                "intervention_triggered": True,
                "counselor_notified": True
            })
            update_data["$push"]["crisis_indicators"] = {"$each": crisis_indicators}
        
        await db.chat_sessions.update_one(
            {"_id": ObjectId(session_id)},
            update_data
        )
        
        logger.info(f"Message sent in session {session_id}, intervention: {chat_response.requires_intervention}")
        return chat_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )

@router.get("/sessions", response_model=List[ChatSessionSummary])
async def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    limit: int = 10,
    skip: int = 0
):
    """Get user's chat sessions summary with short titles"""
    try:
        cursor = db.chat_sessions.find(
            {"user_id": ObjectId(current_user.id)}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        sessions = []
        async for session_doc in cursor:
            messages = session_doc.get("messages", [])
            
            # Generate chat title if not already stored
            chat_title = session_doc.get("chat_title")
            if not chat_title and len(messages) >= 2:
                try:
                    first_user_msg = messages[0].get("content", "")
                    first_ai_msg = messages[1].get("content", "")
                    chat_title = await mental_health_chat.generate_chat_title(first_user_msg, first_ai_msg)
                    
                    # Store the generated title in the database
                    await db.chat_sessions.update_one(
                        {"_id": session_doc["_id"]},
                        {"$set": {"chat_title": chat_title}}
                    )
                except Exception as e:
                    logger.error(f"Error generating chat title: {e}")
                    chat_title = "Mental Health Support"
            elif not chat_title:
                chat_title = "Mental Health Support"
            
            session_summary = ChatSessionSummary(
                id=str(session_doc["_id"]),
                chat_title=chat_title,
                status=session_doc["status"],
                message_count=len(messages),
                emotional_state=session_doc.get("emotional_state"),
                intervention_triggered=session_doc.get("intervention_triggered", False),
                created_at=session_doc.get("created_at"),
                updated_at=session_doc.get("updated_at"),
                ended_at=session_doc.get("ended_at")
            )
            sessions.append(session_summary)
        
        return sessions
        
    except Exception as e:
        logger.error(f"Error fetching user sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch chat sessions"
        )

@router.get("/sessions/{session_id}", response_model=ChatSession)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific chat session"""
    try:
        session_doc = await db.chat_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not session_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        # Convert messages
        messages = [ChatMessage(**msg) for msg in session_doc.get("messages", [])]
        
        session = ChatSession(
            id=str(session_doc["_id"]),
            user_id=current_user.id,
            messages=messages,
            status=session_doc["status"],
            emotional_state=session_doc.get("emotional_state"),
            crisis_indicators=session_doc.get("crisis_indicators", []),
            intervention_triggered=session_doc.get("intervention_triggered", False),
            counselor_notified=session_doc.get("counselor_notified", False),
            session_summary=session_doc.get("session_summary"),
            created_at=session_doc.get("created_at"),
            updated_at=session_doc.get("updated_at"),
            ended_at=session_doc.get("ended_at")
        )
        
        return session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch chat session"
        )

@router.post("/sessions/{session_id}/end", response_model=dict)
async def end_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """End a chat session"""
    try:
        result = await db.chat_sessions.update_one(
            {
                "_id": ObjectId(session_id),
                "user_id": ObjectId(current_user.id)
            },
            {
                "$set": {
                    "status": ChatSessionStatus.COMPLETED,
                    "ended_at": ChatMessage().timestamp,
                    "updated_at": ChatMessage().timestamp
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return {"message": "Chat session ended successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to end chat session"
        )

@router.get("/emergency-resources", response_model=dict)
async def get_emergency_resources():
    """Get emergency mental health resources"""
    return {
        "crisis_hotlines": [
            {
                "name": "National Suicide Prevention Helpline",
                "number": "91-9152987821",
                "available": "24/7",
                "languages": ["Hindi", "English"]
            },
            {
                "name": "Emergency Services",
                "number": "112",
                "available": "24/7",
                "description": "For immediate emergency assistance"
            },
            {
                "name": "iCall Psychosocial Helpline",
                "number": "022-25521111",
                "available": "Monday-Saturday 8AM-10PM",
                "languages": ["Hindi", "English"]
            }
        ],
        "online_resources": [
            {
                "name": "NIMHANS Centre for Well Being",
                "url": "https://nimhans.ac.in/centre-for-well-being",
                "description": "Mental health resources and support"
            },
            {
                "name": "Mann Talks",
                "url": "https://manntalks.org",
                "description": "Mental health awareness and support"
            }
        ],
        "immediate_coping": [
            "Take deep breaths: 4 counts in, hold for 4, exhale for 6",
            "Ground yourself: Name 5 things you see, 4 you hear, 3 you feel",
            "Call a trusted friend or family member",
            "Remove any means of self-harm from your environment",
            "Go to a safe, public place if alone"
        ]
    }