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

        # Run the date fields backfill
        date_update_count = await backfill_date_fields()

        return update_count
    except Exception as e:
        logger.exception("Error during backfill operation")
        return 0


async def backfill_date_fields():
    """
    Add createdDate and updatedDate fields to existing stories.
    For existing stories, set both fields to the current date field value.
    Runs once at application startup.
    """
    try:
        collection = await get_collection()
        # Find stories that have a date field but no createdDate or updatedDate
        cursor = collection.find(
            {
                "date": {"$exists": True},
                "$or": [{"createdDate": {"$exists": False}}, {"updatedDate": {"$exists": False}}],
            }
        )
        update_count = 0

        async for doc in cursor:
            # Use the existing date field for both createdDate and updatedDate
            result = await collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {"createdDate": doc.get("date"), "updatedDate": doc.get("date")}},
            )
            if result.modified_count:
                update_count += 1

        if update_count > 0:
            logger.info(
                f"Backfill: Updated {update_count} stories to add createdDate and updatedDate fields"
            )
        else:
            logger.info("Backfill: No stories needed date fields update")

        return update_count
    except Exception as e:
        logger.exception("Error during date fields backfill operation")
        return 0
