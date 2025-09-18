from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
from bson import ObjectId
import logging

from app.database import get_database
from app.schemas.admin import (
    DashboardMetrics, UserAnalytics, AssessmentTrend, CrisisAlert,
    InterventionPlan, InstitutionReport, AnonymousUserData,
    MetricType, TimePeriod
)
from app.schemas.user import User, UserRole
from app.utils.auth import get_admin_user, get_counselor_or_admin
from app.services.notification_service import notification_service
from app.services.chat_service import mental_health_chat

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_database)
):
    """Get comprehensive dashboard metrics"""
    try:
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        
        # Total users
        total_users = await db.users.count_documents({"is_active": True})
        
        # Active users today
        active_today = await db.chat_sessions.count_documents({
            "created_at": {"$gte": today_start}
        })
        
        # Active users this week
        active_week = await db.chat_sessions.count_documents({
            "created_at": {"$gte": week_start}
        })
        
        # Total assessments
        total_assessments = await db.assessments.count_documents({})
        
        # Assessments this week
        assessments_week = await db.assessments.count_documents({
            "created_at": {"$gte": week_start}
        })
        
        # High-risk users (based on recent assessments)
        high_risk_pipeline = [
            {"$match": {"created_at": {"$gte": week_start}}},
            {"$match": {
                "$or": [
                    {"result.risk_level": "high"},
                    {"result.risk_level": "critical"},
                    {"result.requires_immediate_attention": True}
                ]
            }},
            {"$group": {"_id": "$user_id"}},
            {"$count": "high_risk_count"}
        ]
        
        high_risk_result = await db.assessments.aggregate(high_risk_pipeline).to_list(1)
        high_risk_users = high_risk_result[0]["high_risk_count"] if high_risk_result else 0
        
        # Pending appointments
        pending_appointments = await db.appointments.count_documents({
            "status": "scheduled",
            "appointment_date": {"$gte": datetime.now().date()}
        })
        
        # Completed appointments today
        completed_today = await db.appointments.count_documents({
            "status": "completed",
            "appointment_date": today_start.date()
        })
        
        # Chat sessions today
        chat_sessions_today = await db.chat_sessions.count_documents({
            "created_at": {"$gte": today_start}
        })
        
        # Crisis interventions this week
        crisis_interventions = await db.chat_sessions.count_documents({
            "created_at": {"$gte": week_start},
            "intervention_triggered": True
        })
        
        metrics = DashboardMetrics(
            total_users=total_users,
            active_users_today=active_today,
            active_users_week=active_week,
            total_assessments=total_assessments,
            assessments_this_week=assessments_week,
            high_risk_users=high_risk_users,
            pending_appointments=pending_appointments,
            completed_appointments_today=completed_today,
            chat_sessions_today=chat_sessions_today,
            crisis_interventions_week=crisis_interventions
        )
        
        return metrics
        
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard metrics"
        )

