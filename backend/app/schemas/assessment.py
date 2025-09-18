from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from app.schemas.user import PyObjectId

class AssessmentType(str, Enum):
    PHQ9 = "phq9"  # Patient Health Questionnaire-9 (Depression)
    GAD7 = "gad7"  # Generalized Anxiety Disorder-7
    GHQ = "ghq"    # General Health Questionnaire
    BIG_FIVE = "big_five"  # Big Five Personality Test
    STRESS_SCALE = "stress_scale"
    SLEEP_QUALITY = "sleep_quality"

class SeverityLevel(str, Enum):
    MINIMAL = "minimal"
    MILD = "mild"
    MODERATE = "moderate"
    MODERATELY_SEVERE = "moderately_severe"
    SEVERE = "severe"

class PHQ9Response(BaseModel):
    """PHQ-9 Depression Assessment Responses"""
    little_interest: int = Field(..., ge=0, le=3)  # Little interest or pleasure in doing things
    feeling_down: int = Field(..., ge=0, le=3)     # Feeling down, depressed, or hopeless
    trouble_sleeping: int = Field(..., ge=0, le=3)  # Trouble falling/staying asleep, sleeping too much
    feeling_tired: int = Field(..., ge=0, le=3)     # Feeling tired or having little energy
    poor_appetite: int = Field(..., ge=0, le=3)     # Poor appetite or overeating
    feeling_bad: int = Field(..., ge=0, le=3)       # Feeling bad about yourself
    trouble_concentrating: int = Field(..., ge=0, le=3)  # Trouble concentrating
    moving_slowly: int = Field(..., ge=0, le=3)     # Moving or speaking slowly/fidgety
    thoughts_death: int = Field(..., ge=0, le=3)    # Thoughts of being better off dead

class GAD7Response(BaseModel):
    """GAD-7 Anxiety Assessment Responses"""
    feeling_nervous: int = Field(..., ge=0, le=3)   # Feeling nervous, anxious, or on edge
    not_able_stop_worry: int = Field(..., ge=0, le=3)  # Not being able to stop or control worrying
    worrying_too_much: int = Field(..., ge=0, le=3)    # Worrying too much about different things
    trouble_relaxing: int = Field(..., ge=0, le=3)     # Trouble relaxing
    restless: int = Field(..., ge=0, le=3)             # Being so restless that it's hard to sit still
    easily_annoyed: int = Field(..., ge=0, le=3)       # Becoming easily annoyed or irritable
    feeling_afraid: int = Field(..., ge=0, le=3)       # Feeling afraid as if something awful might happen

class AssessmentCreate(BaseModel):
    assessment_type: AssessmentType
    responses: Dict[str, Any]  # Flexible responses based on assessment type
    notes: Optional[str] = None

class AssessmentResult(BaseModel):
    score: int
    severity_level: SeverityLevel
    interpretation: str
    recommendations: List[str]
    risk_level: str  # low, medium, high
    requires_immediate_attention: bool = False

class AssessmentInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    assessment_type: AssessmentType
    responses: Dict[str, Any]
    result: AssessmentResult
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    administered_by: Optional[PyObjectId] = None  # Counselor or system
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class Assessment(BaseModel):
    id: str
    user_id: str
    assessment_type: AssessmentType
    responses: Dict[str, Any]
    result: AssessmentResult
    notes: Optional[str] = None
    created_at: datetime
    administered_by: Optional[str] = None

class AssessmentSummary(BaseModel):
    """Summary for dashboard and analytics"""
    assessment_type: AssessmentType
    latest_score: int
    severity_level: SeverityLevel
    assessment_date: datetime
    trend: str  # improving, stable, deteriorating