from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId

class BaseModel:
    """Base model for MongoDB documents"""
    
    def __init__(self, **kwargs):
        self._id = kwargs.get('_id', ObjectId())
        self.created_at = kwargs.get('created_at', datetime.utcnow())
        self.updated_at = kwargs.get('updated_at', datetime.utcnow())
    
    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        result = {}
        for key, value in self.__dict__.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create model from dictionary"""
        return cls(**data)

class UserModel(BaseModel):
    """User model for MongoDB"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.email = kwargs.get('email')
        self.full_name = kwargs.get('full_name')
        self.hashed_password = kwargs.get('hashed_password')
        self.role = kwargs.get('role', 'student')
        self.student_id = kwargs.get('student_id')
        self.department = kwargs.get('department')
        self.year_of_study = kwargs.get('year_of_study')
        self.gender = kwargs.get('gender')
        self.age = kwargs.get('age')
        self.phone_number = kwargs.get('phone_number')
        self.emergency_contact = kwargs.get('emergency_contact')
        self.is_active = kwargs.get('is_active', True)
        self.last_login = kwargs.get('last_login')

class AssessmentModel(BaseModel):
    """Assessment model for MongoDB"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.user_id = kwargs.get('user_id')
        self.assessment_type = kwargs.get('assessment_type')
        self.responses = kwargs.get('responses', {})
        self.result = kwargs.get('result', {})
        self.notes = kwargs.get('notes')
        self.administered_by = kwargs.get('administered_by')

class AppointmentModel(BaseModel):
    """Appointment model for MongoDB"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.student_id = kwargs.get('student_id')
        self.counselor_id = kwargs.get('counselor_id')
        self.appointment_date = kwargs.get('appointment_date')
        self.appointment_time = kwargs.get('appointment_time')
        self.appointment_type = kwargs.get('appointment_type')
        self.mode = kwargs.get('mode', 'in_person')
        self.status = kwargs.get('status', 'scheduled')
        self.reason = kwargs.get('reason')
        self.is_emergency = kwargs.get('is_emergency', False)
        self.preferred_language = kwargs.get('preferred_language', 'english')
        self.counselor_notes = kwargs.get('counselor_notes')
        self.student_notes = kwargs.get('student_notes')
        self.cancelled_by = kwargs.get('cancelled_by')
        self.cancellation_reason = kwargs.get('cancellation_reason')
        self.reminder_sent = kwargs.get('reminder_sent', False)

class ChatSessionModel(BaseModel):
    """Chat session model for MongoDB"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.user_id = kwargs.get('user_id')
        self.messages = kwargs.get('messages', [])
        self.status = kwargs.get('status', 'active')
        self.emotional_state = kwargs.get('emotional_state')
        self.crisis_indicators = kwargs.get('crisis_indicators', [])
        self.intervention_triggered = kwargs.get('intervention_triggered', False)
        self.counselor_notified = kwargs.get('counselor_notified', False)
        self.session_summary = kwargs.get('session_summary')
        self.ended_at = kwargs.get('ended_at')

class ResourceModel(BaseModel):
    """Resource model for MongoDB"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.title = kwargs.get('title')
        self.description = kwargs.get('description')
        self.resource_type = kwargs.get('resource_type')
        self.category = kwargs.get('category')
        self.language = kwargs.get('language', 'english')
        self.content_url = kwargs.get('content_url')
        self.file_path = kwargs.get('file_path')
        self.duration_minutes = kwargs.get('duration_minutes')
        self.difficulty_level = kwargs.get('difficulty_level', 1)
        self.tags = kwargs.get('tags', [])
        self.is_premium = kwargs.get('is_premium', False)
        self.is_active = kwargs.get('is_active', True)
        self.view_count = kwargs.get('view_count', 0)
        self.rating_average = kwargs.get('rating_average', 0.0)
        self.rating_count = kwargs.get('rating_count', 0)
        self.created_by = kwargs.get('created_by')

class PostModel(BaseModel):
    """Peer support post model for MongoDB"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.author_id = kwargs.get('author_id')
        self.title = kwargs.get('title')
        self.content = kwargs.get('content')
        self.category = kwargs.get('category')
        self.is_anonymous = kwargs.get('is_anonymous', True)
        self.tags = kwargs.get('tags', [])
        self.status = kwargs.get('status', 'pending')
        self.upvotes = kwargs.get('upvotes', 0)
        self.downvotes = kwargs.get('downvotes', 0)
        self.reply_count = kwargs.get('reply_count', 0)
        self.view_count = kwargs.get('view_count', 0)
        self.is_pinned = kwargs.get('is_pinned', False)
        self.moderated_by = kwargs.get('moderated_by')
        self.moderation_notes = kwargs.get('moderation_notes')

class ReplyModel(BaseModel):
    """Reply model for MongoDB"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.post_id = kwargs.get('post_id')
        self.author_id = kwargs.get('author_id')
        self.content = kwargs.get('content')
        self.is_anonymous = kwargs.get('is_anonymous', True)
        self.upvotes = kwargs.get('upvotes', 0)
        self.downvotes = kwargs.get('downvotes', 0)
        self.status = kwargs.get('status', 'approved')
        self.flagged_by = kwargs.get('flagged_by', [])
        self.moderated_by = kwargs.get('moderated_by')

# Collections mapping
COLLECTIONS = {
    'users': UserModel,
    'assessments': AssessmentModel,
    'appointments': AppointmentModel,
    'chat_sessions': ChatSessionModel,
    'resources': ResourceModel,
    'peer_posts': PostModel,
    'peer_replies': ReplyModel,
}