@router.get("/users/analytics", response_model=List[UserAnalytics])
async def get_user_analytics(
    admin_user: User = Depends(get_counselor_or_admin),
    db = Depends(get_database),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    limit: int = Query(50, le=200),
    skip: int = 0
):
    """Get user analytics with risk assessment"""
    try:
        # Build aggregation pipeline
        pipeline = [
            {"$match": {"role": "student", "is_active": True}},
            {"$lookup": {
                "from": "assessments",
                "localField": "_id",
                "foreignField": "user_id",
                "as": "assessments"
            }},
            {"$lookup": {
                "from": "chat_sessions",
                "localField": "_id", 
                "foreignField": "user_id",
                "as": "chat_sessions"
            }},
            {"$addFields": {
                "latest_assessment": {"$arrayElemAt": [{"$sortArray": {"input": "$assessments", "sortBy": {"created_at": -1}}}, 0]},
                "total_sessions": {"$size": "$chat_sessions"},
                "latest_chat": {"$arrayElemAt": [{"$sortArray": {"input": "$chat_sessions", "sortBy": {"created_at": -1}}}, 0]}
            }}
        ]
        
        if risk_level:
            pipeline.append({"$match": {"latest_assessment.result.risk_level": risk_level}})
        
        pipeline.extend([
            {"$skip": skip},
            {"$limit": limit}
        ])
        
        analytics = []
        async for user_doc in db.users.aggregate(pipeline):
            latest_assessment = user_doc.get("latest_assessment")
            latest_chat = user_doc.get("latest_chat")
            
            # Determine risk level
            risk_level_val = "low"
            if latest_assessment:
                risk_level_val = latest_assessment.get("result", {}).get("risk_level", "low")
            
            # Calculate improvement trend (simplified)
            trend = "stable"
            if len(user_doc.get("assessments", [])) >= 2:
                assessments = sorted(user_doc["assessments"], key=lambda x: x["created_at"], reverse=True)
                if len(assessments) >= 2:
                    current_score = assessments[0]["result"]["score"]
                    prev_score = assessments[1]["result"]["score"]
                    if current_score < prev_score - 3:
                        trend = "improving"
                    elif current_score > prev_score + 3:
                        trend = "deteriorating"
            
            # Generate recommendations
            recommendations = []
            if risk_level_val in ["high", "critical"]:
                recommendations.append("Schedule immediate counseling session")
            if user_doc["total_sessions"] == 0:
                recommendations.append("Encourage engagement with support system")
            if not latest_assessment:
                recommendations.append("Complete mental health assessment")
            
            analytics_item = UserAnalytics(
                user_id=str(user_doc["_id"]),
                risk_level=risk_level_val,
                last_assessment_date=latest_assessment["created_at"].date() if latest_assessment else None,
                last_chat_session=latest_chat["created_at"] if latest_chat else None,
                total_sessions=user_doc["total_sessions"],
                improvement_trend=trend,
                recommended_actions=recommendations
            )
            analytics.append(analytics_item)
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error fetching user analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user analytics"
        )

