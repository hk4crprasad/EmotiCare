from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import logging

from app.database import get_database
from app.schemas.assessment import (
    Assessment, AssessmentCreate, AssessmentType, 
    AssessmentSummary, SeverityLevel
)
from app.schemas.user import User
from app.services.assessment_service import assessment_service
from app.utils.auth import get_current_user, get_counselor_or_admin

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=Assessment)
async def create_assessment(
    assessment_data: AssessmentCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new psychological assessment"""
    try:
        # Process assessment responses
        result = assessment_service.process_assessment(
            assessment_data.assessment_type,
            assessment_data.responses
        )
        
        # Create assessment document
        assessment_doc = {
            "user_id": ObjectId(current_user.id),
            "assessment_type": assessment_data.assessment_type,
            "responses": assessment_data.responses,
            "result": result.dict(),
            "notes": assessment_data.notes,
            "created_at": datetime.utcnow(),
            "administered_by": None  # Self-administered
        }
        
        # Insert to database
        result_db = await db.assessments.insert_one(assessment_doc)
        assessment_doc["_id"] = result_db.inserted_id
        
        # Convert to response format
        assessment = Assessment(
            id=str(result_db.inserted_id),
            user_id=current_user.id,
            assessment_type=assessment_data.assessment_type,
            responses=assessment_data.responses,
            result=result,
            notes=assessment_data.notes,
            created_at=assessment_doc["created_at"],
            administered_by=None
        )
        
        # Log critical results for admin attention
        if result.requires_immediate_attention:
            logger.critical(f"High-risk assessment result for user {current_user.id}: {assessment_data.assessment_type} - Score: {result.score}")
        
        logger.info(f"Assessment completed: {assessment_data.assessment_type} for user {current_user.id}")
        return assessment
        
    except Exception as e:
        logger.error(f"Error creating assessment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assessment"
        )

@router.get("/", response_model=List[Assessment])
async def get_user_assessments(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    assessment_type: Optional[AssessmentType] = None,
    limit: int = 10,
    skip: int = 0
):
    """Get user's assessment history"""
    try:
        query = {"user_id": ObjectId(current_user.id)}
        if assessment_type:
            query["assessment_type"] = assessment_type
        
        cursor = db.assessments.find(query).sort("created_at", -1).skip(skip).limit(limit)
        
        assessments = []
        async for assessment_doc in cursor:
            assessment = Assessment(
                id=str(assessment_doc["_id"]),
                user_id=current_user.id,
                assessment_type=assessment_doc["assessment_type"],
                responses=assessment_doc["responses"],
                result=assessment_doc["result"],
                notes=assessment_doc.get("notes"),
                created_at=assessment_doc["created_at"],
                administered_by=str(assessment_doc["administered_by"]) if assessment_doc.get("administered_by") else None
            )
            assessments.append(assessment)
        
        return assessments
        
    except Exception as e:
        logger.error(f"Error fetching assessments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch assessments"
        )

@router.get("/{assessment_id}", response_model=Assessment)
async def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific assessment"""
    try:
        assessment_doc = await db.assessments.find_one({
            "_id": ObjectId(assessment_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not assessment_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found"
            )
        
        assessment = Assessment(
            id=str(assessment_doc["_id"]),
            user_id=current_user.id,
            assessment_type=assessment_doc["assessment_type"],
            responses=assessment_doc["responses"],
            result=assessment_doc["result"],
            notes=assessment_doc.get("notes"),
            created_at=assessment_doc["created_at"],
            administered_by=str(assessment_doc["administered_by"]) if assessment_doc.get("administered_by") else None
        )
        
        return assessment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching assessment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch assessment"
        )

@router.get("/summary/dashboard", response_model=List[AssessmentSummary])
async def get_assessment_summary(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get assessment summary for user dashboard"""
    try:
        # Get latest assessment for each type
        pipeline = [
            {"$match": {"user_id": ObjectId(current_user.id)}},
            {"$sort": {"created_at": -1}},
            {"$group": {
                "_id": "$assessment_type",
                "latest_assessment": {"$first": "$$ROOT"}
            }}
        ]
        
        summaries = []
        async for group in db.assessments.aggregate(pipeline):
            latest = group["latest_assessment"]
            
            # Calculate trend (simplified - comparing with previous assessment)
            trend = "stable"  # Default
            
            # Get previous assessment of same type
            prev_assessment = await db.assessments.find_one({
                "user_id": ObjectId(current_user.id),
                "assessment_type": latest["assessment_type"],
                "created_at": {"$lt": latest["created_at"]}
            }, sort=[("created_at", -1)])
            
            if prev_assessment:
                current_score = latest["result"]["score"]
                prev_score = prev_assessment["result"]["score"]
                
                if current_score < prev_score - 2:
                    trend = "improving"
                elif current_score > prev_score + 2:
                    trend = "deteriorating"
            
            summary = AssessmentSummary(
                assessment_type=latest["assessment_type"],
                latest_score=latest["result"]["score"],
                severity_level=latest["result"]["severity_level"],
                assessment_date=latest["created_at"],
                trend=trend
            )
            summaries.append(summary)
        
        return summaries
        
    except Exception as e:
        logger.error(f"Error fetching assessment summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch assessment summary"
        )

@router.get("/types/available", response_model=List[dict])
async def get_available_assessments():
    """Get list of available assessment types"""
    assessments = [
        {
            "type": AssessmentType.PHQ9,
            "name": "PHQ-9 Depression Screening",
            "description": "Patient Health Questionnaire for depression screening",
            "duration_minutes": 5,
            "questions": 9
        },
        {
            "type": AssessmentType.GAD7,
            "name": "GAD-7 Anxiety Screening",
            "description": "Generalized Anxiety Disorder screening tool",
            "duration_minutes": 3,
            "questions": 7
        },
        {
            "type": AssessmentType.GHQ,
            "name": "General Health Questionnaire",
            "description": "General psychological well-being assessment",
            "duration_minutes": 10,
            "questions": 12
        },
        {
            "type": AssessmentType.STRESS_SCALE,
            "name": "Stress Assessment Scale",
            "description": "Perceived stress and coping assessment",
            "duration_minutes": 8,
            "questions": 10
        },
        {
            "type": AssessmentType.SLEEP_QUALITY,
            "name": "Sleep Quality Index",
            "description": "Sleep quality and sleep disorders screening",
            "duration_minutes": 5,
            "questions": 8
        }
    ]
    
    return assessments

@router.get("/questions/{assessment_type}", response_model=dict)
async def get_assessment_questions(assessment_type: AssessmentType):
    """Get questions for a specific assessment type"""
    questions = {
        AssessmentType.PHQ9: {
            "title": "PHQ-9 Depression Screening",
            "instructions": "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
            "scale": {
                "0": "Not at all",
                "1": "Several days", 
                "2": "More than half the days",
                "3": "Nearly every day"
            },
            "questions": [
                {"key": "little_interest", "text": "Little interest or pleasure in doing things"},
                {"key": "feeling_down", "text": "Feeling down, depressed, or hopeless"},
                {"key": "trouble_sleeping", "text": "Trouble falling or staying asleep, or sleeping too much"},
                {"key": "feeling_tired", "text": "Feeling tired or having little energy"},
                {"key": "poor_appetite", "text": "Poor appetite or overeating"},
                {"key": "feeling_bad", "text": "Feeling bad about yourself - or that you are a failure or have let yourself or your family down"},
                {"key": "trouble_concentrating", "text": "Trouble concentrating on things, such as reading the newspaper or watching television"},
                {"key": "moving_slowly", "text": "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual"},
                {"key": "thoughts_death", "text": "Thoughts that you would be better off dead, or of hurting yourself"}
            ]
        },
        AssessmentType.GAD7: {
            "title": "GAD-7 Anxiety Screening",
            "instructions": "Over the last 2 weeks, how often have you been bothered by the following problems?",
            "scale": {
                "0": "Not at all",
                "1": "Several days",
                "2": "More than half the days", 
                "3": "Nearly every day"
            },
            "questions": [
                {"key": "feeling_nervous", "text": "Feeling nervous, anxious, or on edge"},
                {"key": "not_able_stop_worry", "text": "Not being able to stop or control worrying"},
                {"key": "worrying_too_much", "text": "Worrying too much about different things"},
                {"key": "trouble_relaxing", "text": "Trouble relaxing"},
                {"key": "restless", "text": "Being so restless that it is hard to sit still"},
                {"key": "easily_annoyed", "text": "Becoming easily annoyed or irritable"},
                {"key": "feeling_afraid", "text": "Feeling afraid, as if something awful might happen"}
            ]
        }
    }
    
    if assessment_type not in questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment type not found"
        )
    
    return questions[assessment_type]

