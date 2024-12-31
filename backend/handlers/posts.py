from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorCollection

from logger import logger
from database import get_collection
from decorators.auth import requires_auth
from decorators.cache import dynamic_cached

router = APIRouter()

@router.get("/data")
@dynamic_cached(maxsize=100, ttl=86400)
async def get_data(collection: AsyncIOMotorCollection = Depends(get_collection)):
    try:
        cursor = collection.find().sort("date", -1)
        data = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            data.append(doc)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/data")
@requires_auth
async def add_data(request: Request, collection: AsyncIOMotorCollection = Depends(get_collection)):
    try:
        payload = await request.json()
        logger.info("Received payload: %s", payload)

        if not payload or "title" not in payload or "content" not in payload:
            logger.error("Invalid payload: %s", payload)
            raise HTTPException(status_code=400, detail="Invalid input. 'title' and 'content' are required.")

        payload["date"] = datetime.now(timezone.utc)
        result = await collection.insert_one(payload)
        logger.info("Inserted document with ID: %s", result.inserted_id)

        new_document = await collection.find_one({"_id": result.inserted_id})
        new_document["id"] = str(new_document["_id"])
        del new_document["_id"]

        return JSONResponse(content=new_document, status_code=201)
    except Exception as e:
        logger.exception("Error while processing POST /data")
        raise HTTPException(status_code=500, detail=str(e))
