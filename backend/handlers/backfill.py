from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorCollection

from logger import logger
from database import get_collection

async def backfill_published_flag(collection: AsyncIOMotorCollection = Depends(get_collection)):
    """
    Set is_published=True for all existing posts that don't have this field.
    Runs once at application startup.
    """
    try:
        # Find all posts without an is_published field
        cursor = collection.find({"is_published": {"$exists": False}})
        update_count = 0
        
        async for doc in cursor:
            # Update each post to add is_published=True
            result = await collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {"is_published": True}}
            )
            if result.modified_count:
                update_count += 1
        
        if update_count > 0:
            logger.info(f"Backfill: Updated {update_count} posts to set is_published=True")
        else:
            logger.info("Backfill: No posts needed is_published flag update")
            
        return update_count
    except Exception as e:
        logger.exception("Error during backfill operation")
        return 0 