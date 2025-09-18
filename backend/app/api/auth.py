from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from app.database import get_database
from app.schemas.user import User, UserCreate, UserUpdate, Token, UserRole
from app.utils.security import (
    verify_password, get_password_hash, create_access_token,
    validate_student_id, validate_password_strength
)
from app.utils.auth import get_current_user, get_admin_user
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/register", response_model=User)
async def register_user(
    user_data: UserCreate,
    db = Depends(get_database)
):
    """Register a new user"""
    try:
        # Validate required fields for students
        if user_data.role == UserRole.STUDENT:
            if not user_data.student_id or user_data.student_id.strip() == "":
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Student ID is required for student registration"
                )
        
        # Check if email already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate password strength
        is_strong, password_message = validate_password_strength(user_data.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=password_message
            )
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user document (exclude None values for MongoDB)
        user_doc = {
            "email": user_data.email,
            "full_name": user_data.full_name,
            "hashed_password": hashed_password,
            "role": user_data.role,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None
        }
        
        # Add optional fields only if they have values
        if user_data.student_id:
            user_doc["student_id"] = user_data.student_id
        if user_data.department:
            user_doc["department"] = user_data.department
        if user_data.year_of_study:
            user_doc["year_of_study"] = user_data.year_of_study
        if user_data.gender:
            user_doc["gender"] = user_data.gender
        if user_data.age is not None:
            user_doc["age"] = user_data.age
        if user_data.phone_number:
            user_doc["phone_number"] = user_data.phone_number
        if user_data.emergency_contact:
            user_doc["emergency_contact"] = user_data.emergency_contact
        
        # Insert user
        result = await db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        # Return user (without password)
        user = User(
            id=str(result.inserted_id),
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            is_active=True,
            student_id=user_data.student_id,
            department=user_data.department,
            year_of_study=user_data.year_of_study,
            gender=user_data.gender,
            age=user_data.age,
            phone_number=user_data.phone_number,
            emergency_contact=user_data.emergency_contact,
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"],
            last_login=None
        )
        
        logger.info(f"New user registered: {user_data.email}, role: {user_data.role}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db = Depends(get_database)
):
    """Login user and return access token"""
    try:
        # Find user by email
        user_doc = await db.users.find_one({"email": form_data.username})
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(form_data.password, user_doc["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user_doc.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled"
            )
        
        # Update last login
        await db.users.update_one(
            {"_id": user_doc["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user_doc["_id"]), "role": user_doc["role"]},
            expires_delta=access_token_expires
        )
        
        # Create user object
        user = User(
            id=str(user_doc["_id"]),
            email=user_doc["email"],
            full_name=user_doc["full_name"],
            role=user_doc["role"],
            is_active=user_doc.get("is_active", True),
            student_id=user_doc.get("student_id"),
            department=user_doc.get("department"),
            year_of_study=user_doc.get("year_of_study"),
            gender=user_doc.get("gender"),
            age=user_doc.get("age"),
            phone_number=user_doc.get("phone_number"),
            emergency_contact=user_doc.get("emergency_contact"),
            created_at=user_doc.get("created_at"),
            updated_at=user_doc.get("updated_at"),
            last_login=datetime.utcnow()
        )
        
        token = Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user
        )
        
        logger.info(f"User logged in: {user_doc['email']}")
        return token
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update current user information"""
    try:
        update_data = {}
        
        # Only update provided fields
        if user_update.full_name is not None:
            update_data["full_name"] = user_update.full_name
        if user_update.department is not None:
            update_data["department"] = user_update.department
        if user_update.year_of_study is not None:
            update_data["year_of_study"] = user_update.year_of_study
        if user_update.phone_number is not None:
            update_data["phone_number"] = user_update.phone_number
        if user_update.emergency_contact is not None:
            update_data["emergency_contact"] = user_update.emergency_contact
        if user_update.is_active is not None and current_user.role == UserRole.ADMIN:
            update_data["is_active"] = user_update.is_active
        
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            
            await db.users.update_one(
                {"_id": ObjectId(current_user.id)},
                {"$set": update_data}
            )
            
            # Fetch updated user
            updated_user_doc = await db.users.find_one({"_id": ObjectId(current_user.id)})
            
            updated_user = User(
                id=str(updated_user_doc["_id"]),
                email=updated_user_doc["email"],
                full_name=updated_user_doc["full_name"],
                role=updated_user_doc["role"],
                is_active=updated_user_doc.get("is_active", True),
                student_id=updated_user_doc.get("student_id"),
                department=updated_user_doc.get("department"),
                year_of_study=updated_user_doc.get("year_of_study"),
                gender=updated_user_doc.get("gender"),
                age=updated_user_doc.get("age"),
                phone_number=updated_user_doc.get("phone_number"),
                emergency_contact=updated_user_doc.get("emergency_contact"),
                created_at=updated_user_doc.get("created_at"),
                updated_at=updated_user_doc.get("updated_at"),
                last_login=updated_user_doc.get("last_login")
            )
            
            logger.info(f"User updated: {current_user.email}")
            return updated_user
        
        return current_user
        
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )

@router.post("/change-password", response_model=dict)
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Change user password"""
    try:
        # Get user with password
        user_doc = await db.users.find_one({"_id": ObjectId(current_user.id)})
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not verify_password(current_password, user_doc["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password"
            )
        
        # Validate new password strength
        is_strong, password_message = validate_password_strength(new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=password_message
            )
        
        # Hash new password
        new_hashed_password = get_password_hash(new_password)
        
        # Update password
        await db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {
                "$set": {
                    "hashed_password": new_hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Password changed for user: {current_user.email}")
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )

@router.post("/logout", response_model=dict)
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client should discard the token)"""
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Successfully logged out"}

# Admin endpoints
@router.get("/users", response_model=list[User])
async def get_all_users(
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_database),
    skip: int = 0,
    limit: int = 100,
    role: str = None
):
    """Get all users (admin only)"""
    try:
        query = {}
        if role:
            query["role"] = role
        
        cursor = db.users.find(query).skip(skip).limit(limit)
        users = []
        
        async for user_doc in cursor:
            user = User(
                id=str(user_doc["_id"]),
                email=user_doc["email"],
                full_name=user_doc["full_name"],
                role=user_doc["role"],
                is_active=user_doc.get("is_active", True),
                student_id=user_doc.get("student_id"),
                department=user_doc.get("department"),
                year_of_study=user_doc.get("year_of_study"),
                gender=user_doc.get("gender"),
                age=user_doc.get("age"),
                phone_number=user_doc.get("phone_number"),
                emergency_contact=user_doc.get("emergency_contact"),
                created_at=user_doc.get("created_at"),
                updated_at=user_doc.get("updated_at"),
                last_login=user_doc.get("last_login")
            )
            users.append(user)
        
        return users
        
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users"
        )