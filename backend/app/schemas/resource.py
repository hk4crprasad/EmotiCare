from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from app.schemas.user import PyObjectId

class ResourceType(str, Enum):
    VIDEO = "video"
    AUDIO = "audio"
    ARTICLE = "article"
    PDF = "pdf"
    INTERACTIVE = "interactive"
    EXTERNAL_LINK = "external_link"

class ResourceCategory(str, Enum):
    STRESS_MANAGEMENT = "stress_management"
    ANXIETY_COPING = "anxiety_coping"
    DEPRESSION_SUPPORT = "depression_support"
    SLEEP_HYGIENE = "sleep_hygiene"
    MINDFULNESS = "mindfulness"
    MEDITATION = "meditation"
    BREATHING_EXERCISES = "breathing_exercises"
    STUDY_SKILLS = "study_skills"
    TIME_MANAGEMENT = "time_management"
    RELATIONSHIPS = "relationships"
    SELF_CARE = "self_care"
    CRISIS_HELP = "crisis_help"

class Language(str, Enum):
    ENGLISH = "english"
    HINDI = "hindi"
    TAMIL = "tamil"
    TELUGU = "telugu"
    BENGALI = "bengali"
    MARATHI = "marathi"
    GUJARATI = "gujarati"
    KANNADA = "kannada"
    MALAYALAM = "malayalam"
    PUNJABI = "punjabi"

class ResourceCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=1000)
    resource_type: ResourceType
    category: ResourceCategory
    language: Language
    content_url: Optional[str] = None
    file_path: Optional[str] = None
    duration_minutes: Optional[int] = None  # For videos/audio
    difficulty_level: int = Field(1, ge=1, le=5)  # 1=beginner, 5=advanced
    tags: List[str] = []
    is_premium: bool = False

class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[ResourceCategory] = None
    content_url: Optional[str] = None
    file_path: Optional[str] = None
    duration_minutes: Optional[int] = None
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ResourceInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    title: str
    description: str
    resource_type: ResourceType
    category: ResourceCategory
    language: Language
    content_url: Optional[str] = None
    file_path: Optional[str] = None
    duration_minutes: Optional[int] = None
    difficulty_level: int
    tags: List[str] = []
    is_premium: bool = False
    is_active: bool = True
    view_count: int = 0
    rating_average: float = 0.0
    rating_count: int = 0
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class Resource(BaseModel):
    id: str
    title: str
    description: str
    resource_type: ResourceType
    category: ResourceCategory
    language: Language
    content_url: Optional[str] = None
    file_path: Optional[str] = None
    duration_minutes: Optional[int] = None
    difficulty_level: int
    tags: List[str] = []
    is_premium: bool
    is_active: bool
    view_count: int
    rating_average: float
    rating_count: int
    created_at: datetime

class ResourceRating(BaseModel):
    resource_id: str
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = Field(None, max_length=500)

class ResourceUsage(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    resource_id: PyObjectId
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    progress_percentage: int = Field(0, ge=0, le=100)
    rating: Optional[int] = Field(None, ge=1, le=5)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True