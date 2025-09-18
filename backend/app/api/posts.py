from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import logging
import uuid
import os
from pathlib import Path
import shutil

from app.database import get_database
from app.schemas.post import (
    Post, PostCreate, PostUpdate, PostInDB, PostComment, PostLike, 
    PostShare, PostBookmark, PostReport, PostFeed, PostSearchQuery,
    PostType, PostStatus, PostVisibility, HashtagStats
)
from app.schemas.user import User
from app.utils.auth import get_current_user, get_admin_user
from app.services.azure_storage_service import AzureStorageService

router = APIRouter()
logger = logging.getLogger(__name__)

# Image upload configuration
UPLOAD_DIR = Path("static/uploads/posts")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/", response_model=Post)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new post"""
    try:
        # Process hashtags
        hashtags = []
        for tag in post_data.hashtags:
            tag = tag.strip()
            if not tag.startswith('#'):
                tag = '#' + tag
            hashtags.append(tag.lower())
        
        # Create post document
        post_doc = {
            "author_id": ObjectId(current_user.id),
            "title": post_data.title,
            "content": post_data.content,
            "post_type": post_data.post_type,
            "image_url": post_data.image_url,
            "image_alt_text": post_data.image_alt_text,
            "video_url": post_data.video_url,
            "link_url": post_data.link_url,
            "link_title": post_data.link_title,
            "link_description": post_data.link_description,
            "hashtags": hashtags,
            "mentions": [ObjectId(mention) for mention in post_data.mentions if ObjectId.is_valid(mention)],
            "visibility": post_data.visibility,
            "allow_comments": post_data.allow_comments,
            "allow_shares": post_data.allow_shares,
            "is_anonymous": post_data.is_anonymous,
            "location": post_data.location,
            "status": PostStatus.PUBLISHED,
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "views_count": 0,
            "flagged_count": 0,
            "flagged_by": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "published_at": datetime.utcnow() if not post_data.scheduled_at else post_data.scheduled_at
        }
        
        # Insert post
        result = await db.posts.insert_one(post_doc)
        post_doc["_id"] = result.inserted_id
        
        # Update hashtag statistics
        await update_hashtag_stats(db, hashtags)
        
        # Convert to response format
        post = await format_post_response(db, post_doc, current_user.id)
        
        logger.info(f"Post created: {result.inserted_id} by user {current_user.id}")
        return post
        
    except Exception as e:
        logger.error(f"Error creating post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create post"
        )

@router.post("/upload-image")
async def upload_post_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload image for post"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")
        
        # Initialize Azure Storage Service
        storage_service = AzureStorageService()
        
        # Upload image to Azure Blob Storage
        file_content = await file.read()
        image_result = await storage_service.upload_post_image(
            file_content=file_content,
            filename=file.filename,
            uploaded_by=current_user.id
        )
        
        # Return URL
        logger.info(f"Image uploaded: {file.filename} by user {current_user.id}")
        return {
            "url": image_result["url"], 
            "filename": file.filename,
            "azure_blob_name": image_result["blob_name"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image"
        )

@router.get("/feed", response_model=PostFeed)
async def get_post_feed(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    feed_type: str = Query("public", regex="^(public|following|trending)$")
):
    """Get post feed"""
    try:
        # Build query based on feed type
        query = {"status": PostStatus.PUBLISHED}
        
        if feed_type == "public":
            query["visibility"] = PostVisibility.PUBLIC
        elif feed_type == "following":
            # Get user's following list (mock for now)
            following_ids = []  # This would come from a following collection
            query["$or"] = [
                {"visibility": PostVisibility.PUBLIC},
                {"author_id": {"$in": following_ids}}
            ]
        elif feed_type == "trending":
            query["visibility"] = PostVisibility.PUBLIC
            # Add trending criteria (high engagement in last 24 hours)
            yesterday = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            query["created_at"] = {"$gte": yesterday}
        
        # Get total count
        total_count = await db.posts.count_documents(query)
        
        # Get posts with sorting
        sort_criteria = [("created_at", -1)]
        if feed_type == "trending":
            sort_criteria = [("likes_count", -1), ("comments_count", -1), ("created_at", -1)]
        
        cursor = db.posts.find(query).sort(sort_criteria).skip(offset).limit(limit)
        
        posts = []
        async for post_doc in cursor:
            post = await format_post_response(db, post_doc, current_user.id)
            posts.append(post)
        
        has_more = (offset + limit) < total_count
        
        return PostFeed(
            posts=posts,
            total_count=total_count,
            has_more=has_more,
            next_cursor=str(offset + limit) if has_more else None
        )
        
    except Exception as e:
        logger.error(f"Error fetching post feed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch posts"
        )

@router.get("/search", response_model=PostFeed)
async def search_posts(
    current_user: User = Depends(get_current_user),
    db = Depends(get_database),
    q: Optional[str] = Query(None),
    hashtags: Optional[str] = Query(None),  # Comma-separated
    author_id: Optional[str] = Query(None),
    post_type: Optional[PostType] = Query(None),
    location: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0)
):
    """Search posts"""
    try:
        query = {"status": PostStatus.PUBLISHED, "visibility": PostVisibility.PUBLIC}
        
        # Text search
        if q:
            query["$or"] = [
                {"content": {"$regex": q, "$options": "i"}},
                {"title": {"$regex": q, "$options": "i"}}
            ]
        
        # Hashtag search
        if hashtags:
            hashtag_list = [f"#{tag.strip().lower()}" for tag in hashtags.split(",")]
            query["hashtags"] = {"$in": hashtag_list}
        
        # Author filter
        if author_id and ObjectId.is_valid(author_id):
            query["author_id"] = ObjectId(author_id)
        
        # Post type filter
        if post_type:
            query["post_type"] = post_type
        
        # Location filter
        if location:
            query["location"] = {"$regex": location, "$options": "i"}
        
        # Get total count
        total_count = await db.posts.count_documents(query)
        
        # Sort configuration
        sort_direction = -1 if sort_order == "desc" else 1
        sort_criteria = [(sort_by, sort_direction)]
        
        # Get posts
        cursor = db.posts.find(query).sort(sort_criteria).skip(offset).limit(limit)
        
        posts = []
        async for post_doc in cursor:
            post = await format_post_response(db, post_doc, current_user.id)
            posts.append(post)
        
        has_more = (offset + limit) < total_count
        
        return PostFeed(
            posts=posts,
            total_count=total_count,
            has_more=has_more,
            next_cursor=str(offset + limit) if has_more else None
        )
        
    except Exception as e:
        logger.error(f"Error searching posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search posts"
        )

