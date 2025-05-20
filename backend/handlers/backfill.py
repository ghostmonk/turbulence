from database import get_collection
from logger import logger


async def backfill_published_flag():
    """
    Set is_published=True for all existing stories that don't have this field.
    Runs once at application startup.
    """
    try:
        collection = await get_collection()
        cursor = collection.find({"is_published": {"$exists": False}})
        update_count = 0

        async for doc in cursor:
            result = await collection.update_one(
                {"_id": doc["_id"]}, {"$set": {"is_published": True}}
            )
            if result.modified_count:
                update_count += 1

        if update_count > 0:
            logger.info(f"Backfill: Updated {update_count} stories to set is_published=True")
        else:
            logger.info("Backfill: No stories needed is_published flag update")

        return update_count
    except Exception as e:
        logger.exception("Error during backfill operation")
        return 0
