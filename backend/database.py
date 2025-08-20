import asyncio
import os
from contextlib import asynccontextmanager
from typing import Optional

from logger import logger
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorCollection,
    AsyncIOMotorDatabase,
)

client: Optional[AsyncIOMotorClient] = None
_connection_lock = asyncio.Lock()


async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance with optimized connection handling"""
    global client

    if not client:
        async with _connection_lock:
            if not client:  # Double-check pattern
                await _create_client()

    db_name = os.getenv("MONGO_DB_NAME", "ghostmonk")
    return client[db_name]


async def _create_client():
    """Create MongoDB client with connection pooling and optimizations"""
    global client

    user = _get_variable("MONGO_USER")
    password = _get_variable("MONGO_PASSWORD")
    cluster = _get_variable("MONGO_CLUSTER")
    app_name = _get_variable("MONGO_APP_NAME")
    host = _get_variable("MONGO_HOST")

    # Optimized connection string with connection pooling
    mongo_uri = (
        f"mongodb+srv://{user}:{password}@{cluster}.{host}/"
        f"?retryWrites=true&w=majority&appName={app_name}"
        f"&maxPoolSize=20"  # Max connections in pool
        f"&minPoolSize=5"  # Min connections to maintain
        f"&maxIdleTimeMS=60000"  # Close connections after 1 minute idle
        f"&serverSelectionTimeoutMS=5000"  # 5 second timeout
        f"&connectTimeoutMS=10000"  # 10 second connection timeout
        f"&socketTimeoutMS=30000"  # 30 second socket timeout
        f"&heartbeatFrequencyMS=10000"  # Heartbeat every 10 seconds
    )

    try:
        client = AsyncIOMotorClient(mongo_uri)

        # Test the connection
        await client.admin.command("ping")
        logger.info("MongoDB connection established successfully")

    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise


async def get_db():
    """Legacy function for backward compatibility"""
    return await get_database()


@asynccontextmanager
async def get_database_context():
    """Context manager for database operations"""
    db = await get_database()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database operation failed: {str(e)}")
        raise
    finally:
        # Connection cleanup is handled by the client pool
        pass


async def close_db_connection():
    """Close database connection gracefully"""
    global client
    if client:
        client.close()
        client = None
        logger.info("MongoDB connection closed")


async def get_collection() -> AsyncIOMotorCollection:
    db = await get_db()
    return db["stories"]


def _get_variable(key: str) -> str:
    output = os.getenv(key)
    if not output:
        raise ValueError(f"{key} environment variable is not set.")
    return output
