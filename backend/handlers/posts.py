from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from database import get_collection
from decorators.auth import requires_auth
from fastapi import APIRouter, Depends, HTTPException, Request
from logger import logger
from models import PostCreate, PostResponse
from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import ValidationError
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
        raise HTTPException(status_code=500, detail="An error occurred while fetching posts")


@router.get("/data/{post_id}", response_model=PostResponse)
@requires_auth
async def get_post(
    request: Request, post_id: str, collection: AsyncIOMotorCollection = Depends(get_collection)
):
    try:
        if not ObjectId.is_valid(post_id):
            raise HTTPException(status_code=400, detail="Invalid post ID format")

        post = await find_one_and_convert(collection, {"_id": ObjectId(post_id)}, PostResponse)

        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        return post
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching post")
        raise HTTPException(status_code=500, detail="An error occurred while fetching the post")


@router.put("/data/{post_id}", response_model=PostResponse)
@requires_auth
async def update_post(
    request: Request,
    post_id: str,
    post: PostCreate,
    collection: AsyncIOMotorCollection = Depends(get_collection),
):
    try:
        if not ObjectId.is_valid(post_id):
            raise HTTPException(status_code=400, detail="Invalid post ID format")

        # Check if post exists
        existing_post = await find_one_and_convert(
            collection, {"_id": ObjectId(post_id)}, PostResponse
        )

        if not existing_post:
            raise HTTPException(status_code=404, detail="Post not found")

        # Update the post
        update_data = {**post.model_dump(), "date": datetime.now(timezone.utc)}

        result = await collection.update_one({"_id": ObjectId(post_id)}, {"$set": update_data})

        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update post")

        # Fetch and return the updated post
        updated_post = await find_one_and_convert(
            collection, {"_id": ObjectId(post_id)}, PostResponse
        )

        if not updated_post:
            raise HTTPException(status_code=500, detail="Failed to retrieve updated post")

        return updated_post

    except ValidationError as e:
        logger.error("Validation error: %s", str(e))
        raise HTTPException(status_code=400, detail="Invalid post data")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error updating post")
        raise HTTPException(status_code=500, detail="An error occurred while updating the post")


@router.post("/data", response_model=PostResponse, status_code=201)
@requires_auth
async def add_data(
    request: Request, post: PostCreate, collection: AsyncIOMotorCollection = Depends(get_collection)
):
    try:
        # Create a new document with the post data and current timestamp
        document = {**post.model_dump(), "date": datetime.now(timezone.utc)}

        # Insert into database
        result = await collection.insert_one(document)
        logger.info("Inserted document with ID: %s", result.inserted_id)

        # Fetch and return the created document
        created_post = await find_one_and_convert(
            collection, {"_id": result.inserted_id}, PostResponse
        )

        if not created_post:
            raise HTTPException(status_code=500, detail="Failed to retrieve created post")

        return created_post

    except ValidationError as e:
        logger.error("Validation error: %s", str(e))
        raise HTTPException(status_code=400, detail="Invalid post data")
    except Exception as e:
        logger.exception("Error adding data")
        raise HTTPException(status_code=500, detail="An error occurred while creating the post")
