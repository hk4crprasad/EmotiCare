from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from app.schemas.user import PyObjectId

class PostStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED = "flagged"

class PostCategory(str, Enum):
    GENERAL_SUPPORT = "general_support"
    ACADEMIC_STRESS = "academic_stress"
    ANXIETY = "anxiety"
    DEPRESSION = "depression"
    RELATIONSHIPS = "relationships"
    FAMILY_ISSUES = "family_issues"
    CAREER_CONCERNS = "career_concerns"
    SOCIAL_ANXIETY = "social_anxiety"
    SELF_ESTEEM = "self_esteem"
    SUCCESS_STORIES = "success_stories"

class PostCreate(BaseModel):
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=2000)
    category: PostCategory
    is_anonymous: bool = True
    tags: List[str] = []

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None, max_length=2000)
    category: Optional[PostCategory] = None
    tags: Optional[List[str]] = None

class PostInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    author_id: PyObjectId
    title: str
    content: str
    category: PostCategory
    is_anonymous: bool = True
    tags: List[str] = []
    status: PostStatus = PostStatus.PENDING
    upvotes: int = 0
    downvotes: int = 0
    reply_count: int = 0
    view_count: int = 0
    is_pinned: bool = False
    moderated_by: Optional[PyObjectId] = None
    moderation_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class Post(BaseModel):
    id: str
    title: str
    content: str
    category: PostCategory
    is_anonymous: bool
    tags: List[str]
    status: PostStatus
    upvotes: int
    downvotes: int
    reply_count: int
    view_count: int
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    author_name: Optional[str] = None  # Only if not anonymous

class ReplyCreate(BaseModel):
    content: str = Field(..., max_length=1000)
    is_anonymous: bool = True

class ReplyInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    post_id: PyObjectId
    author_id: PyObjectId
    content: str
    is_anonymous: bool = True
    upvotes: int = 0
    downvotes: int = 0
    status: PostStatus = PostStatus.APPROVED  # Replies auto-approved unless flagged
    flagged_by: List[PyObjectId] = []
    moderated_by: Optional[PyObjectId] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class Reply(BaseModel):
    id: str
    post_id: str
    content: str
    is_anonymous: bool
    upvotes: int
    downvotes: int
    status: PostStatus
    created_at: datetime
    author_name: Optional[str] = None  # Only if not anonymous

class VoteAction(str, Enum):
    UPVOTE = "upvote"
    DOWNVOTE = "downvote"
    REMOVE_VOTE = "remove_vote"

class Vote(BaseModel):
    action: VoteAction