@router.get("/hashtags/trending", response_model=List[HashtagStats])
async def get_trending_hashtags(
    db = Depends(get_database),
    limit: int = Query(10, le=50)
):
    """Get trending hashtags"""
    try:
        # Aggregate hashtag usage in the last 7 days
        seven_days_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        seven_days_ago = seven_days_ago.replace(day=seven_days_ago.day - 7)
        
        pipeline = [
            {
                "$match": {
                    "status": PostStatus.PUBLISHED,
                    "visibility": PostVisibility.PUBLIC,
                    "created_at": {"$gte": seven_days_ago}
                }
            },
            {"$unwind": "$hashtags"},
            {
                "$group": {
                    "_id": "$hashtags",
                    "post_count": {"$sum": 1},
                    "recent_posts": {"$push": {"$toString": "$_id"}}
                }
            },
            {"$sort": {"post_count": -1}},
            {"$limit": limit}
        ]
        
        trending = []
        async for result in db.posts.aggregate(pipeline):
            hashtag_stat = HashtagStats(
                hashtag=result["_id"],
                post_count=result["post_count"],
                recent_posts=result["recent_posts"][:5],  # Limit to 5 recent posts
                trending_score=result["post_count"] * 1.0  # Simple scoring
            )
            trending.append(hashtag_stat)
        
        return trending
        
    except Exception as e:
        logger.error(f"Error fetching trending hashtags: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch trending hashtags"
        )

