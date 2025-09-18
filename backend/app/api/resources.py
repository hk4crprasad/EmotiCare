# Resources API endpoints for mental health resources
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from typing import List, Optional
import os
import uuid
import aiofiles
from pathlib import Path
from app.schemas.resource import (
    Resource, ResourceCreate, ResourceUpdate, ResourceRating, 
    ResourceCategory, ResourceType, Language
)
from app.schemas.user import User
from app.utils.auth import get_current_user, get_admin_user, get_counselor_or_admin
from app.database import get_database
from app.services.assessment_service import assess_user_needs
from app.services.azure_storage_service import AzureStorageService
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[Resource])
async def get_resources(
    category: Optional[ResourceCategory] = None,
    resource_type: Optional[ResourceType] = None,
    language: Optional[Language] = None,
    difficulty_level: Optional[int] = Query(None, ge=1, le=5),
    is_premium: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db=Depends(get_database)
):
    """Get resources with optional filtering"""
    try:
        # Build filter query
        filter_query = {"is_active": True}
        
        if category:
            filter_query["category"] = category
        if resource_type:
            filter_query["resource_type"] = resource_type
        if language:
            filter_query["language"] = language
        if difficulty_level:
            filter_query["difficulty_level"] = difficulty_level
        if is_premium is not None:
            filter_query["is_premium"] = is_premium
        
        # Get resources with pagination
        cursor = db.resources.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        resources = []
        
        async for resource_doc in cursor:
            resource_dict = dict(resource_doc)
            resource_dict["id"] = str(resource_dict.pop("_id"))
            resources.append(Resource(**resource_dict))
        
        return resources
    except Exception as e:
        logger.error(f"Error fetching resources: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch resources")

@router.get("/categories", response_model=List[dict])
async def get_resource_categories():
    """Get all available resource categories"""
    categories = []
    for category in ResourceCategory:
        categories.append({
            "value": category.value,
            "label": category.value.replace("_", " ").title()
        })
    return categories

@router.get("/types", response_model=List[dict])
async def get_resource_types():
    """Get all available resource types"""
    types = []
    for res_type in ResourceType:
        types.append({
            "value": res_type.value,
            "label": res_type.value.replace("_", " ").title()
        })
    return types

@router.get("/recommended", response_model=List[Resource])
async def get_recommended_resources(
    current_user: User = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=20),
    db=Depends(get_database)
):
    """Get personalized resource recommendations based on user assessments"""
    try:
        user_id = ObjectId(current_user.id)
        
        # Get user's recent assessment results to determine needs
        assessment_results = await assess_user_needs(user_id, db)
        
        # Create recommendation filter based on assessment
        recommended_categories = []
        if assessment_results.get("stress_level", 0) > 6:
            recommended_categories.extend([
                ResourceCategory.STRESS_MANAGEMENT,
                ResourceCategory.MINDFULNESS,
                ResourceCategory.BREATHING_EXERCISES
            ])
        if assessment_results.get("anxiety_level", 0) > 6:
            recommended_categories.extend([
                ResourceCategory.ANXIETY_COPING,
                ResourceCategory.MEDITATION
            ])
        if assessment_results.get("depression_indicators", 0) > 5:
            recommended_categories.extend([
                ResourceCategory.DEPRESSION_SUPPORT,
                ResourceCategory.SELF_CARE
            ])
        
        # Default recommendations if no specific needs identified
        if not recommended_categories:
            recommended_categories = [
                ResourceCategory.MINDFULNESS,
                ResourceCategory.STRESS_MANAGEMENT,
                ResourceCategory.SELF_CARE
            ]
        
        # Get resources from recommended categories
        filter_query = {
            "is_active": True,
            "category": {"$in": recommended_categories}
        }
        
        cursor = db.resources.find(filter_query).limit(limit).sort("rating_average", -1)
        resources = []
        
        async for resource_doc in cursor:
            resource_dict = dict(resource_doc)
            resource_dict["id"] = str(resource_dict.pop("_id"))
            resources.append(Resource(**resource_dict))
        
        return resources
    except Exception as e:
        logger.error(f"Error getting recommended resources: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")

@router.get("/{resource_id}", response_model=Resource)
async def get_resource(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get a specific resource by ID"""
    try:
        resource_doc = await db.resources.find_one({"_id": ObjectId(resource_id), "is_active": True})
        if not resource_doc:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        # Increment view count
        await db.resources.update_one(
            {"_id": ObjectId(resource_id)},
            {"$inc": {"view_count": 1}}
        )
        
        # Track resource usage
        await db.resource_usage.update_one(
            {"user_id": ObjectId(current_user.id), "resource_id": ObjectId(resource_id)},
            {
                "$set": {"started_at": datetime.utcnow()},
                "$setOnInsert": {"progress_percentage": 0}
            },
            upsert=True
        )
        
        resource_dict = dict(resource_doc)
        resource_dict["id"] = str(resource_dict.pop("_id"))
        return Resource(**resource_dict)
    except Exception as e:
        logger.error(f"Error fetching resource {resource_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch resource")

@router.post("/", response_model=Resource)
async def create_resource(
    resource: ResourceCreate,
    current_user: User = Depends(get_counselor_or_admin),
    db=Depends(get_database)
):
    """Create a new resource (counselors and admins only)"""
    try:
        resource_doc = resource.dict()
        resource_doc["created_by"] = ObjectId(current_user.id)
        resource_doc["created_at"] = datetime.utcnow()
        resource_doc["updated_at"] = datetime.utcnow()
        resource_doc["is_active"] = True
        resource_doc["view_count"] = 0
        resource_doc["rating_average"] = 0.0
        resource_doc["rating_count"] = 0
        
        result = await db.resources.insert_one(resource_doc)
        
        # Return the created resource
        created_resource = await db.resources.find_one({"_id": result.inserted_id})
        resource_dict = dict(created_resource)
        resource_dict["id"] = str(resource_dict.pop("_id"))
        
        return Resource(**resource_dict)
    except Exception as e:
        logger.error(f"Error creating resource: {e}")
        raise HTTPException(status_code=500, detail="Failed to create resource")

@router.post("/upload-file")
async def upload_resource_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_counselor_or_admin),
):
    """Upload a file for a resource (counselors and admins only)"""
    try:
        # Validate file type
        allowed_extensions = {'.pdf', '.doc', '.docx', '.mp3', '.mp4', '.wav', '.avi', '.mov', '.ppt', '.pptx'}
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Validate file size (50MB limit)
        max_size = 50 * 1024 * 1024  # 50MB
        if file.size > max_size:
            raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
        
        # Initialize Azure Storage Service
        storage_service = AzureStorageService()
        
        # Upload file to Azure Blob Storage
        file_content = await file.read()
        file_result = storage_service.upload_resource_file(
            file_content=file_content,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            resource_type="general"
        )
        
        # Return file information
        return {
            "file_id": str(uuid.uuid4()),
            "filename": file.filename,
            "file_path": file_result["blob_name"],
            "file_url": file_result["blob_url"],
            "file_size": file.size,
            "file_type": file_extension,
            "uploaded_by": current_user.id,
            "azure_blob_name": file_result["blob_name"]
        }
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

@router.put("/{resource_id}", response_model=Resource)
async def update_resource(
    resource_id: str,
    resource_update: ResourceUpdate,
    current_user: User = Depends(get_admin_user),
    db=Depends(get_database)
):
    """Update a resource (admin only)"""
    try:
        # Check if resource exists
        existing_resource = await db.resources.find_one({"_id": ObjectId(resource_id)})
        if not existing_resource:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        # Update resource
        update_data = {k: v for k, v in resource_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await db.resources.update_one(
            {"_id": ObjectId(resource_id)},
            {"$set": update_data}
        )
        
        # Return updated resource
        updated_resource = await db.resources.find_one({"_id": ObjectId(resource_id)})
        resource_dict = dict(updated_resource)
        resource_dict["id"] = str(resource_dict.pop("_id"))
        
        return Resource(**resource_dict)
    except Exception as e:
        logger.error(f"Error updating resource {resource_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update resource")

@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: str,
    current_user: User = Depends(get_admin_user),
    db=Depends(get_database)
):
    """Soft delete a resource (admin only)"""
    try:
        result = await db.resources.update_one(
            {"_id": ObjectId(resource_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        return {"message": "Resource deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting resource {resource_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete resource")

@router.post("/{resource_id}/rate")
async def rate_resource(
    resource_id: str,
    rating_data: ResourceRating,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database)
):
    """Rate a resource"""
    try:
        # Check if resource exists
        resource_doc = await db.resources.find_one({"_id": ObjectId(resource_id), "is_active": True})
        if not resource_doc:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        # Store individual rating
        rating_doc = {
            "user_id": ObjectId(current_user.id),
            "resource_id": ObjectId(resource_id),
            "rating": rating_data.rating,
            "review": rating_data.review,
            "created_at": datetime.utcnow()
        }
        
        await db.resource_ratings.replace_one(
            {"user_id": ObjectId(current_user.id), "resource_id": ObjectId(resource_id)},
            rating_doc,
            upsert=True
        )
        
        # Update resource average rating
        pipeline = [
            {"$match": {"resource_id": ObjectId(resource_id)}},
            {"$group": {
                "_id": None,
                "avg_rating": {"$avg": "$rating"},
                "rating_count": {"$sum": 1}
            }}
        ]
        
        rating_stats = await db.resource_ratings.aggregate(pipeline).to_list(1)
        if rating_stats:
            stats = rating_stats[0]
            await db.resources.update_one(
                {"_id": ObjectId(resource_id)},
                {"$set": {
                    "rating_average": round(stats["avg_rating"], 2),
                    "rating_count": stats["rating_count"]
                }}
            )
        
        return {"message": "Rating submitted successfully"}
    except Exception as e:
        logger.error(f"Error rating resource {resource_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit rating")

@router.post("/{resource_id}/complete")
async def mark_resource_complete(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database)
):
    """Mark a resource as completed by the user"""
    try:
        await db.resource_usage.update_one(
            {"user_id": ObjectId(current_user.id), "resource_id": ObjectId(resource_id)},
            {
                "$set": {
                    "completed_at": datetime.utcnow(),
                    "progress_percentage": 100
                }
            },
            upsert=True
        )
        
        return {"message": "Resource marked as completed"}
    except Exception as e:
        logger.error(f"Error marking resource complete: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark resource as complete")

@router.get("/user/progress", response_model=List[dict])
async def get_user_resource_progress(
    current_user: User = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get user's resource usage progress"""
    try:
        pipeline = [
            {"$match": {"user_id": ObjectId(current_user.id)}},
            {"$lookup": {
                "from": "resources",
                "localField": "resource_id",
                "foreignField": "_id",
                "as": "resource"
            }},
            {"$unwind": "$resource"},
            {"$project": {
                "_id": {"$toString": "$_id"},
                "resource_id": {"$toString": "$resource_id"},
                "resource_title": "$resource.title",
                "resource_category": "$resource.category",
                "started_at": 1,
                "completed_at": 1,
                "progress_percentage": 1,
                "rating": 1
            }}
        ]
        
        progress_data = await db.resource_usage.aggregate(pipeline).to_list(None)
        
        # Ensure all ObjectIds are converted to strings
        for item in progress_data:
            for key, value in item.items():
                if isinstance(value, ObjectId):
                    item[key] = str(value)
        
        return progress_data
    except Exception as e:
        logger.error(f"Error fetching user progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")

@router.get("/search", response_model=List[Resource])
async def search_resources(
    q: str = Query(..., min_length=2),
    limit: int = Query(20, ge=1, le=50),
    db=Depends(get_database)
):
    """Search resources by title, description, or tags"""
    try:
        search_query = {
            "$and": [
                {"is_active": True},
                {"$or": [
                    {"title": {"$regex": q, "$options": "i"}},
                    {"description": {"$regex": q, "$options": "i"}},
                    {"tags": {"$regex": q, "$options": "i"}}
                ]}
            ]
        }
        
        cursor = db.resources.find(search_query).limit(limit).sort("rating_average", -1)
        resources = []
        
        async for resource_doc in cursor:
            resource_dict = dict(resource_doc)
            resource_dict["id"] = str(resource_dict.pop("_id"))
            resources.append(Resource(**resource_dict))
        
        return resources
    except Exception as e:
        logger.error(f"Error searching resources: {e}")
        raise HTTPException(status_code=500, detail="Failed to search resources")