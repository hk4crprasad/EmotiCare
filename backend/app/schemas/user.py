from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any, Annotated
from datetime import datetime
from enum import Enum
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2"""
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class UserRole(str, Enum):
    STUDENT = "student"
    COUNSELOR = "counselor"
    ADMIN = "admin"
    PEER_VOLUNTEER = "peer_volunteer"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non_binary"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class YearOfStudy(str, Enum):
    FIRST_YEAR = "first_year"
    SECOND_YEAR = "second_year"
    THIRD_YEAR = "third_year"
    FOURTH_YEAR = "fourth_year"
    POSTGRADUATE = "postgraduate"
    PHD = "phd"

class UserBase(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )
    
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.STUDENT
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    student_id: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[YearOfStudy] = None
    gender: Optional[Gender] = None
    age: Optional[int] = Field(None, ge=16, le=100)
    phone_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    
    @field_validator('student_id')
    @classmethod
    def validate_student_id(cls, v, info):
        if info.data.get('role') == UserRole.STUDENT and not v:
            raise ValueError('Student ID is required for students')
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    department: Optional[str] = None
    year_of_study: Optional[YearOfStudy] = None
    phone_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    student_id: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[YearOfStudy] = None
    gender: Optional[Gender] = None
    age: Optional[int] = None
    phone_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class User(UserBase):
    id: str
    student_id: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[YearOfStudy] = None
    gender: Optional[Gender] = None
    age: Optional[int] = None
    phone_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: User

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None