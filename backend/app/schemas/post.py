from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from app.schemas.user import PyObjectId

class PostType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    LINK = "link"
    POLL = "poll"

class PostStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    FLAGGED = "flagged"
    REMOVED = "removed"

class PostVisibility(str, Enum):
    PUBLIC = "public"
    FOLLOWERS = "followers"
    FRIENDS = "friends"
    PRIVATE = "private"

class PostCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., max_length=5000)
    post_type: PostType = PostType.TEXT
    image_url: Optional[str] = None
    image_alt_text: Optional[str] = Field(None, max_length=500)
    video_url: Optional[str] = None
    link_url: Optional[str] = None
    link_title: Optional[str] = Field(None, max_length=200)
    link_description: Optional[str] = Field(None, max_length=500)
    hashtags: List[str] = []
    mentions: List[str] = []  # User IDs or usernames
    visibility: PostVisibility = PostVisibility.PUBLIC
    allow_comments: bool = True
    allow_shares: bool = True
    is_anonymous: bool = False
    location: Optional[str] = Field(None, max_length=100)
    scheduled_at: Optional[datetime] = None
    
    @validator('hashtags')
    def validate_hashtags(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 hashtags allowed')
        for tag in v:
            if not tag.startswith('#'):
                raise ValueError('Hashtags must start with #')
            if len(tag) > 50:
                raise ValueError('Hashtag too long (max 50 characters)')
        return v

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None, max_length=5000)
    image_url: Optional[str] = None
    image_alt_text: Optional[str] = Field(None, max_length=500)
    video_url: Optional[str] = None
    link_url: Optional[str] = None
    link_title: Optional[str] = Field(None, max_length=200)
    link_description: Optional[str] = Field(None, max_length=500)
    hashtags: Optional[List[str]] = None
    mentions: Optional[List[str]] = None
    visibility: Optional[PostVisibility] = None
    allow_comments: Optional[bool] = None
    allow_shares: Optional[bool] = None
    location: Optional[str] = Field(None, max_length=100)
    status: Optional[PostStatus] = None

class PostInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    author_id: PyObjectId
    title: Optional[str] = None
    content: str
    post_type: PostType
    image_url: Optional[str] = None
    image_alt_text: Optional[str] = None
    video_url: Optional[str] = None
    link_url: Optional[str] = None
    link_title: Optional[str] = None
    link_description: Optional[str] = None
    hashtags: List[str] = []
    mentions: List[PyObjectId] = []
    visibility: PostVisibility
    allow_comments: bool = True
    allow_shares: bool = True
    is_anonymous: bool = False
    location: Optional[str] = None
    status: PostStatus = PostStatus.PUBLISHED
    
    # Engagement metrics
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    views_count: int = 0
    
    # Moderation
    flagged_count: int = 0
    flagged_by: List[PyObjectId] = []
    moderated_by: Optional[PyObjectId] = None
    moderation_notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class Post(BaseModel):
    id: str
    author_id: str
    author_name: Optional[str] = None
    author_avatar: Optional[str] = None
    title: Optional[str] = None
    content: str
    post_type: PostType
    image_url: Optional[str] = None
    image_alt_text: Optional[str] = None
    video_url: Optional[str] = None
    link_url: Optional[str] = None
    link_title: Optional[str] = None
    link_description: Optional[str] = None
    hashtags: List[str] = []
    mentions: List[str] = []
    visibility: PostVisibility
    allow_comments: bool
    allow_shares: bool
    is_anonymous: bool
    location: Optional[str] = None
    status: PostStatus
    
    # Engagement metrics
    likes_count: int
    comments_count: int
    shares_count: int
    views_count: int
    
    # User interaction flags
    user_liked: bool = False
    user_shared: bool = False
    user_bookmarked: bool = False
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

class PostComment(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    post_id: PyObjectId
    author_id: PyObjectId
    content: str = Field(..., max_length=1000)
    parent_comment_id: Optional[PyObjectId] = None  # For replies
    is_anonymous: bool = False
    likes_count: int = 0
    flagged_count: int = 0
    flagged_by: List[PyObjectId] = []
    status: PostStatus = PostStatus.PUBLISHED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class PostLike(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    post_id: PyObjectId
    user_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class PostShare(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    post_id: PyObjectId
    user_id: PyObjectId
    share_message: Optional[str] = Field(None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class PostBookmark(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    post_id: PyObjectId
    user_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class PostReport(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    post_id: PyObjectId
    reporter_id: PyObjectId
    reason: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: str = "pending"  # pending, reviewed, resolved, dismissed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[PyObjectId] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class HashtagStats(BaseModel):
    hashtag: str
    post_count: int
    recent_posts: List[str]  # Post IDs
    trending_score: float = 0.0

class PostFeed(BaseModel):
    posts: List[Post]
    total_count: int
    has_more: bool
    next_cursor: Optional[str] = None

class PostSearchQuery(BaseModel):
    query: Optional[str] = None
    hashtags: Optional[List[str]] = None
    author_id: Optional[str] = None
    post_type: Optional[PostType] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    location: Optional[str] = None
    sort_by: str = "created_at"  # created_at, likes_count, comments_count, relevance
    sort_order: str = "desc"  # asc, desc
    limit: int = Field(20, le=100)
    offset: int = 0