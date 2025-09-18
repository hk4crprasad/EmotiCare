from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum
from app.schemas.user import PyObjectId

class MetricType(str, Enum):
    USER_REGISTRATIONS = "user_registrations"
    ASSESSMENT_COMPLETIONS = "assessment_completions"
    CHAT_SESSIONS = "chat_sessions"
    APPOINTMENTS_BOOKED = "appointments_booked"
    RESOURCE_VIEWS = "resource_views"
    PEER_SUPPORT_POSTS = "peer_support_posts"
    CRISIS_INTERVENTIONS = "crisis_interventions"

class TimePeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class DashboardMetrics(BaseModel):
    total_users: int
    active_users_today: int
    active_users_week: int
    total_assessments: int
    assessments_this_week: int
    high_risk_users: int
    pending_appointments: int
    completed_appointments_today: int
    chat_sessions_today: int
    crisis_interventions_week: int

class UserAnalytics(BaseModel):
    user_id: str
    risk_level: str  # low, medium, high
    last_assessment_date: Optional[date]
    last_chat_session: Optional[datetime]
    total_sessions: int
    improvement_trend: str  # improving, stable, deteriorating
    recommended_actions: List[str]

class AssessmentTrend(BaseModel):
    assessment_type: str
    date: date
    average_score: float
    high_risk_count: int
    total_assessments: int

class CrisisAlert(BaseModel):
    id: str
    user_id: str
    alert_type: str
    severity: str  # low, medium, high, critical
    description: str
    triggered_at: datetime
    resolved_at: Optional[datetime]
    handled_by: Optional[str]
    status: str  # active, resolved, escalated

class InterventionPlan(BaseModel):
    target_metric: MetricType
    goal_value: float
    current_value: float
    timeline_days: int
    strategies: List[str]
    assigned_to: Optional[str]
    created_at: datetime

class InstitutionReport(BaseModel):
    institution_id: str
    report_period: TimePeriod
    start_date: date
    end_date: date
    metrics: DashboardMetrics
    trends: List[AssessmentTrend]
    high_risk_students: int
    interventions_made: int
    resource_utilization: Dict[str, int]
    recommendations: List[str]
    generated_at: datetime

class AnonymousUserData(BaseModel):
    """Anonymized user data for analytics"""
    age_group: str  # 18-20, 21-23, 24+
    gender: str
    year_of_study: str
    department_category: str  # STEM, Arts, Commerce, etc.
    risk_indicators: List[str]
    engagement_level: str  # low, medium, high