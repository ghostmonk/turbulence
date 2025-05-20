from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from database import get_collection
from decorators.auth import requires_auth
from fastapi import APIRouter, Depends, HTTPException, Request
from logger import logger
from models import StoryCreate, StoryResponse
from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import ValidationError
from utils import find_many_and_convert, find_one_and_convert

router = APIRouter()


@router.get("/stories", response_model=List[StoryResponse])
# @dynamic_cached(maxsize=100, ttl=86400)
async def get_stories(collection: AsyncIOMotorCollection = Depends(get_collection)):
    try:
        # Only return published stories
        query = {"is_published": True}
        sort = {"date": -1}

        return await find_many_and_convert(collection, query, StoryResponse, sort)
    except Exception as e:
        logger.exception("Error fetching stories")
        raise HTTPException(status_code=500, detail="An error occurred while fetching stories")


@router.get("/stories/{story_id}", response_model=StoryResponse)
@requires_auth
async def get_story(
    request: Request, story_id: str, collection: AsyncIOMotorCollection = Depends(get_collection)
):
    try:
        if not ObjectId.is_valid(story_id):
            raise HTTPException(status_code=400, detail="Invalid story ID format")

        story = await find_one_and_convert(collection, {"_id": ObjectId(story_id)}, StoryResponse)

        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        return story
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching story")
        raise HTTPException(status_code=500, detail="An error occurred while fetching the story")


@router.put("/stories/{story_id}", response_model=StoryResponse)
@requires_auth
async def update_story(
    request: Request,
    story_id: str,
    story: StoryCreate,
    collection: AsyncIOMotorCollection = Depends(get_collection),
):
    try:
        if not ObjectId.is_valid(story_id):
            raise HTTPException(status_code=400, detail="Invalid story ID format")

        # Check if story exists
        existing_story = await find_one_and_convert(
            collection, {"_id": ObjectId(story_id)}, StoryResponse
        )

        if not existing_story:
            raise HTTPException(status_code=404, detail="Story not found")

        # Update the story
        update_data = {**story.model_dump(), "date": datetime.now(timezone.utc)}

        result = await collection.update_one({"_id": ObjectId(story_id)}, {"$set": update_data})

        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update story")

        # Fetch and return the updated story
        updated_story = await find_one_and_convert(
            collection, {"_id": ObjectId(story_id)}, StoryResponse
        )

        if not updated_story:
            raise HTTPException(status_code=500, detail="Failed to retrieve updated story")

        return updated_story

    except ValidationError as e:
        logger.error("Validation error: %s", str(e))
        raise HTTPException(status_code=400, detail="Invalid story data")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error updating story")
        raise HTTPException(status_code=500, detail="An error occurred while updating the story")


@router.post("/stories", response_model=StoryResponse, status_code=201)
@requires_auth
async def add_story(
    request: Request,
    story: StoryCreate,
    collection: AsyncIOMotorCollection = Depends(get_collection),
):
    try:
        # Create a new document with the story data and current timestamp
        document = {**story.model_dump(), "date": datetime.now(timezone.utc)}

        # Insert into database
        result = await collection.insert_one(document)
        logger.info("Inserted document with ID: %s", result.inserted_id)

        # Fetch and return the created document
        created_story = await find_one_and_convert(
            collection, {"_id": result.inserted_id}, StoryResponse
        )

        if not created_story:
            raise HTTPException(status_code=500, detail="Failed to retrieve created story")

        return created_story

    except ValidationError as e:
        logger.error("Validation error: %s", str(e))
        raise HTTPException(status_code=400, detail="Invalid story data")
    except Exception as e:
        logger.exception("Error adding story")
        raise HTTPException(status_code=500, detail="An error occurred while creating the story")