@router.get("/{post_id}", response_model=Post)
async def get_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific post"""
    try:
        if not ObjectId.is_valid(post_id):
            raise HTTPException(status_code=400, detail="Invalid post ID")
        
        post_doc = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not post_doc:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check visibility permissions
        if post_doc["visibility"] != PostVisibility.PUBLIC:
            if str(post_doc["author_id"]) != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied")
        
        # Increment view count
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"views_count": 1}}
        )
        post_doc["views_count"] += 1
        
        post = await format_post_response(db, post_doc, current_user.id)
        return post
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch post"
        )

@router.put("/{post_id}", response_model=Post)
async def update_post(
    post_id: str,
    post_update: PostUpdate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a post"""
    try:
        if not ObjectId.is_valid(post_id):
            raise HTTPException(status_code=400, detail="Invalid post ID")
        
        post_doc = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not post_doc:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check ownership
        if str(post_doc["author_id"]) != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this post")
        
        # Prepare update data
        update_data = {}
        for field, value in post_update.dict(exclude_unset=True).items():
            if field == "hashtags" and value is not None:
                # Process hashtags
                hashtags = []
                for tag in value:
                    tag = tag.strip()
                    if not tag.startswith('#'):
                        tag = '#' + tag
                    hashtags.append(tag.lower())
                update_data[field] = hashtags
            else:
                update_data[field] = value
        
        update_data["updated_at"] = datetime.utcnow()
        
        # Update post
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$set": update_data}
        )
        
        # Get updated post
        updated_post_doc = await db.posts.find_one({"_id": ObjectId(post_id)})
        post = await format_post_response(db, updated_post_doc, current_user.id)
        
        logger.info(f"Post updated: {post_id} by user {current_user.id}")
        return post
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update post"
        )

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a post"""
    try:
        if not ObjectId.is_valid(post_id):
            raise HTTPException(status_code=400, detail="Invalid post ID")
        
        post_doc = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not post_doc:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check ownership or admin permission
        if str(post_doc["author_id"]) != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        
        # Soft delete by updating status
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$set": {"status": PostStatus.REMOVED, "updated_at": datetime.utcnow()}}
        )
        
        logger.info(f"Post deleted: {post_id} by user {current_user.id}")
        return {"message": "Post deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete post"
        )

@router.post("/{post_id}/like")
async def like_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Like/unlike a post"""
    try:
        if not ObjectId.is_valid(post_id):
            raise HTTPException(status_code=400, detail="Invalid post ID")
        
        post_doc = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not post_doc:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if already liked
        existing_like = await db.post_likes.find_one({
            "post_id": ObjectId(post_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if existing_like:
            # Unlike
            await db.post_likes.delete_one({"_id": existing_like["_id"]})
            await db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"likes_count": -1}}
            )
            liked = False
        else:
            # Like
            like_doc = {
                "post_id": ObjectId(post_id),
                "user_id": ObjectId(current_user.id),
                "created_at": datetime.utcnow()
            }
            await db.post_likes.insert_one(like_doc)
            await db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"likes_count": 1}}
            )
            liked = True
        
        # Get updated likes count
        updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
        
        return {
            "liked": liked,
            "likes_count": updated_post["likes_count"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error liking post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to like post"
        )

@router.post("/{post_id}/bookmark")
async def bookmark_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Bookmark/unbookmark a post"""
    try:
        if not ObjectId.is_valid(post_id):
            raise HTTPException(status_code=400, detail="Invalid post ID")
        
        post_doc = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not post_doc:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if already bookmarked
        existing_bookmark = await db.post_bookmarks.find_one({
            "post_id": ObjectId(post_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if existing_bookmark:
            # Remove bookmark
            await db.post_bookmarks.delete_one({"_id": existing_bookmark["_id"]})
            bookmarked = False
        else:
            # Add bookmark
            bookmark_doc = {
                "post_id": ObjectId(post_id),
                "user_id": ObjectId(current_user.id),
                "created_at": datetime.utcnow()
            }
            await db.post_bookmarks.insert_one(bookmark_doc)
            bookmarked = True
        
        return {"bookmarked": bookmarked}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error bookmarking post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bookmark post"
        )

async def format_post_response(db, post_doc, current_user_id: str) -> Post:
    """Format post document for API response"""
    # Get author information
    author = await db.users.find_one({"_id": post_doc["author_id"]})
    author_name = author.get("full_name", "Anonymous") if author else "Unknown"
    author_avatar = author.get("avatar_url") if author else None
    
    # Check user interactions
    user_liked = await db.post_likes.find_one({
        "post_id": post_doc["_id"],
        "user_id": ObjectId(current_user_id)
    }) is not None
    
    user_bookmarked = await db.post_bookmarks.find_one({
        "post_id": post_doc["_id"],
        "user_id": ObjectId(current_user_id)
    }) is not None
    
    return Post(
        id=str(post_doc["_id"]),
        author_id=str(post_doc["author_id"]),
        author_name=author_name if not post_doc.get("is_anonymous", False) else "Anonymous",
        author_avatar=author_avatar if not post_doc.get("is_anonymous", False) else None,
        title=post_doc.get("title"),
        content=post_doc["content"],
        post_type=post_doc["post_type"],
        image_url=post_doc.get("image_url"),
        image_alt_text=post_doc.get("image_alt_text"),
        video_url=post_doc.get("video_url"),
        link_url=post_doc.get("link_url"),
        link_title=post_doc.get("link_title"),
        link_description=post_doc.get("link_description"),
        hashtags=post_doc.get("hashtags", []),
        mentions=[str(mention) for mention in post_doc.get("mentions", [])],
        visibility=post_doc["visibility"],
        allow_comments=post_doc["allow_comments"],
        allow_shares=post_doc["allow_shares"],
        is_anonymous=post_doc.get("is_anonymous", False),
        location=post_doc.get("location"),
        status=post_doc["status"],
        likes_count=post_doc.get("likes_count", 0),
        comments_count=post_doc.get("comments_count", 0),
        shares_count=post_doc.get("shares_count", 0),
        views_count=post_doc.get("views_count", 0),
        user_liked=user_liked,
        user_shared=False,  # TODO: Implement shares tracking
        user_bookmarked=user_bookmarked,
        created_at=post_doc["created_at"],
        updated_at=post_doc["updated_at"],
        published_at=post_doc.get("published_at")
    )

async def update_hashtag_stats(db, hashtags: List[str]):
    """Update hashtag statistics"""
    for hashtag in hashtags:
        await db.hashtag_stats.update_one(
            {"hashtag": hashtag},
            {
                "$inc": {"post_count": 1},
                "$set": {"last_used": datetime.utcnow()}
            },
            upsert=True
        )