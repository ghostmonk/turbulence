from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from pymongo.collection import Collection
from database import get_db
from decorators.cache import cached
from decorators.auth import requires_auth

router = APIRouter()

async def get_collection() -> Collection:
    db = await get_db()
    return db["posts"]

@router.get("/data")
@cached(maxsize=100, ttl=86400)
async def get_data(collection: Collection = Depends(get_collection)):
    try:
        data = list(collection.find().sort("date", -1))
        for doc in data:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/data")
@requires_auth
async def add_data(request: Request, collection: Collection = Depends(get_collection)):
    try:
        payload = await request.json()

        if not payload or "title" not in payload or "content" not in payload:
            raise HTTPException(status_code=400, detail="Invalid input. 'title' and 'content' are required.")

        payload["date"] = datetime.now(timezone.utc)

        result = collection.insert_one(payload)
        new_document = collection.find_one({"_id": result.inserted_id})
        new_document["id"] = str(new_document["_id"])
        del new_document["_id"]

        return JSONResponse(content=new_document, status_code=201)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
