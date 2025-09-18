from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from bson import ObjectId

from app.database import get_database
from app.utils.security import verify_token
from app.schemas.user import User, UserRole

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_database)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    token_data = verify_token(token)
    
    user_doc = await db.users.find_one({"_id": ObjectId(token_data["user_id"])})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Convert to User schema
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
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    return current_user

def require_roles(allowed_roles: list[UserRole]):
    """Decorator to require specific roles"""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

# Common role dependencies
async def get_student_user(current_user: User = Depends(require_roles([UserRole.STUDENT]))) -> User:
    return current_user

async def get_counselor_user(current_user: User = Depends(require_roles([UserRole.COUNSELOR]))) -> User:
    return current_user

async def get_admin_user(current_user: User = Depends(require_roles([UserRole.ADMIN]))) -> User:
    return current_user

async def get_counselor_or_admin(current_user: User = Depends(require_roles([UserRole.COUNSELOR, UserRole.ADMIN]))) -> User:
    return current_user

async def get_peer_volunteer_or_admin(current_user: User = Depends(require_roles([UserRole.PEER_VOLUNTEER, UserRole.ADMIN]))) -> User:
    return current_user

# Optional user dependency (for public endpoints)
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db = Depends(get_database)
) -> Optional[User]:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None

async def get_current_user_websocket(token: str) -> Optional[User]:
    """Get current user for WebSocket connections"""
    try:
        # Verify token
        token_data = verify_token(token)
        
        # Get database
        from app.database import get_database
        db = await get_database()
        
        # Find user
        user_doc = await db.users.find_one({"_id": ObjectId(token_data["user_id"])})
        if not user_doc:
            return None
        
        if not user_doc.get("is_active", True):
            return None
        
        # Convert to User schema
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
        
        return user
        
    except Exception:
        return None