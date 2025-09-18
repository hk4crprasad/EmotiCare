from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def get_database() -> AsyncIOMotorClient:
    """Get database instance"""
    return db.database

async def connect_to_mongo():
    """Create database connection"""
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db.database = db.client[settings.DATABASE_NAME]
        
        # Test the connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        # Create indexes for better performance
        await create_indexes()
        
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error connecting to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # User indexes
        await db.database.users.create_index("email", unique=True)
        
        # Drop existing student_id index if it exists and recreate with sparse option
        try:
            await db.database.users.drop_index("student_id_1")
        except Exception:
            pass  # Index doesn't exist, continue
        
        await db.database.users.create_index("student_id", unique=True, sparse=True)  # sparse=True allows multiple null values
        await db.database.users.create_index("role")
        
        # Assessment indexes
        await db.database.assessments.create_index([("user_id", 1), ("created_at", -1)])
        await db.database.assessments.create_index("assessment_type")
        
        # Appointment indexes
        await db.database.appointments.create_index([("student_id", 1), ("date", 1)])
        await db.database.appointments.create_index([("counselor_id", 1), ("date", 1)])
        await db.database.appointments.create_index("status")
        
        # Chat session indexes
        await db.database.chat_sessions.create_index([("user_id", 1), ("created_at", -1)])
        
        # Peer support indexes
        await db.database.peer_posts.create_index([("created_at", -1)])
        await db.database.peer_posts.create_index("category")
        await db.database.peer_posts.create_index("is_approved")
        
        # Resource indexes
        await db.database.resources.create_index("category")
        await db.database.resources.create_index("language")
        await db.database.resources.create_index("is_active")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
        raise e