from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from app.schemas.user import PyObjectId

class ChatMessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatSessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ESCALATED = "escalated"  # When user needs immediate professional help

class EmotionalState(str, Enum):
    VERY_DISTRESSED = "very_distressed"
    DISTRESSED = "distressed"
    NEUTRAL = "neutral"
    CALM = "calm"
    POSITIVE = "positive"

class ChatMessage(BaseModel):
    role: ChatMessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    emotional_analysis: Optional[Dict[str, Any]] = None

class ChatSessionCreate(BaseModel):
    initial_message: str
    emotional_state: Optional[EmotionalState] = None

class ChatSessionInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    messages: List[ChatMessage] = []
    status: ChatSessionStatus = ChatSessionStatus.ACTIVE
    emotional_state: Optional[EmotionalState] = None
    crisis_indicators: List[str] = []  # List of detected crisis keywords/patterns
    intervention_triggered: bool = False
    counselor_notified: bool = False
    session_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class ChatSession(BaseModel):
    id: str
    user_id: str
    messages: List[ChatMessage]
    status: ChatSessionStatus
    emotional_state: Optional[EmotionalState] = None
    crisis_indicators: List[str] = []
    intervention_triggered: bool
    counselor_notified: bool
    session_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    ended_at: Optional[datetime] = None

class MessageRequest(BaseModel):
    message_content: str = Field(..., description="The message content to send")

class ChatSessionSummary(BaseModel):
    id: str
    chat_title: str  # AI-generated short title from conversation
    status: ChatSessionStatus
    message_count: int
    emotional_state: Optional[EmotionalState] = None
    intervention_triggered: bool
    created_at: datetime
    updated_at: datetime
    ended_at: Optional[datetime] = None

class ChatResponse(BaseModel):
    message: str
    requires_intervention: bool = False
    suggested_resources: List[str] = []
    emotional_support_level: str  # low, medium, high
    next_steps: Optional[List[str]] = None