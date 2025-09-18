# Schema imports for easier access
from .user import (
    User, UserCreate, UserUpdate, UserInDB, Token, TokenData,
    UserRole, Gender, YearOfStudy
)
from .assessment import (
    Assessment, AssessmentCreate, AssessmentInDB, AssessmentResult,
    AssessmentType, SeverityLevel, PHQ9Response, GAD7Response,
    AssessmentSummary
)
from .appointment import (
    Appointment, AppointmentCreate, AppointmentUpdate, AppointmentInDB,
    AppointmentStatus, AppointmentType, AppointmentMode,
    CounselorAvailability, AppointmentSlot
)
from .chat import (
    ChatSession, ChatSessionCreate, ChatSessionInDB, ChatMessage,
    ChatResponse, ChatMessageRole, ChatSessionStatus, EmotionalState
)
from .resource import (
    Resource, ResourceCreate, ResourceUpdate, ResourceInDB,
    ResourceType, ResourceCategory, Language, ResourceRating,
    ResourceUsage
)
from .peer_support import (
    Post, PostCreate, PostUpdate, PostInDB, Reply, ReplyCreate,
    ReplyInDB, Vote, PostStatus, PostCategory, VoteAction
)
from .admin import (
    DashboardMetrics, UserAnalytics, AssessmentTrend, CrisisAlert,
    InterventionPlan, InstitutionReport, AnonymousUserData,
    MetricType, TimePeriod
)

__all__ = [
    # User schemas
    "User", "UserCreate", "UserUpdate", "UserInDB", "Token", "TokenData",
    "UserRole", "Gender", "YearOfStudy",
    
    # Assessment schemas
    "Assessment", "AssessmentCreate", "AssessmentInDB", "AssessmentResult",
    "AssessmentType", "SeverityLevel", "PHQ9Response", "GAD7Response",
    "AssessmentSummary",
    
    # Appointment schemas
    "Appointment", "AppointmentCreate", "AppointmentUpdate", "AppointmentInDB",
    "AppointmentStatus", "AppointmentType", "AppointmentMode",
    "CounselorAvailability", "AppointmentSlot",
    
    # Chat schemas
    "ChatSession", "ChatSessionCreate", "ChatSessionInDB", "ChatMessage",
    "ChatResponse", "ChatMessageRole", "ChatSessionStatus", "EmotionalState",
    
    # Resource schemas
    "Resource", "ResourceCreate", "ResourceUpdate", "ResourceInDB",
    "ResourceType", "ResourceCategory", "Language", "ResourceRating",
    "ResourceUsage",
    
    # Peer support schemas
    "Post", "PostCreate", "PostUpdate", "PostInDB", "Reply", "ReplyCreate",
    "ReplyInDB", "Vote", "PostStatus", "PostCategory", "VoteAction",
    
    # Admin schemas
    "DashboardMetrics", "UserAnalytics", "AssessmentTrend", "CrisisAlert",
    "InterventionPlan", "InstitutionReport", "AnonymousUserData",
    "MetricType", "TimePeriod"
]