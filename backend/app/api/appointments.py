from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, time
from bson import ObjectId
import logging

from app.database import get_database
from app.schemas.user import User
from app.schemas.appointment import (
    AppointmentCreate, 
    AppointmentResponse, 
    AppointmentUpdate,
    CounselorAvailability,
    AppointmentSlot,
    BookingRequest,
    BookingResponse
)
from app.services.notification_service import notification_service
from app.api.auth import get_current_user

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)

@router.post("/book", response_model=BookingResponse)
async def book_appointment(
    booking_request: BookingRequest,
    current_user: User = Depends(get_current_user)
):
    """Book a new appointment with a counselor"""
    try:
        db = await get_database()
        
        # Validate counselor exists and is available
        counselor = await db.users.find_one({
            "_id": ObjectId(booking_request.counselor_id),
            "role": "counselor",
            "is_active": True
        })
        
        if not counselor:
            raise HTTPException(
                status_code=404,
                detail="Counselor not found or not available"
            )
        
        # Check if slot is available
        existing_appointment = await db.appointments.find_one({
            "counselor_id": ObjectId(booking_request.counselor_id),
            "appointment_date": booking_request.appointment_date.isoformat(),
            "start_time": booking_request.start_time,
            "status": {"$in": ["scheduled", "confirmed"]}
        })
        
        if existing_appointment:
            raise HTTPException(
                status_code=409,
                detail="Time slot is not available"
            )
        
        # Create appointment
        appointment_data = {
            "student_id": ObjectId(current_user.id),
            "counselor_id": ObjectId(booking_request.counselor_id),
            "appointment_date": booking_request.appointment_date.isoformat(),
            "start_time": booking_request.start_time,
            "end_time": booking_request.end_time,
            "appointment_type": booking_request.appointment_type,
            "mode": booking_request.mode,
            "reason": booking_request.reason,
            "urgency_level": booking_request.urgency_level,
            "notes": booking_request.notes,
            "status": "scheduled",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.appointments.insert_one(appointment_data)
        appointment_id = str(result.inserted_id)
        
        # Send notification to counselor
        # await notification_service.send_counselor_assignment_notification(
        #     counselor_id=booking_request.counselor_id,
        #     student_id=current_user.id,
        #     appointment_details={
        #         "id": appointment_id,
        #         "date": booking_request.appointment_date.isoformat(),
        #         "time": f"{booking_request.start_time} - {booking_request.end_time}",
        #         "type": booking_request.appointment_type,
        #         "mode": booking_request.mode,
        #         "reason": booking_request.reason,
        #         "urgency": booking_request.urgency_level
        #     }
        # )
        
        # If high urgency, also send crisis alert
        # if booking_request.urgency_level == "high":
        #     await notification_service.send_crisis_alert(
        #         user_id=current_user.id,
        #         crisis_type="urgent_appointment_request",
        #         severity="high",
        #         details={
        #             "appointment_type": booking_request.appointment_type,
        #             "reason": booking_request.reason,
        #             "requested_date": booking_request.appointment_date.isoformat(),
        #             "notes": booking_request.notes
        #         }
        #     )
        
        return BookingResponse(
            appointment_id=appointment_id,
            status="scheduled",
            counselor_name=counselor["full_name"],
            appointment_date=booking_request.appointment_date,
            start_time=booking_request.start_time,
            end_time=booking_request.end_time,
            message="Appointment booked successfully. You will receive a confirmation soon."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error booking appointment: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to book appointment"
        )

@router.get("/available-slots", response_model=List[AppointmentSlot])
async def get_available_slots(
    counselor_id: Optional[str] = None,
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    appointment_type: Optional[str] = "individual",
    current_user: dict = Depends(get_current_user)
):
    """Get available appointment slots"""
    try:
        db = await get_database()
        
        # Default to next 7 days if no date specified
        if date:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
        else:
            target_date = datetime.now().date()
        
        # Get counselors
        counselor_query = {"role": "counselor", "is_active": True}
        if counselor_id:
            counselor_query["_id"] = counselor_id
        
        counselors = []
        async for counselor in db.users.find(counselor_query):
            counselors.append(counselor)
        
        available_slots = []
        
        for counselor in counselors:
            # Get counselor's availability (default schedule if not set)
            availability = counselor.get("availability", {
                "monday": {"start": "09:00", "end": "17:00", "available": True},
                "tuesday": {"start": "09:00", "end": "17:00", "available": True},
                "wednesday": {"start": "09:00", "end": "17:00", "available": True},
                "thursday": {"start": "09:00", "end": "17:00", "available": True},
                "friday": {"start": "09:00", "end": "17:00", "available": True},
                "saturday": {"start": "10:00", "end": "14:00", "available": False},
                "sunday": {"start": "10:00", "end": "14:00", "available": False}
            })
            
            # Get day of week
            day_name = target_date.strftime("%A").lower()
            day_availability = availability.get(day_name, {"available": False})
            
            if not day_availability.get("available", False):
                continue
            
            # Generate time slots
            start_time = datetime.strptime(day_availability["start"], "%H:%M").time()
            end_time = datetime.strptime(day_availability["end"], "%H:%M").time()
            
            # Get existing appointments for this date
            existing_appointments = []
            async for apt in db.appointments.find({
                "counselor_id": str(counselor["_id"]),
                "appointment_date": target_date,
                "status": {"$in": ["scheduled", "confirmed"]}
            }):
                existing_appointments.append(apt)
            
            # Generate slots (1-hour intervals)
            current_time = datetime.combine(target_date, start_time)
            end_datetime = datetime.combine(target_date, end_time)
            
            while current_time + timedelta(hours=1) <= end_datetime:
                slot_start = current_time.time()
                slot_end = (current_time + timedelta(hours=1)).time()
                
                # Check if slot is available
                is_available = True
                for apt in existing_appointments:
                    apt_start = datetime.strptime(apt["start_time"], "%H:%M").time()
                    apt_end = datetime.strptime(apt["end_time"], "%H:%M").time()
                    
                    if (slot_start < apt_end and slot_end > apt_start):
                        is_available = False
                        break
                
                if is_available:
                    available_slots.append(AppointmentSlot(
                        counselor_id=str(counselor["_id"]),
                        counselor_name=counselor["full_name"],
                        date=target_date,
                        start_time=slot_start.strftime("%H:%M"),
                        end_time=slot_end.strftime("%H:%M"),
                        appointment_type=appointment_type,
                        available=True
                    ))
                
                current_time += timedelta(hours=1)
        
        return available_slots
        
    except Exception as e:
        logger.error(f"Error getting available slots: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch available slots"
        )

@router.get("/my-appointments", response_model=List[AppointmentResponse])
async def get_my_appointments(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get current user's appointments"""
    try:
        db = await get_database()
        
        query = {"student_id": ObjectId(current_user.id)}
        if status:
            query["status"] = status
        
        appointments = []
        cursor = db.appointments.find(query).sort("appointment_date", 1)
        
        async for appointment in cursor:
            # Get counselor info
            counselor = await db.users.find_one({"_id": appointment["counselor_id"]})
            
            appointments.append(AppointmentResponse(
                id=str(appointment["_id"]),
                student_id=str(appointment["student_id"]),
                counselor_id=str(appointment["counselor_id"]),
                counselor_name=counselor["full_name"] if counselor else "Unknown",
                appointment_date=appointment["appointment_date"],
                start_time=appointment["start_time"],
                end_time=appointment["end_time"],
                appointment_type=appointment["appointment_type"],
                mode=appointment["mode"],
                reason=appointment["reason"],
                urgency_level=appointment["urgency_level"],
                status=appointment["status"],
                notes=appointment.get("notes"),
                counselor_notes=appointment.get("counselor_notes"),
                created_at=appointment["created_at"],
                updated_at=appointment["updated_at"]
            ))
        
        return appointments
        
    except Exception as e:
        logger.error(f"Error getting appointments: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch appointments"
        )

@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an appointment"""
    try:
        db = await get_database()
        
        # Find appointment
        appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found"
            )
        
        # Check permissions
        user_role = current_user.get("role")
        if (user_role == "student" and appointment["student_id"] != str(current_user["_id"])) or \
           (user_role == "counselor" and appointment["counselor_id"] != str(current_user["_id"])):
            raise HTTPException(
                status_code=403,
                detail="Not authorized to update this appointment"
            )
        
        # Prepare update data
        update_fields = {}
        if update_data.appointment_date:
            update_fields["appointment_date"] = update_data.appointment_date
        if update_data.start_time:
            update_fields["start_time"] = update_data.start_time
        if update_data.end_time:
            update_fields["end_time"] = update_data.end_time
        if update_data.reason:
            update_fields["reason"] = update_data.reason
        if update_data.notes:
            update_fields["notes"] = update_data.notes
        if update_data.counselor_notes and user_role in ["counselor", "admin"]:
            update_fields["counselor_notes"] = update_data.counselor_notes
        if update_data.status:
            update_fields["status"] = update_data.status
        
        update_fields["updated_at"] = datetime.utcnow()
        
        # Update appointment
        await db.appointments.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_fields}
        )
        
        # Get updated appointment
        updated_appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
        counselor = await db.users.find_one({"_id": updated_appointment["counselor_id"]})
        
        return AppointmentResponse(
            id=str(updated_appointment["_id"]),
            student_id=updated_appointment["student_id"],
            counselor_id=updated_appointment["counselor_id"],
            counselor_name=counselor["full_name"] if counselor else "Unknown",
            appointment_date=updated_appointment["appointment_date"],
            start_time=updated_appointment["start_time"],
            end_time=updated_appointment["end_time"],
            appointment_type=updated_appointment["appointment_type"],
            mode=updated_appointment["mode"],
            reason=updated_appointment["reason"],
            urgency_level=updated_appointment["urgency_level"],
            status=updated_appointment["status"],
            notes=updated_appointment.get("notes"),
            counselor_notes=updated_appointment.get("counselor_notes"),
            created_at=updated_appointment["created_at"],
            updated_at=updated_appointment["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating appointment: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update appointment"
        )

@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel an appointment"""
    try:
        db = await get_database()
        
        # Find appointment
        appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found"
            )
        
        # Check permissions
        user_role = current_user.get("role")
        if (user_role == "student" and appointment["student_id"] != str(current_user["_id"])) or \
           (user_role == "counselor" and appointment["counselor_id"] != str(current_user["_id"])):
            raise HTTPException(
                status_code=403,
                detail="Not authorized to cancel this appointment"
            )
        
        # Update status to cancelled
        await db.appointments.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
        )
        
        return {"message": "Appointment cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling appointment: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to cancel appointment"
        )

