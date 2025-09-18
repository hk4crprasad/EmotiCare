from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from bson import ObjectId

from app.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {"user_id": user_id, "role": role}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials", 
            headers={"WWW-Authenticate": "Bearer"},
        )

def validate_student_id(student_id: str, department: str) -> bool:
    """Validate student ID format (can be customized per institution)"""
    # Example validation - can be modified based on institution requirements
    if not student_id or len(student_id) < 6:
        return False
    
    # Basic format check (alphanumeric)
    if not student_id.isalnum():
        return False
    
    return True

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is strong"

def check_role_permission(user_role: str, required_roles: list[str]) -> bool:
    """Check if user role has required permissions"""
    role_hierarchy = {
        "admin": 4,
        "counselor": 3,
        "peer_volunteer": 2,
        "student": 1
    }
    
    user_level = role_hierarchy.get(user_role, 0)
    required_levels = [role_hierarchy.get(role, 0) for role in required_roles]
    
    return user_level >= min(required_levels) if required_levels else False

def generate_session_token() -> str:
    """Generate a unique session token"""
    import secrets
    return secrets.token_urlsafe(32)

def mask_sensitive_data(data: dict, fields_to_mask: list[str]) -> dict:
    """Mask sensitive fields in data"""
    masked_data = data.copy()
    for field in fields_to_mask:
        if field in masked_data:
            if isinstance(masked_data[field], str) and len(masked_data[field]) > 3:
                masked_data[field] = masked_data[field][:2] + "*" * (len(masked_data[field]) - 4) + masked_data[field][-2:]
            else:
                masked_data[field] = "***"
    return masked_data