# Counselor/Admin endpoints
@router.get("/admin/high-risk", response_model=List[dict])
async def get_high_risk_assessments(
    counselor: User = Depends(get_counselor_or_admin),
    db = Depends(get_database),
    days: int = 7
):
    """Get high-risk assessments for counselor review"""
    try:
        # Get assessments from last N days that require attention
        from datetime import datetime, timedelta
        
        since_date = datetime.utcnow() - timedelta(days=days)
        
        cursor = db.assessments.find({
            "created_at": {"$gte": since_date},
            "$or": [
                {"result.requires_immediate_attention": True},
                {"result.risk_level": "high"},
                {"result.risk_level": "critical"}
            ]
        }).sort("created_at", -1)
        
        high_risk_assessments = []
        async for assessment_doc in cursor:
            # Get user info (anonymized)
            user_doc = await db.users.find_one({"_id": assessment_doc["user_id"]})
            
            assessment_info = {
                "assessment_id": str(assessment_doc["_id"]),
                "user_info": {
                    "id": str(user_doc["_id"]),
                    "department": user_doc.get("department", "Unknown"),
                    "year_of_study": user_doc.get("year_of_study", "Unknown"),
                    "age_group": f"{(user_doc.get('age', 20) // 5) * 5}-{((user_doc.get('age', 20) // 5) * 5) + 4}" if user_doc.get('age') else "Unknown"
                },
                "assessment_type": assessment_doc["assessment_type"],
                "score": assessment_doc["result"]["score"],
                "severity_level": assessment_doc["result"]["severity_level"],
                "risk_level": assessment_doc["result"]["risk_level"],
                "requires_immediate_attention": assessment_doc["result"]["requires_immediate_attention"],
                "created_at": assessment_doc["created_at"],
                "recommendations": assessment_doc["result"]["recommendations"]
            }
            high_risk_assessments.append(assessment_info)
        
        return high_risk_assessments
        
    except Exception as e:
        logger.error(f"Error fetching high-risk assessments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch high-risk assessments"
        )