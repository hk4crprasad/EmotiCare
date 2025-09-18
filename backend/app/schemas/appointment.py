from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from enum import Enum
from app.schemas.user import PyObjectId

class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class AppointmentType(str, Enum):
    INDIVIDUAL = "individual"
    GROUP = "group"
    CRISIS = "crisis"
    FOLLOW_UP = "follow_up"
    ASSESSMENT = "assessment"

class AppointmentMode(str, Enum):
    IN_PERSON = "in_person"
    VIDEO_CALL = "video_call"
    PHONE_CALL = "phone_call"

class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EMERGENCY = "emergency"

class BookingRequest(BaseModel):
    counselor_id: str
    appointment_date: date
    start_time: str  # Format: "HH:MM"
    end_time: str    # Format: "HH:MM"
    appointment_type: str = "individual"
    mode: str = "in_person"
    reason: str = Field(..., max_length=500)
    urgency_level: str = "medium"
    notes: Optional[str] = None

class BookingResponse(BaseModel):
    appointment_id: str
    status: str
    counselor_name: str
    appointment_date: date
    start_time: str
    end_time: str
    message: str

class AppointmentSlot(BaseModel):
    counselor_id: str
    counselor_name: str
    date: date
    start_time: str
    end_time: str
    appointment_type: str
    available: bool = True

class CounselorAvailability(BaseModel):
    monday: Dict[str, Any] = {"start": "09:00", "end": "17:00", "available": True}
    tuesday: Dict[str, Any] = {"start": "09:00", "end": "17:00", "available": True}
    wednesday: Dict[str, Any] = {"start": "09:00", "end": "17:00", "available": True}
    thursday: Dict[str, Any] = {"start": "09:00", "end": "17:00", "available": True}
    friday: Dict[str, Any] = {"start": "09:00", "end": "17:00", "available": True}
    saturday: Dict[str, Any] = {"start": "10:00", "end": "14:00", "available": False}
    sunday: Dict[str, Any] = {"start": "10:00", "end": "14:00", "available": False}

class AppointmentCreate(BaseModel):
    counselor_id: str
    appointment_date: date
    start_time: str
    end_time: str
    appointment_type: str = "individual"
    mode: str = "in_person"
    reason: str = Field(..., max_length=500)
    urgency_level: str = "medium"
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    mode: Optional[str] = None
    reason: Optional[str] = None
    counselor_notes: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str
    student_id: str
    student_name: Optional[str] = None
    counselor_id: str
    counselor_name: str
    appointment_date: date
    start_time: str
    end_time: str
    appointment_type: str
    mode: str
    reason: str
    urgency_level: str
    status: str
    notes: Optional[str] = None
    counselor_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class AppointmentInDB(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    student_id: str
    counselor_id: str
    appointment_date: date
    start_time: str
    end_time: str
    appointment_type: str
    mode: str
    status: str = "scheduled"
    reason: str
    urgency_level: str = "medium"
    notes: Optional[str] = None
    counselor_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Appointment(BaseModel):
    """Main appointment model for API responses"""
    model_config = ConfigDict(populate_by_name=True)
    
    id: str
    student_id: str
    counselor_id: str
    appointment_date: date
    start_time: str
    end_time: str
    appointment_type: str
    mode: str
    status: str
    reason: str
    urgency_level: str
    notes: Optional[str] = None
    counselor_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime