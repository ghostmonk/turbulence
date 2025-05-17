from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import ValidationError

from logger import logger
from database import get_collection
from decorators.auth import requires_auth
from models import PostCreate, PostResponse
from utils import find_many_and_convert, find_one_and_convert

router = APIRouter()

@router.get("/data", response_model=List[PostResponse])
# @dynamic_cached(maxsize=100, ttl=86400)
async def get_data(collection: AsyncIOMotorCollection = Depends(get_collection)):
    try:
        # Only return published posts
        query = {"is_published": True}
        sort = {"date": -1}
        
        return await find_many_and_convert(collection, query, PostResponse, sort)
    except Exception as e:
        logger.exception("Error fetching data")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching posts"
        )


@router.post("/data", response_model=PostResponse, status_code=201)
@requires_auth
async def add_data(post: PostCreate, collection: AsyncIOMotorCollection = Depends(get_collection)):
    try:
        # Create a new document with the post data and current timestamp
        document = {
            **post.model_dump(),
            "date": datetime.now(timezone.utc)
        }
        
        # Insert into database
        result = await collection.insert_one(document)
        logger.info("Inserted document with ID: %s", result.inserted_id)

        # Fetch and return the created document
        created_post = await find_one_and_convert(
            collection,
            {"_id": result.inserted_id},
            PostResponse
        )
        
        if not created_post:
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve created post"
            )
            
        return created_post
        
    except ValidationError as e:
        logger.error("Validation error: %s", str(e))
        raise HTTPException(
            status_code=400,
            detail="Invalid post data"
        )
    except Exception as e:
        logger.exception("Error adding data")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the post"
        )