@router.get("/trends/assessments", response_model=List[AssessmentTrend])
async def get_assessment_trends(
    admin_user: User = Depends(get_counselor_or_admin),
    db = Depends(get_database),
    days: int = Query(30, description="Number of days to analyze"),
    assessment_type: Optional[str] = Query(None, description="Filter by assessment type")
):
    """Get assessment trends over time"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Build aggregation pipeline
        match_stage = {"created_at": {"$gte": start_date}}
        if assessment_type:
            match_stage["assessment_type"] = assessment_type
        
        pipeline = [
            {"$match": match_stage},
            {"$addFields": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}
            }},
            {"$group": {
                "_id": {
                    "date": "$date",
                    "assessment_type": "$assessment_type"
                },
                "average_score": {"$avg": "$result.score"},
                "high_risk_count": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$result.risk_level", ["high", "critical"]]},
                            1, 0
                        ]
                    }
                },
                "total_assessments": {"$sum": 1}
            }},
            {"$sort": {"_id.date": 1}}
        ]
        
        trends = []
        async for trend_doc in db.assessments.aggregate(pipeline):
            trend = AssessmentTrend(
                assessment_type=trend_doc["_id"]["assessment_type"],
                date=datetime.strptime(trend_doc["_id"]["date"], "%Y-%m-%d").date(),
                average_score=round(trend_doc["average_score"], 2),
                high_risk_count=trend_doc["high_risk_count"],
                total_assessments=trend_doc["total_assessments"]
            )
            trends.append(trend)
        
        return trends
        
    except Exception as e:
        logger.error(f"Error fetching assessment trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch assessment trends"
        )

@router.get("/alerts/crisis", response_model=List[CrisisAlert])
async def get_crisis_alerts(
    admin_user: User = Depends(get_counselor_or_admin),
    db = Depends(get_database),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    days: int = Query(7, description="Number of days to look back")
):
    """Get crisis alerts for review"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Find high-risk assessments and chat sessions
        crisis_assessments = []
        
        # Get crisis assessments
        assessment_cursor = db.assessments.find({
            "created_at": {"$gte": start_date},
            "$or": [
                {"result.requires_immediate_attention": True},
                {"result.risk_level": "critical"}
            ]
        })
        
        async for assessment in assessment_cursor:
            user_doc = await db.users.find_one({"_id": assessment["user_id"]})
            
            alert = CrisisAlert(
                id=str(assessment["_id"]),
                user_id=str(assessment["user_id"]),
                alert_type="assessment_crisis",
                severity="critical" if assessment["result"]["requires_immediate_attention"] else "high",
                description=f"High-risk {assessment['assessment_type']} assessment (Score: {assessment['result']['score']})",
                triggered_at=assessment["created_at"],
                resolved_at=None,
                handled_by=None,
                status="active"
            )
            crisis_assessments.append(alert)
        
        # Get crisis chat sessions
        chat_cursor = db.chat_sessions.find({
            "created_at": {"$gte": start_date},
            "intervention_triggered": True
        })
        
        async for chat in chat_cursor:
            alert = CrisisAlert(
                id=str(chat["_id"]),
                user_id=str(chat["user_id"]),
                alert_type="chat_crisis",
                severity="critical",
                description=f"Crisis indicators detected in chat: {', '.join(chat.get('crisis_indicators', []))}",
                triggered_at=chat["created_at"],
                resolved_at=chat.get("ended_at"),
                handled_by=None,
                status="resolved" if chat.get("ended_at") else "active"
            )
            crisis_assessments.append(alert)
        
        # Filter by status if provided
        if status_filter:
            crisis_assessments = [alert for alert in crisis_assessments if alert.status == status_filter]
        
        # Sort by triggered_at (most recent first)
        crisis_assessments.sort(key=lambda x: x.triggered_at, reverse=True)
        
        return crisis_assessments
        
    except Exception as e:
        logger.error(f"Error fetching crisis alerts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch crisis alerts"
        )

@router.post("/alerts/{alert_id}/resolve", response_model=dict)
async def resolve_crisis_alert(
    alert_id: str,
    admin_user: User = Depends(get_counselor_or_admin),
    db = Depends(get_database),
    resolution_notes: str = ""
):
    """Mark a crisis alert as resolved"""
    try:
        # This would typically update a crisis_alerts collection
        # For now, we'll update the source document
        
        # Try to find in assessments first
        assessment = await db.assessments.find_one({"_id": ObjectId(alert_id)})
        if assessment:
            await db.assessments.update_one(
                {"_id": ObjectId(alert_id)},
                {"$set": {
                    "resolved_at": datetime.utcnow(),
                    "resolved_by": ObjectId(admin_user.id),
                    "resolution_notes": resolution_notes
                }}
            )
            
            # Send notification
            await notification_service.send_alert_resolved_notification(
                alert_id, admin_user.full_name, resolution_notes
            )
            
            return {"message": "Crisis alert resolved successfully"}
        
        # Try chat sessions
        chat_session = await db.chat_sessions.find_one({"_id": ObjectId(alert_id)})
        if chat_session:
            await db.chat_sessions.update_one(
                {"_id": ObjectId(alert_id)},
                {"$set": {
                    "resolved_at": datetime.utcnow(),
                    "resolved_by": ObjectId(admin_user.id),
                    "resolution_notes": resolution_notes
                }}
            )
            return {"message": "Crisis alert resolved successfully"}
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crisis alert not found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving crisis alert: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resolve crisis alert"
        )

