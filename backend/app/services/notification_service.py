import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from app.config import settings
from app.database import get_database

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for sending notifications to counselors and admins"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
    
    async def send_crisis_alert(
        self, 
        user_id: str, 
        crisis_type: str, 
        severity: str, 
        details: Dict[str, Any]
    ):
        """Send crisis alert to counselors"""
        try:
            db = await get_database()
            
            # Get user info (anonymized)
            user_doc = await db.users.find_one({"_id": user_id})
            if not user_doc:
                logger.error(f"User not found for crisis alert: {user_id}")
                return
            
            # Get all counselors and admins
            counselors = []
            async for counselor in db.users.find({
                "role": {"$in": ["counselor", "admin"]},
                "is_active": True
            }):
                counselors.append(counselor)
            
            # Prepare notification data
            notification_data = {
                "user_info": {
                    "department": user_doc.get("department", "Unknown"),
                    "year_of_study": user_doc.get("year_of_study", "Unknown"),
                    "age_group": f"{(user_doc.get('age', 20) // 5) * 5}-{((user_doc.get('age', 20) // 5) * 5) + 4}"
                },
                "crisis_type": crisis_type,
                "severity": severity,
                "details": details,
                "timestamp": datetime.utcnow(),
                "alert_id": str(user_id)  # Can be more specific
            }
            
            # Store notification in database
            await db.notifications.insert_one({
                "type": "crisis_alert",
                "recipients": [str(c["_id"]) for c in counselors],
                "data": notification_data,
                "sent_at": datetime.utcnow(),
                "status": "sent"
            })
            
            # Send emails if configured
            if self.smtp_user and self.smtp_password:
                for counselor in counselors:
                    if counselor.get("email"):
                        await self._send_crisis_email(counselor["email"], notification_data)
            
            # Log the alert
            logger.critical(f"Crisis alert sent: {crisis_type} - {severity} - User: {user_id}")
            
        except Exception as e:
            logger.error(f"Error sending crisis alert: {e}")
    
    async def send_high_risk_assessment_alert(
        self, 
        user_id: str, 
        assessment_type: str, 
        score: int, 
        risk_level: str
    ):
        """Send alert for high-risk assessment results"""
        try:
            await self.send_crisis_alert(
                user_id=user_id,
                crisis_type="high_risk_assessment",
                severity=risk_level,
                details={
                    "assessment_type": assessment_type,
                    "score": score,
                    "recommendation": "Immediate counselor consultation recommended"
                }
            )
        except Exception as e:
            logger.error(f"Error sending high-risk assessment alert: {e}")
    
    async def send_counselor_assignment_notification(
        self, 
        counselor_id: str, 
        student_id: str, 
        appointment_details: Dict[str, Any]
    ):
        """Notify counselor of new appointment assignment"""
        try:
            db = await get_database()
            
            counselor_doc = await db.users.find_one({"_id": counselor_id})
            student_doc = await db.users.find_one({"_id": student_id})
            
            if not counselor_doc or not student_doc:
                logger.error("User not found for appointment notification")
                return
            
            notification_data = {
                "type": "appointment_assignment",
                "counselor_name": counselor_doc["full_name"],
                "student_info": {
                    "name": student_doc["full_name"],
                    "department": student_doc.get("department", "Unknown"),
                    "student_id": student_doc.get("student_id", "Unknown")
                },
                "appointment_details": appointment_details,
                "timestamp": datetime.utcnow()
            }
            
            # Store notification
            await db.notifications.insert_one({
                "type": "appointment_assignment",
                "recipient": counselor_id,
                "data": notification_data,
                "sent_at": datetime.utcnow(),
                "status": "sent"
            })
            
            # Send email if configured
            if self.smtp_user and counselor_doc.get("email"):
                await self._send_appointment_email(counselor_doc["email"], notification_data)
            
            logger.info(f"Appointment notification sent to counselor {counselor_id}")
            
        except Exception as e:
            logger.error(f"Error sending counselor assignment notification: {e}")
    
    async def send_intervention_assignment_notification(
        self, 
        assigned_to: str, 
        target_metric: str, 
        assigned_by: str
    ):
        """Notify about intervention plan assignment"""
        try:
            db = await get_database()
            
            assignee_doc = await db.users.find_one({"_id": assigned_to})
            if not assignee_doc:
                logger.error(f"Assignee not found: {assigned_to}")
                return
            
            notification_data = {
                "type": "intervention_assignment",
                "assignee_name": assignee_doc["full_name"],
                "target_metric": target_metric,
                "assigned_by": assigned_by,
                "timestamp": datetime.utcnow()
            }
            
            await db.notifications.insert_one({
                "type": "intervention_assignment",
                "recipient": assigned_to,
                "data": notification_data,
                "sent_at": datetime.utcnow(),
                "status": "sent"
            })
            
            logger.info(f"Intervention assignment notification sent to {assigned_to}")
            
        except Exception as e:
            logger.error(f"Error sending intervention assignment notification: {e}")
    
    async def send_alert_resolved_notification(
        self, 
        alert_id: str, 
        resolved_by: str, 
        resolution_notes: str
    ):
        """Notify about resolved crisis alert"""
        try:
            db = await get_database()
            
            # Get all relevant staff
            staff = []
            async for staff_member in db.users.find({
                "role": {"$in": ["counselor", "admin"]},
                "is_active": True
            }):
                staff.append(staff_member)
            
            notification_data = {
                "type": "alert_resolved",
                "alert_id": alert_id,
                "resolved_by": resolved_by,
                "resolution_notes": resolution_notes,
                "timestamp": datetime.utcnow()
            }
            
            await db.notifications.insert_one({
                "type": "alert_resolved",
                "recipients": [str(s["_id"]) for s in staff],
                "data": notification_data,
                "sent_at": datetime.utcnow(),
                "status": "sent"
            })
            
            logger.info(f"Alert resolved notification sent for alert {alert_id}")
            
        except Exception as e:
            logger.error(f"Error sending alert resolved notification: {e}")
    
    async def _send_crisis_email(self, email: str, notification_data: Dict[str, Any]):
        """Send crisis alert email"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = email
            msg['Subject'] = f"🚨 URGENT: Crisis Alert - {notification_data['severity'].upper()}"
            
            body = f"""