@router.get("/counselors", response_model=List[Dict[str, Any]])
async def get_available_counselors(
    current_user: dict = Depends(get_current_user)
):
    """Get list of available counselors"""
    try:
        db = await get_database()
        
        counselors = []
        async for counselor in db.users.find({
            "role": "counselor",
            "is_active": True
        }):
            counselors.append({
                "id": str(counselor["_id"]),
                "name": counselor["full_name"],
                "specializations": counselor.get("specializations", []),
                "bio": counselor.get("bio", ""),
                "experience": counselor.get("experience", ""),
                "languages": counselor.get("languages", ["English"]),
                "rating": counselor.get("rating", 5.0),
                "availability": counselor.get("availability", {})
            })
        
        return counselors
        
    except Exception as e:
        logger.error(f"Error getting counselors: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch counselors"
        )

# Counselor-specific endpoints
@router.get("/counselor/appointments", response_model=List[AppointmentResponse])
async def get_counselor_appointments(
    status: Optional[str] = None,
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user)
):
    """Get appointments for counselor"""
    try:
        if current_user.role not in ["counselor", "admin"]:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )
        
        db = await get_database()
        
        query = {"counselor_id": ObjectId(current_user.id)}
        if status:
            query["status"] = status
        if date:
            query["appointment_date"] = date  # Use string date format
        
        appointments = []
        cursor = db.appointments.find(query).sort("appointment_date", 1)
        
        async for appointment in cursor:
            # Get student info
            student = await db.users.find_one({"_id": appointment["student_id"]})
            
            appointments.append(AppointmentResponse(
                id=str(appointment["_id"]),
                student_id=str(appointment["student_id"]),
                student_name=student["full_name"] if student else "Unknown",
                counselor_id=str(appointment["counselor_id"]),
                counselor_name=current_user.full_name,
                appointment_date=appointment["appointment_date"],
                start_time=appointment["start_time"],
                end_time=appointment["end_time"],
                appointment_type=appointment["appointment_type"],
                mode=appointment["mode"],
                reason=appointment["reason"],
                urgency_level=appointment["urgency_level"],
                status=appointment["status"],
                notes=appointment.get("notes"),
                counselor_notes=appointment.get("counselor_notes"),
                created_at=appointment["created_at"],
                updated_at=appointment["updated_at"]
            ))
        
        return appointments
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting counselor appointments: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch appointments"
        )

@router.put("/counselor/availability")
async def update_counselor_availability(
    availability: CounselorAvailability,
    current_user: dict = Depends(get_current_user)
):
    """Update counselor availability"""
    try:
        if current_user.get("role") not in ["counselor", "admin"]:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )
        
        db = await get_database()
        
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"availability": availability.dict()}}
        )
        
        return {"message": "Availability updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating availability: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update availability"
        )