@router.get("/reports/institution", response_model=InstitutionReport)
async def generate_institution_report(
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_database),
    period: TimePeriod = TimePeriod.MONTHLY,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Generate comprehensive institution report"""
    try:
        # Calculate date range
        if not start_date or not end_date:
            end_date = datetime.utcnow().date()
            if period == TimePeriod.WEEKLY:
                start_date = end_date - timedelta(days=7)
            elif period == TimePeriod.MONTHLY:
                start_date = end_date - timedelta(days=30)
            elif period == TimePeriod.YEARLY:
                start_date = end_date - timedelta(days=365)
            else:  # Daily
                start_date = end_date
        
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Get metrics (reuse existing dashboard logic)
        metrics = await get_dashboard_metrics(admin_user, db)
        
        # Get trends
        trends = await get_assessment_trends(admin_user, db, days=(end_date - start_date).days)
        
        # Calculate high-risk students
        high_risk_students = await db.assessments.count_documents({
            "created_at": {"$gte": start_datetime, "$lte": end_datetime},
            "result.risk_level": {"$in": ["high", "critical"]}
        })
        
        # Calculate interventions made
        interventions = await db.chat_sessions.count_documents({
            "created_at": {"$gte": start_datetime, "$lte": end_datetime},
            "intervention_triggered": True
        })
        
        # Resource utilization
        resource_usage = {
            "chat_sessions": await db.chat_sessions.count_documents({
                "created_at": {"$gte": start_datetime, "$lte": end_datetime}
            }),
            "assessments_completed": await db.assessments.count_documents({
                "created_at": {"$gte": start_datetime, "$lte": end_datetime}
            }),
            "appointments_booked": await db.appointments.count_documents({
                "created_at": {"$gte": start_datetime, "$lte": end_datetime}
            })
        }
        
        # Generate recommendations
        recommendations = []
        if high_risk_students > metrics.total_users * 0.1:  # More than 10% high-risk
            recommendations.append("Consider expanding counseling staff")
        if metrics.chat_sessions_today > metrics.total_users * 0.3:  # High engagement
            recommendations.append("Mental health awareness campaigns are effective")
        if interventions > 5:
            recommendations.append("Review crisis intervention protocols")
        
        report = InstitutionReport(
            institution_id="default",  # Could be configurable
            report_period=period,
            start_date=start_date,
            end_date=end_date,
            metrics=metrics,
            trends=trends,
            high_risk_students=high_risk_students,
            interventions_made=interventions,
            resource_utilization=resource_usage,
            recommendations=recommendations,
            generated_at=datetime.utcnow()
        )
        
        return report
        
    except Exception as e:
        logger.error(f"Error generating institution report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate institution report"
        )

@router.get("/users/anonymized", response_model=List[AnonymousUserData])
async def get_anonymized_user_data(
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_database),
    department: Optional[str] = None,
    risk_level: Optional[str] = None
):
    """Get anonymized user data for research and analytics"""
    try:
        pipeline = [
            {"$match": {"role": "student", "is_active": True}},
            {"$lookup": {
                "from": "assessments",
                "localField": "_id",
                "foreignField": "user_id",
                "as": "assessments"
            }},
            {"$addFields": {
                "latest_assessment": {"$arrayElemAt": [{"$sortArray": {"input": "$assessments", "sortBy": {"created_at": -1}}}, 0]}
            }}
        ]
        
        if department:
            pipeline.append({"$match": {"department": department}})
        
        anonymized_data = []
        async for user_doc in db.users.aggregate(pipeline):
            latest_assessment = user_doc.get("latest_assessment")
            
            # Determine age group
            age = user_doc.get("age", 20)
            if age < 18:
                age_group = "under-18"
            elif age <= 20:
                age_group = "18-20"
            elif age <= 23:
                age_group = "21-23"
            else:
                age_group = "24+"
            
            # Categorize department
            dept = user_doc.get("department", "Unknown")
            if any(stem in dept.lower() for stem in ["computer", "engineering", "science", "mathematics"]):
                dept_category = "STEM"
            elif any(arts in dept.lower() for arts in ["arts", "literature", "history", "philosophy"]):
                dept_category = "Arts"
            elif any(commerce in dept.lower() for commerce in ["commerce", "business", "economics"]):
                dept_category = "Commerce"
            else:
                dept_category = "Other"
            
            # Extract risk indicators
            risk_indicators = []
            if latest_assessment:
                assessment_risk = latest_assessment.get("result", {}).get("risk_level", "low")
                if assessment_risk in ["high", "critical"]:
                    risk_indicators.append(f"high_{latest_assessment['assessment_type']}_score")
                
                # Filter by risk level if specified
                if risk_level and assessment_risk != risk_level:
                    continue
            
            # Determine engagement level
            assessment_count = len(user_doc.get("assessments", []))
            if assessment_count == 0:
                engagement = "low"
            elif assessment_count <= 2:
                engagement = "medium"
            else:
                engagement = "high"
            
            anonymized_item = AnonymousUserData(
                age_group=age_group,
                gender=user_doc.get("gender", "prefer_not_to_say"),
                year_of_study=user_doc.get("year_of_study", "unknown"),
                department_category=dept_category,
                risk_indicators=risk_indicators,
                engagement_level=engagement
            )
            anonymized_data.append(anonymized_item)
        
        return anonymized_data
        
    except Exception as e:
        logger.error(f"Error fetching anonymized user data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch anonymized user data"
        )

@router.post("/interventions/plan", response_model=InterventionPlan)
async def create_intervention_plan(
    intervention_data: dict,
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_database)
):
    """Create an intervention plan"""
    try:
        plan = InterventionPlan(
            target_metric=intervention_data["target_metric"],
            goal_value=intervention_data["goal_value"],
            current_value=intervention_data["current_value"],
            timeline_days=intervention_data["timeline_days"],
            strategies=intervention_data["strategies"],
            assigned_to=intervention_data.get("assigned_to"),
            created_at=datetime.utcnow()
        )
        
        # Store in database
        plan_doc = plan.dict()
        plan_doc["created_by"] = ObjectId(admin_user.id)
        
        result = await db.intervention_plans.insert_one(plan_doc)
        
        # Send notification to assigned person
        if plan.assigned_to:
            await notification_service.send_intervention_assignment_notification(
                plan.assigned_to, plan.target_metric, admin_user.full_name
            )
        
        logger.info(f"Intervention plan created by {admin_user.email}")
        return plan
        
    except Exception as e:
        logger.error(f"Error creating intervention plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create intervention plan"
        )

@router.get("/emotional-insights/{user_id}")
async def get_user_emotional_insights(
    user_id: str,
    counselor_user: User = Depends(get_counselor_or_admin)
):
    """Get comprehensive emotional insights for a student (counselors/admins only)"""
    try:
        # Get insights summary
        insights_summary = await mental_health_chat.get_counselor_insights_summary(user_id)
        
        # Get emotional timeline
        emotional_timeline = await mental_health_chat.get_user_emotional_timeline(user_id)
        
        return {
            "user_id": user_id,
            "insights_summary": insights_summary,
            "emotional_timeline": emotional_timeline,
            "generated_at": datetime.utcnow(),
            "counselor_id": str(counselor_user.id)
        }
        
    except Exception as e:
        logger.error(f"Error getting emotional insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve emotional insights"
        )

@router.get("/notifications", response_model=List[Dict[str, Any]])
async def get_admin_notifications(
    notification_type: Optional[str] = None,
    limit: int = Query(50, le=100),
    admin_user: User = Depends(get_counselor_or_admin)
):
    """Get notifications for admin/counselor"""
    try:
        notifications = await notification_service.get_notifications(
            user_id=str(admin_user.id),
            notification_type=notification_type,
            limit=limit
        )
        
        return notifications
        
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications"
        )

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    admin_user: User = Depends(get_counselor_or_admin)
):
    """Mark notification as read"""
    try:
        await notification_service.mark_notification_read(
            notification_id=notification_id,
            user_id=str(admin_user.id)
        )
        
        return {"message": "Notification marked as read"}
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read"
        )