URGENT MENTAL HEALTH CRISIS ALERT

Severity: {notification_data['severity'].upper()}
Type: {notification_data['crisis_type']}
Time: {notification_data['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}

Student Information (Anonymized):
- Department: {notification_data['user_info']['department']}
- Year of Study: {notification_data['user_info']['year_of_study']}
- Age Group: {notification_data['user_info']['age_group']}

Crisis Details:
{notification_data['details']}

IMMEDIATE ACTION REQUIRED:
1. Contact the student immediately
2. Assess safety and provide immediate support
3. Follow crisis intervention protocols
4. Document all actions taken

Access EmotiCare Admin Dashboard for complete details.

This is an automated alert from EmotiCare Mental Health Support System.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Crisis email sent to {email}")
            
        except Exception as e:
            logger.error(f"Error sending crisis email: {e}")
    
    async def _send_appointment_email(self, email: str, notification_data: Dict[str, Any]):
        """Send appointment assignment email"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = email
            msg['Subject'] = "New Appointment Assignment - EmotiCare"
            
            appointment = notification_data['appointment_details']
            student = notification_data['student_info']
            
            body = f"""
New Counseling Appointment Assignment

Dear {notification_data['counselor_name']},

You have been assigned a new counseling appointment:

Student Information:
- Name: {student['name']}
- Department: {student['department']}
- Student ID: {student['student_id']}

Appointment Details:
- Date: {appointment.get('date', 'TBD')}
- Time: {appointment.get('time', 'TBD')}
- Type: {appointment.get('type', 'Individual Counseling')}
- Mode: {appointment.get('mode', 'In-Person')}
- Reason: {appointment.get('reason', 'General Mental Health Support')}

Please log in to the EmotiCare system to confirm and manage this appointment.

Best regards,
EmotiCare System
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Appointment email sent to {email}")
            
        except Exception as e:
            logger.error(f"Error sending appointment email: {e}")
    
    async def get_notifications(
        self, 
        user_id: str, 
        notification_type: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user"""
        try:
            db = await get_database()
            
            query = {
                "$or": [
                    {"recipient": user_id},
                    {"recipients": user_id}
                ]
            }
            
            if notification_type:
                query["type"] = notification_type
            
            notifications = []
            cursor = db.notifications.find(query).sort("sent_at", -1).limit(limit)
            
            async for notification in cursor:
                notifications.append({
                    "id": str(notification["_id"]),
                    "type": notification["type"],
                    "data": notification["data"],
                    "sent_at": notification["sent_at"],
                    "status": notification.get("status", "sent")
                })
            
            return notifications
            
        except Exception as e:
            logger.error(f"Error fetching notifications: {e}")
            return []
    
    async def mark_notification_read(self, notification_id: str, user_id: str):
        """Mark a notification as read"""
        try:
            db = await get_database()
            
            await db.notifications.update_one(
                {"_id": notification_id},
                {"$set": {"read_at": datetime.utcnow()}}
            )
            
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")

# Global instance
notification_service = NotificationService()